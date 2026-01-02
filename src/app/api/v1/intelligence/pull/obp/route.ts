import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/pull/obp
 * Organizational Behavioral Physics - PULL Intelligence Analysis
 *
 * Analyzes a target company's organizational structure to predict buying behavior
 * using the OBP framework:
 * - Staffing ratio tensions
 * - Leadership dynamics (new leaders, 90-day windows)
 * - Growth pressure
 * - Resource constraints (funding stage)
 * - Reporting structure implications
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
    const { yourCompany, targetCompany, productContext } = body;

    if (!targetCompany?.name && !targetCompany?.website) {
      return createErrorResponse('Target company name or website is required', 'MISSING_TARGET', 400);
    }

    console.log(`🎯 [OBP API] Running Organizational Behavioral Physics analysis for: ${targetCompany.name || targetCompany.website}`);

    // Dynamic import of OBP modules to avoid bundling issues
    const { OBPPipeline } = await import('@/../scripts/_future_now/find-optimal-company/modules/OBPPipeline');
    const { OBPReportGenerator } = await import('@/../scripts/_future_now/find-optimal-company/modules/OBPReportGenerator');

    // Build product context from inputs
    const productContextForPipeline = {
      productName: productContext?.productName || yourCompany?.name || 'Your Product',
      primaryProblem: productContext?.problemStatement || 'Business problem you solve',
      quickWinMetric: 'Key value metric',
      targetDepartments: productContext?.targetDepartments || ['security', 'compliance'],
      championTitles: [],
      economicBuyerTitles: [],
      matureCompanies: [],
      competitors: [],
      ratios: {}
    };

    // Create and run OBP pipeline
    const pipeline = new OBPPipeline({
      productContext: productContextForPipeline,
      verbose: false
    });

    const obpResult = await pipeline.analyze({
      name: targetCompany.name,
      domain: targetCompany.website?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
      linkedinUrl: targetCompany.linkedinUrl
    });

    if (!obpResult.success) {
      console.error(`❌ [OBP API] Analysis failed: ${obpResult.error}`);
      return NextResponse.json({
        success: false,
        error: obpResult.error || 'Analysis failed',
        company: targetCompany.name,
        pullScore: 0,
        classification: {
          category: 'NOT_IN_MARKET',
          description: 'Unable to analyze',
          score: 0
        },
        tensions: {
          ratio: { score: 0, implication: 'Unable to calculate' },
          leadership: { score: 0, implication: 'Unable to calculate' },
          growth: { score: 0, implication: 'Unable to calculate' },
          resource: { score: 0, implication: 'Unable to calculate' },
          reporting: { score: 0, implication: 'Unable to calculate' }
        },
        analyzedAt: new Date().toISOString(),
        processingTime: Date.now() - startTime
      });
    }

    // Generate HTML report (optional - for download)
    let htmlReportUrl = null;
    try {
      const reportGenerator = new OBPReportGenerator({
        productConfig: {
          product: {
            name: productContext?.productName || yourCompany?.name || 'Your Product',
            company: yourCompany?.name || 'Your Company'
          },
          reportBranding: {
            primaryColor: '#6366F1',
            secondaryColor: '#4F46E5',
            accentColor: '#818CF8',
            gradientStart: '#6366F1',
            gradientEnd: '#8B5CF6'
          }
        }
      });

      const report = reportGenerator.generateReport(obpResult);
      // In production, this would upload to S3/cloud storage
      // For now, the report is generated locally
      htmlReportUrl = report.filepath;
    } catch (reportError) {
      console.warn('Could not generate HTML report:', reportError);
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ [OBP API] Analysis complete in ${processingTime}ms - PULL Score: ${obpResult.pullScore}/100`);

    // Return the OBP result
    return NextResponse.json({
      success: true,
      company: obpResult.company,
      pullScore: obpResult.pullScore,
      classification: obpResult.classification,
      executiveSummary: obpResult.executiveSummary,
      champion: obpResult.champion || null,
      tensions: obpResult.tensions,
      predictions: obpResult.predictions || null,
      strategy: obpResult.strategy || null,
      internalDialogue: obpResult.internalDialogue || null,
      htmlReportUrl,
      analyzedAt: obpResult.analyzedAt || new Date().toISOString(),
      processingTime,
      orgDataSource: obpResult.orgDataSource
    });

  } catch (error) {
    console.error('OBP API Error:', error);
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 OBP PULL INTELLIGENCE API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to run OBP analysis',
      'OBP_ANALYSIS_ERROR',
      500
    );
  }
}
