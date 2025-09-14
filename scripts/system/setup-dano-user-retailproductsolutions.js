#!/usr/bin/env node

/**
 * 🛍️ SETUP DANO USER FOR RETAIL PRODUCT SOLUTIONS WORKSPACE
 * Creates dano@retail-products.com user and retailproductsolutions workspace
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 
        "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require"
    }
  }
});

// Dano user configuration
const DANO_USER_CONFIG = {
  id: "dano-user-2025",
      email: "dano@retail-products.com",
  password: "DanoIsGreat01!",
  name: "Dano",
  firstName: "Dano",
  lastName: "",
  displayName: "Dano"
};

// Retail Product Solutions workspace configuration
const RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG = {
  id: "retailproductsolutions",
  name: "Retail Product Solutions",
  slug: "retailproductsolutions",
  description: "Retail Product Solutions workspace"
};

async function setupDanoUserAndWorkspace() {
  console.log("🛍️ SETTING UP DANO USER AND RETAIL PRODUCT SOLUTIONS WORKSPACE");
  console.log("================================================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");

    // Step 1: Create/update retailproductsolutions workspace
    console.log("🏢 Step 1: Creating/updating retailproductsolutions workspace...");
    const workspace = await prisma.workspace.upsert({
      where: { id: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.id },
      update: {
        name: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.name,
        slug: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.slug,
        description: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.description
      },
      create: {
        id: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.id,
        name: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.name,
        slug: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.slug,
        description: RETAILPRODUCTSOLUTIONS_WORKSPACE_CONFIG.description
      }
    });
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);

    // Step 2: Create/update dano user
    console.log("\n👤 Step 2: Creating/updating dano user...");
    const hashedPassword = await bcrypt.hash(DANO_USER_CONFIG.password, 10);
    
    // Check if user already exists
    let danoUser = await prisma.user.findUnique({
      where: { email: DANO_USER_CONFIG.email }
    });

    if (danoUser) {
      // Update existing user
      danoUser = await prisma.user.update({
        where: { email: DANO_USER_CONFIG.email },
        data: {
          name: DANO_USER_CONFIG.name,
          firstName: DANO_USER_CONFIG.firstName,
          lastName: DANO_USER_CONFIG.lastName,
          displayName: DANO_USER_CONFIG.displayName,
          password: hashedPassword,
          isActive: true
        }
      });
      console.log(`✅ Updated existing user: ${danoUser.name} (${danoUser.email})`);
    } else {
      // Create new user (without hardcoded ID)
      danoUser = await prisma.user.create({
        data: {
          email: DANO_USER_CONFIG.email,
          password: hashedPassword,
          name: DANO_USER_CONFIG.name,
          firstName: DANO_USER_CONFIG.firstName,
          lastName: DANO_USER_CONFIG.lastName,
          displayName: DANO_USER_CONFIG.displayName,
          isActive: true
        }
      });
      console.log(`✅ Created new user: ${danoUser.name} (${danoUser.email})`);
    }
    console.log(`✅ User: ${danoUser.name} (${danoUser.email})`);

    // Step 3: Create workspace membership
    console.log("\n🔗 Step 3: Creating workspace membership...");
    let membership = await prisma.workspaceMembership.findFirst({
      where: {
        userId: danoUser.id,
        workspaceId: workspace.id
      }
    });

    if (!membership) {
      membership = await prisma.workspaceMembership.create({
        data: {
          userId: danoUser.id,
          workspaceId: workspace.id,
          role: "admin",
          isActive: true
        }
      });
      console.log("✅ Created workspace membership");
    } else {
      console.log("✅ Workspace membership already exists");
    }

    // Step 4: Verify setup
    console.log("\n🔍 Step 4: Verifying setup...");
    const verifyUser = await prisma.user.findUnique({
      where: { email: DANO_USER_CONFIG.email },
      include: {
        workspaces: {
          include: {
            workspace: true
          }
        }
      }
    });

    if (verifyUser) {
      console.log(`✅ User verified: ${verifyUser.name} (${verifyUser.email})`);
      console.log(`✅ Workspaces: ${verifyUser.workspaces.map(w => w.workspace.name).join(', ')}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare(DANO_USER_CONFIG.password, verifyUser.password || '');
      console.log(`✅ Password verification: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    }

    console.log("\n🎉 Setup completed successfully!");
    console.log("🔐 Login credentials:");
    console.log(`   Username: dano`);
    console.log(`   Email: ${DANO_USER_CONFIG.email}`);
    console.log(`   Password: ${DANO_USER_CONFIG.password}`);
    console.log(`   Workspace: ${workspace.name}`);

  } catch (error) {
    console.error("❌ Error during setup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDanoUserAndWorkspace().catch(console.error);