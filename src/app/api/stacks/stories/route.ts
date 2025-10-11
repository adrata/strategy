import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const epicId = searchParams.get('epicId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (epicId) {
      where.epicId = epicId;
    }

    const stories = await prisma.stacksStory.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ stories });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Failed to fetch stories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, projectId, epicId, title, description, status, priority, assigneeId } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return NextResponse.json({ error: 'Workspace ID, user ID, project ID, and title are required' }, { status: 400 });
    }

    const story = await prisma.stacksStory.create({
      data: {
        projectId,
        epicId: epicId || null,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId: assigneeId || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        epic: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ story });
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}
