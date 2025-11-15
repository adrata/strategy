#!/usr/bin/env tsx

/**
 * Backfill Engagement Classification
 * 
 * This script classifies existing people and companies based on their email engagement:
 * - PROSPECT: People/companies who have replied to emails
 * - OPPORTUNITY: Situations where business was discussed
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EngagementClassificationService } from '../src/platform/services/engagement-classification-service';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function main() {
  console.log('🎯 Backfilling Engagement Classification');
  console.log('='.repeat(70));
  console.log('');

  const args = process.argv.slice(2);
  const workspaceIdArg = args.find(arg => arg.startsWith('--workspace='));
  const workspaceId = workspaceIdArg ? workspaceIdArg.split('=')[1] : null;

  if (!workspaceId) {
    console.log('❌ Please provide workspace ID: --workspace=WORKSPACE_ID');
    await prisma.$disconnect();
    return;
  }

  console.log(`📁 Workspace: ${workspaceId}\n`);

  // Backfill from emails
  console.log('📧 Backfilling from emails...\n');
  const emailResult = await EngagementClassificationService.backfillFromEmails(workspaceId);
  
  console.log(`\n📊 Email Classification Results:`);
  console.log(`   Processed: ${emailResult.processed} emails`);
  console.log(`   Updated: ${emailResult.updated} records`);

  // Also check meetings for business discussion
  console.log(`\n📅 Checking meetings for business discussion...\n`);
  
  const meetings = await prisma.events.findMany({
    where: {
      workspaceId,
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    },
    select: {
      id: true,
      title: true,
      description: true,
      personId: true,
      companyId: true,
      workspaceId: true
    }
  });

  console.log(`📊 Found ${meetings.length} meetings to check\n`);

  let meetingUpdated = 0;
  for (const meeting of meetings) {
    const result = await EngagementClassificationService.classifyFromMeeting(meeting);
    if (result.personUpdated || result.companyUpdated) {
      meetingUpdated++;
    }
  }

  console.log(`\n📊 Meeting Classification Results:`);
  console.log(`   Checked: ${meetings.length} meetings`);
  console.log(`   Updated: ${meetingUpdated} records`);

  console.log(`\n✅ Backfill complete!`);
  console.log(`   Total records updated: ${emailResult.updated + meetingUpdated}`);

  await prisma.$disconnect();
}

main().catch(console.error);

