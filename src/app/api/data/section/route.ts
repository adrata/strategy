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

// 🚫 FILTER: Exclude user's own company from all lists
function shouldExcludeCompany(companyName: string | null | undefined): boolean {
  if (!companyName) return false;
  
  const companyLower = companyName.toLowerCase();
  const excludePatterns = [
    'top engineering plus',
    'top engineers plus',
    'top engineering',
    'top engineers',
    'top engineers plus, pllc', // 🎯 FIX: Match exact company name
    'adrata',
    'adrata engineering'
  ];
  
  return excludePatterns.some(pattern => companyLower.includes(pattern));
}

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
        // Load speedrun data (people with company relationships who are buyer group members) - FIXED: Use company ranking
        const people = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            companyId: { not: null },
            customFields: {
              path: ['isBuyerGroupMember'],
              equals: true
            },
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
        // 🚫 FILTER: Exclude user's own company from speedrun and ensure buyer group membership
        const filteredPeople = people.filter(person => {
          // Check if person is in buyer group (fallback filter)
          const isBuyerGroupMember = person.customFields?.isBuyerGroupMember === true;
          const shouldExclude = shouldExcludeCompany(person.company?.name);
          
          return isBuyerGroupMember && !shouldExclude;
        });
        
        // 🎯 DEDUPLICATION: Remove duplicate people by name (keep first occurrence)
        const seenSpeedrunNames = new Set();
        const deduplicatedPeople = filteredPeople.filter(person => {
          const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim();
          if (seenSpeedrunNames.has(fullName)) {
            return false; // Skip duplicate
          }
          seenSpeedrunNames.add(fullName);
          return true;
        });
        
        sectionData = deduplicatedPeople.slice(0, limit).map((person, index) => {
          // Safe string truncation utility
          const safeString = (str: any, maxLength: number = 1000): string => {
            if (!str || typeof str !== 'string') return '';
            if (str.length <= maxLength) return str;
            return str.substring(0, maxLength) + '...';
          };

          // 🎯 DETERMINE STAGE: Check if person is a lead, prospect, or opportunity
          let stage = 'Prospect'; // Default to Prospect
          if (person.customFields?.buyerGroupRole) {
            const role = person.customFields.buyerGroupRole.toLowerCase();
            if (role.includes('decision') || role.includes('champion')) {
              stage = 'Opportunity';
            } else if (role.includes('influencer') || role.includes('stakeholder')) {
              stage = 'Lead';
            }
          }

          // 🎯 BUYER GROUP ROLE: Extract from intelligence data
          const buyerGroupRole = person.customFields?.primaryRole || 
                                person.customFields?.buyerGroupRole || 
                                person.jobTitle || 
                                'Stakeholder';

          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
            company: safeString(person.company?.name || 'Unknown Company', 200),
            title: safeString(person.jobTitle || 'Unknown Title', 300),
            role: safeString(buyerGroupRole, 100), // 🎯 NEW: Buyer group role
            stage: stage, // 🎯 UPDATED: Proper stage (Prospect/Lead/Opportunity)
            email: safeString(person.email || 'Unknown Email', 300),
            phone: safeString(person.phone || 'Unknown Phone', 50),
            linkedin: safeString(person.linkedinUrl || 'Unknown LinkedIn', 500),
            status: safeString(person.status || 'Unknown', 20),
            lastAction: safeString(person.lastAction || 'No action taken', 500),
            lastActionDate: person.lastActionDate || null,
            nextAction: safeString(person.nextAction || 'No next action', 500),
            nextActionDate: person.nextActionDate || null,
            assignedUserId: person.assignedUserId || null,
            workspaceId: person.workspaceId,
            createdAt: person.createdAt,
            updatedAt: person.updatedAt,
            // Remove customFields to avoid large JSON data issues
            tags: person.tags || []
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
          take: 10000, // Increased limit to ensure we get all leads (same as unified API)
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
            nextActionDate: true,
            customFields: true
          }
        });
        
        // Apply proper sequential ranking based on database ranks (same as companies)
        // 🚫 FILTER: Exclude user's own company from leads
        const filteredLeadsData = leadsPeopleData.filter(person => {
          // Extract Coresignal data
          const coresignalData = (person.customFields as any)?.coresignalData || (person.customFields as any)?.coresignal || {};
          
          // Get company from Coresignal data (active experience)
          const coresignalCompany = coresignalData.active_experience_company || 
                                    coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          const companyName = coresignalCompany || person.company?.name;
          return !shouldExcludeCompany(companyName);
        });
        
        // 🎯 DEDUPLICATION: Remove duplicate leads by name (keep first occurrence)
        const seenLeadNames = new Set();
        const deduplicatedLeads = filteredLeadsData.filter(person => {
          const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim();
          if (seenLeadNames.has(fullName)) {
            return false; // Skip duplicate
          }
          seenLeadNames.add(fullName);
          return true;
        });
        
        sectionData = deduplicatedLeads.map((person, index) => {
          // Extract Coresignal data
          const coresignalData = (person.customFields as any)?.coresignalData || (person.customFields as any)?.coresignal || {};
          
          // Get company from Coresignal data (active experience)
          const coresignalCompany = coresignalData.active_experience_company || 
                                    coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            email: person.email || 'Unknown Email',
            status: person.status || 'Unknown',
            lastAction: person.lastAction || 'No action taken',
            nextAction: person.nextAction || 'No action planned',
            createdAt: person.createdAt,
            updatedAt: person.updatedAt
          };
        });
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
          take: 10000, // Increased limit to ensure we get all prospects (same as unified API)
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
            nextActionDate: true,
            customFields: true
          }
        });
        
        // Apply proper sequential ranking based on database ranks (same as companies)
        // 🚫 FILTER: Exclude user's own company from prospects
        const filteredProspectsData = prospectsPeopleData.filter(person => {
          // Extract Coresignal data
          const coresignalData = (person.customFields as any)?.coresignalData || (person.customFields as any)?.coresignal || {};
          
          // Get company from Coresignal data (active experience)
          const coresignalCompany = coresignalData.active_experience_company || 
                                    coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          const companyName = coresignalCompany || person.company?.name;
          return !shouldExcludeCompany(companyName);
        });
        
        // 🎯 DEDUPLICATION: Remove duplicate prospects by name (keep first occurrence)
        const seenProspectNames = new Set();
        const deduplicatedProspects = filteredProspectsData.filter(person => {
          const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim();
          if (seenProspectNames.has(fullName)) {
            return false; // Skip duplicate
          }
          seenProspectNames.add(fullName);
          return true;
        });
        
        sectionData = deduplicatedProspects.map((person, index) => {
          // Extract Coresignal data
          const coresignalData = (person.customFields as any)?.coresignalData || (person.customFields as any)?.coresignal || {};
          
          // Get company from Coresignal data (active experience)
          const coresignalCompany = coresignalData.active_experience_company || 
                                    coresignalData.experience?.find(exp => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            email: person.email || 'Unknown Email',
            status: person.status || 'Unknown',
            lastAction: person.lastAction || 'No action taken',
            nextAction: person.nextAction || 'No action planned',
            createdAt: person.createdAt,
            updatedAt: person.updatedAt
          };
        });
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
            lastActivityDate: true,
            nextActivityDate: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        // 🎯 DEDUPLICATION: Remove duplicate opportunities by name (keep first occurrence)
        const seenOpportunityNames = new Set();
        const deduplicatedOpportunities = opportunitiesData.filter(opportunity => {
          const name = opportunity.name || 'Unknown Opportunity';
          if (seenOpportunityNames.has(name)) {
            return false; // Skip duplicate
          }
          seenOpportunityNames.add(name);
          return true;
        });
        
        // Apply consistent ranking logic
        sectionData = deduplicatedOpportunities.map((opportunity, index) => ({
          id: opportunity.id,
          rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after deduplication
          name: opportunity.name || 'Unknown Opportunity',
          amount: opportunity.amount || 0,
          currency: opportunity.currency || 'USD',
          stage: opportunity.stage || 'Unknown',
          expectedCloseDate: opportunity.expectedCloseDate,
          lastAction: opportunity.lastActivityDate ? 'Activity recorded' : 'No action taken',
          nextAction: opportunity.nextActivityDate ? 'Activity planned' : 'No action planned',
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
        
        // 🚫 FILTER: Exclude user's own company from companies list
        const filteredCompaniesData = companiesData.filter(company => 
          !shouldExcludeCompany(company.name)
        );
        
        // 🎯 DEDUPLICATION: Remove duplicate companies by name (keep first occurrence)
        const seenCompanyNames = new Set();
        const deduplicatedCompanies = filteredCompaniesData.filter(company => {
          if (seenCompanyNames.has(company.name)) {
            return false; // Skip duplicate
          }
          seenCompanyNames.add(company.name);
          return true;
        });
        
        sectionData = deduplicatedCompanies.map((company, index) => ({
          id: company.id,
          rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering and deduplication
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
        // 🚀 PERFORMANCE: Optimized people query with error handling
        console.log(`👥 [SECTION API] Loading people for workspace: ${workspaceId}`);
        
        try {
          const peopleData = await prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null
            },
            orderBy: [{ rank: 'asc' }, { updatedAt: 'desc' }],
            take: limit || 100, // Use limit parameter instead of hardcoded 10000
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              jobTitle: true,
              companyId: true,
              phone: true,
              linkedinUrl: true,
              // Remove customFields to avoid large JSON data issues
              tags: true,
              status: true,
              rank: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true,
              assignedUserId: true,
              workspaceId: true,
              createdAt: true,
              updatedAt: true,
              // Include company relationship to get company name
              company: {
                select: {
                  id: true,
                  name: true
                }
              }
              // Remove notes and bio from select to avoid string length issues
            }
          });
          
          console.log(`👥 [SECTION API] Found ${peopleData.length} people`);
          
          // Apply proper sequential ranking based on database ranks
          // 🚫 FILTER: Exclude user's own company from people list
          const filteredPeopleData = peopleData.filter(person => 
            !shouldExcludeCompany(person.company?.name)
          );
          
          // 🎯 DEDUPLICATION: Remove duplicate people by name (keep first occurrence)
          const seenPeopleNames = new Set();
          const deduplicatedPeople = filteredPeopleData.filter(person => {
            const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim();
            if (seenPeopleNames.has(fullName)) {
              return false; // Skip duplicate
            }
            seenPeopleNames.add(fullName);
            return true;
          });
          
          sectionData = deduplicatedPeople.map((person, index) => {
            // Safe string truncation utility
            const safeString = (str: any, maxLength: number = 1000): string => {
              if (!str || typeof str !== 'string') return '';
              if (str.length <= maxLength) return str;
              return str.substring(0, maxLength) + '...';
            };

            return {
              id: person.id,
              rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
              name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
              company: safeString(person.company?.name || 'Unknown Company', 200),
              title: safeString(person.jobTitle || 'Unknown Title', 300),
              email: safeString(person.email || 'Unknown Email', 300),
              phone: safeString(person.phone || 'Unknown Phone', 50),
              linkedin: safeString(person.linkedinUrl || 'Unknown LinkedIn', 500),
              status: safeString(person.status || 'Unknown', 20),
              lastAction: safeString(person.lastAction || 'No action taken', 500),
              lastActionDate: person.lastActionDate || null,
              nextAction: safeString(person.nextAction || 'No next action', 500),
              nextActionDate: person.nextActionDate || null,
              assignedUserId: person.assignedUserId || null,
              workspaceId: person.workspaceId,
              createdAt: person.createdAt,
              updatedAt: person.updatedAt,
              // Remove customFields to avoid large JSON data issues
              tags: person.tags || []
            };
          });
          
        } catch (dbError) {
          console.error('❌ [SECTION API] Database error loading people:', dbError);
          throw new Error(`Database error: ${dbError instanceof Error ? dbError.message : 'Unknown database error'}`);
        }
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
