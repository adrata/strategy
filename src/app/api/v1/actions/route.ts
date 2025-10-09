import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createAuthErrorResponse,
  getRequestId 
} from '../utils';
import { 
  CreateActionSchema, 
  ActionSearchSchema,
  type CreateActionInput,
  type ActionSearchInput 
} from '../schemas';

const prisma = new PrismaClient();

/**
 * Actions CRUD API v1
 * GET /api/v1/actions - List actions with search and pagination
 * POST /api/v1/actions - Create a new action
 */

// GET /api/v1/actions - List actions with search and pagination
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = ActionSearchSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid query parameters',
        validationResult.error.flatten().fieldErrors
      );
    }

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      q,
      status,
      priority,
      type,
      companyId,
      personId,
      userId,
      scheduledAfter,
      scheduledBefore,
    } = validationResult.data;

    // Build where clause
    const where: any = {};
    
    if (q) {
      where.OR = [
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
        { person: { fullName: { contains: q, mode: 'insensitive' } } },
      ];
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (type) where.type = type;
    if (companyId) where.companyId = companyId;
    if (personId) where.personId = personId;
    if (userId) where.userId = userId;
    
    if (scheduledAfter || scheduledBefore) {
      where.scheduledAt = {};
      if (scheduledAfter) where.scheduledAt.gte = new Date(scheduledAfter);
      if (scheduledBefore) where.scheduledAt.lte = new Date(scheduledBefore);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel
    const [actions, total] = await Promise.all([
      prisma.actions.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              status: true,
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
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.actions.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse({
      actions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching actions:', error);
    return createErrorResponse('Failed to fetch actions', 500);
  }
}

// POST /api/v1/actions - Create a new action
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateActionSchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid action data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const actionData: CreateActionInput = validationResult.data;
    
    // TODO: Get workspaceId and userId from authenticated user
    const workspaceId = 'default-workspace'; // This should come from auth
    const userId = 'default-user'; // This should come from auth
    
    // Create action
    const action = await prisma.actions.create({
      data: {
        ...actionData,
        workspaceId,
        userId,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return createSuccessResponse(action, 201);

  } catch (error) {
    console.error('Error creating action:', error);
    return createErrorResponse('Failed to create action', 500);
  }
}
