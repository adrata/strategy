import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { getUnifiedAuthUser, type AuthUser } from '@/platform/api-auth';
import { withApiMiddleware } from '@/platform/api-middleware';

export const dynamic = "force-dynamic";
export const runtime = 'nodejs'; // Vercel compatibility

// Helper functions from the existing buyer-groups route
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

// GET: Retrieve buyer groups (public API endpoint)
export async function GET(request: NextRequest) {
  return withApiMiddleware(
    request,
    async (req, user) => {
      return await getBuyerGroupsHandler(req, user);
    },
    {
      requiredScope: undefined, // Optional scope check - allow if no scopes set (legacy)
      trackUsage: true
    }
  );
}

async function getBuyerGroupsHandler(request: NextRequest, authUser: AuthUser) {
  try {

      const workspaceId = authUser.workspaceId!;
      const userId = authUser.id;

      await prisma.$connect();

      const { searchParams } = new URL(request.url);
      const type = searchParams.get("type") || "groups";
      const buyerGroupId = searchParams.get("buyerGroupId");
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;

      console.log(
        `👥 [BUYER GROUPS API V1] Getting ${type} for workspace: ${workspaceId}, user: ${userId}`,
      );

      switch (type) {
        case "groups":
          return await getBuyerGroups(workspaceId, userId, skip, limit);

        case "members":
          if (!buyerGroupId) {
            return NextResponse.json(
              { error: "buyerGroupId required for members", code: "BUYER_GROUP_ID_REQUIRED" },
              { status: 400 }
            );
          }
          return await getBuyerGroupMembers(buyerGroupId);

        default:
          return NextResponse.json(
            { error: "Invalid type parameter", code: "INVALID_TYPE_PARAMETER" },
            { status: 400 }
          );
      }
    } catch (error) {
      console.error("❌ [BUYER GROUPS API V1] Error:", error);
      return NextResponse.json(
        { error: "Failed to get buyer groups data", code: "BUYER_GROUPS_ERROR" },
        { status: 500 }
      );
    }
}

async function getBuyerGroups(
  workspaceId: string,
  userId: string,
  skip: number,
  limit: number
) {
  // Get accounts that represent buyer groups (companies with multiple contacts)
  const accountsWithMultipleContacts = await prisma.companies.findMany({
    where: {
      workspaceId: workspaceId,
      deletedAt: null,
    },
    skip,
    take: limit,
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get total count for pagination
  const total = await prisma.companies.count({
    where: {
      workspaceId: workspaceId,
      deletedAt: null,
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

      // Opportunities may not exist in all schemas, handle gracefully
      let opportunitiesCount = 0;
      try {
        opportunitiesCount = await prisma.opportunities.count({
          where: {
            companyId: company.id,
            deletedAt: null,
          },
        });
      } catch (error) {
        // Opportunities table doesn't exist in streamlined schema, default to 0
        opportunitiesCount = 0;
      }

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

  return NextResponse.json({
    data: buyerGroups,
    pagination: {
      page: Math.floor(skip / limit) + 1,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

async function getBuyerGroupMembers(buyerGroupId: string) {
  // Get all contacts for the account (buyer group)
  const account = await prisma.companies.findFirst({
    where: { id: buyerGroupId, deletedAt: null },
  });

  if (!account) {
    return NextResponse.json(
      { error: "Buyer group not found", code: "BUYER_GROUP_NOT_FOUND" },
      { status: 404 }
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

  return NextResponse.json({
    data: members,
  });
}
