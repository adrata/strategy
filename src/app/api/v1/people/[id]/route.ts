import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationErrorResponse,
  createNotFoundErrorResponse,
  createAuthErrorResponse,
  getRequestId 
} from '../utils';
import { 
  UpdatePersonSchema, 
  PersonIdSchema,
  type UpdatePersonInput 
} from '../schemas';

const prisma = new PrismaClient();

/**
 * Individual Person CRUD API v1
 * GET /api/v1/people/[id] - Get a specific person
 * PUT /api/v1/people/[id] - Update a person (full replacement)
 * PATCH /api/v1/people/[id] - Partially update a person
 * DELETE /api/v1/people/[id] - Delete a person
 */

// GET /api/v1/people/[id] - Get a specific person
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // Validate person ID
    const idValidation = PersonIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid person ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    
    // TODO: Add authentication and workspace filtering
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();
    // const workspaceId = user.activeWorkspaceId;

    const person = await prisma.people.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
            website: true,
            phone: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
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
          take: 10, // Limit to first 10 actions
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            actions: true,
          },
        },
      },
    });

    if (!person) {
      return createNotFoundErrorResponse('Person not found');
    }

    return createSuccessResponse(person);

  } catch (error) {
    console.error('Error fetching person:', error);
    return createErrorResponse('Failed to fetch person', 500);
  }
}

// PUT /api/v1/people/[id] - Update a person (full replacement)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate person ID
    const idValidation = PersonIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid person ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    const body = await request.json();
    
    // Validate input (PUT requires all fields)
    const validationResult = UpdatePersonSchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid person data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const personData: UpdatePersonInput = validationResult.data;
    
    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { id },
    });

    if (!existingPerson) {
      return createNotFoundErrorResponse('Person not found');
    }

    // Update person (full replacement)
    const updatedPerson = await prisma.people.update({
      where: { id },
      data: {
        ...personData,
        updatedAt: new Date(),
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

    return createSuccessResponse(updatedPerson);

  } catch (error) {
    console.error('Error updating person:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Person with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to update person', 500);
  }
}

// PATCH /api/v1/people/[id] - Partially update a person
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate person ID
    const idValidation = PersonIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid person ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    const body = await request.json();
    
    // Validate input (PATCH allows partial updates)
    const validationResult = UpdatePersonSchema.safeParse(body);
    if (!validationResult.success) {
      return createValidationErrorResponse(
        'Invalid person data',
        validationResult.error.flatten().fieldErrors
      );
    }

    const personData: UpdatePersonInput = validationResult.data;
    
    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { id },
    });

    if (!existingPerson) {
      return createNotFoundErrorResponse('Person not found');
    }

    // Update person (partial update)
    const updatedPerson = await prisma.people.update({
      where: { id },
      data: {
        ...personData,
        updatedAt: new Date(),
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

    return createSuccessResponse(updatedPerson);

  } catch (error) {
    console.error('Error updating person:', error);
    
    // Handle unique constraint violations
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return createErrorResponse('Person with this information already exists', 409);
    }
    
    return createErrorResponse('Failed to update person', 500);
  }
}

// DELETE /api/v1/people/[id] - Delete a person
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request);
  
  try {
    // TODO: Add authentication check
    // const user = await authenticateUser(request);
    // if (!user) return createAuthErrorResponse();

    // Validate person ID
    const idValidation = PersonIdSchema.safeParse({ id: params.id });
    if (!idValidation.success) {
      return createValidationErrorResponse(
        'Invalid person ID',
        idValidation.error.flatten().fieldErrors
      );
    }

    const { id } = idValidation.data;
    
    // Check if person exists
    const existingPerson = await prisma.people.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            actions: true,
          },
        },
      },
    });

    if (!existingPerson) {
      return createNotFoundErrorResponse('Person not found');
    }

    // Check if person has related data
    if (existingPerson._count.actions > 0) {
      return createErrorResponse(
        'Cannot delete person with associated actions. Please remove or reassign them first.',
        409
      );
    }

    // Delete person
    await prisma.people.delete({
      where: { id },
    });

    return createSuccessResponse(
      { message: 'Person deleted successfully', id },
      200
    );

  } catch (error) {
    console.error('Error deleting person:', error);
    return createErrorResponse('Failed to delete person', 500);
  }
}
