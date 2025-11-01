import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const articleId = params.id;
    const body = await request.json();
    const { isRead } = body;

    // Verify article exists and belongs to workspace
    const article = await prisma.news_articles.findFirst({
      where: {
        id: articleId,
        workspaceId
      }
    });

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 });
    }

    // Update read status
    const updatedArticle = await prisma.news_articles.update({
      where: { id: articleId },
      data: { 
        isRead: isRead,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Article marked as ${isRead ? 'read' : 'unread'}`,
      data: {
        id: updatedArticle.id,
        isRead: updatedArticle.isRead
      }
    });

  } catch (error) {
    console.error('Error updating article read status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update article read status' 
    }, { status: 500 });
  }
}
