import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/lib/prisma';
import { newsRankingEngine } from '@/platform/services/NewsRankingEngine';

export async function GET(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const sortBy = searchParams.get('sortBy') || 'relevance'; // relevance, date, unread

    // Build where clause
    const where: any = {
      workspaceId
    };

    if (category && category !== 'all') {
      where.category = category.toUpperCase();
    }

    if (unreadOnly) {
      where.isRead = false;
    }

    // Build orderBy clause
    let orderBy: any[] = [];
    switch (sortBy) {
      case 'date':
        orderBy = [{ publishedAt: 'desc' }];
        break;
      case 'unread':
        orderBy = [{ isRead: 'asc' }, { publishedAt: 'desc' }];
        break;
      case 'relevance':
      default:
        orderBy = [{ relevanceScore: 'desc' }, { publishedAt: 'desc' }];
        break;
    }

    // Get articles
    const articles = await prisma.news_articles.findMany({
      where,
      orderBy,
      skip: offset,
      take: limit,
      include: {
        company: {
          select: { id: true, name: true }
        },
        person: {
          select: { 
            id: true, 
            fullName: true, 
            company: { 
              select: { name: true } 
            } 
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.news_articles.count({ where });

    // Get unread count
    const unreadCount = await prisma.news_articles.count({
      where: { workspaceId, isRead: false }
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: articles.map(article => ({
          id: article.id,
          title: article.title,
          description: article.description,
          url: article.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          source: article.source,
          author: article.author,
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
          industries: article.industries,
          tags: article.tags,
          isRead: article.isRead,
          isFavorite: article.isFavorite,
          createdAt: article.createdAt
        })),
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        stats: {
          total: totalCount,
          unread: unreadCount,
          byCategory: {
            INDUSTRY: await prisma.news_articles.count({ where: { workspaceId, category: 'INDUSTRY' } }),
            COMPANY: await prisma.news_articles.count({ where: { workspaceId, category: 'COMPANY' } }),
            PERSON: await prisma.news_articles.count({ where: { workspaceId, category: 'PERSON' } }),
            GENERAL: await prisma.news_articles.count({ where: { workspaceId, category: 'GENERAL' } })
          }
        }
      }
    });

  } catch (error) {
    console.error('Error fetching news articles:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch news articles' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'refresh':
        return await handleRefreshNews(workspaceId);
      case 'markAllRead':
        return await handleMarkAllRead(workspaceId);
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid action' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Error processing news action:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process news action' 
    }, { status: 500 });
  }
}

async function handleRefreshNews(workspaceId: string) {
  try {
    // Import here to avoid circular dependencies
    const { newsAggregationService } = await import('@/platform/services/NewsAggregationService');
    
    // Get workspace news configuration
    const config = await newsAggregationService.getWorkspaceNewsConfig(workspaceId);
    
    if (!config.newsEnabled) {
      return NextResponse.json({
        success: false,
        error: 'News feature is not enabled for this workspace'
      }, { status: 400 });
    }

    // Aggregate news
    const articles = await newsAggregationService.aggregateNewsForWorkspace(config);
    
    // Rank articles
    await newsRankingEngine.rankArticlesForWorkspace(workspaceId);

    return NextResponse.json({
      success: true,
      message: `Refreshed news successfully. Found ${articles.length} new articles.`,
      data: {
        articlesCount: articles.length
      }
    });

  } catch (error) {
    console.error('Error refreshing news:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to refresh news' 
    }, { status: 500 });
  }
}

async function handleMarkAllRead(workspaceId: string) {
  try {
    const result = await prisma.news_articles.updateMany({
      where: { workspaceId, isRead: false },
      data: { isRead: true }
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} articles as read`,
      data: {
        markedRead: result.count
      }
    });

  } catch (error) {
    console.error('Error marking articles as read:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to mark articles as read' 
    }, { status: 500 });
  }
}
