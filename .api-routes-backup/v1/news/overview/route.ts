import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/lib/prisma';
import { newsAISummaryService } from '@/platform/services/NewsAISummaryService';
import { newsRankingEngine } from '@/platform/services/NewsRankingEngine';

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);

    // Check if news is enabled for workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { id: workspaceId },
      select: { newsEnabled: true }
    });

    if (!workspace?.newsEnabled) {
      return NextResponse.json({
        success: false,
        error: 'News feature is not enabled for this workspace'
      }, { status: 400 });
    }

    // Get or generate news summary
    let summary;
    if (await newsAISummaryService.shouldRefreshSummary(workspaceId)) {
      summary = await newsAISummaryService.generateNewsSummary(workspaceId);
    } else {
      const cached = await newsAISummaryService.getCachedSummary(workspaceId);
      summary = cached || await newsAISummaryService.generateNewsSummary(workspaceId);
    }

    // Get top 3 articles
    const topArticles = await newsRankingEngine.getTopArticles(workspaceId, 3);

    // Get recent stats
    const stats = await getNewsStats(workspaceId);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          text: summary.summary,
          keyInsights: summary.keyInsights,
          generatedAt: summary.generatedAt,
          expiresAt: summary.expiresAt
        },
        topArticles: topArticles.map(article => ({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          source: article.source,
          category: article.category,
          relevanceScore: article.relevanceScore,
          relatedCompany: article.company ? {
            id: article.company.id,
            name: article.company.name
          } : null,
          relatedPerson: article.person ? {
            id: article.person.id,
            fullName: article.person.fullName,
            company: article.person.company?.name
          } : null,
          isRead: article.isRead,
          isFavorite: article.isFavorite
        })),
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching news overview:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch news overview' 
    }, { status: 500 });
  }
}

async function getNewsStats(workspaceId: string) {
  const [
    totalArticles,
    unreadArticles,
    todayArticles,
    thisWeekArticles,
    categoryStats
  ] = await Promise.all([
    prisma.news_articles.count({ where: { workspaceId } }),
    prisma.news_articles.count({ where: { workspaceId, isRead: false } }),
    prisma.news_articles.count({ 
      where: { 
        workspaceId, 
        publishedAt: { 
          gte: new Date(new Date().setHours(0, 0, 0, 0)) 
        } 
      } 
    }),
    prisma.news_articles.count({ 
      where: { 
        workspaceId, 
        publishedAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      } 
    }),
    prisma.news_articles.groupBy({
      by: ['category'],
      where: { workspaceId },
      _count: { category: true }
    })
  ]);

  const categoryBreakdown = categoryStats.reduce((acc, stat) => {
    acc[stat.category] = stat._count.category;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: totalArticles,
    unread: unreadArticles,
    today: todayArticles,
    thisWeek: thisWeekArticles,
    categories: {
      INDUSTRY: categoryBreakdown.INDUSTRY || 0,
      COMPANY: categoryBreakdown.COMPANY || 0,
      PERSON: categoryBreakdown.PERSON || 0,
      GENERAL: categoryBreakdown.GENERAL || 0
    }
  };
}
