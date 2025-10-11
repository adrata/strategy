import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const storyId = searchParams.get('storyId');
    const type = searchParams.get('type');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (storyId) {
      where.storyId = storyId;
    }

    if (type) {
      where.type = type;
    }

    const tasks = await prisma.stacksTask.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, projectId, storyId, title, description, status, priority, type, assigneeId } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return NextResponse.json({ error: 'Workspace ID, user ID, project ID, and title are required' }, { status: 400 });
    }

    const task = await prisma.stacksTask.create({
      data: {
        projectId,
        storyId: storyId || null,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        type: type || 'task',
        assigneeId: assigneeId || null
      },
      include: {
        project: {
          select: { id: true, name: true }
        },
        story: {
          select: { id: true, title: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
