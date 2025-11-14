import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// Required for dynamic API functionality
export const dynamic = "force-dynamic";

// GET: Fast buyer group data for a specific company
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    
    // Get secure context
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

    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    if (!companyId || !workspaceId || !userId) {
      return createErrorResponse('Company ID, workspace, and user are required', 'VALIDATION_ERROR', 400);
    }

    console.log(`🚀 [FAST BUYER GROUPS] ========================================`);
    console.log(`🚀 [FAST BUYER GROUPS] Loading buyer group for company: ${companyId}`);
    console.log(`🚀 [FAST BUYER GROUPS] Workspace ID: ${workspaceId}, User ID: ${userId}`);
    console.log(`🚀 [FAST BUYER GROUPS] Request URL: ${request.url}`);

    // Get the company name for response (not for matching - we use companyId exact match)
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { name: true }
    });
    
    const companyName = company?.name || '';
    
    console.log(`🚀 [FAST BUYER GROUPS] Company found:`, company);
    console.log(`🚀 [FAST BUYER GROUPS] Searching for people with companyId: ${companyId} (exact match only)`);
    console.log(`🚀 [FAST BUYER GROUPS] Auth context:`, { workspaceId, userId });

    // Single optimized query to get people with buyer group roles for the company
    // STRICT: Only use companyId exact match - no email domain fallback to prevent cross-company leakage
    const whereClause = {
      AND: [
        {
          // PRIMARY FILTER: Exact companyId match only (no email domain fallback)
          companyId: companyId
        },
        {
          workspaceId: workspaceId,
          deletedAt: null
        },
        // Filter for people with buyer group roles OR marked as buyer group members
        {
          OR: [
            // People with buyerGroupRole set (primary filter)
            { buyerGroupRole: { not: null } },
            // People with isBuyerGroupMember = true
            { isBuyerGroupMember: true },
            // People with buyerGroupStatus: 'in' in customFields
            {
              customFields: {
                path: ['buyerGroupStatus'],
                equals: 'in'
              }
            }
          ]
        }
      ]
    };
    
    console.log(`🚀 [FAST BUYER GROUPS] Query WHERE clause:`, JSON.stringify(whereClause, null, 2));
    
    const people = await prisma.people.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        customFields: true,
        buyerGroupRole: true,
        buyerGroupStatus: true,  // ADD THIS - direct field from people table
        status: true, // Include status field for frontend display
        createdAt: true,
        updatedAt: true,
        lastEnriched: true
      },
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' }
      ],
      take: 50 // Limit to 50 people for performance
    });

    // 🚨 POST-QUERY VALIDATION: Filter out any people that don't match the exact companyId
    // This is defense in depth - the query should already filter by companyId, but validate anyway
    const validatedPeople = people.filter(person => {
      if (person.companyId !== companyId) {
        console.warn(`⚠️ [FAST BUYER GROUPS] Filtering out person with mismatched companyId:`, {
          personId: person.id,
          personName: person.fullName,
          personCompanyId: person.companyId,
          expectedCompanyId: companyId
        });
        return false;
      }
      return true;
    });

    console.log(`🔍 [FAST BUYER GROUPS] Query returned ${people.length} raw results`);
    console.log(`🔍 [FAST BUYER GROUPS] After validation: ${validatedPeople.length} people (was ${people.length})`);
    
    if (people.length === 0) {
      console.log(`❌ [FAST BUYER GROUPS] ZERO RESULTS - Debugging why...`);
      
      // Test 1: Check if ANY people exist for this company (no buyer group filter)
      const allCompanyPeople = await prisma.people.findMany({
        where: {
          companyId: companyId,
          workspaceId: workspaceId,
          deletedAt: null
        },
        select: { id: true, fullName: true, buyerGroupRole: true, isBuyerGroupMember: true }
      });
      
      console.log(`🔍 [FAST BUYER GROUPS] Test 1 - All people for company (no buyer group filter): ${allCompanyPeople.length}`);
      if (allCompanyPeople.length > 0) {
        console.log(`🔍 [FAST BUYER GROUPS] Sample people:`, allCompanyPeople.slice(0, 3).map(p => ({
          name: p.fullName,
          hasRole: !!p.buyerGroupRole,
          isMember: p.isBuyerGroupMember
        })));
      }
      
      // Test 2: Check without workspace filter
      const peopleWithoutWorkspace = await prisma.people.findMany({
        where: {
          companyId: companyId,
          deletedAt: null,
          OR: [
            { buyerGroupRole: { not: null } },
            { isBuyerGroupMember: true }
          ]
        },
        select: { id: true, fullName: true, workspaceId: true }
      });
      
      console.log(`🔍 [FAST BUYER GROUPS] Test 2 - Without workspace filter: ${peopleWithoutWorkspace.length}`);
      if (peopleWithoutWorkspace.length > 0) {
        const workspaceIds = [...new Set(peopleWithoutWorkspace.map(p => p.workspaceId))];
        console.log(`🔍 [FAST BUYER GROUPS] Found people in workspaces:`, workspaceIds);
        console.log(`🔍 [FAST BUYER GROUPS] Expected workspace:`, workspaceId);
        console.log(`🔍 [FAST BUYER GROUPS] Workspace mismatch:`, !workspaceIds.includes(workspaceId));
      }
    }

    // Transform to buyer group format
    const buyerGroupMembers = validatedPeople.map(person => {
      const jobTitle = person.jobTitle || '';
      
      // Use stored role or infer from job title
      const customFields = person.customFields as any;
      const storedRole = customFields?.buyerGroupRole || person.buyerGroupRole;
      const buyerRole = storedRole || getBuyerGroupRole(jobTitle);
      
      // Extract buyer group status from direct field or customFields
      const buyerGroupStatus = person.buyerGroupStatus || customFields?.buyerGroupStatus || 'unknown';
      
      return {
        id: person.id,
        name: person.fullName || `${person.firstName} ${person.lastName}`,
        title: jobTitle,
        email: person.email || '',
        phone: person.phone || '',
        linkedinUrl: person.linkedinUrl || '',
        role: buyerRole,
        buyerGroupStatus: buyerGroupStatus,  // ADD THIS
        status: person.status || null, // Include status (LEAD, PROSPECT, etc.) for frontend display
        influence: getInfluenceLevel(buyerRole),
        isPrimary: false, // Will be set by caller if needed
        company: companyName, // Use actual company name, not companyId
        companyId: companyId, // Include companyId for client-side validation
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      };
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⚡ [FAST BUYER GROUPS] Loaded ${buyerGroupMembers.length} members in ${duration}ms`);
    console.log(`🔍 [FAST BUYER GROUPS] Filtering: People with buyerGroupRole OR isBuyerGroupMember OR buyerGroupStatus: 'in'`);
    console.log(`🔍 [FAST BUYER GROUPS] Raw people found:`, people.length);
    
    // Debug: Show breakdown of people found
    const peopleWithRole = people.filter(p => p.buyerGroupRole);
    const peopleWithMember = people.filter(p => p.isBuyerGroupMember);
    const peopleWithInStatus = people.filter(p => {
      const customFields = p.customFields as Record<string, any> || {};
      return customFields.buyerGroupStatus === 'in';
    });
    
    // Status breakdown for diagnostic logging
    const statusBreakdown = validatedPeople.reduce((acc, p) => {
      const status = p.status || 'NULL';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log(`📊 [FAST BUYER GROUPS] Breakdown:`);
    console.log(`   People with buyerGroupRole: ${peopleWithRole.length}`);
    console.log(`   People with isBuyerGroupMember: ${peopleWithMember.length}`);
    console.log(`   People with 'in' status: ${peopleWithInStatus.length}`);
    console.log(`   Total in buyer group: ${buyerGroupMembers.length}`);
    console.log(`📊 [FAST BUYER GROUPS] Status breakdown:`, statusBreakdown);
    console.log(`🚀 [FAST BUYER GROUPS] Returning ${buyerGroupMembers.length} members to client`);
    console.log(`🚀 [FAST BUYER GROUPS] ========================================`);

    return createSuccessResponse(buyerGroupMembers, {
      userId,
      workspaceId,
      companyId,
      totalMembers: buyerGroupMembers.length,
      processingTime: Date.now() - startTime
    });

  } catch (error) {
    console.error("❌ [FAST BUYER GROUPS] Error:", error);
    return createErrorResponse(
      "Failed to load buyer group data",
      "BUYER_GROUP_FAST_ERROR",
      500
    );
  }
}

// Helper function to determine buyer group role from job title
function getBuyerGroupRole(jobTitle: string): string {
  if (!jobTitle) return 'Stakeholder';
  
  const title = jobTitle.toLowerCase();
  
  // Decision makers
  if (title.includes('ceo') || title.includes('president') || title.includes('founder') || title.includes('owner')) {
    return 'Decision Maker';
  }
  if (title.includes('vp') || title.includes('vice president') || title.includes('director') || title.includes('head of')) {
    return 'Decision Maker';
  }
  if (title.includes('cfo') || title.includes('cto') || title.includes('cmo') || title.includes('coo')) {
    return 'Decision Maker';
  }
  
  // Champions
  if (title.includes('engineer') || title.includes('developer') || title.includes('architect')) {
    return 'Champion';
  }
  if (title.includes('consultant') || title.includes('advisor') || title.includes('expert')) {
    return 'Champion';
  }
  if (title.includes('project') && title.includes('director')) {
    return 'Champion';
  }
  
  // Blockers
  if (title.includes('legal') || title.includes('compliance') || title.includes('security')) {
    return 'Blocker';
  }
  if (title.includes('procurement') || title.includes('purchasing')) {
    return 'Blocker';
  }
  
  // Stakeholders
  if (title.includes('manager') || title.includes('lead') || title.includes('senior')) {
    return 'Stakeholder';
  }
  if (title.includes('analyst') || title.includes('specialist') || title.includes('coordinator')) {
    return 'Stakeholder';
  }
  if (title.includes('admin') || title.includes('assistant')) {
    return 'Stakeholder';
  }
  
  return 'Stakeholder';
}

// Helper function to determine influence level
// FIXED: Champion should have HIGH influence (same as Decision Maker)
function getInfluenceLevel(role: string): string {
  switch (role) {
    case 'Decision Maker': return 'high';
    case 'Champion': return 'high'; // FIXED: was 'medium', should be 'high'
    case 'Blocker': return 'medium';
    case 'Stakeholder': return 'medium'; // FIXED: was 'low', should be 'medium'
    case 'Introducer': return 'low';
    default: return 'medium';
  }
}
