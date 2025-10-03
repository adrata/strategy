import { NextRequest, NextResponse } from "next/server";
import { prisma } from '@/platform/database/prisma-client';
import { RevenueEstimationService } from "@/platform/services/revenue-estimation-service";
import { createEntityRecord } from '@/platform/services/entity/entityService';


import { getSecureApiContext, createErrorResponse, createSuccessResponse } from '@/platform/services/secure-api-helper';
// Required for dynamic API functionality
export const dynamic = "force-dynamic";

// GET: Retrieve companies (matches Tauri get_companies command)
export async function GET(request: NextRequest) {
  const startTime = Date.now();
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100"); // Default to 100 companies
    const offset = parseInt(searchParams.get("offset") || "0");
    
    // Use authenticated user's workspace and ID
    const workspaceId = context.workspaceId;
    const userId = context.userId;

    console.log(
      `🏢 [COMPANIES API] Getting companies for workspace: ${workspaceId}, user: ${userId}`,
    );

    // Load real data for all workspaces
    console.log(`🏢 [COMPANIES API] Loading real data for workspace: ${workspaceId}`);

    await prisma.$connect();

    // Get companies from accounts table (represents companies in the schema) - WORKSPACE-LEVEL VISIBILITY
    // Add deduplication by company name to prevent duplicates, but get the most complete record
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
      // Add distinct to prevent duplicates by name, but order by most complete record first
      distinct: ['name'],
        orderBy: [
          { description: { sort: 'desc', nulls: 'last' } }, // Prefer records with descriptions
          { website: { sort: 'desc', nulls: 'last' } },   // Prefer records with websites
          { industry: { sort: 'desc', nulls: 'last' } },   // Prefer records with industry
          { size: { sort: 'desc', nulls: 'last' } },       // Prefer records with size
          { city: { sort: 'desc', nulls: 'last' } },       // Prefer records with location
          { rank: 'desc' },                                // Prefer higher ranks (more complete data)
          { updatedAt: 'desc' }                           // Most recently updated
        ],
      take: limit, // Limit results for performance
      skip: offset, // Pagination support
      select: {
        id: true,
        name: true,
        industry: true,
        size: true,
        revenue: true,
        website: true,
        city: true,
        state: true,
        country: true,
        address: true,
        description: true,
        customFields: true,
        updatedAt: true,
        rank: true,
        assignedUserId: true,
        lastAction: true,
        lastActionDate: true,
        nextAction: true,
        nextActionDate: true,
        actionStatus: true,
        // CoreSignal Enrichment Fields - Basic Information
        legalName: true,
        tradingName: true,
        localName: true,
        email: true,
        phone: true,
        fax: true,
        postalCode: true,
        // CoreSignal Enrichment Fields - Business Information
        sector: true,
        employeeCount: true,
        foundedYear: true,
        currency: true,
        // CoreSignal Enrichment Fields - Intelligence Overview
        linkedinUrl: true,
        linkedinFollowers: true,
        activeJobPostings: true,
        // CoreSignal Enrichment Fields - Industry Classification
        naicsCodes: true,
        sicCodes: true,
        // CoreSignal Enrichment Fields - Social Media
        facebookUrl: true,
        twitterUrl: true,
        instagramUrl: true,
        youtubeUrl: true,
        githubUrl: true,
        // CoreSignal Enrichment Fields - Business Intelligence
        technologiesUsed: true,
        competitors: true,
        tags: true,
        // CoreSignal Enrichment Fields - Company Status
        isPublic: true,
        stockSymbol: true,
        logoUrl: true,
        // CoreSignal Enrichment Fields - Domain and Website
        domain: true,
        // CoreSignal Enrichment Fields - Headquarters Location
        hqLocation: true,
        hqFullAddress: true,
        hqCity: true,
        hqState: true,
        hqStreet: true,
        hqZipcode: true,
        // CoreSignal Enrichment Fields - Social Media Followers
        twitterFollowers: true,
        owlerFollowers: true,
        // CoreSignal Enrichment Fields - Company Updates and Activity
        companyUpdates: true,
        numTechnologiesUsed: true,
        // CoreSignal Enrichment Fields - Enhanced Descriptions
        descriptionEnriched: true,
        descriptionMetadataRaw: true,
        // CoreSignal Enrichment Fields - Regional Information
        hqRegion: true,
        hqCountryIso2: true,
        hqCountryIso3: true
      },
      orderBy: [{ rank: 'asc' }, { updatedAt: 'desc' }], // Sort by rank first, then updatedAt
    });

    // Companies are already sorted by rank first, then updatedAt desc from the database query

    // Companies loaded successfully

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
      const location = locationParts.length > 0 ? locationParts.join(', ') : null;
      
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
        industry: company.industry || null,
        employees: company.size || null, // Use actual size data
        revenue: revenueDisplay || null,
        website: company.website || null,
        location: location,
        // Action data included
        lastAction: company.lastAction || null,
        lastActionDate: company.lastActionDate || null,
        nextAction: company.nextAction || null,
        nextActionDate: company.nextActionDate || null,
        actionStatus: company.actionStatus || null,
        // Company data included
        leads_count: 0, // Would need to query leads table
        people_count: 0, // Will be updated below
        opportunities_count: 0, // Will be updated below
        people: [], // Will be updated below
      };
    });

    // 🚀 ULTRA-FAST: Skip expensive people/opportunities lookups for maximum performance
    console.log(`⚡ [COMPANIES API] Skipping expensive people/opportunities lookups for maximum performance...`);
    
    // Build companies without expensive lookups
    const companiesWithPeople = companiesFromAccounts.map(company => {
      return {
        ...company,
        contacts_count: 0, // Skip expensive count
        opportunities_count: 0, // Skip expensive count
        contacts: [], // Skip expensive contacts
      };
    });

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

    // 🎯 USE UNIFIED RANKING ENGINE for consistent ranking with Speedrun
    console.log(`🏆 [COMPANIES API] Using UnifiedMasterRankingEngine for consistent ranking...`);
    console.log(`🏆 [COMPANIES API] WorkspaceId: ${workspaceId}, UserId: ${userId}`);
    
    try {
      // Import the UnifiedMasterRankingEngine
      console.log(`🏆 [COMPANIES API] Importing UnifiedMasterRankingEngine...`);
      const { UnifiedMasterRankingEngine } = await import('@/platform/services/unified-master-ranking');
      console.log(`🏆 [COMPANIES API] Successfully imported UnifiedMasterRankingEngine`);
      
      // Generate unified ranking
      console.log(`🏆 [COMPANIES API] Generating unified ranking...`);
      const unifiedRanking = await UnifiedMasterRankingEngine.generateMasterRanking(workspaceId, userId);
      console.log(`🏆 [COMPANIES API] Generated unified ranking with ${unifiedRanking.companies.length} companies`);
      
      // Create a map of company names to their unified ranks
      const companyRankMap = new Map();
      unifiedRanking.companies.forEach(company => {
        companyRankMap.set(company.name, company.masterRank);
      });
      
      console.log(`🏆 [COMPANIES API] Unified ranking companies (first 5):`);
      unifiedRanking.companies.slice(0, 5).forEach(company => {
        console.log(`  ${company.masterRank}. ${company.name}`);
      });
      
      console.log(`🏆 [COMPANIES API] Total companies in unified ranking: ${unifiedRanking.companies.length}`);
      console.log(`🏆 [COMPANIES API] Total people in unified ranking: ${unifiedRanking.people.length}`);
      
      console.log(`🏆 [COMPANIES API] All companies before ranking (first 5):`);
      allCompanies.slice(0, 5).forEach(company => {
        console.log(`  - ${company.name}`);
      });
      
      // Sort companies using unified ranking
      allCompanies.sort((a, b) => {
        const rankA = companyRankMap.get(a.name) || 999999; // High number for unranked
        const rankB = companyRankMap.get(b.name) || 999999;
        
        if (rankA !== rankB) {
          return rankA - rankB; // Lower rank number = higher priority
        }
        
        // Fallback to updatedAt if ranks are equal
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return a.name.localeCompare(b.name);
      });
      
      console.log(`🏆 [COMPANIES API] Companies after unified ranking (first 5):`);
      allCompanies.slice(0, 5).forEach(company => {
        const unifiedRank = companyRankMap.get(company.name) || 'unranked';
        console.log(`  ${unifiedRank}. ${company.name}`);
      });
      
      console.log(`✅ [COMPANIES API] Applied unified ranking to ${allCompanies.length} companies`);
      
    } catch (error) {
      console.error(`❌ [COMPANIES API] CRITICAL ERROR: Failed to use unified ranking, falling back to basic ranking:`, error);
      console.error(`❌ [COMPANIES API] Error stack:`, error.stack);
      console.error(`❌ [COMPANIES API] Error message:`, error.message);
      
      // Fallback to basic ranking
      allCompanies.sort((a, b) => {
        // First, sort by existing rank (if both have ranks)
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        }
        // Companies with ranks come first
        if (a.rank && !b.rank) {
          return -1;
        }
        if (!a.rank && b.rank) {
          return 1;
        }
        // For companies without ranks, sort by updatedAt descending, then by name alphabetically
        const dateA = new Date(a.updatedAt || 0).getTime();
        const dateB = new Date(b.updatedAt || 0).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        return a.name.localeCompare(b.name);
      });
      
      console.log(`⚠️ [COMPANIES API] Applied fallback basic ranking to ${allCompanies.length} companies`);
    }

    // Remove duplicates and re-assign proper sequential ranks
    const uniqueCompanies = [];
    const seenNames = new Set();
    
    allCompanies.forEach((company) => {
      if (!seenNames.has(company.name)) {
        seenNames.add(company.name);
        uniqueCompanies.push(company);
      }
    });
    
    // Companies are already sorted by existing rank, then by updatedAt and name
    
    // Assign sequential ranks, preserving existing ranks
    // Find the highest existing rank to continue from there
    const existingRanks = uniqueCompanies
      .filter(c => c.rank)
      .map(c => c.rank)
      .sort((a, b) => b - a); // Sort descending to get highest first
    
    let nextRank = existingRanks.length > 0 ? existingRanks[0] + 1 : 1;
    
    uniqueCompanies.forEach((company) => {
      if (!company.rank) {
        company.rank = nextRank;
        nextRank++;
      }
    });

    console.log(`✅ [COMPANIES API] Found ${uniqueCompanies.length} unique companies`);

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (duration > 5000) {
      console.log(`🐌 [SLOW API] GET companies took ${duration}ms - consider optimization`);
    } else {
      console.log(`⚡ [FAST API] GET companies completed in ${duration}ms`);
    }

    await prisma.$disconnect();

    return createSuccessResponse(data, meta);
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

    // Create entity record first (2025 best practice)
    const entityRecord = await createEntityRecord({
      type: 'company',
      workspaceId: workspaceId,
      metadata: {
        name: companyData.name,
        industry: companyData.industry,
        website: companyData.domain || companyData.website
      }
    });

    // Create company as an Account record with entity_id
    const newAccount = await prisma.companies.create({
      data: {
        id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        entity_id: entityRecord.id, // Link to entity record
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
      `✅ [COMPANIES API] Company created: ${newAccount.name} (ID: ${newAccount.id}, Entity ID: ${entityRecord.id})`,
    );

    await prisma.$disconnect();

    return createSuccessResponse(data, meta);
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
