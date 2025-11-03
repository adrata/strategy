import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext, createErrorResponse, logAndCreateErrorResponse, SecureApiContext } from '@/platform/services/secure-api-helper';
import { StrategyPersonalizationService, PersonData } from '@/platform/services/strategy-personalization-service';
import { determineArchetype } from '@/platform/services/buyer-group-archetypes';
import { inferSeniority } from '@/platform/utils/normalization';
import { prisma } from '@/platform/database/prisma-client';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * POST /api/v1/strategy/generate
 * Generate personalized strategy summary for a person
 */
export async function POST(request: NextRequest) {
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Parse request body
    const body = await request.json();
    const { personId, recordType } = body;

    if (!personId) {
      return createErrorResponse('Person ID is required', 'MISSING_PERSON_ID', 400);
    }

    console.log(`🎯 [STRATEGY API] Generating strategy for person ${personId} in workspace ${context.workspaceId}`);

    // Fetch person data from database
    const person = await prisma.people.findFirst({
      where: {
        id: personId,
        workspaceId: context.workspaceId
      },
      include: {
        company: {
          select: {
            name: true,
            industry: true
          }
        }
      }
    });

    if (!person) {
      return createErrorResponse('Person not found', 'PERSON_NOT_FOUND', 404);
    }

    // Transform person data for strategy service
    const personData: PersonData = {
      id: person.id,
      name: person.fullName || person.firstName + ' ' + person.lastName,
      title: person.jobTitle || person.title || '',
      company: person.company?.name || person.companyName || '',
      industry: person.company?.industry || person.industry || '',
      department: person.department || '',
      seniority: inferSeniority(person.jobTitle || person.title || ''),
      buyerGroupRole: person.buyerGroupRole || 'Stakeholder',
      painPoints: person.customFields?.painPoints || [],
      goals: person.customFields?.goals || [],
      challenges: person.customFields?.challenges || [],
      opportunities: person.customFields?.opportunities || [],
      skills: person.customFields?.skills || [],
      experience: person.customFields?.experience || [],
      customFields: person.customFields || {}
    };

    // Initialize strategy personalization service
    const strategyService = new StrategyPersonalizationService();

    // Generate strategy summary
    const strategySummary = await strategyService.generateStrategySummary(personData);

    // Save strategy summary to database
    await prisma.people.update({
      where: { id: personId },
      data: {
        customFields: {
          ...person.customFields,
          strategySummary: strategySummary.summary,
          strategySituation: strategySummary.situation,
          strategyComplication: strategySummary.complication,
          strategyFutureState: strategySummary.futureState,
          buyerGroupArchetype: strategySummary.archetype.id,
          industryContext: strategySummary.industryContext,
          strategyGeneratedAt: new Date().toISOString()
        }
      }
    });

    console.log(`✅ [STRATEGY API] Strategy generated successfully for person ${personId}`);

    return NextResponse.json({
      success: true,
      data: {
        strategySummary: strategySummary.summary,
        situation: strategySummary.situation,
        complication: strategySummary.complication,
        futureState: strategySummary.futureState,
        archetype: {
          id: strategySummary.archetype.id,
          name: strategySummary.archetype.name,
          role: strategySummary.archetype.role,
          description: strategySummary.archetype.description
        },
        industryContext: strategySummary.industryContext,
        generatedAt: new Date().toISOString()
      },
      meta: {
        timestamp: new Date().toISOString(),
        message: 'Strategy summary generated successfully',
        userId: context.userId,
        workspaceId: context.workspaceId
      }
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 STRATEGY GENERATE API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to generate strategy summary',
      'STRATEGY_GENERATION_ERROR',
      500
    );
  }
}

/**
 * GET /api/v1/strategy/generate
 * Get existing strategy summary for a person
 */
export async function GET(request: NextRequest) {
  let context: SecureApiContext | null = null;
  
  try {
    // Authenticate and authorize user
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });
    
    const { context: authContext, response } = authResult;
    context = authContext;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Get person ID from query parameters
    const { searchParams } = new URL(request.url);
    const personId = searchParams.get('personId');

    if (!personId) {
      return createErrorResponse('Person ID is required', 'MISSING_PERSON_ID', 400);
    }

    console.log(`🔍 [STRATEGY API] Loading strategy for person ${personId} in workspace ${context.workspaceId}`);

    // Fetch person data from database
    const person = await prisma.people.findFirst({
      where: {
        id: personId,
        workspaceId: context.workspaceId
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      }
    });

    if (!person) {
      return createErrorResponse('Person not found', 'PERSON_NOT_FOUND', 404);
    }

    // Check if strategy summary exists
    const customFields = person.customFields || {};
    const hasStrategy = customFields.strategySummary && 
                       customFields.strategySituation && 
                       customFields.strategyComplication && 
                       customFields.strategyFutureState;

    if (!hasStrategy) {
      return NextResponse.json({
        success: true,
        data: {
          hasStrategy: false,
          message: 'No strategy summary found. Generate one using POST endpoint.'
        }
      });
    }

    // Return existing strategy summary
    return NextResponse.json({
      success: true,
      data: {
        hasStrategy: true,
        strategySummary: customFields.strategySummary,
        situation: customFields.strategySituation,
        complication: customFields.strategyComplication,
        futureState: customFields.strategyFutureState,
        archetype: {
          id: customFields.buyerGroupArchetype,
          name: getArchetypeName(customFields.buyerGroupArchetype),
          role: getArchetypeRole(customFields.buyerGroupArchetype)
        },
        industryContext: customFields.industryContext,
        generatedAt: customFields.strategyGeneratedAt
      }
    });

  } catch (error) {
    return logAndCreateErrorResponse(
      error,
      {
        endpoint: 'V1 STRATEGY GET API',
        userId: context?.userId,
        workspaceId: context?.workspaceId,
        requestId: request.headers.get('x-request-id') || undefined
      },
      'Failed to load strategy summary',
      'STRATEGY_LOAD_ERROR',
      500
    );
  }
}


/**
 * Helper function to get archetype name by ID
 */
function getArchetypeName(archetypeId: string): string {
  const archetypeMap: { [key: string]: string } = {
    'rising-star': 'The Rising Star',
    'frustrated-innovator': 'The Frustrated Innovator',
    'mentor-backed-protege': 'The Mentor-Backed Protégé',
    'change-agent': 'The Change Agent',
    'technical-visionary': 'The Technical Visionary',
    'finance-gatekeeper': 'The Finance Gatekeeper',
    'end-user-representative': 'The End User Representative',
    'process-owner': 'The Process Owner',
    'technical-architect': 'The Technical Architect',
    'legal-compliance-officer': 'The Legal/Compliance Officer',
    'incumbent-vendor-protector': 'The Incumbent Vendor Protector',
    'empire-builder': 'The Empire Builder',
    'skeptical-technologist': 'The Skeptical Technologist',
    'budget-protector': 'The Budget Protector',
    'change-averse-manager': 'The Change-Averse Manager',
    'economic-buyer': 'The Economic Buyer',
    'operational-authority': 'The Operational Authority',
    'consensus-builder': 'The Consensus Builder',
    'visionary-decider': 'The Visionary Decider',
    'technical-decision-maker': 'The Technical Decision Maker',
    'trusted-advisor': 'The Trusted Advisor',
    'peer-networker': 'The Peer Networker',
    'internal-connector': 'The Internal Connector',
    'invested-champion': 'The Invested Champion',
    'reciprocal-partner': 'The Reciprocal Partner'
  };
  
  return archetypeMap[archetypeId] || 'Unknown';
}

/**
 * Helper function to get archetype role by ID
 */
function getArchetypeRole(archetypeId: string): string {
  const roleMap: { [key: string]: string } = {
    'rising-star': 'Champion',
    'frustrated-innovator': 'Champion',
    'mentor-backed-protege': 'Champion',
    'change-agent': 'Champion',
    'technical-visionary': 'Champion',
    'finance-gatekeeper': 'Stakeholder',
    'end-user-representative': 'Stakeholder',
    'process-owner': 'Stakeholder',
    'technical-architect': 'Stakeholder',
    'legal-compliance-officer': 'Stakeholder',
    'incumbent-vendor-protector': 'Blocker',
    'empire-builder': 'Blocker',
    'skeptical-technologist': 'Blocker',
    'budget-protector': 'Blocker',
    'change-averse-manager': 'Blocker',
    'economic-buyer': 'Decision Maker',
    'operational-authority': 'Decision Maker',
    'consensus-builder': 'Decision Maker',
    'visionary-decider': 'Decision Maker',
    'technical-decision-maker': 'Decision Maker',
    'trusted-advisor': 'Introducer',
    'peer-networker': 'Introducer',
    'internal-connector': 'Introducer',
    'invested-champion': 'Introducer',
    'reciprocal-partner': 'Introducer'
  };
  
  return roleMap[archetypeId] || 'Stakeholder';
}
