import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/person/research
 * 
 * Deep research on a specific person
 * 
 * Body:
 * {
 *   "name": "John Smith",
 *   "company": "Nike",
 *   "analysisDepth": {
 *     "innovationProfile": true,
 *     "painAwareness": true,
 *     "buyingAuthority": true,
 *     "influenceNetwork": true,
 *     "careerTrajectory": true,
 *     "riskProfile": true
 *   }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'name is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Import pipeline (NEW: Using orchestrators)
    const { PersonResearchPipeline } = await import('@/platform/pipelines/orchestrators');
    
    const pipeline = new PersonResearchPipeline();
    const result = await pipeline.research({
      name: body.name,
      company: body.company,
      title: body.title,
      linkedinUrl: body.linkedIn || body.linkedinUrl,
      analysisDepth: body.analysisDepth || {
        includeInnovationProfile: true,
        includePainAwareness: true,
        includeBuyingAuthority: true,
        includeInfluenceNetwork: true,
        includeCareerTrajectory: true,
        includeRiskProfile: true
      }
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Person research error:', error);
    
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
 * GET /api/v1/intelligence/person/research
 * 
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/person/research',
    method: 'POST',
    description: 'Deep intelligence research on a specific person',
    useCase: '"Tell me about John Smith at Nike"',
    parameters: {
      name: {
        type: 'string',
        required: true,
        description: 'Person name',
        example: 'John Smith'
      },
      company: {
        type: 'string',
        required: false,
        description: 'Company name (helps with disambiguation)',
        example: 'Nike'
      },
      analysisDepth: {
        type: 'object',
        required: false,
        description: 'Which analyses to perform',
        properties: {
          innovationProfile: 'boolean (Diffusion of Innovation classification)',
          painAwareness: 'boolean (Active pain points)',
          buyingAuthority: 'boolean (Decision maker, champion, etc.)',
          influenceNetwork: 'boolean (Org chart, relationships)',
          careerTrajectory: 'boolean (Rising star vs stable)',
          riskProfile: 'boolean (Risk-taker vs conservative)'
        }
      }
    },
    example: {
      request: {
        name: 'John Smith',
        company: 'Nike',
        analysisDepth: {
          innovationProfile: true,
          painAwareness: true,
          buyingAuthority: true
        }
      },
      response: {
        success: true,
        data: {
          person: {
            name: 'John Smith',
            title: 'VP of Engineering',
            company: 'Nike'
          },
          innovationProfile: {
            segment: 'innovator',
            confidence: 0.91
          },
          buyingAuthority: {
            role: 'decision_maker',
            estimatedSigningLimit: 250000
          },
          keyInsights: [
            '🚀 INNOVATOR - First to adopt new technology',
            '✅ DECISION MAKER - Estimated signing authority: $250K'
          ]
        }
      }
    }
  });
}
