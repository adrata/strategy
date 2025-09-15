import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 [SEARCH API] Starting POST search request');
    
    const body = await request.json();
    const { workspaceId, userId, category, query, limit = 20 } = body;

    console.log(`🔍 [SEARCH API] POST search request:`, {
      category,
      query,
      limit,
      workspaceId,
      userId
    });

    if (!category || !query) {
      return NextResponse.json({
        success: false,
        error: 'Category and query are required'
      }, { status: 400 });
    }

    if (!workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'WorkspaceId and userId are required'
      }, { status: 400 });
    }

    let results = [];

    switch (category) {
      case 'companies':
        results = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          take: limit,
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            size: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break;

      case 'people':
        results = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              {
                firstName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true,
            company: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break;

      case 'leads':
        results = await prisma.leads.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              {
                fullName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                company: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          take: limit,
          select: {
            id: true,
            fullName: true,
            email: true,
            company: true,
            jobTitle: true,
            status: true,
            priority: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break;

      case 'opportunities':
        results = await prisma.opportunities.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                stage: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          take: limit,
          select: {
            id: true,
            name: true,
            stage: true,
            amount: true,
            probability: true,
            expectedCloseDate: true,
            createdAt: true,
            updatedAt: true
          }
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported search category: ${category}`
        }, { status: 400 });
    }

    console.log(`✅ [SEARCH API] Found ${results.length} results for ${category}:`, results);

    return NextResponse.json({
      success: true,
      results: results
    });

  } catch (error) {
    console.error('❌ [SEARCH API] POST Error:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SEARCH API] Starting search request');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '10');
    const workspaceId = searchParams.get('workspaceId');
    const userId = searchParams.get('userId');

    console.log(`🔍 [SEARCH API] Search request:`, {
      type,
      query,
      limit,
      workspaceId,
      userId
    });

    if (!type || !query) {
      return NextResponse.json({
        success: false,
        error: 'Type and query parameters are required'
      }, { status: 400 });
    }

    if (!workspaceId || !userId) {
      return NextResponse.json({
        success: false,
        error: 'WorkspaceId and userId are required'
      }, { status: 400 });
    }

    let results = [];

    switch (type) {
      case 'companies':
        results = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          take: limit,
          select: {
            id: true,
            name: true,
            website: true,
            industry: true,
            size: true
          }
        });
        break;

      case 'people':
        results = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              {
                firstName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                lastName: {
                  contains: query,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: query,
                  mode: 'insensitive'
                }
              }
            ]
          },
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            jobTitle: true
          }
        });
        break;

      default:
        return NextResponse.json({
          success: false,
          error: `Unsupported search type: ${type}`
        }, { status: 400 });
    }

    console.log(`✅ [SEARCH API] Found ${results.length} results for ${type}:`, results);

    return NextResponse.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('❌ [SEARCH API] Error:', error);
    console.error('❌ [SEARCH API] Error details:', error);
    return NextResponse.json({
      success: false,
      error: `Internal server error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
