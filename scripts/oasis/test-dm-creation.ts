#!/usr/bin/env tsx

/**
 * Test script to verify DM creation functionality
 * Run with: npx tsx scripts/oasis/test-dm-creation.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';

async function testDMCreation() {
  try {
    console.log('🧪 Testing DM creation functionality...');

    // Get Adrata workspace
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
      return;
    }

    console.log(`📋 Found workspace: ${adrataWorkspace.name} (${adrataWorkspace.id})`);

    // Get all DMs for Ross in this workspace
    const rossDMs = await prisma.oasisDirectMessage.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        participants: {
          some: {
            userId: ROSS_USER_ID
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    });

    console.log(`\n📊 Ross has ${rossDMs.length} DMs in Adrata workspace:`);
    
    rossDMs.forEach((dm, index) => {
      const otherParticipants = dm.participants.filter(p => p.userId !== ROSS_USER_ID);
      console.log(`  ${index + 1}. DM ${dm.id}:`);
      otherParticipants.forEach(participant => {
        console.log(`     - ${participant.user.name} (${participant.user.email})`);
      });
    });

    // Get all workspace users
    const workspaceUsers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: adrataWorkspace.id,
        isActive: true
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    console.log(`\n👥 Total workspace users: ${workspaceUsers.length}`);
    workspaceUsers.forEach((wu, index) => {
      const isRoss = wu.userId === ROSS_USER_ID;
      console.log(`  ${index + 1}. ${wu.user.name} (${wu.user.email}) ${isRoss ? '[ROSS]' : ''}`);
    });

    // Check if Ross has DMs with all other users
    const otherUsers = workspaceUsers.filter(wu => wu.userId !== ROSS_USER_ID);
    const usersWithDMs = new Set();
    
    rossDMs.forEach(dm => {
      dm.participants.forEach(p => {
        if (p.userId !== ROSS_USER_ID) {
          usersWithDMs.add(p.userId);
        }
      });
    });

    console.log(`\n✅ Ross has DMs with ${usersWithDMs.size} out of ${otherUsers.length} other users`);
    
    const missingDMs = otherUsers.filter(wu => !usersWithDMs.has(wu.userId));
    if (missingDMs.length > 0) {
      console.log(`❌ Missing DMs with:`);
      missingDMs.forEach(user => {
        console.log(`  - ${user.user.name} (${user.user.email})`);
      });
    } else {
      console.log(`🎉 All users have DMs with Ross!`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDMCreation();
