#!/usr/bin/env node

/**
 * Inspect actual Coresignal data structure to find email fields
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function inspectCoresignalStructure() {
  console.log("🔍 INSPECTING CORESIGNAL DATA STRUCTURE");
  console.log("========================================\n");

  try {
    // Find Dan user and workspace
    const danUser = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [{ id: "adrata" }, { slug: "adrata" }, { name: "adrata" }],
      },
    });

    // Get one lead with Coresignal data
    const lead = await prisma.people.findFirst({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        coresignalData: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        coresignalData: true,
        enrichedData: true,
      },
    });

    if (!lead) {
      console.log("No lead with Coresignal data found");
      return;
    }

    console.log(`Inspecting: ${lead.fullName}\n`);

    // Check Coresignal data
    if (lead.coresignalData) {
      console.log("📊 CORESIGNAL DATA STRUCTURE:");
      console.log("==============================");
      
      const cs = lead.coresignalData;
      
      // Find all keys that might contain email
      const emailKeys = Object.keys(cs).filter(key => 
        key.toLowerCase().includes('email') || 
        key.toLowerCase().includes('mail')
      );
      
      console.log(`\nEmail-related keys: ${emailKeys.length > 0 ? emailKeys.join(', ') : 'NONE FOUND'}`);
      
      emailKeys.forEach(key => {
        console.log(`\n  ${key}:`);
        const value = cs[key];
        if (Array.isArray(value)) {
          console.log(`    Array with ${value.length} items:`);
          value.slice(0, 3).forEach((item, i) => {
            console.log(`      [${i}]: ${JSON.stringify(item).substring(0, 200)}`);
          });
        } else if (typeof value === 'object' && value !== null) {
          console.log(`    Object: ${JSON.stringify(value).substring(0, 500)}`);
        } else {
          console.log(`    ${value}`);
        }
      });
      
      // Check experience array for emails
      if (cs.experience && Array.isArray(cs.experience)) {
        console.log(`\n  Experience array (${cs.experience.length} items):`);
        cs.experience.slice(0, 2).forEach((exp, i) => {
          console.log(`    Experience [${i}]:`);
          const expEmailKeys = Object.keys(exp).filter(k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail'));
          if (expEmailKeys.length > 0) {
            console.log(`      Email keys: ${expEmailKeys.join(', ')}`);
            expEmailKeys.forEach(key => {
              console.log(`        ${key}: ${exp[key]}`);
            });
          }
        });
      }
      
      // Full structure (limited)
      console.log(`\n  All top-level keys (${Object.keys(cs).length}):`);
      console.log(`    ${Object.keys(cs).join(', ')}`);
      
      // Show a sample of the full data
      console.log(`\n  Sample data structure:`);
      console.log(JSON.stringify(cs, null, 2).substring(0, 3000));
    }

    // Check enrichedData (Lusha)
    if (lead.enrichedData) {
      console.log(`\n\n📊 ENRICHED DATA (LUSHA) STRUCTURE:`);
      console.log("====================================");
      
      const ed = lead.enrichedData;
      
      const emailKeys = Object.keys(ed).filter(key => 
        key.toLowerCase().includes('email') || 
        key.toLowerCase().includes('mail')
      );
      
      console.log(`\nEmail-related keys: ${emailKeys.length > 0 ? emailKeys.join(', ') : 'NONE FOUND'}`);
      
      emailKeys.forEach(key => {
        console.log(`\n  ${key}: ${JSON.stringify(ed[key]).substring(0, 200)}`);
      });
      
      console.log(`\n  All keys: ${Object.keys(ed).join(', ')}`);
      console.log(`\n  Sample data structure:`);
      console.log(JSON.stringify(ed, null, 2).substring(0, 2000));
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectCoresignalStructure()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

