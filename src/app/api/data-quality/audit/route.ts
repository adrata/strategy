/**
 * 🔍 DATA QUALITY AUDIT API
 * 
 * Endpoint for auditing and fixing employment data quality issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { EmploymentVerificationService } from '@/platform/services/data-quality/employment-verification-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'audit';

    if (!workspaceId) {
      return NextResponse.json({
        success: false,
        error: 'Workspace ID is required'
      }, { status: 400 });
    }

    const verificationService = new EmploymentVerificationService();

    if (action === 'audit') {
      // Generate comprehensive audit report
      const report = await verificationService.generateDataQualityReport(workspaceId);
      
      return NextResponse.json({
        success: true,
        data: report,
        meta: {
          timestamp: new Date().toISOString(),
          action: 'audit'
        }
      });
    } else if (action === 'fix') {
      // Apply high confidence fixes
      const fixResults = await verificationService.applyHighConfidenceFixes(workspaceId);
      
      return NextResponse.json({
        success: true,
        data: fixResults,
        meta: {
          timestamp: new Date().toISOString(),
          action: 'fix'
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "audit" or "fix"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [DATA QUALITY AUDIT] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Data quality audit failed'
    }, { status: 500 });
  }
}
