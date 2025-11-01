import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    console.log('🔍 [SEARCH API] Starting POST search request');
    
    const body = await request.json();
    const { category, query, limit = 20 } = body;

    console.log(`🔍 [SEARCH API] POST search request:`, {
      category,
      query,
      limit,
      workspaceId,
      userId
    });

    if (!category || !query) {
      return createErrorResponse('Category and query are required', 'VALIDATION_ERROR', 400);
    }

    let results = [];

    switch (category) {
      case 'companies':
        results = await prisma.companies.findMany({
          where: {
            workspaceId: context.workspaceId,
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
            workspaceId: context.workspaceId,
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
            workspaceId: context.workspaceId,
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
            workspaceId: context.workspaceId,
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
        return createErrorResponse(
          `Unsupported search category: ${category}`,
          'UNSUPPORTED_CATEGORY',
          400
        );
    }

    console.log(`✅ [SEARCH API] Found ${results.length} results for ${category}:`, results);

    return createSuccessResponse(results, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      category,
      query,
      count: results.length
    });

  } catch (error) {
    console.error('❌ [SEARCH API] POST Error:', error);
    return createErrorResponse(
      'Failed to perform search',
      'SEARCH_ERROR',
      500
    );
  }
}

export async function GET(request: NextRequest) {
  // 1. Authenticate and authorize user
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response; // Return error response if authentication failed
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    const { searchParams } = new URL(request.url);
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    console.log('🔍 [SEARCH API] Starting search request');
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log(`🔍 [SEARCH API] Search request:`, {
      type,
      query,
      limit,
      workspaceId: context.workspaceId,
      userId: context.userId
    });

    if (!type || !query) {
      return createErrorResponse('Type and query are required', 'VALIDATION_ERROR', 400);
    }

    let results = [];

    switch (type) {
      case 'companies':
        results = await prisma.companies.findMany({
          where: {
            workspaceId: context.workspaceId,
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
            workspaceId: context.workspaceId,
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
        return createErrorResponse(
          `Unsupported search category: ${type}`,
          'UNSUPPORTED_CATEGORY',
          400
        );
    }

    console.log(`✅ [SEARCH API] Found ${results.length} results for ${type}:`, results);

    return createSuccessResponse(results, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      role: context.role,
      type,
      query,
      count: results.length
    });

  } catch (error) {
    console.error('❌ [SEARCH API] Error:', error);
    return createErrorResponse(
      'Failed to perform search',
      'SEARCH_ERROR',
      500
    );
  }
}
