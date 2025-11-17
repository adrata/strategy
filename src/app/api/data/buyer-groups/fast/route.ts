import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { getRoleLabel } from '@/platform/constants/buyer-group-roles';

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
    
    // 🔧 FALLBACK: If no people with buyer group roles found, return ALL people for the company
    // This ensures buyer groups tab works even when roles haven't been assigned yet (like leads)
    let peopleToUse = validatedPeople;
    if (validatedPeople.length === 0) {
      console.log(`🔄 [FAST BUYER GROUPS] No people with buyer group roles found, fetching ALL people for company...`);
      
      const allCompanyPeople = await prisma.people.findMany({
        where: {
          companyId: companyId,
          workspaceId: workspaceId,
          deletedAt: null
        },
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
          buyerGroupStatus: true,
          status: true,
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
      
      console.log(`🔍 [FAST BUYER GROUPS] Found ${allCompanyPeople.length} total people for company (no buyer group filter)`);
      
      if (allCompanyPeople.length > 0) {
        console.log(`🔄 [FAST BUYER GROUPS] Using all company people and assigning roles on the fly`);
        peopleToUse = allCompanyPeople;
      } else {
        console.log(`❌ [FAST BUYER GROUPS] No people found for company at all`);
      }
    }

    // Transform to buyer group format
    const buyerGroupMembers = peopleToUse.map(person => {
      const jobTitle = person.jobTitle || '';
      
      // Use stored role or infer from job title
      const customFields = person.customFields as any;
      const storedRole = customFields?.buyerGroupRole || person.buyerGroupRole;
      const inferredRole = getBuyerGroupRole(jobTitle);
      const rawRole = storedRole || inferredRole;
      
      // Normalize role to display label format (handles both DB values like 'decision' and display labels like 'Decision Maker')
      const buyerRole = getRoleLabel(rawRole);
      
      // Extract buyer group status from direct field or customFields
      const buyerGroupStatus = person.buyerGroupStatus || customFields?.buyerGroupStatus || 'unknown';
      
      return {
        id: person.id,
        name: person.fullName || `${person.firstName} ${person.lastName}`,
        title: jobTitle,
        email: person.email || '',
        phone: person.phone || '',
        linkedinUrl: person.linkedinUrl || '',
        role: buyerRole, // Now always in display label format (e.g., 'Decision Maker', 'Champion', 'Stakeholder')
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
    const peopleWithRole = peopleToUse.filter(p => p.buyerGroupRole);
    const peopleWithMember = peopleToUse.filter(p => p.isBuyerGroupMember);
    const peopleWithInStatus = peopleToUse.filter(p => {
      const customFields = p.customFields as Record<string, any> || {};
      return customFields.buyerGroupStatus === 'in';
    });
    
    // Status breakdown for diagnostic logging
    const statusBreakdown = peopleToUse.reduce((acc, p) => {
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
// Handles both display labels ('Decision Maker') and DB values ('decision')
function getInfluenceLevel(role: string): string {
  if (!role) return 'medium';
  
  const normalizedRole = role.toLowerCase().trim();
  
  // Handle display labels
  if (normalizedRole === 'decision maker' || normalizedRole === 'decision') {
    return 'high';
  }
  if (normalizedRole === 'champion') {
    return 'high'; // FIXED: was 'medium', should be 'high'
  }
  if (normalizedRole === 'blocker') {
    return 'medium';
  }
  if (normalizedRole === 'stakeholder') {
    return 'medium'; // FIXED: was 'low', should be 'medium'
  }
  if (normalizedRole === 'introducer') {
    return 'low';
  }
  
  // Default fallback
  return 'medium';
}
