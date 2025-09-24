#!/usr/bin/env node

/**
 * ⚡ QUICK COUNT CHECK
 * Fast check of the count discrepancy issue
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

async function quickCheck() {
  try {
    await prisma.$connect();
    
    console.log("⚡ QUICK COUNT CHECK");
    console.log("===================");
    
    // Get total counts
    const [totalPeople, totalLeads] = await Promise.all([
      prisma.people.count({
        where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
      }),
      prisma.leads.count({
        where: { workspaceId: TOP_WORKSPACE_ID, deletedAt: null }
      })
    ]);
    
    console.log(`📊 TOTAL COUNTS:`);
    console.log(`   👥 People: ${totalPeople.toLocaleString()}`);
    console.log(`   🎯 Leads: ${totalLeads.toLocaleString()}`);
    console.log("");
    
    // Check assigned vs unassigned
    const [assignedPeople, unassignedPeople] = await Promise.all([
      prisma.people.count({
        where: { 
          workspaceId: TOP_WORKSPACE_ID, 
          deletedAt: null,
          assignedUserId: { not: null }
        }
      }),
      prisma.people.count({
        where: { 
          workspaceId: TOP_WORKSPACE_ID, 
          deletedAt: null,
          assignedUserId: null
        }
      })
    ]);
    
    console.log(`🔍 ASSIGNMENT BREAKDOWN:`);
    console.log(`   👥 Assigned People: ${assignedPeople.toLocaleString()}`);
    console.log(`   👥 Unassigned People: ${unassignedPeople.toLocaleString()}`);
    console.log(`   👥 Total: ${(assignedPeople + unassignedPeople).toLocaleString()}`);
    console.log("");
    
    // Check if API filtering is the issue
    const apiPeopleCount = assignedPeople + unassignedPeople; // API shows both assigned and unassigned
    
    console.log(`🎯 ANALYSIS:`);
    console.log(`   Database Total: ${totalPeople.toLocaleString()}`);
    console.log(`   API Would Show: ${apiPeopleCount.toLocaleString()}`);
    
    if (apiPeopleCount < totalPeople) {
      console.log(`   ❌ ISSUE: ${(totalPeople - apiPeopleCount).toLocaleString()} people are filtered out`);
      console.log(`   🔍 This suggests some people have assignedUserId that doesn't match current user`);
    } else {
      console.log(`   ✅ No filtering issue - counts match`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickCheck();
