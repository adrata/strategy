#!/usr/bin/env node

/**
 * 🔍 FIND WORKSPACE WITH 3000+ PEOPLE
 * Check all workspaces to find the one with 3000+ people
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

async function findWorkspaceWith3000People() {
  console.log("🔍 FINDING WORKSPACE WITH 3000+ PEOPLE");
  console.log("======================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");
    console.log("");

    // Get all workspaces
    console.log("🏢 Step 1: Getting all workspaces...");
    const workspaces = await prisma.workspaces.findMany({
      orderBy: { createdAt: 'desc' }
    });

    console.log(`✅ Found ${workspaces.length} workspaces`);
    console.log("");

    // Check people count for each workspace
    console.log("👥 Step 2: Checking people count for each workspace...");
    
    for (const workspace of workspaces) {
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      const leadsCount = await prisma.leads.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      const prospectsCount = await prisma.prospects.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      const companiesCount = await prisma.companies.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      });

      console.log(`🏢 ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   👥 People: ${peopleCount.toLocaleString()}`);
      console.log(`   🎯 Leads: ${leadsCount.toLocaleString()}`);
      console.log(`   🔍 Prospects: ${prospectsCount.toLocaleString()}`);
      console.log(`   🏢 Companies: ${companiesCount.toLocaleString()}`);
      console.log("");

      if (peopleCount >= 1000) {
        console.log(`🎯 FOUND WORKSPACE WITH ${peopleCount.toLocaleString()} PEOPLE!`);
        console.log(`   Workspace: ${workspace.name}`);
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Slug: ${workspace.slug}`);
        console.log("");
      }
    }

    // Check for any workspace with 3000+ people
    console.log("🎯 Step 3: Looking for workspace with 3000+ people...");
    const workspacesWithManyPeople = workspaces.filter(async (workspace) => {
      const count = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null
        }
      });
      return count >= 3000;
    });

    if (workspacesWithManyPeople.length === 0) {
      console.log("❌ No workspace found with 3000+ people");
      console.log("   This suggests the 3000+ people might be in a different workspace");
      console.log("   or the data might be cached/displayed incorrectly in the UI");
    }

  } catch (error) {
    console.error("❌ Error finding workspace:", error);
  } finally {
    await prisma.$disconnect();
  }
}

findWorkspaceWith3000People();
