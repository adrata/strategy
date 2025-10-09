import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getV1AuthUser } from '../../auth';

const prisma = new PrismaClient();

/**
 * Individual Company CRUD API v1
 * GET /api/v1/companies/[id] - Get a specific company
 * PUT /api/v1/companies/[id] - Update a company (full replacement)
 * PATCH /api/v1/companies/[id] - Partially update a company
 * DELETE /api/v1/companies/[id] - Delete a company
 */

// GET /api/v1/companies/[id] - Get a specific company
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Simple authentication check
    const authUser = await getV1AuthUser(request);
    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;

    const company = await prisma.companies.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        people: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            status: true,
          },
          take: 10,
        },
        actions: {
          select: {
            id: true,
            type: true,
            subject: true,
            status: true,
            priority: true,
            scheduledAt: true,
            completedAt: true,
          },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    if (!company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: company,
    });

  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/companies/[id] - Update a company (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate company ID
    const idValidation = CompanyIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid company ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    const body = await request.json();
    
    // Validate input (PUT requires all fields)
    const validationResult = UpdateCompanySchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid company data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const companyData: UpdateCompanyInput = validationResult.data;
    
    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return createNotFoundErrorResponse('Company not found');
    }

    // Update company (full replacement)
    const updatedCompany = await prisma.companies.update({
      where: { id },
      data: {
        ...companyData,
        updatedAt: new Date(),
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

    return createSuccessResponse(updatedCompany);

  } catch (error) {
    console.error('Error updating company:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Company with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to update company', 500);
  }
}

// PATCH /api/v1/companies/[id] - Partially update a company
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate company ID
    const idValidation = CompanyIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid company ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    const body = await request.json();
    
    // Validate input (PATCH allows partial updates)
    const validationResult = UpdateCompanySchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid company data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const companyData: UpdateCompanyInput = validationResult.data;
    
    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { id },
    });

    if (!existingCompany) {
      return createNotFoundErrorResponse('Company not found');
    }

    // Update company (partial update)
    const updatedCompany = await prisma.companies.update({
      where: { id },
      data: {
        ...companyData,
        updatedAt: new Date(),
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

    return createSuccessResponse(updatedCompany);

  } catch (error) {
    console.error('Error updating company:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Company with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to update company', 500);
  }
}

// DELETE /api/v1/companies/[id] - Delete a company
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate company ID
    const idValidation = CompanyIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid company ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    
    // Check if company exists
    const existingCompany = await prisma.companies.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            people: true,
            actions: true,
          },
        },
      },
    });

    if (!existingCompany) {
      return createNotFoundErrorResponse('Company not found');
    }

    // Check if company has related data
    if (existingCompany._count.people > 0 || existingCompany._count.actions > 0) {
      return createErrorResponse(
        'Cannot delete company with associated people or actions. Please remove or reassign them first.',
        409
      );
    }

    // Delete company
    await prisma.companies.delete({
      where: { id },
    });

    return createSuccessResponse(
      { message: 'Company deleted successfully', id },
      200
    );

  } catch (error) {
    console.error('Error deleting company:', error);
    return createErrorResponse('Failed to delete company', 500);
  }
}
