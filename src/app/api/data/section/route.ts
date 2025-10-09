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


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
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

// 🚨 CRITICAL FIX: Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const context = await getOptimizedWorkspaceContext(request);
    const { workspaceId, userId } = context;
    
    const url = new URL(request.url);
    const section = url.searchParams.get('section') || 'speedrun';
    const limit = parseInt(url.searchParams.get('limit') || '30');
    const forceRefresh = url.searchParams.has('t'); // Check for cache-busting timestamp
    
    // 🚨 CRITICAL FIX: Disable caching for workspace-specific data to prevent data leakage
    // Always fetch fresh data to ensure workspace isolation
    console.log(`🔄 [SECTION API] Fetching fresh data for workspace: ${workspaceId}, user: ${userId}, section: ${section}`);
    
    if (forceRefresh) {
      console.log(`🔄 [SECTION API] Force refresh requested for ${section} - bypassing cache`);
    }
    
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 [SECTION API] Loading ${section} data for workspace: ${workspaceId}, user: ${userId}`);
    }
    
    let sectionData: any[] = [];
    
    // 🎯 DEMO MODE: Detect if we're in demo mode to bypass user assignment filters
    // Only apply demo mode to the actual demo workspace, not production workspaces
    const isDemoMode = workspaceId === '01K1VBYX2YERMXBFJ60RC6J194' || // Demo Workspace only
                      userId === 'demo-user-2025'; // Demo user only
    console.log(`🎯 [SECTION API] Demo mode detected: ${isDemoMode} for workspace: ${workspaceId}, user: ${userId}`);
    
    // 🚀 PERFORMANCE: Load only the specific section data needed
    switch (section) {
      case 'speedrun':
        // 🏆 SPEEDRUN: Use EXACT same logic as people section
        console.log(`🏆 [SPEEDRUN SECTION] Loading speedrun data (same as people) for workspace: ${workspaceId}, user: ${userId}`);
        
        try {
          const speedrunPeople = await prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null
              // 🚀 SPEEDRUN: Use EXACT same query as people section
            },
            orderBy: [
              { company: { rank: 'asc' } }, // First by company rank (1-400) if available
              { rank: 'asc' }, // Then by person rank within company (1-4000) if available
              { updatedAt: 'desc' }
            ],
            take: 50, // Limit to top 50 people for speedrun
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
                  name: true,
                  rank: true
                }
              }
            }
          });
          
          console.log(`🏆 [SPEEDRUN SECTION] Found ${speedrunPeople.length} people`);
          
          // Apply same filtering and processing as people section
          const filteredSpeedrunData = speedrunPeople.filter(person => 
            !shouldExcludeCompany(person.company?.name)
          );
          
          // 🎯 DEDUPLICATION: Remove duplicate people by name (keep first occurrence)
          const seenSpeedrunNames = new Set();
          const deduplicatedSpeedrun = filteredSpeedrunData.filter(person => {
            const fullName = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim();
            if (seenSpeedrunNames.has(fullName)) {
              return false; // Skip duplicate
            }
            seenSpeedrunNames.add(fullName);
            return true;
          });
          
          sectionData = deduplicatedSpeedrun.map((person, index) => {
            // Safe string truncation utility
            const safeString = (str: any, maxLength: number = 1000): string => {
              if (!str || typeof str !== 'string') return '';
              if (str.length <= maxLength) return str;
              return str.substring(0, maxLength) + '...';
            };

            return {
              id: person.id,
              rank: person.rank || (index + 1), // 🎯 HIERARCHICAL RANKING: Use database rank if available
              name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
              company: safeString(person.company?.name || 'Unknown Company', 200),
              companyRank: person.company?.rank || 0, // Include company rank for proper ordering
              personRank: person.rank || (index + 1), // Include person rank within company
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
              tags: person.tags || []
            };
          });
          
        } catch (dbError) {
          console.error('❌ [SPEEDRUN SECTION] Database error loading speedrun people:', dbError);                                                              
          sectionData = [];
        }
        break;
        
      case 'leads':
        // 🚀 CONSISTENT RANKING: Use same logic as speedrun for consistent ranking
        // 🚀 CONSISTENT RANKING: Use people table as source of truth for 1:1 consistency
        // Filter people by lead stage/status
        const leadsPeopleData = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            ...(isDemoMode ? {} : {
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            }),
            // Filter for people who are leads - use actual data structure
            AND: [
              {
                OR: [
                  { funnelStage: 'Lead' },
                  { funnelStage: 'Prospect' }, // 🚀 FIX: Include 'Prospect' funnelStage
                  { status: 'new' },
                  { status: 'lead' },
                  { status: 'active' } // 🚀 FIX: Include 'active' status (actual data)
                ]
              }
            ]
          },
          orderBy: [
            { company: { rank: 'asc' } }, // Use company rank first like people
            { rank: 'asc' }, // Then by person rank
            { updatedAt: 'desc' }
          ],
          take: 10000, // Increased limit to ensure we get all leads (same as unified API)
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            jobTitle: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true,
                rank: true
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
                                    coresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
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
                                    coresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            title: person.jobTitle || '-',
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
            ...(isDemoMode ? {} : {
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            }),
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
          orderBy: [
            { company: { rank: 'asc' } }, // Use company rank first like people
            { rank: 'asc' }, // Then by person rank
            { updatedAt: 'desc' }
          ],
          take: 10000, // Increased limit to ensure we get all prospects (same as unified API)
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            jobTitle: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true,
                rank: true
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
                                    coresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
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
                                    coresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            title: person.jobTitle || '-',
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
            ...(isDemoMode ? {} : {
              OR: [
                { assignedUserId: userId },
                { assignedUserId: null }
              ]
            })
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
            ...(isDemoMode ? {} : {
              OR: [
                { assignedUserId: userId },
                { assignedUserId: null }
              ]
            })
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
            assignedUserId: true,
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
          assignedUserId: company.assignedUserId, // 🆕 FIX: Include assignedUserId for company assignment filtering
          lastAction: company.lastAction || 'Never',
          nextAction: company.nextAction || 'No action planned',
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }));
        break;
        
      case 'people':
        // 🚀 PERFORMANCE: Optimized people query with error handling - FIXED: Use same logic as speedrun
        console.log(`👥 [SECTION API] Loading people for workspace: ${workspaceId}`);
        
        try {
          const peopleData = await prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null
              // 🚀 PEOPLE: Use EXACT same query as unified API (no additional filters)
            },
            orderBy: [
              { company: { rank: 'asc' } }, // First by company rank (1-400) if available
              { rank: 'asc' }, // Then by person rank within company (1-4000) if available
              { updatedAt: 'desc' }
            ],
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
                  name: true,
                  rank: true
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
              rank: person.rank || (index + 1), // 🎯 HIERARCHICAL RANKING: Use database rank if available
              name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
              company: safeString(person.company?.name || 'Unknown Company', 200),
              companyRank: person.company?.rank || 0, // Include company rank for proper ordering
              personRank: person.rank || (index + 1), // Include person rank within company
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
        
      case 'sellers':
        // 🚀 SELLERS: Load sellers data from both sellers table and people table with role 'seller'
        const [sellersTableData, peopleSellersData] = await Promise.all([
          // Check sellers table
          prisma.sellers.findMany({
            where: {
              workspaceId,
              deletedAt: null,
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            },
            orderBy: [
              { updatedAt: 'desc' }
            ],
            take: limit,
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              title: true,
              department: true,
              company: true,
              assignedUserId: true,
              workspaceId: true,
              tags: true,
              metadata: true,
              createdAt: true,
              updatedAt: true
            }
          }),
          // Check people table for sellers
          prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null,
              role: 'seller',
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            },
            orderBy: [
              { updatedAt: 'desc' }
            ],
            take: limit,
            select: {
              id: true,
              fullName: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              jobTitle: true,
              department: true,
              company: true,
              assignedUserId: true,
              workspaceId: true,
              tags: true,
              createdAt: true,
              updatedAt: true
            }
          })
        ]);
        
        // Combine both data sources
        const allSellersData = [...sellersTableData, ...peopleSellersData];
        
        // 🎯 DEDUPLICATION: Remove duplicate sellers by name (keep first occurrence)
        const seenSellerNames = new Set();
        const deduplicatedSellers = allSellersData.filter(seller => {
          const fullName = seller.name || seller.fullName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim();
          if (seenSellerNames.has(fullName)) {
            return false; // Skip duplicate
          }
          seenSellerNames.add(fullName);
          return true;
        });
        
        sectionData = deduplicatedSellers.map((seller, index) => {
          // Extract status from metadata
          const metadata = seller.metadata || {};
          const status = metadata.status || 'offline';
          const isOnline = status === 'online';
          
          return {
            id: seller.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after deduplication
            name: seller.name || seller.fullName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller',
            firstName: seller.firstName,
            lastName: seller.lastName,
            email: seller.email || 'Unknown Email',
            phone: seller.phone || 'Unknown Phone',
            title: seller.title || seller.jobTitle || 'Unknown Title',
            department: seller.department || 'Unknown Department',
            company: seller.company || 'Unknown Company',
            assignedUserId: seller.assignedUserId,
            workspaceId: seller.workspaceId,
            tags: seller.tags || [],
            status: status,
            isOnline: isOnline,
            metadata: metadata,
            createdAt: seller.createdAt,
            updatedAt: seller.updatedAt
          };
        });
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
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            }
          });
          break;
        case 'opportunities':
          totalCount = await prisma.opportunities.count({
            where: {
              workspaceId,
              deletedAt: null,
              ...(isDemoMode ? {} : {
                OR: [
                  { assignedUserId: userId },
                  { assignedUserId: null }
                ]
              })
            }
          });
          break;
        case 'speedrun':
          // 🆕 FIX: Count speedrun leads, fallback to people if no speedrun leads
          const speedrunLeadsCount = await prisma.leads.count({
            where: {
              workspaceId,
              deletedAt: null,
              tags: { has: 'speedrun' }
            }
          });
          
          if (speedrunLeadsCount === 0) {
            // Fallback to people count if no speedrun leads
            totalCount = await prisma.people.count({
              where: {
                workspaceId,
                deletedAt: null,
                companyId: { not: null }
              }
            });
          } else {
            totalCount = speedrunLeadsCount;
          }
          break;
        case 'sellers':
          // Use same logic as counts API (sellers table without user filters)
          totalCount = await prisma.sellers.count({
            where: {
              workspaceId,
              deletedAt: null
            }
          });
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
    
    // 🚨 CRITICAL FIX: Skip caching to prevent workspace data leakage
    // Always return fresh data for workspace isolation
    
    const responseTime = Date.now() - startTime;
    console.log(`✅ [SECTION API] Loaded ${section} data in ${responseTime}ms: ${sectionData.length} items`);
    
    const response = createSuccessResponse(result, {
      userId: context.userId,
      workspaceId: context.workspaceId,
      responseTime: Date.now() - startTime
    });
    
    // 🚨 CRITICAL FIX: Add cache-busting headers to prevent browser caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    return response;
    
  } catch (error) {
    console.error('❌ [SECTION API] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
