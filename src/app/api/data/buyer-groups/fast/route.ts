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
    const context = await getSecureApiContext(request);
    const workspaceId = context.workspaceId;
    const userId = context.userId;
    
    if (!companyId || !workspaceId || !userId) {
      return createErrorResponse('Company ID, workspace, and user are required', 'VALIDATION_ERROR', 400);
    }

    console.log(`🚀 [FAST BUYER GROUPS] Loading buyer group for company: ${companyId}`);

    // First, get the company name to search by email domain
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
      select: { name: true }
    });
    
    // Extract email domain from company name (e.g., "Southern California Edison (SCE)" -> "sce.com")
    const companyName = company?.name || '';
    let emailDomain = '';
    
    if (companyName.toLowerCase().includes('southern california edison')) {
      emailDomain = 'sce.com';
    } else {
      // Generic domain extraction
      emailDomain = companyName.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        + '.com';
    }
    
    console.log(`🚀 [FAST BUYER GROUPS] Searching for people with companyId: ${companyId} or email domain: ${emailDomain}`);

    // Single optimized query to get people IN the buyer group for the company
    const people = await prisma.people.findMany({
      where: {
        AND: [
          {
            OR: [
              { companyId: companyId },
              { 
                email: {
                  endsWith: emailDomain
                }
              }
            ]
          },
          {
            workspaceId: workspaceId,
            deletedAt: null
          },
          // Filter for people IN the buyer group
          {
            OR: [
              // People with buyerGroupStatus: 'in'
              {
                customFields: {
                  path: ['buyerGroupStatus'],
                  equals: 'in'
                }
              },
              // People with buyer group roles from today's enrichment (Group 3)
              {
                AND: [
                  { buyerGroupRole: { not: null } },
                  { createdAt: { gte: new Date('2025-09-30T00:00:00.000Z') } }
                ]
              }
            ]
          }
        ]
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

    // Transform to buyer group format
    const buyerGroupMembers = people.map(person => {
      const jobTitle = person.jobTitle || '';
      
      // Use stored role or infer from job title
      const customFields = person.customFields as any;
      const storedRole = customFields?.buyerGroupRole || person.buyerGroupRole;
      const buyerRole = storedRole || getBuyerGroupRole(jobTitle);
      
      return {
        id: person.id,
        name: person.fullName || `${person.firstName} ${person.lastName}`,
        title: jobTitle,
        email: person.email || '',
        phone: person.phone || '',
        linkedinUrl: person.linkedinUrl || '',
        role: buyerRole,
        influence: getInfluenceLevel(buyerRole),
        isPrimary: false, // Will be set by caller if needed
        company: companyId,
        createdAt: person.createdAt,
        updatedAt: person.updatedAt
      };
    });

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`⚡ [FAST BUYER GROUPS] Loaded ${buyerGroupMembers.length} members in ${duration}ms`);
    console.log(`🔍 [FAST BUYER GROUPS] Filtering: Only people IN buyer group (buyerGroupStatus: 'in' or today's enrichment)`);
    
    // Debug: Show breakdown of people found
    const peopleWithInStatus = people.filter(p => {
      const customFields = p.customFields as Record<string, any> || {};
      return customFields.buyerGroupStatus === 'in';
    });
    const peopleFromToday = people.filter(p => 
      p.createdAt && p.createdAt.toISOString().split('T')[0] === '2025-09-30' && p.buyerGroupRole
    );
    
    console.log(`📊 [FAST BUYER GROUPS] Breakdown:`);
    console.log(`   People with 'in' status: ${peopleWithInStatus.length}`);
    console.log(`   People from today's enrichment: ${peopleFromToday.length}`);
    console.log(`   Total in buyer group: ${buyerGroupMembers.length}`);

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
function getInfluenceLevel(role: string): string {
  switch (role) {
    case 'Decision Maker': return 'high';
    case 'Champion': return 'medium';
    case 'Blocker': return 'medium';
    case 'Stakeholder': return 'low';
    default: return 'low';
  }
}
