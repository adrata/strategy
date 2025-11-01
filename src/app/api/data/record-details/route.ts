/**
 * Individual Record Details API
 * Provides lazy loading for non-essential fields to improve performance
 */

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { trackQueryPerformance } from '@/platform/services/database/performance-monitor';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('recordId');
    const recordType = searchParams.get('recordType');
    const fields = searchParams.get('fields')?.split(',') || [];

    if (!recordId || !recordType) {
      return createErrorResponse('Missing required parameters: recordId, recordType', 'MISSING_PARAMS', 400);
    }

    const { workspaceId, userId } = context;

    console.log(`🔍 [RECORD DETAILS] Loading ${recordType} record ${recordId} with fields: ${fields.join(', ')}`);

    // 🚀 PERFORMANCE: Lazy load only requested fields
    const record = await trackQueryPerformance(
      'findUnique',
      recordType,
      workspaceId,
      userId,
      () => loadRecordDetails(recordType, recordId, workspaceId, fields)
    );

    if (!record) {
      return createErrorResponse(`${recordType} record not found`, 'RECORD_NOT_FOUND', 404);
    }

    console.log(`✅ [RECORD DETAILS] Loaded ${recordType} record ${recordId} with ${Object.keys(record).length} fields`);

    return createSuccessResponse(record);

  } catch (error) {
    console.error('❌ Error loading record details:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to load record details',
      'LOAD_ERROR',
      500
    );
  }
}

async function loadRecordDetails(recordType: string, recordId: string, workspaceId: string, fields: string[]) {
  const model = getPrismaModel(recordType);
  if (!model) {
    throw new Error(`Unsupported record type: ${recordType}`);
  }

  // Build select clause based on requested fields
  const selectFields: any = {};
  
  if (fields.length === 0) {
    // If no specific fields requested, return basic fields
    return getBasicFields(recordType, recordId, workspaceId);
  }

  // Add requested fields to select
  fields.forEach(field => {
    selectFields[field] = true;
  });

  // Always include essential fields
  selectFields.id = true;
  selectFields.updatedAt = true;

  const whereClause: any = {
    id: recordId,
    workspaceId
  };

  // Add deletedAt filter for applicable models
  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners'].includes(recordType)) {
    whereClause.deletedAt = null;
  }

  return await model.findUnique({
    where: whereClause,
    select: selectFields
  });
}

async function getBasicFields(recordType: string, recordId: string, workspaceId: string) {
  const model = getPrismaModel(recordType);
  if (!model) {
    throw new Error(`Unsupported record type: ${recordType}`);
  }

  const whereClause: any = {
    id: recordId,
    workspaceId
  };

  if (['leads', 'prospects', 'opportunities', 'companies', 'people', 'clients', 'partners'].includes(recordType)) {
    whereClause.deletedAt = null;
  }

  // Return only essential fields for fast loading
  const basicSelectFields: any = {
    id: true,
    name: recordType === 'companies' ? true : undefined,
    fullName: recordType === 'people' ? true : undefined,
    firstName: recordType === 'people' ? true : undefined,
    lastName: recordType === 'people' ? true : undefined,
    email: true,
    updatedAt: true
  };

  // Remove undefined fields
  Object.keys(basicSelectFields).forEach(key => {
    if (basicSelectFields[key] === undefined) {
      delete basicSelectFields[key];
    }
  });

  return await model.findUnique({
    where: whereClause,
    select: basicSelectFields
  });
}

function getPrismaModel(recordType: string): any {
  const modelMap: { [key: string]: any } = {
    'people': prisma.people,
    'companies': prisma.companies,
    'leads': prisma.leads,
    'prospects': prisma.prospects,
    'opportunities': prisma.opportunities,
    'clients': prisma.clients,
    'partners': prisma.partners
  };

  return modelMap[recordType];
}
