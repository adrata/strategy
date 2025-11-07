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
import { calculateLastActionTiming, calculateNextActionTiming, addBusinessDays } from '@/platform/utils/actionUtils';
import { isMeaningfulAction } from '@/platform/utils/meaningfulActions';

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
export const dynamic = 'force-dynamic';;
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    let context;
    try {
      context = await getOptimizedWorkspaceContext(request);
    } catch (error) {
      // CRITICAL FIX: If workspace context fails, try using getSecureApiContext as fallback
      console.warn('⚠️ [SECTION API] Failed to get optimized workspace context, trying secure API context:', error);
      const secureContext = await getSecureApiContext(request, {
        requireAuth: true,
        requireWorkspaceAccess: true
      });
      
      if (secureContext.response || !secureContext.context) {
        return createErrorResponse('Authentication required', 'AUTH_REQUIRED', 401);
      }
      
      context = {
        workspaceId: secureContext.context.workspaceId,
        userId: secureContext.context.userId
      };
      
      // Log warning if using fallback workspaceId
      if (context.workspaceId === 'local-workspace') {
        console.warn('⚠️ [SECTION API] Using fallback workspaceId - queries may return empty results:', {
          workspaceId: context.workspaceId,
          userId: context.userId
        });
      }
    }
    
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
    
    // User assignment filters are now applied universally for proper data isolation
    
    // 🚀 PERFORMANCE: Load only the specific section data needed
    switch (section) {
      case 'speedrun':
        // 🚀 FIX: Speedrun is top 50 people with companies, ranked by globalRank
        console.log(`🏆 [SPEEDRUN] Loading top 50 people for speedrun for workspace: ${workspaceId}`);
        
        const speedrunPeople = await prisma.people.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            companyId: { not: null }, // Only people with company relationships
            OR: [
              { mainSellerId: userId },
              { mainSellerId: null }
            ]
          },
          orderBy: [
            { globalRank: 'asc' }, // Sort by rank (best prospects first)
            { updatedAt: 'desc' }
          ],
          take: 50, // Limit to top 50 for speedrun
            select: {
              id: true,
              firstName: true,
              lastName: true,
              fullName: true,
              email: true,
              jobTitle: true,
              phone: true,
              linkedinUrl: true,
              status: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true,
              mainSellerId: true,
              workspaceId: true,
              createdAt: true,
              updatedAt: true,
              // 🎯 FIX: Add location fields for filter fallback
              address: true,
              city: true,
              state: true,
              country: true,
              owner: {
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
                  employeeCount: true,
                  hqState: true,
                  state: true
                }
              },
              actions: {
                where: {
                  deletedAt: null,
                  status: 'COMPLETED'
                },
                orderBy: {
                  completedAt: 'desc'
                },
                take: 1,
                select: {
                  id: true,
                  type: true,
                  subject: true,
                  completedAt: true,
                  createdAt: true
                }
              }
            }
          });
          
          // Transform people to speedrun format
          sectionData = speedrunPeople.map((person, index) => {
            // Safe string truncation utility
            const safeString = (str: any, maxLength: number = 1000): string => {
              if (!str || typeof str !== 'string') return '';
              if (str.length <= maxLength) return str;
              return str.substring(0, maxLength) + '...';
            };

            // Format owner name - show "Me" for current user
            const ownerName = person.owner 
              ? (person.owner.id === userId
                  ? 'Me'
                  : person.owner.firstName && person.owner.lastName 
                    ? `${person.owner.firstName} ${person.owner.lastName}`.trim()
                    : person.owner.name || person.owner.email || '-')
              : '-';

            // Format co-sellers names - show "Me" for current user
            const coSellersNames = person.coSellers && person.coSellers.length > 0
              ? person.coSellers.map((coSeller: any) => {
                  const user = coSeller.user;
                  return user.id === userId
                    ? 'Me'
                    : user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`.trim()
                      : user.name || user.email || 'Unknown';
                }).join(', ')
              : '-';

            // Calculate lastActionTime for speedrun table display using meaningful actions
            let lastActionTime = 'Never';
            let lastAction = person.lastAction;
            let lastActionDate = person.lastActionDate;
            
            // Check if we have a meaningful action from the database
            if (person.actions && person.actions.length > 0) {
              const meaningfulAction = person.actions.find(action => isMeaningfulAction(action.type));
              if (meaningfulAction) {
                lastAction = meaningfulAction.subject || meaningfulAction.type;
                lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
              }
            }
            
            // Only show real last actions if they exist and are meaningful
            if (lastActionDate && lastAction && lastAction !== 'No action taken' && lastAction !== 'Record created' && lastAction !== 'Company record created') {
              // Real last action exists
              const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince === 0) lastActionTime = 'Today';
              else if (daysSince === 1) lastActionTime = 'Yesterday';
              else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
              else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
              else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
            } else if (person.createdAt) {
              // No real last action, show when data was added
              const daysSince = Math.floor((new Date().getTime() - new Date(person.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince === 0) lastActionTime = 'Today';
              else if (daysSince === 1) lastActionTime = 'Yesterday';
              else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
              else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
              else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
            }

            return {
              id: person.id,
              rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1
              name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
              company: person.company || null, // 🎯 FIX: Pass through complete company object for filters
              companyName: safeString(person.company?.name || 'Unknown Company', 200), // 🎯 FIX: Add companyName for display
              title: safeString(person.jobTitle || 'Unknown Title', 300),
              role: 'Stakeholder', // Default buyer group role
              stage: 'Prospect', // Default stage
              email: safeString(person.email || 'Unknown Email', 300),
              phone: safeString(person.phone || 'Unknown Phone', 50),
              linkedin: safeString(person.linkedinUrl || 'Unknown LinkedIn', 500),
              status: safeString(person.status || 'Unknown', 20),
              lastAction: safeString(lastAction || 'No action taken', 500),
              lastActionDate: lastActionDate || null,
              lastActionTime: lastActionTime,
              nextAction: safeString(person.nextAction || 'No next action', 500),
              nextActionDate: person.nextActionDate || null,
              mainSellerId: person.mainSellerId,
              workspaceId: person.workspaceId,
              createdAt: person.createdAt,
              updatedAt: person.updatedAt,
              tags: ['speedrun'], // Add speedrun tag for consistency
              // 🎯 FIX: Add location fields for filter fallback
              address: person.address,
              city: person.city,
              state: person.state,
              country: person.country,
              // Add main-seller and co-sellers data
              mainSeller: ownerName,
              coSellers: coSellersNames,
              mainSellerData: person.owner,
              coSellersData: person.coSellers,
              currentUserId: userId
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
              { mainSellerId: userId },
              { mainSellerId: null }
            ],
            // Filter for people who are leads - use specific lead filters
            AND: [
              {
                OR: [
                  { status: 'new' },
                  { status: 'lead' }
                ]
              }
            ]
          },
          orderBy: [
            { company: { globalRank: 'asc' } }, // Use company rank first like people
            { globalRank: 'asc' }, // Then by person rank
            { updatedAt: 'desc' }
          ],
          take: 10000, // Increased limit to ensure we get all leads (same as unified API)
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            phone: true,
            jobTitle: true,
            title: true,
            department: true,
            bio: true,
            linkedinUrl: true,
            linkedinNavigatorUrl: true,
            linkedinConnectionDate: true,
            buyerGroupRole: true,
            influenceLevel: true,
            engagementPriority: true,
            engagementStrategy: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true,
                globalRank: true
              }
            },
            status: true,
            createdAt: true,
            updatedAt: true,
            globalRank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            customFields: true,
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              },
              orderBy: {
                completedAt: 'desc'
              },
              take: 1,
              select: {
                id: true,
                type: true,
                subject: true,
                completedAt: true,
                createdAt: true
              }
            }
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
          
          // Calculate lastActionTime for leads table display using meaningful actions (copy from speedrun)
          let lastActionTime = 'Never';
          let lastAction = person.lastAction;
          let lastActionDate = person.lastActionDate;
          
          // Check if we have a meaningful action from the database
          if (person.actions && person.actions.length > 0) {
            const meaningfulAction = person.actions.find(action => isMeaningfulAction(action.type));
            if (meaningfulAction) {
              lastAction = meaningfulAction.subject || meaningfulAction.type;
              lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
            }
          }
          
          // Only show real last actions if they exist and are meaningful
          if (lastActionDate && lastAction && lastAction !== 'No action taken') {
            // Real last action exists
            const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          } else if (person.createdAt) {
            // No real last action, show when data was added
            const daysSince = Math.floor((new Date().getTime() - new Date(person.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          }

          // Calculate nextActionTiming with fallback
          let nextActionTiming = 'No date set';
          let nextAction = person.nextAction;
          let nextActionDate = person.nextActionDate;
          
          // Auto-populate nextActionDate if missing (Skip Miller ProActive Selling timing)
          if (!nextActionDate) {
            const rank = person.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || person.createdAt;
            
            // Skip Miller timing based on prospect priority
            let businessDaysToAdd = 7; // Default: 1 week
            if (rank <= 10) businessDaysToAdd = 2; // Hot: 2 business days
            else if (rank <= 50) businessDaysToAdd = 3; // Warm: 3 business days
            else if (rank <= 100) businessDaysToAdd = 5; // Active: 5 business days
            else if (rank <= 500) businessDaysToAdd = 7; // Nurture: 1 week
            else businessDaysToAdd = 14; // Cold: 2 weeks
            
            // Use business days calculation (skips weekends)
            nextActionDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);
          }
          
          // Auto-populate nextAction text if missing
          if (!nextAction) {
            if (lastAction && lastAction !== 'No action taken') {
              if (lastAction.toLowerCase().includes('email')) {
                nextAction = 'Schedule a call to discuss next steps';
              } else if (lastAction.toLowerCase().includes('call')) {
                nextAction = 'Send follow-up email with meeting notes';
              } else if (lastAction.toLowerCase().includes('linkedin')) {
                nextAction = 'Send personalized connection message';
              } else if (lastAction.toLowerCase().includes('created')) {
                nextAction = 'Send initial outreach email';
              } else {
                nextAction = 'Follow up on previous contact';
              }
            } else {
              nextAction = 'Send initial outreach email';
            }
          }
          
          // Calculate nextActionTiming
          if (nextActionDate) {
            const now = new Date();
            const actionDate = new Date(nextActionDate);
            const diffMs = actionDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            // For same-day actions, show "Today" regardless of time
            const isSameDay = now.toDateString() === actionDate.toDateString();
            
            if (isSameDay) {
              nextActionTiming = 'Today';
            } else if (diffDays < 0) {
              nextActionTiming = 'Overdue';
            } else if (diffDays === 0) {
              nextActionTiming = 'Today';
            } else if (diffDays === 1) {
              nextActionTiming = 'Tomorrow';
            } else if (diffDays <= 7) {
              nextActionTiming = 'This week';
            } else if (diffDays <= 14) {
              nextActionTiming = 'Next week';
            } else if (diffDays <= 30) {
              nextActionTiming = 'This month';
            } else {
              nextActionTiming = 'Future';
            }
          }
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            title: person.jobTitle || '-',
            email: person.email || 'Unknown Email',
            status: person.status || 'Unknown',
            lastAction: lastAction || null,
            lastActionDate: lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || null,
            nextActionDate: nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
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
              { mainSellerId: userId },
              { mainSellerId: null }
            ],
            // Filter for people who are prospects - use specific prospect filters
            AND: [
              {
                OR: [
                  { status: 'engaged' },
                  { status: 'prospect' }
                ]
              }
            ]
          },
          orderBy: [
            { company: { globalRank: 'asc' } }, // Use company rank first like people
            { globalRank: 'asc' }, // Then by person rank
            { updatedAt: 'desc' }
          ],
          take: 10000, // Increased limit to ensure we get all prospects (same as unified API)
          select: {
            id: true,
            firstName: true,
            lastName: true,
            fullName: true,
            email: true,
            phone: true,
            jobTitle: true,
            title: true,
            department: true,
            bio: true,
            linkedinUrl: true,
            linkedinNavigatorUrl: true,
            linkedinConnectionDate: true,
            buyerGroupRole: true,
            influenceLevel: true,
            engagementPriority: true,
            engagementStrategy: true,
            company: {
              select: {
                id: true,
                name: true,
                industry: true,
                size: true,
                globalRank: true
              }
            },
            status: true,
            createdAt: true,
            updatedAt: true,
            globalRank: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            customFields: true,
            actions: {
              where: {
                deletedAt: null,
                status: 'COMPLETED'
              },
              orderBy: {
                completedAt: 'desc'
              },
              take: 1,
              select: {
                id: true,
                type: true,
                subject: true,
                completedAt: true,
                createdAt: true
              }
            }
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
        
        // 🏢 ADD COMPANY PROSPECTS: Fetch companies with status PROSPECT that have 0 people
        const companiesWithNoPeople = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { mainSellerId: userId },
              { mainSellerId: null }
            ],
            status: 'PROSPECT', // Only prospect companies
            people: { none: {} } // Companies with 0 people
          },
          select: {
            id: true,
            name: true,
            industry: true,
            status: true,
            priority: true,
            globalRank: true,
            lastAction: true,
            nextAction: true,
            lastActionDate: true,
            nextActionDate: true,
            mainSellerId: true,
            hqState: true,
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
            }
          }
        });

        console.log(`🏢 [PROSPECTS API] Found ${companiesWithNoPeople.length} prospect companies with 0 people`);

        // Transform companies to look like person records
        const companyProspects = companiesWithNoPeople.map(company => ({
          id: company.id,
          fullName: company.name, // Use company name in name column
          firstName: null,
          lastName: null,
          email: null,
          jobTitle: null,
          title: null,
          phone: null,
          department: null,
          status: company.status || 'PROSPECT', // Use actual company status
          priority: company.priority,
          globalRank: company.globalRank,
          lastAction: company.lastAction,
          nextAction: company.nextAction,
          lastActionDate: company.lastActionDate,
          nextActionDate: company.nextActionDate,
          companyId: company.id,
          mainSellerId: company.mainSellerId,
          company: {
            id: company.id,
            name: company.name, // Show company name in company column too
            industry: company.industry,
            size: null,
            globalRank: company.globalRank,
            hqState: company.hqState
          },
          mainSeller: company.mainSeller 
            ? (company.mainSeller.id === userId
                ? 'Me'
                : company.mainSeller.firstName && company.mainSeller.lastName 
                  ? `${company.mainSeller.firstName} ${company.mainSeller.lastName}`.trim()
                  : company.mainSeller.name || company.mainSeller.email || '-')
            : '-',
          mainSellerData: company.mainSeller,
          isCompanyLead: true, // Flag to identify company records
          createdAt: company.createdAt,
          updatedAt: company.updatedAt,
          _count: { actions: 0 }
        }));

        // Combine people and company prospects
        const allProspects = [...deduplicatedProspects, ...companyProspects];
        console.log(`🏢 [PROSPECTS API] Combined prospects: ${deduplicatedProspects.length} people + ${companyProspects.length} companies = ${allProspects.length} total`);
        
        sectionData = allProspects.map((person, index) => {
          // Extract Coresignal data
          const coresignalData = (person.customFields as any)?.coresignalData || (person.customFields as any)?.coresignal || {};
          
          // Get company from Coresignal data (active experience)
          const coresignalCompany = coresignalData.active_experience_company || 
                                    coresignalData.experience?.find((exp: any) => exp.active_experience === 1)?.company_name || 
                                    coresignalData.experience?.[0]?.company_name;
          
          // Calculate lastActionTime for prospects table display using meaningful actions (copy from speedrun)
          let lastActionTime = 'Never';
          let lastAction = person.lastAction;
          let lastActionDate = person.lastActionDate;
          
          // Check if we have a meaningful action from the database
          if (person.actions && person.actions.length > 0) {
            const meaningfulAction = person.actions.find(action => isMeaningfulAction(action.type));
            if (meaningfulAction) {
              lastAction = meaningfulAction.subject || meaningfulAction.type;
              lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
            }
          }
          
          // Only show real last actions if they exist and are meaningful
          if (lastActionDate && lastAction && lastAction !== 'No action taken') {
            // Real last action exists
            const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          } else if (person.createdAt) {
            // No real last action, show when data was added
            const daysSince = Math.floor((new Date().getTime() - new Date(person.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          }

          // Calculate nextActionTiming with fallback
          let nextActionTiming = 'No date set';
          let nextAction = person.nextAction;
          let nextActionDate = person.nextActionDate;
          
          // Auto-populate nextActionDate if missing (Skip Miller ProActive Selling timing)
          if (!nextActionDate) {
            const rank = person.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || person.createdAt;
            
            // Skip Miller timing based on prospect priority
            let businessDaysToAdd = 7; // Default: 1 week
            if (rank <= 10) businessDaysToAdd = 2; // Hot: 2 business days
            else if (rank <= 50) businessDaysToAdd = 3; // Warm: 3 business days
            else if (rank <= 100) businessDaysToAdd = 5; // Active: 5 business days
            else if (rank <= 500) businessDaysToAdd = 7; // Nurture: 1 week
            else businessDaysToAdd = 14; // Cold: 2 weeks
            
            // Use business days calculation (skips weekends)
            nextActionDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);
          }
          
          // Auto-populate nextAction text if missing
          if (!nextAction) {
            if (lastAction && lastAction !== 'No action taken') {
              if (lastAction.toLowerCase().includes('email')) {
                nextAction = 'Schedule a call to discuss next steps';
              } else if (lastAction.toLowerCase().includes('call')) {
                nextAction = 'Send follow-up email with meeting notes';
              } else if (lastAction.toLowerCase().includes('linkedin')) {
                nextAction = 'Send personalized connection message';
              } else if (lastAction.toLowerCase().includes('created')) {
                nextAction = 'Send initial outreach email';
              } else {
                nextAction = 'Follow up on previous contact';
              }
            } else {
              nextAction = 'Send initial outreach email';
            }
          }
          
          // Calculate nextActionTiming
          if (nextActionDate) {
            const now = new Date();
            const actionDate = new Date(nextActionDate);
            const diffMs = actionDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            // For same-day actions, show "Today" regardless of time
            const isSameDay = now.toDateString() === actionDate.toDateString();
            
            if (isSameDay) {
              nextActionTiming = 'Today';
            } else if (diffDays < 0) {
              nextActionTiming = 'Overdue';
            } else if (diffDays === 0) {
              nextActionTiming = 'Today';
            } else if (diffDays === 1) {
              nextActionTiming = 'Tomorrow';
            } else if (diffDays <= 7) {
              nextActionTiming = 'This week';
            } else if (diffDays <= 14) {
              nextActionTiming = 'Next week';
            } else if (diffDays <= 30) {
              nextActionTiming = 'This month';
            } else {
              nextActionTiming = 'Future';
            }
          }
          
          return {
            id: person.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
            name: person.fullName || `${person.firstName} ${person.lastName}`,
            company: coresignalCompany || person.company?.name || '-',
            title: person.jobTitle || '-',
            email: person.email || 'Unknown Email',
            status: person.status || 'Unknown',
            lastAction: lastAction || null,
            lastActionDate: lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || null,
            nextActionDate: nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            createdAt: person.createdAt,
            updatedAt: person.updatedAt
          };
        });
        break;
        
      case 'opportunities':
        // 🚀 FIX: Opportunities are companies with OPPORTUNITY status in streamlined schema
        const opportunitiesData = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            status: 'OPPORTUNITY', // Filter for OPPORTUNITY status
            OR: [
              { mainSellerId: userId },
              { mainSellerId: null }
            ]
          },
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            name: true,
            industry: true,
            size: true,
            revenue: true,
            currency: true,
            status: true,
            priority: true,
            lastAction: true,
            lastActionDate: true,
            nextAction: true,
            nextActionDate: true,
            mainSellerId: true,
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
        sectionData = deduplicatedOpportunities.map((company, index) => ({
          id: company.id,
          rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after deduplication
          name: company.name,
          industry: company.industry || 'Unknown',
          size: company.size || 'Unknown',
          amount: company.revenue ? Number(company.revenue) : 0,
          currency: company.currency || 'USD',
          stage: company.status || 'OPPORTUNITY',
          priority: company.priority || 'MEDIUM',
          lastAction: company.lastAction || 'No action taken',
          nextAction: company.nextAction || 'No action planned',
          lastActionDate: company.lastActionDate,
          nextActionDate: company.nextActionDate,
          mainSellerId: company.mainSellerId,
          createdAt: company.createdAt,
          updatedAt: company.updatedAt
        }));
        break;
        
      case 'companies':
        // 🚀 PROPER COMPANY RANKING: Use actual company ranks from database
        const companiesData = await prisma.companies.findMany({
          where: {
            workspaceId,
            deletedAt: null,
            OR: [
              { mainSellerId: userId },
              { mainSellerId: null }
            ]
          },
          orderBy: [
            { globalRank: 'asc' }, // Use actual company ranks first
            { updatedAt: 'desc' } // Then by update time for companies without ranks
          ],
          take: limit,
          select: {
            id: true,
            name: true,
            industry: true,
            vertical: true,
            size: true,
            mainSellerId: true,
            createdAt: true,
            updatedAt: true,
            globalRank: true,
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
        
        // 🚀 COMPANIES AGGREGATION: Aggregate last/next actions from actions table
        sectionData = await Promise.all(deduplicatedCompanies.map(async (company, index) => {
          // Find most recent meaningful action for this company from actions table
          const recentAction = await prisma.actions.findFirst({
            where: {
              workspaceId,
              companyId: company.id,
              deletedAt: null,
              status: 'COMPLETED'
            },
            orderBy: { completedAt: 'desc' },
            select: {
              type: true,
              subject: true,
              completedAt: true,
              createdAt: true
            }
          });

          // Filter for meaningful actions
          let meaningfulAction = null;
          if (recentAction && isMeaningfulAction(recentAction.type)) {
            meaningfulAction = recentAction;
          }

          // Find next upcoming action for this company
          const upcomingAction = await prisma.actions.findFirst({
            where: {
              workspaceId,
              companyId: company.id,
              scheduledAt: { gt: new Date() }
            },
            orderBy: { scheduledAt: 'asc' },
            select: {
              subject: true,
              scheduledAt: true
            }
          });

          // Calculate lastActionTime for companies table display using meaningful actions (copy from speedrun)
          let lastActionTime = 'Never';
          let lastAction = company.lastAction;
          let lastActionDate = company.lastActionDate;
          
          // Use meaningful action if available
          if (meaningfulAction) {
            lastAction = meaningfulAction.subject || meaningfulAction.type;
            lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
          }
          
          // Only show real last actions if they exist and are meaningful
          if (lastActionDate && lastAction && lastAction !== 'No action taken') {
            // Real last action exists
            const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          } else if (company.createdAt) {
            // No real last action, show when data was added
            const daysSince = Math.floor((new Date().getTime() - new Date(company.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince === 0) lastActionTime = 'Today';
            else if (daysSince === 1) lastActionTime = 'Yesterday';
            else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
            else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
            else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
          }

          // Calculate nextActionTiming with fallback
          let nextActionTiming = 'No date set';
          let nextAction = company.nextAction;
          let nextActionDate = company.nextActionDate;
          
          // Use upcoming action if available
          if (upcomingAction) {
            nextAction = upcomingAction.subject;
            nextActionDate = upcomingAction.scheduledAt;
          }
          
          // Auto-populate nextActionDate if missing (Skip Miller ProActive Selling timing)
          if (!nextActionDate) {
            const rank = company.globalRank || 1000;
            const lastActionDateForCalc = lastActionDate || company.createdAt;
            
            // Skip Miller timing based on prospect priority
            let businessDaysToAdd = 7; // Default: 1 week
            if (rank <= 10) businessDaysToAdd = 2; // Hot: 2 business days
            else if (rank <= 50) businessDaysToAdd = 3; // Warm: 3 business days
            else if (rank <= 100) businessDaysToAdd = 5; // Active: 5 business days
            else if (rank <= 500) businessDaysToAdd = 7; // Nurture: 1 week
            else businessDaysToAdd = 14; // Cold: 2 weeks
            
            // Use business days calculation (skips weekends)
            nextActionDate = addBusinessDays(new Date(lastActionDateForCalc), businessDaysToAdd);
          }
          
          // Auto-populate nextAction text if missing
          if (!nextAction) {
            if (lastAction && lastAction !== 'No action taken') {
              if (lastAction.toLowerCase().includes('email')) {
                nextAction = 'Schedule a call to discuss next steps';
              } else if (lastAction.toLowerCase().includes('call')) {
                nextAction = 'Send follow-up email with meeting notes';
              } else if (lastAction.toLowerCase().includes('linkedin')) {
                nextAction = 'Send personalized connection message';
              } else if (lastAction.toLowerCase().includes('created')) {
                nextAction = 'Send initial outreach email';
              } else {
                nextAction = 'Follow up on previous contact';
              }
            } else {
              nextAction = 'Send initial outreach email';
            }
          }
          
          // Calculate nextActionTiming
          if (nextActionDate) {
            const now = new Date();
            const actionDate = new Date(nextActionDate);
            const diffMs = actionDate.getTime() - now.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            // For same-day actions, show "Today" regardless of time
            const isSameDay = now.toDateString() === actionDate.toDateString();
            
            if (isSameDay) {
              nextActionTiming = 'Today';
            } else if (diffDays < 0) {
              nextActionTiming = 'Overdue';
            } else if (diffDays === 0) {
              nextActionTiming = 'Today';
            } else if (diffDays === 1) {
              nextActionTiming = 'Tomorrow';
            } else if (diffDays <= 7) {
              nextActionTiming = 'This week';
            } else if (diffDays <= 14) {
              nextActionTiming = 'Next week';
            } else if (diffDays <= 30) {
              nextActionTiming = 'This month';
            } else {
              nextActionTiming = 'Future';
            }
          }

          return {
            id: company.id,
            rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering and deduplication
            name: company.name,
            industry: company.industry || 'Unknown',
            size: company.size || 'Unknown',
            mainSellerId: company.mainSellerId, // 🆕 FIX: Include mainSellerId for company assignment filtering
            lastAction: lastAction || 'Never',
            lastActionDate: lastActionDate,
            lastActionTime: lastActionTime, // NEW: Timing text
            nextAction: nextAction || 'No action planned',
            nextActionDate: nextActionDate,
            nextActionTiming: nextActionTiming, // NEW: Timing text
            createdAt: company.createdAt,
            updatedAt: company.updatedAt
          };
        }));
        break;
        
      case 'people':
        // 🚀 PERFORMANCE: Optimized people query with error handling - FIXED: Use same logic as speedrun
        console.log(`👥 [SECTION API] Loading people for workspace: ${workspaceId}`);
        
        try {
          const peopleData = await prisma.people.findMany({
            where: {
              workspaceId,
              deletedAt: null,
              companyId: { not: null }, // Only people with company relationships like speedrun
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
            },
            orderBy: [
              { company: { globalRank: 'asc' } }, // Use company rank first like speedrun
              { globalRank: 'asc' }, // Then by person rank
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
              globalRank: true,
              lastAction: true,
              lastActionDate: true,
              nextAction: true,
              nextActionDate: true,
              mainSellerId: true,
              workspaceId: true,
              createdAt: true,
              updatedAt: true,
              // Include company relationship to get company name
              company: {
                select: {
                  id: true,
                  name: true,
                  globalRank: true
                }
              },
              actions: {
                where: {
                  deletedAt: null,
                  status: 'COMPLETED'
                },
                orderBy: {
                  completedAt: 'desc'
                },
                take: 1,
                select: {
                  id: true,
                  type: true,
                  subject: true,
                  completedAt: true,
                  createdAt: true
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

            // Calculate lastActionTime for people table display using meaningful actions (copy from speedrun)
            let lastActionTime = 'Never';
            let lastAction = person.lastAction;
            let lastActionDate = person.lastActionDate;
            
            // Check if we have a meaningful action from the database
            if (person.actions && person.actions.length > 0) {
              const meaningfulAction = person.actions.find(action => isMeaningfulAction(action.type));
              if (meaningfulAction) {
                lastAction = meaningfulAction.subject || meaningfulAction.type;
                lastActionDate = meaningfulAction.completedAt || meaningfulAction.createdAt;
              }
            }
            
            // Only show real last actions if they exist and are meaningful
            if (lastActionDate && lastAction && lastAction !== 'No action taken' && lastAction !== 'Record created' && lastAction !== 'Company record created') {
              // Real last action exists
              const daysSince = Math.floor((new Date().getTime() - new Date(lastActionDate).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince === 0) lastActionTime = 'Today';
              else if (daysSince === 1) lastActionTime = 'Yesterday';
              else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
              else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
              else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
            } else if (person.createdAt) {
              // No real last action, show when data was added
              const daysSince = Math.floor((new Date().getTime() - new Date(person.createdAt).getTime()) / (1000 * 60 * 60 * 24));
              if (daysSince === 0) lastActionTime = 'Today';
              else if (daysSince === 1) lastActionTime = 'Yesterday';
              else if (daysSince <= 7) lastActionTime = `${daysSince} days ago`;
              else if (daysSince <= 30) lastActionTime = `${Math.floor(daysSince / 7)} weeks ago`;
              else lastActionTime = `${Math.floor(daysSince / 30)} months ago`;
            }

            // Calculate nextActionTiming with fallback
            let nextActionTiming = 'No date set';
            let nextAction = person.nextAction;
            let nextActionDate = person.nextActionDate;
            
            // Auto-populate nextActionDate if missing
            if (!nextActionDate) {
              const rank = person.globalRank || 1000;
              const lastActionDateForCalc = lastActionDate || person.createdAt;
              let daysToAdd = 7; // Default 1 week
              if (rank <= 10) daysToAdd = 1; // Top 10: tomorrow
              else if (rank <= 50) daysToAdd = 3; // Top 50: 3 days
              else if (rank <= 100) daysToAdd = 5; // Top 100: 5 days
              else if (rank <= 500) daysToAdd = 7; // Top 500: 1 week
              else daysToAdd = 14; // Others: 2 weeks
              
              nextActionDate = new Date(lastActionDateForCalc);
              nextActionDate.setDate(nextActionDate.getDate() + daysToAdd);
            }
            
            // Auto-populate nextAction text if missing
            if (!nextAction) {
              if (lastAction && lastAction !== 'No action taken') {
                if (lastAction.toLowerCase().includes('email')) {
                  nextAction = 'Schedule a call to discuss next steps';
                } else if (lastAction.toLowerCase().includes('call')) {
                  nextAction = 'Send follow-up email with meeting notes';
                } else if (lastAction.toLowerCase().includes('linkedin')) {
                  nextAction = 'Send personalized connection message';
                } else if (lastAction.toLowerCase().includes('created')) {
                  nextAction = 'Send initial outreach email';
                } else {
                  nextAction = 'Follow up on previous contact';
                }
              } else {
                nextAction = 'Send initial outreach email';
              }
            }
            
            // Calculate nextActionTiming
            if (nextActionDate) {
              const now = new Date();
              const actionDate = new Date(nextActionDate);
              const diffMs = actionDate.getTime() - now.getTime();
              const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
              
              // For Speedrun (top 50), convert "Overdue" to "Today" to ensure records are always actionable
              if (diffDays < 0) {
                nextActionTiming = 'Today'; // Was: 'Overdue' - Speedrun records should never be overdue
              }
              else if (diffDays === 0) nextActionTiming = 'Today';
              else if (diffDays === 1) nextActionTiming = 'Tomorrow';
              else if (diffDays <= 7) nextActionTiming = 'This week';
              else if (diffDays <= 14) nextActionTiming = 'Next week';
              else if (diffDays <= 30) nextActionTiming = 'This month';
              else nextActionTiming = 'Future';
            }

            return {
              id: person.id,
              rank: index + 1, // 🎯 SEQUENTIAL RANKING: Start from 1 after filtering
              name: safeString(person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown', 200),
              company: safeString(person.company?.name || 'Unknown Company', 200),
              companyRank: person.company?.globalRank || 0, // Include company rank for proper ordering
              title: safeString(person.jobTitle || 'Unknown Title', 300),
              email: safeString(person.email || 'Unknown Email', 300),
              phone: safeString(person.phone || 'Unknown Phone', 50),
              linkedin: safeString(person.linkedinUrl || 'Unknown LinkedIn', 500),
              status: safeString(person.status || 'Unknown', 20),
              lastAction: safeString(lastAction || 'No action taken', 500),
              lastActionDate: lastActionDate || null,
              lastActionTime: lastActionTime, // NEW: Timing text
              nextAction: safeString(nextAction || 'No next action', 500),
              nextActionDate: nextActionDate || null,
              nextActionTiming: nextActionTiming, // NEW: Timing text
              mainSellerId: person.mainSellerId || null,
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
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
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
              mainSellerId: true,
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
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
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
              mainSellerId: true,
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
            mainSellerId: seller.mainSellerId,
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
          // Use same logic as counts API (people table with LEAD status)
          totalCount = await prisma.people.count({
            where: {
              workspaceId,
              status: 'LEAD',
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
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
            }
          });
          break;
        case 'opportunities':
          totalCount = await prisma.companies.count({
            where: {
              workspaceId,
              deletedAt: null,
              status: 'OPPORTUNITY',
              OR: [
                { mainSellerId: userId },
                { mainSellerId: null }
              ]
            }
          });
          break;
        case 'speedrun':
          // 🚀 FIX: Speedrun count should match the actual API response (up to 50 records)
          // Count people with ranks 1-50 + companies with ranks 1-50 and 0 people
          const speedrunPeopleCount = await prisma.people.count({
            where: {
              workspaceId,
              deletedAt: null,
              companyId: { not: null },
              globalRank: { not: null, gte: 1, lte: 50 },
              mainSellerId: userId
            }
          });
          const speedrunCompaniesCount = await prisma.companies.count({
            where: {
              workspaceId,
              deletedAt: null,
              globalRank: { not: null, gte: 1, lte: 50 },
              people: { none: {} },
              mainSellerId: userId
            }
          });
          totalCount = Math.min(50, speedrunPeopleCount + speedrunCompaniesCount);
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
