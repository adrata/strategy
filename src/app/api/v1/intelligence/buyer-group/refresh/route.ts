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
 * V1 BUYER GROUP REFRESH API
 * 
 * POST: Refresh stale buyer group data (force re-processing)
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
      enrichmentLevel = 'enrich', // Default to medium level
    } = body;

    // 3. Validate
    if (!companyName || typeof companyName !== 'string' || companyName.trim().length < 2) {
      return createErrorResponse(
        'Valid company name is required',
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
      `🔄 [V1 REFRESH API] Refreshing ${companyName} at ${enrichmentLevel.toUpperCase()} level (workspace: ${workspaceId})`
    );

    // 4. First, delete existing buyer group data for this company
    const { prisma } = await import('@/platform/database/prisma-client');
    
    const deleted = await prisma.people.updateMany({
      where: {
        workspaceId,
        buyerGroupRole: { not: null },
        company: {
          name: { equals: companyName, mode: 'insensitive' },
        },
      },
      data: {
        buyerGroupRole: null,
        buyerGroupConfidence: null,
        influenceScore: null,
      },
    });

    console.log(`   🗑️ Cleared buyer group roles from ${deleted.count} existing people`);

    // 5. Re-process with new data (bypassing cache)
    const engine = new BuyerGroupEngine();
    
    // Clear cache for this company (force fresh data)
    const cacheKey = `${companyName.toLowerCase()}:${enrichmentLevel}`;
    (engine as any).cache.delete(cacheKey);

    const result = await engine.discover({
      companyName: companyName.trim(),
      enrichmentLevel,
      workspaceId,
      options: {
        saveToDatabase: true, // Always save on refresh
      },
    });

    // 6. Return response
    console.log(
      `✅ [V1 REFRESH API] Refreshed: ${result.buyerGroup.totalMembers} members, ${result.processingTime}ms`
    );

    return createSuccessResponse(
      {
        success: true,
        refreshed: true,
        previousMembers: deleted.count,
        newMembers: result.buyerGroup.totalMembers,
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
          cacheUtilized: result.cacheUtilized, // Should be false
          databaseId: result.databaseId,
        },
      },
      'BUYER_GROUP_REFRESHED'
    );
  } catch (error) {
    console.error('❌ [V1 REFRESH API] Error:', error);

    return createErrorResponse(
      `Buyer group refresh failed: ${error.message}`,
      'BUYER_GROUP_REFRESH_ERROR',
      500,
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      }
    );
  }
}

/**
 * GET: API info
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'V1 Buyer Group Refresh',
    version: '1.0',
    description: 'Force refresh stale buyer group data by re-processing from scratch',
    method: 'POST',
    parameters: {
      required: ['companyName'],
      optional: ['enrichmentLevel'],
    },
    behavior: {
      cacheBypass: 'Clears cache and forces fresh API calls',
      databaseUpdate: 'Removes old buyer group roles and saves new ones',
      costImplication: 'Full cost of enrichmentLevel will be charged',
    },
    example: {
      companyName: 'Salesforce',
      enrichmentLevel: 'enrich',
    },
  });
}

