import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';

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
