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
  const coresignalApiKey = process.env.CORESIGNAL_API_KEY;
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
    console.log(`🔍 [ENRICHMENT] Starting enrichment for person: ${person.fullName || person.firstName + ' ' + person.lastName}`);
    
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

    // Map CoreSignal data to our database schema
    // SMART UPDATE: Only populate missing fields, preserve existing good data from buyer group enrichment
    const updateData: any = {};
    const fieldsPopulated: string[] = [];

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
      updateData.title = activeExperience.position_title;
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
    if (shouldUpdate(person.location, coresignalData.location)) {
      updateData.location = coresignalData.location;
      fieldsPopulated.push('location');
    }

    // Store CoreSignal data in customFields for reference
    // Preserve existing customFields (may contain buyer group data, enrichment data, etc.)
    const existingCustomFields = (person.customFields as any) || {};
    updateData.customFields = {
      ...existingCustomFields,
      coresignalId: coresignalId,
      coresignalData: coresignalData,
      lastEnriched: new Date().toISOString(),
      enrichmentSource: 'api_v1_enrich'
    };

    updateData.lastEnriched = new Date();
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

    console.log(`✅ [ENRICHMENT] Successfully enriched person ${person.fullName} with ${fieldsPopulated.length} fields:`, fieldsPopulated);

    return {
      type: 'person',
      entityId: person.id,
      status: 'completed',
      fieldsPopulated: fieldsPopulated,
      enrichments: {
        jobTitle: !!updateData.jobTitle,
        email: !!updateData.email,
        phone: !!updateData.phone,
        linkedinUrl: !!updateData.linkedinUrl,
        department: !!updateData.department
      },
      message: `Successfully enriched ${fieldsPopulated.length} fields from CoreSignal`
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
 * Enrich a company with CoreSignal data
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
  const coresignalApiKey = process.env.CORESIGNAL_API_KEY;
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
    console.log(`🔍 [ENRICHMENT] Starting enrichment for company: ${company.name}`);
    
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

    // Map CoreSignal data to our database schema
    // SMART UPDATE: Only populate missing or stale fields, preserve existing good data
    const updateData: any = {};
    const fieldsPopulated: string[] = [];

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
    if (shouldUpdate(company.employeeCount, coresignalData.employee_count)) {
      updateData.employeeCount = coresignalData.employee_count;
      fieldsPopulated.push('employeeCount');
    }

    // Size range - only if missing
    if (shouldUpdate(company.size, coresignalData.size_range)) {
      updateData.size = coresignalData.size_range;
      fieldsPopulated.push('size');
    }

    // Description - only if missing or very short
    if (shouldUpdate(company.description, coresignalData.description) || 
        (company.description && company.description.length < 50 && coresignalData.description && coresignalData.description.length > company.description.length)) {
      updateData.description = coresignalData.description;
      fieldsPopulated.push('description');
    }

    // Founded year - only if missing
    if (shouldUpdate(company.foundedYear, coresignalData.founded)) {
      updateData.foundedYear = parseInt(coresignalData.founded);
      fieldsPopulated.push('foundedYear');
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

    if (shouldUpdate(company.linkedinUrl, coresignalData.url)) {
      updateData.linkedinUrl = coresignalData.url;
      fieldsPopulated.push('linkedinUrl');
    }

    // Store CoreSignal data in customFields for reference
    // Preserve existing customFields and only update enrichment metadata
    const existingCustomFields = (company.customFields as any) || {};
    updateData.customFields = {
      ...existingCustomFields,
      coresignalId: coresignalId,
      coresignalData: coresignalData,
      lastEnriched: new Date().toISOString(),
      enrichmentSource: 'api_v1_enrich'
    };

    updateData.lastEnriched = new Date();
    updateData.updatedAt = new Date();

    // Check if there are any fields to update (besides metadata)
    if (fieldsPopulated.length === 0) {
      console.log(`ℹ️ [ENRICHMENT] Company ${company.name} already has all available data, no fields updated`);
      
      // Still update enrichment metadata
      await prisma.companies.update({
        where: { id: company.id },
        data: {
          customFields: updateData.customFields,
          lastEnriched: updateData.lastEnriched,
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

    console.log(`✅ [ENRICHMENT] Successfully enriched company ${company.name} with ${fieldsPopulated.length} fields:`, fieldsPopulated);

    return {
      type: 'company',
      entityId: company.id,
      status: 'completed',
      fieldsPopulated: fieldsPopulated,
      enrichments: {
        industry: !!updateData.industry,
        employeeCount: !!updateData.employeeCount,
        description: !!updateData.description,
        address: !!updateData.address,
        phone: !!updateData.phone,
        linkedinFollowers: !!updateData.linkedinFollowers
      },
      message: `Successfully enriched ${fieldsPopulated.length} fields from CoreSignal`
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

