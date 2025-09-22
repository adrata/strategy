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

    // Get companies from accounts table (represents companies in the schema) - WORKSPACE-LEVEL VISIBILITY
    const accounts = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        // Modified: Show all companies in workspace, not just assigned ones
        OR: [
          { assignedUserId: userId }, // User's assigned companies
          { assignedUserId: null }    // Unassigned companies in workspace
        ],
        deletedAt: null
      },
      // Note: No include needed since we'll fetch people separately
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Sort companies to put 5Bars Services first
    accounts.sort((a, b) => {
      const aIs5Bars = a.name.toLowerCase().includes('5bars') || a.name.toLowerCase().includes('5 bars');
      const bIs5Bars = b.name.toLowerCase().includes('5bars') || b.name.toLowerCase().includes('5 bars');
      
      if (aIs5Bars && !bIs5Bars) return -1;
      if (!aIs5Bars && bIs5Bars) return 1;
      
      // If both or neither are 5Bars, maintain original order (by updatedAt desc)
      return 0;
    });

    // Assign ranks to companies (1-based indexing)
    for (let i = 0; i < accounts.length; i++) {
      accounts[i].rank = i + 1;
    }

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

    // Transform companies to company format
    const companiesFromAccounts = accounts.map((company) => {
      // Build location string from city, state, country
      const locationParts = [company.city, company.state, company.country].filter(Boolean);
      const location = locationParts.length > 0 ? locationParts.join(', ') : "Unknown";
      
      // Generate revenue estimate if no actual revenue data
      let revenueDisplay = company.revenue ? `$${company.revenue.toLocaleString()}` : null;
      if (!company.revenue) {
        const estimate = RevenueEstimationService.estimateRevenue(
          company.industry,
          company.vertical,
          company.size
        );
        
        if (estimate) {
          const formattedEstimate = RevenueEstimationService.formatRevenueEstimate(estimate);
          const confidenceIcon = RevenueEstimationService.getConfidenceIndicator(estimate.confidence);
          revenueDisplay = `${formattedEstimate} ${confidenceIcon}`;
        }
      }
      
      return {
        id: company.id,
        name: company.name,
        industry: company.industry || "Unknown",
        employees: company.size || "Unknown Size", // Use actual size data
        revenue: revenueDisplay || "Unknown",
        website: company.website || "",
        location: location,
        rank: company.rank || 0, // Include the assigned rank
        leads_count: 0, // Would need to query leads table
        people_count: 0, // Will be updated below
        opportunities_count: 0, // Will be updated below
        people: [], // Will be updated below
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

    // Sort all companies by rank to ensure proper order
    allCompanies.sort((a, b) => {
      // Companies with ranks (from accounts) come first, sorted by rank
      if (a.rank && b.rank) {
        return a.rank - b.rank;
      }
      // Companies with ranks come before those without
      if (a.rank && !b.rank) {
        return -1;
      }
      if (!a.rank && b.rank) {
        return 1;
      }
      // For companies without ranks (from leads), sort alphabetically by name
      return a.name.localeCompare(b.name);
    });

    // Remove duplicates and re-assign proper sequential ranks
    const uniqueCompanies = [];
    const seenNames = new Set();
    
    allCompanies.forEach((company) => {
      if (!seenNames.has(company.name)) {
        seenNames.add(company.name);
        uniqueCompanies.push(company);
      }
    });
    
    // Sort by original rank, then assign sequential ranks starting from 1
    uniqueCompanies.sort((a, b) => {
      const rankA = a.rank || 999999; // Put unranked companies at the end
      const rankB = b.rank || 999999;
      return rankA - rankB;
    });
    
    // Assign sequential ranks starting from 1
    uniqueCompanies.forEach((company, index) => {
      company.rank = index + 1;
    });

    console.log(`✅ [COMPANIES API] Found ${uniqueCompanies.length} unique companies`);

    await prisma.$disconnect();

    return NextResponse.json({
      success: true,
      companies: uniqueCompanies,
      count: uniqueCompanies.length,
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
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
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
