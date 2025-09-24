#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE LEAD ASSIGNMENTS
 * 
 * This script will help identify who the other leads are assigned to
 * in the TOP Engineering Plus workspace, and why 762 leads are showing
 * instead of the full 3,939.
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

async function investigateLeadAssignments() {
  console.log("🔍 INVESTIGATING LEAD ASSIGNMENTS");
  console.log("==================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database");
    console.log("");

    // 1. Get total leads breakdown
    const [totalLeads, assignedLeads, unassignedLeads] = await Promise.all([
      prisma.leads.count({
        where: {
          workspaceId: TOP_WORKSPACE_ID,
          deletedAt: null
        }
      }),
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

    console.log("📊 LEAD ASSIGNMENT BREAKDOWN:");
    console.log(`   📈 Total Leads: ${totalLeads.toLocaleString()}`);
    console.log(`   👤 Assigned Leads: ${assignedLeads.toLocaleString()}`);
    console.log(`   👤 Unassigned Leads: ${unassignedLeads.toLocaleString()}`);
    console.log(`   ✅ Math Check: ${assignedLeads + unassignedLeads} = ${totalLeads}`);
    console.log("");

    // 2. Get leads by user assignment
    const leadAssignments = await prisma.leads.groupBy({
      by: ['assignedUserId'],
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: { not: null }
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log("👥 LEADS BY USER ASSIGNMENT:");
    console.log("=============================");
    
    // Get user details for each assignment
    for (const assignment of leadAssignments) {
      const user = await prisma.user.findUnique({
        where: { id: assignment.assignedUserId },
        select: { 
          id: true, 
          email: true, 
          name: true,
          createdAt: true
        }
      });

      if (user) {
        console.log(`👤 ${user.name || 'Unknown'} (${user.email})`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🆔 User ID: ${user.id}`);
        console.log(`   📅 Created: ${user.createdAt?.toISOString().split('T')[0] || 'Unknown'}`);
        console.log(`   🎯 Leads Assigned: ${assignment._count.id.toLocaleString()}`);
        console.log("");
      } else {
        console.log(`❌ User not found: ${assignment.assignedUserId}`);
        console.log(`   🎯 Leads Assigned: ${assignment._count.id.toLocaleString()}`);
        console.log("");
      }
    }

    // 3. Check for the 762 leads specifically
    console.log("🎯 ANALYZING 762 LEADS ISSUE:");
    console.log("=============================");
    
    // Find users with close to 762 leads
    const usersWithCloseCount = leadAssignments.filter(u => 
      u._count.id >= 760 && u._count.id <= 765
    );

    if (usersWithCloseCount.length > 0) {
      console.log("🔍 USERS WITH ~762 LEADS:");
      for (const user of usersWithCloseCount) {
        const userDetails = await prisma.user.findUnique({
          where: { id: user.assignedUserId },
          select: { email: true, name: true }
        });
        
        console.log(`   👤 ${userDetails?.name || 'Unknown'} (${userDetails?.email})`);
        console.log(`   🎯 Count: ${user._count.id}`);
        console.log(`   🆔 User ID: ${user.assignedUserId}`);
      }
    } else {
      console.log("❌ No user found with exactly 762 leads");
    }

    // 4. Check workspace users
    console.log("");
    console.log("👥 WORKSPACE USERS:");
    console.log("===================");
    
    const workspaceUsers = await prisma.workspaceUser.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    for (const workspaceUser of workspaceUsers) {
      console.log(`👤 ${workspaceUser.user.name || 'Unknown'} (${workspaceUser.user.email})`);
      console.log(`   🆔 User ID: ${workspaceUser.user.id}`);
      console.log(`   🏢 Workspace Role: ${workspaceUser.role}`);
      console.log(`   📅 Joined: ${workspaceUser.createdAt?.toISOString().split('T')[0] || 'Unknown'}`);
      console.log("");
    }

    // 5. Check if there's a specific user getting 762 leads
    console.log("🔍 CHECKING FOR 762 LEADS PATTERN:");
    console.log("===================================");
    
    // Check if any user has exactly 762 leads
    const userWith762Leads = leadAssignments.find(u => u._count.id === 762);
    if (userWith762Leads) {
      console.log("🎯 FOUND USER WITH EXACTLY 762 LEADS!");
      const user = await prisma.user.findUnique({
        where: { id: userWith762Leads.assignedUserId },
        select: { id: true, email: true, name: true }
      });
      
      console.log(`   👤 User: ${user?.name || 'Unknown'} (${user?.email})`);
      console.log(`   🆔 User ID: ${user?.id}`);
      console.log(`   🎯 Leads: ${userWith762Leads._count.id}`);
    } else {
      console.log("❌ No user found with exactly 762 leads");
      
      // Check for close numbers
      const closeNumbers = leadAssignments.filter(u => 
        u._count.id >= 760 && u._count.id <= 765
      );
      
      if (closeNumbers.length > 0) {
        console.log("🔍 CLOSE NUMBERS FOUND:");
        for (const assignment of closeNumbers) {
          const user = await prisma.user.findUnique({
            where: { id: assignment.assignedUserId },
            select: { email: true, name: true }
          });
          console.log(`   👤 ${user?.name || 'Unknown'} (${user?.email}): ${assignment._count.id} leads`);
        }
      }
    }

    // 6. Summary
    console.log("");
    console.log("📋 SUMMARY:");
    console.log("===========");
    console.log(`📊 Total Leads: ${totalLeads.toLocaleString()}`);
    console.log(`👤 Assigned Leads: ${assignedLeads.toLocaleString()}`);
    console.log(`👤 Unassigned Leads: ${unassignedLeads.toLocaleString()}`);
    console.log(`👥 Users with Assigned Leads: ${leadAssignments.length}`);
    console.log(`👥 Total Workspace Users: ${workspaceUsers.length}`);
    
    if (userWith762Leads) {
      console.log(`🎯 User with 762 leads: ${userWith762Leads.assignedUserId}`);
    } else {
      console.log(`❌ No user found with exactly 762 leads`);
    }

  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateLeadAssignments();

