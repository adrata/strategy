#!/usr/bin/env node

/**
 * 🔄 RE-RANK DAN'S SPEEDRUN PEOPLE
 * 
 * Re-ranks all of Dan's people to ensure they have ranks 1-88
 * Top 50 will get ranks 1-50 for speedrun display
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

async function reRankDanSpeedrun() {
  console.log("🔄 RE-RANKING DAN'S SPEEDRUN PEOPLE");
  console.log("===================================");
  console.log("");

  try {
    // Step 1: Find Dan user
    console.log("👤 Step 1: Finding Dan user...");
    const dan = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    if (!dan) {
      throw new Error("❌ Dan user not found");
    }

    console.log(`✅ Found Dan: ${dan.email} (ID: ${dan.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const workspace = await prisma.workspaces.findFirst({
      where: { name: { contains: "Adrata", mode: "insensitive" } },
    });

    if (!workspace) {
      throw new Error("❌ Adrata workspace not found");
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Step 3: Get all of Dan's people with companies
    console.log("\n📋 Step 3: Getting Dan's people...");
    const people = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: dan.id,
        deletedAt: null,
        companyId: { not: null }, // Only people with companies
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        lastActionDate: true,
        status: true,
        priority: true,
        engagementScore: true,
        createdAt: true,
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        // Priority order for ranking
        { priority: "desc" }, // HIGH > MEDIUM > LOW
        { engagementScore: "desc" }, // Higher engagement first
        { lastActionDate: "asc" }, // Older last action = needs attention
        { createdAt: "asc" }, // Older records first
      ],
    });

    console.log(`✅ Found ${people.length} people to rank`);

    if (people.length === 0) {
      console.log("⚠️  No people to rank. Exiting.");
      return;
    }

    // Step 4: Show current ranking distribution
    console.log("\n📊 Step 4: Current ranking distribution...");
    const rank1to50 = people.filter((p) => p.globalRank && p.globalRank <= 50).length;
    const rankOver50 = people.filter((p) => p.globalRank && p.globalRank > 50).length;
    const noRank = people.filter((p) => !p.globalRank).length;

    console.log(`   Rank 1-50: ${rank1to50} people`);
    console.log(`   Rank > 50: ${rankOver50} people`);
    console.log(`   No rank: ${noRank} people`);

    // Step 5: Re-rank all people sequentially (1-88)
    console.log("\n🔄 Step 5: Re-ranking all people...");
    let updatedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < people.length; i++) {
      const person = people[i];
      const newRank = i + 1;

      try {
        await prisma.people.update({
          where: { id: person.id },
          data: {
            globalRank: newRank,
            updatedAt: new Date(),
          },
        });

        updatedCount++;

        // Log first 10 and last 10
        if (i < 10 || i >= people.length - 10) {
          const oldRank = person.globalRank || "null";
          console.log(
            `   ${i + 1}. ${person.fullName} - Rank: ${oldRank} → ${newRank}`
          );
        }
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error updating ${person.fullName}: ${error.message}`);
      }
    }

    console.log(`\n✅ Re-ranking complete!`);
    console.log(`   Updated: ${updatedCount} people`);
    console.log(`   Errors: ${errorCount} people`);

    // Step 6: Verify the ranking
    console.log("\n🔍 Step 6: Verifying ranking...");
    const verifyPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: dan.id,
        deletedAt: null,
        companyId: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
      },
      orderBy: { globalRank: "asc" },
    });

    const rank1to50After = verifyPeople.filter(
      (p) => p.globalRank && p.globalRank <= 50
    ).length;
    const rankOver50After = verifyPeople.filter(
      (p) => p.globalRank && p.globalRank > 50
    ).length;
    const noRankAfter = verifyPeople.filter((p) => !p.globalRank).length;

    console.log(`   Rank 1-50: ${rank1to50After} people (should be ${Math.min(people.length, 50)})`);
    console.log(`   Rank > 50: ${rankOver50After} people`);
    console.log(`   No rank: ${noRankAfter} people`);

    // Step 7: Check companies
    console.log("\n🏢 Step 7: Checking companies...");
    const companiesWithoutPeople = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: dan.id,
        deletedAt: null,
        globalRank: { not: null, gte: 1, lte: 50 },
        people: {
          none: {
            deletedAt: null,
            mainSellerId: dan.id,
          },
        },
      },
    });

    console.log(`   Companies without people (rank 1-50): ${companiesWithoutPeople}`);

    // Step 8: Calculate expected speedrun count
    console.log("\n📊 Step 8: Expected speedrun count...");
    const expectedPeople = Math.min(rank1to50After, 50);
    const expectedCompanies = Math.min(companiesWithoutPeople, 50 - expectedPeople);
    const expectedTotal = expectedPeople + expectedCompanies;

    console.log(`   People (rank 1-50): ${expectedPeople}`);
    console.log(`   Companies (rank 1-50): ${expectedCompanies}`);
    console.log(`   Total expected in speedrun: ${expectedTotal} (limited to 50)`);

    if (expectedTotal >= 50) {
      console.log("\n✅ Dan should now see 50 records in speedrun!");
    } else {
      console.log(
        `\n⚠️  Dan will see ${expectedTotal} records (less than 50). This is because there are only ${expectedTotal} total ranked records.`
      );
    }

    console.log("\n✅ Re-ranking completed successfully!");

  } catch (error) {
    console.error("\n❌ Error during re-ranking:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
reRankDanSpeedrun()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

