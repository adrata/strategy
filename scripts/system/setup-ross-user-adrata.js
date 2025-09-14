#!/usr/bin/env node

/**
 * 👑 SETUP ROSS USER FOR ADRATA WORKSPACE
 * Creates ross@adrata.com user and ensures access to adrata workspace
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

// Ross user configuration
const ROSS_USER_CONFIG = {
  email: "ross@adrata.com",
  password: "rosspass",
  name: "Ross",
  firstName: "Ross",
  lastName: "Sylvester",
  displayName: "Ross Sylvester"
};

// Adrata workspace configuration
const ADRATA_WORKSPACE_CONFIG = {
  id: "adrata",
  name: "Adrata",
  slug: "adrata",
  description: "Adrata Engineering workspace"
};

async function setupRossUserAndWorkspace() {
  console.log("👑 SETTING UP ROSS USER FOR ADRATA WORKSPACE");
  console.log("==============================================");
  console.log("");

  try {
    await prisma.$connect();
    console.log("✅ Connected to production database");

    // Step 1: Create/update adrata workspace
    console.log("🏢 Step 1: Creating/updating adrata workspace...");
    const workspace = await prisma.workspaces.upsert({
      where: { id: ADRATA_WORKSPACE_CONFIG.id },
      update: {
        name: ADRATA_WORKSPACE_CONFIG.name,
        slug: ADRATA_WORKSPACE_CONFIG.slug,
        description: ADRATA_WORKSPACE_CONFIG.description,
        updatedAt: new Date()
      },
      create: {
        id: ADRATA_WORKSPACE_CONFIG.id,
        name: ADRATA_WORKSPACE_CONFIG.name,
        slug: ADRATA_WORKSPACE_CONFIG.slug,
        description: ADRATA_WORKSPACE_CONFIG.description,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Workspace: ${workspace.name} (${workspace.id})`);

    // Step 2: Create/update ross user
    console.log("\n👤 Step 2: Creating/updating ross user...");
    const hashedPassword = await bcrypt.hash(ROSS_USER_CONFIG.password, 10);
    
    // Check if user already exists
    let rossUser = await prisma.users.findFirst({
      where: { 
        OR: [
          { email: ROSS_USER_CONFIG.email },
          { name: "Ross" }
        ]
      }
    });

    if (rossUser) {
      // Update existing user
      rossUser = await prisma.users.update({
        where: { id: rossUser.id },
        data: {
          email: ROSS_USER_CONFIG.email,
          name: ROSS_USER_CONFIG.name,
          firstName: ROSS_USER_CONFIG.firstName,
          lastName: ROSS_USER_CONFIG.lastName,
          displayName: ROSS_USER_CONFIG.displayName,
          password: hashedPassword,
          isActive: true,
          activeWorkspaceId: workspace.id,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated existing user: ${rossUser.name} (${rossUser.email})`);
    } else {
      // Create new user
      rossUser = await prisma.users.create({
        data: {
          email: ROSS_USER_CONFIG.email,
          password: hashedPassword,
          name: ROSS_USER_CONFIG.name,
          firstName: ROSS_USER_CONFIG.firstName,
          lastName: ROSS_USER_CONFIG.lastName,
          displayName: ROSS_USER_CONFIG.displayName,
          isActive: true,
          activeWorkspaceId: workspace.id
        }
      });
      console.log(`✅ Created new user: ${rossUser.name} (${rossUser.email})`);
    }
    console.log(`✅ User: ${rossUser.name} (${rossUser.email})`);

    // Step 3: Create workspace membership
    console.log("\n🔗 Step 3: Creating workspace membership...");
    let membership = await prisma.workspace_users.findFirst({
      where: {
        userId: rossUser.id,
        workspaceId: workspace.id
      }
    });

    if (!membership) {
      membership = await prisma.workspace_users.create({
        data: {
          userId: rossUser.id,
          workspaceId: workspace.id,
          role: "admin",
          updatedAt: new Date()
        }
      });
      console.log("✅ Created workspace membership");
    } else {
      // Update existing membership to admin
      membership = await prisma.workspace_users.update({
        where: { id: membership.id },
        data: { 
          role: "admin",
          updatedAt: new Date()
        }
      });
      console.log("✅ Updated workspace membership to admin");
    }

    // Step 4: Verify setup
    console.log("\n🔍 Step 4: Verifying setup...");
    const verifyUser = await prisma.users.findFirst({
      where: { email: ROSS_USER_CONFIG.email },
      include: {
        // Note: The schema shows workspace_users table, not a direct relation
      }
    });

    if (verifyUser) {
      console.log(`✅ User verified: ${verifyUser.name} (${verifyUser.email})`);
      console.log(`✅ Active workspace: ${verifyUser.activeWorkspaceId}`);
      
      // Test password
      const isPasswordValid = await bcrypt.compare(ROSS_USER_CONFIG.password, verifyUser.password || '');
      console.log(`✅ Password verification: ${isPasswordValid ? 'VALID' : 'INVALID'}`);
    }

    // Verify workspace membership
    const verifyMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: rossUser.id,
        workspaceId: workspace.id
      }
    });

    if (verifyMembership) {
      console.log(`✅ Workspace membership verified: ${verifyMembership.role}`);
    }

    console.log("\n🎉 Setup completed successfully!");
    console.log("🔐 Login credentials:");
    console.log(`   Username: ross`);
    console.log(`   Email: ${ROSS_USER_CONFIG.email}`);
    console.log(`   Password: ${ROSS_USER_CONFIG.password}`);
    console.log(`   Workspace: ${workspace.name}`);
    console.log(`   Role: admin`);

    console.log("\n📋 Authentication details:");
    console.log(`   • Can login with 'ross' or 'ross@adrata.com'`);
    console.log(`   • Has admin access to adrata workspace`);
    console.log(`   • Can access all features alongside dan`);

  } catch (error) {
    console.error("❌ Error during setup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupRossUserAndWorkspace().catch(console.error);
