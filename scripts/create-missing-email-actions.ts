#!/usr/bin/env tsx

/**
 * Create missing EMAIL actions for emails that are linked to people
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
  console.log('🔧 Creating Missing Email Actions\n');
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
  
  // Find emails with people but no actions
  const emailsNeedingActions = await prisma.$queryRaw<Array<{
    id: string;
    personId: string;
    companyId: string | null;
    subject: string;
    from: string;
    to: string[];
    cc: string[];
    body: string;
    receivedAt: Date;
  }>>`
    SELECT DISTINCT em.id, em."personId", em."companyId", em.subject, em.from, em.to, em.cc, em.body, em."receivedAt"
    FROM email_messages em
    LEFT JOIN actions a ON a."personId" = em."personId" 
      AND a.type = 'EMAIL' 
      AND a."completedAt" = em."receivedAt"
      AND a.subject = em.subject
    WHERE em."workspaceId" = ${workspace.id}
      AND em."personId" IS NOT NULL
      AND a.id IS NULL
    LIMIT 1000
  `;
  
  console.log(`📧 Found ${emailsNeedingActions.length} emails needing actions\n`);
  
  if (emailsNeedingActions.length === 0) {
    console.log('✅ All emails already have actions!\n');
    await prisma.$disconnect();
    return;
  }
  
  // Get workspace user for action assignment
  const workspaceUser = await prisma.workspace_users.findFirst({
    where: {
      workspaceId: workspace.id,
      isActive: true
    },
    select: {
      userId: true
    }
  });
  
  if (!workspaceUser) {
    console.log('❌ No active workspace user found');
    await prisma.$disconnect();
    return;
  }
  
  console.log(`👤 Assigning actions to user: ${workspaceUser.userId}\n`);
  console.log('Creating actions...\n');
  
  let created = 0;
  let errors = 0;
  
  for (const email of emailsNeedingActions) {
    try {
      // Build description with email details
      const emailDetails = [];
      emailDetails.push(`From: ${email.from}`);
      if (email.to && email.to.length > 0) {
        emailDetails.push(`To: ${email.to.join(', ')}`);
      }
      if (email.cc && email.cc.length > 0) {
        emailDetails.push(`CC: ${email.cc.join(', ')}`);
      }
      emailDetails.push(`\n${email.body.substring(0, 400)}`);
      
      const description = emailDetails.join('\n');
      
      await prisma.actions.create({
        data: {
          workspaceId: workspace.id,
          userId: workspaceUser.userId,
          companyId: email.companyId,
          personId: email.personId,
          type: 'EMAIL',
          subject: email.subject || '(No Subject)',
          description: description,
          status: 'COMPLETED',
          completedAt: email.receivedAt,
          createdAt: email.receivedAt,
          updatedAt: email.receivedAt
        }
      });
      
      created++;
      
      if (created % 100 === 0) {
        console.log(`   Created ${created}/${emailsNeedingActions.length} actions...`);
      }
    } catch (error: any) {
      errors++;
      if (errors <= 5) {
        console.error(`   ❌ Error creating action for email ${email.id}: ${error.message}`);
      }
    }
  }
  
  console.log(`\n✅ Created ${created} actions`);
  if (errors > 0) {
    console.log(`   ⚠️  ${errors} errors occurred`);
  }
  console.log('');
  
  await prisma.$disconnect();
}

main().catch(console.error);

