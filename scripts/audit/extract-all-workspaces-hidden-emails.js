#!/usr/bin/env node

/**
 * Extract hidden emails from Coresignal/Lusha data for ALL workspaces
 * Fixes the systemic issue across all workspaces
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

async function extractAllWorkspacesHiddenEmails() {
  console.log("🔄 EXTRACTING HIDDEN EMAILS FOR ALL WORKSPACES");
  console.log("==============================================\n");

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    const allStats = {
      workspaces: [],
      totalExtracted: 0,
      totalProcessed: 0,
    };

    for (const workspace of workspaces) {
      console.log(`\n📊 Processing ${workspace.name}...`);

      // Get people without email but with enrichment data
      const peopleWithoutEmail = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          linkedinUrl: { not: null },
          email: null,
          workEmail: null,
          personalEmail: null,
          OR: [
            { coresignalData: { not: null } },
            { enrichedData: { not: null } },
          ],
        },
        select: {
          id: true,
          fullName: true,
          coresignalData: true,
          enrichedData: true,
        },
      });

      const workspaceStats = {
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        total: peopleWithoutEmail.length,
        extracted: 0,
        errors: 0,
      };

      for (const person of peopleWithoutEmail) {
        try {
          let email = null;
          let emailSource = null;

          // Check Coresignal
          const csEmail = extractEmailFromCoresignal(person.coresignalData);
          if (csEmail && isValidEmail(csEmail) && !isTempEmail(csEmail)) {
            email = csEmail;
            emailSource = 'coresignal';
          }

          // Check Lusha (enrichedData)
          if (!email && person.enrichedData && typeof person.enrichedData === 'object') {
            const ed = person.enrichedData;
            if (ed.primaryEmail || ed.email) {
              const lushaEmail = ed.primaryEmail || ed.email;
              if (isValidEmail(lushaEmail) && !isTempEmail(lushaEmail)) {
                email = lushaEmail;
                emailSource = 'lusha';
              }
            }
          }

          if (email) {
            await prisma.people.update({
              where: { id: person.id },
              data: {
                email: email,
                emailVerified: true,
                updatedAt: new Date(),
              },
            });

            workspaceStats.extracted++;
            allStats.totalExtracted++;
            console.log(`   ✅ ${person.fullName}: ${email} (${emailSource})`);
          }

        } catch (error) {
          workspaceStats.errors++;
          console.error(`   ❌ Error processing ${person.fullName}: ${error.message}`);
        }
      }

      allStats.totalProcessed += workspaceStats.total;
      allStats.workspaces.push(workspaceStats);

      if (workspaceStats.extracted > 0) {
        console.log(`   ✅ Extracted ${workspaceStats.extracted} emails for ${workspace.name}`);
      }
    }

    // Summary
    console.log("\n\n📊 EXTRACTION SUMMARY");
    console.log("====================");
    console.log(`Total workspaces processed: ${workspaces.length}`);
    console.log(`Total people checked: ${allStats.totalProcessed}`);
    console.log(`Total emails extracted: ${allStats.totalExtracted}`);

    console.log(`\n\n📋 BY WORKSPACE:`);
    allStats.workspaces
      .filter(ws => ws.extracted > 0)
      .sort((a, b) => b.extracted - a.extracted)
      .forEach(ws => {
        console.log(`   ${ws.workspaceName}: ${ws.extracted} emails extracted`);
      });

    console.log(`\n\n✅ All hidden emails have been extracted!`);

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

extractAllWorkspacesHiddenEmails()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });




