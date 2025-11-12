#!/usr/bin/env node

/**
 * Extract Lusha data from enrichedData field to main database fields
 * This extracts data that was already enriched but not saved to main fields
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isTempEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const tempPatterns = ['@coresignal.temp', '@temp.', 'placeholder', 'example.com', 'test.com', 'fake.com'];
  return tempPatterns.some(pattern => email.toLowerCase().includes(pattern));
}

async function extractLushaDataFromEnriched() {
  console.log("🔄 EXTRACTING LUSHA DATA FROM ENRICHEDDATA");
  console.log("==========================================\n");

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

    // Get leads with enrichedData containing Lusha data
    const leadsWithEnrichedData = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        enrichedData: { not: null },
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
        phoneConfidence: true,
        phoneQualityScore: true,
        enrichedData: true,
      },
    });

    console.log(`Found ${leadsWithEnrichedData.length} leads with enrichedData\n`);

    const stats = {
      total: 0,
      processed: 0,
      emailsExtracted: 0,
      phonesExtracted: 0,
      skipped: 0,
      errors: 0,
    };

    for (const lead of leadsWithEnrichedData) {
      try {
        if (!lead.enrichedData || typeof lead.enrichedData !== 'object') {
          continue;
        }

        const ed = lead.enrichedData;
        
        // Check if this is Lusha data
        if (!ed.enrichmentSource || !ed.enrichmentSource.includes('lusha')) {
          continue;
        }

        stats.total++;
        const updateData = {};
        let hasUpdates = false;

        console.log(`\n${stats.total}. ${lead.fullName}`);

        // Extract email
        if (ed.primaryEmail && isValidEmail(ed.primaryEmail) && !isTempEmail(ed.primaryEmail)) {
          if (!lead.email) {
            updateData.email = ed.primaryEmail;
            updateData.emailVerified = true;
            hasUpdates = true;
            stats.emailsExtracted++;
            console.log(`   ✅ Extracted email: ${ed.primaryEmail}`);
          }
        }

        if (ed.workEmail && isValidEmail(ed.workEmail) && !isTempEmail(ed.workEmail)) {
          if (!lead.workEmail) {
            updateData.workEmail = ed.workEmail;
            hasUpdates = true;
            console.log(`   ✅ Extracted workEmail: ${ed.workEmail}`);
          }
        }

        if (ed.personalEmail && isValidEmail(ed.personalEmail) && !isTempEmail(ed.personalEmail)) {
          if (!lead.personalEmail) {
            updateData.personalEmail = ed.personalEmail;
            hasUpdates = true;
            console.log(`   ✅ Extracted personalEmail: ${ed.personalEmail}`);
          }
        }

        // Extract phone (priority: directDial > mobile > work > phone1)
        if (!lead.phone) {
          if (ed.directDialPhone) {
            updateData.phone = ed.directDialPhone;
            updateData.phoneVerified = true;
            updateData.phoneConfidence = 0.9;
            hasUpdates = true;
            stats.phonesExtracted++;
            console.log(`   ✅ Extracted phone: ${ed.directDialPhone} (direct dial)`);
          } else if (ed.mobilePhone) {
            updateData.phone = ed.mobilePhone;
            updateData.phoneVerified = ed.mobilePhoneVerified || true;
            updateData.phoneConfidence = 0.85;
            hasUpdates = true;
            stats.phonesExtracted++;
            console.log(`   ✅ Extracted phone: ${ed.mobilePhone} (mobile)`);
          } else if (ed.workPhone) {
            updateData.phone = ed.workPhone;
            updateData.phoneVerified = ed.workPhoneVerified || true;
            updateData.phoneConfidence = 0.8;
            hasUpdates = true;
            stats.phonesExtracted++;
            console.log(`   ✅ Extracted phone: ${ed.workPhone} (work)`);
          } else if (ed.phone1) {
            updateData.phone = ed.phone1;
            updateData.phoneVerified = ed.phone1Verified || true;
            updateData.phoneConfidence = 0.75;
            hasUpdates = true;
            stats.phonesExtracted++;
            console.log(`   ✅ Extracted phone: ${ed.phone1} (${ed.phone1Type || 'unknown'})`);
          }
        }

        // Extract mobilePhone
        if (ed.mobilePhone && !lead.mobilePhone) {
          updateData.mobilePhone = ed.mobilePhone;
          hasUpdates = true;
        }

        // Extract workPhone
        if (ed.workPhone && !lead.workPhone) {
          updateData.workPhone = ed.workPhone;
          hasUpdates = true;
        }

        // Extract phone quality score
        if (ed.phoneDataQuality !== undefined && ed.phoneDataQuality > 0) {
          if (!lead.phoneQualityScore || lead.phoneQualityScore < (ed.phoneDataQuality / 100)) {
            updateData.phoneQualityScore = ed.phoneDataQuality / 100;
            hasUpdates = true;
          }
        }

        if (hasUpdates) {
          updateData.updatedAt = new Date();
          await prisma.people.update({
            where: { id: lead.id },
            data: updateData,
          });
          stats.processed++;
          console.log(`   ✅ Updated successfully`);
        } else {
          stats.skipped++;
          console.log(`   ⏭️  No updates needed (data already extracted)`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${lead.fullName}: ${error.message}`);
        stats.errors++;
      }
    }

    console.log("\n\n📊 EXTRACTION RESULTS");
    console.log("=====================");
    console.log(`Total leads with Lusha enrichedData: ${stats.total}`);
    console.log(`Processed: ${stats.processed}`);
    console.log(`Emails extracted: ${stats.emailsExtracted}`);
    console.log(`Phones extracted: ${stats.phonesExtracted}`);
    console.log(`Skipped (already extracted): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    console.log(`\n\n💡 NEXT STEPS`);
    console.log("=============");
    if (stats.processed > 0) {
      console.log(`✅ Extracted ${stats.emailsExtracted} emails and ${stats.phonesExtracted} phones from existing enrichedData`);
      console.log(`   No API calls needed - data was already there!`);
    }
    console.log(`\nIf you want fresh data, you can re-enrich by modifying the script to skip the 7-day check`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extractLushaDataFromEnriched()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

