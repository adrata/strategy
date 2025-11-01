import { NextRequest, NextResponse } from 'next/server';
import {
  getSecureApiContext,
  createErrorResponse,
  createSuccessResponse,
} from '@/platform/services/secure-api-helper';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * V1 COMPANY SCORING API
 * 
 * POST: Score single company with people-centric approach
 */

export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const { companyName, sellerProfile } = body;

    if (!companyName) {
      return createErrorResponse(
        'Company name is required',
        'MISSING_COMPANY',
        400
      );
    }

    console.log(`🎯 [V1 SCORE API] Scoring ${companyName}`);

    // TODO: Implement single company scoring
    // Same as ICP but for one company

    return createErrorResponse(
      'Company scoring API not yet implemented',
      'NOT_IMPLEMENTED',
      501
    );
  } catch (error) {
    console.error('❌ [V1 SCORE API] Error:', error);
    return createErrorResponse(
      `Company scoring failed: ${error.message}`,
      'COMPANY_SCORING_ERROR',
      500
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: 'V1 Company Scoring',
    version: '1.0',
    description: 'Score single company with people-centric ICP approach',
    method: 'POST',
    parameters: {
      required: ['companyName'],
      optional: ['sellerProfile'],
    },
  });
}

