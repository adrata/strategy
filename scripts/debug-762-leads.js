#!/usr/bin/env node

/**
 * 🔍 DEBUG 762 LEADS ISSUE
 * 
 * The 762 leads count is likely coming from the user assignment filtering
 * in the API route. This script will help identify the exact cause.
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

async function debug762Leads() {
  console.log("🔍 DEBUGGING 762 LEADS ISSUE");
  console.log("=============================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database");
    console.log("");

    // 1. Get total leads in workspace (should be 3,939)
    const totalLeads = await prisma.leads.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null
      }
    });
    
    console.log(`📊 TOTAL LEADS IN WORKSPACE: ${totalLeads.toLocaleString()}`);
    console.log("");

    // 2. Check leads by assignment status
    const [assignedLeads, unassignedLeads] = await Promise.all([
      prisma.leads.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          assignedUserId: { not: null }
        }
      }),
      prisma.leads.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          assignedUserId: null
        }
      })
    ]);

    console.log(`🔍 ASSIGNMENT BREAKDOWN:`);
    console.log(`   👤 Assigned Leads: ${assignedLeads.toLocaleString()}`);
    console.log(`   👤 Unassigned Leads: ${unassignedLeads.toLocaleString()}`);
    console.log(`   👤 Total: ${(assignedLeads + unassignedLeads).toLocaleString()}`);
    console.log("");

    // 3. Check if there's a specific user getting 762 leads
    const userAssignments = await prisma.leads.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: { id: true }
    });

    console.log(`👥 LEADS BY USER ASSIGNMENT:`);
    userAssignments.forEach(assignment => {
      console.log(`   User ${assignment.assignedUserId}: ${assignment._count.id.toLocaleString()} leads`);
    });
    console.log("");

    // 4. Check for the specific 762 count
    const userWith762Leads = userAssignments.find(u => u._count.id === 762);
    if (userWith762Leads) {
      console.log(`🎯 FOUND THE 762 LEADS!`);
      console.log(`   User ID: ${userWith762Leads.assignedUserId}`);
      console.log(`   Count: ${userWith762Leads._count.id}`);
      console.log("");

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userWith762Leads.assignedUserId },
        select: { id: true, email: true, name: true }
      });
      
      if (user) {
        console.log(`👤 USER DETAILS:`);
        console.log(`   Name: ${user.name || 'Unknown'}`);
        console.log(`   Email: ${user.email || 'Unknown'}`);
        console.log(`   ID: ${user.id}`);
      }
    } else {
      console.log(`❌ No user found with exactly 762 leads`);
      console.log(`   Checking for close numbers...`);
      
      const closeNumbers = userAssignments.filter(u => 
        u._count.id >= 760 && u._count.id <= 765
      );
      
      if (closeNumbers.length > 0) {
        console.log(`🔍 CLOSE NUMBERS FOUND:`);
        closeNumbers.forEach(assignment => {
          console.log(`   User ${assignment.assignedUserId}: ${assignment._count.id} leads`);
        });
      }
    }

    console.log("");
    console.log("🔍 API ROUTE SIMULATION:");
    console.log("=========================");
    
    // 5. Simulate the API route logic for different users
    const allUsers = await prisma.user.findMany({
      where: {
        workspaces: {
          some: {
            workspaceId: TOP_WORKSPACE_ID
          }
        }
      },
      select: { id: true, email: true, name: true }
    });

    console.log(`👥 USERS IN WORKSPACE: ${allUsers.length}`);
    console.log("");

    for (const user of allUsers.slice(0, 5)) { // Check first 5 users
      const apiCount = await prisma.leads.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null,
          OR: [
            { assignedUserId: user.id },
            { assignedUserId: null }
          ]
        }
      });

      console.log(`👤 User: ${user.name || user.email} (${user.id})`);
      console.log(`   API Count: ${apiCount.toLocaleString()}`);
      
      if (apiCount === 762) {
        console.log(`   🎯 THIS IS THE 762 USER!`);
      }
      console.log("");
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug762Leads();

