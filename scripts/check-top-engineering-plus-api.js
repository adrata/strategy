#!/usr/bin/env node

/**
 * 🔍 CHECK TOP ENGINEERING PLUS API RESPONSE
 * Test the API response for the correct workspace with 3000+ people
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
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = "01K5D01YCQJ9TJ7CT4DZDE79T1";

async function checkTopEngineeringPlusAPI() {
  console.log("🔍 CHECKING TOP ENGINEERING PLUS API RESPONSE");
  console.log("==============================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");
    console.log("");

    // Check workspace
    console.log("🏢 Step 1: Checking TOP Engineering Plus workspace...");
    const workspace = await prisma.workspaces.findUnique({
      where: { id: TOP_ENGINEERING_PLUS_WORKSPACE_ID }
    });

    if (!workspace) {
      console.log("❌ TOP Engineering Plus workspace not found!");
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
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.leads.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.prospects.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.companies.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.opportunities.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }),
      prisma.clients.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null
        }
      }).catch(() => 0),
      prisma.partners.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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

    // Check user assignments
    console.log("👤 Step 3: Checking user assignments...");
    const peopleWithAssignments = await prisma.people.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const peopleWithoutAssignments = await prisma.people.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const leadsWithoutAssignments = await prisma.leads.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
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
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      }
    });

    const prospectsWithoutAssignments = await prisma.prospects.count({
      where: {
        workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      }
    });

    console.log(`   🔍 Prospects with assignments: ${prospectsWithAssignments.toLocaleString()}`);
    console.log(`   🔍 Prospects without assignments: ${prospectsWithoutAssignments.toLocaleString()}`);
    console.log("");

    // Check workspace users
    console.log("👥 Step 4: Checking workspace users...");
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID }
    });

    console.log(`   👥 Workspace users: ${workspaceUsers.length}`);
    for (const wu of workspaceUsers) {
      const user = await prisma.users.findUnique({
        where: { id: wu.userId }
      });
      console.log(`     - ${user?.name || 'Unknown'} (${user?.email || 'Unknown'}) - Role: ${wu.role}`);
    }
    console.log("");

    // Test API simulation
    console.log("🧪 Step 5: Simulating API response...");
    
    // Simulate the API logic from loadDashboardData
    const userId = workspaceUsers[0]?.userId || 'default-user';
    
    const apiCounts = {
      leads: await prisma.leads.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      prospects: await prisma.prospects.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      people: await prisma.people.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      }),
      companies: await prisma.companies.count({
        where: {
          workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { assignedUserId: userId },
            { assignedUserId: null }
          ]
        }
      })
    };

    console.log("📊 API SIMULATION COUNTS:");
    console.log(`   👥 People: ${apiCounts.people.toLocaleString()}`);
    console.log(`   🎯 Leads: ${apiCounts.leads.toLocaleString()}`);
    console.log(`   🔍 Prospects: ${apiCounts.prospects.toLocaleString()}`);
    console.log(`   🏢 Companies: ${apiCounts.companies.toLocaleString()}`);
    console.log("");

    // Summary
    console.log("📋 SUMMARY:");
    console.log("===========");
    console.log(`✅ Total People in Database: ${totalPeople.toLocaleString()}`);
    console.log(`✅ API Simulation People: ${apiCounts.people.toLocaleString()}`);
    console.log(`✅ Total Leads in Database: ${totalLeads.toLocaleString()}`);
    console.log(`✅ API Simulation Leads: ${apiCounts.leads.toLocaleString()}`);
    console.log("");
    
    if (apiCounts.people < totalPeople) {
      console.log("🔍 ISSUE FOUND: API is filtering by assignedUserId");
      console.log("   The API only shows people assigned to the current user or unassigned");
      console.log("   This explains why you see fewer people in the UI than in the database");
    }

  } catch (error) {
    console.error("❌ Error checking counts:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTopEngineeringPlusAPI();
