import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * SINGLE COMPANY BUYER GROUP DISCOVERY API
 * 
 * Uses the new unified buyer group pipeline to discover buyer groups for individual companies
 * Supports both direct API calls and AI chat integration
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // 2. Parse request body
    const body = await request.json();
    const { 
      companyName, 
      website, 
      sellerProfile,
      saveToDatabase = true,
      returnFullData = false 
    } = body;

    // 3. Validate required parameters
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return createErrorResponse(
        'Valid company name is required (minimum 2 characters)',
        'INVALID_COMPANY_NAME',
        400
      );
    }

    console.log(
      `🎯 [BUYER GROUP API] Processing single company: ${companyName} for workspace: ${workspaceId}, user: ${userId}`
    );

    // 4. Import and initialize the buyer group pipeline
    const BuyerGroupPipeline = require('@/platform/pipelines/pipelines/core/buyer-group-pipeline.js').BuyerGroupPipeline;
    const pipeline = new BuyerGroupPipeline();

    // 5. Process the company
    const startTime = Date.now();
    const result = await pipeline.processSingleCompany(companyName.trim(), { 
      website: website?.trim() || null,
      sellerProfile: sellerProfile || null
    });

    const processingTime = Date.now() - startTime;

    // 6. Save to database if requested
    let savedBuyerGroup = null;
    if (saveToDatabase && result.buyerGroup) {
      try {
        savedBuyerGroup = await pipeline.saveBuyerGroupToDatabase(result, workspaceId);
      } catch (dbError) {
        console.error('Database save failed:', dbError);
        // Continue without throwing - API should still return results
      }
    }

    // 7. Prepare response
    const responseData = {
      success: true,
      companyName: result.companyName,
      website: result.website,
      industry: result.industry,
      companySize: result.size,
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      buyerGroup: {
        totalMembers: result.buyerGroup?.totalMembers || 0,
        cohesionScore: result.quality?.cohesionScore || 0,
        overallConfidence: result.quality?.overallConfidence || 0,
        roles: result.buyerGroup?.roles || {},
        members: result.buyerGroup?.members || []
      },
      quality: {
        cohesionScore: result.quality?.cohesionScore || 0,
        overallConfidence: result.quality?.overallConfidence || 0,
        roleDistribution: result.quality?.roleDistribution || {},
        validationStatus: result.quality?.validationStatus || 'unknown'
      },
      databaseId: savedBuyerGroup?.id || null,
      cacheUtilized: result.cacheUtilized || false
    };

    // 8. Include full data if requested (for debugging or detailed analysis)
    if (returnFullData) {
      responseData.fullResult = result;
    }

    console.log(
      `✅ [BUYER GROUP API] Successfully processed ${companyName}: ${result.buyerGroup?.totalMembers || 0} members, ${result.quality?.overallConfidence || 0}% confidence`
    );

    return createSuccessResponse(responseData, 'BUYER_GROUP_DISCOVERED');

  } catch (error) {
    console.error('❌ [BUYER GROUP API] Error processing buyer group:', error);
    
    // Return structured error response
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
 * GET: Retrieve buyer group for a company
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
    const companyName = searchParams.get('company');

    if (!companyName) {
      return createErrorResponse(
        'Company name parameter is required',
        'COMPANY_NAME_REQUIRED',
        400
      );
    }

    console.log(
      `🔍 [BUYER GROUP API] Retrieving buyer group for: ${companyName} in workspace: ${workspaceId}`
    );

    // 2. Query database for existing buyer group members (streamlined approach)
    const { prisma } = await import('@/platform/database/prisma-client');
    
    // Find people with buyer group roles for this company
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        buyerGroupRole: {
          not: null
        },
        company: {
          name: {
            equals: companyName,
            mode: 'insensitive'
          }
        }
      },
      include: {
        company: true
      },
      orderBy: {
        influenceScore: 'desc'
      }
    });

    if (buyerGroupMembers.length === 0) {
      return createErrorResponse(
        `No buyer group found for company: ${companyName}`,
        'BUYER_GROUP_NOT_FOUND',
        404
      );
    }

    // 3. Group members by role
    const roles = {
      decision: [],
      champion: [],
      stakeholder: [],
      blocker: [],
      introducer: []
    };

    buyerGroupMembers.forEach(member => {
      if (member.buyerGroupRole && roles[member.buyerGroupRole]) {
        roles[member.buyerGroupRole].push({
          id: member.id,
          name: member.fullName,
          title: member.jobTitle,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedinUrl,
          confidence: member.influenceScore,
          influenceScore: member.influenceScore
        });
      }
    });

    // 4. Format response
    const responseData = {
      success: true,
      companyName: companyName,
      website: buyerGroupMembers[0]?.company?.website || null,
      industry: buyerGroupMembers[0]?.company?.industry || null,
      companySize: buyerGroupMembers[0]?.company?.size || null,
      totalMembers: buyerGroupMembers.length,
      roles: roles,
      members: buyerGroupMembers.map(member => ({
        id: member.id,
        name: member.fullName,
        title: member.jobTitle,
        role: member.buyerGroupRole,
        email: member.email,
        phone: member.phone,
        linkedin: member.linkedinUrl,
        confidence: member.influenceScore,
        influenceScore: member.influenceScore
      })),
      createdAt: buyerGroupMembers[0]?.createdAt,
      updatedAt: buyerGroupMembers[0]?.updatedAt
    };

    return createSuccessResponse(responseData, 'BUYER_GROUP_RETRIEVED');

  } catch (error) {
    console.error('❌ [BUYER GROUP API] Error retrieving buyer group:', error);
    
    return createErrorResponse(
      `Failed to retrieve buyer group: ${error.message}`,
      'BUYER_GROUP_RETRIEVAL_ERROR',
      500
    );
  }
}

