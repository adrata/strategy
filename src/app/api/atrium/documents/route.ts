import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * GET /api/atrium/documents
 * Get all documents for the current workspace with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const folderId = searchParams.get('folderId');
    const documentType = searchParams.get('type');
    const status = searchParams.get('status');
    const isStarred = searchParams.get('starred');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'updatedAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      workspaceId,
      status: { not: 'deleted' }, // Exclude deleted documents
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (documentType) {
      where.documentType = documentType;
    }

    if (status) {
      where.status = status;
    }

    if (isStarred === 'true') {
      where.isStarred = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get documents with pagination
    const [documents, total] = await Promise.all([
      prisma.atriumDocument.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          folder: {
            select: {
              id: true,
              name: true,
            },
          },
          company: {
            select: {
              id: true,
              name: true,
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
      }),
      prisma.atriumDocument.count({ where }),
    ]);

    return NextResponse.json({
      documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/atrium/documents
 * Create a new document
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      documentType,
      folderId,
      workspaceId,
      companyId,
      tags = [],
      isTemplate = false,
      content,
    } = body;

    if (!title || !documentType || !workspaceId) {
      return NextResponse.json(
        { error: 'Title, document type, and workspace ID are required' },
        { status: 400 }
      );
    }

    // Validate document type
    const validTypes = ['paper', 'pitch', 'grid', 'code'];
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Create document
    const document = await prisma.atriumDocument.create({
      data: {
        title,
        description,
        documentType,
        folderId,
        workspaceId,
        companyId,
        ownerId: session.user.id,
        tags,
        isTemplate,
        content,
        fileType: getMimeTypeForDocumentType(documentType),
        status: 'draft',
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create activity log
    await prisma.atriumActivity.create({
      data: {
        documentId: document.id,
        userId: session.user.id,
        activityType: 'created',
        description: `Created document "${title}"`,
        metadata: {
          documentType,
          folderId,
        },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get MIME type for document type
 */
function getMimeTypeForDocumentType(documentType: string): string {
  switch (documentType) {
    case 'paper':
      return 'application/json'; // Rich text content as JSON
    case 'pitch':
      return 'application/json'; // Presentation content as JSON
    case 'grid':
      return 'application/json'; // Spreadsheet content as JSON
    case 'code':
      return 'text/plain'; // Code content as text
    default:
      return 'application/octet-stream';
  }
}
