import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/pull/industry
 * Industry PULL Scanner - Scan an industry and rank companies by PULL score
 *
 * Uses the IndustryScanner module to:
 * 1. Discover companies via Coresignal ES DSL search
 * 2. Pre-screen using profile data (free tier)
 * 3. Run deep OBP analysis on top candidates
 * 4. Return ranked results
 */
export async function POST(request: NextRequest) {
  let context: SecureApiContext | null = null;
  const startTime = Date.now();

  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Parse request body
    const body = await request.json();
    const {
      yourCompany,
      industry,
      employeeRange,
      location,
      maxCompanies = 50,
      deepAnalysisCount = 20
    } = body;

    if (!industry) {
      return createErrorResponse('Industry is required', 'MISSING_INDUSTRY', 400);
    }

    console.log(`📊 [Industry Scanner API] Starting scan for: ${industry}`);
    console.log(`   Max companies: ${maxCompanies}, Deep analysis: ${deepAnalysisCount}`);

    // Dynamic import of IndustryScanner to avoid bundling issues
    const { IndustryScanner } = await import('@/../scripts/_future_now/find-optimal-company/modules/IndustryScanner');

    // Build product context from inputs
    const productContext = {
      productName: yourCompany?.name || 'Your Product',
      primaryProblem: 'Business problem you solve',
      quickWinMetric: 'Key value metric',
      targetDepartments: ['security', 'compliance'],
      championTitles: [],
      economicBuyerTitles: [],
      matureCompanies: [],
      competitors: [],
      ratios: {}
    };

    // Create scanner instance
    const scanner = new IndustryScanner({
      productContext,
      verbose: true
    });

    // Run the scan
    const scanResult = await scanner.scanIndustry({
      industry,
      employeeRange: employeeRange || { min: 50, max: 1000 },
      location: location || undefined,
      maxCompanies: Math.min(maxCompanies, 100), // Cap at 100
      deepAnalysisCount: Math.min(deepAnalysisCount, 30), // Cap at 30
      onProgress: (progress: { stage: string; totalCompanies: number; scanned: number; preScreened: number; deepAnalyzed: number; currentCompany: string | null }) => {
        // In a real implementation, this would push to a WebSocket or SSE stream
        console.log(`   Progress: ${progress.stage} - ${progress.scanned}/${progress.totalCompanies}`);
      }
    });

    const processingTime = Date.now() - startTime;

    if (!scanResult.success) {
      console.error(`❌ [Industry Scanner API] Scan failed: ${scanResult.error}`);
      return NextResponse.json({
        success: false,
        error: scanResult.error,
        totalScanned: 0,
        totalAnalyzed: 0,
        rankings: [],
        scanDuration: processingTime
      });
    }

    console.log(`✅ [Industry Scanner API] Scan complete in ${processingTime}ms`);
    console.log(`   Total scanned: ${scanResult.totalScanned}`);
    console.log(`   Total analyzed: ${scanResult.totalAnalyzed}`);
    console.log(`   Top company: ${scanResult.rankings[0]?.company} (Score: ${scanResult.rankings[0]?.pullScore})`);

    // Return the results
    return NextResponse.json({
      success: true,
      totalScanned: scanResult.totalScanned,
      totalAnalyzed: scanResult.totalAnalyzed,
      rankings: scanResult.rankings,
      costUsed: scanResult.costUsed,
      scanDuration: processingTime
    });

  } catch (error) {
    console.error('Industry Scanner API Error:', error);
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 Industry PULL Scanner API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to run industry scan',
      'INDUSTRY_SCAN_ERROR',
      500
    );
  }
}
