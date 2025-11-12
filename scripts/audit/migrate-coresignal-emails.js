#!/usr/bin/env node

/**
 * Migrate emails from Coresignal data to email fields
 * Extracts emails from coresignalData and saves them to the email field
 */

const { PrismaClient } = require("@prisma/client");

const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

function extractEmailFromCoresignal(coresignalData) {
  if (!coresignalData || typeof coresignalData !== 'object') {
    return null;
  }

  // Priority order:
  // 1. primary_professional_email
  // 2. professional_emails_collection (first item)
  // 3. email (if exists)
  
  if (coresignalData.primary_professional_email) {
    return coresignalData.primary_professional_email;
  }
  
  if (coresignalData.professional_emails_collection && Array.isArray(coresignalData.professional_emails_collection)) {
    const firstEmail = coresignalData.professional_emails_collection[0];
    if (firstEmail && firstEmail.professional_email) {
      return firstEmail.professional_email;
    }
  }
  
  if (coresignalData.email) {
    return coresignalData.email;
  }
  
  return null;
}

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

function isTempEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const tempPatterns = [
    '@coresignal.temp',
    '@temp.',
    'placeholder',
    'example.com',
    'test.com',
    'fake.com'
  ];
  const lowerEmail = email.toLowerCase();
  return tempPatterns.some(pattern => lowerEmail.includes(pattern));
}

async function migrateCoresignalEmails() {
  console.log("🔄 MIGRATING EMAILS FROM CORESIGNAL DATA");
  console.log("=========================================\n");

  try {
    // Find Dan user and workspace
    const danUser = await prisma.users.findFirst({
      where: { email: "dan@adrata.com" },
    });

    if (!danUser) {
      throw new Error("Dan user not found");
    }

    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [{ id: "adrata" }, { slug: "adrata" }, { name: "adrata" }],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("Adrata workspace not found");
    }

    // Get all leads without email but with Coresignal data
    const leadsWithoutEmail = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        email: null,
        coresignalData: { not: null },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        coresignalData: true,
        linkedinUrl: true,
      },
    });

    console.log(`Found ${leadsWithoutEmail.length} leads without email but with Coresignal data\n`);

    const stats = {
      total: leadsWithoutEmail.length,
      emailsExtracted: 0,
      emailsUpdated: 0,
      skipped: 0,
      errors: 0,
    };

    const updates = [];

    for (const lead of leadsWithoutEmail) {
      try {
        const email = extractEmailFromCoresignal(lead.coresignalData);
        
        if (!email) {
          stats.skipped++;
          continue;
        }

        // Validate email
        if (!isValidEmail(email) || isTempEmail(email)) {
          console.log(`  ⚠️  Skipping ${lead.fullName}: Invalid or temp email (${email})`);
          stats.skipped++;
          continue;
        }

        // Update the lead
        await prisma.people.update({
          where: { id: lead.id },
          data: {
            email: email,
            emailVerified: true, // Mark as verified since it came from Coresignal
            updatedAt: new Date(),
          },
        });

        stats.emailsExtracted++;
        stats.emailsUpdated++;
        updates.push({
          id: lead.id,
          fullName: lead.fullName,
          email: email,
        });

        console.log(`  ✅ Updated ${lead.fullName}: ${email}`);

      } catch (error) {
        console.error(`  ❌ Error updating ${lead.fullName}: ${error.message}`);
        stats.errors++;
      }
    }

    console.log("\n\n📊 MIGRATION RESULTS");
    console.log("====================");
    console.log(`Total leads checked: ${stats.total}`);
    console.log(`Emails extracted: ${stats.emailsExtracted}`);
    console.log(`Leads updated: ${stats.emailsUpdated}`);
    console.log(`Skipped (no email in Coresignal): ${stats.skipped}`);
    console.log(`Errors: ${stats.errors}`);

    if (updates.length > 0) {
      console.log(`\n✅ Successfully migrated ${updates.length} emails from Coresignal data!`);
      console.log(`\nSample updates (first 10):`);
      updates.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.fullName}: ${item.email}`);
      });
    }

    console.log(`\n\n💡 NEXT STEPS`);
    console.log("=============");
    console.log(`1. ✅ ${stats.emailsUpdated} emails have been extracted and saved`);
    console.log(`2. Run the audit script again to verify: node scripts/audit/audit-dan-lead-enrichment.js`);
    console.log(`3. For the remaining ${stats.skipped} leads, run Lusha enrichment to find emails`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration (removed confirmation for automation)
migrateCoresignalEmails()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

