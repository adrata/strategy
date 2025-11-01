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

    // 4. Import and initialize the buyer group v2 engine
    const { ConsolidatedBuyerGroupEngine } = await import('@/platform/intelligence/buyer-group-v2/engine');
    const engine = new ConsolidatedBuyerGroupEngine();

    // 5. Process the company using v2 engine
    const startTime = Date.now();
    const result = await engine.discoverBuyerGroup({
      companyName: companyName.trim(),
      companyId: undefined,
      companyLinkedInUrl: undefined,
      workspaceId,
      enrichmentLevel: 'enrich',
      sellerProfile: sellerProfile || undefined
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
      companyName: result.company.name,
      website: result.company.website,
      industry: result.company.industry,
      companySize: result.company.size,
      processingTime: processingTime,
      timestamp: new Date().toISOString(),
      buyerGroup: {
        totalMembers: result.buyerGroup.length,
        cohesionScore: result.qualityMetrics.overallScore,
        overallConfidence: result.qualityMetrics.confidence,
        composition: result.composition,
        members: result.buyerGroup.map(member => ({
          name: member.name,
          title: member.title,
          email: member.email,
          phone: member.phone,
          linkedin: member.linkedin,
          role: member.role,
          confidence: member.confidence,
          influenceScore: member.influenceScore,
          priority: member.priority
        }))
      },
      quality: {
        cohesionScore: result.qualityMetrics.overallScore,
        overallConfidence: result.qualityMetrics.confidence,
        dataQuality: result.qualityMetrics.dataQuality,
        coverage: result.qualityMetrics.coverage
      },
      databaseId: savedBuyerGroup?.id || null,
      creditsUsed: result.creditsUsed
    };

    // 8. Include full data if requested (for debugging or detailed analysis)
    if (returnFullData) {
      responseData.fullResult = result;
    }

    console.log(
      `✅ [BUYER GROUP API] Successfully processed ${companyName}: ${result.buyerGroup.length} members, ${result.qualityMetrics.overallScore}% quality score`
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
      companyName: result.company.name,
      website: result.company.website,
      industry: result.company.industry,
      companySize: result.company.size,
      workspaceId,
      companyId: company.id,
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
        linkedin: member.linkedin,
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

