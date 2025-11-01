/**
 * EMPLOYEE ANALYTICS API ENDPOINT
 * 
 * POST /api/v1/intelligence/employee/analytics
 * 
 * Analyzes employee growth, movement, and retention patterns
 * Uses CoreSignal multi-source data for comprehensive analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeEmployeeGrowth, trackLeadershipTransitions, predictEmployeeMovements, analyzeDepartmentExpansion } from '@/platform/pipelines/functions/analysis/employee-analytics';

// ============================================================================
// TYPES
// ============================================================================

interface EmployeeAnalyticsRequest {
  company: string;
  timeframe?: 'last_month' | 'last_quarter' | 'last_year';
  analysisType?: 'growth' | 'leadership' | 'movements' | 'departments' | 'comprehensive';
  options?: {
    includePredictions?: boolean;
    includeRetentionMetrics?: boolean;
    includeDepartmentBreakdown?: boolean;
    includeLeadershipChanges?: boolean;
  };
}

interface EmployeeAnalyticsResponse {
  success: boolean;
  data?: {
    company: string;
    timeframe: string;
    analysisType: string;
    
    // Growth Analysis
    growthAnalysis?: {
      totalEmployees: number;
      newHires: number;
      departures: number;
      netGrowth: number;
      growthRate: number;
      healthScore: number;
      trends: {
        period: string;
        hires: number;
        departures: number;
        netGrowth: number;
      }[];
    };
    
    // Leadership Analysis
    leadershipAnalysis?: {
      totalLeadership: number;
      newLeadership: number;
      leadershipDepartures: number;
      leadershipStability: number;
      transitions: {
        from: string;
        to: string;
        date: string;
        type: string;
      }[];
    };
    
    // Movement Predictions
    movementPredictions?: {
      highRiskDepartures: {
        name: string;
        title: string;
        riskScore: number;
        reasons: string[];
      }[];
      potentialHires: {
        role: string;
        probability: number;
        reasoning: string;
      }[];
    };
    
    // Department Analysis
    departmentAnalysis?: {
      departments: {
        name: string;
        currentSize: number;
        growth: number;
        hiringRate: number;
        expansion: boolean;
      }[];
      fastestGrowing: string[];
      mostStable: string[];
    };
    
    // Retention Metrics
    retentionMetrics?: {
      overallRetention: number;
      leadershipRetention: number;
      departmentRetention: Record<string, number>;
      riskFactors: string[];
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
    console.log(`\n📊 [EMPLOYEE ANALYTICS API] Starting analysis...`);
    
    // Parse request body
    const body: EmployeeAnalyticsRequest = await request.json();
    
    // Validate required fields
    if (!body.company) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: company'
      }, { status: 400 });
    }
    
    const timeframe = body.timeframe || 'last_quarter';
    const analysisType = body.analysisType || 'comprehensive';
    
    console.log(`   Company: ${body.company}`);
    console.log(`   Timeframe: ${timeframe}`);
    console.log(`   Analysis Type: ${analysisType}`);
    
    const responseData: any = {
      company: body.company,
      timeframe,
      analysisType
    };
    
    // Perform analysis based on type
    if (analysisType === 'growth' || analysisType === 'comprehensive') {
      console.log(`   📈 Analyzing employee growth...`);
      const growthAnalysis = await analyzeEmployeeGrowth(body.company, timeframe, {});
      responseData.growthAnalysis = growthAnalysis;
    }
    
    if (analysisType === 'leadership' || analysisType === 'comprehensive') {
      console.log(`   👔 Analyzing leadership transitions...`);
      const leadershipAnalysis = await trackLeadershipTransitions(body.company, timeframe, {});
      responseData.leadershipAnalysis = leadershipAnalysis;
    }
    
    if (analysisType === 'movements' || analysisType === 'comprehensive') {
      if (body.options?.includePredictions !== false) {
        console.log(`   🔮 Predicting employee movements...`);
        const movementPredictions = await predictEmployeeMovements(body.company, timeframe, {});
        responseData.movementPredictions = movementPredictions;
      }
    }
    
    if (analysisType === 'departments' || analysisType === 'comprehensive') {
      if (body.options?.includeDepartmentBreakdown !== false) {
        console.log(`   🏢 Analyzing department expansion...`);
        const departmentAnalysis = await analyzeDepartmentExpansion(body.company, timeframe, {});
        responseData.departmentAnalysis = departmentAnalysis;
      }
    }
    
    // Add retention metrics if requested
    if (body.options?.includeRetentionMetrics !== false && analysisType === 'comprehensive') {
      console.log(`   📊 Calculating retention metrics...`);
      responseData.retentionMetrics = calculateRetentionMetrics(responseData);
    }
    
    const response: EmployeeAnalyticsResponse = {
      success: true,
      data: responseData,
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        dataSource: 'CoreSignal Multi-Source API'
      }
    };
    
    const executionTime = Date.now() - startTime;
    
    console.log(`\n✅ [EMPLOYEE ANALYTICS API] Complete (${executionTime}ms)`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error(`\n❌ [EMPLOYEE ANALYTICS API] Error:`, error);
    
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
    endpoint: '/api/v1/intelligence/employee/analytics',
    method: 'POST',
    description: 'Analyze employee growth, movement, and retention patterns',
    features: [
      'Employee growth analysis and trends',
      'Leadership transition tracking',
      'Employee movement predictions',
      'Department expansion analysis',
      'Retention metrics and risk factors'
    ],
    requestBody: {
      company: 'string (required)',
      timeframe: 'string (optional) - last_month | last_quarter | last_year',
      analysisType: 'string (optional) - growth | leadership | movements | departments | comprehensive',
      options: {
        includePredictions: 'boolean (optional, default: true)',
        includeRetentionMetrics: 'boolean (optional, default: true)',
        includeDepartmentBreakdown: 'boolean (optional, default: true)',
        includeLeadershipChanges: 'boolean (optional, default: true)'
      }
    },
    response: {
      success: 'boolean',
      data: {
        company: 'string',
        timeframe: 'string',
        analysisType: 'string',
        growthAnalysis: 'object (optional)',
        leadershipAnalysis: 'object (optional)',
        movementPredictions: 'object (optional)',
        departmentAnalysis: 'object (optional)',
        retentionMetrics: 'object (optional)'
      },
      metadata: {
        executionTime: 'number',
        timestamp: 'string',
        dataSource: 'string'
      }
    },
    analysisTypes: {
      growth: 'Employee growth trends and health metrics',
      leadership: 'Leadership transitions and stability',
      movements: 'Employee movement predictions',
      departments: 'Department expansion and growth',
      comprehensive: 'All analysis types combined'
    },
    examples: {
      basic: {
        company: 'Salesforce'
      },
      growth: {
        company: 'HubSpot',
        timeframe: 'last_quarter',
        analysisType: 'growth'
      },
      comprehensive: {
        company: 'Pipedrive',
        timeframe: 'last_year',
        analysisType: 'comprehensive',
        options: {
          includePredictions: true,
          includeRetentionMetrics: true,
          includeDepartmentBreakdown: true,
          includeLeadershipChanges: true
        }
      }
    }
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate retention metrics from analysis data
 */
function calculateRetentionMetrics(data: any): any {
  const growthAnalysis = data.growthAnalysis;
  const leadershipAnalysis = data.leadershipAnalysis;
  const departmentAnalysis = data.departmentAnalysis;
  
  if (!growthAnalysis) {
    return {
      overallRetention: 0,
      leadershipRetention: 0,
      departmentRetention: {},
      riskFactors: ['Insufficient data for retention analysis']
    };
  }
  
  // Calculate overall retention
  const totalEmployees = growthAnalysis.totalEmployees;
  const departures = growthAnalysis.departures;
  const overallRetention = totalEmployees > 0 ? ((totalEmployees - departures) / totalEmployees) * 100 : 0;
  
  // Calculate leadership retention
  let leadershipRetention = 0;
  if (leadershipAnalysis) {
    const totalLeadership = leadershipAnalysis.totalLeadership;
    const leadershipDepartures = leadershipAnalysis.leadershipDepartures;
    leadershipRetention = totalLeadership > 0 ? ((totalLeadership - leadershipDepartures) / totalLeadership) * 100 : 0;
  }
  
  // Calculate department retention
  const departmentRetention: Record<string, number> = {};
  if (departmentAnalysis) {
    departmentAnalysis.departments.forEach((dept: any) => {
      // Simplified calculation - in reality would need departure data per department
      departmentRetention[dept.name] = dept.expansion ? 95 : 85;
    });
  }
  
  // Identify risk factors
  const riskFactors: string[] = [];
  if (overallRetention < 80) riskFactors.push('Low overall retention rate');
  if (leadershipRetention < 85) riskFactors.push('Leadership instability');
  if (growthAnalysis.growthRate < 0) riskFactors.push('Negative growth trend');
  
  return {
    overallRetention: Math.round(overallRetention),
    leadershipRetention: Math.round(leadershipRetention),
    departmentRetention,
    riskFactors
  };
}
