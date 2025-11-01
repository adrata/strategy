import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/buyer-group/discover
 * 
 * Discover buyer group for a company
 * 
 * Body:
 * {
 *   "companyName": "Salesforce",
 *   "website": "https://salesforce.com",
 *   "enrichmentLevel": "enrich" // discover, enrich, research
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.companyName || body.companyName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'companyName is required and must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Import pipeline (NEW: Using orchestrators)
    const { BuyerGroupDiscoveryPipeline } = await import('@/platform/pipelines/orchestrators');
    
    const pipeline = new BuyerGroupDiscoveryPipeline();
    const result = await pipeline.discover({
      companyName: body.companyName,
      website: body.website,
      enrichmentLevel: body.enrichmentLevel || 'discover'
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Buyer group discovery error:', error);
    
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
 * GET /api/v1/intelligence/buyer-group/discover
 * 
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/buyer-group/discover',
    method: 'POST',
    description: 'Discover buyer group (buying committee) for a company',
    parameters: {
      companyName: {
        type: 'string',
        required: true,
        description: 'Company name',
        example: 'Salesforce'
      },
      website: {
        type: 'string',
        required: false,
        description: 'Company website',
        example: 'https://salesforce.com'
      },
      enrichmentLevel: {
        type: 'string',
        required: false,
        default: 'discover',
        enum: ['discover', 'enrich', 'research'],
        description: 'Level of data enrichment to perform'
      }
    },
    example: {
      request: {
        companyName: 'Salesforce',
        enrichmentLevel: 'enrich'
      },
      response: {
        success: true,
        companyName: 'Salesforce',
        members: [
          {
            name: 'John Doe',
            title: 'CFO',
            role: 'decision_maker',
            confidence: 95,
            email: 'john.doe@salesforce.com',
            phone: '+1-555-0100',
            linkedin: 'https://linkedin.com/in/johndoe',
            influenceScore: 85
          }
        ],
        metadata: {
          totalMembers: 5,
          averageConfidence: 88,
          enrichmentLevel: 'enrich'
        }
      }
    }
  });
}

