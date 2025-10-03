/**
 * 🔍 DATA QUALITY AUDIT API
 * 
 * Endpoint for auditing and fixing employment data quality issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmploymentVerificationService } from '@/platform/services/data-quality/employment-verification-service';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export async function GET(request: NextRequest) {
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
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'audit';

    // Authentication is handled by middleware and secure-api-helper

    const verificationService = new EmploymentVerificationService();

    if (action === 'audit') {
      // Generate comprehensive audit report
      const report = await verificationService.generateDataQualityReport(workspaceId);
      
      return createSuccessResponse(data, {
      ...meta,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    } else if (action === 'fix') {
      // Apply high confidence fixes
      const fixResults = await verificationService.applyHighConfidenceFixes(workspaceId);
      
      return createSuccessResponse(data, {
      ...meta,
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role
    });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "audit" or "fix"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [DATA QUALITY AUDIT] Error:', error);
    
    return createErrorResponse(
      'Data quality audit failed',
      'DATA_QUALITY_AUDIT_ERROR',
      500
    );
  }
}
