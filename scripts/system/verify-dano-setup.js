#!/usr/bin/env node

/**
 * 🔍 VERIFY DANO USER SETUP
 * Checks if dano user and workspace are properly configured
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

async function verifyDanoSetup() {
  console.log("🔍 VERIFYING DANO USER SETUP");
  console.log("============================");

  try {
    await prisma.$connect();
    console.log("✅ Connected to database");

    // Check user
    console.log("\n👤 Checking dano user...");
    const user = await prisma.user.findUnique({
      where: { email: "dano@retail-products.com" }
    });

    if (user) {
      console.log(`✅ User found: ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
    } else {
      console.log("❌ User not found");
      return;
    }

    // Check workspace
    console.log("\n🏢 Checking retailproductsolutions workspace...");
    const workspace = await prisma.workspace.findUnique({
      where: { id: "retailproductsolutions" }
    });

    if (workspace) {
      console.log(`✅ Workspace found: ${workspace.name} (${workspace.id})`);
    } else {
      console.log("❌ Workspace not found");
      return;
    }

    // Check membership
    console.log("\n🔗 Checking workspace membership...");
    const membership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspace.id
      }
    });

    if (membership) {
      console.log(`✅ Membership found: ${membership.role}, Active: ${membership.isActive}`);
    } else {
      console.log("❌ No membership found");
    }

    // Check user with workspaces included
    console.log("\n🔗 Checking user with workspaces...");
    const userWithWorkspaces = await prisma.user.findUnique({
      where: { email: "dano@retail-products.com" },
      include: {
        workspaceMemberships: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (userWithWorkspaces?.workspaceMemberships) {
      console.log(`✅ User workspaces: ${userWithWorkspaces.workspaceMemberships.length} found`);
      userWithWorkspaces.workspaceMemberships.forEach(ws => {
        console.log(`   - ${ws.workspace.name} (${ws.workspace.id}) - Role: ${ws.role}`);
      });
    }

    console.log("\n✅ Verification complete!");

  } catch (error) {
    console.error("❌ Error during verification:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDanoSetup().catch(console.error);