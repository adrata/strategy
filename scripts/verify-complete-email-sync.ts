#!/usr/bin/env tsx

/**
 * Comprehensive Email Sync Verification
 * Checks for duplicates, sync completion, and action creation
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { UnifiedEmailSyncService } from '../src/platform/services/UnifiedEmailSyncService';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Comprehensive Email Sync Verification\n');
  console.log('='.repeat(70));
  
  // Find TOP Engineering Plus workspace
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
        { name: { contains: 'Engineering Plus', mode: 'insensitive' } }
      ]
    },
    select: {
      id: true,
      name: true
    }
  });
  
  if (!workspace) {
    console.log('❌ Workspace not found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`📁 Workspace: ${workspace.name} (${workspace.id})\n`);
  
  // 1. Check for duplicate emails
  console.log('1️⃣ Checking for duplicate emails...');
  const duplicates = await prisma.$queryRaw<Array<{messageId: string, provider: string, count: bigint}>>`
    SELECT "messageId", "provider", COUNT(*) as count
    FROM email_messages
    WHERE "workspaceId" = ${workspace.id}
    GROUP BY "messageId", "provider"
    HAVING COUNT(*) > 1
    ORDER BY count DESC
    LIMIT 20
  `;
  
  if (duplicates.length > 0) {
    console.log(`   ⚠️  Found ${duplicates.length} duplicate email(s):`);
    for (const dup of duplicates.slice(0, 10)) {
      console.log(`      - ${dup.messageId.substring(0, 50)}... (${dup.count} copies)`);
    }
    if (duplicates.length > 10) {
      console.log(`      ... and ${duplicates.length - 10} more`);
    }
  } else {
    console.log(`   ✅ No duplicate emails found`);
  }
  console.log('');
  
  // 2. Check total email count and date range
  console.log('2️⃣ Email Statistics:');
  const totalEmails = await prisma.email_messages.count({
    where: { workspaceId: workspace.id }
  });
  
  const emailDateRange = await prisma.email_messages.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { receivedAt: 'asc' },
    select: { receivedAt: true }
  });
  
  const latestEmail = await prisma.email_messages.findFirst({
    where: { workspaceId: workspace.id },
    orderBy: { receivedAt: 'desc' },
    select: { receivedAt: true }
  });
  
  console.log(`   Total Emails: ${totalEmails}`);
  if (emailDateRange) {
    console.log(`   Oldest Email: ${emailDateRange.receivedAt.toLocaleDateString()}`);
  }
  if (latestEmail) {
    const daysSinceLatest = Math.floor((Date.now() - latestEmail.receivedAt.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`   Latest Email: ${latestEmail.receivedAt.toLocaleDateString()} (${daysSinceLatest} days ago)`);
    if (daysSinceLatest > 1) {
      console.log(`   ⚠️  Latest email is ${daysSinceLatest} days old - may need sync`);
    }
  }
  console.log('');
  
  // 3. Check linking status
  console.log('3️⃣ Email Linking Status:');
  const linkedToPeople = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: { not: null }
    }
  });
  
  const linkedToCompanies = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      companyId: { not: null }
    }
  });
  
  const linkedToBoth = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: { not: null },
      companyId: { not: null }
    }
  });
  
  const unlinked = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: null,
      companyId: null
    }
  });
  
  console.log(`   Linked to People: ${linkedToPeople} (${((linkedToPeople / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Linked to Companies: ${linkedToCompanies} (${((linkedToCompanies / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Linked to Both: ${linkedToBoth}`);
  console.log(`   Unlinked: ${unlinked} (${((unlinked / totalEmails) * 100).toFixed(1)}%)`);
  
  if (unlinked > 0) {
    // Sample unlinked emails to see if they're internal
    const sampleUnlinked = await prisma.email_messages.findMany({
      where: {
        workspaceId: workspace.id,
        personId: null,
        companyId: null
      },
      take: 5,
      select: {
        from: true,
        to: true,
        subject: true
      }
    });
    
    console.log(`   Sample unlinked emails:`);
    for (const email of sampleUnlinked) {
      const fromDomain = email.from.split('@')[1] || 'unknown';
      const isInternal = fromDomain.includes('topengineersplus.com') || 
                         fromDomain.includes('topengineers') ||
                         email.to.some(t => t.includes('topengineersplus.com') || t.includes('topengineers'));
      console.log(`      - From: ${email.from.substring(0, 40)}...`);
      console.log(`        Subject: ${email.subject?.substring(0, 50) || '(No Subject)'}`);
      console.log(`        ${isInternal ? '🔵 Internal email (OK to skip)' : '🟡 External email (should be linked)'}`);
    }
  }
  console.log('');
  
  // 4. Check action creation
  console.log('4️⃣ Action Creation Status:');
  const emailActions = await prisma.actions.count({
    where: {
      workspaceId: workspace.id,
      type: 'EMAIL'
    }
  });
  
  console.log(`   EMAIL Actions Created: ${emailActions}`);
  console.log(`   Actions per Linked Email: ${linkedToPeople > 0 ? (emailActions / linkedToPeople).toFixed(2) : 'N/A'}`);
  
  // Check if there are emails with people but no actions
  const emailsWithPeopleNoActions = await prisma.$queryRaw<Array<{count: bigint}>>`
    SELECT COUNT(DISTINCT em.id) as count
    FROM email_messages em
    LEFT JOIN actions a ON a."personId" = em."personId" 
      AND a.type = 'EMAIL' 
      AND a."completedAt" = em."receivedAt"
      AND a.subject = em.subject
    WHERE em."workspaceId" = ${workspace.id}
      AND em."personId" IS NOT NULL
      AND a.id IS NULL
  `;
  
  const missingActions = Number(emailsWithPeopleNoActions[0]?.count || 0);
  if (missingActions > 0) {
    console.log(`   ⚠️  ${missingActions} emails with people but no actions - need to create actions`);
  } else {
    console.log(`   ✅ All emails with people have actions`);
  }
  console.log('');
  
  // 5. Check sync status
  console.log('5️⃣ Sync Status:');
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      workspaceId: workspace.id,
      provider: { in: ['outlook', 'gmail'] },
      status: 'active'
    },
    select: {
      provider: true,
      lastSyncAt: true,
      createdAt: true
    }
  });
  
  for (const conn of connections) {
    const daysSinceSync = conn.lastSyncAt 
      ? Math.floor((Date.now() - conn.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    console.log(`   Provider: ${conn.provider}`);
    console.log(`   Last Sync: ${conn.lastSyncAt ? conn.lastSyncAt.toLocaleString() : 'Never'}`);
    if (daysSinceSync !== null) {
      if (daysSinceSync === 0) {
        console.log(`   ✅ Synced today`);
      } else if (daysSinceSync === 1) {
        console.log(`   ⚠️  Synced ${daysSinceSync} day ago`);
      } else {
        console.log(`   ⚠️  Synced ${daysSinceSync} days ago - may need sync`);
      }
    }
  }
  console.log('');
  
  // 6. Summary and recommendations
  console.log('📊 Summary:');
  console.log('='.repeat(70));
  
  const issues: string[] = [];
  if (duplicates.length > 0) {
    issues.push(`❌ ${duplicates.length} duplicate email(s) found`);
  }
  if (missingActions > 0) {
    issues.push(`⚠️  ${missingActions} emails missing actions`);
  }
  if (latestEmail && Math.floor((Date.now() - latestEmail.receivedAt.getTime()) / (1000 * 60 * 60 * 24)) > 1) {
    issues.push(`⚠️  Latest email is more than 1 day old`);
  }
  
  if (issues.length === 0) {
    console.log('✅ All checks passed! Email sync is complete and healthy.\n');
  } else {
    console.log('Issues found:\n');
    issues.forEach(issue => console.log(`   ${issue}`));
    console.log('');
    
    // Offer to fix issues
    console.log('🔧 Would you like to:');
    if (missingActions > 0) {
      console.log('   1. Create missing actions');
    }
    if (duplicates.length > 0) {
      console.log('   2. Remove duplicate emails');
    }
    console.log('   3. Run full sync and linking');
    console.log('');
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

