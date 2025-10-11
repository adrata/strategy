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
 * V1 BULK BUYER GROUP API
 * 
 * POST: Batch process multiple companies with progressive enrichment
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
      companies, // Array of company names or objects with {name, website}
      accounts, // Legacy support
      enrichmentLevel = 'enrich', // Default to medium level
      saveToDatabase = true,
    } = body;

    // Support both 'companies' and 'accounts' parameters
    const companyList = companies || accounts;

    // 3. Validate
    if (!companyList || !Array.isArray(companyList) || companyList.length === 0) {
      return createErrorResponse(
        'Valid companies array is required',
        'INVALID_COMPANIES',
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
      `🚀 [V1 BULK API] Processing ${companyList.length} companies at ${enrichmentLevel.toUpperCase()} level (workspace: ${workspaceId})`
    );

    // 4. Normalize company list
    const requests = companyList.map((item) => {
      const companyName = typeof item === 'string' ? item : item.name;
      const website = typeof item === 'string' ? undefined : item.website;

      return {
        companyName,
        website,
        enrichmentLevel,
        workspaceId,
        options: {
          saveToDatabase,
        },
      };
    });

    // 5. Process with engine
    const startTime = Date.now();
    const engine = new BuyerGroupEngine();
    const results = await engine.discoverBatch(requests);
    const totalTime = Date.now() - startTime;

    // 6. Calculate summary stats
    const totalMembers = results.reduce(
      (sum, r) => sum + r.buyerGroup.totalMembers,
      0
    );
    const avgConfidence =
      results.reduce((sum, r) => sum + r.buyerGroup.overallConfidence, 0) /
      results.length;
    const avgCohesion =
      results.reduce((sum, r) => sum + r.buyerGroup.cohesionScore, 0) /
      results.length;
    const totalCost = results.reduce((sum, r) => sum + r.costEstimate, 0);
    const cacheHits = results.filter((r) => r.cacheUtilized).length;

    // 7. Format response
    console.log(
      `✅ [V1 BULK API] Complete: ${results.length}/${companyList.length} companies, ${totalMembers} members, ${totalTime}ms, $${totalCost.toFixed(2)}`
    );

    return createSuccessResponse(
      {
        success: true,
        summary: {
          companiesRequested: companyList.length,
          companiesProcessed: results.length,
          totalMembers,
          avgMembersPerCompany: Math.round((totalMembers / results.length) * 100) / 100,
          avgConfidence: Math.round(avgConfidence),
          avgCohesionScore: Math.round(avgCohesion * 10) / 10,
          totalCost,
          avgCostPerCompany: Math.round((totalCost / results.length) * 100) / 100,
          processingTimeMs: totalTime,
          avgProcessingTimePerCompany: Math.round(totalTime / companyList.length),
          cacheHitRate: Math.round((cacheHits / results.length) * 100),
          enrichmentLevel,
        },
        results: results.map((r) => ({
          companyName: r.buyerGroup.companyName,
          website: r.buyerGroup.website,
          industry: r.buyerGroup.industry,
          companySize: r.buyerGroup.companySize,
          buyerGroup: {
            totalMembers: r.buyerGroup.totalMembers,
            cohesionScore: r.buyerGroup.cohesionScore,
            overallConfidence: r.buyerGroup.overallConfidence,
            roles: r.buyerGroup.roles,
            members: r.buyerGroup.members,
          },
          metadata: {
            enrichmentLevel: r.enrichmentLevel,
            processingTime: r.processingTime,
            costEstimate: r.costEstimate,
            timestamp: r.timestamp,
            cacheUtilized: r.cacheUtilized,
            databaseId: r.databaseId,
          },
        })),
      },
      'BULK_BUYER_GROUP_COMPLETE'
    );
  } catch (error) {
    console.error('❌ [V1 BULK API] Error:', error);

    return createErrorResponse(
      `Bulk buyer group discovery failed: ${error.message}`,
      'BULK_BUYER_GROUP_ERROR',
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
    endpoint: 'V1 Bulk Buyer Group Discovery',
    version: '1.0',
    description: 'Batch process multiple companies with progressive enrichment',
    method: 'POST',
    parameters: {
      required: ['companies'],
      optional: ['enrichmentLevel', 'saveToDatabase'],
    },
    enrichmentLevels: {
      identify: {
        speed: '<5s per company',
        cost: '~$0.10 per company',
        includes: 'Names, titles, roles',
      },
      enrich: {
        speed: '<30s per company',
        cost: '~$2-3 per company',
        includes: 'Identify + email, phone, LinkedIn',
      },
      deep_research: {
        speed: '<2min per company',
        cost: '~$5-8 per company',
        includes: 'Enrich + career analysis, relationships, signals',
      },
    },
    example: {
      companies: ['Salesforce', 'HubSpot', 'Dell'],
      enrichmentLevel: 'enrich',
    },
  });
}

