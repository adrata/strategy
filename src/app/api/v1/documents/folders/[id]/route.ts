import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/atrium/folders/[id]
 * Get a specific folder by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const folder = await prisma.atriumFolder.findUnique({
      where: { id: params.id },
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
        children: {
          orderBy: {
            name: 'asc',
          },
          include: {
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
        },
        documents: {
          where: {
            status: { not: 'deleted' },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 20, // Limit to recent documents
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
                shares: true,
                versions: true,
                comments: true,
              },
            },
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

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if user has access to this folder
    const hasAccess = await checkFolderAccess(folder, session.user.id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error fetching folder:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/atrium/folders/[id]
 * Update a folder
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      color,
      icon,
    } = body;

    // Get existing folder to check permissions
    const existingFolder = await prisma.atriumFolder.findUnique({
      where: { id: params.id },
    });

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if user has edit access
    const hasEditAccess = await checkFolderEditAccess(existingFolder, session.user.id);
    if (!hasEditAccess) {
      return NextResponse.json({ error: 'Edit access denied' }, { status: 403 });
    }

    // Check if moving to a new parent
    if (parentId && parentId !== existingFolder.parentId) {
      // Check if new parent exists and user has access
      const newParent = await prisma.atriumFolder.findUnique({
        where: { id: parentId },
      });

      if (!newParent) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 });
      }

      if (newParent.workspaceId !== existingFolder.workspaceId) {
        return NextResponse.json({ error: 'Parent folder access denied' }, { status: 403 });
      }

      // Check for circular reference
      if (await wouldCreateCircularReference(params.id, parentId)) {
        return NextResponse.json(
          { error: 'Cannot move folder into its own subfolder' },
          { status: 400 }
        );
      }

      // Check if folder with same name already exists in new parent
      if (name && name !== existingFolder.name) {
        const existingName = await prisma.atriumFolder.findFirst({
          where: {
            name,
            parentId,
            workspaceId: existingFolder.workspaceId,
            id: { not: params.id },
          },
        });

        if (existingName) {
          return NextResponse.json(
            { error: 'Folder with this name already exists in the target location' },
            { status: 409 }
          );
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (parentId !== undefined) updateData.parentId = parentId;
    if (color !== undefined) updateData.color = color;
    if (icon !== undefined) updateData.icon = icon;

    // Update folder
    const folder = await prisma.atriumFolder.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(folder);
  } catch (error) {
    console.error('Error updating folder:', error);
    return NextResponse.json(
      { error: 'Failed to update folder' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/atrium/folders/[id]
 * Delete a folder (only if empty)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get existing folder to check permissions
    const existingFolder = await prisma.atriumFolder.findUnique({
      where: { id: params.id },
      include: {
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

    if (!existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Check if user has delete access
    const hasDeleteAccess = await checkFolderDeleteAccess(existingFolder, session.user.id);
    if (!hasDeleteAccess) {
      return NextResponse.json({ error: 'Delete access denied' }, { status: 403 });
    }

    // Check if folder is empty
    if (existingFolder._count.documents > 0 || existingFolder._count.children > 0) {
      return NextResponse.json(
        { error: 'Cannot delete folder that contains documents or subfolders' },
        { status: 400 }
      );
    }

    // Delete folder
    await prisma.atriumFolder.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Folder deleted successfully' });
  } catch (error) {
    console.error('Error deleting folder:', error);
    return NextResponse.json(
      { error: 'Failed to delete folder' },
      { status: 500 }
    );
  }
}

/**
 * Check if user has access to view a folder
 */
async function checkFolderAccess(folder: any, userId: string): Promise<boolean> {
  // Check if user is in the same workspace
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: {
      workspaceId: folder.workspaceId,
      userId,
      isActive: true,
    },
  });

  return !!workspaceUser;
}

/**
 * Check if user has edit access to a folder
 */
async function checkFolderEditAccess(folder: any, userId: string): Promise<boolean> {
  // Owner always has edit access
  if (folder.ownerId === userId) {
    return true;
  }

  // Check if user is in the same workspace
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: {
      workspaceId: folder.workspaceId,
      userId,
      isActive: true,
    },
  });

  return !!workspaceUser;
}

/**
 * Check if user has delete access to a folder
 */
async function checkFolderDeleteAccess(folder: any, userId: string): Promise<boolean> {
  // Only owner can delete folders
  return folder.ownerId === userId;
}

/**
 * Check if moving a folder would create a circular reference
 */
async function wouldCreateCircularReference(folderId: string, newParentId: string): Promise<boolean> {
  let currentParentId = newParentId;
  
  while (currentParentId) {
    if (currentParentId === folderId) {
      return true;
    }
    
    const parent = await prisma.atriumFolder.findUnique({
      where: { id: currentParentId },
      select: { parentId: true },
    });
    
    currentParentId = parent?.parentId || null;
  }
  
  return false;
}
