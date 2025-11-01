import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
// Required for static export (desktop build)
export const dynamic = 'force-static';

 * GET /api/workshop/folders
 * Get all folders for the current workspace
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const parentId = searchParams.get('parentId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      workspaceId,
    };

    if (parentId) {
      where.parentId = parentId;
    } else {
      where.parentId = null; // Root level folders
    }

    // Get folders with document counts
    const folders = await prisma.workshopFolder.findMany({
      where,
      orderBy: {
        name: 'asc',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: {
              where: {
                status: { not: 'deleted' },
              },
            },
            children: true,
          },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workshop/folders
 * Create a new folder
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      parentId,
      workspaceId,
      color,
      icon,
    } = body;

    if (!name || !workspaceId) {
      return NextResponse.json(
        { error: 'Name and workspace ID are required' },
        { status: 400 }
      );
    }

    // Check if parent folder exists and user has access
    if (parentId) {
      const parentFolder = await prisma.workshopFolder.findUnique({
        where: { id: parentId },
      });

      if (!parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }

      if (parentFolder.workspaceId !== workspaceId) {
        return NextResponse.json({ error: 'Parent folder access denied' }, { status: 403 });
      }
    }

    // Check if folder with same name already exists in the same parent
    const existingFolder = await prisma.workshopFolder.findFirst({
      where: {
        name,
        parentId: parentId || null,
        workspaceId,
      },
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    // Create folder
    const folder = await prisma.workshopFolder.create({
      data: {
        name,
        description,
        parentId,
        workspaceId,
        ownerId: session.user.id,
        color,
        icon,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            documents: {
              where: {
                status: { not: 'deleted' },
              },
            },
            children: true,
          },
        },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
