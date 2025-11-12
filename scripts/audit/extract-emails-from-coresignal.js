#!/usr/bin/env node

/**
 * Extract emails from Coresignal data for leads that don't have emails
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

async function extractEmailsFromCoresignal() {
  console.log("🔍 EXTRACTING EMAILS FROM CORESIGNAL DATA");
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
        enrichedData: true,
        linkedinUrl: true,
      },
    });

    console.log(`Found ${leadsWithoutEmail.length} leads without email but with Coresignal data\n`);

    const results = {
      total: leadsWithoutEmail.length,
      withEmailInCoresignal: 0,
      emailsFound: [],
      noEmailInCoresignal: [],
    };

    leadsWithoutEmail.forEach((lead) => {
      const email = extractEmailFromCoresignal(lead.coresignalData);
      
      if (email) {
        results.withEmailInCoresignal++;
        results.emailsFound.push({
          id: lead.id,
          fullName: lead.fullName,
          email: email,
          linkedinUrl: lead.linkedinUrl,
          source: 'coresignal',
        });
      } else {
        results.noEmailInCoresignal.push({
          id: lead.id,
          fullName: lead.fullName,
          linkedinUrl: lead.linkedinUrl,
        });
      }
    });

    console.log("📊 RESULTS");
    console.log("==========");
    console.log(`Total leads checked: ${results.total}`);
    console.log(`Leads with email in Coresignal: ${results.withEmailInCoresignal} (${((results.withEmailInCoresignal / results.total) * 100).toFixed(1)}%)`);
    console.log(`Leads without email in Coresignal: ${results.noEmailInCoresignal.length}`);

    if (results.emailsFound.length > 0) {
      console.log(`\n✅ FOUND ${results.emailsFound.length} EMAILS THAT CAN BE EXTRACTED!\n`);
      console.log("Sample emails found (first 20):");
      results.emailsFound.slice(0, 20).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.fullName}: ${item.email}`);
      });
      
      if (results.emailsFound.length > 20) {
        console.log(`  ... and ${results.emailsFound.length - 20} more`);
      }
    }

    if (results.noEmailInCoresignal.length > 0) {
      console.log(`\n⚠️  ${results.noEmailInCoresignal.length} leads have Coresignal data but no email found:`);
      results.noEmailInCoresignal.slice(0, 10).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.fullName}`);
      });
    }

    console.log(`\n\n💡 RECOMMENDATION`);
    console.log("==================");
    if (results.withEmailInCoresignal > 0) {
      console.log(`✅ Found ${results.withEmailInCoresignal} emails in Coresignal data that need to be extracted and saved to the email field.`);
      console.log(`   Create a migration script to update these leads with their Coresignal emails.`);
    } else {
      console.log(`⚠️  No emails found in Coresignal data. The enrichment may not have found emails for these leads.`);
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extractEmailsFromCoresignal()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

