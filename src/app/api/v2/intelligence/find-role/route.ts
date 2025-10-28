/**
 * FIND ROLE API ENDPOINT (V2)
 * 
 * API endpoint for finding specific roles at companies
 * Example: "Find the CFO at Nike"
 */

import { NextRequest, NextResponse } from 'next/server';
import { RoleFinder } from '@/platform/intelligence/buyer-group-v2/services/role-finder';
import { getSecureApiContext } from '@/platform/api-auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/v2/intelligence/find-role
 * 
 * Find a specific role (CFO, CTO, etc.) at a company
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error if auth failed
    }

    if (!context) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const workspaceId = context.workspaceId;
    const body = await request.json();

    const {
      role,
      companyName,
      companyId,
      companyLinkedInUrl,
      maxResults = 1,
      enrichmentLevel = 'identify',
      useAI = true
    } = body;

    // Validate required parameters
    if (!role) {
      return NextResponse.json(
        { error: 'Role parameter is required (e.g., "CFO", "CTO")' },
        { status: 400 }
      );
    }

    if (!companyName && !companyId && !companyLinkedInUrl) {
      return NextResponse.json(
        { error: 'At least one of companyName, companyId, or companyLinkedInUrl is required' },
        { status: 400 }
      );
    }

    console.log(`🎯 [FIND ROLE API] Request: ${role} at ${companyName || companyId || companyLinkedInUrl}`);
    console.log(`   Workspace: ${workspaceId}`);
    console.log(`   Enrichment Level: ${enrichmentLevel}`);

    // Initialize role finder and execute search
    const roleFinder = new RoleFinder();
    const result = await roleFinder.findRole({
      role,
      companyName,
      companyId,
      companyLinkedInUrl,
      workspaceId,
      maxResults,
      enrichmentLevel,
      useAI
    });

    console.log(`✅ [FIND ROLE API] Success! Found ${result.people?.length || 0} matches`);

    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        processingTime: result.processingTime,
        creditsUsed: result.creditsUsed,
        enrichmentLevel
      }
    });
  } catch (error: any) {
    console.error('❌ [FIND ROLE API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to find role',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/intelligence/find-role
 * 
 * Get information about the find-role endpoint
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    endpoint: '/api/v2/intelligence/find-role',
    method: 'POST',
    description: 'Find specific roles (CFO, CTO, etc.) at companies using AI-powered search',
    parameters: {
      role: {
        type: 'string',
        required: true,
        description: 'The role to find (e.g., "CFO", "CTO", "CMO")',
        examples: ['CFO', 'CTO', 'CRO', 'CMO', 'CEO', 'COO']
      },
      companyName: {
        type: 'string',
        required: false,
        description: 'Company name to search within',
        example: 'Nike'
      },
      companyId: {
        type: 'string',
        required: false,
        description: 'Database ID of the company',
        example: '01K7DNYR5VZ7JY36KGKKN76XZ1'
      },
      companyLinkedInUrl: {
        type: 'string',
        required: false,
        description: 'LinkedIn URL of the company',
        example: 'https://www.linkedin.com/company/nike'
      },
      maxResults: {
        type: 'number',
        required: false,
        default: 1,
        description: 'Maximum number of results to return'
      },
      enrichmentLevel: {
        type: 'string',
        required: false,
        default: 'identify',
        enum: ['identify', 'enrich', 'deep_research'],
        description: 'Level of data enrichment'
      },
      useAI: {
        type: 'boolean',
        required: false,
        default: true,
        description: 'Use AI to generate role variations'
      }
    },
    response: {
      success: 'boolean',
      data: {
        person: 'PersonMatch object with contact info',
        people: 'Array of all matches',
        confidence: 'Match confidence score (0-100)',
        tier: 'Match tier (1=exact, 2=one level down, 3=two levels down)',
        company: 'Company information',
        processingTime: 'Time taken in milliseconds',
        creditsUsed: 'API credits consumed'
      }
    },
    examples: [
      {
        description: 'Find CFO at Nike',
        request: {
          role: 'CFO',
          companyName: 'Nike',
          enrichmentLevel: 'enrich'
        }
      },
      {
        description: 'Find CTO with multiple results',
        request: {
          role: 'CTO',
          companyId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
          maxResults: 3
        }
      }
    ]
  });
}


