#!/usr/bin/env node

/**
 * 🔍 DEBUG TOP ENGINEERING PLUS COUNTS
 * 
 * Comprehensive debugging script to identify why the left panel counts
 * are showing incorrect values for the TOP Engineering Plus workspace.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 
        "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

// TOP Engineering Plus workspace ID
const TOP_WORKSPACE_ID = "01K5D01YCQJ9TJ7CT4DZDE79T1";

async function debugTopEngineeringPlusCounts() {
  console.log("🔍 DEBUGGING TOP ENGINEERING PLUS COUNTS");
  console.log("==========================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");
    console.log("");

    // Step 1: Verify workspace exists
    await verifyWorkspace();

    // Step 2: Get actual database counts
    await getActualDatabaseCounts();

    // Step 3: Test API endpoints
    await testAPIEndpoints();

    // Step 4: Check data quality
    await checkDataQuality();

    // Step 5: Generate debugging report
    await generateDebuggingReport();

  } catch (error) {
    console.error("❌ Debugging failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function verifyWorkspace() {
  console.log("🏢 Step 1: Verifying TOP Engineering Plus workspace...");
  
  const workspace = await prisma.workspaces.findUnique({
    where: { id: TOP_WORKSPACE_ID }
  });

  if (!workspace) {
    console.log("❌ TOP Engineering Plus workspace not found!");
    return;
  }

  console.log(`✅ Found workspace: ${workspace.name}`);
  console.log(`   ID: ${workspace.id}`);
  console.log(`   Slug: ${workspace.slug}`);
  console.log(`   Created: ${workspace.createdAt}`);
  console.log("");
}

async function getActualDatabaseCounts() {
  console.log("📊 Step 2: Getting actual database counts...");
  
  const [
    totalLeads,
    totalProspects,
    totalPeople,
    totalCompanies,
    totalOpportunities,
    totalClients,
    totalPartners
  ] = await Promise.all([
    prisma.leads.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.prospects.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.people.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.companies.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.opportunities.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.clients.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    }),
    prisma.partners.count({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null 
      }
    })
  ]);

  console.log("📈 Database Counts:");
  console.log(`   Leads: ${totalLeads.toLocaleString()}`);
  console.log(`   Prospects: ${totalProspects.toLocaleString()}`);
  console.log(`   People: ${totalPeople.toLocaleString()}`);
  console.log(`   Companies: ${totalCompanies.toLocaleString()}`);
  console.log(`   Opportunities: ${totalOpportunities.toLocaleString()}`);
  console.log(`   Clients: ${totalClients.toLocaleString()}`);
  console.log(`   Partners: ${totalPartners.toLocaleString()}`);
  console.log("");

  // Expected counts from documentation
  const expectedCounts = {
    leads: 3939,
    prospects: 587,
    people: 3172,
    companies: 476,
    opportunities: 0,
    clients: 0,
    partners: 0
  };

  console.log("🎯 Expected vs Actual:");
  console.log(`   Leads: ${totalLeads} (expected: ${expectedCounts.leads}) ${totalLeads === expectedCounts.leads ? '✅' : '❌'}`);
  console.log(`   Prospects: ${totalProspects} (expected: ${expectedCounts.prospects}) ${totalProspects === expectedCounts.prospects ? '✅' : '❌'}`);
  console.log(`   People: ${totalPeople} (expected: ${expectedCounts.people}) ${totalPeople === expectedCounts.people ? '✅' : '❌'}`);
  console.log(`   Companies: ${totalCompanies} (expected: ${expectedCounts.companies}) ${totalCompanies === expectedCounts.companies ? '✅' : '❌'}`);
  console.log("");
}

async function testAPIEndpoints() {
  console.log("🌐 Step 3: Testing API endpoints...");
  
  const testUserId = "test-user-id"; // Use a test user ID
  
  console.log("Testing unified data API...");
  console.log(`   Endpoint: /api/data/unified?type=dashboard&workspaceId=${TOP_WORKSPACE_ID}&userId=${testUserId}`);
  console.log("");
  
  // Note: This would require a running server to test
  console.log("⚠️  To test API endpoints, run the development server and check:");
  console.log(`   http://localhost:3000/api/data/unified?type=dashboard&workspaceId=${TOP_WORKSPACE_ID}&userId=${testUserId}`);
  console.log("");
}

async function checkDataQuality() {
  console.log("🔍 Step 4: Checking data quality...");
  
  // Check for data consistency issues
  const leadsWithEmail = await prisma.leads.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID,
      deletedAt: null,
      email: { not: null }
    }
  });

  const prospectsWithEmail = await prisma.prospects.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID,
      deletedAt: null,
      email: { not: null }
    }
  });

  const peopleWithEmail = await prisma.people.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID,
      deletedAt: null,
      email: { not: null }
    }
  });

  console.log("📧 Email Coverage:");
  console.log(`   Leads with email: ${leadsWithEmail}`);
  console.log(`   Prospects with email: ${prospectsWithEmail}`);
  console.log(`   People with email: ${peopleWithEmail}`);
  console.log("");

  // Check for workspace isolation issues
  const otherWorkspaceLeads = await prisma.leads.count({
    where: { 
      workspaceId: { not: TOP_WORKSPACE_ID },
      deletedAt: null 
    }
  });

  console.log("🔒 Workspace Isolation:");
  console.log(`   Leads in other workspaces: ${otherWorkspaceLeads}`);
  console.log("");
}

async function generateDebuggingReport() {
  console.log("📋 Step 5: Generating debugging report...");
  
  const report = {
    timestamp: new Date().toISOString(),
    workspaceId: TOP_WORKSPACE_ID,
    workspaceName: "TOP Engineering Plus",
    issues: [],
    recommendations: []
  };

  // Check for common issues
  const totalLeads = await prisma.leads.count({
    where: { 
      workspaceId: TOP_WORKSPACE_ID,
      deletedAt: null 
    }
  });

  if (totalLeads === 0) {
    report.issues.push("No leads found in workspace");
    report.recommendations.push("Check if data import was successful");
  }

  if (totalLeads !== 3939) {
    report.issues.push(`Lead count mismatch: found ${totalLeads}, expected 3939`);
    report.recommendations.push("Verify data import completed successfully");
  }

  console.log("📊 Debugging Report:");
  console.log(`   Timestamp: ${report.timestamp}`);
  console.log(`   Workspace: ${report.workspaceName} (${report.workspaceId})`);
  console.log(`   Issues found: ${report.issues.length}`);
  console.log(`   Recommendations: ${report.recommendations.length}`);
  console.log("");

  if (report.issues.length > 0) {
    console.log("❌ Issues identified:");
    report.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    console.log("");
  }

  if (report.recommendations.length > 0) {
    console.log("💡 Recommendations:");
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    console.log("");
  }

  console.log("✅ Debugging complete!");
  console.log("");
  console.log("🔧 Next steps:");
  console.log("   1. Check browser console for client-side errors");
  console.log("   2. Verify workspace ID is correctly passed to API calls");
  console.log("   3. Clear browser cache and test again");
  console.log("   4. Check if acquisitionData is loading correctly");
  console.log("");
}

// Run the debugging script
debugTopEngineeringPlusCounts().catch(console.error);

