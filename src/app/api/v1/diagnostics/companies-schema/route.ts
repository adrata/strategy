import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { getSecureApiContext } from '@/platform/services/unified-auth-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  let context = null;
  try {
    const { context: authContext, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }
    if (!authContext) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }
    context = authContext;

    console.log('🔍 [COMPANIES SCHEMA DIAGNOSTIC] Checking companies table schema...');

    // Get actual database schema for companies table
    const dbSchema = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'companies'
      ORDER BY ordinal_position;
    `;

    // Get Prisma's expected schema
    const dmmf = prisma._dmmf;
    const companyModel = dmmf.datamodel.models.find(m => m.name === 'companies');

    if (!companyModel) {
      return createErrorResponse('Companies model not found in Prisma schema', 'SCHEMA_ERROR', 500);
    }

    const expectedFields = companyModel.fields.map(f => ({
      name: f.name,
      type: f.type,
      isRequired: f.isRequired,
      hasDefaultValue: f.hasDefaultValue,
      kind: f.kind,
    }));

    // Test minimal company creation
    let testResult = null;
    try {
      const testCompany = await prisma.companies.create({
        data: {
          name: `Test Company ${Date.now()}`,
          workspaceId: context.workspaceId,
        }
      });
      
      // Clean up
      await prisma.companies.delete({
        where: { id: testCompany.id }
      });
      
      testResult = { success: true, message: 'Minimal company creation successful' };
    } catch (error: any) {
      testResult = {
        success: false,
        error: error.message,
        code: error.code,
        meta: error.meta
      };
    }

    return createSuccessResponse({
      message: 'Companies schema diagnostic complete',
      actualDatabaseSchema: dbSchema,
      expectedPrismaSchema: expectedFields,
      testResult: testResult,
      recommendations: testResult?.success ? [
        'Minimal company creation works. The issue might be with specific fields being sent.',
        'Check the enhanced error logging in the companies API to see which specific field is missing.'
      ] : [
        'Minimal company creation failed. Check the testResult.error for details.',
        'This indicates a fundamental schema mismatch that needs to be resolved.'
      ]
    }, { userId: context.userId, workspaceId: context.workspaceId });

  } catch (error) {
    console.error('❌ [COMPANIES SCHEMA DIAGNOSTIC] Error:', error);
    return createErrorResponse('Failed to perform companies schema diagnostic', 'DIAGNOSTIC_ERROR', 500);
  }
}
