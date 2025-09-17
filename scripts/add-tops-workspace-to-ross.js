#!/usr/bin/env node

/**
 * 👑 ADD TOPS WORKSPACE TO ROSS USER
 * Adds TOPs workspace access to ross@adrata.com user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 
        "postgresql://neondb_owner:npg_lt0xGowzW5yV@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require&pgbouncer=true&connection_limit=20&pool_timeout=20&statement_timeout=30000"
    }
  }
});

// Workspace IDs
const ADRATA_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // Ross's current workspace (Adrata)
const TOPS_WORKSPACE_ID = '01K1VBYmf75hfu15llwwyekpgi'; // TOPs workspace (TOP Engineers Plus)

async function addTopsWorkspaceToRoss() {
  console.log("👑 ADDING TOPS WORKSPACE TO ROSS USER");
  console.log("=====================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");

    // Step 1: Find Ross user
    console.log("👤 Step 1: Finding Ross user...");
    const rossUser = await prisma.users.findFirst({
      where: { 
        OR: [
          { email: "ross@adrata.com" },
          { name: "Ross" }
        ]
      }
    });

    if (!rossUser) {
      console.log("❌ Ross user not found!");
      return;
    }

    console.log(`✅ Found Ross user: ${rossUser.name} (${rossUser.email})`);
    console.log(`   User ID: ${rossUser.id}`);
    console.log(`   Current Active Workspace: ${rossUser.activeWorkspaceId}`);
    console.log("");

    // Step 2: Check if TOPs workspace exists
    console.log("🏢 Step 2: Checking TOPs workspace...");
    const topsWorkspace = await prisma.workspaces.findUnique({
      where: { id: TOPS_WORKSPACE_ID }
    });

    if (!topsWorkspace) {
      console.log("❌ TOPs workspace not found!");
      return;
    }

    console.log(`✅ Found TOPs workspace: ${topsWorkspace.name} (${topsWorkspace.id})`);
    console.log(`   Slug: ${topsWorkspace.slug}`);
    console.log("");

    // Step 3: Check if Ross already has access to TOPs workspace
    console.log("🔍 Step 3: Checking existing workspace access...");
    const existingAccess = await prisma.workspace_users.findFirst({
      where: {
        userId: rossUser.id,
        workspaceId: TOPS_WORKSPACE_ID
      }
    });

    if (existingAccess) {
      console.log("✅ Ross already has access to TOPs workspace!");
      console.log(`   Role: ${existingAccess.role}`);
      console.log(`   Created: ${existingAccess.createdAt}`);
      console.log("");
    } else {
      // Step 4: Add Ross to TOPs workspace
      console.log("➕ Step 4: Adding Ross to TOPs workspace...");
      const workspaceAccess = await prisma.workspace_users.create({
        data: {
          userId: rossUser.id,
          workspaceId: TOPS_WORKSPACE_ID,
          role: 'admin', // Give Ross admin access to TOPs workspace
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Added Ross to TOPs workspace with admin role`);
      console.log(`   Access ID: ${workspaceAccess.id}`);
      console.log("");
    }

    // Step 5: Show Ross's current workspace access
    console.log("📋 Step 5: Ross's current workspace access:");
    const rossWorkspaces = await prisma.workspace_users.findMany({
      where: { userId: rossUser.id }
    });

    console.log("   Ross can access these workspaces:");
    for (const access of rossWorkspaces) {
      const workspace = await prisma.workspaces.findUnique({
        where: { id: access.workspaceId },
        select: { id: true, name: true, slug: true }
      });
      
      if (workspace) {
        const isActive = access.workspaceId === rossUser.activeWorkspaceId;
        console.log(`   • ${workspace.name} (${workspace.id}) - Role: ${access.role}${isActive ? ' [ACTIVE]' : ''}`);
      }
    }
    console.log("");

    // Step 6: Show workspace switching capability
    console.log("🔄 Step 6: Workspace switching capability:");
    console.log("   Ross can now switch between:");
    console.log("   • Adrata workspace (current active)");
    console.log("   • TOPs Engineering Talent Management workspace");
    console.log("");
    console.log("   To switch workspaces, Ross can:");
    console.log("   1. Use the workspace switcher in the UI");
    console.log("   2. Navigate to different workspace URLs");
    console.log("   3. Use the profile dropdown to switch contexts");
    console.log("");

    console.log("🎉 SUCCESS: Ross now has access to both workspaces!");
    console.log("   Ross can switch between Adrata and TOPs workspaces seamlessly.");

  } catch (error) {
    console.error("❌ Error adding TOPs workspace to Ross:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addTopsWorkspaceToRoss();
