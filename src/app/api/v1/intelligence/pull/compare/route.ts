import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/pull/compare
 * Industry Comparison Scanner - Compare multiple industries to find the best one to target
 *
 * Uses the IndustryComparisonScanner module to:
 * 1. Scan each industry for companies with PULL signals
 * 2. Calculate 7-dimension scores per industry
 * 3. Generate recommendations (PRIORITIZE, FOCUS, TEST, DEPRIORITIZE)
 * 4. Return ranked industry comparison
 *
 * 3 Tiers:
 * - pulse: Quick directional signal (10 companies/industry, ~2-5 min)
 * - scan: Solid comparison (50 companies/industry, ~10-15 min)
 * - deep: Comprehensive analysis (100 companies/industry, ~30-60 min)
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
      industries,
      tier = 'scan',
      employeeRange,
      location
    } = body;

    if (!industries || !Array.isArray(industries) || industries.length < 2) {
      return createErrorResponse('At least 2 industries are required', 'INVALID_INDUSTRIES', 400);
    }

    if (industries.length > 5) {
      return createErrorResponse('Maximum 5 industries can be compared at once', 'TOO_MANY_INDUSTRIES', 400);
    }

    const validTiers = ['pulse', 'scan', 'deep'];
    if (!validTiers.includes(tier)) {
      return createErrorResponse('Invalid tier. Use: pulse, scan, or deep', 'INVALID_TIER', 400);
    }

    console.log(`📊 [Industry Comparison API] Starting comparison`);
    console.log(`   Industries: ${industries.join(', ')}`);
    console.log(`   Tier: ${tier}`);

    // Dynamic import of IndustryComparisonScanner to avoid bundling issues
    const { IndustryComparisonScanner } = await import('@/../scripts/_future_now/find-optimal-company/modules/IndustryComparisonScanner');

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
    const scanner = new IndustryComparisonScanner({
      productContext,
      verbose: true
    });

    // Run the comparison
    const comparisonResult = await scanner.compareIndustries({
      industries,
      tier,
      employeeRange: employeeRange || { min: 50, max: 1000 },
      location: location || undefined,
      onProgress: (progress: {
        currentIndustry: string;
        industryIndex: number;
        totalIndustries: number;
        stage: string;
        companiesScanned: number;
        companiesWithPull: number;
      }) => {
        // In a real implementation, this would push to a WebSocket or SSE stream
        console.log(`   Progress: [${progress.industryIndex + 1}/${progress.totalIndustries}] ${progress.currentIndustry} - ${progress.stage}`);
      }
    });

    const processingTime = Date.now() - startTime;

    if (!comparisonResult.success) {
      console.error(`❌ [Industry Comparison API] Comparison failed: ${comparisonResult.error}`);
      return NextResponse.json({
        success: false,
        error: comparisonResult.error,
        tier,
        industriesCompared: 0,
        results: [],
        topRecommendation: null,
        comparisonDuration: processingTime,
        estimatedCreditsUsed: 0
      });
    }

    console.log(`✅ [Industry Comparison API] Comparison complete in ${processingTime}ms`);
    console.log(`   Industries compared: ${comparisonResult.industriesCompared}`);
    console.log(`   Top recommendation: ${comparisonResult.topRecommendation?.industry}`);
    console.log(`   Credits used: ${comparisonResult.estimatedCreditsUsed}`);

    // Return the results
    return NextResponse.json({
      success: true,
      tier,
      industriesCompared: comparisonResult.industriesCompared,
      results: comparisonResult.results,
      topRecommendation: comparisonResult.topRecommendation,
      comparisonDuration: processingTime,
      estimatedCreditsUsed: comparisonResult.estimatedCreditsUsed
    });

  } catch (error) {
    console.error('Industry Comparison API Error:', error);
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 Industry Comparison API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to compare industries',
      'INDUSTRY_COMPARE_ERROR',
      500
    );
  }
}
