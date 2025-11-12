#!/usr/bin/env node

/**
 * 📊 COMPREHENSIVE LEAD ENRICHMENT AUDIT FOR DAN'S WORKSPACE
 * 
 * This script audits lead enrichment data in Dan's adrata workspace to determine:
 * 1. If email data exists but isn't displaying correctly
 * 2. If email data exists but isn't being piped in properly
 * 3. If enrichment needs to be run (Lusha/Coresignal)
 * 
 * Checks all email sources:
 * - Database fields: email, workEmail, personalEmail
 * - customFields.coresignalData
 * - customFields.enrichedData
 * - customFields.lushaData
 */

const { PrismaClient } = require("@prisma/client");

// Use production database URL from environment or default
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
  datasources: { db: { url: DATABASE_URL } },
  log: ["error", "warn"],
});

// Helper function to validate email format
function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// Helper function to check if email is a temp/fake email
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

// Helper function to extract email from customFields
function extractEmailFromCustomFields(customFields) {
  const emails = {
    coresignal: null,
    enrichedData: null,
    lusha: null,
    other: []
  };

  if (!customFields || typeof customFields !== 'object') {
    return emails;
  }

  // Check coresignalData
  if (customFields.coresignalData) {
    const cs = customFields.coresignalData;
    emails.coresignal = cs.primary_professional_email || 
                       cs.email || 
                       cs.work_email ||
                       (cs.professional_emails_collection && cs.professional_emails_collection[0]?.professional_email) ||
                       null;
  }

  // Check coresignal (alternative key)
  if (customFields.coresignal) {
    const cs = customFields.coresignal;
    if (!emails.coresignal) {
      emails.coresignal = cs.primary_professional_email || 
                         cs.email || 
                         cs.work_email ||
                         null;
    }
  }

  // Check enrichedData
  if (customFields.enrichedData) {
    const ed = customFields.enrichedData;
    emails.enrichedData = ed.email || 
                         ed.workEmail || 
                         ed.personalEmail ||
                         (ed.contact && ed.contact.email) ||
                         null;
  }

  // Check lushaData
  if (customFields.lushaData) {
    const ld = customFields.lushaData;
    emails.lusha = ld.email || 
                  (ld.contact && ld.contact.email) ||
                  null;
  }

  // Check for any other email fields in customFields
  Object.keys(customFields).forEach(key => {
    if (key.toLowerCase().includes('email') && typeof customFields[key] === 'string') {
      if (!emails.other.includes(customFields[key])) {
        emails.other.push(customFields[key]);
      }
    }
  });

  return emails;
}

async function auditDanLeadEnrichment() {
  console.log("📊 COMPREHENSIVE LEAD ENRICHMENT AUDIT FOR DAN'S WORKSPACE");
  console.log("===========================================================");
  console.log("");

  try {
    // Step 1: Find Dan user
    console.log("👤 Step 1: Finding Dan user...");
    let danUser = await prisma.users.findFirst({
      where: {
        email: "dan@adrata.com",
      },
    });

    if (!danUser) {
      danUser = await prisma.users.findFirst({
        where: {
          OR: [
            { id: "dan" },
            { firstName: "dan" },
            { name: { contains: "dan", mode: "insensitive" } },
          ],
        },
      });
    }

    if (!danUser) {
      const allDanUsers = await prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: "dan", mode: "insensitive" } },
            { firstName: { contains: "dan", mode: "insensitive" } },
          ],
        },
        take: 10,
      });

      if (allDanUsers.length > 0) {
        danUser = allDanUsers.find(u => u.email === "dan@adrata.com") || allDanUsers[0];
      }
    }

    if (!danUser) {
      throw new Error("❌ Dan user not found in database");
    }

    console.log(`✅ Using Dan user: ${danUser.email || danUser.name} (ID: ${danUser.id})`);

    // Step 2: Find Adrata workspace
    console.log("\n🏢 Step 2: Finding Adrata workspace...");
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { id: "adrata" },
          { slug: "adrata" },
          { name: "adrata" },
          { name: "Adrata" },
        ],
      },
    });

    if (!adrataWorkspace) {
      throw new Error("❌ Adrata workspace not found in database");
    }

    console.log(`✅ Found Adrata workspace: ${adrataWorkspace.name} (ID: ${adrataWorkspace.id})`);

    // Step 3: Get all leads (people with status LEAD or all people assigned to Dan)
    console.log("\n📋 Step 3: Fetching all leads...");
    
    const allLeads = await prisma.people.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        mainSellerId: danUser.id,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        linkedinUrl: true,
        phone: true,
        emailVerified: true,
        phoneVerified: true,
        lastEnriched: true,
        dataSources: true,
        customFields: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`✅ Found ${allLeads.length} leads assigned to Dan`);

    // Step 4: Analyze email data
    console.log("\n📧 Step 4: Analyzing email data...");
    
    const stats = {
      total: allLeads.length,
      withLinkedIn: 0,
      withEmail: {
        direct: 0,
        workEmail: 0,
        personalEmail: 0,
        coresignal: 0,
        enrichedData: 0,
        lusha: 0,
        customFieldsOther: 0,
      },
      emailAccuracy: {
        valid: 0,
        temp: 0,
        invalid: 0,
        verified: 0,
        unverified: 0,
      },
      enrichmentStatus: {
        enriched: 0,
        notEnriched: 0,
        stale: 0, // > 30 days old
      },
      hiddenEmails: [], // Emails in customFields but not in main fields
      readyForEnrichment: [], // Has LinkedIn, no email
      needsVerification: [], // Has email but not verified
    };

    allLeads.forEach((lead) => {
      // Check LinkedIn
      if (lead.linkedinUrl) {
        stats.withLinkedIn++;
      }

      // Check all email sources
      const customEmails = extractEmailFromCustomFields(lead.customFields);
      let hasAnyEmail = false;
      let bestEmail = null;
      let emailSource = null;

      // Priority order: direct email > workEmail > personalEmail > coresignal > enrichedData > lusha
      if (lead.email && isValidEmail(lead.email) && !isTempEmail(lead.email)) {
        stats.withEmail.direct++;
        hasAnyEmail = true;
        bestEmail = lead.email;
        emailSource = 'direct';
      } else if (lead.workEmail && isValidEmail(lead.workEmail) && !isTempEmail(lead.workEmail)) {
        stats.withEmail.workEmail++;
        hasAnyEmail = true;
        bestEmail = lead.workEmail;
        emailSource = 'workEmail';
      } else if (lead.personalEmail && isValidEmail(lead.personalEmail) && !isTempEmail(lead.personalEmail)) {
        stats.withEmail.personalEmail++;
        hasAnyEmail = true;
        bestEmail = lead.personalEmail;
        emailSource = 'personalEmail';
      } else if (customEmails.coresignal && isValidEmail(customEmails.coresignal) && !isTempEmail(customEmails.coresignal)) {
        stats.withEmail.coresignal++;
        hasAnyEmail = true;
        bestEmail = customEmails.coresignal;
        emailSource = 'coresignal';
      } else if (customEmails.enrichedData && isValidEmail(customEmails.enrichedData) && !isTempEmail(customEmails.enrichedData)) {
        stats.withEmail.enrichedData++;
        hasAnyEmail = true;
        bestEmail = customEmails.enrichedData;
        emailSource = 'enrichedData';
      } else if (customEmails.lusha && isValidEmail(customEmails.lusha) && !isTempEmail(customEmails.lusha)) {
        stats.withEmail.lusha++;
        hasAnyEmail = true;
        bestEmail = customEmails.lusha;
        emailSource = 'lusha';
      }

      // Check for hidden emails (in customFields but not in main fields)
      if (!hasAnyEmail && (customEmails.coresignal || customEmails.enrichedData || customEmails.lusha)) {
        stats.hiddenEmails.push({
          id: lead.id,
          fullName: lead.fullName,
          linkedinUrl: lead.linkedinUrl,
          emailInCustomFields: customEmails.coresignal || customEmails.enrichedData || customEmails.lusha,
          source: customEmails.coresignal ? 'coresignal' : (customEmails.enrichedData ? 'enrichedData' : 'lusha'),
        });
        stats.withEmail.customFieldsOther++;
      }

      // Check email accuracy
      if (bestEmail) {
        if (isTempEmail(bestEmail)) {
          stats.emailAccuracy.temp++;
        } else if (isValidEmail(bestEmail)) {
          stats.emailAccuracy.valid++;
        } else {
          stats.emailAccuracy.invalid++;
        }

        if (lead.emailVerified) {
          stats.emailAccuracy.verified++;
        } else {
          stats.emailAccuracy.unverified++;
          if (bestEmail) {
            stats.needsVerification.push({
              id: lead.id,
              fullName: lead.fullName,
              email: bestEmail,
              emailSource: emailSource,
              linkedinUrl: lead.linkedinUrl,
            });
          }
        }
      }

      // Check enrichment status
      if (lead.lastEnriched) {
        const daysSinceEnrichment = (Date.now() - new Date(lead.lastEnriched).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceEnrichment > 30) {
          stats.enrichmentStatus.stale++;
        } else {
          stats.enrichmentStatus.enriched++;
        }
      } else {
        stats.enrichmentStatus.notEnriched++;
      }

      // Check if ready for enrichment (has LinkedIn, no email)
      if (lead.linkedinUrl && !hasAnyEmail) {
        stats.readyForEnrichment.push({
          id: lead.id,
          fullName: lead.fullName,
          linkedinUrl: lead.linkedinUrl,
          company: lead.company?.name || null,
          lastEnriched: lead.lastEnriched,
          dataSources: lead.dataSources || [],
        });
      }
    });

    // Step 5: Display results
    console.log("\n📊 AUDIT RESULTS");
    console.log("================");
    
    console.log(`\n📈 OVERVIEW:`);
    console.log(`   Total Leads: ${stats.total}`);
    console.log(`   Leads with LinkedIn URL: ${stats.withLinkedIn} (${((stats.withLinkedIn / stats.total) * 100).toFixed(1)}%)`);

    console.log(`\n📧 EMAIL AVAILABILITY:`);
    const totalWithEmail = stats.withEmail.direct + stats.withEmail.workEmail + stats.withEmail.personalEmail + 
                          stats.withEmail.coresignal + stats.withEmail.enrichedData + stats.withEmail.lusha + 
                          stats.withEmail.customFieldsOther;
    console.log(`   Total with Email: ${totalWithEmail} (${((totalWithEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`   - Direct email field: ${stats.withEmail.direct}`);
    console.log(`   - workEmail field: ${stats.withEmail.workEmail}`);
    console.log(`   - personalEmail field: ${stats.withEmail.personalEmail}`);
    console.log(`   - Coresignal (customFields): ${stats.withEmail.coresignal}`);
    console.log(`   - EnrichedData (customFields): ${stats.withEmail.enrichedData}`);
    console.log(`   - Lusha (customFields): ${stats.withEmail.lusha}`);
    console.log(`   - Other customFields: ${stats.withEmail.customFieldsOther}`);

    console.log(`\n✅ EMAIL ACCURACY:`);
    console.log(`   Valid emails: ${stats.emailAccuracy.valid} (${((stats.emailAccuracy.valid / totalWithEmail) * 100).toFixed(1)}% of emails)`);
    console.log(`   Temp/fake emails: ${stats.emailAccuracy.temp}`);
    console.log(`   Invalid format: ${stats.emailAccuracy.invalid}`);
    console.log(`   Verified: ${stats.emailAccuracy.verified} (${((stats.emailAccuracy.verified / totalWithEmail) * 100).toFixed(1)}% of emails)`);
    console.log(`   Unverified: ${stats.emailAccuracy.unverified} (${((stats.emailAccuracy.unverified / totalWithEmail) * 100).toFixed(1)}% of emails)`);

    console.log(`\n🔄 ENRICHMENT STATUS:`);
    console.log(`   Recently enriched (< 30 days): ${stats.enrichmentStatus.enriched}`);
    console.log(`   Stale enrichment (> 30 days): ${stats.enrichmentStatus.stale}`);
    console.log(`   Never enriched: ${stats.enrichmentStatus.notEnriched}`);

    console.log(`\n🔍 KEY FINDINGS:`);
    console.log(`   Leads with LinkedIn but no email: ${stats.readyForEnrichment.length}`);
    console.log(`   Leads with hidden email data (in customFields, not displayed): ${stats.hiddenEmails.length}`);
    console.log(`   Leads with email but not verified: ${stats.needsVerification.length}`);

    // Show sample of leads ready for enrichment
    if (stats.readyForEnrichment.length > 0) {
      console.log(`\n📋 Sample Leads Ready for Enrichment (first 10):`);
      stats.readyForEnrichment.slice(0, 10).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.fullName}`);
        console.log(`      LinkedIn: ${lead.linkedinUrl}`);
        console.log(`      Company: ${lead.company || 'N/A'}`);
        console.log(`      Last Enriched: ${lead.lastEnriched ? new Date(lead.lastEnriched).toLocaleDateString() : 'Never'}`);
        console.log(`      Data Sources: ${lead.dataSources?.join(', ') || 'None'}`);
      });
    }

    // Show sample of leads with hidden emails
    if (stats.hiddenEmails.length > 0) {
      console.log(`\n📋 Sample Leads with Hidden Email Data (first 10):`);
      stats.hiddenEmails.slice(0, 10).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.fullName}`);
        console.log(`      Email in ${lead.source}: ${lead.emailInCustomFields}`);
        console.log(`      LinkedIn: ${lead.linkedinUrl || 'N/A'}`);
        console.log(`      ⚠️  This email exists but may not be displaying in UI`);
      });
    }

    // Show sample of leads needing verification
    if (stats.needsVerification.length > 0) {
      console.log(`\n📋 Sample Leads Needing Email Verification (first 10):`);
      stats.needsVerification.slice(0, 10).forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.fullName}`);
        console.log(`      Email (${lead.emailSource}): ${lead.email}`);
        console.log(`      LinkedIn: ${lead.linkedinUrl || 'N/A'}`);
      });
    }

    // Step 6: Generate recommendations
    console.log(`\n💡 RECOMMENDATIONS`);
    console.log("==================");

    const recommendations = [];

    if (stats.hiddenEmails.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Hidden Email Data',
        count: stats.hiddenEmails.length,
        description: `Found ${stats.hiddenEmails.length} leads with email data in customFields that may not be displaying in the UI.`,
        action: 'Update ProspectOverviewTab.tsx to check workEmail, personalEmail, and customFields email sources.',
        files: ['src/frontend/components/pipeline/tabs/ProspectOverviewTab.tsx'],
      });
    }

    if (stats.readyForEnrichment.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Missing Email Data',
        count: stats.readyForEnrichment.length,
        description: `Found ${stats.readyForEnrichment.length} leads with LinkedIn URLs but no email. These are ready for enrichment.`,
        action: 'Run Lusha/Coresignal enrichment for these leads using their LinkedIn URLs.',
        scripts: ['scripts/enrich-cloudcaddie-contacts.js', 'scripts/enrich-top-people-comprehensive.js'],
      });
    }

    if (stats.needsVerification.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Unverified Emails',
        count: stats.needsVerification.length,
        description: `Found ${stats.needsVerification.length} leads with emails that are not verified.`,
        action: 'Run email verification for these leads to improve accuracy.',
        scripts: ['scripts/batch-enrichment/enrich-workspace.js'],
      });
    }

    if (stats.emailAccuracy.temp > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Temp/Fake Emails',
        count: stats.emailAccuracy.temp,
        description: `Found ${stats.emailAccuracy.temp} leads with temp/fake emails (e.g., @coresignal.temp).`,
        action: 'Replace temp emails with real emails from Coresignal/Lusha enrichment.',
      });
    }

    if (stats.enrichmentStatus.notEnriched > 0 || stats.enrichmentStatus.stale > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: 'Stale or Missing Enrichment',
        count: stats.enrichmentStatus.notEnriched + stats.enrichmentStatus.stale,
        description: `Found ${stats.enrichmentStatus.notEnriched} leads never enriched and ${stats.enrichmentStatus.stale} with stale enrichment (> 30 days).`,
        action: 'Run periodic enrichment refresh to keep data current.',
      });
    }

    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. [${rec.priority}] ${rec.issue} (${rec.count} leads)`);
      console.log(`   ${rec.description}`);
      console.log(`   Action: ${rec.action}`);
      if (rec.files) {
        console.log(`   Files to update: ${rec.files.join(', ')}`);
      }
      if (rec.scripts) {
        console.log(`   Scripts available: ${rec.scripts.join(', ')}`);
      }
    });

    // Summary
    console.log(`\n📊 SUMMARY`);
    console.log("===========");
    console.log(`Total Leads: ${stats.total}`);
    console.log(`Leads with LinkedIn: ${stats.withLinkedIn} (${((stats.withLinkedIn / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Leads with Email: ${totalWithEmail} (${((totalWithEmail / stats.total) * 100).toFixed(1)}%)`);
    console.log(`Accurate Emails (valid + verified): ${stats.emailAccuracy.valid} (${((stats.emailAccuracy.valid / stats.total) * 100).toFixed(1)}% of total)`);
    console.log(`\nKey Issues:`);
    console.log(`- ${stats.hiddenEmails.length} leads with hidden email data`);
    console.log(`- ${stats.readyForEnrichment.length} leads ready for enrichment`);
    console.log(`- ${stats.needsVerification.length} leads need email verification`);

    console.log("\n✅ Audit complete!");

  } catch (error) {
    console.error("\n❌ Error during audit:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
auditDanLeadEnrichment()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });

