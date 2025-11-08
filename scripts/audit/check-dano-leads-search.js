#!/usr/bin/env node

/**
 * 🔍 CHECK DANO'S LEADS SEARCH ISSUE
 * 
 * Checks if specific people exist in the database for dano in adrata workspace:
 * - Spencer Jesperson
 * - Veronica Escoto
 * - Corina Iliescu
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

const TARGET_NAMES = [
  { firstName: "Spencer", lastName: "Jesperson", fullName: "Spencer Jesperson" },
  { firstName: "Veronica", lastName: "Escoto", fullName: "Veronica Escoto" },
  { firstName: "Corina", lastName: "Iliescu", fullName: "Corina Iliescu" },
];

async function checkDanoLeadsSearch() {
  console.log("🔍 CHECKING DANO'S LEADS SEARCH ISSUE");
  console.log("=====================================");
  console.log("");

  try {
    // Step 1: Find Dano user
    console.log("👤 Step 1: Finding Dano user...");
    const dano = await prisma.users.findFirst({
      where: {
        OR: [
          { email: { contains: "dano", mode: "insensitive" } },
          { firstName: { contains: "dano", mode: "insensitive" } },
          { lastName: { contains: "dano", mode: "insensitive" } },
        ],
      },
    });

    if (!dano) {
      throw new Error("❌ Dano user not found");
    }

    console.log(`✅ Found Dano: ${dano.email || dano.name || dano.id} (ID: ${dano.id})`);

    // Step 2: Find Notary Everyday workspace
    console.log("\n🏢 Step 2: Finding Notary Everyday workspace...");
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { slug: "notary-everyday" },
          { slug: "ne" },
          { name: { contains: "notary", mode: "insensitive" } },
        ],
      },
    });

    if (!workspace) {
      throw new Error("❌ Notary Everyday workspace not found");
    }

    console.log(`✅ Found workspace: ${workspace.name} (ID: ${workspace.id}, slug: ${workspace.slug})`);

    // Step 3: Check total leads count for dano in adrata workspace
    console.log("\n📊 Step 3: Checking total leads count...");
    const totalLeadsForDano = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        status: "LEAD",
        deletedAt: null,
        OR: [
          { mainSellerId: dano.id },
          { mainSellerId: null }, // Include unassigned leads
        ],
      },
    });

    const totalLeadsInWorkspace = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        status: "LEAD",
        deletedAt: null,
      },
    });

    console.log(`✅ Total leads for dano in notary everyday workspace: ${totalLeadsForDano}`);
    console.log(`✅ Total leads in notary everyday workspace (all users): ${totalLeadsInWorkspace}`);
    
    if (totalLeadsInWorkspace > totalLeadsForDano) {
      console.log(`⚠️  There are ${totalLeadsInWorkspace - totalLeadsForDano} leads assigned to other users`);
    }

    // Step 4: Search for each target person
    console.log("\n🔍 Step 4: Searching for target people...");
    console.log("");

    const results = [];

    for (const target of TARGET_NAMES) {
      console.log(`\n  Searching for: ${target.fullName}`);
      console.log("  " + "=".repeat(50));

      // Search by full name
      const byFullName = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          fullName: { contains: target.fullName, mode: "insensitive" },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          status: true,
          mainSellerId: true,
          createdAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      // Search by first name
      const byFirstName = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          firstName: { contains: target.firstName, mode: "insensitive" },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          status: true,
          mainSellerId: true,
          createdAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      // Search by last name
      const byLastName = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          lastName: { contains: target.lastName, mode: "insensitive" },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          status: true,
          mainSellerId: true,
          createdAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      // Combine and deduplicate results
      const allMatches = new Map();
      [...byFullName, ...byFirstName, ...byLastName].forEach((person) => {
        if (!allMatches.has(person.id)) {
          allMatches.set(person.id, person);
        }
      });

      const matches = Array.from(allMatches.values());

      // Filter for exact matches
      const exactMatches = matches.filter(
        (p) =>
          (p.firstName?.toLowerCase() === target.firstName.toLowerCase() &&
            p.lastName?.toLowerCase() === target.lastName.toLowerCase()) ||
          p.fullName?.toLowerCase() === target.fullName.toLowerCase()
      );

      // Filter for leads status
      const leadMatches = exactMatches.filter((p) => p.status === "LEAD");

      // Filter for dano's leads (assigned to dano or unassigned)
      const danoLeads = leadMatches.filter(
        (p) => !p.mainSellerId || p.mainSellerId === dano.id
      );

      console.log(`    Found ${matches.length} total matches`);
      console.log(`    Found ${exactMatches.length} exact name matches`);
      console.log(`    Found ${leadMatches.length} with LEAD status`);
      console.log(`    Found ${danoLeads.length} assigned to dano or unassigned`);

      // Show what was found even if not exact matches
      if (matches.length > 0 && exactMatches.length === 0) {
        console.log(`\n    ⚠️  Found ${matches.length} similar match(es) but not exact:`);
        matches.slice(0, 5).forEach((person, index) => {
          console.log(`      ${index + 1}. firstName: "${person.firstName}" lastName: "${person.lastName}" fullName: "${person.fullName}"`);
          console.log(`         Status: ${person.status}, Main Seller: ${person.mainSellerId === dano.id ? "Dano" : person.mainSellerId || "Unassigned"}`);
          // Check if it's actually a match but with extra spaces
          const firstNameMatch = person.firstName?.trim().toLowerCase() === target.firstName.toLowerCase();
          const lastNameMatch = person.lastName?.trim().toLowerCase() === target.lastName.toLowerCase();
          if (firstNameMatch && lastNameMatch) {
            console.log(`         ✅ This is actually a match! (extra spaces in database)`);
          }
        });
      }

      if (exactMatches.length > 0 && leadMatches.length === 0) {
        console.log(`\n    ⚠️  Found ${exactMatches.length} exact match(es) but not LEAD status:`);
        exactMatches.forEach((person, index) => {
          console.log(`      ${index + 1}. Status: ${person.status} (not LEAD)`);
          console.log(`         Main Seller: ${person.mainSellerId === dano.id ? "Dano" : person.mainSellerId || "Unassigned"}`);
        });
      }

      if (leadMatches.length > 0 && danoLeads.length === 0) {
        console.log(`\n    ⚠️  Found ${leadMatches.length} LEAD match(es) but assigned to different user:`);
        leadMatches.forEach((person, index) => {
          console.log(`      ${index + 1}. Main Seller: ${person.mainSellerId || "Unassigned"} (not dano)`);
        });
      }

      if (danoLeads.length > 0) {
        console.log(`\n    ✅ FOUND ${danoLeads.length} MATCH(ES):`);
        danoLeads.forEach((person, index) => {
          console.log(`\n    Match ${index + 1}:`);
          console.log(`      ID: ${person.id}`);
          console.log(`      Name: ${person.firstName} ${person.lastName} (${person.fullName})`);
          console.log(`      Email: ${person.email || "N/A"}`);
          console.log(`      Status: ${person.status}`);
          console.log(`      Main Seller: ${person.mainSellerId === dano.id ? "Dano" : person.mainSellerId || "Unassigned"}`);
          console.log(`      Company: ${person.company?.name || "N/A"}`);
          console.log(`      Created: ${new Date(person.createdAt).toLocaleString()}`);
        });
      } else {
        console.log(`\n    ❌ NOT FOUND in dano's leads`);
        
        if (exactMatches.length > 0) {
          console.log(`    ⚠️  But found ${exactMatches.length} exact match(es) with different status or assignment:`);
          exactMatches.forEach((person, index) => {
            console.log(`\n    Match ${index + 1}:`);
            console.log(`      ID: ${person.id}`);
            console.log(`      Name: ${person.firstName} ${person.lastName} (${person.fullName})`);
            console.log(`      Status: ${person.status} ${person.status !== "LEAD" ? "❌ (Not a LEAD)" : ""}`);
            console.log(`      Main Seller: ${person.mainSellerId === dano.id ? "Dano ✅" : person.mainSellerId || "Unassigned ⚠️"}`);
            if (person.mainSellerId && person.mainSellerId !== dano.id) {
              console.log(`      ⚠️  Assigned to different user: ${person.mainSellerId}`);
            }
          });
        }
      }

      results.push({
        target,
        found: danoLeads.length > 0,
        matches: danoLeads,
        allMatches: matches,
        exactMatches: exactMatches,
      });
    }

    // Step 5: Summary
    console.log("\n\n📊 SUMMARY");
    console.log("=".repeat(50));
    console.log("");

    const foundCount = results.filter((r) => r.found).length;
    const notFoundCount = results.filter((r) => !r.found).length;

    console.log(`✅ Found: ${foundCount} of ${TARGET_NAMES.length} people`);
    console.log(`❌ Not Found: ${notFoundCount} of ${TARGET_NAMES.length} people`);
    console.log("");

    results.forEach((result) => {
      const status = result.found ? "✅" : "❌";
      console.log(
        `${status} ${result.target.fullName}: ${result.found ? "FOUND" : "NOT FOUND"}`
      );
      if (!result.found && result.exactMatches.length > 0) {
        console.log(
          `   ⚠️  Found ${result.exactMatches.length} match(es) but with wrong status or assignment`
        );
      }
    });

    // Step 6: Check if they exist in ANY workspace or status
    console.log("\n\n🔍 Step 6: Checking if people exist in ANY workspace...");
    console.log("=".repeat(50));
    
    for (const target of TARGET_NAMES) {
      const anywhere = await prisma.people.findMany({
        where: {
          deletedAt: null,
          OR: [
            {
              firstName: { contains: target.firstName, mode: "insensitive" },
              lastName: { contains: target.lastName, mode: "insensitive" },
            },
            {
              fullName: { contains: target.fullName, mode: "insensitive" },
            },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          status: true,
          mainSellerId: true,
          workspaceId: true,
          createdAt: true,
          company: {
            select: {
              name: true,
            },
          },
        },
        take: 10,
      });

      const exactAnywhere = anywhere.filter(
        (p) =>
          (p.firstName?.toLowerCase() === target.firstName.toLowerCase() &&
            p.lastName?.toLowerCase() === target.lastName.toLowerCase()) ||
          p.fullName?.toLowerCase() === target.fullName.toLowerCase()
      );

      if (exactAnywhere.length > 0) {
        console.log(`\n  ${target.fullName}:`);
        exactAnywhere.forEach((person) => {
          const workspaceMatch = person.workspaceId === workspace.id ? "✅" : "❌";
          const statusMatch = person.status === "LEAD" ? "✅" : "❌";
          const sellerMatch = !person.mainSellerId || person.mainSellerId === dano.id ? "✅" : "❌";
          console.log(`    ${workspaceMatch} Workspace: ${person.workspaceId === workspace.id ? "Notary Everyday" : "Other"} (${person.workspaceId})`);
          console.log(`    ${statusMatch} Status: ${person.status}`);
          console.log(`    ${sellerMatch} Main Seller: ${person.mainSellerId === dano.id ? "Dano" : person.mainSellerId || "Unassigned"}`);
          console.log(`    ID: ${person.id}`);
        });
      } else {
        console.log(`\n  ${target.fullName}: ❌ Not found in ANY workspace`);
      }
    }

    console.log("\n");
    console.log("🔍 SEARCH FIX STATUS:");
    console.log("=".repeat(50));
    if (foundCount === TARGET_NAMES.length) {
      console.log("✅ All people found! The search fix should work correctly.");
    } else if (foundCount > 0) {
      console.log("⚠️  Some people found. The search fix will work for found people.");
      console.log("❌ Some people not found. They may not exist or have wrong status/assignment.");
    } else {
      console.log("❌ None of the people found. They may not exist in the database");
      console.log("   or have wrong status/assignment for dano in notary everyday workspace.");
      console.log("   Check Step 6 above to see if they exist in other workspaces.");
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDanoLeadsSearch()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

