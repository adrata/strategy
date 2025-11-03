import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId, title, description, status, priority } = body;
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const epoch = await prisma.stacksEpoch.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority })
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ epic: epoch, epoch });
  } catch (error) {
    console.error('Error updating epoch:', error);
    return NextResponse.json({ error: 'Failed to update epoch' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { userId } = body;
    const { id } = params;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await prisma.stacksEpoch.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting epoch:', error);
    return NextResponse.json({ error: 'Failed to delete epoch' }, { status: 500 });
  }
}
