#!/usr/bin/env node

/**
 * Audit the 19 leads missing emails
 * Check if Lusha has them, if Coresignal has them, and if waterfall system should find them
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

async function audit19MissingEmails() {
  console.log("🔍 AUDITING 19 LEADS MISSING EMAILS");
  console.log("====================================\n");

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

    // Get the 19 leads without email
    const missingEmailLeads = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
        linkedinUrl: { not: null },
        email: null,
        workEmail: null,
        personalEmail: null,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        coresignalData: true,
        enrichedData: true,
        dataSources: true,
        lastEnriched: true,
        company: {
          select: {
            name: true,
            domain: true,
          },
        },
      },
    });

    console.log(`Found ${missingEmailLeads.length} leads without email\n`);

    const stats = {
      total: missingEmailLeads.length,
      withCoresignalEmail: 0,
      withLushaEmail: 0,
      withEnrichedDataEmail: 0,
      noDataAnywhere: 0,
      details: [],
    };

    missingEmailLeads.forEach((lead, index) => {
      console.log(`\n${index + 1}. ${lead.fullName}`);
      console.log(`   LinkedIn: ${lead.linkedinUrl}`);
      console.log(`   Company: ${lead.company?.name || 'N/A'}`);
      console.log(`   Domain: ${lead.company?.domain || 'N/A'}`);
      console.log(`   Last Enriched: ${lead.lastEnriched ? new Date(lead.lastEnriched).toLocaleDateString() : 'Never'}`);
      console.log(`   Data Sources: ${lead.dataSources?.join(', ') || 'None'}`);

      let foundEmail = null;
      let emailSource = null;

      // Check Coresignal
      if (lead.coresignalData) {
        const csEmail = extractEmailFromCoresignal(lead.coresignalData);
        if (csEmail) {
          foundEmail = csEmail;
          emailSource = 'coresignal';
          stats.withCoresignalEmail++;
          console.log(`   ✅ CORESIGNAL HAS EMAIL: ${csEmail}`);
        } else {
          console.log(`   ❌ Coresignal: No email found`);
        }
      } else {
        console.log(`   ❌ Coresignal: No data`);
      }

      // Check Lusha (enrichedData)
      if (lead.enrichedData && typeof lead.enrichedData === 'object') {
        const ed = lead.enrichedData;
        if (ed.primaryEmail || ed.email) {
          const lushaEmail = ed.primaryEmail || ed.email;
          if (!foundEmail) {
            foundEmail = lushaEmail;
            emailSource = 'lusha';
            stats.withLushaEmail++;
            console.log(`   ✅ LUSHA HAS EMAIL: ${lushaEmail}`);
          } else {
            console.log(`   ✅ Lusha also has: ${lushaEmail} (but Coresignal found first)`);
          }
        } else {
          console.log(`   ❌ Lusha: No email in enrichedData`);
        }
      } else {
        console.log(`   ❌ Lusha: No enrichedData`);
      }

      // Check enrichedData for other email fields
      if (lead.enrichedData && typeof lead.enrichedData === 'object') {
        const ed = lead.enrichedData;
        if (ed.workEmail || ed.personalEmail || (ed.emails && ed.emails.length > 0)) {
          if (!foundEmail) {
            stats.withEnrichedDataEmail++;
            const altEmail = ed.workEmail || ed.personalEmail || ed.emails[0]?.email;
            foundEmail = altEmail;
            emailSource = 'enrichedData';
            console.log(`   ✅ ENRICHEDDATA HAS EMAIL: ${altEmail}`);
          }
        }
      }

      if (!foundEmail) {
        stats.noDataAnywhere++;
        console.log(`   ⚠️  NO EMAIL FOUND IN ANY SOURCE`);
      }

      stats.details.push({
        id: lead.id,
        fullName: lead.fullName,
        linkedinUrl: lead.linkedinUrl,
        company: lead.company?.name,
        domain: lead.company?.domain,
        emailFound: foundEmail,
        emailSource: emailSource,
        hasCoresignal: !!lead.coresignalData,
        hasLusha: !!(lead.enrichedData && typeof lead.enrichedData === 'object'),
        dataSources: lead.dataSources || [],
      });
    });

    console.log("\n\n📊 SUMMARY");
    console.log("==========");
    console.log(`Total leads without email: ${stats.total}`);
    console.log(`With email in Coresignal: ${stats.withCoresignalEmail} (${((stats.withCoresignalEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With email in Lusha: ${stats.withLushaEmail} (${((stats.withLushaEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`With email in enrichedData: ${stats.withEnrichedDataEmail} (${((stats.withEnrichedDataEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`No email in any source: ${stats.noDataAnywhere} (${((stats.noDataAnywhere / stats.total) * 100).toFixed(1)}%)`);

    if (stats.withCoresignalEmail > 0 || stats.withLushaEmail > 0 || stats.withEnrichedDataEmail > 0) {
      console.log(`\n⚠️  ISSUE FOUND: ${stats.withCoresignalEmail + stats.withLushaEmail + stats.withEnrichedDataEmail} leads have emails in data but not extracted!`);
      console.log(`   These emails need to be extracted from Coresignal/Lusha data`);
    }

    if (stats.noDataAnywhere > 0) {
      console.log(`\n📋 Leads with no email data available:`);
      stats.details.filter(d => !d.emailFound).forEach((item, i) => {
        console.log(`   ${i + 1}. ${item.fullName} (${item.company || 'N/A'})`);
      });
    }

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

audit19MissingEmails()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });



