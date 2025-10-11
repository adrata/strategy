/**
 * AI PERSON INTELLIGENCE API ENDPOINT
 * 
 * POST /api/v1/intelligence/person/ai-analysis
 * 
 * Generates AI-powered deep intelligence about a person using Claude API
 * Provides wants, pains, and personalized outreach strategy
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAIPersonIntelligence, type EnhancedPersonData, type CompanyContext } from '@/platform/pipelines/functions/intelligence/ai-person-intelligence';
import { detectSalesIntent } from '@/platform/pipelines/functions/providers/coresignal-jobs';
import { createErrorResponse, createSuccessResponse, generateRequestId, APIError, ErrorCodes } from '@/platform/utils/error-responses';

// ============================================================================
// TYPES
// ============================================================================

interface AIAnalysisRequest {
  person: {
    name: string;
    title: string;
    company: string;
    department?: string;
    seniorityLevel?: string;
    yearsAtCompany?: number;
    totalExperience?: number;
    managementLevel?: string;
    isDecisionMaker?: boolean;
  };
  company?: {
    industry?: string;
    companyStage?: string;
    competitors?: string[];
    growthSignals?: string[];
  };
  options?: {
    includeWants?: boolean;
    includePains?: boolean;
    includeOutreach?: boolean;
    confidenceThreshold?: number;
  };
}

interface AIAnalysisResponse {
  success: boolean;
  data?: {
    person: {
      name: string;
      title: string;
      company: string;
    };
    wants?: {
      careerAspirations: string[];
      professionalGoals: string[];
      motivations: string[];
      opportunitiesOfInterest: string[];
      confidence: number;
      reasoning: string;
    };
    pains?: {
      currentChallenges: string[];
      frustrations: string[];
      pressurePoints: string[];
      obstacles: string[];
      urgencyLevel: 'critical' | 'high' | 'medium' | 'low';
      confidence: number;
      reasoning: string;
    };
    outreach?: {
      bestApproach: string;
      valuePropositions: string[];
      conversationStarters: string[];
      topicsToAvoid: string[];
      optimalTiming: string;
      personalizedMessage: string;
    };
    overallInsight: string;
    confidence: number;
    generatedAt: string;
    model: string;
  };
  metadata?: {
    executionTime: number;
    timestamp: string;
    salesIntentScore?: number;
  };
  error?: string;
}

// ============================================================================
// API HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const requestId = generateRequestId();
  
  try {
    console.log(`\n🤖 [AI PERSON INTELLIGENCE API] Starting analysis... (${requestId})`);
    
    // Parse request body
    const body: AIAnalysisRequest = await request.json();
    
    // Validate required fields
    if (!body.person?.name || !body.person?.title || !body.person?.company) {
      const error = new APIError(
        'Missing required fields: person.name, person.title, person.company',
        ErrorCodes.MISSING_REQUIRED_FIELD,
        400
      );
      return NextResponse.json(
        createErrorResponse(error, requestId),
        { status: 400 }
      );
    }
    
    console.log(`   Person: ${body.person.name} (${body.person.title} at ${body.person.company})`);
    
    // Get sales intent for company context
    let salesIntentScore = 0;
    try {
      const salesIntent = await detectSalesIntent(body.person.company, 'last_30_days', {});
      salesIntentScore = salesIntent.score;
      console.log(`   Sales Intent Score: ${salesIntentScore}/100`);
    } catch (error) {
      console.warn(`   ⚠️ Sales intent detection failed:`, error instanceof Error ? error.message : 'Unknown error');
    }
    
    // Prepare person data
    const personData: EnhancedPersonData = {
      name: body.person.name,
      title: body.person.title,
      company: body.person.company,
      department: body.person.department,
      seniorityLevel: body.person.seniorityLevel,
      yearsAtCompany: body.person.yearsAtCompany,
      totalExperience: body.person.totalExperience,
      managementLevel: body.person.managementLevel,
      isDecisionMaker: body.person.isDecisionMaker
    };
    
    // Prepare company context
    const companyContext: CompanyContext = {
      industry: body.company?.industry,
      companyStage: body.company?.companyStage,
      competitors: body.company?.competitors,
      growthSignals: body.company?.growthSignals,
      salesIntentScore
    };
    
    // Generate AI intelligence
    const aiIntelligence = await createAIPersonIntelligence(
      personData,
      companyContext,
      {} // API clients would be injected here
    );
    
    // Filter results based on options
    const response: AIAnalysisResponse = {
      success: true,
      data: {
        person: {
          name: aiIntelligence.person.name,
          title: aiIntelligence.person.title,
          company: aiIntelligence.person.company
        },
        overallInsight: aiIntelligence.overallInsight,
        confidence: aiIntelligence.confidence,
        generatedAt: aiIntelligence.generatedAt,
        model: aiIntelligence.model
      },
      metadata: {
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        salesIntentScore
      }
    };
    
    // Add wants if requested
    if (body.options?.includeWants !== false) {
      response.data!.wants = aiIntelligence.wants;
    }
    
    // Add pains if requested
    if (body.options?.includePains !== false) {
      response.data!.pains = aiIntelligence.pains;
    }
    
    // Add outreach if requested
    if (body.options?.includeOutreach !== false) {
      response.data!.outreach = aiIntelligence.outreach;
    }
    
    const executionTime = Date.now() - startTime;
    
    console.log(`\n✅ [AI PERSON INTELLIGENCE API] Complete (${executionTime}ms)`);
    console.log(`   Confidence: ${aiIntelligence.confidence}%`);
    
    return NextResponse.json(
      createSuccessResponse(response.data, {
        processingTime: executionTime,
        requestId
      })
    );
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error(`\n❌ [AI PERSON INTELLIGENCE API] Error (${requestId}):`, error);
    
    const apiError = error instanceof APIError ? error : new APIError(
      error instanceof Error ? error.message : 'Unknown error occurred',
      ErrorCodes.INTERNAL_ERROR,
      500
    );
    
    return NextResponse.json(
      createErrorResponse(apiError, requestId),
      { status: apiError.statusCode }
    );
  }
}

// ============================================================================
// GET HANDLER (Documentation)
// ============================================================================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/person/ai-analysis',
    method: 'POST',
    description: 'Generate AI-powered deep intelligence about a person using Claude API',
    features: [
      'Career aspirations and professional goals analysis',
      'Current challenges and pain points identification',
      'Personalized outreach strategy generation',
      'Sales intent context integration',
      'Confidence scoring for all insights'
    ],
    requestBody: {
      person: {
        name: 'string (required)',
        title: 'string (required)',
        company: 'string (required)',
        department: 'string (optional)',
        seniorityLevel: 'string (optional)',
        yearsAtCompany: 'number (optional)',
        totalExperience: 'number (optional)',
        managementLevel: 'string (optional)',
        isDecisionMaker: 'boolean (optional)'
      },
      company: {
        industry: 'string (optional)',
        companyStage: 'string (optional)',
        competitors: 'string[] (optional)',
        growthSignals: 'string[] (optional)'
      },
      options: {
        includeWants: 'boolean (optional, default: true)',
        includePains: 'boolean (optional, default: true)',
        includeOutreach: 'boolean (optional, default: true)',
        confidenceThreshold: 'number (optional, default: 70)'
      }
    },
    response: {
      success: 'boolean',
      data: {
        person: 'object',
        wants: 'object (optional)',
        pains: 'object (optional)',
        outreach: 'object (optional)',
        overallInsight: 'string',
        confidence: 'number',
        generatedAt: 'string',
        model: 'string'
      },
      metadata: {
        executionTime: 'number',
        timestamp: 'string',
        salesIntentScore: 'number'
      }
    },
    examples: {
      basic: {
        person: {
          name: 'John Doe',
          title: 'VP of Marketing',
          company: 'Salesforce'
        }
      },
      detailed: {
        person: {
          name: 'Jane Smith',
          title: 'CFO',
          company: 'HubSpot',
          department: 'Finance',
          seniorityLevel: 'C-Level',
          yearsAtCompany: 3,
          totalExperience: 15,
          isDecisionMaker: true
        },
        company: {
          industry: 'SaaS',
          companyStage: 'Growth',
          competitors: ['Salesforce', 'Pipedrive']
        },
        options: {
          includeWants: true,
          includePains: true,
          includeOutreach: true,
          confidenceThreshold: 80
        }
      }
    }
  });
}
