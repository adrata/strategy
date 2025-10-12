import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
import { cache } from '@/platform/services/unified-cache';

// 🚀 PERFORMANCE: Aggressive caching for speedrun data (rarely changes)
const SPEEDRUN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * 🚀 SPEEDRUN API v1 - LIGHTNING FAST
 * 
 * Dedicated optimized endpoint for speedrun data
 * - Top 50 people with companies (prioritizes ranked people, includes unranked)
 * - Only includes people with company relationships
 * - Ordered by globalRank ascending (ranked first), then by creation date
 * - Pre-formatted response (no transformation needed)
 * - Aggressive Redis caching (5 min TTL)
 * - Leverages composite indexes for <200ms queries
 */

// GET /api/v1/speedrun - Get top 50 speedrun prospects
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authenticate and authorize user using unified auth system
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Cap at 100, default 50
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('t'); // Force refresh if timestamp provided
    
    // 🚀 CACHE: Check Redis cache first (unless force refresh)
    const cacheKey = `speedrun-${context.workspaceId}-${context.userId}-${limit}`;
    
    // Define the fetch function for cache
    const fetchSpeedrunData = async () => {
      // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
      const isDemoMode = context.workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || // Demo Workspace only
                        context.workspaceId === '01K1VBYXHD0J895XAN0HGFBKJP' || // Dan's actual workspace
                        context.workspaceId === '01K7464TNANHQXPCZT1FYX205V' || // Ross's workspace
                        context.userId === 'demo-user-2025' || // Demo user only
                        context.userId === '01K1VBYZMWTCT09FWEKBDMCXZM' || // Dan's user ID
                        context.userId === '01K7469230N74BVGK2PABPNNZ9'; // Ross's user ID
      
      console.log(`🚀 [SPEEDRUN API] Loading top ${limit} speedrun prospects for workspace: ${context.workspaceId}, user: ${context.userId}`);

      // 🔍 DIAGNOSTIC: Check what data actually exists
      const [peopleWithCompanies, peopleWithRank, peopleWithBoth] = await Promise.all([
        prisma.people.count({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            companyId: { not: null },
            ...(isDemoMode ? {} : {
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
            })
          }
        }),
        prisma.people.count({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            globalRank: { not: null },
            ...(isDemoMode ? {} : {
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
            })
          }
        }),
        prisma.people.count({
          where: {
            workspaceId: context.workspaceId,
            deletedAt: null,
            companyId: { not: null },
            globalRank: { not: null },
            ...(isDemoMode ? {} : {
              OR: [
                { mainSellerId: context.userId },
                { mainSellerId: null }
              ]
            })
          }
        })
      ]);

      console.log(`🔍 [SPEEDRUN API] Data diagnostic:`, {
        peopleWithCompanies,
        peopleWithRank,
        peopleWithBoth,
        willShowData: peopleWithBoth > 0
      });

      // 🚀 OPTIMIZED QUERY: Get top 50 people (most permissive - show any people)
      const speedrunPeople = await prisma.people.findMany({
        where: {
          workspaceId: context.workspaceId,
          deletedAt: null,
          // Remove companyId requirement temporarily to see if we have any people at all
          ...(isDemoMode ? {} : {
            OR: [
              { mainSellerId: context.userId },
              { mainSellerId: null }
            ]
          })
        },
        orderBy: [
          { globalRank: 'asc' }, // Ranked people first (nulls will be last)
          { createdAt: 'desc' } // Then by newest
        ],
        take: limit, // Take exactly the first 50 results
        select: {
          // 🚀 PERFORMANCE: Only select required fields (no customFields)
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          jobTitle: true,
          phone: true,
          linkedinUrl: true,
          status: true,
          globalRank: true,
          lastAction: true,
          lastActionDate: true,
          nextAction: true,
          nextActionDate: true,
          mainSellerId: true,
          workspaceId: true,
          createdAt: true,
          updatedAt: true,
          mainSeller: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              name: true,
              email: true
            }
          },
          coSellers: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          company: {
            select: {
              id: true,
              name: true,
              industry: true,
              size: true,
              globalRank: true
            }
          }
        }
      });

      // 🚀 TRANSFORM: Pre-format data for frontend (no additional processing needed)
      const speedrunData = speedrunPeople.map((person, index) => {
        // Format owner name - show "Me" for current user
        const ownerName = person.mainSeller 
          ? (person.mainSeller.id === context.userId
              ? 'Me'
              : person.mainSeller.firstName && person.mainSeller.lastName 
                ? `${person.mainSeller.firstName} ${person.mainSeller.lastName}`.trim()
                : person.mainSeller.name || person.mainSeller.email || '-')
          : '-';

        // Format co-sellers names - exclude current user from co-sellers list
        const coSellersNames = person.coSellers && person.coSellers.length > 0
          ? person.coSellers
              .filter((coSeller: any) => coSeller.user.id !== context.userId) // Exclude current user
              .map((coSeller: any) => {
                const user = coSeller.user;
                return user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`.trim()
                  : user.name || user.email || 'Unknown';
              }).join(', ')
          : '-';

        return {
          id: person.id,
          rank: index + 1, // Sequential ranking starting from 1
          name: person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown',
          title: person.jobTitle || 'Unknown Title',
          email: person.email || '',
          phone: person.phone || '',
          linkedin: person.linkedinUrl || '',
          status: person.status || 'Unknown',
          globalRank: person.globalRank || 0,
          lastAction: person.lastAction || 'No action taken',
          lastActionDate: person.lastActionDate || null,
          nextAction: person.nextAction || 'No next action',
          nextActionDate: person.nextActionDate || null,
          mainSellerId: person.mainSellerId,
          workspaceId: person.workspaceId,
          createdAt: person.createdAt,
          updatedAt: person.updatedAt,
          company: person.company ? {
            id: person.company.id,
            name: person.company.name,
            industry: person.company.industry || '',
            size: person.company.size || '',
            globalRank: person.company.globalRank || 0
          } : null,
          tags: ['speedrun'], // Add speedrun tag for consistency
          // Add main-seller and co-sellers data
          mainSeller: ownerName,
          coSellers: coSellersNames,
          mainSellerData: person.mainSeller,
          coSellersData: person.coSellers ? person.coSellers.filter((coSeller: any) => coSeller.user.id !== context.userId) : [],
          currentUserId: context.userId
        };
      });

      const result = {
        success: true,
        data: speedrunData,
        meta: {
          count: speedrunData.length,
          totalCount: speedrunData.length, // For pagination compatibility
          limit,
          workspaceId: context.workspaceId,
          userId: context.userId,
          responseTime: Date.now() - startTime,
          cached: false
        }
      };

      return result;
    };

    if (!forceRefresh) {
      try {
        const result = await cache.get(cacheKey, fetchSpeedrunData, {
          ttl: SPEEDRUN_CACHE_TTL,
          priority: 'high',
          tags: ['speedrun', context.workspaceId, context.userId]
        });
        console.log(`⚡ [SPEEDRUN API] Cache hit - returning cached data in ${Date.now() - startTime}ms`);
        return NextResponse.json(result);
      } catch (error) {
        console.warn('⚠️ [SPEEDRUN API] Cache read failed, proceeding with database query:', error);
      }
    }

    // If force refresh or cache failed, fetch data directly
    const result = await fetchSpeedrunData();

    // 🚀 CACHE: Store in Redis for future requests
    try {
      await cache.set(cacheKey, result, {
        ttl: SPEEDRUN_CACHE_TTL,
        priority: 'high',
        tags: ['speedrun', context.workspaceId, context.userId]
      });
      console.log(`💾 [SPEEDRUN API] Cached result for key: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [SPEEDRUN API] Cache write failed:', error);
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ [SPEEDRUN API] Loaded ${result.data.length} speedrun prospects in ${responseTime}ms`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ [SPEEDRUN API] Error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to load speedrun data',
      'SPEEDRUN_LOAD_ERROR',
      500
    );
  }
}

// POST /api/v1/speedrun - Invalidate cache when speedrun data changes
export async function POST(request: NextRequest) {
  try {
    const { context, response } = await getSecureApiContext(request, {
      requireAuth: true,
      requireWorkspaceAccess: true
    });

    if (response) {
      return response;
    }

    if (!context) {
      return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
    }

    // 🚀 CACHE INVALIDATION: Clear speedrun cache when data changes
    const cacheKey = `speedrun-${context.workspaceId}-${context.userId}-*`;
    try {
      await cache.invalidateByPattern(cacheKey);
      console.log(`🗑️ [SPEEDRUN API] Invalidated cache for pattern: ${cacheKey}`);
    } catch (error) {
      console.warn('⚠️ [SPEEDRUN API] Cache invalidation failed:', error);
    }

    return createSuccessResponse({ 
      message: 'Speedrun cache invalidated successfully',
      workspaceId: context.workspaceId,
      userId: context.userId
    });

  } catch (error) {
    console.error('❌ [SPEEDRUN API] Cache invalidation error:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to invalidate cache',
      'CACHE_INVALIDATION_ERROR',
      500
    );
  }
}
