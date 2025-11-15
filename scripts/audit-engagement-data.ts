#!/usr/bin/env tsx

/**
 * Comprehensive Audit of Engagement Data
 * 
 * Checks:
 * 1. Email body vs subject usage
 * 2. First contact detection (emails FROM prospects that aren't replies)
 * 3. Ranking logic considers status
 * 4. Data quality checks
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split('=')[1] : null;

  if (!workspaceId) {
    console.log('❌ Please provide workspace ID: --workspace=WORKSPACE_ID');
    await prisma.$disconnect();
    return;
  }

  console.log('🔍 Comprehensive Engagement Data Audit');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // 1. Check email body vs subject usage
  console.log('1️⃣ Email Body vs Subject Analysis:');
  const emailsWithBody = await prisma.email_messages.count({
    where: {
      workspaceId,
      OR: [
        { body: { not: null } },
        { bodyHtml: { not: null } }
      ]
    }
  });

  const emailsWithSubjectOnly = await prisma.email_messages.count({
    where: {
      workspaceId,
      subject: { not: null },
      body: null,
      bodyHtml: null
    }
  });

  const totalEmails = await prisma.email_messages.count({
    where: { workspaceId }
  });

  console.log(`   Total Emails: ${totalEmails}`);
  console.log(`   Emails with Body: ${emailsWithBody} (${((emailsWithBody / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Emails with Subject Only: ${emailsWithSubjectOnly} (${((emailsWithSubjectOnly / totalEmails) * 100).toFixed(1)}%)\n`);

  // 2. Check first contact emails (FROM prospects, not replies)
  console.log('2️⃣ First Contact Detection:');
  const firstContactEmails = await prisma.email_messages.findMany({
    where: {
      workspaceId,
      personId: { not: null },
      // Not a reply (no Re: in subject, no threadId/inReplyTo)
      NOT: {
        OR: [
          { subject: { startsWith: 'Re:' } },
          { subject: { startsWith: 'RE:' } },
          { subject: { startsWith: 'Fwd:' } },
          { subject: { startsWith: 'FWD:' } },
          { threadId: { not: null } }
        ]
      }
    },
    select: {
      id: true,
      subject: true,
      from: true,
      personId: true,
      companyId: true,
      sentAt: true,
      person: {
        select: {
          id: true,
          name: true,
          status: true,
          email: true
        }
      }
    },
    take: 20,
    orderBy: {
      sentAt: 'desc'
    }
  });

  console.log(`   Found ${firstContactEmails.length} potential first-contact emails (sample of 20):`);
  firstContactEmails.forEach((email, idx) => {
    const personStatus = email.person?.status || 'UNKNOWN';
    const isProspect = personStatus === 'PROSPECT' || personStatus === 'OPPORTUNITY';
    console.log(`   ${idx + 1}. From: ${email.person?.name || email.from}`);
    console.log(`      Status: ${personStatus} ${isProspect ? '✅' : '⚠️'}`);
    console.log(`      Subject: ${email.subject?.substring(0, 60) || 'No subject'}...`);
    console.log(`      Date: ${email.sentAt?.toISOString().split('T')[0] || 'Unknown'}`);
  });

  const firstContactCount = await prisma.email_messages.count({
    where: {
      workspaceId,
      personId: { not: null },
      NOT: {
        OR: [
          { subject: { startsWith: 'Re:' } },
          { subject: { startsWith: 'RE:' } },
          { subject: { startsWith: 'Fwd:' } },
          { subject: { startsWith: 'FWD:' } },
          { threadId: { not: null } }
        ]
      }
    }
  });

  console.log(`\n   Total First Contact Emails: ${firstContactCount}\n`);

  // 3. Check status distribution
  console.log('3️⃣ Status Distribution:');
  const peopleStatus = await prisma.people.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      deletedAt: null
    },
    _count: { id: true }
  });

  const companiesStatus = await prisma.companies.groupBy({
    by: ['status'],
    where: {
      workspaceId,
      deletedAt: null
    },
    _count: { id: true }
  });

  console.log('   People:');
  peopleStatus.forEach(s => {
    console.log(`      ${s.status || 'NULL'}: ${s._count.id}`);
  });

  console.log('   Companies:');
  companiesStatus.forEach(s => {
    console.log(`      ${s.status || 'NULL'}: ${s._count.id}`);
  });

  // 4. Check ranking considers status
  console.log('\n4️⃣ Ranking Status Check:');
  const topRankedPeople = await prisma.people.findMany({
    where: {
      workspaceId,
      globalRank: { not: null, lte: 50 },
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      status: true,
      globalRank: true,
      lastActionDate: true
    },
    orderBy: {
      globalRank: 'asc'
    },
    take: 20
  });

  console.log('   Top 20 Ranked People:');
  topRankedPeople.forEach((person, idx) => {
    const statusEmoji = person.status === 'OPPORTUNITY' ? '💼' : person.status === 'PROSPECT' ? '🎯' : '📋';
    console.log(`   ${idx + 1}. Rank ${person.globalRank}: ${person.name} - ${person.status} ${statusEmoji}`);
  });

  // Check if PROSPECT/OPPORTUNITY are prioritized
  const prospectOpportunityInTop50 = topRankedPeople.filter(
    p => p.status === 'PROSPECT' || p.status === 'OPPORTUNITY'
  ).length;

  console.log(`\n   PROSPECT/OPPORTUNITY in top 20: ${prospectOpportunityInTop50}/20 (${(prospectOpportunityInTop50 / 20 * 100).toFixed(1)}%)`);

  // 5. Check email linking quality
  console.log('\n5️⃣ Email Linking Quality:');
  const linkedEmails = await prisma.email_messages.count({
    where: {
      workspaceId,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    }
  });

  const unlinkedEmails = await prisma.email_messages.count({
    where: {
      workspaceId,
      personId: null,
      companyId: null
    }
  });

  console.log(`   Linked Emails: ${linkedEmails} (${((linkedEmails / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Unlinked Emails: ${unlinkedEmails} (${((unlinkedEmails / totalEmails) * 100).toFixed(1)}%)`);

  // 6. Check action creation from emails
  console.log('\n6️⃣ Action Creation from Emails:');
  const emailsWithActions = await prisma.email_messages.count({
    where: {
      workspaceId,
      personId: { not: null },
      actions: {
        some: {
          type: 'EMAIL'
        }
      }
    }
  });

  console.log(`   Emails with Actions: ${emailsWithActions} (${((emailsWithActions / linkedEmails) * 100).toFixed(1)}% of linked emails)`);

  await prisma.$disconnect();
}

main().catch(console.error);

