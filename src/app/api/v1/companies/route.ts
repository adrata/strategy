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
  CreateCompanySchema, 
  CompanySearchSchema,
  type CreateCompanyInput,
  type CompanySearchInput 
} from '../schemas';

const prisma = new PrismaClient();

/**
 * Companies CRUD API v1
 * GET /api/v1/companies - List companies with search and pagination
 * POST /api/v1/companies - Create a new company
 */

// GET /api/v1/companies - List companies with search and pagination
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    // Validate query parameters
    const validationResult = CompanySearchSchema.safeParse(queryParams);
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
      industry,
      assignedUserId,
      tags,
      createdAfter,
      createdBefore,
    } = validationResult.data;

    // Build where clause
    const where: any = {};
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { industry: { contains: q, mode: 'insensitive' } },
      ];
    }
    
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (industry) where.industry = industry;
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
    const [companies, total] = await Promise.all([
      prisma.companies.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              people: true,
              actions: true,
            },
          },
        },
      }),
      prisma.companies.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return createSuccessResponse({
      companies,
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
    console.error('Error fetching companies:', error);
    return createErrorResponse('Failed to fetch companies', 500);
  }
}

// POST /api/v1/companies - Create a new company
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    const body = await request.json();
    
    // Validate input
    const validationResult = CreateCompanySchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid company data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const companyData: CreateCompanyInput = validationResult.data;
    
    // TODO: Get workspaceId from authenticated user
    const workspaceId = 'default-workspace'; // This should come from auth
    
    // Create company
    const company = await prisma.companies.create({
      data: {
        ...companyData,
        workspaceId,
        // TODO: Set assignedUserId from authenticated user
        assignedUserId: null,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    return createSuccessResponse(company, 201);

  } catch (error) {
    console.error('Error creating company:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Company with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to create company', 500);
  }
}
