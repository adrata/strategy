#!/usr/bin/env node

/**
 * 🔄 MOVE JUSTIN'S PEOPLE TO CLOUDCADDIE WORKSPACE
 * 
 * This script:
 * 1. Finds Justin's user account
 * 2. Finds the cloudcaddie workspace
 * 3. Moves all of Justin's people from adrata workspace to cloudcaddie workspace
 * 4. Removes duplicates (same name + company)
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function moveJustinPeopleToCloudcaddie() {
  console.log("🔄 MOVING JUSTIN'S PEOPLE TO CLOUDCADDIE WORKSPACE");
  console.log("==================================================");
  console.log("");

  try {
    // Step 1: Find Justin user
    console.log("👤 Step 1: Finding Justin user...");
    const justinUser = await prisma.users.findFirst({
      where: {
        OR: [
          { email: "jjohnson@cloudcaddieconsulting.com" },
          { email: { contains: "justin", mode: "insensitive" } },
          { firstName: { contains: "justin", mode: "insensitive" } },
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

    // Step 3: Find Cloudcaddie workspace
    console.log("\n🏢 Step 3: Finding Cloudcaddie workspace...");
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
      throw new Error("❌ Cloudcaddie workspace not found. Please create it first.");
    }

    console.log(`✅ Found Cloudcaddie workspace: ${cloudcaddieWorkspace.name} (ID: ${cloudcaddieWorkspace.id})`);

    // Step 4: Get all of Justin's people from Adrata workspace
    console.log("\n📋 Step 4: Getting Justin's people from Adrata workspace...");
    const justinPeople = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: justinUser.id,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });

    console.log(`✅ Found ${justinPeople.length} people assigned to Justin in Adrata workspace`);

    if (justinPeople.length === 0) {
      console.log("⚠️  No people to move. Exiting.");
      return;
    }

    // Step 5: Identify and remove duplicates
    console.log("\n🔍 Step 5: Identifying duplicates...");
    const seen = new Map();
    const duplicates = [];
    const uniquePeople = [];

    // First, get all company names in one query for efficiency
    const companyIds = [...new Set(justinPeople.map(p => p.companyId).filter(Boolean))];
    const companies = await prisma.companies.findMany({
      where: { id: { in: companyIds } },
      select: { id: true, name: true },
    });
    const companyMap = new Map(companies.map(c => [c.id, c.name]));

    for (const person of justinPeople) {
      // Create a key from name + company (more flexible matching)
      const companyName = person.companyId 
        ? (companyMap.get(person.companyId) || "").toLowerCase().trim()
        : "";
      
      // Normalize the name for comparison
      const normalizedName = (person.fullName || `${person.firstName} ${person.lastName}`)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      
      // Create key - if no company, just use name
      const key = companyName 
        ? `${normalizedName}_${companyName}`
        : normalizedName;
      
      if (seen.has(key)) {
        duplicates.push(person);
        const existing = seen.get(key);
        console.log(`   ⚠️  Duplicate found: ${person.fullName}${companyName ? ` at ${companyMap.get(person.companyId) || "Unknown"}` : ""}`);
        console.log(`      Existing: ${existing.fullName} (ID: ${existing.id}, Created: ${existing.createdAt})`);
        console.log(`      Duplicate: ${person.fullName} (ID: ${person.id}, Created: ${person.createdAt})`);
      } else {
        seen.set(key, person);
        uniquePeople.push(person);
      }
    }
    
    // Also check for exact name matches regardless of company
    console.log("\n   Checking for name-only duplicates...");
    const nameOnlySeen = new Map();
    const nameOnlyDuplicates = [];
    
    for (const person of justinPeople) {
      const normalizedName = (person.fullName || `${person.firstName} ${person.lastName}`)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
      
      if (nameOnlySeen.has(normalizedName)) {
        const existing = nameOnlySeen.get(normalizedName);
        // Only flag as duplicate if they're the same person (same name, same or no company)
        if (existing.id !== person.id) {
          nameOnlyDuplicates.push(person);
          console.log(`   ⚠️  Name-only duplicate: ${person.fullName} (different from existing ${existing.fullName})`);
        }
      } else {
        nameOnlySeen.set(normalizedName, person);
      }
    }

    console.log(`\n📊 Duplicate Summary:`);
    console.log(`   Total people: ${justinPeople.length}`);
    console.log(`   Unique people: ${uniquePeople.length}`);
    console.log(`   Duplicates to remove: ${duplicates.length}`);

    // Step 6: Delete duplicates
    if (duplicates.length > 0) {
      console.log("\n🗑️  Step 6: Deleting duplicates...");
      for (const duplicate of duplicates) {
        await prisma.people.update({
          where: { id: duplicate.id },
          data: { deletedAt: new Date() },
        });
        console.log(`   ✅ Deleted duplicate: ${duplicate.fullName} (ID: ${duplicate.id})`);
      }
    }

    // Step 7: Move unique people to Cloudcaddie workspace
    console.log("\n🔄 Step 7: Moving unique people to Cloudcaddie workspace...");
    let movedCount = 0;
    let errorCount = 0;

    for (const person of uniquePeople) {
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            workspaceId: cloudcaddieWorkspace.id,
          },
        });
        movedCount++;
        if (movedCount % 10 === 0) {
          console.log(`   ✅ Moved ${movedCount}/${uniquePeople.length} people...`);
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error moving ${person.fullName}: ${error.message}`);
      }
    }

    console.log(`\n✅ Migration Summary:`);
    console.log(`   Total people found: ${justinPeople.length}`);
    console.log(`   Duplicates removed: ${duplicates.length}`);
    console.log(`   People moved: ${movedCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Step 8: Verify the move
    console.log("\n🔍 Step 8: Verifying migration...");
    const remainingInAdrata = await prisma.people.count({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: justinUser.id,
        deletedAt: null,
      },
    });

    const nowInCloudcaddie = await prisma.people.count({
      where: {
        workspaceId: cloudcaddieWorkspace.id,
        mainSellerId: justinUser.id,
        deletedAt: null,
      },
    });

    console.log(`   People remaining in Adrata: ${remainingInAdrata}`);
    console.log(`   People now in Cloudcaddie: ${nowInCloudcaddie}`);

    if (remainingInAdrata === 0 && nowInCloudcaddie === uniquePeople.length) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n⚠️  Migration completed with discrepancies. Please review.");
    }

  } catch (error) {
    console.error("\n❌ Error during migration:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
moveJustinPeopleToCloudcaddie()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

