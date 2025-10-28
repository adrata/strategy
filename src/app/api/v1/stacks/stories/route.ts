import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [STACKS API] GET request received');
    console.log('🔍 [STACKS API] Request URL:', request.url);
    console.log('🔍 [STACKS API] Request headers:', Object.fromEntries(request.headers.entries()));
    
    const session = await getServerSession(authOptions);
    console.log('🔍 [STACKS API] Session:', session ? 'exists' : 'null');
    console.log('🔍 [STACKS API] User ID:', session?.user?.id);
    console.log('🔍 [STACKS API] User email:', session?.user?.email);
    
    if (!session?.user?.id) {
      console.log('❌ [STACKS API] No session or user ID');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const category = searchParams.get('category'); // 'build' or 'sell'
    const status = searchParams.get('status');
    const epicId = searchParams.get('epicId');
    const assigneeId = searchParams.get('assigneeId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      project: {
        workspaceId: workspaceId
      }
    };

    // Note: category field doesn't exist in StacksStory schema yet
    // if (category) {
    //   where.category = category;
    // }

    if (status) {
      where.status = status;
    }

    if (epicId) {
      where.epicId = epicId;
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    // Fetch stories with epic and assignee information
    const stories = await prisma.stacksStory.findMany({
      where,
      include: {
        epic: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Transform the data to match the expected format
    const transformedStories = stories.map(story => ({
      id: story.id,
      title: story.title,
      description: story.description,
      status: story.status,
      priority: story.priority,
      assignee: story.assignee ? {
        id: story.assignee.id,
        name: `${story.assignee.firstName} ${story.assignee.lastName}`,
        email: story.assignee.email
      } : null,
      epic: story.epic ? {
        id: story.epic.id,
        title: story.epic.title,
        description: story.epic.description
      } : null,
      project: story.project ? {
        id: story.project.id,
        name: story.project.name,
        category: story.project.category
      } : null,
      dueDate: null, // dueDate field doesn't exist in schema yet
      tags: [], // tags field doesn't exist in schema yet
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      // Calculate time in current status (in days)
      timeInStatus: story.updatedAt ? Math.floor((Date.now() - new Date(story.updatedAt).getTime()) / (1000 * 60 * 60 * 24)) : 0
    }));

    return NextResponse.json({ stories: transformedStories });

  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, status, priority, assigneeId, epicId, projectId } = body;

    if (!title || !projectId) {
      return NextResponse.json({ error: 'Title and project ID are required' }, { status: 400 });
    }

    const story = await prisma.stacksStory.create({
      data: {
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 'medium',
        assigneeId: assigneeId || null,
        epicId: epicId || null,
        projectId,
        // dueDate and tags fields don't exist in schema yet
        createdAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        epic: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, status, priority, assigneeId, epicId } = body;

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    const story = await prisma.stacksStory.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(assigneeId !== undefined && { assigneeId }),
        ...(epicId !== undefined && { epicId }),
        // dueDate and tags fields don't exist in schema yet
        updatedAt: new Date()
      },
      include: {
        epic: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            category: true
          }
        }
      }
    });

    return NextResponse.json({ story });

  } catch (error) {
    console.error('Error updating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Story ID is required' }, { status: 400 });
    }

    await prisma.stacksStory.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
