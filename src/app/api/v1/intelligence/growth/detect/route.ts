/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * SALES INTENT DETECTION API ENDPOINT
 * 
 * POST /api/v1/intelligence/sales-intent/detect
 * 
 * Detects sales intent from company hiring patterns and growth signals
 * Uses CoreSignal Jobs data for analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectSalesIntent, getHiringTrends, identifyGrowthSignals } from '@/platform/pipelines/functions/providers/coresignal-jobs';

// ============================================================================
// TYPES
// ============================================================================

interface SalesIntentRequest {
  company: string;
  timeframe?: 'last_week' | 'last_month' | 'last_quarter' | 'last_year';
  options?: {
    includeHiringTrends?: boolean;
    includeGrowthSignals?: boolean;
    includeCompetitiveAnalysis?: boolean;
  };
}

interface SalesIntentResponse {
  success: boolean;
  data?: {
    company: string;
    salesIntent: {
      score: number; // 0-100
      level: 'low' | 'medium' | 'high' | 'critical';
      signals: string[];
      confidence: number;
    };
    hiringActivity: {
      totalJobs: number;
      salesRoles: number;
      engineeringRoles: number;
      leadershipRoles: number;
      otherRoles: number;
      monthlyHiringRate: number;
      percentageChange: number;
    };
    growthIndicators?: string[];
    hiringTrends?: {
      timeframe: string;
      totalJobs: number;
      monthlyHiringRate: number;
      percentageChange: number;
      jobsByDepartment: Record<string, number>;
      topDepartments: string[];
    };
    competitiveAnalysis?: {
      marketPosition: string;
      hiringVelocity: 'slow' | 'moderate' | 'fast' | 'aggressive';
      expansionAreas: string[];
    };
  };
  metadata?: {
    executionTime: number;
    timestamp: string;
    dataSource: string;
  };
  error?: string;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    console.log(`\n🎯 [SALES INTENT API] Starting analysis...`);
    
    // Parse request body
    const body: SalesIntentRequest = await request.json();
    
    // Validate required fields
    if (!body.company) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: company'
      }, { status: 400 });
    }
    
    const timeframe = body.timeframe || 'last_quarter';
    console.log(`   Company: ${body.company}`);
    console.log(`   Timeframe: ${timeframe}`);
    
    // Detect sales intent
    const salesIntent = await detectSalesIntent(body.company, timeframe, {});
    console.log(`   Sales Intent Score: ${salesIntent.score}/100 (${salesIntent.level})`);
    
    // Get hiring trends if requested
    let hiringTrends;
    if (body.options?.includeHiringTrends !== false) {
      try {
        hiringTrends = await getHiringTrends([body.company], timeframe, {});
        console.log(`   Hiring Trends: ${hiringTrends[0]?.totalJobs || 0} total jobs`);
      } catch (error) {
        console.warn(`   ⚠️ Hiring trends failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Get growth signals if requested
    let growthIndicators;
    if (body.options?.includeGrowthSignals !== false) {
      try {
        growthIndicators = await identifyGrowthSignals(body.company, timeframe, {});
        console.log(`   Growth Indicators: ${growthIndicators.length} signals`);
      } catch (error) {
        console.warn(`   ⚠️ Growth signals failed:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }
    
    // Prepare response
    const response: SalesIntentResponse = {
      success: true,
      data: {
        company: body.company,
        salesIntent: {
          score: salesIntent.score,
          level: salesIntent.level,
          signals: salesIntent.signals,
          confidence: salesIntent.confidence
        },
        hiringActivity: salesIntent.hiringActivity,
        growthIndicators,
        hiringTrends: hiringTrends?.[0],
        competitiveAnalysis: {
          marketPosition: determineMarketPosition(salesIntent.score),
          hiringVelocity: determineHiringVelocity(salesIntent.hiringActivity.monthlyHiringRate),
          expansionAreas: extractExpansionAreas(salesIntent.hiringActivity)
        }
      },
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        dataSource: 'CoreSignal Jobs API'
      }
    };
    
    const executionTime = Date.now() - startTime;
    
    console.log(`\n✅ [SALES INTENT API] Complete (${executionTime}ms)`);
    console.log(`   Intent Level: ${salesIntent.level}`);
    console.log(`   Total Jobs: ${salesIntent.hiringActivity.totalJobs}`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error(`\n❌ [SALES INTENT API] Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        executionTime,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}

// ============================================================================
// GET HANDLER (Documentation)
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/sales-intent/detect',
    method: 'POST',
    description: 'Detect sales intent from company hiring patterns and growth signals',
    features: [
      'Sales intent scoring (0-100)',
      'Hiring activity analysis',
      'Growth signal identification',
      'Competitive positioning',
      'Department expansion tracking'
    ],
    requestBody: {
      company: 'string (required)',
      timeframe: 'string (optional) - last_week | last_month | last_quarter | last_year',
      options: {
        includeHiringTrends: 'boolean (optional, default: true)',
        includeGrowthSignals: 'boolean (optional, default: true)',
        includeCompetitiveAnalysis: 'boolean (optional, default: true)'
      }
    },
    response: {
      success: 'boolean',
      data: {
        company: 'string',
        salesIntent: {
          score: 'number (0-100)',
          level: 'string (low | medium | high | critical)',
          signals: 'string[]',
          confidence: 'number'
        },
        hiringActivity: {
          totalJobs: 'number',
          salesRoles: 'number',
          engineeringRoles: 'number',
          leadershipRoles: 'number',
          monthlyHiringRate: 'number',
          percentageChange: 'number'
        },
        growthIndicators: 'string[]',
        hiringTrends: 'object',
        competitiveAnalysis: 'object'
      },
      metadata: {
        executionTime: 'number',
        timestamp: 'string',
        dataSource: 'string'
      }
    },
    examples: {
      basic: {
        company: 'Salesforce'
      },
      detailed: {
        company: 'HubSpot',
        timeframe: 'last_quarter',
        options: {
          includeHiringTrends: true,
          includeGrowthSignals: true,
          includeCompetitiveAnalysis: true
        }
      }
    },
    salesIntentLevels: {
      low: '0-25: Minimal hiring activity, stable operations',
      medium: '26-50: Moderate growth, some expansion',
      high: '51-75: Strong growth signals, active hiring',
      critical: '76-100: Aggressive expansion, high priority target'
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determine market position based on sales intent score
 */
function determineMarketPosition(score: number): string {
  if (score >= 80) return 'Market Leader';
  if (score >= 60) return 'Strong Challenger';
  if (score >= 40) return 'Emerging Player';
  if (score >= 20) return 'Stable Player';
  return 'Declining';
}

/**
 * Determine hiring velocity based on monthly hiring rate
 */
function determineHiringVelocity(monthlyRate: number): 'slow' | 'moderate' | 'fast' | 'aggressive' {
  if (monthlyRate >= 50) return 'aggressive';
  if (monthlyRate >= 20) return 'fast';
  if (monthlyRate >= 10) return 'moderate';
  return 'slow';
}

/**
 * Extract expansion areas from hiring activity
 */
function extractExpansionAreas(hiringActivity: any): string[] {
  const areas: string[] = [];
  
  if (hiringActivity.salesRoles > 5) areas.push('Sales Team Expansion');
  if (hiringActivity.engineeringRoles > 10) areas.push('Engineering Capacity');
  if (hiringActivity.leadershipRoles > 2) areas.push('Leadership Growth');
  
  return areas;
}
