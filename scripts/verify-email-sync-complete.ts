#!/usr/bin/env tsx

/**
 * Verify that emails are properly linked to companies/people and actions are created
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🔍 Verifying Email Sync Completion\n');
  
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
  
  // Count total emails
  const totalEmails = await prisma.email_messages.count({
    where: { workspaceId: workspace.id }
  });
  
  // Count emails linked to people
  const emailsLinkedToPeople = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: { not: null }
    }
  });
  
  // Count emails linked to companies
  const emailsLinkedToCompanies = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      companyId: { not: null }
    }
  });
  
  // Count emails linked to both
  const emailsLinkedToBoth = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: { not: null },
      companyId: { not: null }
    }
  });
  
  // Count unlinked emails
  const unlinkedEmails = await prisma.email_messages.count({
    where: {
      workspaceId: workspace.id,
      personId: null,
      companyId: null
    }
  });
  
  // Count EMAIL actions created
  const emailActions = await prisma.actions.count({
    where: {
      workspaceId: workspace.id,
      type: 'EMAIL'
    }
  });
  
  console.log('📊 Email Statistics:');
  console.log(`   Total Emails: ${totalEmails}`);
  console.log(`   Linked to People: ${emailsLinkedToPeople} (${((emailsLinkedToPeople / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Linked to Companies: ${emailsLinkedToCompanies} (${((emailsLinkedToCompanies / totalEmails) * 100).toFixed(1)}%)`);
  console.log(`   Linked to Both: ${emailsLinkedToBoth}`);
  console.log(`   Unlinked: ${unlinkedEmails} (${((unlinkedEmails / totalEmails) * 100).toFixed(1)}%)\n`);
  
  console.log('📋 Action Statistics:');
  console.log(`   EMAIL Actions Created: ${emailActions}`);
  console.log(`   Actions per Linked Email: ${emailsLinkedToPeople > 0 ? (emailActions / emailsLinkedToPeople).toFixed(2) : 'N/A'}\n`);
  
  // Sample some linked emails to verify
  const sampleLinkedEmails = await prisma.email_messages.findMany({
    where: {
      workspaceId: workspace.id,
      personId: { not: null }
    },
    take: 5,
    include: {
      person: {
        select: {
          fullName: true,
          email: true
        }
      },
      company: {
        select: {
          name: true
        }
      }
    }
  });
  
  if (sampleLinkedEmails.length > 0) {
    console.log('📧 Sample Linked Emails:');
    for (const email of sampleLinkedEmails) {
      console.log(`   - ${email.subject || '(No Subject)'}`);
      console.log(`     Person: ${email.person?.fullName || email.person?.email || 'Unknown'}`);
      console.log(`     Company: ${email.company?.name || 'None'}`);
      console.log(`     Date: ${email.receivedAt.toLocaleDateString()}\n`);
    }
  }
  
  // Check if actions exist for sample emails
  if (sampleLinkedEmails.length > 0) {
    const sampleEmailIds = sampleLinkedEmails.map(e => e.id);
    const actionsForSample = await prisma.actions.findMany({
      where: {
        workspaceId: workspace.id,
        type: 'EMAIL',
        personId: { in: sampleLinkedEmails.map(e => e.personId!).filter(Boolean) }
      },
      take: 5
    });
    
    console.log(`✅ Found ${actionsForSample.length} actions for sample emails\n`);
  }
  
  // Summary
  console.log('📈 Summary:');
  if (unlinkedEmails > 0) {
    console.log(`   ⚠️  ${unlinkedEmails} emails are not linked to people or companies`);
    console.log(`      These may be from external senders or need manual linking\n`);
  } else {
    console.log(`   ✅ All emails are linked to at least a person or company\n`);
  }
  
  if (emailActions > 0) {
    console.log(`   ✅ ${emailActions} EMAIL actions have been created\n`);
  } else {
    console.log(`   ⚠️  No EMAIL actions found - may need to run action creation\n`);
  }
  
  await prisma.$disconnect();
}

main().catch(console.error);

