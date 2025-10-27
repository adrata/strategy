#!/usr/bin/env tsx

/**
 * Migration script to create DMs between Ross and all existing workspace users
 * Run with: npx tsx scripts/oasis/create-ross-dms.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9'; // Ross Sylvester's ID
const ADRATA_WORKSPACE_ID = '01K7469230N74BVGK2PABPNNZ9'; // Adrata workspace ID

async function createRossDMs() {
  try {
    console.log('🚀 Starting Ross DM creation migration...');

    // Get the Adrata workspace ID
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Adrata',
          mode: 'insensitive'
        }
      },
      select: { id: true, name: true }
    });

    if (!adrataWorkspace) {
      console.error('❌ Adrata workspace not found');
      process.exit(1);
    }

    console.log(`📋 Found workspace: ${adrataWorkspace.name} (${adrataWorkspace.id})`);

    // Get all active users in the Adrata workspace (excluding Ross)
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        isActive: true,
        userId: { not: ROSS_USER_ID }
      },
      include: {
        user: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    console.log(`👥 Found ${workspaceUsers.length} users in Adrata workspace`);

    if (workspaceUsers.length === 0) {
      console.log('ℹ️ No users found to create DMs with');
      return;
    }

    const createdDMs = [];
    const skippedDMs = [];

    for (const workspaceUser of workspaceUsers) {
      const otherUserId = workspaceUser.userId;
      const participantIds = [ROSS_USER_ID, otherUserId];

      console.log(`\n🔍 Processing user: ${workspaceUser.user.name} (${otherUserId})`);

      // Check if DM already exists
      const existingDm = await prisma.oasisDirectMessage.findFirst({
        where: {
          workspaceId: adrataWorkspace.id,
          participants: {
            every: {
              userId: { in: participantIds }
            }
          }
        },
        include: {
          participants: true
        }
      });

      if (existingDm && existingDm.participants.length === participantIds.length) {
        console.log(`⏭️ DM already exists for ${workspaceUser.user.name}`);
        skippedDMs.push({
          userId: otherUserId,
          userName: workspaceUser.user.name,
          dmId: existingDm.id
        });
        continue;
      }

      try {
        // Create new DM conversation
        const dm = await prisma.oasisDirectMessage.create({
          data: {
            workspaceId: adrataWorkspace.id,
            participants: {
              createMany: {
                data: participantIds.map(userId => ({ userId }))
              }
            }
          }
        });

        console.log(`✅ Created DM with ${workspaceUser.user.name} (${dm.id})`);
        createdDMs.push({
          userId: otherUserId,
          userName: workspaceUser.user.name,
          dmId: dm.id
        });

      } catch (error) {
        console.error(`❌ Failed to create DM with ${workspaceUser.user.name}:`, error);
      }
    }

    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Created: ${createdDMs.length} DMs`);
    console.log(`⏭️ Skipped: ${skippedDMs.length} DMs (already existed)`);
    console.log(`📋 Total processed: ${workspaceUsers.length} users`);

    if (createdDMs.length > 0) {
      console.log('\n🎉 Successfully created DMs:');
      createdDMs.forEach(dm => {
        console.log(`  - ${dm.userName} (${dm.dmId})`);
      });
    }

    if (skippedDMs.length > 0) {
      console.log('\n⏭️ Skipped existing DMs:');
      skippedDMs.forEach(dm => {
        console.log(`  - ${dm.userName} (${dm.dmId})`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
createRossDMs();
