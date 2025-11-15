#!/usr/bin/env tsx

/**
 * Fix Prospects: Sync Last Action from Actions
 * 
 * Updates lastAction and lastActionDate for prospects that have actions
 * but missing or incorrect lastAction fields
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { isMeaningfulAction } from '../src/platform/utils/meaningfulActions';

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

  console.log('🔧 Fix Prospects: Sync Last Action');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Get all prospects with actions
  const prospects = await prisma.people.findMany({
    where: {
      workspaceId,
      status: 'PROSPECT',
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      lastAction: true,
      lastActionDate: true,
      actions: {
        where: {
          deletedAt: null,
          status: 'COMPLETED'
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 1,
        select: {
          id: true,
          type: true,
          subject: true,
          completedAt: true,
          createdAt: true
        }
      }
    }
  });

  console.log(`📊 Found ${prospects.length} prospects\n`);

  let updated = 0;
  let skipped = 0;

  for (const person of prospects) {
    if (person.actions.length === 0) {
      skipped++;
      continue;
    }

    const latestAction = person.actions[0];
    
    // Only update if action is meaningful
    if (!isMeaningfulAction(latestAction.type)) {
      skipped++;
      continue;
    }

    const shouldUpdate = 
      !person.lastAction ||
      !person.lastActionDate ||
      person.lastAction !== latestAction.subject ||
      (person.lastActionDate.getTime() !== latestAction.completedAt?.getTime());

    if (shouldUpdate) {
      await prisma.people.update({
        where: { id: person.id },
        data: {
          lastAction: latestAction.subject || latestAction.type,
          lastActionDate: latestAction.completedAt || latestAction.createdAt
        }
      });

      updated++;
      if (updated <= 10) {
        console.log(`✅ Updated ${person.fullName || person.id}`);
        console.log(`   Last Action: ${latestAction.subject || latestAction.type}`);
        console.log(`   Date: ${latestAction.completedAt || latestAction.createdAt}\n`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped} (no actions or already correct)`);

  await prisma.$disconnect();
}

main().catch(console.error);

