#!/usr/bin/env node

/**
 * 🔍 CHECK DANO'S RECENT RECORDS
 * 
 * Checks if recently added people and companies in notary everyday workspace
 * have Dano as the mainSeller
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function checkDanoRecentRecords() {
  console.log("🔍 CHECKING DANO'S RECENT RECORDS");
  console.log("==================================");
  console.log("");

  try {
    // Step 1: Find Dano user
    console.log("👤 Step 1: Finding Dano user...");
    const dano = await prisma.users.findFirst({
      where: {
        OR: [
          { email: "dano@notaryeveryday.com" },
          { id: "dano" },
          { email: { contains: "dano", mode: "insensitive" } },
        ],
      },
    });

    if (!dano) {
      throw new Error("❌ Dano user not found");
    }

    console.log(`✅ Found Dano: ${dano.email} (ID: ${dano.id})`);

    // Step 2: Find Notary Everyday workspace
    console.log("\n🏢 Step 2: Finding Notary Everyday workspace...");
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: "notary-everyday" },
          { name: { contains: "notary", mode: "insensitive" } },
        ],
      },
    });

    if (!workspace) {
      throw new Error("❌ Notary Everyday workspace not found");
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Step 3: Get all people in workspace
    console.log("\n📋 Step 3: Getting all people...");
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        mainSellerId: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${allPeople.length} total people`);

    // Step 4: Get all companies in workspace
    console.log("\n🏢 Step 4: Getting all companies...");
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        mainSellerId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${allCompanies.length} total companies`);

    // Step 5: Check mainSeller assignment for all records
    console.log("\n📊 Step 5: Checking mainSeller assignments...");
    const peopleWithDano = allPeople.filter((p) => p.mainSellerId === dano.id);
    const peopleWithoutDano = allPeople.filter(
      (p) => p.mainSellerId && p.mainSellerId !== dano.id
    );
    const peopleUnassigned = allPeople.filter((p) => !p.mainSellerId);

    const companiesWithDano = allCompanies.filter((c) => c.mainSellerId === dano.id);
    const companiesWithoutDano = allCompanies.filter(
      (c) => c.mainSellerId && c.mainSellerId !== dano.id
    );
    const companiesUnassigned = allCompanies.filter((c) => !c.mainSellerId);

    console.log("\nPEOPLE BREAKDOWN:");
    console.log(`  Assigned to Dano: ${peopleWithDano.length}`);
    console.log(`  Assigned to others: ${peopleWithoutDano.length}`);
    console.log(`  Unassigned: ${peopleUnassigned.length}`);

    console.log("\nCOMPANIES BREAKDOWN:");
    console.log(`  Assigned to Dano: ${companiesWithDano.length}`);
    console.log(`  Assigned to others: ${companiesWithoutDano.length}`);
    console.log(`  Unassigned: ${companiesUnassigned.length}`);

    // Step 6: Check recently added (last 7 days)
    console.log("\n📅 Step 6: Checking recently added records (last 7 days)...");
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentPeople = allPeople.filter(
      (p) => new Date(p.createdAt) > sevenDaysAgo
    );
    const recentCompanies = allCompanies.filter(
      (c) => new Date(c.createdAt) > sevenDaysAgo
    );

    console.log(`\nRECENTLY ADDED (last 7 days):`);
    console.log(`  People: ${recentPeople.length}`);
    console.log(`  Companies: ${recentCompanies.length}`);

    const recentPeopleWithDano = recentPeople.filter(
      (p) => p.mainSellerId === dano.id
    );
    const recentPeopleWithoutDano = recentPeople.filter(
      (p) => p.mainSellerId && p.mainSellerId !== dano.id
    );
    const recentPeopleUnassigned = recentPeople.filter((p) => !p.mainSellerId);

    const recentCompaniesWithDano = recentCompanies.filter(
      (c) => c.mainSellerId === dano.id
    );
    const recentCompaniesWithoutDano = recentCompanies.filter(
      (c) => c.mainSellerId && c.mainSellerId !== dano.id
    );
    const recentCompaniesUnassigned = recentCompanies.filter((c) => !c.mainSellerId);

    console.log("\nRECENT PEOPLE BREAKDOWN:");
    console.log(`  Assigned to Dano: ${recentPeopleWithDano.length}`);
    console.log(`  Assigned to others: ${recentPeopleWithoutDano.length}`);
    console.log(`  Unassigned: ${recentPeopleUnassigned.length}`);

    console.log("\nRECENT COMPANIES BREAKDOWN:");
    console.log(`  Assigned to Dano: ${recentCompaniesWithDano.length}`);
    console.log(`  Assigned to others: ${recentCompaniesWithoutDano.length}`);
    console.log(`  Unassigned: ${recentCompaniesUnassigned.length}`);

    // Step 7: Get seller details for people assigned to others
    console.log("\n👥 Step 7: Getting seller details for people assigned to others...");
    const sellerIds = [
      ...new Set(
        recentPeopleWithoutDano.map((p) => p.mainSellerId).filter(Boolean)
      ),
    ];

    const sellers = await prisma.users.findMany({
      where: {
        id: { in: sellerIds },
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
      },
    });

    const sellerMap = new Map(sellers.map((s) => [s.id, s]));

    // Step 8: Show details of problematic records grouped by seller
    const problematicPeople = [
      ...recentPeopleUnassigned,
      ...recentPeopleWithoutDano,
    ];
    const problematicCompanies = [
      ...recentCompaniesUnassigned,
      ...recentCompaniesWithoutDano,
    ];

    // Group people by seller
    const peopleBySeller = {};
    problematicPeople.forEach((p) => {
      const sellerId = p.mainSellerId || "UNASSIGNED";
      if (!peopleBySeller[sellerId]) {
        peopleBySeller[sellerId] = [];
      }
      peopleBySeller[sellerId].push(p);
    });

    if (Object.keys(peopleBySeller).length > 0) {
      console.log("\n⚠️  RECENT PEOPLE NOT ASSIGNED TO DANO:");
      console.log(`   Total: ${problematicPeople.length} people\n`);

      Object.entries(peopleBySeller)
        .sort((a, b) => b[1].length - a[1].length)
        .forEach(([sellerId, people]) => {
          const seller = sellerMap.get(sellerId);
          const sellerName = seller
            ? seller.email || seller.name || `${seller.firstName} ${seller.lastName}`.trim() || sellerId
            : sellerId === "UNASSIGNED"
            ? "UNASSIGNED"
            : sellerId;

          console.log(`\n  ${sellerName} (${sellerId}): ${people.length} people`);
          people.slice(0, 10).forEach((p, index) => {
            const createdDate = new Date(p.createdAt).toLocaleDateString();
            console.log(
              `    ${index + 1}. ${p.fullName} (${p.company?.name || "No company"}) - Created: ${createdDate}`
            );
          });
          if (people.length > 10) {
            console.log(`    ... and ${people.length - 10} more`);
          }
        });
    }

    if (problematicCompanies.length > 0) {
      console.log("\n⚠️  RECENT COMPANIES NOT ASSIGNED TO DANO:");
      problematicCompanies.forEach((c, index) => {
        const status = !c.mainSellerId
          ? "UNASSIGNED"
          : `ASSIGNED TO OTHER (${c.mainSellerId})`;
        const createdDate = new Date(c.createdAt).toLocaleDateString();
        console.log(`  ${index + 1}. ${c.name}`);
        console.log(`     Status: ${status}`);
        console.log(`     Created: ${createdDate}`);
      });
    }

    if (problematicPeople.length === 0 && problematicCompanies.length === 0) {
      console.log("\n✅ All recent records are correctly assigned to Dano!");
    } else {
      console.log(
        `\n❌ Found ${problematicPeople.length} people and ${problematicCompanies.length} companies not assigned to Dano`
      );
      console.log("   These records will not be visible to Dano!");
    }

    // Step 8: Show summary
    console.log("\n📊 SUMMARY:");
    console.log(`   Total people: ${allPeople.length}`);
    console.log(`   Total companies: ${allCompanies.length}`);
    console.log(`   People assigned to Dano: ${peopleWithDano.length}`);
    console.log(`   Companies assigned to Dano: ${companiesWithDano.length}`);
    console.log(
      `   Recent people not assigned: ${problematicPeople.length}`
    );
    console.log(
      `   Recent companies not assigned: ${problematicCompanies.length}`
    );

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDanoRecentRecords()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

