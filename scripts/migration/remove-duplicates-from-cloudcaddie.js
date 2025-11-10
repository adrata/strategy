#!/usr/bin/env node

/**
 * 🗑️ REMOVE DUPLICATES FROM CLOUDCADDIE WORKSPACE
 * 
 * This script finds and removes duplicate people in the cloudcaddie workspace
 * Duplicates are identified by: same fullName + same company
 */

const { PrismaClient } = require("@prisma/client");

// SECURITY: Never hardcode database credentials - always use environment variables
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL environment variable is required");
  console.error("Please set it in your .env file or environment before running this script");
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function removeDuplicatesFromCloudcaddie() {
  console.log("🗑️  REMOVING DUPLICATES FROM CLOUDCADDIE WORKSPACE");
  console.log("==================================================");
  console.log("");

  try {
    // Step 1: Find Cloudcaddie workspace
    console.log("🏢 Step 1: Finding Cloudcaddie workspace...");
    const cloudcaddieWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: "cloudcaddie" },
          { slug: "cloudcaddie" },
          { name: { contains: "cloudcaddie", mode: "insensitive" } },
          { name: { contains: "cloud caddie", mode: "insensitive" } },
        ],
      },
    });

    if (!cloudcaddieWorkspace) {
      throw new Error("❌ Cloudcaddie workspace not found");
    }

    console.log(`✅ Found Cloudcaddie workspace: ${cloudcaddieWorkspace.name} (ID: ${cloudcaddieWorkspace.id})`);

    // Step 2: Find Justin user
    console.log("\n👤 Step 2: Finding Justin user...");
    const justinUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: "jjohnson@cloudcaddieconsulting.com" },
          { email: { contains: "justin", mode: "insensitive" } },
        ],
      },
    });

    if (!justinUser) {
      throw new Error("❌ Justin user not found");
    }

    console.log(`✅ Found Justin: ${justinUser.email} (ID: ${justinUser.id})`);

    // Step 3: Get all of Justin's people in Cloudcaddie workspace
    console.log("\n📋 Step 3: Getting Justin's people from Cloudcaddie workspace...");
    const justinPeople = await prisma.people.findMany({
      where: {
        workspaceId: cloudcaddieWorkspace.id,
        mainSellerId: justinUser.id,
        deletedAt: null,
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" }, // Keep the oldest one
    });

    console.log(`✅ Found ${justinPeople.length} people assigned to Justin`);

    if (justinPeople.length === 0) {
      console.log("⚠️  No people found. Exiting.");
      return;
    }

    // Step 4: Identify duplicates
    console.log("\n🔍 Step 4: Identifying duplicates...");
    const seen = new Map();
    const duplicates = [];
    const uniquePeople = [];

    for (const person of justinPeople) {
      // Normalize the name for comparison
      const normalizedName = (person.fullName || `${person.firstName} ${person.lastName}`)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      
      // Get company name
      const companyName = person.company?.name 
        ? person.company.name.toLowerCase().trim()
        : "";
      
      // Create key: name + company
      const key = companyName 
        ? `${normalizedName}_${companyName}`
        : normalizedName;
      
      if (seen.has(key)) {
        duplicates.push(person);
        const existing = seen.get(key);
        console.log(`   ⚠️  Duplicate found: ${person.fullName}${companyName ? ` at ${person.company.name}` : ""}`);
        console.log(`      Keeping: ${existing.fullName} (ID: ${existing.id}, Created: ${existing.createdAt})`);
        console.log(`      Removing: ${person.fullName} (ID: ${person.id}, Created: ${person.createdAt})`);
      } else {
        seen.set(key, person);
        uniquePeople.push(person);
      }
    }

    console.log(`\n📊 Duplicate Summary:`);
    console.log(`   Total people: ${justinPeople.length}`);
    console.log(`   Unique people: ${uniquePeople.length}`);
    console.log(`   Duplicates to remove: ${duplicates.length}`);

    if (duplicates.length === 0) {
      console.log("\n✅ No duplicates found!");
      return;
    }

    // Step 5: Show duplicates before deletion
    console.log("\n📋 Duplicates to be removed:");
    duplicates.forEach((dup, index) => {
      console.log(`   ${index + 1}. ${dup.fullName} (ID: ${dup.id}) - ${dup.company?.name || "No company"}`);
    });

    // Step 6: Delete duplicates
    console.log("\n🗑️  Step 6: Deleting duplicates...");
    let deletedCount = 0;
    let errorCount = 0;

    for (const duplicate of duplicates) {
      try {
        await prisma.people.update({
          where: { id: duplicate.id },
          data: { deletedAt: new Date() },
        });
        deletedCount++;
        console.log(`   ✅ Deleted: ${duplicate.fullName} (ID: ${duplicate.id})`);
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error deleting ${duplicate.fullName}: ${error.message}`);
      }
    }

    console.log(`\n✅ Deletion Summary:`);
    console.log(`   Duplicates found: ${duplicates.length}`);
    console.log(`   Successfully deleted: ${deletedCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Step 7: Verify
    console.log("\n🔍 Step 7: Verifying...");
    const remainingCount = await prisma.people.count({
      where: {
        workspaceId: cloudcaddieWorkspace.id,
        mainSellerId: justinUser.id,
        deletedAt: null,
      },
    });

    console.log(`   People remaining in Cloudcaddie: ${remainingCount}`);
    console.log(`   Expected: ${uniquePeople.length}`);

    if (remainingCount === uniquePeople.length) {
      console.log("\n✅ Duplicate removal completed successfully!");
    } else {
      console.log("\n⚠️  Count mismatch. Please review.");
    }

  } catch (error) {
    console.error("\n❌ Error during duplicate removal:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
removeDuplicatesFromCloudcaddie()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

