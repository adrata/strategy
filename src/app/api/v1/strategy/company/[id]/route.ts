import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext, createErrorResponse } from '@/platform/services/secure-api-helper';
import { companyStrategyService, CompanyStrategyRequest } from '@/platform/services/company-strategy-service';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * Company Strategy API
 * GET /api/v1/strategy/company/[id] - Load existing company strategy
 * POST /api/v1/strategy/company/[id] - Generate new company strategy
 */

// GET /api/v1/strategy/company/[id] - Load existing company strategy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context, response } = authResult;
    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const companyId = params.id;
    if (!companyId) {
      return createErrorResponse('Company ID is required', 'VALIDATION_ERROR', 400);
    }

    // Get company record with enriched data
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
      },
      include: {
        // Include related people/contacts
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            email: true,
            phone: true,
            linkedinUrl: true,
            lastAction: true,
            nextAction: true
          }
        }
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'NOT_FOUND', 404);
    }

    // Check for existing strategy in customFields
    const existingStrategy = company.customFields?.strategyData;
    
    if (existingStrategy) {
      console.log(`✅ [COMPANY STRATEGY API] Found existing strategy for company ${companyId}`);
      return NextResponse.json({
        success: true,
        data: existingStrategy,
        cached: true,
        meta: {
          companyId,
          companyName: company.name,
          generatedAt: existingStrategy.strategyGeneratedAt,
          generatedBy: existingStrategy.strategyGeneratedBy
        }
      });
    }

    // No existing strategy
    return NextResponse.json({
      success: true,
      data: null,
      cached: false,
      meta: {
        companyId,
        companyName: company.name,
        message: 'No strategy data found'
      }
    });

  } catch (error) {
    console.error('❌ [COMPANY STRATEGY API] GET Error:', error);
    return createErrorResponse(
      'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}

// POST /api/v1/strategy/company/[id] - Generate new company strategy
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context, response } = authResult;
    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const companyId = params.id;
    if (!companyId) {
      return createErrorResponse('Company ID is required', 'VALIDATION_ERROR', 400);
    }

    const body = await request.json();
    const { forceRegenerate = false } = body;

    // Get company record with enriched data
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
      },
      include: {
        // Include related people/contacts
        people: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            jobTitle: true,
            email: true,
            phone: true,
            linkedinUrl: true,
            lastAction: true,
            nextAction: true
          }
        }
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'NOT_FOUND', 404);
    }

    // Check if strategy already exists and not forcing regeneration
    if (!forceRegenerate && company.customFields?.strategyData) {
      console.log(`📋 [COMPANY STRATEGY API] Strategy already exists for company ${companyId}`);
      return NextResponse.json({
        success: true,
        data: company.customFields.strategyData,
        cached: true,
        meta: {
          companyId,
          companyName: company.name,
          message: 'Strategy already exists. Use forceRegenerate=true to regenerate.'
        }
      });
    }

    console.log(`🔄 [COMPANY STRATEGY API] Generating strategy for company ${companyId}`);
    console.log(`📊 [COMPANY STRATEGY API] Company data:`, {
      name: company.name,
      industry: company.industry,
      size: company.size,
      revenue: company.revenue,
      foundedAt: company.foundedAt,
      website: company.website,
      headquarters: company.headquarters,
      peopleCount: company.people?.length || 0
    });

    // Prepare strategy request with comprehensive company data
    // Use company's actual industry to infer targetIndustry if not explicitly set
    const inferredTargetIndustry = company.customFields?.targetIndustry || 
      (company.industry ? inferIndustryCategory(company.industry) : null) ||
      (company.sector ? inferIndustryCategory(company.sector) : null) ||
      'Unknown';
    
    const strategyRequest: CompanyStrategyRequest = {
      companyId,
      companyName: company.name,
      companyIndustry: company.industry || 'Unknown',
      targetIndustry: inferredTargetIndustry,
      companySize: company.size || 0,
      companyRevenue: company.revenue || 0,
      companyAge: company.foundedAt ? 
        Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0,
      growthStage: determineGrowthStage(company),
      marketPosition: determineMarketPosition(company),
      forceRegenerate,
      // Pass through all real company data for better AI analysis
      website: company.website,
      headquarters: company.headquarters,
      foundedYear: company.foundedYear,
      isPublic: company.isPublic,
      sector: company.sector,
      description: company.description,
      linkedinFollowers: company.linkedinFollowers,
      globalRank: company.globalRank,
      competitors: Array.isArray(company.competitors) ? company.competitors : [],
      lastAction: company.lastAction,
      nextAction: company.nextAction,
      opportunityStage: company.opportunityStage,
      opportunityAmount: company.opportunityAmount,
      // Include enriched data for better intelligence
      people: company.people || []
    };

    console.log(`📋 [COMPANY STRATEGY API] Strategy request prepared:`, {
      companyId: strategyRequest.companyId,
      companyName: strategyRequest.companyName,
      companyIndustry: strategyRequest.companyIndustry,
      targetIndustry: strategyRequest.targetIndustry,
      companySize: strategyRequest.companySize,
      companyRevenue: strategyRequest.companyRevenue,
      companyAge: strategyRequest.companyAge,
      growthStage: strategyRequest.growthStage,
      marketPosition: strategyRequest.marketPosition,
      forceRegenerate: strategyRequest.forceRegenerate,
      peopleCount: strategyRequest.people?.length || 0
    });

    // Generate strategy using company strategy service
    console.log(`🤖 [COMPANY STRATEGY API] Calling companyStrategyService.generateCompanyStrategy...`);
    const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
    console.log(`📤 [COMPANY STRATEGY API] Strategy service response:`, {
      success: strategyResponse.success,
      hasData: !!strategyResponse.data,
      error: strategyResponse.error,
      cached: strategyResponse.cached
    });
    
    if (!strategyResponse.success || !strategyResponse.data) {
      console.error(`❌ [COMPANY STRATEGY API] Strategy generation failed:`, {
        success: strategyResponse.success,
        error: strategyResponse.error,
        hasData: !!strategyResponse.data,
        companyId,
        companyName: company.name
      });
      return createErrorResponse(
        strategyResponse.error || 'Failed to generate company strategy',
        'STRATEGY_GENERATION_FAILED',
        500
      );
    }

    console.log(`💾 [COMPANY STRATEGY API] Updating company record with strategy data...`);
    
    try {
      // Update company record with strategy data
      const updatedCompany = await prisma.companies.update({
        where: { id: companyId },
        data: {
          customFields: {
            ...company.customFields,
            strategyData: strategyResponse.data,
            lastStrategyUpdate: new Date().toISOString()
          }
        }
      });

      console.log(`✅ [COMPANY STRATEGY API] Successfully generated and saved strategy for company ${companyId}`);
      console.log(`📊 [COMPANY STRATEGY API] Strategy data saved:`, {
        strategySummary: strategyResponse.data.strategySummary?.substring(0, 100) + '...',
        archetypeName: strategyResponse.data.archetypeName,
        targetIndustry: strategyResponse.data.targetIndustry,
        generatedBy: strategyResponse.data.strategyGeneratedBy,
        generatedAt: strategyResponse.data.strategyGeneratedAt
      });

      return NextResponse.json({
        success: true,
        data: strategyResponse.data,
        cached: false,
        meta: {
          companyId,
          companyName: company.name,
          generatedAt: strategyResponse.data.strategyGeneratedAt,
          generatedBy: strategyResponse.data.strategyGeneratedBy,
          archetype: strategyResponse.data.archetypeName,
          targetIndustry: strategyResponse.data.targetIndustry
        }
      });
    } catch (dbError) {
      console.error(`❌ [COMPANY STRATEGY API] Database update failed:`, {
        error: dbError,
        companyId,
        strategyData: strategyResponse.data ? 'present' : 'missing'
      });
      return createErrorResponse(
        'Failed to save strategy data to database',
        'DATABASE_UPDATE_FAILED',
        500
      );
    }

  } catch (error) {
    console.error('❌ [COMPANY STRATEGY API] POST Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      companyId: params.id,
      timestamp: new Date().toISOString()
    });
    return createErrorResponse(
      error instanceof Error ? error.message : 'Internal server error',
      'INTERNAL_ERROR',
      500
    );
  }
}

// Helper function to determine growth stage
function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
  const age = company.foundedAt ? 
    Math.floor((Date.now() - new Date(company.foundedAt).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
  const size = company.size || 0;
  const revenue = company.revenue || 0;

  if (age < 3 && size < 50) return 'startup';
  if (age < 10 && size < 500) return 'growth';
  if (age >= 10 && size >= 500) return 'mature';
  return 'declining';
}

// Helper function to determine market position
function determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
  const size = company.size || 0;
  const revenue = company.revenue || 0;
  const globalRank = company.globalRank || 999999;

  if (globalRank <= 1000) return 'leader';
  if (size > 1000 || revenue > 100000000) return 'challenger';
  if (size > 100) return 'follower';
  return 'niche';
}

// Helper function to infer industry category from company industry
function inferIndustryCategory(industry: string): string | null {
  if (!industry) return null;
  
  const industryLower = industry.toLowerCase();
  
  // Utility/Energy sector
  if (industryLower.includes('utility') || 
      industryLower.includes('energy') || 
      industryLower.includes('power') || 
      industryLower.includes('electric') ||
      industryLower.includes('utilities')) {
    return 'Utilities/Energy';
  }
  
  // Healthcare
  if (industryLower.includes('healthcare') || 
      industryLower.includes('health') || 
      industryLower.includes('hospital') || 
      industryLower.includes('medical')) {
    return 'Healthcare';
  }
  
  // Financial Services
  if (industryLower.includes('bank') || 
      industryLower.includes('financial') || 
      industryLower.includes('insurance') || 
      industryLower.includes('finance')) {
    return 'Financial Services';
  }
  
  // Technology/SaaS
  if (industryLower.includes('software') || 
      industryLower.includes('technology') || 
      industryLower.includes('tech') || 
      industryLower.includes('saas') ||
      industryLower.includes('it services') ||
      industryLower.includes('information technology')) {
    return 'Technology/SaaS';
  }
  
  // Manufacturing
  if (industryLower.includes('manufacturing') || 
      industryLower.includes('manufacturer')) {
    return 'Manufacturing';
  }
  
  // Retail
  if (industryLower.includes('retail') || 
      industryLower.includes('e-commerce') || 
      industryLower.includes('ecommerce')) {
    return 'Retail/E-commerce';
  }
  
  // Real Estate
  if (industryLower.includes('real estate') || 
      industryLower.includes('title') || 
      industryLower.includes('property')) {
    return 'Real Estate';
  }
  
  // Education
  if (industryLower.includes('education') || 
      industryLower.includes('school') || 
      industryLower.includes('university')) {
    return 'Education';
  }
  
  // Government
  if (industryLower.includes('government') || 
      industryLower.includes('public sector')) {
    return 'Government/Public Sector';
  }
  
  // Professional Services
  if (industryLower.includes('consulting') || 
      industryLower.includes('professional services') || 
      industryLower.includes('legal') ||
      industryLower.includes('law')) {
    return 'Professional Services';
  }
  
  // Non-Profit
  if (industryLower.includes('non-profit') || 
      industryLower.includes('nonprofit') || 
      industryLower.includes('non profit')) {
    return 'Non-Profit';
  }
  
  // If no match, return the original industry as-is
  return industry;
}
