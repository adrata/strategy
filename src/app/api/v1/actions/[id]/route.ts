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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
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

    // Prepare update data with automatic completion handling
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // If status is being changed to COMPLETED, set completedAt
    if (body.status === 'COMPLETED' && existingAction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Update action
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: updateData,
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

    // Update person's lastAction fields if action is completed
    if (updatedAction.personId && updatedAction.status === 'COMPLETED') {
      try {
        await prisma.people.update({
          where: { id: updatedAction.personId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PUT] Updated person lastAction fields:', {
          personId: updatedAction.personId,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PUT] Failed to update person lastAction fields:', error);
      }
    }

    // Update company's lastAction fields if action is completed
    if (updatedAction.companyId && updatedAction.status === 'COMPLETED') {
      try {
        await prisma.companies.update({
          where: { id: updatedAction.companyId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PUT] Updated company lastAction fields:', {
          companyId: updatedAction.companyId,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PUT] Failed to update company lastAction fields:', error);
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
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

    // Prepare update data with automatic completion handling
    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    // If status is being changed to COMPLETED, set completedAt
    if (body.status === 'COMPLETED' && existingAction.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Update action with partial data
    const updatedAction = await prisma.actions.update({
      where: { id },
      data: updateData,
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

    // Update person's lastAction fields if action is completed
    if (updatedAction.personId && updatedAction.status === 'COMPLETED') {
      try {
        await prisma.people.update({
          where: { id: updatedAction.personId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PATCH] Updated person lastAction fields:', {
          personId: updatedAction.personId,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PATCH] Failed to update person lastAction fields:', error);
      }
    }

    // Update company's lastAction fields if action is completed
    if (updatedAction.companyId && updatedAction.status === 'COMPLETED') {
      try {
        await prisma.companies.update({
          where: { id: updatedAction.companyId },
          data: {
            lastAction: updatedAction.subject,
            lastActionDate: updatedAction.completedAt || updatedAction.updatedAt,
            actionStatus: updatedAction.status
          }
        });
        console.log('✅ [ACTIONS PATCH] Updated company lastAction fields:', {
          companyId: updatedAction.companyId,
          lastAction: updatedAction.subject,
          lastActionDate: updatedAction.completedAt || updatedAction.updatedAt
        });
      } catch (error) {
        console.error('❌ [ACTIONS PATCH] Failed to update company lastAction fields:', error);
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;
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
