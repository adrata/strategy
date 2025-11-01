import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, emoji, userId } = body;

    if (!messageId || !emoji || !userId) {
      return NextResponse.json({ error: 'Message ID, emoji, and user ID are required' }, { status: 400 });
    }

    // Check if reaction already exists
    const existingReaction = await prisma.oasisReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      return NextResponse.json({ error: 'Reaction already exists' }, { status: 409 });
    }

    // Create reaction
    const reaction = await prisma.oasisReaction.create({
      data: {
        messageId,
        emoji,
        userId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      reaction: {
        emoji: reaction.emoji,
        userId: reaction.userId
      }
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { messageId, emoji, userId } = body;

    if (!messageId || !emoji || !userId) {
      return NextResponse.json({ error: 'Message ID, emoji, and user ID are required' }, { status: 400 });
    }

    // Delete reaction
    await prisma.oasisReaction.deleteMany({
      where: {
        messageId,
        emoji,
        userId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing reaction:', error);
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}
