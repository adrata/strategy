import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const articleId = params.id;
    const body = await request.json();
    const { isFavorite } = body;

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

    // Update favorite status
    const updatedArticle = await prisma.news_articles.update({
      where: { id: articleId },
      data: { 
        isFavorite: isFavorite,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Article ${isFavorite ? 'added to' : 'removed from'} favorites`,
      data: {
        id: updatedArticle.id,
        isFavorite: updatedArticle.isFavorite
      }
    });

  } catch (error) {
    console.error('Error updating article favorite status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update article favorite status' 
    }, { status: 500 });
  }
}
