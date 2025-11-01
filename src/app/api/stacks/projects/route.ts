import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const projects = await prisma.stacksProject.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: {
            epics: true,
            stories: true,
            tasks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspaceId, userId, name, description } = body;

    if (!workspaceId || !userId || !name) {
      return NextResponse.json({ error: 'Workspace ID, user ID, and name are required' }, { status: 400 });
    }

    const project = await prisma.stacksProject.create({
      data: {
        workspaceId,
        name,
        description
      }
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
  }
}
