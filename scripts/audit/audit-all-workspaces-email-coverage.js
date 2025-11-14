#!/usr/bin/env node

/**
 * Audit email coverage across ALL workspaces
 * Check if email extraction issue is specific to Dan or affects all workspaces
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

async function auditAllWorkspacesEmailCoverage() {
  console.log("🔍 AUDITING EMAIL COVERAGE ACROSS ALL WORKSPACES");
  console.log("================================================\n");

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

    console.log(`Found ${workspaces.length} workspaces to audit\n`);

    const workspaceStats = [];

    for (const workspace of workspaces) {
      console.log(`\n📊 ${workspace.name} (${workspace.slug || workspace.id})`);
      console.log("=".repeat(60));

      // Get all people in workspace
      const totalPeople = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
        },
      });

      // Get people with LinkedIn
      const withLinkedIn = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          linkedinUrl: { not: null },
        },
      });

      // Get people with email
      const withEmail = await prisma.people.count({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          OR: [
            { email: { not: null } },
            { workEmail: { not: null } },
            { personalEmail: { not: null } },
          ],
        },
      });

      // Get people with LinkedIn but no email
      const linkedInNoEmail = await prisma.people.findMany({
        where: {
          workspaceId: workspace.id,
          deletedAt: null,
          linkedinUrl: { not: null },
          email: null,
          workEmail: null,
          personalEmail: null,
        },
        select: {
          id: true,
          coresignalData: true,
          enrichedData: true,
          dataSources: true,
        },
        take: 20, // Sample
      });

      // Check how many have emails in Coresignal/enrichedData
      let withHiddenEmail = 0;
      linkedInNoEmail.forEach(person => {
        const csEmail = extractEmailFromCoresignal(person.coresignalData);
        const ed = person.enrichedData;
        const lushaEmail = ed && typeof ed === 'object' ? (ed.primaryEmail || ed.email) : null;
        
        if (csEmail || lushaEmail) {
          withHiddenEmail++;
        }
      });

      const stats = {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        workspaceSlug: workspace.slug,
        totalPeople,
        withLinkedIn,
        withEmail,
        linkedInNoEmailCount: linkedInNoEmail.length,
        withHiddenEmail,
        emailCoverage: totalPeople > 0 ? ((withEmail / totalPeople) * 100).toFixed(1) : 0,
        hiddenEmailRate: linkedInNoEmail.length > 0 ? ((withHiddenEmail / linkedInNoEmail.length) * 100).toFixed(1) : 0,
      };

      workspaceStats.push(stats);

      console.log(`   Total People: ${totalPeople}`);
      console.log(`   With LinkedIn: ${withLinkedIn} (${totalPeople > 0 ? ((withLinkedIn / totalPeople) * 100).toFixed(1) : 0}%)`);
      console.log(`   With Email: ${withEmail} (${stats.emailCoverage}%)`);
      console.log(`   LinkedIn but No Email: ${linkedInNoEmail.length}`);
      if (linkedInNoEmail.length > 0) {
        console.log(`   ⚠️  Hidden Emails: ${withHiddenEmail} (${stats.hiddenEmailRate}% of those without email)`);
      }
    }

    // Summary
    console.log("\n\n📊 SUMMARY ACROSS ALL WORKSPACES");
    console.log("=================================");
    
    const totalPeople = workspaceStats.reduce((sum, s) => sum + s.totalPeople, 0);
    const totalWithEmail = workspaceStats.reduce((sum, s) => sum + s.withEmail, 0);
    const totalLinkedInNoEmail = workspaceStats.reduce((sum, s) => sum + s.linkedInNoEmailCount, 0);
    const totalHiddenEmails = workspaceStats.reduce((sum, s) => sum + s.withHiddenEmail, 0);

    console.log(`Total People (all workspaces): ${totalPeople}`);
    console.log(`Total with Email: ${totalWithEmail} (${((totalWithEmail / totalPeople) * 100).toFixed(1)}%)`);
    console.log(`Total LinkedIn but No Email: ${totalLinkedInNoEmail}`);
    console.log(`Total with Hidden Emails: ${totalHiddenEmails} (${totalLinkedInNoEmail > 0 ? ((totalHiddenEmails / totalLinkedInNoEmail) * 100).toFixed(1) : 0}% of those without email)`);

    console.log(`\n\n📋 WORKSPACES WITH ISSUES`);
    console.log("=========================");
    
    const workspacesWithIssues = workspaceStats.filter(s => 
      s.linkedInNoEmailCount > 0 && s.withHiddenEmail > 0
    ).sort((a, b) => b.withHiddenEmail - a.withHiddenEmail);

    if (workspacesWithIssues.length > 0) {
      console.log(`\n⚠️  ${workspacesWithIssues.length} workspaces have hidden emails that need extraction:\n`);
      workspacesWithIssues.forEach((ws, i) => {
        console.log(`${i + 1}. ${ws.workspaceName}`);
        console.log(`   Email Coverage: ${ws.emailCoverage}%`);
        console.log(`   Hidden Emails: ${ws.withHiddenEmail} out of ${ws.linkedInNoEmailCount} leads without email`);
        console.log(`   Hidden Email Rate: ${ws.hiddenEmailRate}%`);
      });
    } else {
      console.log(`✅ No workspaces with hidden email issues found`);
    }

    // Check specific workspaces mentioned
    console.log(`\n\n🎯 SPECIFIC WORKSPACES CHECK`);
    console.log("============================");
    
    const specificWorkspaces = ['top-temp', 'notary-everyday', 'adrata'];
    specificWorkspaces.forEach(slug => {
      const ws = workspaceStats.find(s => 
        s.workspaceSlug === slug || 
        s.workspaceName.toLowerCase().includes(slug.replace('-', ' '))
      );
      if (ws) {
        console.log(`\n${ws.workspaceName}:`);
        console.log(`   Email Coverage: ${ws.emailCoverage}%`);
        console.log(`   Hidden Emails: ${ws.withHiddenEmail}/${ws.linkedInNoEmailCount}`);
        if (ws.withHiddenEmail > 0) {
          console.log(`   ⚠️  HAS HIDDEN EMAIL ISSUE`);
        }
      } else {
        console.log(`\n${slug}: Not found`);
      }
    });

  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

auditAllWorkspacesEmailCoverage()
  .then(() => {
    console.log("\n✨ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:", error);
    process.exit(1);
  });


