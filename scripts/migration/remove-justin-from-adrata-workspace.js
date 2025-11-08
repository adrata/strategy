#!/usr/bin/env node

/**
 * 🚪 REMOVE JUSTIN FROM ADRATA WORKSPACE
 * 
 * This script removes Justin from the adrata workspace membership
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function removeJustinFromAdrataWorkspace() {
  console.log("🚪 REMOVING JUSTIN FROM ADRATA WORKSPACE");
  console.log("========================================");
  console.log("");

  try {
    // Step 1: Find Justin user
    console.log("👤 Step 1: Finding Justin user...");
    const justinUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: "jjohnson@cloudcaddieconsulting.com" },
          { email: { contains: "justin", mode: "insensitive" } },
        ],
      },
    });

    if (!justinUser) {
      throw new Error("❌ Justin user not found in database");
    }

    console.log(`✅ Found Justin: ${justinUser.email || justinUser.name} (ID: ${justinUser.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: "adrata" },
          { slug: "adrata" },
          { name: { contains: "adrata", mode: "insensitive" } },
        ],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("❌ Adrata workspace not found");
    }

    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})`);

    // Step 3: Check if Justin is a member of Adrata workspace
    console.log("\n🔍 Step 3: Checking Justin's workspace membership...");
    const workspaceMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: adrataWorkspace.id,
        userId: justinUser.id,
      },
    });

    if (!workspaceMembership) {
      console.log("✅ Justin is not a member of the Adrata workspace. Nothing to do.");
      return;
    }

    console.log(`⚠️  Found Justin's membership in Adrata workspace:`);
    console.log(`   Role: ${workspaceMembership.role}`);
    console.log(`   Created: ${workspaceMembership.createdAt}`);
    console.log(`   Is Active: ${workspaceMembership.isActive}`);

    // Step 4: Remove Justin from Adrata workspace
    console.log("\n🗑️  Step 4: Removing Justin from Adrata workspace...");
    await prisma.workspace_users.delete({
      where: {
        id: workspaceMembership.id,
      },
    });

    console.log("✅ Successfully removed Justin from Adrata workspace");

    // Step 5: Verify removal
    console.log("\n🔍 Step 5: Verifying removal...");
    const verifyMembership = await prisma.workspace_users.findFirst({
      where: {
        workspaceId: adrataWorkspace.id,
        userId: justinUser.id,
      },
    });

    if (!verifyMembership) {
      console.log("✅ Verification successful: Justin is no longer a member of Adrata workspace");
    } else {
      console.log("⚠️  Warning: Justin still appears to be a member. Please check manually.");
    }

    // Step 6: Check if Justin is in Cloudcaddie workspace
    console.log("\n🔍 Step 6: Checking if Justin is in Cloudcaddie workspace...");
    const cloudcaddieWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: "cloudcaddie" },
          { slug: "cloudcaddie" },
          { name: { contains: "cloudcaddie", mode: "insensitive" } },
        ],
      },
    });

    if (cloudcaddieWorkspace) {
      const cloudcaddieMembership = await prisma.workspace_users.findFirst({
        where: {
          workspaceId: cloudcaddieWorkspace.id,
          userId: justinUser.id,
        },
      });

      if (cloudcaddieMembership) {
        console.log(`✅ Justin is a member of Cloudcaddie workspace (Role: ${cloudcaddieMembership.role})`);
      } else {
        console.log("⚠️  Justin is NOT a member of Cloudcaddie workspace. You may want to add him.");
      }
    }

    console.log("\n✅ Removal completed successfully!");

  } catch (error) {
    console.error("\n❌ Error during removal:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeJustinFromAdrataWorkspace()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

