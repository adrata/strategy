/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * COMPETITIVE ANALYSIS API ENDPOINT
 * 
 * POST /api/v1/intelligence/competitive/analyze
 * 
 * Analyzes competitive landscape and market positioning
 * Uses CoreSignal data for comprehensive market intelligence
 */

import { NextRequest, NextResponse } from 'next/server';
import { compareCompanies, trackMarketTrends, getCompetitiveLandscape } from '@/platform/pipelines/functions/intelligence/competitive-intelligence';

// ============================================================================
// TYPES
// ============================================================================

interface CompetitiveAnalysisRequest {
  type: 'company-comparison' | 'market-trends' | 'landscape-analysis';
  
  // For company comparison
  companies?: string[];
  timeframe?: string;
  
  // For market trends
  industry?: string;
  sampleCompanies?: string[];
  
  // For landscape analysis
  focusCompany?: string;
  competitors?: string[];
  
  options?: {
    includeRankings?: boolean;
    includeMarketDynamics?: boolean;
    includeStrategicRecommendations?: boolean;
  };
}

interface CompetitiveAnalysisResponse {
  success: boolean;
  data?: any; // Will be typed based on analysis type
  metadata?: {
    analysisType: string;
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
    console.log(`\n🏆 [COMPETITIVE ANALYSIS API] Starting analysis...`);
    
    // Parse request body
    const body: CompetitiveAnalysisRequest = await request.json();
    
    // Validate required fields
    if (!body.type) {
      return NextResponse.json({
        success: false,
        error: 'Missing required field: type'
      }, { status: 400 });
    }
    
    console.log(`   Analysis Type: ${body.type}`);
    
    let analysisData;
    const timeframe = body.timeframe || 'last_quarter';
    
    switch (body.type) {
      case 'company-comparison':
        if (!body.companies || body.companies.length < 2) {
          return NextResponse.json({
            success: false,
            error: 'Company comparison requires at least 2 companies'
          }, { status: 400 });
        }
        
        console.log(`   Companies: ${body.companies.join(', ')}`);
        analysisData = await compareCompanies(body.companies, timeframe, {});
        break;
        
      case 'market-trends':
        if (!body.industry || !body.sampleCompanies) {
          return NextResponse.json({
            success: false,
            error: 'Market trends requires industry and sampleCompanies'
          }, { status: 400 });
        }
        
        console.log(`   Industry: ${body.industry}`);
        console.log(`   Sample Companies: ${body.sampleCompanies.length}`);
        analysisData = await trackMarketTrends(body.industry, timeframe, body.sampleCompanies, {});
        break;
        
      case 'landscape-analysis':
        if (!body.focusCompany || !body.competitors) {
          return NextResponse.json({
            success: false,
            error: 'Landscape analysis requires focusCompany and competitors'
          }, { status: 400 });
        }
        
        console.log(`   Focus Company: ${body.focusCompany}`);
        console.log(`   Competitors: ${body.competitors.join(', ')}`);
        analysisData = await getCompetitiveLandscape(body.focusCompany, body.competitors, timeframe, {});
        break;
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid analysis type. Must be: company-comparison, market-trends, or landscape-analysis'
        }, { status: 400 });
    }
    
    const response: CompetitiveAnalysisResponse = {
      success: true,
      data: analysisData,
      metadata: {
        analysisType: body.type,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        dataSource: 'CoreSignal Multi-Source & Jobs API'
      }
    };
    
    const executionTime = Date.now() - startTime;
    
    console.log(`\n✅ [COMPETITIVE ANALYSIS API] Complete (${executionTime}ms)`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error(`\n❌ [COMPETITIVE ANALYSIS API] Error:`, error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      metadata: {
        analysisType: 'unknown',
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
    endpoint: '/api/v1/intelligence/competitive/analyze',
    method: 'POST',
    description: 'Analyze competitive landscape and market positioning',
    features: [
      'Multi-company competitive comparison',
      'Market trend tracking and analysis',
      'Competitive landscape mapping',
      'Market positioning and rankings',
      'Strategic recommendations'
    ],
    analysisTypes: {
      'company-comparison': {
        description: 'Compare multiple companies for competitive analysis',
        requiredFields: ['companies'],
        optionalFields: ['timeframe', 'options'],
        response: {
          companies: 'string[]',
          timeframe: 'string',
          rankings: 'object[]',
          marketLeaders: 'string[]',
          emergingPlayers: 'string[]',
          decliningCompanies: 'string[]',
          insights: 'string[]'
        }
      },
      'market-trends': {
        description: 'Track market trends across an industry',
        requiredFields: ['industry', 'sampleCompanies'],
        optionalFields: ['timeframe', 'options'],
        response: {
          industry: 'string',
          timeframe: 'string',
          overallGrowth: 'number',
          averageHiringRate: 'number',
          topRoles: 'string[]',
          departmentTrends: 'object[]',
          insights: 'string[]'
        }
      },
      'landscape-analysis': {
        description: 'Get complete competitive landscape analysis',
        requiredFields: ['focusCompany', 'competitors'],
        optionalFields: ['timeframe', 'options'],
        response: {
          focusCompany: 'string',
          competitors: 'string[]',
          positioning: 'object[]',
          marketDynamics: 'object',
          strategicRecommendations: 'string[]'
        }
      }
    },
    requestBody: {
      type: 'string (required) - company-comparison | market-trends | landscape-analysis',
      companies: 'string[] (required for company-comparison)',
      industry: 'string (required for market-trends)',
      sampleCompanies: 'string[] (required for market-trends)',
      focusCompany: 'string (required for landscape-analysis)',
      competitors: 'string[] (required for landscape-analysis)',
      timeframe: 'string (optional) - last_week | last_month | last_quarter | last_year',
      options: {
        includeRankings: 'boolean (optional, default: true)',
        includeMarketDynamics: 'boolean (optional, default: true)',
        includeStrategicRecommendations: 'boolean (optional, default: true)'
      }
    },
    examples: {
      companyComparison: {
        type: 'company-comparison',
        companies: ['Salesforce', 'HubSpot', 'Pipedrive'],
        timeframe: 'last_quarter'
      },
      marketTrends: {
        type: 'market-trends',
        industry: 'SaaS',
        sampleCompanies: ['Salesforce', 'HubSpot', 'Pipedrive', 'Zendesk'],
        timeframe: 'last_year'
      },
      landscapeAnalysis: {
        type: 'landscape-analysis',
        focusCompany: 'HubSpot',
        competitors: ['Salesforce', 'Pipedrive', 'Zendesk'],
        timeframe: 'last_quarter'
      }
    }
  });
}
