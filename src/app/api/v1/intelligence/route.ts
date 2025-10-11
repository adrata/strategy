import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v1/intelligence
 * 
 * Unified intelligence endpoint supporting all entity types and actions
 * 
 * Body:
 * {
 *   "action": "discover" | "research" | "enrich",
 *   "entityType": "role" | "company" | "person" | "buyer_group",
 *   "criteria": { ... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.action) {
      return NextResponse.json(
        { success: false, error: 'action is required (discover, research, or enrich)' },
        { status: 400 }
      );
    }

    if (!body.entityType) {
      return NextResponse.json(
        { success: false, error: 'entityType is required (role, company, person, or buyer_group)' },
        { status: 400 }
      );
    }

    if (!body.criteria) {
      return NextResponse.json(
        { success: false, error: 'criteria is required' },
        { status: 400 }
      );
    }

    // Import unified pipeline (NEW: Using orchestrators)
    const { UnifiedIntelligencePipeline } = await import('@/platform/pipelines/orchestrators');
    
    const pipeline = new UnifiedIntelligencePipeline();
    
    // Execute the requested action
    let result;
    
    switch (body.action) {
      case 'discover':
        result = await pipeline.discover(body.entityType, body.criteria);
        break;
        
      case 'research':
        result = await pipeline.research(body.entityType, body.criteria);
        break;
        
      case 'enrich':
        result = await pipeline.enrich(body.entityType, body.criteria.entities, body.criteria.enrichmentLevel);
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${body.action}. Use 'discover', 'research', or 'enrich'` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API] Unified intelligence error:', error);
    
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
 * GET /api/v1/intelligence
 * 
 * Get API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/intelligence',
    version: '1.0',
    description: 'Unified intelligence endpoint for all entity types and actions',
    
    actions: {
      discover: {
        description: 'Find entities matching criteria',
        entityTypes: ['role', 'company', 'buyer_group']
      },
      research: {
        description: 'Deep intelligence analysis',
        entityTypes: ['person', 'company']
      },
      enrich: {
        description: 'Add contact information',
        entityTypes: ['person']
      }
    },
    
    entityTypes: {
      role: 'Find people by role title',
      company: 'Find companies using Target Company Intelligence',
      person: 'Deep research on specific individual',
      buyer_group: 'Identify buying committees'
    },
    
    examples: {
      discoverRoles: {
        request: {
          action: 'discover',
          entityType: 'role',
          criteria: {
            roles: ['VP Marketing', 'CMO'],
            companies: ['Salesforce'],
            enrichmentLevel: 'enrich'
          }
        }
      },
      discoverCompanies: {
        request: {
          action: 'discover',
          entityType: 'company',
          criteria: {
            firmographics: { industry: ['SaaS'] },
            innovationProfile: { segment: 'innovators' },
            minCompanyFitScore: 70
          }
        }
      },
      researchPerson: {
        request: {
          action: 'research',
          entityType: 'person',
          criteria: {
            name: 'John Smith',
            company: 'Nike',
            analysisDepth: {
              innovationProfile: true,
              buyingAuthority: true
            }
          }
        }
      },
      discoverBuyerGroup: {
        request: {
          action: 'discover',
          entityType: 'buyer_group',
          criteria: {
            companyName: 'Salesforce',
            enrichmentLevel: 'enrich'
          }
        }
      }
    },
    
    specificEndpoints: {
      roleDiscovery: 'POST /api/v1/intelligence/role/discover',
      companyDiscovery: 'POST /api/v1/intelligence/company/discover',
      personResearch: 'POST /api/v1/intelligence/person/research',
      buyerGroupDiscovery: 'POST /api/v1/intelligence/buyer-group'
    },
    
    note: 'This unified endpoint supports all operations. You can also use specific endpoints for better documentation and type safety.'
  });
}
