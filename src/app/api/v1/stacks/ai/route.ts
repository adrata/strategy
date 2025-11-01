import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const workspaceId = session.user.activeWorkspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    switch (action) {
      case 'create_story':
        return await createStory(data, workspaceId, session.user.id);
      
      case 'update_story_status':
        return await updateStoryStatus(data, workspaceId, session.user.id);
      
      case 'assign_story':
        return await assignStory(data, workspaceId, session.user.id);
      
      case 'move_story':
        return await moveStory(data, workspaceId, session.user.id);
      
      case 'organize_backlog':
        return await organizeBacklog(data, workspaceId, session.user.id);
      
      case 'create_epic':
        return await createEpic(data, workspaceId, session.user.id);
      
      case 'get_stories':
        return await getStories(workspaceId, data?.filters);
      
      case 'get_epics':
        return await getEpics(workspaceId);
      
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in Stacks AI API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function createStory(data: any, workspaceId: string, userId: string) {
  const { title, description, epicId, priority = 'medium', assigneeId } = data;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Find or create project
  let project = await prisma.stacksProject.findFirst({
    where: { workspaceId }
  });

  if (!project) {
    project = await prisma.stacksProject.create({
      data: {
        workspaceId,
        name: 'Default Project',
        description: 'Default project for stories'
      }
    });
  }

  const story = await prisma.stacksStory.create({
    data: {
      projectId: project.id,
      epicId: epicId || null,
      title,
      description: description || '',
      status: 'todo',
      priority,
      assigneeId: assigneeId || userId,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    include: {
      epic: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ success: true, story });
}

async function updateStoryStatus(data: any, workspaceId: string, userId: string) {
  const { storyId, status } = data;

  if (!storyId || !status) {
    return NextResponse.json({ error: 'Story ID and status are required' }, { status: 400 });
  }

  const story = await prisma.stacksStory.update({
    where: { id: storyId },
    data: {
      status,
      updatedAt: new Date()
    },
    include: {
      epic: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ success: true, story });
}

async function assignStory(data: any, workspaceId: string, userId: string) {
  const { storyId, assigneeId } = data;

  if (!storyId || !assigneeId) {
    return NextResponse.json({ error: 'Story ID and assignee ID are required' }, { status: 400 });
  }

  const story = await prisma.stacksStory.update({
    where: { id: storyId },
    data: {
      assigneeId,
      updatedAt: new Date()
    },
    include: {
      epic: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ success: true, story });
}

async function moveStory(data: any, workspaceId: string, userId: string) {
  const { storyId, newStatus } = data;

  if (!storyId || !newStatus) {
    return NextResponse.json({ error: 'Story ID and new status are required' }, { status: 400 });
  }

  const story = await prisma.stacksStory.update({
    where: { id: storyId },
    data: {
      status: newStatus,
      updatedAt: new Date()
    },
    include: {
      epic: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      }
    }
  });

  return NextResponse.json({ success: true, story });
}

async function organizeBacklog(data: any, workspaceId: string, userId: string) {
  const { stories } = data;

  if (!stories || !Array.isArray(stories)) {
    return NextResponse.json({ error: 'Stories array is required' }, { status: 400 });
  }

  // Update priority and status for multiple stories
  const updatePromises = stories.map((story: any) => 
    prisma.stacksStory.update({
      where: { id: story.id },
      data: {
        priority: story.priority || 'medium',
        status: story.status || 'todo',
        updatedAt: new Date()
      }
    })
  );

  await Promise.all(updatePromises);

  return NextResponse.json({ success: true, message: 'Backlog organized successfully' });
}

async function createEpic(data: any, workspaceId: string, userId: string) {
  const { title, description } = data;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Find or create project
  let project = await prisma.stacksProject.findFirst({
    where: { workspaceId }
  });

  if (!project) {
    project = await prisma.stacksProject.create({
      data: {
        workspaceId,
        name: 'Default Project',
        description: 'Default project for epics'
      }
    });
  }

  const epic = await prisma.stacksEpic.create({
    data: {
      projectId: project.id,
      title,
      description: description || '',
      status: 'todo',
      priority: 'medium'
    }
  });

  return NextResponse.json({ success: true, epic });
}

async function getStories(workspaceId: string, filters: any = {}) {
  const where: any = {
    project: {
      workspaceId
    }
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.epicId) {
    where.epicId = filters.epicId;
  }

  if (filters.assigneeId) {
    where.assigneeId = filters.assigneeId;
  }

  const stories = await prisma.stacksStory.findMany({
    where,
    include: {
      epic: true,
      assignee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      project: true
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return NextResponse.json({ success: true, stories });
}

async function getEpics(workspaceId: string) {
  const epics = await prisma.stacksEpic.findMany({
    where: {
      project: {
        workspaceId
      }
    },
    include: {
      project: true,
      stories: {
        include: {
          assignee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return NextResponse.json({ success: true, epics });
}
