import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const search = searchParams.get('search');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const where: any = {
      project: { workspaceId }
    };

    if (projectId) {
      where.projectId = projectId;
    }

    // Add search functionality
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const epics = await prisma.stacksEpic.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true }
        },
        _count: {
          select: { stories: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ epics });
  } catch (error) {
    console.error('Error fetching epics:', error);
    return NextResponse.json({ error: 'Failed to fetch epics' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, projectId, title, description, status, priority } = body;

    if (!workspaceId || !userId || !projectId || !title) {
      return NextResponse.json({ error: 'Workspace ID, user ID, project ID, and title are required' }, { status: 400 });
    }

    const epic = await prisma.stacksEpic.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium'
      },
      include: {
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({ epic });
  } catch (error) {
    console.error('Error creating epic:', error);
    return NextResponse.json({ error: 'Failed to create epic' }, { status: 500 });
  }
}
