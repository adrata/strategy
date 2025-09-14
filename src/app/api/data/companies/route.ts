import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { RevenueEstimationService } from "@/platform/services/revenue-estimation-service";

// Required for dynamic API functionality
export const dynamic = "force-dynamic";

// GET: Retrieve companies (matches Tauri get_companies command)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    const userId = searchParams.get("userId");
    
    if (!workspaceId || !userId) {
      return NextResponse.json({ error: "workspaceId and userId are required" }, { status: 400 });
    }

    console.log(
      `🏢 [COMPANIES API] Getting companies for workspace: ${workspaceId}, user: ${userId}`,
    );

    // Load real data for all workspaces
    console.log(`🏢 [COMPANIES API] Loading real data for workspace: ${workspaceId}`);

    await prisma.$connect();

    // Get companies from accounts table (represents companies in the schema) - SECURITY: Filter by user assignment
    const accounts = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: userId, // SECURITY: Only show accounts assigned to this user
        deletedAt: null
      },
      // Note: No include needed since we'll fetch people separately
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Also get companies from leads table that don't have accounts yet - FILTER BY WORKSPACE ONLY
    const leadsWithCompanies = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        // Remove assignedUserId filter to show all companies from leads
        company: {
          not: null,
        },
        deletedAt: null
      },
      select: {
        company: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
      },
      distinct: ["company"],
    });

    // Transform accounts to company format
    const companiesFromAccounts = accounts.map((account) => {
      // Build location string from city, state, country
      const locationParts = [account.city, account.state, account.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : "Unknown";
      
      // Generate revenue estimate if no actual revenue data
      let revenueDisplay = account.revenue ? `$${account.revenue.toLocaleString()}` : null;
      if (!account.revenue) {
        const estimate = RevenueEstimationService.estimateRevenue(
          account.industry,
          account.vertical,
          account.size
        );
        
        if (estimate) {
          const formattedEstimate = RevenueEstimationService.formatRevenueEstimate(estimate);
          const confidenceIcon = RevenueEstimationService.getConfidenceIndicator(estimate.confidence);
          revenueDisplay = `${formattedEstimate} ${confidenceIcon}`;
        }
      }
      
      return {
        id: account.id,
        name: account.name,
        industry: account.industry || "Unknown",
        employees: account.size || "Unknown Size", // Use actual size data
        revenue: revenueDisplay || "Unknown",
        website: account.website || "",
        location: location,
        leads_count: 0, // Would need to query leads table
        contacts_count: 0, // Will be updated below
        opportunities_count: 0, // Will be updated below
        contacts: [], // Will be updated below
      };
    });

    // Fetch people for each company
    const companiesWithPeople = await Promise.all(
      companiesFromAccounts.map(async (company) => {
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

        const opportunitiesCount = await prisma.opportunities.count({
          where: {
            companyId: company.id,
            deletedAt: null,
          },
        });

        return {
          ...company,
          contacts_count: people.length,
          opportunities_count: opportunitiesCount,
          contacts: people.map((contact) => ({
            name: contact.fullName,
            title: contact.jobTitle,
            email: contact.email,
            phone: contact.phone,
          })),
        };
      })
    );

    // Group leads by company that don't have accounts
    const companiesMap = new Map();
    leadsWithCompanies.forEach((lead) => {
      if (
        lead['company'] &&
        !companiesWithPeople.find((c) => c['name'] === lead.company)
      ) {
        if (!companiesMap.has(lead.company)) {
          companiesMap.set(lead.company, {
            id: `lead_company_${lead.company.toLowerCase().replace(/\s+/g, "_")}`,
            name: lead.company,
            industry: "Unknown",
            employees: 25, // Estimated
            revenue: "Unknown",
            website: "",
            location: "Unknown",
            leads_count: 0,
            contacts_count: 0,
            opportunities_count: 0,
            contacts: [],
          });
        }
        const companyData = companiesMap.get(lead.company);
        companyData.leads_count++;
        companyData.contacts.push({
          name: lead.fullName,
          title: lead.jobTitle,
          email: lead.email,
          phone: lead.phone,
        });
      }
    });

    const companiesFromLeads = Array.from(companiesMap.values());

    // Combine both sources
    const allCompanies = [...companiesWithPeople, ...companiesFromLeads];

    console.log(`✅ [COMPANIES API] Found ${allCompanies.length} companies`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      companies: allCompanies,
      count: allCompanies.length,
    });
  } catch (error) {
    console.error("❌ [COMPANIES API] Error getting companies:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get companies",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// POST: Add new company (matches Tauri add_company command)
export async function POST(request: NextRequest) {
  try {
    const { workspaceId, userId, companyData } = await request.json();

    console.log(
      `📝 [COMPANIES API] Adding company for workspace: ${workspaceId}, user: ${userId}`,
    );

    if (!companyData || !companyData.name) {
      return NextResponse.json(
        { success: false, error: "Company name is required" },
        { status: 400 },
      );
    }

    await prisma.$connect();

    // Create company as an Account record
    const newAccount = await prisma.companies.create({
      data: {
        id: `account-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: companyData.name,
        website: companyData.domain || companyData.website || null,
        industry: companyData.industry || null,
        revenue: companyData.revenue
          ? parseFloat((companyData.revenue || "").replace(/[^\d.]/g, ""))
          : null,
        city: companyData.location || null,
        notes: companyData.notes || null,
        workspaceId: workspaceId,
        assignedUserId: userId,
        updatedAt: new Date()
      },
    });

    console.log(
      `✅ [COMPANIES API] Company created: ${newAccount.name} (ID: ${newAccount.id})`,
    );

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      company: {
        id: newAccount.id,
        name: newAccount.name,
        industry: newAccount.industry,
        website: newAccount.website,
        revenue: newAccount.revenue?.toString(),
        location: newAccount.city,
        created_at: newAccount.createdAt?.toISOString() || new Date().toISOString(),
      },
      message: "Company created successfully",
    });
  } catch (error) {
    console.error("❌ [COMPANIES API] Error creating company:", error);
    await prisma.$disconnect();

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create company",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
