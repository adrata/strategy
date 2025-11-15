#!/usr/bin/env tsx

/**
 * Audit Prospects: Actions vs Last Action
 * 
 * Checks:
 * 1. Prospects with actions but "Last Action: Never"
 * 2. Prospects with 0 actions (should have actions from emails/meetings)
 * 3. Action creation for prospects
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

  console.log('🔍 Prospects Actions Audit');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Get all prospects
  const prospects = await prisma.people.findMany({
    where: {
      workspaceId,
      status: 'PROSPECT',
      deletedAt: null
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      fullName: true,
      email: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true
        }
      },
      lastAction: true,
      lastActionDate: true,
      actions: {
        select: {
          id: true,
          type: true,
          status: true,
          completedAt: true,
          createdAt: true
        },
        orderBy: {
          completedAt: 'desc'
        }
      },
      _count: {
        select: {
          actions: true
        }
      }
    }
  });

  console.log(`📊 Found ${prospects.length} prospects\n`);

  // 1. Prospects with actions but "Last Action: Never"
  console.log('1️⃣ Prospects with Actions but "Last Action: Never":');
  const prospectsWithActionsButNoLastAction = prospects.filter(p => {
    const hasActions = p._count.actions > 0;
    const hasLastAction = p.lastAction && p.lastActionDate;
    return hasActions && !hasLastAction;
  });

  console.log(`   Found: ${prospectsWithActionsButNoLastAction.length}`);
  prospectsWithActionsButNoLastAction.forEach((person, idx) => {
    const name = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
    console.log(`\n   ${idx + 1}. ${name} (${person.email})`);
    console.log(`      Company: ${person.company?.name || 'None'}`);
    console.log(`      Actions Count: ${person._count.actions}`);
    console.log(`      Last Action: ${person.lastAction || 'NULL'}`);
    console.log(`      Last Action Date: ${person.lastActionDate || 'NULL'}`);
    if (person.actions.length > 0) {
      const latestAction = person.actions[0];
      console.log(`      Latest Action: ${latestAction.type} - ${latestAction.status} - ${latestAction.completedAt || latestAction.createdAt}`);
    }
  });

  // 2. Prospects with 0 actions
  console.log(`\n\n2️⃣ Prospects with 0 Actions:`);
  const prospectsWithNoActions = prospects.filter(p => p._count.actions === 0);
  console.log(`   Found: ${prospectsWithNoActions.length}`);

  // Check if they have emails or meetings
  for (const person of prospectsWithNoActions.slice(0, 10)) {
    const emailCount = await prisma.email_messages.count({
      where: {
        workspaceId,
        personId: person.id
      }
    });

    const meetingCount = await prisma.events.count({
      where: {
        workspaceId,
        personId: person.id
      }
    });

    if (emailCount > 0 || meetingCount > 0) {
      const name = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
      console.log(`\n   ${name} (${person.email})`);
      console.log(`      Company: ${person.company?.name || 'None'}`);
      console.log(`      Emails: ${emailCount}`);
      console.log(`      Meetings: ${meetingCount}`);
      console.log(`      ⚠️ Has emails/meetings but NO actions!`);
    }
  }

  // 3. Check action types for prospects
  console.log(`\n\n3️⃣ Action Types Distribution for Prospects:`);
  const allProspectActions = await prisma.actions.findMany({
    where: {
      workspaceId,
      personId: {
        in: prospects.map(p => p.id)
      }
    },
    select: {
      type: true,
      status: true
    }
  });

  const actionTypeCounts: Record<string, number> = {};
  allProspectActions.forEach(action => {
    const key = `${action.type || 'UNKNOWN'}-${action.status || 'UNKNOWN'}`;
    actionTypeCounts[key] = (actionTypeCounts[key] || 0) + 1;
  });

  Object.entries(actionTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });

  // 4. Check lastAction sync issues
  console.log(`\n\n4️⃣ Last Action Sync Issues:`);
  const prospectsWithLastAction = prospects.filter(p => p.lastAction && p.lastActionDate);
  const prospectsWithoutLastAction = prospects.filter(p => !p.lastAction || !p.lastActionDate);

  console.log(`   Prospects WITH lastAction: ${prospectsWithLastAction.length}`);
  console.log(`   Prospects WITHOUT lastAction: ${prospectsWithoutLastAction.length}`);

  // Check if lastAction matches latest action
  let mismatches = 0;
  for (const person of prospectsWithLastAction) {
    if (person.actions.length > 0) {
      const latestAction = person.actions[0];
      const lastActionDate = person.lastActionDate;
      const actionDate = latestAction.completedAt || latestAction.createdAt;

      if (lastActionDate && actionDate && lastActionDate.getTime() !== actionDate.getTime()) {
        mismatches++;
        if (mismatches <= 5) {
          const name = person.fullName || `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'Unknown';
          console.log(`\n   ⚠️ Mismatch: ${name}`);
          console.log(`      lastActionDate: ${lastActionDate}`);
          console.log(`      Latest action date: ${actionDate}`);
          console.log(`      Difference: ${Math.abs(lastActionDate.getTime() - actionDate.getTime()) / (1000 * 60)} minutes`);
        }
      }
    }
  }

  if (mismatches > 5) {
    console.log(`   ... and ${mismatches - 5} more mismatches`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

