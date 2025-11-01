import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Fetch channels and direct messages for the workspace
    const [channels, directMessages] = await Promise.all([
      prisma.oasisChannel.findMany({
        where: { workspaceId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.oasisDirectMessage.findMany({
        where: { workspaceId },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          _count: {
            select: { messages: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      })
    ]);

    // Transform channels to match expected format
    const transformedChannels = channels.map(channel => ({
      id: channel.id,
      type: 'channel' as const,
      name: channel.name,
      description: channel.description,
      memberCount: channel.members.length,
      members: channel.members.map(member => ({
        id: member.user.id,
        name: member.user.name,
        email: member.user.email
      }))
    }));

    // Transform direct messages to match expected format
    const transformedDMs = directMessages.map(dm => ({
      id: dm.id,
      type: 'dm' as const,
      name: dm.participants.map(p => p.user.name).join(', '),
      members: dm.participants.map(participant => ({
        id: participant.user.id,
        name: participant.user.name,
        email: participant.user.email
      }))
    }));

    const chats = [...transformedChannels, ...transformedDMs];

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, type, name, description, participants } = body;

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Workspace ID and User ID are required' }, { status: 400 });
    }

    if (type === 'channel') {
      if (!name) {
        return NextResponse.json({ error: 'Channel name is required' }, { status: 400 });
      }

      // Create channel
      const channel = await prisma.oasisChannel.create({
        data: {
          workspaceId,
          name,
          description,
          members: {
            create: {
              userId
            }
          }
        },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      return NextResponse.json({
        chat: {
          id: channel.id,
          type: 'channel',
          name: channel.name,
          description: channel.description,
          memberCount: channel.members.length,
          members: channel.members.map(member => ({
            id: member.user.id,
            name: member.user.name,
            email: member.user.email
          }))
        }
      });
    } else if (type === 'dm') {
      if (!participants || participants.length === 0) {
        return NextResponse.json({ error: 'Participants are required for direct messages' }, { status: 400 });
      }

      // Create direct message
      const dm = await prisma.oasisDirectMessage.create({
        data: {
          workspaceId,
          participants: {
            create: [
              { userId }, // Current user
              ...participants.map((participantId: string) => ({ userId: participantId }))
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      });

      return NextResponse.json({
        chat: {
          id: dm.id,
          type: 'dm',
          name: dm.participants.map(p => p.user.name).join(', '),
          members: dm.participants.map(participant => ({
            id: participant.user.id,
            name: participant.user.name,
            email: participant.user.email
          }))
        }
      });
    } else {
      return NextResponse.json({ error: 'Invalid chat type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
  }
}
