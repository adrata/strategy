/**
 * 🚀 FAST SECTION API - LIGHTNING SPEED SECTION DATA
 * 
 * Ultra-fast endpoint for loading specific section data only
 * Replaces heavy dashboard API for middle panel sections
 * 
 * Performance Target: <500ms response time per section
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/platform/database/prisma-client';
import jwt from 'jsonwebtoken';

// 🚀 PERFORMANCE: Ultra-aggressive caching for section data
const SECTION_CACHE_TTL = 2 * 60 * 1000; // 2 minutes
const sectionCache = new Map<string, { data: any; timestamp: number }>();

// 🚀 WORKSPACE CONTEXT: Optimized workspace resolution
async function getOptimizedWorkspaceContext(request: NextRequest): Promise<{
  workspaceId: string;
  userId: string;
}> {
  try {
    // Check for JWT token in cookies (for web requests with credentials: 'include')
    const cookieToken = request.cookies.get("auth-token")?.value || 
                       request.cookies.get("auth_token")?.value ||
                       request.cookies.get("access_token")?.value;
    
    if (cookieToken) {
      try {
        const secret = process['env']['NEXTAUTH_SECRET'] || process['env']['JWT_SECRET'] || "dev-secret-key-change-in-production";
        const decoded = jwt.verify(cookieToken, secret) as any;
        
        if (decoded && decoded['workspaceId'] && decoded['userId']) {
          return {
            workspaceId: decoded.workspaceId,
            userId: decoded.userId
          };
        }
      } catch (error) {
        console.warn('⚠️ [WORKSPACE CONTEXT] Failed to verify cookie token:', error);
      }
    }
    
    // Fallback to query parameters
    const url = new URL(request.url);
    const workspaceId = url.searchParams.get('workspaceId');
    const userId = url.searchParams.get('userId');
    
    if (workspaceId && userId) {
      return {
        workspaceId,
        userId
      };
    }
    
    throw new Error('Missing workspaceId or userId');
  } catch (error) {
    console.error('❌ [WORKSPACE CONTEXT] Error:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const context = await getOptimizedWorkspaceContext(request);
    const { workspaceId, userId } = context;
    
    const url = new URL(request.url);
    const section = url.searchParams.get('section') || 'speedrun';
    const limit = parseInt(url.searchParams.get('limit') || '30');
    
    // 🚀 PERFORMANCE: Check cache first
    const cacheKey = `section-${section}-${workspaceId}-${userId}-${limit}`;
    const cached = sectionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < SECTION_CACHE_TTL) {
      console.log(`⚡ [SECTION API] Cache hit for ${section} - returning cached data in ${Date.now() - startTime}ms`);
      return NextResponse.json({
        success: true,
        data: cached.data,
        meta: {
          cacheHit: true,
          responseTime: Date.now() - startTime
        }
      });
    }
    
    console.log(`🚀 [SECTION API] Loading ${section} data for workspace: ${workspaceId}, user: ${userId}`);
    
    let sectionData: any[] = [];
    
    // 🚀 PERFORMANCE: Load only the specific section data needed
    switch (section) {
      case 'speedrun':
        // Load speedrun data (people with company relationships) - FIXED: Use company ranking
        const people = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            companyId: { not: null },
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ]
          },
          orderBy: [
            { company: { rank: 'asc' } }, // Use company rank first
            { updatedAt: 'desc' } // Then by person update time
          ],
          take: 200,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                vertical: true,
                size: true,
                rank: true // Include company rank for proper ordering
              }
            }
          }
        });
        
        // Transform to speedrun format with proper action structure
        sectionData = people.slice(0, limit).map((person, index) => {
          // Determine next action timing based on ranking
          let nextAction = 'Schedule Discovery Call';
          let nextActionTiming = 'Today';
          
          if (index === 0) {
            nextActionTiming = 'Now';
            nextAction = 'Call immediately - highest priority';
          }
          
          return {
            id: person.id,
            rank: index + 1,
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: person.company?.name || 'Unknown Company',
            industry: person.company?.industry || 'Unknown',
            size: person.company?.size || 'Unknown',
            stage: 'Prospect',
            lastAction: 'No action taken',
            lastActionTime: '(Never)',
            nextAction: nextAction,
            nextActionTiming: nextActionTiming
          };
        });
        break;
        
      case 'leads':
        // 🚀 CONSISTENT RANKING: Use same logic as speedrun for consistent ranking
        // 🚀 CONSISTENT RANKING: Use people table as source of truth for 1:1 consistency
        // Filter people by lead stage/status
        const leadsPeopleData = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ],
            // Filter for people who are leads - use specific lead filters
            AND: [
              {
                OR: [
                  { funnelStage: 'Lead' },
                  { status: 'new' },
                  { status: 'lead' }
                ]
              }
            ]
          },
          orderBy: [{ rank: 'asc' }, { updatedAt: 'desc' }],
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true
              }
            },
            status: true,
            createdAt: true,
            updatedAt: true,
            rank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true
          }
        });
        
        // Apply consistent ranking logic using people data
        sectionData = leadsPeopleData.map((person, index) => ({
          id: person.id,
          rank: index + 1,
          name: person.fullName || `${person.firstName} ${person.lastName}`,
          company: person.company?.name || 'Unknown Company',
          email: person.email || 'Unknown Email',
          status: person.status || 'Unknown',
          lastAction: person.lastAction || '(Never) No action taken',
          nextAction: person.nextAction || 'No action planned',
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        }));
        break;
        
      case 'prospects':
        // 🚀 CONSISTENT RANKING: Use people table as source of truth for 1:1 consistency
        // Filter people by prospect stage/status
        const prospectsPeopleData = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ],
            // Filter for people who are prospects - use specific prospect filters
            AND: [
              {
                OR: [
                  { funnelStage: 'Prospect' },
                  { status: 'engaged' },
                  { status: 'prospect' }
                ]
              }
            ]
          },
          orderBy: [{ rank: 'asc' }, { updatedAt: 'desc' }],
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true
              }
            },
            status: true,
            createdAt: true,
            updatedAt: true,
            rank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true
          }
        });
        
        // Apply consistent ranking logic using people data
        sectionData = prospectsPeopleData.map((person, index) => ({
          id: person.id,
          rank: index + 1,
          name: person.fullName || `${person.firstName} ${person.lastName}`,
          company: person.company?.name || 'Unknown Company',
          email: person.email || 'Unknown Email',
          status: person.status || 'Unknown',
          lastAction: person.lastAction || '(Never) No action taken',
          nextAction: person.nextAction || 'No action planned',
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        }));
        break;
        
      case 'opportunities':
        // 🚀 CONSISTENT RANKING: Use same logic as speedrun for consistent ranking
        const opportunitiesData = await prisma.opportunities.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ]
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            name: true,
            amount: true,
            currency: true,
            stage: true,
            expectedCloseDate: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        // Apply consistent ranking logic
        sectionData = opportunitiesData.map((opportunity, index) => ({
          id: opportunity.id,
          rank: index + 1,
          name: opportunity.name || 'Unknown Opportunity',
          amount: opportunity.amount || 0,
          currency: opportunity.currency || 'USD',
          stage: opportunity.stage || 'Unknown',
          expectedCloseDate: opportunity.expectedCloseDate,
          lastAction: opportunity.lastAction || '(Never) No action taken',
          nextAction: opportunity.nextAction || 'No action planned',
          createdAt: opportunity.createdAt,
          updatedAt: opportunity.updatedAt
        }));
        break;
        
      case 'companies':
        // 🚀 PROPER COMPANY RANKING: Use actual company ranks from database
        const companiesData = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ]
          },
          orderBy: [
            { rank: 'asc' }, // Use actual company ranks first
            { updatedAt: 'desc' } // Then by update time for companies without ranks
          ],
          take: limit,
          select: {
            id: true,
            name: true,
            industry: true,
            vertical: true,
            size: true,
            createdAt: true,
            updatedAt: true,
            rank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true
          }
        });
        
        // Apply proper sequential ranking based on database ranks
        sectionData = companiesData.map((company, index) => ({
          id: company.id,
          rank: company.rank || (index + 1), // Use database rank or sequential fallback
          name: company.name,
          industry: company.industry || 'Unknown',
          size: company.size || 'Unknown',
          lastAction: company.lastAction || 'Never',
          nextAction: company.nextAction || 'No action planned',
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }));
        break;
        
      case 'people':
        // 🚀 CONSISTENT RANKING: Use same logic as speedrun for consistent ranking
        const peopleData = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null
          },
          orderBy: [{ rank: 'asc' }, { updatedAt: 'desc' }],
          take: limit,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            company: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            rank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true
          }
        });
        
        // Apply consistent ranking logic
        sectionData = peopleData.map((person, index) => ({
          id: person.id,
          rank: index + 1,
          name: person.fullName || `${person.firstName} ${person.lastName}`,
          company: person.company || 'Unknown Company',
          title: person.title || 'Unknown Title',
          status: person.status || 'Unknown',
          lastAction: person.lastAction || '(Never) No action taken',
          nextAction: person.nextAction || 'No action planned',
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        }));
        break;
        
      default:
        sectionData = [];
    }
    
    // Get the total count for the section (without limit)
    let totalCount = 0;
    try {
      switch (section) {
        case 'leads':
          // Use same logic as counts API (leads table without user filters)
          totalCount = await prisma.leads.count({
            where: {
              workspaceId,
              deletedAt: null
            }
          });
          break;
        case 'prospects':
          // Use same logic as counts API (prospects table without user filters)
          totalCount = await prisma.prospects.count({
            where: {
              workspaceId,
              deletedAt: null
            }
          });
          break;
        case 'people':
          totalCount = await prisma.people.count({
            where: {
              workspaceId,
              deletedAt: null
            }
          });
          break;
        case 'companies':
          totalCount = await prisma.companies.count({
            where: {
              workspaceId,
              deletedAt: null,
              OR: [
                { assignedUserId: userId },
                { assignedUserId: null }
              ]
            }
          });
          break;
        case 'opportunities':
          totalCount = await prisma.opportunities.count({
            where: {
              workspaceId,
              deletedAt: null,
              OR: [
                { assignedUserId: userId },
                { assignedUserId: null }
              ]
            }
          });
          break;
        case 'speedrun':
          // For speedrun, use the same logic as the data fetch - FIXED: Use company ranking
          const speedrunPeople = await prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null,
              companyId: { not: null }, // Only people with company relationships
              OR: [
                { assignedUserId: userId },
                { assignedUserId: null }
              ]
            },
            orderBy: [
              { company: { rank: 'asc' } }, // Use company rank first
              { updatedAt: 'desc' } // Then by person update time
            ],
            take: 200,
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  industry: true,
                  size: true,
                  rank: true // Include company rank for proper ordering
                }
              }
            }
          });
          totalCount = Math.min(speedrunPeople.length, 30); // Speedrun is capped at 30
          break;
        default:
          totalCount = sectionData.length;
      }
    } catch (error) {
      console.error(`Error getting total count for ${section}:`, error);
      totalCount = sectionData.length;
    }

    const result = {
      data: sectionData,
      count: sectionData.length,
      totalCount,
      section,
      limit
    };
    
    // 🚀 PERFORMANCE: Cache the results
    sectionCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [SECTION API] Loaded ${section} data in ${responseTime}ms: ${sectionData.length} items`);
    
    return NextResponse.json({
      success: true,
      data: result,
      meta: {
        responseTime,
        cacheHit: false
      }
    });
    
  } catch (error) {
    console.error('❌ [SECTION API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
