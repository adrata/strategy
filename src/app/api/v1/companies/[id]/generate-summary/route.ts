import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getV1AuthUser } from '../../../auth';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Validate that a generated summary matches the company context
 */
function validateGeneratedSummary(
  summary: string,
  companyName: string,
  companyIndustry: string | null,
  companyDomain: string | null
): { valid: boolean; reason?: string } {
  if (!summary || summary.trim() === '') {
    return { valid: false, reason: 'Summary is empty' };
  }
  
  const summaryLower = summary.toLowerCase();
  const industryLower = (companyIndustry || '').toLowerCase();
  const nameLower = (companyName || '').toLowerCase();
  const domainLower = (companyDomain || '').toLowerCase();
  
  // Check for Israeli/resort keywords
  const israeliKeywords = ['ישראל', 'israel', 'כפר נופש'];
  const hasIsraeliContent = israeliKeywords.some(keyword => summaryLower.includes(keyword.toLowerCase()));
  
  // Check for resort/hospitality content
  const hasResortContent = summaryLower.includes('resort') || 
                          summaryLower.includes('luxury resort') || 
                          summaryLower.includes('luxury hotel');
  
  // Check for utilities/transportation/energy industries
  const isUtilitiesOrTransport = industryLower.includes('utilities') || 
                                 industryLower.includes('transportation') || 
                                 industryLower.includes('logistics') ||
                                 industryLower.includes('supply chain') ||
                                 industryLower.includes('electric') ||
                                 industryLower.includes('energy');
  
  // Check for hospitality/tourism industries (where resort content would be valid)
  const isHospitalityIndustry = industryLower.includes('hospitality') || 
                                 industryLower.includes('tourism') || 
                                 industryLower.includes('hotel') ||
                                 industryLower.includes('resort');
  
  // Validate: If summary has Israeli content, it should not be used for non-Israeli companies
  if (hasIsraeliContent && !isHospitalityIndustry) {
    const isIsraeliCompany = nameLower.includes('israel') || 
                             domainLower.includes('.il') || 
                             domainLower.includes('israel');
    if (!isIsraeliCompany) {
      return { valid: false, reason: 'Summary contains Israeli content for non-Israeli company' };
    }
  }
  
  // Validate: Resort content should not appear in utilities/transportation companies
  if (hasResortContent && isUtilitiesOrTransport && !isHospitalityIndustry) {
    return { valid: false, reason: 'Summary contains resort content for utilities/transportation company' };
  }
  
  // Additional validation: Check for major company name/domain mismatches
  const majorCompanyNames = ['southern company', 'southernco', 'southern co'];
  const majorCompanyDomains = ['southernco.com', 'southerncompany.com'];
  
  const isMajorCompany = majorCompanyNames.some(name => nameLower.includes(name)) ||
                        (companyDomain && majorCompanyDomains.some(domain => companyDomain.includes(domain)));
  
  if (isMajorCompany) {
    // Major utility companies should not have resort/Israeli content
    if (hasResortContent || hasIsraeliContent) {
      return { valid: false, reason: 'Summary contains mismatched content for major utility company' };
    }
    // Major companies should not be described as "small" with very few employees
    if (summaryLower.includes('small') && summaryLower.includes('2 employees')) {
      return { valid: false, reason: 'Summary incorrectly describes major utility company as small with 2 employees' };
    }
  }
  
  return { valid: true };
}

/**
 * POST /api/v1/companies/[id]/generate-summary
 * Generate an AI-powered company summary based on available data
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Authentication
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id: companyId } = await params;
    console.log(`🤖 [COMPANY SUMMARY] Generating AI summary for company: ${companyId}`);

    // Fetch company data with related information
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: authUser.workspaceId,
        deletedAt: null,
      },
      include: {
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            department: true,
            buyerGroupRole: true,
          },
          take: 10,
        },
        actions: {
          where: { deletedAt: null },
          select: {
            type: true,
            subject: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    // Extract enrichment data from customFields
    const customFields = (company.customFields as any) || {};
    const coresignalData = customFields.coresignalData || {};
    const perplexityData = customFields.perplexityData || {};
    const lushaData = customFields.lushaData || {};
    
    // Build context from ALL available data sources
    const contextParts: string[] = [];
    const dataSources: string[] = [];
    
    if (Object.keys(coresignalData).length > 0) dataSources.push('CoreSignal');
    if (Object.keys(perplexityData).length > 0) dataSources.push('Perplexity');
    if (Object.keys(lushaData).length > 0) dataSources.push('Lusha');
    
    // Company basics (from database and CoreSignal)
    if (company.name) {
      contextParts.push(`Company Name: ${company.name}`);
    }
    if (company.industry) {
      contextParts.push(`Industry: ${company.industry}`);
    }
    if (company.website) {
      contextParts.push(`Website: ${company.website}`);
    }
    if (company.linkedinUrl) {
      contextParts.push(`LinkedIn: ${company.linkedinUrl}`);
    }
    
    // Location information (from database and CoreSignal)
    const location = company.hqCity && company.hqState 
      ? `${company.hqCity}, ${company.hqState}` 
      : company.hqCity || company.hqState || company.city || company.state || company.address;
    if (location) {
      contextParts.push(`Location: ${location}`);
    }
    
    // Company size and metrics (from database, CoreSignal, and Lusha)
    if (company.employeeCount) {
      contextParts.push(`Employees: ${company.employeeCount.toLocaleString()}`);
    } else if (company.size) {
      contextParts.push(`Company Size: ${company.size}`);
    } else if (lushaData.employees) {
      contextParts.push(`Employees: ${lushaData.employees} (Lusha)`);
    }
    
    if (company.revenue) {
      contextParts.push(`Revenue: $${Number(company.revenue).toLocaleString()}`);
    } else if (perplexityData.revenue) {
      contextParts.push(`Revenue: $${Number(perplexityData.revenue).toLocaleString()} (Perplexity)`);
    }
    
    if (company.foundedYear) {
      contextParts.push(`Founded: ${company.foundedYear}`);
    } else if (perplexityData.foundedYear) {
      contextParts.push(`Founded: ${perplexityData.foundedYear} (Perplexity)`);
    }
    
    if (company.isPublic !== null) {
      contextParts.push(`Type: ${company.isPublic ? 'Public Company' : 'Private Company'}`);
    }
    
    // Market/Category/Segment from Perplexity
    if (company.market || perplexityData.market) {
      contextParts.push(`Market: ${company.market || perplexityData.market}`);
    }
    if (company.segment || perplexityData.segment) {
      contextParts.push(`Segment: ${company.segment || perplexityData.segment}`);
    }
    
    // Recent news from Perplexity
    if (perplexityData.recentNews) {
      contextParts.push(`Recent News: ${perplexityData.recentNews}`);
    }
    
    // Technologies from Perplexity or CoreSignal
    if (perplexityData.technologies && perplexityData.technologies.length > 0) {
      contextParts.push(`Technologies: ${perplexityData.technologies.join(', ')}`);
    } else if (coresignalData.technologies_used && coresignalData.technologies_used.length > 0) {
      contextParts.push(`Technologies: ${coresignalData.technologies_used.slice(0, 5).join(', ')}`);
    }
    
    // LinkedIn followers from CoreSignal
    if (company.linkedinFollowers) {
      contextParts.push(`LinkedIn Followers: ${company.linkedinFollowers.toLocaleString()}`);
    }
    
    // Key people at the company
    if (company.people && company.people.length > 0) {
      const keyPeople = company.people
        .filter(p => p.jobTitle)
        .slice(0, 5)
        .map(p => `${p.fullName} (${p.jobTitle})${p.buyerGroupRole ? ` - ${p.buyerGroupRole}` : ''}`)
        .join(', ');
      if (keyPeople) {
        contextParts.push(`Key Contacts: ${keyPeople}`);
      }
    }
    
    // Recent engagement
    if (company.actions && company.actions.length > 0) {
      const recentActions = company.actions
        .slice(0, 3)
        .map(a => `${a.type}: ${a.subject}`)
        .join('; ');
      contextParts.push(`Recent Activity: ${recentActions}`);
    }
    
    // Relationship type
    if (company.relationshipType) {
      contextParts.push(`Relationship Type: ${company.relationshipType}`);
    }
    if (company.priority) {
      contextParts.push(`Priority: ${company.priority}`);
    }

    const availableContext = contextParts.join('\n');
    const sourceInfo = dataSources.length > 0 ? ` (from ${dataSources.join(' + ')})` : '';

    console.log(`📊 [COMPANY SUMMARY] Context for AI${sourceInfo}:\n${availableContext}`);

    // Generate summary using Claude AI
    const prompt = `You are a B2B sales intelligence system. Generate a concise, professional company summary (2-3 sentences) based on the available information below${sourceInfo}. Focus on what's most relevant for a sales professional engaging with this company.

Available Company Information${sourceInfo}:
${availableContext}

Generate a clear, factual summary that highlights:
1. What the company does (infer from industry and name if needed)
2. Key business characteristics (size, location, public/private status, technologies)
3. Relevant context for sales engagement (recent news, market position, key contacts if available)

Keep it professional, concise, and actionable. Do not make up information that isn't provided. If minimal information is available, create a brief summary from what you have.`;

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ [COMPANY SUMMARY] Anthropic API key not configured - cannot generate summary');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Anthropic API key not configured. Real AI summaries require API key.' 
        },
        { status: 503 }
      );
    }

    // Call Claude AI
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const aiSummary = message.content[0].type === 'text' ? message.content[0].text : '';
    
    console.log(`✅ [COMPANY SUMMARY] Generated AI summary: ${aiSummary}`);

    // Validate the generated summary before saving
    const domain = company.website ? company.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;
    const validation = validateGeneratedSummary(aiSummary, company.name, company.industry, domain);
    
    if (!validation.valid) {
      console.error(`❌ [COMPANY SUMMARY] Generated summary failed validation: ${validation.reason}`);
      console.error(`   Summary preview: ${aiSummary.substring(0, 200)}...`);
      return NextResponse.json(
        { 
          success: false, 
          error: `Generated summary failed validation: ${validation.reason}. Please try regenerating or contact support.`,
          details: {
            reason: validation.reason,
            summaryPreview: aiSummary.substring(0, 200)
          }
        },
        { status: 400 }
      );
    }

    // Save the AI-generated summary to the database
    await prisma.companies.update({
      where: { id: companyId },
      data: {
        descriptionEnriched: aiSummary,
        updatedAt: new Date(),
        customFields: {
          ...(company.customFields as any || {}),
          aiSummaryGeneratedAt: new Date().toISOString(),
          aiSummaryModel: 'claude-3-5-sonnet-20241022',
          aiSummaryDataSources: dataSources.length > 0 ? dataSources : ['database'],
        },
      },
    });

    console.log(`💾 [COMPANY SUMMARY] Saved AI summary to database for company ${companyId} using data from ${dataSources.length > 0 ? dataSources.join(' + ') : 'database'}`);

    return NextResponse.json({
      success: true,
      data: {
        summary: aiSummary,
        method: 'ai',
        model: 'claude-3-5-sonnet-20241022',
        dataSources: dataSources.length > 0 ? dataSources : ['database'],
      },
    });

  } catch (error) {
    console.error('❌ [COMPANY SUMMARY] Error generating summary:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate summary' 
      },
      { status: 500 }
    );
  }
}

