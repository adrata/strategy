import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { IntelligentNextActionService } from '@/platform/services/IntelligentNextActionService';
import { cache } from '@/platform/services/unified-cache';

const prisma = new PrismaClient();

/**
 * Actions CRUD API v1
 * GET /api/v1/actions - List actions with search and pagination
 * POST /api/v1/actions - Create a new action
 */

// GET /api/v1/actions - List actions with search and pagination
export async function GET(request: NextRequest) {
  try {
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const type = searchParams.get('type') || '';
    const companyId = searchParams.get('companyId') || '';
    const personId = searchParams.get('personId') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const countsOnly = searchParams.get('counts') === 'true';
    
    const offset = (page - 1) * limit;

    // Enhanced where clause for action management
    const where: any = {
      workspaceId: context.workspaceId, // Filter by user's workspace
      deletedAt: null, // Only show non-deleted records
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { outcome: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Status filtering (PLANNED, IN_PROGRESS, COMPLETED, CANCELLED)
    if (status) {
      where.status = status;
    }

    // Priority filtering (LOW, NORMAL, HIGH, URGENT)
    if (priority) {
      where.priority = priority;
    }

    // Type filtering
    if (type) {
      where.type = { contains: type, mode: 'insensitive' };
    }

    // Company filtering
    if (companyId) {
      where.companyId = companyId;
    }

    // Person filtering
    if (personId) {
      where.personId = personId;
    }

    // 🚀 PERFORMANCE: If counts only, just return counts by status
    if (countsOnly) {
      const statusCounts = await prisma.actions.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      });

      const counts = statusCounts.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, {} as Record<string, number>);

      return createSuccessResponse(counts, {
        type: 'counts',
        filters: { search, status, priority, type, companyId, personId },
        userId: context.userId,
        workspaceId: context.workspaceId,
      });
    }

    // Get actions
    const [actions, totalCount] = await Promise.all([
      prisma.actions.findMany({
        where,
        orderBy: { 
          [sortBy === 'rank' ? 'createdAt' : sortBy]: sortOrder 
        },
        skip: offset,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
              website: true,
              industry: true,
            },
          },
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              jobTitle: true,
              email: true,
            },
          },
        },
      }),
      prisma.actions.count({ where }),
    ]);

    return createSuccessResponse(actions, {
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      filters: { search, status, priority, type, companyId, personId, sortBy, sortOrder },
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    return createErrorResponse('Failed to fetch actions', 'INTERNAL_ERROR', 500);
  }
}

// POST /api/v1/actions - Create a new action
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 [ACTIONS API] POST request received');
    
    // Authenticate and authorize user using unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      console.error('❌ [ACTIONS API] Authentication failed:', {
        status: response.status,
        statusText: response.statusText
      });
      return response; // Return error response if authentication failed
    }

    if (!context) {
      console.error('❌ [ACTIONS API] No authentication context available');
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    console.log('✅ [ACTIONS API] Authentication successful:', {
      userId: context.userId,
      workspaceId: context.workspaceId,
      userEmail: context.userEmail
    });

    const body = await request.json();
    console.log('📝 [ACTIONS API] Request body:', {
      type: body.type,
      subject: body.subject,
      description: body.description,
      personId: body.personId,
      companyId: body.companyId,
      status: body.status,
      priority: body.priority
    });

    // Enhanced validation
    if (!body.type || !body.subject) {
      console.error('❌ [ACTIONS API] Validation failed - missing required fields:', {
        hasType: !!body.type,
        hasSubject: !!body.subject,
        body: body
      });
      return NextResponse.json(
        { success: false, error: 'Type and subject are required' },
        { status: 400 }
      );
    }

    // Validate field types
    if (typeof body.type !== 'string' || typeof body.subject !== 'string') {
      console.error('❌ [ACTIONS API] Validation failed - invalid field types:', {
        typeType: typeof body.type,
        subjectType: typeof body.subject
      });
      return NextResponse.json(
        { success: false, error: 'Type and subject must be strings' },
        { status: 400 }
      );
    }

    // Validate foreign key references if provided
    if (body.companyId) {
      console.log('🔍 [ACTIONS API] Validating company reference:', { companyId: body.companyId });
      const companyExists = await prisma.companies.findUnique({
        where: { id: body.companyId, deletedAt: null }
      });
      if (!companyExists) {
        console.error('❌ [ACTIONS API] Validation failed - company not found:', {
          companyId: body.companyId,
          context: { userId: context.userId, workspaceId: context.workspaceId }
        });
        return NextResponse.json(
          { success: false, error: `Company with ID ${body.companyId} not found or has been deleted` },
          { status: 400 }
        );
      }
      console.log('✅ [ACTIONS API] Company reference validated:', { companyName: companyExists.name });
    }

    if (body.personId) {
      console.log('🔍 [ACTIONS API] Validating person reference:', { personId: body.personId });
      const personExists = await prisma.people.findUnique({
        where: { id: body.personId, deletedAt: null }
      });
      if (!personExists) {
        console.error('❌ [ACTIONS API] Validation failed - person not found:', {
          personId: body.personId,
          context: { userId: context.userId, workspaceId: context.workspaceId }
        });
        return NextResponse.json(
          { success: false, error: `Person with ID ${body.personId} not found or has been deleted` },
          { status: 400 }
        );
      }
      console.log('✅ [ACTIONS API] Person reference validated:', { personName: personExists.fullName || personExists.firstName + ' ' + personExists.lastName });
    }

    console.log('💾 [ACTIONS API] Creating action in database...');
    
    // Prepare action data - include all fields with proper typing
    const actionData: any = {
      type: body.type,
      subject: body.subject,
      description: body.description,
      outcome: body.outcome,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      status: (body.status || 'PLANNED').toUpperCase(),
      priority: body.priority || 'NORMAL',
      workspaceId: context.workspaceId,
      userId: context.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      // Conditionally include foreign key references if validated
      ...(body.companyId && { companyId: body.companyId }),
      ...(body.personId && { personId: body.personId })
    };

    console.log('📝 [ACTIONS API] Action data prepared:', {
      type: actionData.type,
      subject: actionData.subject,
      hasCompanyId: !!actionData.companyId,
      hasPersonId: !!actionData.personId
    });
    
    // Create action
    const action = await prisma.actions.create({
      data: actionData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
          },
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
          },
        },
      },
    });

    console.log('✅ [ACTIONS API] Action created successfully:', {
      actionId: action.id,
      type: action.type,
      subject: action.subject
    });

    // Generate next action using AI service
    // Fire and forget - don't await
    const nextActionService = new IntelligentNextActionService({
      workspaceId: context.workspaceId,
      userId: context.userId
    });
    
    nextActionService.updateNextActionOnNewAction(action).catch(error => {
      console.error('⚠️ [ACTIONS API] Background next action generation failed:', error);
    });

    // Update person's lastAction fields if action is completed
    if (action.personId && action.status === 'COMPLETED') {
      try {
        await prisma.people.update({
          where: { id: action.personId },
          data: {
            lastAction: action.subject,
            lastActionDate: action.completedAt || action.createdAt,
            actionStatus: action.status
          }
        });
        console.log('✅ [ACTIONS API] Updated person lastAction fields:', {
          personId: action.personId,
          lastAction: action.subject,
          lastActionDate: action.completedAt || action.createdAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS API] Failed to update person lastAction fields:', error);
      }
    }

    // Update company's lastAction fields if action is completed
    if (action.companyId && action.status === 'COMPLETED') {
      try {
        await prisma.companies.update({
          where: { id: action.companyId },
          data: {
            lastAction: action.subject,
            lastActionDate: action.completedAt || action.createdAt,
            actionStatus: action.status
          }
        });
        console.log('✅ [ACTIONS API] Updated company lastAction fields:', {
          companyId: action.companyId,
          lastAction: action.subject,
          lastActionDate: action.completedAt || action.createdAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS API] Failed to update company lastAction fields:', error);
      }
    }

    // Invalidate speedrun cache if action is for a person
    if (action.personId) {
      try {
        const cachePattern = `speedrun-${context.workspaceId}-${context.userId}-*`;
        await cache.invalidate(cachePattern);
        console.log(`🗑️ [ACTIONS API] Invalidated speedrun cache for pattern: ${cachePattern}`);
      } catch (error) {
        console.warn('⚠️ [ACTIONS API] Speedrun cache invalidation failed:', error);
      }
    }

    return createSuccessResponse(action, {
      message: 'Action created successfully',
      userId: context.userId,
      workspaceId: context.workspaceId,
    });

  } catch (error) {
    console.error('❌ [ACTIONS API] Error creating action:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError',
      timestamp: new Date().toISOString()
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      // Prisma errors
      if (error.name === 'PrismaClientKnownRequestError') {
        const prismaError = error as any;
        console.error('❌ [ACTIONS API] Prisma error details:', {
          code: prismaError.code,
          meta: prismaError.meta,
          message: prismaError.message
        });
        
        // Handle specific Prisma error codes
        if (prismaError.code === 'P2002') {
          return createErrorResponse(
            'Action with this data already exists',
            'DUPLICATE_ACTION',
            409
          );
        } else if (prismaError.code === 'P2003') {
          return createErrorResponse(
            'Invalid reference to related record',
            'FOREIGN_KEY_CONSTRAINT',
            400
          );
        } else if (prismaError.code === 'P2025') {
          return createErrorResponse(
            'Referenced record not found',
            'RECORD_NOT_FOUND',
            404
          );
        }
      }
      
      // Validation errors
      if (error.message.includes('validation') || error.message.includes('required')) {
        return createErrorResponse(
          `Validation error: ${error.message}`,
          'VALIDATION_ERROR',
          400
        );
      }
      
      // Authentication errors
      if (error.message.includes('Authentication') || error.message.includes('Unauthorized')) {
        return createErrorResponse(
          'Authentication failed',
          'AUTH_ERROR',
          401
        );
      }
    }
    
    // Generic error fallback
    return createErrorResponse(
      'Failed to create action',
      'INTERNAL_ERROR',
      500
    );
  }
}
