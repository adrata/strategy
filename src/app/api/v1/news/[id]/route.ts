import { NextRequest, NextResponse } from 'next/server';
import { WorkspaceDataRouter } from '@/platform/services/workspace-data-router';
import { prisma } from '@/lib/prisma';

// Required for static export (desktop build)
export const dynamic = 'force-static';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { workspaceId, userId } = await WorkspaceDataRouter.getWorkspaceContext(request);
    const articleId = params.id;

    // Get article with related data
    const article = await prisma.news_articles.findFirst({
      where: {
        id: articleId,
        workspaceId
      },
      include: {
        company: {
          select: { id: true, name: true, industry: true }
        },
        person: {
          select: { 
            id: true, 
            fullName: true, 
            jobTitle: true,
            company: { 
              select: { name: true, industry: true } 
            } 
          }
        }
      }
    });

    if (!article) {
      return NextResponse.json({
        success: false,
        error: 'Article not found'
      }, { status: 404 });
    }

    // Get related articles (same category or related company/person)
    const relatedArticles = await prisma.news_articles.findMany({
      where: {
        workspaceId,
        id: { not: articleId },
        OR: [
          { category: article.category },
          { relatedCompanyId: article.relatedCompanyId },
          { relatedPersonId: article.relatedPersonId }
        ]
      },
      orderBy: [
        { relevanceScore: 'desc' },
        { publishedAt: 'desc' }
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        url: true,
        publishedAt: true,
        source: true,
        category: true,
        relevanceScore: true,
        isRead: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        article: {
          id: article.id,
          title: article.title,
          description: article.description,
          content: article.content,
          url: article.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt,
          source: article.source,
          author: article.author,
          category: article.category,
          relevanceScore: article.relevanceScore,
          relatedCompany: article.company ? {
            id: article.company.id,
            name: article.company.name,
            industry: article.company.industry
          } : null,
          relatedPerson: article.person ? {
            id: article.person.id,
            fullName: article.person.fullName,
            jobTitle: article.person.jobTitle,
            company: article.person.company ? {
              name: article.person.company.name,
              industry: article.person.company.industry
            } : null
          } : null,
          industries: article.industries,
          tags: article.tags,
          isRead: article.isRead,
          isFavorite: article.isFavorite,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt
        },
        relatedArticles: relatedArticles.map(related => ({
          id: related.id,
          title: related.title,
          description: related.description,
          url: related.url,
          publishedAt: related.publishedAt,
          source: related.source,
          category: related.category,
          relevanceScore: related.relevanceScore,
          isRead: related.isRead
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching news article:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch news article' 
    }, { status: 500 });
  }
}
