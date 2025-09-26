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
        // Load speedrun data (people with company relationships)
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
          orderBy: { updatedAt: 'desc' },
          take: 200,
          include: {
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                vertical: true,
                size: true
              }
            }
          }
        });
        
        // Transform to speedrun format
        sectionData = people.slice(0, limit).map((person, index) => ({
          id: person.id,
          rank: index + 1,
          name: person.fullName || `${person.firstName} ${person.lastName}`,
          company: person.company?.name || 'Unknown Company',
          industry: person.company?.industry || 'Unknown',
          size: person.company?.size || 'Unknown',
          stage: 'Prospect',
          lastAction: 'Never No action',
          nextAction: 'No date set No action planned'
        }));
        break;
        
      case 'leads':
        sectionData = await prisma.leads.findMany({
          where: {
            workspaceId,
            deletedAt: null
          },
          orderBy: { updatedAt: 'desc' },
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
            updatedAt: true
          }
        });
        break;
        
      case 'prospects':
        sectionData = await prisma.prospects.findMany({
          where: {
            workspaceId,
            deletedAt: null
          },
          orderBy: { updatedAt: 'desc' },
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
            updatedAt: true
          }
        });
        break;
        
      case 'opportunities':
        sectionData = await prisma.opportunities.findMany({
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
        break;
        
      case 'companies':
        // 🚀 CONSISTENT RANKING: Get companies from people relationships (same as speedrun)
        const peopleWithCompanies = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            companyId: { not: null }, // Only people with company relationships
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
            ]
          },
          orderBy: { updatedAt: 'desc' },
          take: 200, // Load enough people for proper company ranking
          include: {
            company: {
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
            }
          }
        });
        
        // Extract unique companies and apply consistent ranking
        const uniqueCompanies = new Map();
        peopleWithCompanies.forEach(person => {
          if (person.company && !uniqueCompanies.has(person.company.id)) {
            uniqueCompanies.set(person.company.id, person.company);
          }
        });
        
        const companiesList = Array.from(uniqueCompanies.values());
        sectionData = companiesList.slice(0, limit).map((company, index) => ({
          id: company.id,
          rank: index + 1,
          name: company.name,
          industry: company.industry || 'Unknown',
          size: company.size || 'Unknown',
          lastAction: company.lastAction || 'Never No action',
          nextAction: company.nextAction || 'No date set No action planned',
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }));
        break;
        
      case 'people':
        // 🚀 CONSISTENT RANKING: Use same logic as speedrun for consistent ranking
        const peopleData = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { assignedUserId: userId },
              { assignedUserId: null }
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
          lastAction: person.lastAction || 'Never No action',
          nextAction: person.nextAction || 'No date set No action planned',
          createdAt: person.createdAt,
          updatedAt: person.updatedAt
        }));
        break;
        
      default:
        sectionData = [];
    }
    
    const result = {
      data: sectionData,
      count: sectionData.length,
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
