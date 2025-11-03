import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getSecureApiContext } from '@/platform/services/secure-api-helper';
import { createErrorResponse } from '@/platform/services/secure-api-helper';

/**
// Required for static export (desktop build)
export const dynamic = 'force-dynamic';;

 * GET /api/workshop/folders
 * Get all folders for the current workspace
 */
export async function GET(request: NextRequest) {
  try {
    // Use unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: false
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
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
    let folders;
    try {
      folders = await prisma.workshopFolder.findMany({
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
    } catch (error: any) {
      // Handle case where table doesn't exist yet (migrations not run)
      if (error?.code === 'P2021') {
        console.error('⚠️ workshopFolder table does not exist. Please run database migrations: npx prisma migrate deploy');
        return NextResponse.json({ error: 'Database migration required. Please contact support.' }, { status: 503 });
      }
      throw error;
    }

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
    // Use unified auth system
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: false
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = context.userId;

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
    let existingFolder;
    try {
      existingFolder = await prisma.workshopFolder.findFirst({
        where: {
          name,
          parentId: parentId || null,
          workspaceId,
        },
      });
    } catch (error: any) {
      // Handle case where table doesn't exist yet (migrations not run)
      if (error?.code === 'P2021') {
        console.error('⚠️ workshopFolder table does not exist. Please run database migrations: npx prisma migrate deploy');
        return NextResponse.json({ error: 'Database migration required. Please contact support.' }, { status: 503 });
      }
      throw error;
    }

    if (existingFolder) {
      return NextResponse.json(
        { error: 'Folder with this name already exists' },
        { status: 409 }
      );
    }

    // Create folder
    let folder;
    try {
      folder = await prisma.workshopFolder.create({
      data: {
        name,
        description,
        parentId,
        workspaceId,
        ownerId: userId,
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
    } catch (error: any) {
      // Handle case where table doesn't exist yet (migrations not run)
      if (error?.code === 'P2021') {
        console.error('⚠️ workshopFolder table does not exist. Please run database migrations: npx prisma migrate deploy');
        return NextResponse.json({ error: 'Database migration required. Please contact support.' }, { status: 503 });
      }
      throw error;
    }

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder' },
      { status: 500 }
    );
  }
}
