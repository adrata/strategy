import { NextRequest, NextResponse } from 'next/server';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { prisma } from '@/lib/prisma';

/**
 * PATCH /api/v1/reminders/[id]
 * Update a reminder (mark as completed, update note, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (!context || response) {
      return response || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId, workspaceId } = context;
    const reminderId = params.id;
    const body = await request.json();
    const { isCompleted, note } = body;

    // Find the reminder
    const reminder = await prisma.reminders.findFirst({
      where: {
        id: reminderId,
        workspaceId,
        userId,
        deletedAt: null,
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found or access denied' },
        { status: 404 }
      );
    }

    // Update the reminder
    const updateData: any = {};
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted;
      if (isCompleted) {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (note !== undefined) {
      updateData.note = note;
    }

    const updatedReminder = await prisma.reminders.update({
      where: { id: reminderId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: updatedReminder,
    });
  } catch (error) {
    console.error('❌ [REMINDERS API] Error updating reminder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to update reminder' 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/reminders/[id]
 * Delete a reminder (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true,
    });

    if (!context || response) {
      return response || NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { userId, workspaceId } = context;
    const reminderId = params.id;

    // Find the reminder
    const reminder = await prisma.reminders.findFirst({
      where: {
        id: reminderId,
        workspaceId,
        userId,
        deletedAt: null,
      },
    });

    if (!reminder) {
      return NextResponse.json(
        { success: false, error: 'Reminder not found or access denied' },
        { status: 404 }
      );
    }

    // Soft delete the reminder
    await prisma.reminders.update({
      where: { id: reminderId },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('❌ [REMINDERS API] Error deleting reminder:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to delete reminder' 
      },
      { status: 500 }
    );
  }
}

