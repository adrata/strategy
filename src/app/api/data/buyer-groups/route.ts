import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// Required for static export compatibility
export const dynamic = 'force-dynamic';;

// GET: Retrieve buyer groups or buyer group members
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate and authorize user
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

    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "groups"; // groups, members
    const buyerGroupId = searchParams.get("buyerGroupId");

    console.log(
      `👥 [BUYER GROUPS API] Getting ${type} for workspace: ${workspaceId}, user: ${userId}`,
    );

    await prisma.$connect();

    switch (type) {
      case "groups":
        return await getBuyerGroups(workspaceId, userId);

      case "members":
        if (!buyerGroupId) {
          return createErrorResponse(
            "buyerGroupId required for members",
            "BUYER_GROUP_ID_REQUIRED",
            400
          );
        }
        return await getBuyerGroupMembers(buyerGroupId);

      default:
        return createErrorResponse(
          "Invalid type parameter",
          "INVALID_TYPE_PARAMETER",
          400
        );
    }
  } catch (error) {
    console.error(
      "❌ [BUYER GROUPS API] Error getting buyer groups data:",
      error,
    );return createErrorResponse(
      "Failed to get buyer groups data",
      "BUYER_GROUPS_ERROR",
      500
    );
  }
}

// POST: Create buyer group or add member
export async function POST(request: NextRequest) {
  // 1. Authenticate and authorize user
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
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    try {
    const { workspaceId, userId, action, data } = await request.json();

    console.log(
      `👥 [BUYER GROUPS API] ${action} for workspace: ${workspaceId}, user: ${userId}`,
    );

    await prisma.$connect();

    switch (action) {
      case "create_group":
        return await createBuyerGroup(workspaceId, userId, data);

      case "add_member":
        return await addBuyerGroupMember(data);

      default:
        return createErrorResponse(
          "Invalid action",
          "INVALID_ACTION",
          400
        );
    }
  } catch (error) {
    console.error(
      "❌ [BUYER GROUPS API] Error processing buyer groups action:",
      error,
    );return createErrorResponse(
      "Failed to process buyer groups action",
      "BUYER_GROUPS_ACTION_ERROR",
      500
    );
  }
}

// Helper functions for buyer groups operations
async function getBuyerGroups(workspaceId: string, userId: string) {
  // Since BuyerGroup might not exist in schema, we'll simulate with accounts/companies
  // and track buyer groups via a special category or tags

  // Get accounts that represent buyer groups (companies with multiple contacts)
  const accountsWithMultipleContacts = await prisma.companies.findMany({
    where: {
      workspaceId: workspaceId,
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get people count for each company
  const companiesWithPeopleCount = await Promise.all(
    accountsWithMultipleContacts.map(async (company) => {
      const peopleCount = await prisma.people.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      });

      const opportunitiesCount = await prisma.opportunities.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      });

      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          email: true,
          phone: true,
        },
      });

      return {
        ...company,
        _count: {
          people: peopleCount,
          opportunities: opportunitiesCount,
        },
        people,
      };
    })
  );

  // Transform to buyer group format
  const buyerGroups = companiesWithPeopleCount.map((account) => ({
    id: account.id,
    name: `${account.name} Buying Committee`,
    description: `Buying committee for ${account.name}`,
    company_id: account.id,
    company_name: account.name,
    member_count: account._count.people,
    opportunities_count: account._count.opportunities,
    status: account._count.people >= 3 ? "active" : "forming",
    created_at: account.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: account.updatedAt?.toISOString() || new Date().toISOString(),
    members: account.people.map((contact) => ({
      id: contact.id,
      name: contact.fullName,
      title: contact.jobTitle,
      email: contact.email,
      phone: contact.phone,
      role: inferBuyingRole(contact.jobTitle),
      influence_level: calculateInfluenceLevel(contact.jobTitle),
    })),
  }));

  console.log(`✅ [BUYER GROUPS API] Found ${buyerGroups.length} buyer groups`);return createSuccessResponse(data, meta);
}

async function getBuyerGroupMembers(buyerGroupId: string) {
  // Get all contacts for the account (buyer group)
  const account = await prisma.companies.findFirst({
    where: { id: buyerGroupId , deletedAt: null},
  });

  if (!account) {return createErrorResponse(
      "Buyer group not found",
      "BUYER_GROUP_NOT_FOUND",
      404
    );
  }

  const people = await prisma.people.findMany({
    where: {
      companyId: buyerGroupId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      email: true,
      phone: true,
      linkedinUrl: true,
    },
  });

  const members = people.map((contact) => ({
    id: contact.id,
    buyer_group_id: buyerGroupId,
    lead_id: contact.id,
    name: contact.fullName,
    title: contact.jobTitle,
    email: contact.email,
    phone: contact.phone,
    linkedin_url: contact.linkedinUrl,
    role: inferBuyingRole(contact.jobTitle),
    influence_level: calculateInfluenceLevel(contact.jobTitle),
    engagement_score: Math.floor(Math.random() * 100), // Would be calculated from activities
    last_interaction: null, // Would need to track activities
    added_at: account.createdAt?.toISOString() || new Date().toISOString(),
  }));

  console.log(
    `✅ [BUYER GROUPS API] Retrieved ${members.length} members for buyer group: ${buyerGroupId}`,
  );return createSuccessResponse(data, meta);
}

async function createBuyerGroup(
  workspaceId: string,
  userId: string,
  data: any,
) {
  const { name, description, company_id } = data;

  if (!name || !company_id) {return createErrorResponse(
      "Name and company_id are required",
      "VALIDATION_ERROR",
      400
    );
  }

  // Check if account (company) exists
  const existingAccount = await prisma.companies.findFirst({
    where: {
      id: company_id,
      workspaceId: workspaceId,
      deletedAt: null
    },
  });

  if (!existingAccount) {return createErrorResponse(
      "Company not found",
      "COMPANY_NOT_FOUND",
      404
    );
  }

  // Update account to represent buyer group (add description or notes)
  const updatedAccount = await prisma.companies.update({
    where: { id: company_id },
    data: {
      description: description || `Buyer group: ${name}`,
      notes: `Buyer group created: ${name}. ${description || ""}`,
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ [BUYER GROUPS API] Created buyer group: ${name} for company: ${company_id}`,
  );return createSuccessResponse(data, meta);
}

/**
 * Check if email domain is likely from the same company as company domain
 * Allows legitimate cases where companies use different domains for email vs website
 * (e.g., portlandgeneral.com email vs pgn.com website)
 * But rejects clearly different companies (e.g., underline.cz vs underline.com)
 */
function isLikelySameCompany(emailDomain: string, companyDomain: string): boolean {
  if (!emailDomain || !companyDomain) return false;
  
  // Exact match (including TLD)
  if (emailDomain === companyDomain) return true;
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  // Same root domain = same company (e.g., mail.company.com === company.com)
  if (emailRoot === companyRoot) return true;
  
  // Check if email domain contains company name or vice versa
  // This catches cases like:
  // - portlandgeneral.com (email) vs pgn.com (website) - both contain "portland" or "general"
  // - ribboncommunications.com (email) vs rbbn.com (website) - email contains "ribbon"
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  // If one domain is clearly an abbreviation of the other, likely same company
  // e.g., "pgn" could be abbreviation of "portland general"
  // But we need to be careful - "underline" in both underline.com and underline.cz
  // are the same base name but different companies
  
  // Reject if same base name but different TLDs (e.g., underline.com vs underline.cz)
  // This is the critical case we need to catch
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    // Same base name, different TLD = likely different companies
    return false;
  }
  
  // If email domain is much longer and contains company name, likely same company
  // e.g., portlandgeneral.com contains "portland" and "general" which relate to "pgn"
  if (emailDomain.length > companyDomain.length * 1.5) {
    // Email domain is significantly longer - might be full name vs abbreviation
    // Allow this case as it's likely the same company using different domains
    return true;
  }
  
  // Default: if domains are different, be conservative and reject
  // But this is less strict than before - we'll allow manual override
  return false;
}

/**
 * Extract domain from email or URL
 */
function extractDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

async function addBuyerGroupMember(data: any) {
  const { buyer_group_id, lead_id, role, influence_level } = data;

  if (!buyer_group_id || !lead_id) {return createErrorResponse(
      "buyer_group_id and lead_id are required",
      "VALIDATION_ERROR",
      400
    );
  }

  // Find the lead/contact
  const contact = await prisma.people.findFirst({
    where: { id: lead_id , deletedAt: null},
    include: {
      company: {
        select: {
          id: true,
          name: true,
          website: true,
          domain: true
        }
      }
    }
  });

  if (!contact) {return createErrorResponse(
      "Contact/Lead not found",
      "CONTACT_NOT_FOUND",
      404
    );
  }

  // CRITICAL: Validate email domain is likely from same company before adding to buyer group
  // This prevents cross-company contamination (e.g., underline.cz vs underline.com)
  // But allows legitimate cases where companies use different domains for email vs website
  const personEmail = contact.email || contact.workEmail;
  const company = contact.company;
  
  if (personEmail && company && (company.website || company.domain)) {
    const emailDomain = extractDomain(personEmail.split('@')[1]);
    const companyDomain = extractDomain(company.website || company.domain);
    
    // Check for personal email domains (always reject these)
    const personalEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
    if (emailDomain && personalEmailDomains.includes(emailDomain)) {
      console.log(
        `❌ [BUYER GROUPS API] Personal email rejected: ${contact.fullName} (${emailDomain})`
      );
      return createErrorResponse(
        `Personal email domain detected: ${emailDomain}. This person cannot be added to this buyer group.`,
        "PERSONAL_EMAIL",
        400
      );
    }
    
    if (emailDomain && companyDomain && !isLikelySameCompany(emailDomain, companyDomain)) {
      console.log(
        `❌ [BUYER GROUPS API] Domain mismatch rejected: ${contact.fullName} (${emailDomain}) does not match company domain (${companyDomain})`
      );
      return createErrorResponse(
        `Email domain mismatch: ${emailDomain} does not match company domain ${companyDomain}. This person cannot be added to this buyer group.`,
        "DOMAIN_MISMATCH",
        400
      );
    }
  }

  // Add contact to the account (buyer group) if not already there
  const updatedContact = await prisma.people.update({
    where: { id: lead_id },
    data: {
      companyId: buyer_group_id,
      jobTitle: role || contact.jobTitle,
      notes: contact.notes
        ? `${contact.notes}\nBuying role: ${role}, Influence: ${influence_level}`
        : `Buying role: ${role}, Influence level: ${influence_level}`,
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ [BUYER GROUPS API] Added member to buyer group: ${buyer_group_id}`,
  );return createSuccessResponse(data, meta);
}

// Helper functions
function inferBuyingRole(jobTitle?: string | null): string {
  if (!jobTitle) return "user";

  const title = jobTitle.toLowerCase();

  if (
    title.includes("ceo") ||
    title.includes("president") ||
    title.includes("founder")
  ) {
    return "decision_maker";
  }
  if (
    title.includes("cto") ||
    title.includes("cio") ||
    title.includes("vp") ||
    title.includes("director")
  ) {
    return "influencer";
  }
  if (
    title.includes("manager") ||
    title.includes("lead") ||
    title.includes("head")
  ) {
    return "evaluator";
  }
  if (title.includes("procurement") || title.includes("purchasing")) {
    return "gatekeeper";
  }

  return "user";
}

function calculateInfluenceLevel(jobTitle?: string | null): number {
  if (!jobTitle) return 30;

  const title = jobTitle.toLowerCase();

  if (
    title.includes("ceo") ||
    title.includes("president") ||
    title.includes("founder")
  ) {
    return 100;
  }
  if (title.includes("cto") || title.includes("cio")) {
    return 90;
  }
  if (title.includes("vp") || title.includes("vice president")) {
    return 80;
  }
  if (title.includes("director")) {
    return 70;
  }
  if (title.includes("manager") || title.includes("head")) {
    return 60;
  }
  if (title.includes("lead") || title.includes("senior")) {
    return 50;
  }

  return 30;
}
