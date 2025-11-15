#!/usr/bin/env tsx

/**
 * Upgrade Engaged Leads to Prospects
 * 
 * Checks all leads (status='LEAD') for engagement indicators:
 * - Email replies or first contact
 * - Completed meaningful actions
 * - Meetings (past or future)
 * 
 * Upgrades engaged leads to PROSPECT and triggers company cascade
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { EngagementClassificationService } from '../src/platform/services/engagement-classification-service';
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

  console.log('🔍 Upgrade Engaged Leads to Prospects');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Get all leads
  const leads = await prisma.people.findMany({
    where: {
      workspaceId,
      status: 'LEAD',
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  console.log(`📊 Found ${leads.length} leads to check\n`);

  let upgraded = 0;
  let skipped = 0;
  const upgradeReasons: Record<string, number> = {};

  for (const lead of leads) {
    let engagementFound = false;
    let engagementReason = '';

    // Check for email engagement
    const emails = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: lead.id
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 10
    });

    for (const email of emails) {
      // Check if it's a reply
      const subject = (email.subject || '').trim();
      const isReply = subject.match(/^(Re|RE|Fwd|FWD|Fw|FW):\s*/i) || (email.threadId && email.inReplyTo);
      
      // Check if it's first contact (FROM this person, not a reply)
      const isFirstContact = !isReply && email.from && lead.email && 
                            email.from.toLowerCase().includes(lead.email.toLowerCase());

      if (isReply) {
        engagementFound = true;
        engagementReason = 'Replied to email';
        break;
      } else if (isFirstContact) {
        engagementFound = true;
        engagementReason = 'Initiated contact via email';
        break;
      }
    }

    // Check for meaningful completed actions
    if (!engagementFound) {
      const actions = await prisma.actions.findMany({
        where: {
          workspaceId,
          personId: lead.id,
          status: 'COMPLETED',
          deletedAt: null
        },
        orderBy: {
          completedAt: 'desc'
        },
        take: 5
      });

      for (const action of actions) {
        if (isMeaningfulAction(action.type)) {
          engagementFound = true;
          engagementReason = `Completed ${action.type}`;
          break;
        }
      }
    }

    // Check for meetings
    if (!engagementFound) {
      const meetings = await prisma.events.findMany({
        where: {
          workspaceId,
          personId: lead.id
        },
        orderBy: {
          startTime: 'desc'
        },
        take: 5
      });

      if (meetings.length > 0) {
        engagementFound = true;
        engagementReason = 'Attended meeting';
      }
    }

    if (engagementFound) {
      // Upgrade to PROSPECT
      await prisma.people.update({
        where: { id: lead.id },
        data: {
          status: 'PROSPECT',
          statusUpdateDate: new Date(),
          statusReason: engagementReason
        }
      });

      upgraded++;
      upgradeReasons[engagementReason] = (upgradeReasons[engagementReason] || 0) + 1;

      console.log(`✅ Upgraded ${lead.fullName || lead.id} to PROSPECT: ${engagementReason}`);

      // Trigger company cascade
      if (lead.companyId) {
        const cascadeResult = await EngagementClassificationService.cascadeCompanyProspectStatus(
          lead.id,
          lead.companyId,
          workspaceId
        );
        if (cascadeResult.peopleUpdated > 0) {
          console.log(`   → Cascaded to ${cascadeResult.peopleUpdated} other people at ${lead.company?.name || 'company'}`);
        }
      }
    } else {
      skipped++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Upgraded: ${upgraded}`);
  console.log(`   Skipped: ${skipped} (no engagement found)`);
  console.log(`\n📈 Upgrade Reasons:`);
  Object.entries(upgradeReasons).forEach(([reason, count]) => {
    console.log(`   ${reason}: ${count}`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);

