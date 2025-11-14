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
    // Check multiple sources and avoid Technology/SaaS default
    const inferredTargetIndustry = company.customFields?.targetIndustry || 
      (company.industry ? inferIndustryCategory(company.industry) : null) ||
      (company.sector ? inferIndustryCategory(company.sector) : null) ||
      (company.name ? inferIndustryFromName(company.name) : null) ||
      'Unknown';
    
    const strategyRequest: CompanyStrategyRequest = {
      companyId,
      companyName: company.name,
      companyIndustry: company.industry || 'Unknown',
      targetIndustry: inferredTargetIndustry,
      companySize: parseCompanySize(company.size || company.employeeCount),
      companyRevenue: company.revenue || 0,
      companyAge: company.foundedYear ? 
        new Date().getFullYear() - company.foundedYear : null,
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

// Helper function to parse company size from string or number
function parseCompanySize(size: any): number {
  if (typeof size === 'number') return size;
  if (!size) return 0;
  
  const sizeStr = String(size).toLowerCase();
  
  // Extract numeric value from strings like "10,001+ employees" or "1000-5000"
  const match = sizeStr.match(/(\d{1,3}(?:,\d{3})*)/);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  
  // Handle range strings like "1000-5000"
  const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
  if (rangeMatch) {
    return parseInt(rangeMatch[2], 10); // Use upper bound
  }
  
  // Handle size categories
  if (sizeStr.includes('10000+') || sizeStr.includes('enterprise')) return 10000;
  if (sizeStr.includes('5000+') || sizeStr.includes('large-enterprise')) return 5000;
  if (sizeStr.includes('1000+') || sizeStr.includes('large')) return 1000;
  if (sizeStr.includes('500+') || sizeStr.includes('medium-enterprise')) return 500;
  if (sizeStr.includes('200+') || sizeStr.includes('medium')) return 200;
  if (sizeStr.includes('50+') || sizeStr.includes('small')) return 50;
  
  return 0;
}

// Helper function to determine growth stage
function determineGrowthStage(company: any): 'startup' | 'growth' | 'mature' | 'declining' {
  const age = company.foundedYear ? 
    new Date().getFullYear() - company.foundedYear : null;
  const size = parseCompanySize(company.size || company.employeeCount);
  const revenue = company.revenue || 0;

  // For large companies, default to mature if age is unknown
  if (size >= 1000 && revenue > 100000000) {
    if (age === null || age === 0) return 'mature'; // Large companies are typically mature
    if (age >= 10) return 'mature';
    return 'growth'; // Large but young = high growth
  }

  // For medium companies
  if (size >= 500) {
    if (age === null || age === 0) return 'mature'; // Default to mature for established size
    if (age >= 10) return 'mature';
    return 'growth';
  }

  // For smaller companies, use age if available
  if (age === null || age === 0) {
    // Without age data, infer from size
    if (size < 50) return 'startup';
    if (size < 500) return 'growth';
    return 'mature';
  }

  // Standard logic with age data
  if (age < 3 && size < 50) return 'startup';
  if (age < 10 && size < 500) return 'growth';
  if (age >= 10 && size >= 500) return 'mature';
  
  // Only return declining for old companies with small size (indicating contraction)
  if (age > 20 && size < 100 && revenue < 1000000) return 'declining';
  
  // Default to mature for established companies
  return 'mature';
}

// Helper function to determine market position
function determineMarketPosition(company: any): 'leader' | 'challenger' | 'follower' | 'niche' {
  const size = parseCompanySize(company.size || company.employeeCount);
  const revenue = company.revenue || 0;
  const globalRank = company.globalRank || 999999;

  // Global leaders based on rank
  if (globalRank <= 1000) return 'leader';
  
  // Large companies with significant revenue are challengers or leaders
  if (size >= 10000 || revenue >= 1000000000) return 'leader'; // $1B+ revenue = leader
  if (size >= 1000 || revenue >= 100000000) return 'challenger'; // $100M+ revenue = challenger
  
  // Medium companies
  if (size >= 500) return 'challenger';
  if (size >= 100) return 'follower';
  
  // Small companies
  return 'niche';
}

// Helper function to infer industry category from company industry
// Does NOT default to Technology/SaaS - returns null if no match
function inferIndustryCategory(industry: string): string | null {
  if (!industry) return null;
  
  const industryLower = industry.toLowerCase();
  
  // Utility/Energy sector - check FIRST before technology to avoid false matches
  if (industryLower.includes('utility') || 
      industryLower.includes('energy') || 
      industryLower.includes('power') || 
      industryLower.includes('electric') ||
      industryLower.includes('utilities') ||
      industryLower.includes('electrical')) {
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
  
  // Technology/SaaS - only match explicit technology terms, not generic "tech"
  // This prevents false matches like "Power Technology" being classified as Technology/SaaS
  if (industryLower.includes('software') || 
      industryLower.includes('saas') ||
      industryLower.includes('it services') ||
      industryLower.includes('information technology')) {
    return 'Technology/SaaS';
  }
  // Only match standalone "technology" or "tech" if it's clearly the industry
  // Not if it's part of a compound term like "energy technology"
  if ((industryLower === 'technology' || industryLower === 'tech') && 
      !industryLower.includes('energy') && 
      !industryLower.includes('power') &&
      !industryLower.includes('utility')) {
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
  
  // If no match, return null (don't default to Technology/SaaS or return original)
  return null;
}

// Helper function to infer industry from company name when industry field is missing
// Helps identify utilities/energy companies like "Minnesota Power"
function inferIndustryFromName(companyName: string): string | null {
  if (!companyName) return null;
  
  const nameLower = companyName.toLowerCase();
  
  // Utility/Energy keywords in company name - check FIRST
  if (nameLower.includes('power') || 
      nameLower.includes('energy') || 
      nameLower.includes('electric') ||
      nameLower.includes('utility') ||
      nameLower.includes('utilities') ||
      nameLower.includes('gas') ||
      nameLower.includes('water') ||
      nameLower.includes('steam')) {
    return 'Utilities/Energy';
  }
  
  // Healthcare keywords
  if (nameLower.includes('health') || 
      nameLower.includes('hospital') || 
      nameLower.includes('medical') ||
      nameLower.includes('clinic')) {
    return 'Healthcare';
  }
  
  // Financial keywords
  if (nameLower.includes('bank') || 
      nameLower.includes('financial') || 
      nameLower.includes('insurance') ||
      nameLower.includes('credit union')) {
    return 'Financial Services';
  }
  
  // Don't infer Technology/SaaS from name alone - too risky
  // Return null if no clear match
  return null;
}
