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
  CreatePersonSchema, 
  PersonSearchSchema,
  type CreatePersonInput,
  type PersonSearchInput 
} from '../schemas';

const prisma = new PrismaClient();

/**
 * People CRUD API v1
 * GET /api/v1/people - List people with search and pagination
 * POST /api/v1/people - Create a new person
 */

// GET /api/v1/people - List people with search and pagination
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = PersonSearchSchema.safeParse(queryParams);
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
      companyId,
      assignedUserId,
      tags,
      createdAfter,
      createdBefore,
    } = validationResult.data;

    // Build where clause
    const where: any = {};
    
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { jobTitle: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (companyId) where.companyId = companyId;
    if (assignedUserId) where.assignedUserId = assignedUserId;
    if (tags && tags.length > 0) where.tags = { hasSome: tags };
    
    if (createdAfter || createdBefore) {
      where.createdAt = {};
      if (createdAfter) where.createdAt.gte = new Date(createdAfter);
      if (createdBefore) where.createdAt.lte = new Date(createdBefore);
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Execute queries in parallel
    const [people, total] = await Promise.all([
      prisma.people.findMany({
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
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              actions: true,
            },
          },
        },
      }),
      prisma.people.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse({
      people,
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
    console.error('Error fetching people:', error);
    return createErrorResponse('Failed to fetch people', 500);
  }
}

// POST /api/v1/people - Create a new person
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    const body = await request.json();
    
    // Validate input
    const validationResult = CreatePersonSchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid person data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const personData: CreatePersonInput = validationResult.data;
    
    // TODO: Get workspaceId from authenticated user
    const workspaceId = 'default-workspace'; // This should come from auth
    
    // Create person
    const person = await prisma.people.create({
      data: {
        ...personData,
        workspaceId,
        // TODO: Set assignedUserId from authenticated user
        assignedUserId: null,
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            actions: true,
          },
        },
      },
    });

    return createSuccessResponse(person, 201);

  } catch (error) {
    console.error('Error creating person:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Person with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to create person', 500);
  }
}
