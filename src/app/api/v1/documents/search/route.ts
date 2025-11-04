import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

/**
 * Required for static export (desktop build)
 * export const dynamic = 'force-dynamic';
 * 
 * POST /api/v1/documents/search
 * Search documents across the workspace (used by Workbench)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      workspaceId,
      documentType,
      folderId,
      ownerId,
      tags = [],
      dateFrom,
      dateTo,
      isStarred,
      status = 'published',
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc',
    } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      workspaceId,
      status: { not: 'deleted' },
    };

    // Text search
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { has: query } },
      ];
    }

    // Filter by document type
    if (documentType) {
      where.documentType = documentType;
    }

    // Filter by folder
    if (folderId) {
      where.folderId = folderId;
    }

    // Filter by owner
    if (ownerId) {
      where.ownerId = ownerId;
    }

    // Filter by tags
    if (tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      where.updatedAt = {};
      if (dateFrom) {
        where.updatedAt.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.updatedAt.lte = new Date(dateTo);
      }
    }

    // Filter by starred status
    if (isStarred !== undefined) {
      where.isStarred = isStarred;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    let orderBy: any = {};
    
    if (sortBy === 'relevance' && query) {
      // For relevance, we'll order by title match first, then by updated date
      orderBy = [
        { title: 'asc' },
        { updatedAt: 'desc' },
      ];
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Get search results with pagination
    const [documents, total] = await Promise.all([
      prisma.workshopDocument.findMany({
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
      prisma.workshopDocument.count({ where }),
    ]);

    // Calculate search metadata
    const searchMetadata = {
      query,
      totalResults: total,
      searchTime: Date.now(),
      filters: {
        documentType,
        folderId,
        ownerId,
        tags,
        dateFrom,
        dateTo,
        isStarred,
        status,
      },
    };

    return NextResponse.json({
      documents,
      searchMetadata,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    return NextResponse.json(
      { error: 'Failed to search documents' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/documents/search/suggestions
 * Get search suggestions based on partial query (used by Workbench)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const workspaceId = searchParams.get('workspaceId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!query || !workspaceId) {
      return NextResponse.json({ error: 'Query and workspace ID are required' }, { status: 400 });
    }

    // Get document title suggestions
    const documentSuggestions = await prisma.workshopDocument.findMany({
      where: {
        workspaceId,
        status: { not: 'deleted' },
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        title: true,
        documentType: true,
      },
      take: limit,
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get tag suggestions
    const tagSuggestions = await prisma.workshopDocument.findMany({
      where: {
        workspaceId,
        status: { not: 'deleted' },
        tags: {
          has: query,
        },
      },
      select: {
        tags: true,
      },
      take: 50,
    });

    // Extract unique tags that match the query
    const matchingTags = new Set<string>();
    tagSuggestions.forEach(doc => {
      doc.tags.forEach(tag => {
        if (tag.toLowerCase().includes(query.toLowerCase())) {
          matchingTags.add(tag);
        }
      });
    });

    return NextResponse.json({
      suggestions: {
        documents: documentSuggestions,
        tags: Array.from(matchingTags).slice(0, limit),
      },
    });
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    );
  }
}
