#!/usr/bin/env node

/**
 * Check what Lusha data is actually stored for leads that were skipped
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

async function checkLushaDataStored() {
  console.log("🔍 CHECKING STORED LUSHA DATA");
  console.log("==============================\n");

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

    // Get leads that were skipped (have dataSources with lusha)
    const skippedLeads = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        linkedinUrl: { not: null },
        dataSources: { has: "lusha" },
        lastEnriched: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within 7 days
        },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        phoneVerified: true,
        enrichedData: true,
        lastEnriched: true,
        dataSources: true,
      },
      take: 20, // Check first 20
    });

    console.log(`Found ${skippedLeads.length} leads with Lusha in dataSources (sample)\n`);

    const stats = {
      total: skippedLeads.length,
      withEmail: 0,
      withPhone: 0,
      withEnrichedData: 0,
      withFullData: 0,
      missingData: [],
    };

    skippedLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.fullName}`);
      console.log(`   Last Enriched: ${lead.lastEnriched ? new Date(lead.lastEnriched).toLocaleDateString() : 'Never'}`);
      console.log(`   Data Sources: ${lead.dataSources?.join(', ') || 'None'}`);
      
      let hasEmail = false;
      let hasPhone = false;
      let hasEnrichedData = false;
      let missingFields = [];

      // Check emails
      if (lead.email || lead.workEmail || lead.personalEmail) {
        hasEmail = true;
        stats.withEmail++;
        console.log(`   ✅ Email: ${lead.email || lead.workEmail || lead.personalEmail}`);
      } else {
        missingFields.push('email');
        console.log(`   ❌ Email: Missing`);
      }

      // Check phones
      if (lead.phone || lead.mobilePhone || lead.workPhone) {
        hasPhone = true;
        stats.withPhone++;
        console.log(`   ✅ Phone: ${lead.phone || lead.mobilePhone || lead.workPhone}`);
        if (lead.phoneVerified) {
          console.log(`      Verified: Yes`);
        }
      } else {
        missingFields.push('phone');
        console.log(`   ❌ Phone: Missing`);
      }

      // Check enrichedData
      if (lead.enrichedData && typeof lead.enrichedData === 'object') {
        hasEnrichedData = true;
        stats.withEnrichedData++;
        
        const ed = lead.enrichedData;
        if (ed.primaryEmail || ed.email) {
          console.log(`   ✅ EnrichedData email: ${ed.primaryEmail || ed.email}`);
        }
        if (ed.phone1 || ed.mobilePhone || ed.workPhone) {
          console.log(`   ✅ EnrichedData phone: ${ed.phone1 || ed.mobilePhone || ed.workPhone}`);
        }
        console.log(`   ✅ EnrichedData: Has full Lusha data`);
      } else {
        missingFields.push('enrichedData');
        console.log(`   ❌ EnrichedData: Missing`);
      }

      if (hasEmail && hasPhone && hasEnrichedData) {
        stats.withFullData++;
      } else {
        stats.missingData.push({
          id: lead.id,
          fullName: lead.fullName,
          missing: missingFields,
        });
      }
    });

    console.log(`\n\n📊 SUMMARY`);
    console.log("==========");
    console.log(`Total checked: ${stats.total}`);
    console.log(`With email: ${stats.withEmail} (${((stats.withEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With phone: ${stats.withPhone} (${((stats.withPhone / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With enrichedData: ${stats.withEnrichedData} (${((stats.withEnrichedData / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With full data (email + phone + enrichedData): ${stats.withFullData} (${((stats.withFullData / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Missing data: ${stats.missingData.length}`);

    if (stats.missingData.length > 0) {
      console.log(`\n⚠️  Leads missing data (should re-enrich):`);
      stats.missingData.forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.fullName} - Missing: ${item.missing.join(', ')}`);
      });
    }

    console.log(`\n\n💡 RECOMMENDATION`);
    console.log("==================");
    if (stats.missingData.length > 0) {
      console.log(`✅ Re-enrich ${stats.missingData.length} leads that are missing data`);
      console.log(`   These leads have Lusha in dataSources but are missing email, phone, or enrichedData`);
    } else {
      console.log(`✅ All checked leads have complete Lusha data stored`);
      console.log(`   No need to re-enrich unless you want fresh data`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkLushaDataStored()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

