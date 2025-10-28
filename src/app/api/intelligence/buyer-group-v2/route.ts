/**
 * BUYER GROUP V2 API
 * 
 * Uses the new consolidated buyer group engine with AI-powered role classification
 * and multi-signal validation for enhanced accuracy
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { ConsolidatedBuyerGroupEngine } from '@/platform/intelligence/buyer-group-v2/engine';
import { OptimalBuyerFinder } from '@/platform/intelligence/buyer-group-v2/services/optimal-buyer-finder';
import { CompanyEnricher } from '@/platform/intelligence/buyer-group-v2/services/company-enricher';
import { PersonEnricher } from '@/platform/intelligence/buyer-group-v2/services/person-enricher';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * POST: Discover buyer group for a single company
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // 2. Parse request body
    const body = await request.json();
    const { 
      companyName,
      companyId,
      companyLinkedInUrl,
      sellerProfile,
      enrichmentLevel = 'enrich',
      saveToDatabase = true
    } = body;

    // 3. Validate required parameters
    if (!companyName && !companyId && !companyLinkedInUrl) {
      return createErrorResponse(
        'Company name, ID, or LinkedIn URL is required',
        'COMPANY_IDENTIFIER_REQUIRED',
        400
      );
    }

    console.log(
      `🎯 [BUYER GROUP V2 API] Processing discovery for: ${companyName || companyId || companyLinkedInUrl} in workspace: ${workspaceId}`
    );

    // 4. Initialize the consolidated buyer group engine
    const engine = new ConsolidatedBuyerGroupEngine();

    // 5. Discover buyer group
    const startTime = Date.now();
    const result = await engine.discoverBuyerGroup({
      companyName,
      companyId,
      companyLinkedInUrl,
      workspaceId,
      enrichmentLevel,
      sellerProfile
    });

    const processingTime = Date.now() - startTime;

    // 6. Save to database if requested
    let savedBuyerGroup = null;
    if (saveToDatabase && result.buyerGroup) {
      try {
        savedBuyerGroup = await saveBuyerGroupToDatabase(result, workspaceId);
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue without throwing - API should still return results
      }
    }

    // 7. Prepare response
    const responseData = {
      success: true,
      company: result.company,
      buyerGroup: {
        totalMembers: result.buyerGroup.length,
        composition: result.composition,
        members: result.buyerGroup.map(member => ({
          name: member.name,
          title: member.title,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedin,
          department: member.department,
          role: member.role,
          confidence: member.confidence,
          influenceScore: member.influenceScore,
          priority: member.priority
        }))
      },
      quality: result.qualityMetrics,
      processingTime,
      creditsUsed: result.creditsUsed,
      databaseId: savedBuyerGroup?.id || null,
      timestamp: new Date().toISOString()
    };

    console.log(
      `✅ [BUYER GROUP V2 API] Successfully discovered buyer group: ${result.buyerGroup.length} members, ${result.qualityMetrics.overallScore}% quality score`
    );

    return createSuccessResponse(responseData, 'BUYER_GROUP_DISCOVERED');

  } catch (error: any) {
    console.error('❌ [BUYER GROUP V2 API] Error processing buyer group:', error);
    
    return createErrorResponse(
      `Buyer group discovery failed: ${error.message}`,
      'BUYER_GROUP_ERROR',
      500,
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    );
  }
}

/**
 * GET: Find optimal buyer companies
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const industries = searchParams.get('industries')?.split(',') || [];
    const sizeRange = searchParams.get('sizeRange') || '50-200 employees';
    const locations = searchParams.get('locations')?.split(',') || [];
    const minGrowthRate = parseInt(searchParams.get('minGrowthRate') || '10');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');
    const minReadinessScore = parseInt(searchParams.get('minReadinessScore') || '70');
    const enableBuyerGroupSampling = searchParams.get('enableBuyerGroupSampling') !== 'false';

    // 2. Validate required parameters
    if (industries.length === 0) {
      return createErrorResponse(
        'At least one industry is required',
        'INDUSTRIES_REQUIRED',
        400
      );
    }

    console.log(
      `🔍 [BUYER GROUP V2 API] Finding optimal buyers for industries: ${industries.join(', ')} in workspace: ${workspaceId}`
    );

    // 3. Initialize the optimal buyer finder
    const finder = new OptimalBuyerFinder();

    // 4. Find optimal buyers
    const startTime = Date.now();
    const result = await finder.findOptimalBuyers({
      industries,
      sizeRange,
      locations,
      minGrowthRate,
      maxResults,
      minReadinessScore,
      enableBuyerGroupSampling,
      workspaceId
    });

    const processingTime = Date.now() - startTime;

    // 5. Prepare response
    const responseData = {
      success: true,
      companies: result.companies.map(company => ({
        company: company.company,
        readinessScore: company.readinessScore,
        painSignalScore: company.painSignalScore,
        innovationScore: company.innovationScore,
        buyerExperienceScore: company.buyerExperienceScore,
        buyerGroupStructureScore: company.buyerGroupStructureScore,
        ranking: company.ranking,
        buyerGroupQuality: company.buyerGroupQuality
      })),
      processingTime,
      creditsUsed: result.creditsUsed,
      timestamp: new Date().toISOString()
    };

    console.log(
      `✅ [BUYER GROUP V2 API] Found ${result.companies.length} optimal buyer companies`
    );

    return createSuccessResponse(responseData, 'OPTIMAL_BUYERS_FOUND');

  } catch (error: any) {
    console.error('❌ [BUYER GROUP V2 API] Error finding optimal buyers:', error);
    
    return createErrorResponse(
      `Optimal buyer search failed: ${error.message}`,
      'OPTIMAL_BUYER_ERROR',
      500,
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    );
  }
}

/**
 * Save buyer group to database
 */
async function saveBuyerGroupToDatabase(result: any, workspaceId: string): Promise<any> {
  const { prisma } = await import('@/platform/database/prisma-client');

  // Create or update company
  let company = null;
  if (result.company.id) {
    company = await prisma.companies.findUnique({
      where: { id: result.company.id }
    });
  }

  if (!company && result.company.name) {
    company = await prisma.companies.create({
      data: {
        name: result.company.name,
        website: result.company.website,
        industry: result.company.industry,
        size: result.company.size,
        workspaceId,
        customFields: result.company.coresignalId ? {
          coresignalId: result.company.coresignalId
        } : {}
      }
    });
  }

  if (!company) {
    throw new Error('Could not create or find company');
  }

  // Create buyer group
  const buyerGroup = await prisma.buyerGroups.create({
    data: {
      companyId: company.id,
      workspaceId,
      status: 'active',
      enrichmentLevel: 'enrich',
      totalMembers: result.buyerGroup.length,
      composition: result.composition,
      qualityMetrics: result.qualityMetrics,
      customFields: {
        processingTime: result.processingTime,
        creditsUsed: result.creditsUsed,
        engineVersion: 'v2'
      }
    }
  });

  // Create buyer group members
  for (const member of result.buyerGroup) {
    await prisma.buyerGroupMembers.create({
      data: {
        buyerGroupId: buyerGroup.id,
        name: member.name,
        title: member.title,
        email: member.email,
        phone: member.phone,
        linkedinUrl: member.linkedin,
        department: member.department,
        role: member.role,
        confidence: member.confidence,
        influenceScore: member.influenceScore,
        priority: member.priority,
        customFields: {
          coresignalId: member.coresignalId,
          addedAt: new Date().toISOString()
        }
      }
    });
  }

  return buyerGroup;
}
