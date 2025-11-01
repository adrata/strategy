import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authFetch } from '@/platform/api-fetch';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      content, 
      type = 'PAPER', 
      reportType, 
      sourceRecordId, 
      sourceRecordType, 
      generatedByAI = false,
      metadata = {},
      workspaceId,
      userId
    } = body;

    if (!title || !workspaceId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create the document
    const document = await prisma.workshopDocument.create({
      data: {
        title,
        content,
        type: type as any,
        workspaceId,
        createdById: userId,
        reportType,
        sourceRecordId,
        sourceRecordType,
        generatedByAI,
        metadata: {
          ...metadata,
          createdAt: new Date().toISOString(),
          reportType,
          sourceRecordId,
          sourceRecordType
        }
      },
      include: {
        workspace: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Create activity log
    await prisma.workshopActivity.create({
      data: {
        documentId: document.id,
        activityType: 'CREATED',
        description: generatedByAI ? 'AI-generated report created' : 'Report created',
        metadata: {
          reportType,
          sourceRecordId,
          sourceRecordType,
          generatedByAI
        },
        performedById: userId
      }
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      document
    });

  } catch (error) {
    console.error('Error creating Workshop report:', error);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');
    const reportType = searchParams.get('reportType');
    const sourceRecordId = searchParams.get('sourceRecordId');
    const sourceRecordType = searchParams.get('sourceRecordType');
    const generatedByAI = searchParams.get('generatedByAI') === 'true';

    if (!workspaceId || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Build where clause
    const where: any = {
      workspaceId,
      deletedAt: null
    };

    if (reportType) {
      where.reportType = reportType;
    }

    if (sourceRecordId && sourceRecordType) {
      where.sourceRecordId = sourceRecordId;
      where.sourceRecordType = sourceRecordType;
    }

    if (generatedByAI !== null) {
      where.generatedByAI = generatedByAI;
    }

    const documents = await prisma.workshopDocument.findMany({
      where,
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
        _count: {
          select: {
            versions: true,
            comments: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      documents
    });

  } catch (error) {
    console.error('Error fetching Workshop reports:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
