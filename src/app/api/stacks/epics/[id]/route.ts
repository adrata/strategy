import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { workspaceId, title, description, status, priority, rank } = body;
    const { id } = resolvedParams;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify epic belongs to workspace
    const existingEpic = await prisma.stacksEpic.findFirst({
      where: {
        id,
        project: {
          workspaceId
        }
      }
    });

    if (!existingEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (rank !== undefined && rank !== null) updateData.rank = rank;

    const epic = await prisma.stacksEpic.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ epic, epoch: epic });
  } catch (error) {
    console.error('Error updating epic:', error);
    return NextResponse.json({ error: 'Failed to update epic' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { workspaceId } = body;
    const { id } = resolvedParams;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Verify epic belongs to workspace before deleting
    const existingEpic = await prisma.stacksEpic.findFirst({
      where: {
        id,
        project: {
          workspaceId
        }
      }
    });

    if (!existingEpic) {
      return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
    }

    await prisma.stacksEpic.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting epic:', error);
    return NextResponse.json({ error: 'Failed to delete epic' }, { status: 500 });
  }
}
