#!/usr/bin/env tsx

/**
 * Create Missing Actions for Prospects
 * 
 * Creates EMAIL and MEETING actions for prospects that have emails/meetings
 * but no corresponding actions
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

  console.log('🔧 Create Missing Actions for Prospects');
  console.log('='.repeat(70));
  console.log(`\n📁 Workspace: ${workspaceId}\n`);

  // Get prospects with 0 actions
  const prospects = await prisma.people.findMany({
    where: {
      workspaceId,
      status: 'PROSPECT',
      deletedAt: null
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      companyId: true,
      _count: {
        select: {
          actions: {
            where: {
              deletedAt: null
            }
          }
        }
      }
    }
  });

  const prospectsWithNoActions = prospects.filter(p => p._count.actions === 0);
  console.log(`📊 Found ${prospectsWithNoActions.length} prospects with no actions\n`);

  let emailsCreated = 0;
  let meetingsCreated = 0;

  for (const person of prospectsWithNoActions) {
    // Check for emails
    const emails = await prisma.email_messages.findMany({
      where: {
        workspaceId,
        personId: person.id
      },
      orderBy: {
        sentAt: 'desc'
      },
      take: 5
    });

    // Check for meetings
    const meetings = await prisma.events.findMany({
      where: {
        workspaceId,
        personId: person.id
      },
      orderBy: {
        startTime: 'desc'
      },
      take: 5
    });

    // Create EMAIL actions
    for (const email of emails) {
      // Check if action already exists
      const existingAction = await prisma.actions.findFirst({
        where: {
          workspaceId,
          personId: person.id,
          type: 'EMAIL',
          subject: email.subject || undefined,
          completedAt: email.sentAt || undefined
        }
      });

      if (!existingAction) {
        // Get workspace user - try workspace_users first, then fallback to any user in workspace
        let userId: string | null = null;
        
        const workspaceUser = await prisma.workspace_users.findFirst({
          where: { workspaceId },
          select: { userId: true },
          orderBy: { createdAt: 'asc' } // Get first user (likely owner)
        });

        if (workspaceUser) {
          userId = workspaceUser.userId;
        } else {
          // Fallback: get any user who has actions in this workspace
          const anyAction = await prisma.actions.findFirst({
            where: { workspaceId },
            select: { userId: true }
          });
          if (anyAction) {
            userId = anyAction.userId;
          } else {
            console.warn(`⚠️ No user found for workspace ${workspaceId}, skipping action creation for email ${email.id}`);
          }
        }

        if (userId) {
          await prisma.actions.create({
            data: {
              workspaceId,
              userId,
              personId: person.id,
              companyId: person.companyId,
              type: 'EMAIL',
              subject: email.subject || 'Email sent',
              status: 'COMPLETED',
              completedAt: email.sentAt || email.receivedAt || new Date(),
              priority: 'NORMAL'
            }
          });
          emailsCreated++;
        }
      }
    }

    // Create MEETING actions
    for (const meeting of meetings) {
      // Check if action already exists
      const existingAction = await prisma.actions.findFirst({
        where: {
          workspaceId,
          personId: person.id,
          type: 'MEETING',
          subject: meeting.title || undefined,
          completedAt: meeting.startTime || undefined
        }
      });

      if (!existingAction) {
        // Get workspace user - try workspace_users first, then fallback to any user in workspace
        let userId: string | null = null;
        
        const workspaceUser = await prisma.workspace_users.findFirst({
          where: { workspaceId },
          select: { userId: true },
          orderBy: { createdAt: 'asc' } // Get first user (likely owner)
        });

        if (workspaceUser) {
          userId = workspaceUser.userId;
        } else {
          // Fallback: get any user who has actions in this workspace
          const anyAction = await prisma.actions.findFirst({
            where: { workspaceId },
            select: { userId: true }
          });
          if (anyAction) {
            userId = anyAction.userId;
          } else {
            console.warn(`⚠️ No user found for workspace ${workspaceId}, skipping action creation for meeting ${meeting.id}`);
          }
        }

        if (userId) {
          const isFuture = meeting.startTime && new Date(meeting.startTime) > new Date();
          await prisma.actions.create({
            data: {
              workspaceId,
              userId,
              personId: person.id,
              companyId: person.companyId,
              type: 'MEETING',
              subject: meeting.title || 'Meeting',
              status: isFuture ? 'PLANNED' : 'COMPLETED',
              completedAt: isFuture ? null : meeting.startTime,
              scheduledAt: meeting.startTime,
              priority: 'HIGH'
            }
          });
          meetingsCreated++;
        }
      }
    }

    if (emails.length > 0 || meetings.length > 0) {
      console.log(`✅ ${person.fullName || person.id}: ${emails.length} emails, ${meetings.length} meetings`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Email Actions Created: ${emailsCreated}`);
  console.log(`   Meeting Actions Created: ${meetingsCreated}`);

  await prisma.$disconnect();
}

main().catch(console.error);

