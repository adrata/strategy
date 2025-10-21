import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSecureApiContext } from '@/platform/services/security-service';
import { createErrorResponse } from '@/platform/services/error-service';
import { companyStrategyService, CompanyStrategyRequest } from '@/platform/services/company-strategy-service';

/**
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

    // Get company record
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
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

    // Get company record
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
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

    // Prepare strategy request with comprehensive company data
    const strategyRequest: CompanyStrategyRequest = {
      companyId,
      companyName: company.name,
      companyIndustry: company.industry || 'Unknown',
      targetIndustry: company.customFields?.targetIndustry || 'Technology/SaaS',
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
      competitors: company.competitors ? company.competitors.split(',').map(c => c.trim()) : [],
      lastAction: company.lastAction,
      nextAction: company.nextAction,
      opportunityStage: company.opportunityStage,
      opportunityAmount: company.opportunityAmount
    };

    // Generate strategy using company strategy service
    const strategyResponse = await companyStrategyService.generateCompanyStrategy(strategyRequest);
    
    if (!strategyResponse.success || !strategyResponse.data) {
      return createErrorResponse(
        strategyResponse.error || 'Failed to generate company strategy',
        'STRATEGY_GENERATION_FAILED',
        500
      );
    }

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

  } catch (error) {
    console.error('❌ [COMPANY STRATEGY API] POST Error:', error);
    return createErrorResponse(
      'Internal server error',
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
