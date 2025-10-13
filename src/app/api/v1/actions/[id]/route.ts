import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getV1AuthUser } from '../../auth';

const prisma = new PrismaClient();

/**
 * Individual Action CRUD API v1
 * GET /api/v1/actions/[id] - Get a specific action
 * PUT /api/v1/actions/[id] - Update an action (full replacement)
 * PATCH /api/v1/actions/[id] - Partially update an action
 * DELETE /api/v1/actions/[id] - Delete an action
 */

// GET /api/v1/actions/[id] - Get a specific action
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

    const action = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only show non-deleted records
      },
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
            status: true,
            priority: true,
          },
          where: {
            deletedAt: null // Only show non-deleted companies
          }
        },
        person: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            jobTitle: true,
            email: true,
            status: true,
            priority: true,
          },
          where: {
            deletedAt: null // Only show non-deleted people
          }
        },
      },
    });

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: action,
    });

  } catch (error) {
    console.error('Error fetching action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch action' },
      { status: 500 }
    );
  }
}

// PUT /api/v1/actions/[id] - Update an action (full replacement)
export async function PUT(
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
    const body = await request.json();

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Update action
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
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

    return NextResponse.json({
      success: true,
      data: updatedAction,
      meta: {
        message: 'Action updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating action:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// PATCH /api/v1/actions/[id] - Partially update an action
export async function PATCH(
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
    const body = await request.json();

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only update non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    // Update action with partial data
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date(),
      },
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

    return NextResponse.json({
      success: true,
      data: updatedAction,
      meta: {
        message: 'Action updated successfully',
      },
    });

  } catch (error) {
    console.error('Error updating action:', error);
    
    return NextResponse.json(
      { success: false, error: 'Failed to update action' },
      { status: 500 }
    );
  }
}

// DELETE /api/v1/actions/[id] - Delete an action
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'soft'; // Default to soft delete

    // Check if action exists
    const existingAction = await prisma.actions.findUnique({
      where: { 
        id,
        deletedAt: null // Only delete non-deleted records
      },
    });

    if (!existingAction) {
      return NextResponse.json(
        { success: false, error: 'Action not found' },
        { status: 404 }
      );
    }

    if (mode === 'hard') {
      // Hard delete - permanently remove from database
      await prisma.actions.delete({
        where: { id },
      });
    } else {
      // Soft delete - set deletedAt timestamp
      await prisma.actions.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      meta: {
        message: `Action ${mode === 'hard' ? 'permanently deleted' : 'deleted'} successfully`,
        mode,
      },
    });

  } catch (error) {
    console.error('Error deleting action:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete action' },
      { status: 500 }
    );
  }
}
