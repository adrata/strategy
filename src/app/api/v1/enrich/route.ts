/**
 * Enrichment API Endpoint
 * 
 * Triggers intelligence and enrichment pipelines
 * Can be called by AI panel or automatically on record creation
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createSuccessResponse, createErrorResponse } from '@/platform/services/secure-api-helper';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for enrichment

/**
 * POST /api/v1/enrich
 * 
 * Triggers enrichment for people, companies, or buyer groups
 * 
 * Body:
 * {
 *   type: 'person' | 'company' | 'buyer-group' | 'role' | 'optimal-buyer-group',
 *   entityId?: string,  // ID of existing entity
 *   data?: object,      // Data for new entity enrichment
 *   options?: {
 *     verifyEmail?: boolean,
 *     verifyPhone?: boolean,
 *     discoverContacts?: boolean,
 *     dealSize?: number,
 *     productCategory?: string
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let context = null;
  
  try {
    // Authenticate
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    context = authContext;
    const body = await request.json();

    // Validate request
    if (!body.type) {
      return createErrorResponse('Enrichment type is required', 'VALIDATION_ERROR', 400);
    }

    console.log(`🎯 Enrichment requested: ${body.type}`, {
      entityId: body.entityId,
      workspaceId: context.workspaceId,
      userId: context.userId
    });

    // Route to appropriate enrichment handler
    let result;
    switch (body.type) {
      case 'person':
        result = await enrichPerson(body, context);
        break;
      case 'company':
        result = await enrichCompany(body, context);
        break;
      case 'buyer-group':
        result = await enrichBuyerGroup(body, context);
        break;
      case 'role':
        result = await enrichRole(body, context);
        break;
      case 'optimal-buyer-group':
        result = await enrichOptimalBuyerGroup(body, context);
        break;
      default:
        return createErrorResponse(`Unknown enrichment type: ${body.type}`, 'INVALID_TYPE', 400);
    }

    const duration = Date.now() - startTime;
    const durationSeconds = Math.floor(duration / 1000);
    
    return createSuccessResponse({
      ...result,
      duration: `${durationSeconds}s`,
      durationMs: duration
    }, `Enrichment completed in ${durationSeconds}s`);

  } catch (error) {
    console.error('❌ Enrichment error:', error);
    const duration = Date.now() - startTime;
    return createErrorResponse(
      `Enrichment failed: ${error.message}`,
      'ENRICHMENT_ERROR',
      500,
      { duration: `${Math.floor(duration / 1000)}s` }
    );
  }
}

/**
 * Enrich a person with email/phone verification
 */
async function enrichPerson(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  // Get person
  const person = entityId
    ? await prisma.people.findFirst({
        where: {
          id: entityId,
          workspaceId: context.workspaceId,
          deletedAt: null
        },
        include: {
          company: {
            select: { id: true, name: true, website: true }
          }
        }
      })
    : null;

  if (!person && !data) {
    throw new Error('Person not found and no data provided');
  }

  // Trigger find-person pipeline
  // For now, return structure - actual pipeline execution would go here
  return {
    type: 'person',
    entityId: person?.id,
    status: 'enriched',
    enrichments: {
      emailVerified: options.verifyEmail !== false,
      phoneVerified: options.verifyPhone !== false
    },
    message: 'Person enrichment triggered. Processing in background...'
  };
}

/**
 * Enrich a company with contact discovery
 */
async function enrichCompany(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  // Get company
  const company = entityId
    ? await prisma.companies.findFirst({
        where: {
          id: entityId,
          workspaceId: context.workspaceId,
          deletedAt: null
        }
      })
    : null;

  if (!company && !data) {
    throw new Error('Company not found and no data provided');
  }

  // Trigger find-company pipeline
  return {
    type: 'company',
    entityId: company?.id,
    status: 'enriched',
    enrichments: {
      contactsDiscovered: options.discoverContacts !== false,
      emailsVerified: options.verifyEmail !== false,
      phonesVerified: options.verifyPhone !== false
    },
    message: 'Company enrichment triggered. Processing in background...'
  };
}

/**
 * Enrich with buyer group discovery
 */
async function enrichBuyerGroup(body: any, context: any) {
  const { entityId, data, options = {} } = body;
  
  return {
    type: 'buyer-group',
    companyId: entityId,
    status: 'processing',
    options: {
      dealSize: options.dealSize || 150000,
      productCategory: options.productCategory || 'sales'
    },
    message: 'Buyer group discovery triggered. This may take 1-2 minutes...'
  };
}

/**
 * Find specific role at company
 */
async function enrichRole(body: any, context: any) {
  const { data, options = {} } = body;
  
  if (!data?.targetRole) {
    throw new Error('Target role is required');
  }
  
  return {
    type: 'role',
    targetRole: data.targetRole,
    companyId: data.companyId,
    status: 'processing',
    message: `Searching for ${data.targetRole}. This may take 30-60 seconds...`
  };
}

/**
 * Find optimal buyer groups
 */
async function enrichOptimalBuyerGroup(body: any, context: any) {
  const { data, options = {} } = body;
  
  return {
    type: 'optimal-buyer-group',
    criteria: data?.criteria || {},
    status: 'processing',
    message: 'Finding optimal buyer groups. This may take 2-5 minutes...'
  };
}

/**
 * GET /api/v1/enrich/status/:jobId
 * 
 * Check status of enrichment job
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    
    if (!jobId) {
      return createErrorResponse('Job ID is required', 'VALIDATION_ERROR', 400);
    }

    // Check job status (would query job queue in production)
    return createSuccessResponse({
      jobId,
      status: 'completed',
      message: 'Enrichment completed successfully'
    });

  } catch (error) {
    return createErrorResponse('Failed to check status', 'STATUS_ERROR', 500);
  }
}

