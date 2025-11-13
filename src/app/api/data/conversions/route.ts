import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { createEntityRecord } from '@/platform/services/entity/entityService';

// Required for static export compatibility
export const dynamic = 'force-dynamic';;

// GET: Retrieve partnerships or other related data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId") || "adrata";
    const userId = searchParams.get("userId") || "dan";
    const type = searchParams.get("type") || "partnerships";

    console.log(
      `🔄 [CONVERSIONS API] Getting ${type} for workspace: ${workspaceId}, user: ${userId}`,
    );

    await prisma.$connect();

    if (type === "partnerships") {
      // Get partnerships from accounts table since partnerships table doesn't exist
      const partnerships = await prisma.companies.findMany({
        where: {
          workspaceId: workspaceId,
          OR: [
            { accountType: 'partner', deletedAt: null },
            { accountType: 'channel_partner' },
            { accountType: 'strategic_partner' }
          ]
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit to 50 most recent
      });

      // Transform accounts to partnership format
      const partnershipData = partnerships.map(account => ({
        id: account.id,
        name: account.name,
        partnerType: account.accountType || 'Strategic Partner',
        contactName: account.primaryContact,
        contactTitle: null,
        contactEmail: account.email,
        contactPhone: account.phone,
        relationshipStatus: 'Active',
        relationshipStrength: 'Medium',
        commissionStructure: null,
        notes: account.notes,
        website: account.website,
        lastContactDate: null,
        nextContactDate: null,
        nextAction: null,
        workspaceId: account.workspaceId,
        createdBy: null,
        assignedTo: account.ownerId,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      }));return NextResponse.json({
        success: true,
        partnerships: partnershipData,
        count: partnershipData.length,
      });
    }return NextResponse.json(
      { success: false, error: "Invalid type parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("❌ [CONVERSIONS API] Error getting data:", error);return NextResponse.json(
      {
        success: false,
        error: "Failed to get data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST: Handle lead conversions (simplified)
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, action, data } = await request.json();

    console.log(
      `🔄 [CONVERSIONS API] Processing ${action} for workspace: ${workspaceId}, user: ${userId}`,
    );

    await prisma.$connect();

    switch (action) {
      case "convert_to_opportunity":
        return await convertLeadToOpportunity(workspaceId, userId, data);

      case "convert_prospect_to_lead":
        return await convertProspectToLead(workspaceId, userId, data);

      case "create_company_from_lead":
        return await createCompanyFromLead(workspaceId, userId, data);

      case "create_person_from_lead":
        return await createPersonFromLead(workspaceId, userId, data);

      default:return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("❌ [CONVERSIONS API] Error processing conversion:", error);return NextResponse.json(
      {
        success: false,
        error: "Failed to process conversion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Simplified helper functions
async function convertLeadToOpportunity(
  workspaceId: string,
  userId: string,
  data: any,
) {
  const { leadId, opportunityName } = data;

  if (!leadId) {return NextResponse.json(
      { success: false, error: "leadId is required" },
      { status: 400 },
    );
  }

  // Get the lead first
  const lead = await prisma.leads.findFirst({
    where: {
      id: leadId,
      workspaceId: workspaceId,
      deletedAt: null
    },
  });

  if (!lead) {return NextResponse.json(
      { success: false, error: "Lead not found" },
      { status: 404 },
    );
  }

  // Create entity record first for opportunity (2025 best practice)
  const entityRecord = await createEntityRecord({
    type: 'opportunity',
    workspaceId: workspaceId,
    metadata: {
      name: opportunityName || `Opportunity from ${lead.fullName}`,
      source: 'lead_conversion',
      leadId: leadId
    }
  });

  // Create simplified opportunity with entity_id
  const opportunity = await prisma.opportunities.create({
    data: {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      entity_id: entityRecord.id, // Link to entity record
      name: opportunityName || `Opportunity from ${lead.fullName}`,
      currency: "USD",
      description: `Converted from lead: ${lead.fullName}`,
      workspaceId: workspaceId,
      updatedAt: new Date()
    },
  });

  // Update lead status
  await prisma.leads.update({
    where: { id: leadId },
    data: {
      status: "converted",
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ [CONVERSIONS API] Converted lead to opportunity: ${opportunity.id}`,
  );return NextResponse.json({
    success: true,
    opportunity: {
      id: opportunity.id,
      name: opportunity.name,
      currency: opportunity.currency,
      lead_id: leadId,
      converted_at: opportunity.createdAt.toISOString(),
    },
    message: "Lead successfully converted to opportunity",
  });
}

async function createCompanyFromLead(
  workspaceId: string,
  userId: string,
  data: any,
) {
  const { leadId, companyName } = data;

  if (!leadId) {return NextResponse.json(
      { success: false, error: "leadId is required" },
      { status: 400 },
    );
  }

  // Get the lead
  const lead = await prisma.leads.findFirst({
    where: {
      id: leadId,
      workspaceId: workspaceId,
      deletedAt: null
    },
  });

  if (!lead) {return NextResponse.json(
      { success: false, error: "Lead not found" },
      { status: 404 },
    );
  }

  // Create simplified company
  const company = await prisma.companies.create({
    data: {
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: companyName || `Company for ${lead.fullName}`,
      description: `Company created from lead: ${lead.fullName}`,
      workspaceId: workspaceId,
      updatedAt: new Date()
    },
  });

  console.log(`✅ [CONVERSIONS API] Created company from lead: ${company.id}`);return NextResponse.json({
    success: true,
    company: {
      id: company.id,
      name: company.name,
      lead_id: leadId,
      created_at: company.createdAt?.toISOString() || new Date().toISOString(),
    },
    message: "Company successfully created from lead",
  });
}

async function createPersonFromLead(
  workspaceId: string,
  userId: string,
  data: any,
) {
  const { leadId, companyId } = data;

  if (!leadId) {return NextResponse.json(
      { success: false, error: "leadId is required" },
      { status: 400 },
    );
  }

  // Get the lead
  const lead = await prisma.leads.findFirst({
    where: {
      id: leadId,
      workspaceId: workspaceId,
      deletedAt: null
    },
  });

  if (!lead) {return NextResponse.json(
      { success: false, error: "Lead not found" },
      { status: 404 },
    );
  }

  // Create simplified contact (split fullName into firstName/lastName)
  const nameParts = lead.fullName.split(" ");
  const firstName = nameParts[0] || "";
  const lastName = nameParts.slice(1).join(" ") || "";

  const person = await prisma.people.create({
    data: {
      id: `per_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      fullName: lead.fullName,
      firstName: firstName,
      lastName: lastName,
      email: lead.workEmail || lead.personalEmail || "",
      phone: lead.phone || "",
      jobTitle: lead.jobTitle || "",
      companyId: companyId || null,
      workspaceId: workspaceId,
      updatedAt: new Date()
    },
  });

  // Update lead status
  await prisma.leads.update({
    where: { id: leadId },
    data: {
      status: "converted",
      updatedAt: new Date(),
    },
  });

  console.log(`✅ [CONVERSIONS API] Created person from lead: ${person.id}`);return NextResponse.json({
    success: true,
    person: {
      id: person.id,
      full_name: person.fullName,
      email: person.email,
      phone: person.phone,
      job_title: person.jobTitle,
      company_id: person.companyId,
      lead_id: leadId,
      created_at: person.createdAt?.toISOString() || new Date().toISOString(),
    },
    message: "Person successfully created from lead",
  });
}

async function convertProspectToLead(
  workspaceId: string,
  userId: string,
  data: any,
) {
  const { prospectId } = data;

  if (!prospectId) {return NextResponse.json(
      { success: false, error: "prospectId is required" },
      { status: 400 },
    );
  }

  // Get the prospect first
  const prospect = await prisma.prospects.findFirst({
    where: {
      id: prospectId,
      workspaceId: workspaceId,
      deletedAt: null
    },
  });

  if (!prospect) {return NextResponse.json(
      { success: false, error: "Prospect not found" },
      { status: 404 },
    );
  }

  // Create lead from prospect
  const lead = await prisma.leads.create({
    data: {
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      firstName: prospect.firstName,
      lastName: prospect.lastName,
      fullName: prospect.fullName,
      displayName: prospect.displayName,
      email: prospect.email,
      workEmail: prospect.workEmail,
      personalEmail: prospect.personalEmail,
      phone: prospect.phone,
      mobilePhone: prospect.mobilePhone,
      workPhone: prospect.workPhone,
      company: prospect.company,
      companyDomain: prospect.companyDomain,
      industry: prospect.industry,
      vertical: prospect.vertical,
      companySize: prospect.companySize,
      jobTitle: prospect.jobTitle,
      department: prospect.department,
      linkedinUrl: prospect.linkedinUrl,
      address: prospect.address,
      city: prospect.city,
      state: prospect.state,
      country: prospect.country,
      postalCode: prospect.postalCode,
      status: "new",
      priority: prospect.priority,
      source: prospect.source,
      estimatedValue: prospect.estimatedValue,
      currency: prospect.currency,
      notes: prospect.notes,
      description: prospect.description,
      tags: prospect.tags,
      customFields: prospect.customFields,
      preferredLanguage: prospect.preferredLanguage,
      timezone: prospect.timezone,
      workspaceId: workspaceId,
      ownerId: prospect.ownerId,
      createdBy: userId,
      updatedBy: userId,
      updatedAt: new Date()
    },
  });

  // Update prospect status
  await prisma.prospects.update({
    where: { id: prospectId },
    data: {
      status: "converted_to_lead",
      updatedAt: new Date(),
    },
  });

  console.log(
    `✅ [CONVERSIONS API] Converted prospect to lead: ${lead.id}`,
  );return NextResponse.json({
    success: true,
    lead: {
      id: lead.id,
      name: lead.fullName,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      job_title: lead.jobTitle,
      prospect_id: prospectId,
      converted_at: lead.createdAt.toISOString(),
    },
    message: "Prospect successfully converted to lead",
  });
}
