import { NextRequest, NextResponse } from 'next/server';
import {
  getSecureApiContext,
  createErrorResponse,
  createSuccessResponse,
} from '@/platform/services/secure-api-helper';
import { BuyerGroupEngine } from '@/platform/intelligence/buyer-group/buyer-group-engine';
import type { EnrichmentLevel } from '@/platform/intelligence/shared/types';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * V1 BUYER GROUP API
 * 
 * POST: Discover buyer group with progressive enrichment
 * GET: Retrieve saved buyer group from database
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const workspaceId = context.workspaceId;
    const userId = context.userId;

    // 2. Parse request
    const body = await request.json();
    const {
      companyName,
      website,
      enrichmentLevel = 'enrich', // Default to medium level
      saveToDatabase = true,
    } = body;

    // 3. Validate
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return createErrorResponse(
        'Valid company name is required (minimum 2 characters)',
        'INVALID_COMPANY_NAME',
        400
      );
    }

    const validLevels: EnrichmentLevel[] = ['identify', 'enrich', 'deep_research'];
    if (!validLevels.includes(enrichmentLevel)) {
      return createErrorResponse(
        `Invalid enrichment level. Must be one of: ${validLevels.join(', ')}`,
        'INVALID_ENRICHMENT_LEVEL',
        400
      );
    }

    console.log(
      `🎯 [V1 BUYER GROUP API] ${enrichmentLevel.toUpperCase()}: ${companyName} (workspace: ${workspaceId}, user: ${userId})`
    );

    // 4. Process with new engine
    const engine = new BuyerGroupEngine();
    const result = await engine.discover({
      companyName: companyName.trim(),
      website: website?.trim(),
      enrichmentLevel,
      workspaceId,
      options: {
        saveToDatabase,
      },
    });

    // 5. Return response
    console.log(
      `✅ [V1 BUYER GROUP API] Success: ${result.buyerGroup.totalMembers} members, ${result.processingTime}ms, $${result.costEstimate.toFixed(2)}`
    );

    return createSuccessResponse(
      {
        success: true,
        companyName: result.buyerGroup.companyName,
        website: result.buyerGroup.website,
        industry: result.buyerGroup.industry,
        companySize: result.buyerGroup.companySize,
        buyerGroup: {
          totalMembers: result.buyerGroup.totalMembers,
          cohesionScore: result.buyerGroup.cohesionScore,
          overallConfidence: result.buyerGroup.overallConfidence,
          roles: result.buyerGroup.roles,
          members: result.buyerGroup.members,
        },
        metadata: {
          enrichmentLevel: result.enrichmentLevel,
          processingTime: result.processingTime,
          costEstimate: result.costEstimate,
          timestamp: result.timestamp,
          cacheUtilized: result.cacheUtilized,
          databaseId: result.databaseId,
        },
      },
      'BUYER_GROUP_DISCOVERED'
    );
  } catch (error) {
    console.error('❌ [V1 BUYER GROUP API] Error:', error);

    return createErrorResponse(
      `Buyer group discovery failed: ${error.message}`,
      'BUYER_GROUP_ERROR',
      500,
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    );
  }
}

/**
 * GET: Retrieve saved buyer group
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (response) return response;
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
      `🔍 [V1 BUYER GROUP API] Retrieving: ${companyName} (workspace: ${workspaceId})`
    );

    // 2. Retrieve from database
    const engine = new BuyerGroupEngine();
    const buyerGroup = await engine.retrieve(companyName, workspaceId);

    if (!buyerGroup) {
      return createErrorResponse(
        `No buyer group found for company: ${companyName}`,
        'BUYER_GROUP_NOT_FOUND',
        404
      );
    }

    // 3. Return response
    return createSuccessResponse(
      {
        success: true,
        companyName: buyerGroup.companyName,
        website: buyerGroup.website,
        industry: buyerGroup.industry,
        companySize: buyerGroup.companySize,
        buyerGroup: {
          totalMembers: buyerGroup.totalMembers,
          cohesionScore: buyerGroup.cohesionScore,
          overallConfidence: buyerGroup.overallConfidence,
          roles: buyerGroup.roles,
          members: buyerGroup.members,
        },
      },
      'BUYER_GROUP_RETRIEVED'
    );
  } catch (error) {
    console.error('❌ [V1 BUYER GROUP API] Retrieval error:', error);

    return createErrorResponse(
      `Failed to retrieve buyer group: ${error.message}`,
      'BUYER_GROUP_RETRIEVAL_ERROR',
      500
    );
  }
}

