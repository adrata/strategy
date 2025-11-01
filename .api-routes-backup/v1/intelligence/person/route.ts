import { NextRequest, NextResponse } from 'next/server';
import {
  getSecureApiContext,
  createErrorResponse,
  createSuccessResponse,
} from '@/platform/services/secure-api-helper';

// Required for static export compatibility
export const dynamic = 'force-dynamic';

/**
 * V1 PERSON INTELLIGENCE API
 * 
 * GET: Lookup person by name or email
 * POST: Research specific person with progressive enrichment
 */

export async function GET(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (response) return response;
    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const email = searchParams.get('email');

    if (!name && !email) {
      return createErrorResponse(
        'Either name or email parameter is required',
        'MISSING_PARAMETERS',
        400
      );
    }

    console.log(`🔍 [V1 PERSON API] Lookup: ${name || email}`);

    // TODO: Implement person lookup
    // 1. Search database for existing person
    // 2. If not found, search CoreSignal/PDL
    // 3. Return person intelligence

    return createErrorResponse(
      'Person intelligence API not yet implemented',
      'NOT_IMPLEMENTED',
      501
    );
  } catch (error) {
    console.error('❌ [V1 PERSON API] Error:', error);
    return createErrorResponse(
      `Person lookup failed: ${error.message}`,
      'PERSON_LOOKUP_ERROR',
      500
    );
  }
}

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
    const { name, company, enrichmentLevel = 'enrich' } = body;

    if (!name) {
      return createErrorResponse(
        'Person name is required',
        'MISSING_NAME',
        400
      );
    }

    console.log(`🎯 [V1 PERSON API] Research: ${name} at ${company || 'unknown company'}`);

    // TODO: Implement person research
    // 1. Find person via CoreSignal/PDL
    // 2. Apply enrichment level (identify, enrich, deep_research)
    // 3. Save to database
    // 4. Return full person intelligence

    return createErrorResponse(
      'Person research API not yet implemented',
      'NOT_IMPLEMENTED',
      501
    );
  } catch (error) {
    console.error('❌ [V1 PERSON API] Error:', error);
    return createErrorResponse(
      `Person research failed: ${error.message}`,
      'PERSON_RESEARCH_ERROR',
      500
    );
  }
}

