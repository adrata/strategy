import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/company/discover
 * 
 * Discover companies using Target Company Intelligence (people-centric scoring)
 * 
 * Body:
 * {
 *   "firmographics": {
 *     "industry": ["SaaS"],
 *     "employeeRange": { "min": 100, "max": 1000 }
 *   },
 *   "innovationProfile": {
 *     "segment": "innovators"
 *   },
 *   "painSignals": ["hiring_spike", "executive_turnover"],
 *   "minCompanyFitScore": 60,
 *   "limit": 10
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Import pipeline (NEW: Using orchestrators)
    const { CompanyDiscoveryPipeline } = await import('@/platform/pipelines/orchestrators');
    
    const pipeline = new CompanyDiscoveryPipeline();
    const result = await pipeline.discover({
      firmographics: body.firmographics,
      innovationProfile: body.innovationProfile,
      painSignals: body.painSignals,
      minCompanyFitScore: body.minCompanyFitScore || 0,
      limit: body.limit || 100
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Company discovery error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/intelligence/company/discover
 * 
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/company/discover',
    method: 'POST',
    description: 'Discover companies using Target Company Intelligence (people-centric scoring)',
    scoringFormula: 'Company Fit Score = (Firmographics × 30%) + (Innovation × 25%) + (Pain × 25%) + (Buyer Group × 20%)',
    parameters: {
      firmographics: {
        type: 'object',
        required: false,
        description: 'Traditional firmographic criteria',
        properties: {
          industry: 'string[]',
          employeeRange: '{ min: number, max: number }',
          revenue: '{ min: number, max: number }',
          location: 'string[]'
        }
      },
      innovationProfile: {
        type: 'object',
        required: false,
        description: 'Innovation adoption criteria (Diffusion of Innovation)',
        properties: {
          segment: 'innovators | early_adopters | early_majority | late_majority | laggards',
          signals: 'string[] (e.g., tech_stack_modern, thought_leadership)'
        }
      },
      painSignals: {
        type: 'string[]',
        required: false,
        description: 'Pain indicators to detect',
        example: ['hiring_spike', 'executive_turnover', 'manual_processes']
      },
      buyerGroupQuality: {
        type: 'object',
        required: false,
        description: 'Buyer group composition requirements'
      },
      minCompanyFitScore: {
        type: 'number',
        default: 0,
        description: 'Minimum score (0-100) to include in results'
      },
      limit: {
        type: 'number',
        default: 100,
        description: 'Maximum number of companies to return'
      }
    }
  });
}

