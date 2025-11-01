import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence/role/discover
 * 
 * Discover people by role
 * 
 * Body:
 * {
 *   "roles": ["VP Marketing", "CMO"],
 *   "companies": ["Salesforce", "HubSpot"],
 *   "enrichmentLevel": "enrich" // discover, enrich, research
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.roles || !Array.isArray(body.roles) || body.roles.length === 0) {
      return NextResponse.json(
        { success: false, error: 'roles array is required and must not be empty' },
        { status: 400 }
      );
    }

    if (!body.companies || !Array.isArray(body.companies) || body.companies.length === 0) {
      return NextResponse.json(
        { success: false, error: 'companies array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Import pipeline (NEW: Using orchestrators)
    const { RoleDiscoveryPipeline } = await import('@/platform/pipelines/orchestrators');
    
    const pipeline = new RoleDiscoveryPipeline();
    const result = await pipeline.discover({
      roles: body.roles,
      companies: body.companies,
      enrichmentLevel: body.enrichmentLevel || 'discover',
      filters: body.filters
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Role discovery error:', error);
    
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
 * GET /api/v1/intelligence/role/discover
 * 
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence/role/discover',
    method: 'POST',
    description: 'Discover people by role across specified companies',
    parameters: {
      roles: {
        type: 'string[]',
        required: true,
        description: 'Array of role titles to search for',
        example: ['VP Marketing', 'CMO', 'Chief Marketing Officer']
      },
      companies: {
        type: 'string[]',
        required: true,
        description: 'Array of company names to search within',
        example: ['Salesforce', 'HubSpot', 'Zendesk']
      },
      enrichmentLevel: {
        type: 'string',
        required: false,
        default: 'discover',
        enum: ['discover', 'enrich', 'research'],
        description: 'Level of data enrichment to perform'
      },
      filters: {
        type: 'object',
        required: false,
        description: 'Optional filters to apply to results'
      }
    },
    example: {
      request: {
        roles: ['VP Marketing'],
        companies: ['Salesforce'],
        enrichmentLevel: 'enrich'
      },
      response: {
        success: true,
        people: [
          {
            name: 'John Doe',
            title: 'VP Marketing',
            company: 'Salesforce',
            email: 'john.doe@salesforce.com',
            phone: '+1-555-1234',
            linkedIn: 'linkedin.com/in/johndoe'
          }
        ],
        metadata: {
          totalFound: 1,
          totalReturned: 1,
          enrichmentLevel: 'enrich'
        }
      }
    }
  });
}

