import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const document = await prisma.workshopDocument.findUnique({
      where: {
        id,
        deletedAt: null
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        shares: {
          select: {
            id: true,
            shareToken: true,
            viewCount: true,
            createdAt: true
          }
        },
        versions: {
          orderBy: {
            versionNumber: 'desc'
          },
          take: 5,
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        comments: {
          where: {
            deletedAt: null
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true
              }
            },
            replies: {
              where: {
                deletedAt: null
              },
              include: {
                createdBy: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        activities: {
          include: {
            performedBy: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10
        }
      }
    });

    if (!document) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Log view activity
    await prisma.workshopActivity.create({
      data: {
        documentId: document.id,
        activityType: 'VIEWED',
        description: 'Report viewed',
        performedById: document.createdById // TODO: Get actual viewer ID
      }
    });

    return NextResponse.json({
      success: true,
      document
    });

  } catch (error) {
    console.error('Error fetching Workshop report:', error);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { 
      title, 
      content, 
      metadata,
      userId
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get current document
    const currentDocument = await prisma.workshopDocument.findUnique({
      where: { id }
    });

    if (!currentDocument) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Create version before updating
    const latestVersion = await prisma.workshopVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNumber: 'desc' }
    });

    const newVersionNumber = (latestVersion?.versionNumber || 0) + 1;

    await prisma.workshopVersion.create({
      data: {
        documentId: id,
        versionNumber: newVersionNumber,
        content: currentDocument.content || '',
        contentHash: 'hash-placeholder', // TODO: Implement proper content hashing
        changeDescription: 'Auto-saved version',
        createdById: userId
      }
    });

    // Update document
    const updatedDocument = await prisma.workshopDocument.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(metadata && { metadata }),
        updatedAt: new Date()
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Log update activity
    await prisma.workshopActivity.create({
      data: {
        documentId: id,
        activityType: 'UPDATED',
        description: 'Report updated',
        metadata: {
          versionNumber: newVersionNumber,
          fieldsUpdated: Object.keys(body).filter(key => key !== 'userId')
        },
        performedById: userId
      }
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument
    });

  } catch (error) {
    console.error('Error updating Workshop report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Soft delete the document
    const deletedDocument = await prisma.workshopDocument.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    });

    // Log deletion activity
    await prisma.workshopActivity.create({
      data: {
        documentId: id,
        activityType: 'DELETED',
        description: 'Report deleted',
        performedById: userId
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Report deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting Workshop report:', error);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
