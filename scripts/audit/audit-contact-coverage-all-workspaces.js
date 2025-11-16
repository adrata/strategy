#!/usr/bin/env node

/**
 * Comprehensive audit of contact coverage (LinkedIn, Email, Phone) across all workspaces
 * Verifies data is properly extracted from Coresignal/Lusha, not just stored in JSON fields
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

function extractPhoneFromCoresignal(coresignalData) {
  if (!coresignalData || typeof coresignalData !== 'object') {
    return null;
  }
  if (coresignalData.phone) {
    return coresignalData.phone;
  }
  if (coresignalData.phone_numbers && Array.isArray(coresignalData.phone_numbers)) {
    const firstPhone = coresignalData.phone_numbers[0];
    if (firstPhone && firstPhone.phone_number) {
      return firstPhone.phone_number;
    }
  }
  return null;
}

function extractEmailFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  if (enrichedData.primaryEmail) {
    return enrichedData.primaryEmail;
  }
  if (enrichedData.email) {
    return enrichedData.email;
  }
  if (enrichedData.workEmail) {
    return enrichedData.workEmail;
  }
  if (enrichedData.emails && Array.isArray(enrichedData.emails) && enrichedData.emails.length > 0) {
    return enrichedData.emails[0].email;
  }
  return null;
}

function extractPhoneFromLusha(enrichedData) {
  if (!enrichedData || typeof enrichedData !== 'object') {
    return null;
  }
  // Priority: directDialPhone > mobilePhone > workPhone > phone1
  if (enrichedData.directDialPhone) {
    return enrichedData.directDialPhone;
  }
  if (enrichedData.mobilePhone) {
    return enrichedData.mobilePhone;
  }
  if (enrichedData.workPhone) {
    return enrichedData.workPhone;
  }
  if (enrichedData.phone1) {
    return enrichedData.phone1;
  }
  if (enrichedData.phones && Array.isArray(enrichedData.phones) && enrichedData.phones.length > 0) {
    return enrichedData.phones[0].number;
  }
  return null;
}

async function auditContactCoverageAllWorkspaces() {
  console.log("🔍 COMPREHENSIVE CONTACT COVERAGE AUDIT - ALL WORKSPACES");
  console.log("=======================================================\n");

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

    const allWorkspaceStats = {
      workspaces: [],
      totals: {
        totalPeople: 0,
        withLinkedIn: 0,
        withEmail: 0,
        withPhone: 0,
        withAnyContact: 0,
        hiddenEmails: 0,
        hiddenPhones: 0,
      },
    };

    for (const workspace of workspaces) {
      console.log(`\n📊 ${workspace.name} (${workspace.slug || workspace.id})`);
      console.log("=".repeat(70));

      // Get all people in workspace
      const allPeople = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
        },
        select: {
          id: true,
          linkedinUrl: true,
          email: true,
          workEmail: true,
          personalEmail: true,
          phone: true,
          mobilePhone: true,
          workPhone: true,
          coresignalData: true,
          enrichedData: true,
          dataSources: true,
        },
      });

      const stats = {
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        totalPeople: allPeople.length,
        withLinkedIn: 0,
        withEmail: 0,
        withPhone: 0,
        withAnyContact: 0,
        hiddenEmails: 0,
        hiddenPhones: 0,
        extractionIssues: [],
      };

      // Analyze each person
      for (const person of allPeople) {
        let hasLinkedIn = !!person.linkedinUrl;
        let hasEmail = !!(person.email || person.workEmail || person.personalEmail);
        let hasPhone = !!(person.phone || person.mobilePhone || person.workPhone);
        let hasAnyContact = hasLinkedIn || hasEmail || hasPhone;

        // Check for hidden data
        if (!hasEmail) {
          const csEmail = extractEmailFromCoresignal(person.coresignalData);
          const lushaEmail = extractEmailFromLusha(person.enrichedData);
          if (csEmail || lushaEmail) {
            stats.hiddenEmails++;
            stats.extractionIssues.push({
              personId: person.id,
              type: 'email',
              source: csEmail ? 'coresignal' : 'lusha',
            });
          }
        }

        if (!hasPhone) {
          const csPhone = extractPhoneFromCoresignal(person.coresignalData);
          const lushaPhone = extractPhoneFromLusha(person.enrichedData);
          if (csPhone || lushaPhone) {
            stats.hiddenPhones++;
            stats.extractionIssues.push({
              personId: person.id,
              type: 'phone',
              source: csPhone ? 'coresignal' : 'lusha',
            });
          }
        }

        // Count coverage
        if (hasLinkedIn) stats.withLinkedIn++;
        if (hasEmail) stats.withEmail++;
        if (hasPhone) stats.withPhone++;
        if (hasAnyContact) stats.withAnyContact++;
      }

      // Calculate percentages
      stats.linkedInCoverage = stats.totalPeople > 0 
        ? ((stats.withLinkedIn / stats.totalPeople) * 100).toFixed(1) 
        : '0.0';
      stats.emailCoverage = stats.totalPeople > 0 
        ? ((stats.withEmail / stats.totalPeople) * 100).toFixed(1) 
        : '0.0';
      stats.phoneCoverage = stats.totalPeople > 0 
        ? ((stats.withPhone / stats.totalPeople) * 100).toFixed(1) 
        : '0.0';
      stats.anyContactCoverage = stats.totalPeople > 0 
        ? ((stats.withAnyContact / stats.totalPeople) * 100).toFixed(1) 
        : '0.0';

      allWorkspaceStats.workspaces.push(stats);
      allWorkspaceStats.totals.totalPeople += stats.totalPeople;
      allWorkspaceStats.totals.withLinkedIn += stats.withLinkedIn;
      allWorkspaceStats.totals.withEmail += stats.withEmail;
      allWorkspaceStats.totals.withPhone += stats.withPhone;
      allWorkspaceStats.totals.withAnyContact += stats.withAnyContact;
      allWorkspaceStats.totals.hiddenEmails += stats.hiddenEmails;
      allWorkspaceStats.totals.hiddenPhones += stats.hiddenPhones;

      // Display workspace stats
      console.log(`   Total People: ${stats.totalPeople}`);
      console.log(`   LinkedIn: ${stats.withLinkedIn} (${stats.linkedInCoverage}%)`);
      console.log(`   Email: ${stats.withEmail} (${stats.emailCoverage}%)`);
      console.log(`   Phone: ${stats.withPhone} (${stats.phoneCoverage}%)`);
      console.log(`   Any Contact: ${stats.withAnyContact} (${stats.anyContactCoverage}%)`);
      
      if (stats.hiddenEmails > 0 || stats.hiddenPhones > 0) {
        console.log(`   ⚠️  EXTRACTION ISSUES:`);
        if (stats.hiddenEmails > 0) {
          console.log(`      - ${stats.hiddenEmails} hidden emails in Coresignal/Lusha data`);
        }
        if (stats.hiddenPhones > 0) {
          console.log(`      - ${stats.hiddenPhones} hidden phones in Coresignal/Lusha data`);
        }
      } else {
        console.log(`   ✅ All data properly extracted`);
      }
    }

    // Overall Summary
    console.log("\n\n📊 OVERALL SUMMARY - ALL WORKSPACES");
    console.log("=====================================");
    
    const totalPeople = allWorkspaceStats.totals.totalPeople;
    const overallLinkedIn = totalPeople > 0 
      ? ((allWorkspaceStats.totals.withLinkedIn / totalPeople) * 100).toFixed(1) 
      : '0.0';
    const overallEmail = totalPeople > 0 
      ? ((allWorkspaceStats.totals.withEmail / totalPeople) * 100).toFixed(1) 
      : '0.0';
    const overallPhone = totalPeople > 0 
      ? ((allWorkspaceStats.totals.withPhone / totalPeople) * 100).toFixed(1) 
      : '0.0';
    const overallAnyContact = totalPeople > 0 
      ? ((allWorkspaceStats.totals.withAnyContact / totalPeople) * 100).toFixed(1) 
      : '0.0';

    console.log(`Total People (all workspaces): ${totalPeople.toLocaleString()}`);
    console.log(`LinkedIn Coverage: ${allWorkspaceStats.totals.withLinkedIn.toLocaleString()} (${overallLinkedIn}%)`);
    console.log(`Email Coverage: ${allWorkspaceStats.totals.withEmail.toLocaleString()} (${overallEmail}%)`);
    console.log(`Phone Coverage: ${allWorkspaceStats.totals.withPhone.toLocaleString()} (${overallPhone}%)`);
    console.log(`Any Contact Coverage: ${allWorkspaceStats.totals.withAnyContact.toLocaleString()} (${overallAnyContact}%)`);

    if (allWorkspaceStats.totals.hiddenEmails > 0 || allWorkspaceStats.totals.hiddenPhones > 0) {
      console.log(`\n⚠️  EXTRACTION ISSUES FOUND:`);
      console.log(`   Hidden Emails: ${allWorkspaceStats.totals.hiddenEmails}`);
      console.log(`   Hidden Phones: ${allWorkspaceStats.totals.hiddenPhones}`);
      console.log(`   Action: Run extraction scripts to fix these issues`);
    } else {
      console.log(`\n✅ All contact data properly extracted from Coresignal/Lusha!`);
    }

    // Workspaces with issues
    const workspacesWithIssues = allWorkspaceStats.workspaces.filter(ws => 
      ws.hiddenEmails > 0 || ws.hiddenPhones > 0
    );

    if (workspacesWithIssues.length > 0) {
      console.log(`\n\n📋 WORKSPACES WITH EXTRACTION ISSUES`);
      console.log("====================================");
      workspacesWithIssues
        .sort((a, b) => (b.hiddenEmails + b.hiddenPhones) - (a.hiddenEmails + a.hiddenPhones))
        .forEach((ws, i) => {
          console.log(`\n${i + 1}. ${ws.workspaceName}`);
          console.log(`   Email Coverage: ${ws.emailCoverage}%`);
          console.log(`   Phone Coverage: ${ws.phoneCoverage}%`);
          if (ws.hiddenEmails > 0) {
            console.log(`   ⚠️  ${ws.hiddenEmails} hidden emails need extraction`);
          }
          if (ws.hiddenPhones > 0) {
            console.log(`   ⚠️  ${ws.hiddenPhones} hidden phones need extraction`);
          }
        });
    }

    // Top performing workspaces
    console.log(`\n\n🏆 TOP PERFORMING WORKSPACES`);
    console.log("============================");
    const topWorkspaces = allWorkspaceStats.workspaces
      .filter(ws => ws.totalPeople > 0)
      .sort((a, b) => {
        const aScore = parseFloat(a.emailCoverage) + parseFloat(a.phoneCoverage) + parseFloat(a.linkedInCoverage);
        const bScore = parseFloat(b.emailCoverage) + parseFloat(b.phoneCoverage) + parseFloat(b.linkedInCoverage);
        return bScore - aScore;
      })
      .slice(0, 5);

    topWorkspaces.forEach((ws, i) => {
      console.log(`\n${i + 1}. ${ws.workspaceName}`);
      console.log(`   LinkedIn: ${ws.linkedInCoverage}%`);
      console.log(`   Email: ${ws.emailCoverage}%`);
      console.log(`   Phone: ${ws.phoneCoverage}%`);
      console.log(`   Overall: ${(parseFloat(ws.emailCoverage) + parseFloat(ws.phoneCoverage) + parseFloat(ws.linkedInCoverage)).toFixed(1)}%`);
    });

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditContactCoverageAllWorkspaces()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });





