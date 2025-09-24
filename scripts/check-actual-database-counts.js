#!/usr/bin/env node

/**
 * 🔍 CHECK ACTUAL DATABASE COUNTS
 * Compare database counts with what the API is returning
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

// TOP workspace ID
const TOP_WORKSPACE_ID = "01K1VBYXHD0J895XAN0HGFBKJP";

async function checkActualCounts() {
  console.log("🔍 CHECKING ACTUAL DATABASE COUNTS");
  console.log("==================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");
    console.log("");

    // Check workspace
    console.log("🏢 Step 1: Checking TOP workspace...");
    const workspace = await prisma.workspaces.findUnique({
      where: { id: TOP_WORKSPACE_ID }
    });

    if (!workspace) {
      console.log("❌ TOP workspace not found!");
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`   Slug: ${workspace.slug}`);
    console.log("");

    // Get actual counts from database
    console.log("📊 Step 2: Getting actual database counts...");
    
    const [
      totalPeople,
      totalLeads,
      totalProspects,
      totalCompanies,
      totalOpportunities,
      totalClients,
      totalPartners
    ] = await Promise.all([
      prisma.people.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null
        }
      }),
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
      }).catch(() => 0),
      prisma.partners.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0)
    ]);

    console.log("📈 ACTUAL DATABASE COUNTS:");
    console.log(`   👥 People: ${totalPeople.toLocaleString()}`);
    console.log(`   🎯 Leads: ${totalLeads.toLocaleString()}`);
    console.log(`   🔍 Prospects: ${totalProspects.toLocaleString()}`);
    console.log(`   🏢 Companies: ${totalCompanies.toLocaleString()}`);
    console.log(`   💼 Opportunities: ${totalOpportunities.toLocaleString()}`);
    console.log(`   🤝 Clients: ${totalClients.toLocaleString()}`);
    console.log(`   🤝 Partners: ${totalPartners.toLocaleString()}`);
    console.log("");

    // Check if there are any assigned users
    console.log("👤 Step 3: Checking user assignments...");
    const peopleWithAssignments = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const peopleWithoutAssignments = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });

    console.log(`   👥 People with assignments: ${peopleWithAssignments.toLocaleString()}`);
    console.log(`   👥 People without assignments: ${peopleWithoutAssignments.toLocaleString()}`);
    console.log("");

    // Check leads assignments
    const leadsWithAssignments = await prisma.leads.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const leadsWithoutAssignments = await prisma.leads.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });

    console.log(`   🎯 Leads with assignments: ${leadsWithAssignments.toLocaleString()}`);
    console.log(`   🎯 Leads without assignments: ${leadsWithoutAssignments.toLocaleString()}`);
    console.log("");

    // Check prospects assignments
    const prospectsWithAssignments = await prisma.prospects.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const prospectsWithoutAssignments = await prisma.prospects.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });

    console.log(`   🔍 Prospects with assignments: ${prospectsWithAssignments.toLocaleString()}`);
    console.log(`   🔍 Prospects without assignments: ${prospectsWithoutAssignments.toLocaleString()}`);
    console.log("");

    // Check for any users in the workspace
    console.log("👥 Step 4: Checking workspace users...");
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      include: { user: true }
    });

    console.log(`   👥 Workspace users: ${workspaceUsers.length}`);
    workspaceUsers.forEach(wu => {
      console.log(`     - ${wu.user.name} (${wu.user.email}) - Role: ${wu.role}`);
    });
    console.log("");

    // Summary
    console.log("📋 SUMMARY:");
    console.log("===========");
    console.log(`✅ Total People in Database: ${totalPeople.toLocaleString()}`);
    console.log(`✅ Total Leads in Database: ${totalLeads.toLocaleString()}`);
    console.log(`✅ Total Prospects in Database: ${totalProspects.toLocaleString()}`);
    console.log(`✅ Total Companies in Database: ${totalCompanies.toLocaleString()}`);
    console.log("");
    console.log("🔍 If the UI shows different numbers, the issue is likely:");
    console.log("   1. API filtering by assignedUserId");
    console.log("   2. Caching issues");
    console.log("   3. Demo mode vs production mode");
    console.log("   4. Workspace context mismatch");

  } catch (error) {
    console.error("❌ Error checking counts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualCounts();
