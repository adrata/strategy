/**
 * Company Enrichment Status API
 * 
 * GET /api/v1/companies/[id]/enrichment-status
 * Returns the current enrichment status for a company
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createSuccessResponse, createErrorResponse } from '@/platform/services/secure-api-helper';
import { EnrichmentService } from '@/platform/services/enrichment-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    const companyId = params.id;

    if (!companyId) {
      return createErrorResponse('Company ID is required', 'VALIDATION_ERROR', 400);
    }

    // Get enrichment status
    const statusResult = await EnrichmentService.getEnrichmentStatus('company', companyId);

    return createSuccessResponse({
      companyId,
      ...statusResult
    });

  } catch (error) {
    console.error('Error getting enrichment status:', error);
    return createErrorResponse(
      `Failed to get enrichment status: ${error instanceof Error ? error.message : String(error)}`,
      'ENRICHMENT_STATUS_ERROR',
      500
    );
  }
}

