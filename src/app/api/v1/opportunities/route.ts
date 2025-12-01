import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { OpportunityStatusService } from '@/platform/services/OpportunityStatusService';

/**
 * Opportunities CRUD API v1
 * GET /api/v1/opportunities - List opportunities with filtering
 * POST /api/v1/opportunities - Create a new opportunity
 */

// GET /api/v1/opportunities - List opportunities with filtering
export async function GET(request: NextRequest) {
  try {
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context, response } = authResult;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 10000);
    const search = (searchParams.get('search') || '').trim();
    const stage = searchParams.get('stage') || '';
    const companyId = searchParams.get('companyId') || '';
    const ownerId = searchParams.get('ownerId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const offset = (page - 1) * limit;

    // Override workspace ID from query params if present
    let finalWorkspaceId = context.workspaceId;
    const queryWorkspaceId = searchParams.get('workspaceId');
    if (queryWorkspaceId) {
      finalWorkspaceId = queryWorkspaceId;
    }

    const where: any = {
      workspaceId: finalWorkspaceId,
      deletedAt: null,
      OR: [
        { ownerId: context.userId },
        { ownerId: null }
      ]
    };

    if (stage) {
      where.stage = stage;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    if (ownerId) {
      where.ownerId = ownerId;
    }

    if (search && search.length >= 2) {
      where.OR = [
        ...(where.OR || []),
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunities.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              size: true,
              revenue: true,
              description: true,
              descriptionEnriched: true,
              status: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true
            }
          },
          owner: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: offset,
        take: limit
      }),
      prisma.opportunities.count({ where })
    ]);

    // Transform to match existing Opportunity interface
    const transformedOpportunities = opportunities.map((opp) => ({
      id: opp.id,
      name: opp.name,
      company: opp.company.name,
      account: { name: opp.company.name },
      status: opp.company.status || 'OPPORTUNITY',
      lastAction: opp.company.lastAction || '-',
      nextAction: opp.company.nextAction || '-',
      amount: opp.amount ? parseFloat(opp.amount.toString()) : 0,
      revenue: opp.amount ? parseFloat(opp.amount.toString()) : 0,
      stage: opp.stage,
      opportunityStage: opp.stage,
      companyId: opp.companyId,
      industry: opp.company.industry || undefined,
      size: opp.company.size || '-',
      lastActionDate: opp.company.lastActionDate,
      nextActionDate: opp.company.nextActionDate,
      assignedUserId: opp.ownerId,
      workspaceId: opp.workspaceId,
      createdAt: opp.createdAt,
      updatedAt: opp.updatedAt,
      description: opp.description || '',
      summary: opp.description || '',
      opportunityAmount: opp.amount ? parseFloat(opp.amount.toString()) : 0,
      opportunityProbability: opp.probability || 0,
      expectedCloseDate: opp.expectedCloseDate,
      customFields: {},
      account: {
        name: opp.company.name
      }
    }));

    return NextResponse.json({
      data: transformedOpportunities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[OPPORTUNITIES API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to fetch opportunities',
      'FETCH_ERROR',
      500
    );
  }
}

// POST /api/v1/opportunities - Create a new opportunity
export async function POST(request: NextRequest) {
  try {
    const authResult = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    const { context, response } = authResult;

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const body = await request.json();
    const {
      companyId,
      name,
      description,
      amount,
      stage = 'Discovery',
      probability = 0.1,
      expectedCloseDate,
      ownerId
    } = body;

    if (!companyId) {
      return createErrorResponse('companyId is required', 'VALIDATION_ERROR', 400);
    }

    if (!name) {
      return createErrorResponse('name is required', 'VALIDATION_ERROR', 400);
    }

    // Verify company exists
    const company = await prisma.companies.findFirst({
      where: {
        id: companyId,
        workspaceId: context.workspaceId,
        deletedAt: null
      }
    });

    if (!company) {
      return createErrorResponse('Company not found', 'NOT_FOUND', 404);
    }

    // Validate ownerId - ensure the user exists in the database
    // This prevents foreign key constraint violations
    let validatedOwnerId: string | null = null;
    const targetOwnerId = ownerId || context.userId;
    
    if (targetOwnerId) {
      const ownerExists = await prisma.users.findUnique({
        where: { id: targetOwnerId },
        select: { id: true }
      });
      
      if (ownerExists) {
        validatedOwnerId = targetOwnerId;
      } else {
        console.warn(`[OPPORTUNITIES API] Owner not found in users table: ${targetOwnerId}, setting ownerId to null`);
      }
    }

    // Create opportunity
    const opportunity = await prisma.opportunities.create({
      data: {
        workspaceId: context.workspaceId,
        companyId,
        name,
        description: description || null,
        amount: amount ? parseFloat(amount.toString()) : null,
        stage,
        probability: probability || 0.1,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        ownerId: validatedOwnerId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            revenue: true,
            description: true,
            descriptionEnriched: true,
            status: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update company and people status to OPPORTUNITY
    await OpportunityStatusService.setCompanyAndPeopleToOpportunity(companyId, context.workspaceId);

    // Transform response
    const transformed = {
      id: opportunity.id,
      name: opportunity.name,
      company: opportunity.company.name,
      account: { name: opportunity.company.name },
      status: 'OPPORTUNITY',
      amount: opportunity.amount ? parseFloat(opportunity.amount.toString()) : 0,
      stage: opportunity.stage,
      opportunityStage: opportunity.stage,
      companyId: opportunity.companyId,
      industry: opportunity.company.industry || undefined,
      size: opportunity.company.size || '-',
      assignedUserId: opportunity.ownerId,
      workspaceId: opportunity.workspaceId,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt,
      description: opportunity.description || '',
      opportunityAmount: opportunity.amount ? parseFloat(opportunity.amount.toString()) : 0,
      opportunityProbability: opportunity.probability || 0,
      expectedCloseDate: opportunity.expectedCloseDate,
      customFields: {}
    };

    return createSuccessResponse(transformed, 201);
  } catch (error) {
    console.error('[OPPORTUNITIES API] Error creating opportunity:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to create opportunity',
      'CREATE_ERROR',
      500
    );
  }
}

