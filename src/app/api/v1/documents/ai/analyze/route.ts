import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { documentAnalyzer } from '@/app/[workspace]/atrium/lib/ai/document-analyzer';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = authResult.user;
    const body = await request.json();
    const { documentId, content, documentType, title } = body;

    if (!documentId || !content || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: documentId, content, documentType' },
        { status: 400 }
      );
    }

    // Verify user has access to the document
    const document = await prisma.workshopDocument.findFirst({
      where: {
        id: documentId,
        OR: [
          { ownerId: user.id },
          {
            shares: {
              some: {
                userId: user.id,
                permission: { in: ['view', 'comment', 'edit', 'admin'] },
                expiresAt: { gt: new Date() },
              },
            },
          },
        ],
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found or access denied' },
        { status: 404 }
      );
    }

    // Analyze the document
    const analysis = await documentAnalyzer.analyzeDocument(
      content,
      documentType,
      title
    );

    // Log the analysis activity
    await prisma.workshopActivity.create({
      data: {
        documentId,
        userId: user.id,
        action: 'ai_analysis',
        details: {
          analysisType: 'full_analysis',
          documentType,
          wordCount: analysis.wordCount,
          topics: analysis.topics,
        },
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
    });

  } catch (error) {
    console.error('Error in AI analyze endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
