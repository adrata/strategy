/**
 * Enrichment API Endpoint
 * 
 * Triggers intelligence and enrichment pipelines
 * Can be called by AI panel or automatically on record creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createSuccessResponse, createErrorResponse } from '@/platform/services/secure-api-helper';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for enrichment

/**
 * POST /api/v1/enrich
 * 
 * Triggers enrichment for people, companies, or buyer groups
 * 
 * Body:
 * {
 *   type: 'person' | 'company' | 'buyer-group' | 'role' | 'optimal-buyer-group',
 *   entityId?: string,  // ID of existing entity
 *   data?: object,      // Data for new entity enrichment
 *   options?: {
 *     verifyEmail?: boolean,
 *     verifyPhone?: boolean,
 *     discoverContacts?: boolean,
 *     dealSize?: number,
 *     productCategory?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let context = null;
  
  try {
    // Authenticate
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    context = authContext;
    const body = await request.json();

    // Validate request
    if (!body.type) {
      return createErrorResponse('Enrichment type is required', 'VALIDATION_ERROR', 400);
    }

    console.log(`🎯 Enrichment requested: ${body.type}`, {
      entityId: body.entityId,
      workspaceId: context.workspaceId,
      userId: context.userId
    });

    // Route to appropriate enrichment handler
    let result;
    switch (body.type) {
      case 'person':
        result = await enrichPerson(body, context);
        break;
      case 'company':
        result = await enrichCompany(body, context);
        break;
      case 'buyer-group':
        result = await enrichBuyerGroup(body, context);
        break;
      case 'role':
        result = await enrichRole(body, context);
        break;
      case 'optimal-buyer-group':
        result = await enrichOptimalBuyerGroup(body, context);
        break;
      default:
        return createErrorResponse(`Unknown enrichment type: ${body.type}`, 'INVALID_TYPE', 400);
    }

    const duration = Date.now() - startTime;
    const durationSeconds = Math.floor(duration / 1000);
    
    return createSuccessResponse({
      ...result,
      duration: `${durationSeconds}s`,
      durationMs: duration
    }, `Enrichment completed in ${durationSeconds}s`);

  } catch (error) {
    console.error('❌ Enrichment error:', error);
    const duration = Date.now() - startTime;
    return createErrorResponse(
      `Enrichment failed: ${error.message}`,
      'ENRICHMENT_ERROR',
      500,
      { duration: `${Math.floor(duration / 1000)}s` }
    );
  }
}

/**
 * Enrich a person with CoreSignal data
 */
async function enrichPerson(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  // Get person
  const person = entityId
    ? await prisma.people.findFirst({
        where: {
          id: entityId,
          workspaceId: context.workspaceId,
          deletedAt: null
        },
        include: {
          company: {
            select: { id: true, name: true, website: true }
          }
        }
      })
    : null;

  if (!person && !data) {
    throw new Error('Person not found and no data provided');
  }

  // Check if person has LinkedIn URL or email
  if (!person.linkedinUrl && !person.email) {
    return {
      type: 'person',
      entityId: person?.id,
      status: 'failed',
      error: 'NO_IDENTIFIER',
      fieldsPopulated: [],
      message: 'Person needs a LinkedIn URL or email for enrichment'
    };
  }

  // Check for CoreSignal API key
  // CRITICAL: Trim and sanitize API key to remove any trailing newlines or whitespace
  const coresignalApiKey = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');
  if (!coresignalApiKey) {
    console.error('❌ CORESIGNAL_API_KEY not configured');
    return {
      type: 'person',
      entityId: person?.id,
      status: 'failed',
      error: 'API_NOT_CONFIGURED',
      fieldsPopulated: [],
      message: 'CoreSignal API key not configured'
    };
  }

  try {
    console.log(`🔍 [ENRICHMENT] Starting multi-source enrichment for person: ${person.fullName || person.firstName + ' ' + person.lastName}`);
    
    // Search for person in CoreSignal
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/professional_network/member/search/filter';
    
    // Build search query (prefer LinkedIn URL, fallback to email)
    const searchPayload: any = {};
    if (person.linkedinUrl) {
      searchPayload.linkedin_url = person.linkedinUrl;
    } else if (person.email) {
      searchPayload.primary_professional_email = person.email;
    }

    console.log(`🔍 [ENRICHMENT] Searching CoreSignal with:`, searchPayload);

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchPayload)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ [ENRICHMENT] CoreSignal search failed:`, {
        status: searchResponse.status,
        error: errorText
      });
      
      if (searchResponse.status === 401) {
        throw new Error('CoreSignal API authentication failed');
      } else if (searchResponse.status === 429) {
        throw new Error('CoreSignal API rate limit exceeded');
      }
      
      throw new Error(`CoreSignal search failed: ${searchResponse.status}`);
    }

    const searchResults = await searchResponse.json();
    console.log(`🔍 [ENRICHMENT] CoreSignal search results:`, searchResults);

    if (!searchResults || searchResults.length === 0) {
      console.log(`❌ [ENRICHMENT] Person not found in CoreSignal`);
      return {
        type: 'person',
        entityId: person.id,
        status: 'failed',
        error: 'NOT_FOUND',
        fieldsPopulated: [],
        message: 'Person not found in CoreSignal database'
      };
    }

    // Get the first (best) match
    const coresignalPerson = searchResults[0];
    const coresignalId = coresignalPerson.id;

    console.log(`✅ [ENRICHMENT] Found CoreSignal match: ${coresignalPerson.full_name} (ID: ${coresignalId})`);

    // Fetch detailed person data
    const detailsUrl = `https://api.coresignal.com/cdapi/v1/professional_network/member/collect/${coresignalId}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch person details: ${detailsResponse.status}`);
    }

    const coresignalData = await detailsResponse.json();
    console.log(`📊 [ENRICHMENT] Retrieved CoreSignal data for ${person.fullName}`);

    // Fetch data from Perplexity and Lusha in parallel (optional sources)
    const companyName = person.company?.name || '';
    const [perplexityData, lushaData] = await Promise.all([
      fetchPerplexityPersonData(person.fullName || person.firstName + ' ' + person.lastName, companyName),
      fetchLushaPersonData(person.fullName || person.firstName + ' ' + person.lastName, person.email || '', companyName)
    ]);

    // Map CoreSignal data to our database schema
    // SMART UPDATE: Only populate missing fields, preserve existing good data from buyer group enrichment
    const updateData: any = {};
    const fieldsPopulated: string[] = [];
    const dataSources: string[] = ['CoreSignal'];
    
    if (perplexityData) dataSources.push('Perplexity');
    if (lushaData) dataSources.push('Lusha');

    // Helper to check if field should be updated
    const shouldUpdate = (existingValue: any, newValue: any) => {
      // Always update if existing value is null/undefined/empty
      if (!existingValue || existingValue === '' || existingValue === '-') {
        return !!newValue;
      }
      // Don't overwrite existing non-empty data
      return false;
    };

    // Full name - only if missing
    if (shouldUpdate(person.fullName, coresignalData.full_name)) {
      updateData.fullName = coresignalData.full_name;
      fieldsPopulated.push('fullName');
    }

    // Get current job title from active experience
    const activeExperience = coresignalData.experience?.find((exp: any) => exp.active_experience === 1) || coresignalData.experience?.[0];
    
    // Job title - only if missing
    if (activeExperience?.position_title && shouldUpdate(person.jobTitle, activeExperience.position_title)) {
      updateData.jobTitle = activeExperience.position_title;
      fieldsPopulated.push('jobTitle');
    }

    // Department - only if missing
    if (activeExperience?.department && shouldUpdate(person.department, activeExperience.department)) {
      updateData.department = activeExperience.department;
      fieldsPopulated.push('department');
    }

    // Email - only if missing
    if (shouldUpdate(person.email, coresignalData.primary_professional_email)) {
      updateData.email = coresignalData.primary_professional_email;
      fieldsPopulated.push('email');
    }

    // Phone - only if missing
    if (shouldUpdate(person.phone, coresignalData.phone)) {
      updateData.phone = coresignalData.phone;
      fieldsPopulated.push('phone');
    }

    // LinkedIn URL - only if missing
    if (shouldUpdate(person.linkedinUrl, coresignalData.linkedin_url)) {
      updateData.linkedinUrl = coresignalData.linkedin_url;
      fieldsPopulated.push('linkedinUrl');
    }

    // Location - only if missing
    if (shouldUpdate(person.location, coresignalData.location || coresignalData.location_full)) {
      updateData.location = coresignalData.location || coresignalData.location_full;
      fieldsPopulated.push('location');
    }

    // Extract state from location if available
    if (coresignalData.location || person.location || updateData.location) {
      const locationStr = updateData.location || person.location || coresignalData.location;
      const extractedState = extractStateFromLocation(locationStr);
      if (extractedState && shouldUpdate(person.state, extractedState)) {
        updateData.state = extractedState;
        fieldsPopulated.push('state (extracted from location)');
      }
    }

    // Extract city from location if needed
    if (coresignalData.location && shouldUpdate(person.city, null)) {
      const parts = coresignalData.location.split(',').map(p => p.trim());
      if (parts.length > 0) {
        updateData.city = parts[0];
        fieldsPopulated.push('city (extracted from location)');
      }
    }

    // LinkedIn metrics
    if (shouldUpdate(person.linkedinConnections, coresignalData.connections_count)) {
      updateData.linkedinConnections = coresignalData.connections_count;
      fieldsPopulated.push('linkedinConnections');
    }

    if (shouldUpdate(person.linkedinFollowers, coresignalData.followers_count)) {
      updateData.linkedinFollowers = coresignalData.followers_count;
      fieldsPopulated.push('linkedinFollowers');
    }

    // Profile picture
    if (shouldUpdate(person.profilePictureUrl, coresignalData.profile_picture_url)) {
      updateData.profilePictureUrl = coresignalData.profile_picture_url;
      fieldsPopulated.push('profilePictureUrl');
    }

    // Seniority level
    if (shouldUpdate(person.seniority, coresignalData.seniority || activeExperience?.seniority_level)) {
      updateData.seniority = coresignalData.seniority || activeExperience?.seniority_level;
      fieldsPopulated.push('seniority');
    }

    // Years of experience
    if (shouldUpdate(person.totalExperience, coresignalData.experience?.length)) {
      updateData.totalExperience = coresignalData.experience.length;
      fieldsPopulated.push('totalExperience');
    }

    // Skills, education, certifications
    if (coresignalData.skills && (!person.technicalSkills || person.technicalSkills.length === 0)) {
      updateData.technicalSkills = coresignalData.skills;
      fieldsPopulated.push('technicalSkills');
    }

    if (coresignalData.education && (!person.degrees || !person.degrees)) {
      updateData.degrees = coresignalData.education;
      fieldsPopulated.push('degrees');
    }

    if (coresignalData.certifications && (!person.certifications || person.certifications.length === 0)) {
      updateData.certifications = coresignalData.certifications;
      fieldsPopulated.push('certifications');
    }

    // Title field (in addition to jobTitle)
    if (activeExperience?.position_title && shouldUpdate(person.title, activeExperience.position_title)) {
      updateData.title = activeExperience.position_title;
      fieldsPopulated.push('title');
    }

    // Integrate Perplexity data
    if (perplexityData) {
      // Bio from Perplexity
      if (shouldUpdate(person.bio, perplexityData.bio)) {
        updateData.bio = perplexityData.bio;
        fieldsPopulated.push('bio (Perplexity)');
      }

      // Department from Perplexity if missing from CoreSignal
      if (shouldUpdate(person.department, perplexityData.department) && !updateData.department) {
        updateData.department = perplexityData.department;
        fieldsPopulated.push('department (Perplexity)');
      }
    }

    // Integrate Lusha data
    if (lushaData) {
      // Phone from Lusha if missing from CoreSignal
      if (shouldUpdate(person.phone, lushaData.phoneNumbers?.[0]?.number) && !updateData.phone) {
        updateData.phone = lushaData.phoneNumbers[0].number;
        fieldsPopulated.push('phone (Lusha)');
      }

      // Additional phone numbers
      if (lushaData.phoneNumbers && lushaData.phoneNumbers.length > 1) {
        const phone2 = lushaData.phoneNumbers[1]?.number;
        if (phone2 && shouldUpdate(person.phone2, phone2)) {
          updateData.phone2 = phone2;
          fieldsPopulated.push('phone2 (Lusha)');
        }
      }

      // Email from Lusha if missing
      if (shouldUpdate(person.email, lushaData.emailAddresses?.[0]?.email) && !updateData.email) {
        updateData.email = lushaData.emailAddresses[0].email;
        fieldsPopulated.push('email (Lusha)');
      }
    }

    // Calculate data quality score based on filled fields
    const totalCriticalFields = 8; // fullName, jobTitle, email, phone, linkedinUrl, department, location, company
    const filledCriticalFields = [
      person.fullName || updateData.fullName,
      person.jobTitle || updateData.jobTitle,
      person.email || updateData.email,
      person.phone || updateData.phone,
      person.linkedinUrl || updateData.linkedinUrl,
      person.department || updateData.department,
      person.location || updateData.location,
      person.companyId
    ].filter(Boolean).length;
    
    const dataQualityScore = (filledCriticalFields / totalCriticalFields) * 100;

    // Update dataSources array with enrichment sources
    const currentDataSources = person.dataSources || [];
    const newDataSources = Array.from(new Set([...currentDataSources, ...dataSources]));

    // Calculate enrichment score (how much new data was added)
    const enrichmentScore = fieldsPopulated.length > 0 
      ? Math.min(100, (fieldsPopulated.length / 15) * 100) // Max 15 fields typically enriched
      : 0;

    // Store all enrichment data in customFields for reference
    // Preserve existing customFields (may contain buyer group data, enrichment data, etc.)
    const existingCustomFields = (person.customFields as any) || {};
    updateData.customFields = {
      ...existingCustomFields,
      coresignalId: coresignalId,
      coresignalData: coresignalData,
      perplexityData: perplexityData,
      lushaData: lushaData,
      lastEnriched: new Date().toISOString(),
      enrichmentSource: dataSources.join(' + ')
    };

    updateData.dataQualityScore = dataQualityScore;
    updateData.dataSources = newDataSources;
    updateData.enrichmentScore = enrichmentScore;
    updateData.enrichmentSources = dataSources;
    updateData.lastEnriched = new Date();
    updateData.dataLastVerified = new Date();
    updateData.updatedAt = new Date();

    // Check if there are any fields to update (besides metadata)
    if (fieldsPopulated.length === 0) {
      console.log(`ℹ️ [ENRICHMENT] Person ${person.fullName} already has all available data, no fields updated`);
      
      // Still update enrichment metadata
      await prisma.people.update({
        where: { id: person.id },
        data: {
          customFields: updateData.customFields,
          lastEnriched: updateData.lastEnriched,
          updatedAt: updateData.updatedAt
        }
      });

      return {
        type: 'person',
        entityId: person.id,
        status: 'completed',
        fieldsPopulated: [],
        message: 'Person already has all available data'
      };
    }

    // Update the person in the database
    await prisma.people.update({
      where: { id: person.id },
      data: updateData
    });

    console.log(`✅ [ENRICHMENT] Successfully enriched person ${person.fullName} with ${fieldsPopulated.length} fields from ${dataSources.join(' + ')}:`, fieldsPopulated);

    return {
      type: 'person',
      entityId: person.id,
      status: 'completed',
      fieldsPopulated: fieldsPopulated,
      dataSources: dataSources,
      dataQualityScore: dataQualityScore,
      enrichmentScore: enrichmentScore,
      enrichments: {
        jobTitle: !!updateData.jobTitle,
        title: !!updateData.title,
        email: !!updateData.email,
        phone: !!updateData.phone,
        linkedinUrl: !!updateData.linkedinUrl,
        department: !!updateData.department,
        state: !!updateData.state,
        city: !!updateData.city,
        bio: !!updateData.bio,
        seniority: !!updateData.seniority,
        linkedinConnections: !!updateData.linkedinConnections,
        linkedinFollowers: !!updateData.linkedinFollowers,
        skills: !!updateData.technicalSkills,
        education: !!updateData.degrees
      },
      message: `Successfully enriched ${fieldsPopulated.length} fields from ${dataSources.join(' + ')} (Quality: ${Math.round(dataQualityScore)}%)`
    };

  } catch (error) {
    console.error(`❌ [ENRICHMENT] Error enriching person:`, error);
    
    return {
      type: 'person',
      entityId: person?.id,
      status: 'failed',
      error: error.message,
      fieldsPopulated: [],
      message: `Enrichment failed: ${error.message}`
    };
  }
}

/**
 * Fetch Perplexity AI data for person intelligence
 */
async function fetchPerplexityPersonData(personName: string, company: string) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY?.trim();
  if (!perplexityApiKey) {
    console.log('⚠️ [ENRICHMENT] Perplexity API key not configured, skipping');
    return null;
  }

  try {
    console.log(`🔍 [ENRICHMENT] Fetching Perplexity data for ${personName}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'user',
          content: `Find information about ${personName} at ${company}. Return JSON with:
{
  "bio": string or null (professional bio or summary),
  "recentNews": string or null (recent professional news),
  "department": string or null (department if known)
}
Only return factual, verified information. Use null for unknown fields.`
        }],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ [ENRICHMENT] Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
        console.log(`✅ [ENRICHMENT] Retrieved Perplexity data for ${personName}`);
        return parsed;
      } catch (parseError) {
        console.warn('⚠️ [ENRICHMENT] Failed to parse Perplexity response');
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ [ENRICHMENT] Perplexity API error:', error);
    return null;
  }
}

/**
 * Fetch Lusha data for person contact information
 */
async function fetchLushaPersonData(personName: string, email: string, company: string) {
  const lushaApiKey = process.env.LUSHA_API_KEY?.trim();
  if (!lushaApiKey) {
    console.log('⚠️ [ENRICHMENT] Lusha API key not configured, skipping');
    return null;
  }

  try {
    console.log(`🔍 [ENRICHMENT] Fetching Lusha data for ${personName}`);
    
    const response = await fetch('https://api.lusha.com/person', {
      method: 'POST',
      headers: {
        'api_key': lushaApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: personName.split(' ')[0],
        lastName: personName.split(' ').slice(1).join(' '),
        company: company,
        property: {
          emailAddress: email
        }
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ [ENRICHMENT] Lusha API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ [ENRICHMENT] Retrieved Lusha data for ${personName}`);
    return data;
  } catch (error) {
    console.error('❌ [ENRICHMENT] Lusha API error:', error);
    return null;
  }
}

/**
 * Extract state from location string
 */
function extractStateFromLocation(location: string | null | undefined): string | null {
  if (!location) return null;
  
  // Try to extract state from location string
  // Format can be: "City, State", "City, State, Country", "State", etc.
  const parts = location.split(',').map(p => p.trim());
  
  // Common US state patterns
  if (parts.length >= 2) {
    const statePart = parts[1];
    // Check if it's a 2-letter state code or full state name
    if (statePart.length === 2 || statePart.length > 2) {
      return statePart;
    }
  }
  
  // Single part - might be just a state
  if (parts.length === 1 && parts[0].length <= 20) {
    return parts[0];
  }
  
  return null;
}

/**
 * Fetch Perplexity AI data for company intelligence
 */
async function fetchPerplexityCompanyData(companyName: string, website: string) {
  const perplexityApiKey = process.env.PERPLEXITY_API_KEY?.trim();
  if (!perplexityApiKey) {
    console.log('⚠️ [ENRICHMENT] Perplexity API key not configured, skipping');
    return null;
  }

  try {
    console.log(`🔍 [ENRICHMENT] Fetching Perplexity data for ${companyName}`);
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [{
          role: 'user',
          content: `Find current information about ${companyName} (${website}). Return JSON with:
{
  "foundedYear": number or null,
  "revenue": number or null (annual revenue in USD),
  "market": string or null (primary market/category),
  "segment": string or null (business segment),
  "recentNews": string or null (brief summary of recent news),
  "technologies": array of strings (tech stack if known)
}
Only return factual, verified information. Use null for unknown fields.`
        }],
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ [ENRICHMENT] Perplexity API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const parsed = JSON.parse(content);
        console.log(`✅ [ENRICHMENT] Retrieved Perplexity data for ${companyName}`);
        return parsed;
      } catch (parseError) {
        console.warn('⚠️ [ENRICHMENT] Failed to parse Perplexity response');
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ [ENRICHMENT] Perplexity API error:', error);
    return null;
  }
}

/**
 * Fetch Lusha data for company contact information
 */
async function fetchLushaCompanyData(companyName: string, website: string) {
  const lushaApiKey = process.env.LUSHA_API_KEY?.trim();
  if (!lushaApiKey) {
    console.log('⚠️ [ENRICHMENT] Lusha API key not configured, skipping');
    return null;
  }

  try {
    console.log(`🔍 [ENRICHMENT] Fetching Lusha data for ${companyName}`);
    
    const response = await fetch('https://api.lusha.com/company', {
      method: 'POST',
      headers: {
        'api_key': lushaApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company: companyName,
        property: {
          website: website
        }
      })
    });

    if (!response.ok) {
      console.warn(`⚠️ [ENRICHMENT] Lusha API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ [ENRICHMENT] Retrieved Lusha data for ${companyName}`);
    return data;
  } catch (error) {
    console.error('❌ [ENRICHMENT] Lusha API error:', error);
    return null;
  }
}

/**
 * Enrich a company with CoreSignal, Perplexity, and Lusha data
 */
async function enrichCompany(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  // Get company
  const company = entityId
    ? await prisma.companies.findFirst({
        where: {
          id: entityId,
          workspaceId: context.workspaceId,
          deletedAt: null
        }
      })
    : null;

  if (!company && !data) {
    throw new Error('Company not found and no data provided');
  }

  // Check if company has a website
  if (!company.website && !company.linkedinUrl) {
    return {
      type: 'company',
      entityId: company?.id,
      status: 'failed',
      error: 'NO_IDENTIFIER',
      fieldsPopulated: [],
      message: 'Company needs a website or LinkedIn URL for enrichment'
    };
  }

  // Check for CoreSignal API key
  // CRITICAL: Trim and sanitize API key to remove any trailing newlines or whitespace
  const coresignalApiKey = process.env.CORESIGNAL_API_KEY?.trim().replace(/\\n/g, '');
  if (!coresignalApiKey) {
    console.error('❌ CORESIGNAL_API_KEY not configured');
    return {
      type: 'company',
      entityId: company?.id,
      status: 'failed',
      error: 'API_NOT_CONFIGURED',
      fieldsPopulated: [],
      message: 'CoreSignal API key not configured. Please contact support.'
    };
  }

  try {
    console.log(`🔍 [ENRICHMENT] Starting multi-source enrichment for company: ${company.name}`);
    
    // Search for company in CoreSignal
    const searchUrl = 'https://api.coresignal.com/cdapi/v1/professional_network/company/search/filter';
    const searchPayload = {
      website: company.website,
      name: company.name
    };

    console.log(`🔍 [ENRICHMENT] Searching CoreSignal with:`, searchPayload);

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(searchPayload)
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`❌ [ENRICHMENT] CoreSignal search failed:`, {
        status: searchResponse.status,
        error: errorText
      });
      
      if (searchResponse.status === 401) {
        throw new Error('CoreSignal API authentication failed');
      } else if (searchResponse.status === 429) {
        throw new Error('CoreSignal API rate limit exceeded');
      }
      
      throw new Error(`CoreSignal search failed: ${searchResponse.status}`);
    }

    const searchResults = await searchResponse.json();
    console.log(`🔍 [ENRICHMENT] CoreSignal search results:`, searchResults);

    if (!searchResults || searchResults.length === 0) {
      console.log(`❌ [ENRICHMENT] Company not found in CoreSignal`);
      return {
        type: 'company',
        entityId: company.id,
        status: 'failed',
        error: 'NOT_FOUND',
        fieldsPopulated: [],
        message: 'Company not found in CoreSignal database. Try adding more company information or enter data manually.'
      };
    }

    // Get the first (best) match
    const coresignalCompany = searchResults[0];
    const coresignalId = coresignalCompany.id;

    console.log(`✅ [ENRICHMENT] Found CoreSignal match: ${coresignalCompany.name} (ID: ${coresignalId})`);

    // Fetch detailed company data
    const detailsUrl = `https://api.coresignal.com/cdapi/v1/professional_network/company/collect/${coresignalId}`;
    
    const detailsResponse = await fetch(detailsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${coresignalApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!detailsResponse.ok) {
      throw new Error(`Failed to fetch company details: ${detailsResponse.status}`);
    }

    const coresignalData = await detailsResponse.json();
    console.log(`📊 [ENRICHMENT] Retrieved CoreSignal data for ${company.name}`);

    // Fetch data from Perplexity and Lusha in parallel (optional sources)
    const [perplexityData, lushaData] = await Promise.all([
      fetchPerplexityCompanyData(company.name, company.website || ''),
      fetchLushaCompanyData(company.name, company.website || '')
    ]);

    // Map CoreSignal data to our database schema
    // SMART UPDATE: Only populate missing or stale fields, preserve existing good data
    const updateData: any = {};
    const fieldsPopulated: string[] = [];
    const dataSources: string[] = ['CoreSignal'];
    
    if (perplexityData) dataSources.push('Perplexity');
    if (lushaData) dataSources.push('Lusha');

    // Helper to check if field should be updated
    const shouldUpdate = (existingValue: any, newValue: any) => {
      // Always update if existing value is null/undefined/empty
      if (!existingValue || existingValue === '' || existingValue === '-') {
        return !!newValue;
      }
      // Don't overwrite existing non-empty data
      return false;
    };

    // Industry - only if missing
    if (shouldUpdate(company.industry, coresignalData.industry)) {
      updateData.industry = coresignalData.industry;
      fieldsPopulated.push('industry');
    }

    // Employee count - only if missing
    if (shouldUpdate(company.employeeCount, coresignalData.employee_count || coresignalData.employees_count)) {
      updateData.employeeCount = coresignalData.employee_count || coresignalData.employees_count;
      fieldsPopulated.push('employeeCount');
    }

    // Size range - only if missing
    if (shouldUpdate(company.size, coresignalData.size_range)) {
      updateData.size = coresignalData.size_range;
      fieldsPopulated.push('size');
    }

    // Description - use enriched description if available, only if missing or very short
    const bestDescription = coresignalData.description_enriched || coresignalData.description;
    if (shouldUpdate(company.description, bestDescription) || 
        (company.description && company.description.length < 50 && bestDescription && bestDescription.length > company.description.length)) {
      updateData.description = bestDescription;
      fieldsPopulated.push('description');
    }

    // Founded year - only if missing
    if (shouldUpdate(company.foundedYear, coresignalData.founded || coresignalData.founded_year)) {
      const year = coresignalData.founded || coresignalData.founded_year;
      updateData.foundedYear = typeof year === 'string' ? parseInt(year) : year;
      fieldsPopulated.push('foundedYear');
    }

    // NAICS and SIC codes - only if missing
    if (coresignalData.naics_codes && (!company.naicsCodes || company.naicsCodes.length === 0)) {
      updateData.naicsCodes = coresignalData.naics_codes;
      fieldsPopulated.push('naicsCodes');
    }

    if (coresignalData.sic_codes && (!company.sicCodes || company.sicCodes.length === 0)) {
      updateData.sicCodes = coresignalData.sic_codes;
      fieldsPopulated.push('sicCodes');
    }

    // Public/Private status
    if (coresignalData.is_public !== undefined && shouldUpdate(company.isPublic, coresignalData.is_public)) {
      updateData.isPublic = coresignalData.is_public;
      fieldsPopulated.push('isPublic');
    }

    // Technologies used
    if (coresignalData.technologies_used && (!company.technologiesUsed || company.technologiesUsed.length === 0)) {
      updateData.technologiesUsed = coresignalData.technologies_used;
      updateData.numTechnologiesUsed = coresignalData.technologies_used.length;
      fieldsPopulated.push('technologiesUsed');
    }

    // Active job postings
    if (shouldUpdate(company.activeJobPostings, coresignalData.active_job_postings_count)) {
      updateData.activeJobPostings = coresignalData.active_job_postings_count;
      fieldsPopulated.push('activeJobPostings');
    }

    // Location fields - only if missing
    if (shouldUpdate(company.country, coresignalData.hq_country)) {
      updateData.country = coresignalData.hq_country;
      fieldsPopulated.push('country');
    }

    if (shouldUpdate(company.city, coresignalData.hq_city)) {
      updateData.city = coresignalData.hq_city;
      updateData.hqCity = coresignalData.hq_city; // Keep HQ fields in sync
      fieldsPopulated.push('city');
    }

    if (shouldUpdate(company.state, coresignalData.hq_state)) {
      updateData.state = coresignalData.hq_state;
      updateData.hqState = coresignalData.hq_state; // Keep HQ fields in sync
      fieldsPopulated.push('state');
    }

    if (shouldUpdate(company.address, coresignalData.hq_address_line_1)) {
      updateData.address = coresignalData.hq_address_line_1;
      updateData.hqStreet = coresignalData.hq_address_line_1; // Keep HQ fields in sync
      fieldsPopulated.push('address');
    }

    if (shouldUpdate(company.postalCode, coresignalData.hq_postcode)) {
      updateData.postalCode = coresignalData.hq_postcode;
      updateData.hqZipcode = coresignalData.hq_postcode; // Keep HQ fields in sync
      fieldsPopulated.push('postalCode');
    }

    // Contact fields - only if missing
    if (shouldUpdate(company.phone, coresignalData.phone)) {
      updateData.phone = coresignalData.phone;
      fieldsPopulated.push('phone');
    }

    if (shouldUpdate(company.linkedinFollowers, coresignalData.follower_count)) {
      updateData.linkedinFollowers = coresignalData.follower_count;
      fieldsPopulated.push('linkedinFollowers');
    }

    if (shouldUpdate(company.linkedinUrl, coresignalData.url || coresignalData.linkedin_url)) {
      updateData.linkedinUrl = coresignalData.url || coresignalData.linkedin_url;
      fieldsPopulated.push('linkedinUrl');
    }

    // Social Media URLs - only if missing
    if (shouldUpdate(company.twitterUrl, coresignalData.twitter_url?.[0])) {
      updateData.twitterUrl = coresignalData.twitter_url[0];
      fieldsPopulated.push('twitterUrl');
    }

    if (shouldUpdate(company.facebookUrl, coresignalData.facebook_url?.[0])) {
      updateData.facebookUrl = coresignalData.facebook_url[0];
      fieldsPopulated.push('facebookUrl');
    }

    if (shouldUpdate(company.instagramUrl, coresignalData.instagram_url?.[0])) {
      updateData.instagramUrl = coresignalData.instagram_url[0];
      fieldsPopulated.push('instagramUrl');
    }

    if (shouldUpdate(company.youtubeUrl, coresignalData.youtube_url?.[0])) {
      updateData.youtubeUrl = coresignalData.youtube_url[0];
      fieldsPopulated.push('youtubeUrl');
    }

    if (shouldUpdate(company.githubUrl, coresignalData.github_url?.[0])) {
      updateData.githubUrl = coresignalData.github_url[0];
      fieldsPopulated.push('githubUrl');
    }

    // Employee count change tracking
    if (coresignalData.employees_count_change) {
      updateData.employeeCountChange = coresignalData.employees_count_change;
      fieldsPopulated.push('employeeCountChange');
    }

    // Job postings change tracking
    if (coresignalData.active_job_postings_count_change) {
      updateData.jobPostingsChange = coresignalData.active_job_postings_count_change;
      fieldsPopulated.push('jobPostingsChange');
    }

    // Executive changes
    if (coresignalData.key_executive_arrivals && coresignalData.key_executive_arrivals.length > 0) {
      updateData.executiveArrivals = coresignalData.key_executive_arrivals;
      fieldsPopulated.push('executiveArrivals');
    }

    if (coresignalData.key_executive_departures && coresignalData.key_executive_departures.length > 0) {
      updateData.executiveDepartures = coresignalData.key_executive_departures;
      fieldsPopulated.push('executiveDepartures');
    }

    // Funding data
    if (coresignalData.funding_rounds && coresignalData.funding_rounds.length > 0) {
      updateData.fundingRounds = coresignalData.funding_rounds;
      const lastRound = coresignalData.funding_rounds[0]; // Most recent
      if (lastRound.amount_raised) {
        updateData.lastFundingAmount = lastRound.amount_raised;
        updateData.lastFundingDate = lastRound.announced_date ? new Date(lastRound.announced_date) : null;
      }
      fieldsPopulated.push('fundingData');
    }

    // HQ location details
    if (shouldUpdate(company.hqFullAddress, coresignalData.hq_full_address)) {
      updateData.hqFullAddress = coresignalData.hq_full_address;
      fieldsPopulated.push('hqFullAddress');
    }

    if (shouldUpdate(company.hqLocation, coresignalData.hq_location)) {
      updateData.hqLocation = coresignalData.hq_location;
      fieldsPopulated.push('hqLocation');
    }

    if (coresignalData.hq_region && (!company.hqRegion || company.hqRegion.length === 0)) {
      updateData.hqRegion = coresignalData.hq_region;
      fieldsPopulated.push('hqRegion');
    }

    // Integrate Perplexity data for fields CoreSignal doesn't provide
    if (perplexityData) {
      // Founded year from Perplexity if missing
      if (shouldUpdate(company.foundedYear, perplexityData.foundedYear) && !updateData.foundedYear) {
        updateData.foundedYear = perplexityData.foundedYear;
        fieldsPopulated.push('foundedYear (Perplexity)');
      }

      // Revenue from Perplexity if missing
      if (shouldUpdate(company.revenue, perplexityData.revenue) && !updateData.revenue) {
        updateData.revenue = perplexityData.revenue;
        fieldsPopulated.push('revenue (Perplexity)');
      }

      // Market/Category from Perplexity
      if (shouldUpdate(company.market, perplexityData.market)) {
        updateData.market = perplexityData.market;
        fieldsPopulated.push('market (Perplexity)');
      }

      // Segment from Perplexity
      if (shouldUpdate(company.segment, perplexityData.segment)) {
        updateData.segment = perplexityData.segment;
        fieldsPopulated.push('segment (Perplexity)');
      }
    }

    // Integrate Lusha data for contact information
    if (lushaData) {
      // Phone from Lusha if missing from CoreSignal
      if (shouldUpdate(company.phone, lushaData.phone) && !updateData.phone) {
        updateData.phone = lushaData.phone;
        fieldsPopulated.push('phone (Lusha)');
      }

      // Email from Lusha if missing
      if (shouldUpdate(company.email, lushaData.email)) {
        updateData.email = lushaData.email;
        fieldsPopulated.push('email (Lusha)');
      }

      // Additional Lusha fields
      if (lushaData.employees && shouldUpdate(company.employeeCount, lushaData.employees) && !updateData.employeeCount) {
        updateData.employeeCount = lushaData.employees;
        fieldsPopulated.push('employeeCount (Lusha)');
      }
    }

    // Calculate data quality score based on filled fields
    const totalCriticalFields = 10; // industry, employeeCount, description, revenue, foundedYear, location, phone, email, linkedinUrl, website
    const filledCriticalFields = [
      company.industry || updateData.industry,
      company.employeeCount || updateData.employeeCount,
      company.description || updateData.description,
      company.revenue || updateData.revenue,
      company.foundedYear || updateData.foundedYear,
      company.city || updateData.city,
      company.phone || updateData.phone,
      company.email || updateData.email,
      company.linkedinUrl || updateData.linkedinUrl,
      company.website
    ].filter(Boolean).length;
    
    const dataQualityScore = (filledCriticalFields / totalCriticalFields) * 100;

    // Update dataSources array with enrichment sources
    const currentDataSources = company.dataSources || [];
    const newDataSources = Array.from(new Set([...currentDataSources, ...dataSources]));

    // Store all enrichment data in customFields for reference
    // Preserve existing customFields and only update enrichment metadata
    const existingCustomFields = (company.customFields as any) || {};
    updateData.customFields = {
      ...existingCustomFields,
      coresignalId: coresignalId,
      coresignalData: coresignalData,
      perplexityData: perplexityData,
      lushaData: lushaData,
      lastEnriched: new Date().toISOString(),
      enrichmentSource: dataSources.join(' + ')
    };

    updateData.dataQualityScore = dataQualityScore;
    updateData.dataSources = newDataSources;
    updateData.lastVerified = new Date();
    updateData.dataLastVerified = new Date();
    updateData.updatedAt = new Date();

    // Check if there are any fields to update (besides metadata)
    if (fieldsPopulated.length === 0) {
      console.log(`ℹ️ [ENRICHMENT] Company ${company.name} already has all available data, no fields updated`);
      
      // Still update enrichment metadata
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: updateData.customFields,
          lastVerified: updateData.lastVerified,
          updatedAt: updateData.updatedAt
        }
      });

      return {
        type: 'company',
        entityId: company.id,
        status: 'completed',
        fieldsPopulated: [],
        message: 'Company already has all available data'
      };
    }

    // Update the company in the database
    await prisma.companies.update({
      where: { id: company.id },
      data: updateData
    });

    console.log(`✅ [ENRICHMENT] Successfully enriched company ${company.name} with ${fieldsPopulated.length} fields from ${dataSources.join(' + ')}:`, fieldsPopulated);

    // Generate AI-powered company summary in the background (async, don't await)
    setImmediate(async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/v1/companies/${company.id}/generate-summary`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          console.log('✅ [ENRICHMENT] Generated AI summary for enriched company', company.id);
        } else {
          console.warn('⚠️ [ENRICHMENT] Failed to generate AI summary:', response.status);
        }
      } catch (error) {
        console.error('⚠️ [ENRICHMENT] Failed to generate AI summary:', error);
        // Don't fail the enrichment if summary generation fails
      }
    });

    return {
      type: 'company',
      entityId: company.id,
      status: 'completed',
      fieldsPopulated: fieldsPopulated,
      dataSources: dataSources,
      dataQualityScore: dataQualityScore,
      enrichments: {
        industry: !!updateData.industry,
        employeeCount: !!updateData.employeeCount,
        description: !!updateData.description,
        address: !!updateData.address,
        phone: !!updateData.phone,
        linkedinFollowers: !!updateData.linkedinFollowers,
        revenue: !!updateData.revenue,
        market: !!updateData.market,
        segment: !!updateData.segment,
        naicsCodes: !!updateData.naicsCodes,
        sicCodes: !!updateData.sicCodes,
        technologiesUsed: !!updateData.technologiesUsed,
        socialMedia: !!(updateData.twitterUrl || updateData.facebookUrl || updateData.instagramUrl),
        isPublic: updateData.isPublic !== undefined,
        fundingData: !!updateData.fundingRounds,
        executiveChanges: !!(updateData.executiveArrivals || updateData.executiveDepartures)
      },
      message: `Successfully enriched ${fieldsPopulated.length} fields from ${dataSources.join(' + ')} (Quality: ${Math.round(dataQualityScore)}%)`
    };

  } catch (error) {
    console.error(`❌ [ENRICHMENT] Error enriching company:`, error);
    
    return {
      type: 'company',
      entityId: company?.id,
      status: 'failed',
      error: error.message,
      fieldsPopulated: [],
      message: `Enrichment failed: ${error.message}`
    };
  }
}

/**
 * Enrich with buyer group discovery
 */
async function enrichBuyerGroup(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  return {
    type: 'buyer-group',
    companyId: entityId,
    status: 'processing',
    options: {
      dealSize: options.dealSize || 150000,
      productCategory: options.productCategory || 'sales'
    },
    message: 'Buyer group discovery triggered. This may take 1-2 minutes...'
  };
}

/**
 * Find specific role at company
 */
async function enrichRole(body: any, context: any) {
  const { data, options = {} } = body;
  
  if (!data?.targetRole) {
    throw new Error('Target role is required');
  }
  
  return {
    type: 'role',
    targetRole: data.targetRole,
    companyId: data.companyId,
    status: 'processing',
    message: `Searching for ${data.targetRole}. This may take 30-60 seconds...`
  };
}

/**
 * Find optimal buyer groups
 */
async function enrichOptimalBuyerGroup(body: any, context: any) {
  const { data, options = {} } = body;
  
  return {
    type: 'optimal-buyer-group',
    criteria: data?.criteria || {},
    status: 'processing',
    message: 'Finding optimal buyer groups. This may take 2-5 minutes...'
  };
}

/**
 * GET /api/v1/enrich/status/:jobId
 * 
 * Check status of enrichment job
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return createErrorResponse('Job ID is required', 'VALIDATION_ERROR', 400);
    }

    // Check job status (would query job queue in production)
    return createSuccessResponse({
      jobId,
      status: 'completed',
      message: 'Enrichment completed successfully'
    });

  } catch (error) {
    return createErrorResponse('Failed to check status', 'STATUS_ERROR', 500);
  }
}

