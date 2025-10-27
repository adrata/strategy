#!/usr/bin/env tsx

/**
 * Test script to verify automatic DM creation for new users
 * Run with: npx tsx scripts/oasis/test-new-user-dm.ts
 */

import { PrismaClient } from '@prisma/client';
import { createRossDM } from '../../src/lib/oasis-dm-utils';

const prisma = new PrismaClient();

const ROSS_USER_ID = '01K7469230N74BVGK2PABPNNZ9';

async function testNewUserDM() {
  try {
    console.log('🧪 Testing automatic DM creation for new users...');

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

    // Create a test user
    const testUser = await prisma.users.create({
      data: {
        email: 'testuser@adrata.com',
        name: 'Test User',
        firstName: 'Test',
        lastName: 'User',
        isActive: true,
        activeWorkspaceId: adrataWorkspace.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log(`👤 Created test user: ${testUser.name} (${testUser.id})`);

    // Add user to workspace
    await prisma.workspace_users.create({
      data: {
        workspaceId: adrataWorkspace.id,
        userId: testUser.id,
        role: 'VIEWER',
        isActive: true,
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    console.log(`✅ Added test user to workspace`);

    // Test DM creation using our utility function
    console.log(`\n🔧 Testing DM creation utility...`);
    const dmResult = await createRossDM(adrataWorkspace.id, testUser.id);
    
    if (dmResult.success) {
      console.log(`✅ Successfully created DM: ${dmResult.dmId}`);
    } else {
      console.log(`❌ Failed to create DM: ${dmResult.error}`);
    }

    // Verify DM was created
    const createdDM = await prisma.oasisDirectMessage.findFirst({
      where: {
        id: dmResult.dmId || '',
        workspaceId: adrataWorkspace.id
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

    if (createdDM) {
      console.log(`\n📊 Created DM details:`);
      console.log(`  ID: ${createdDM.id}`);
      console.log(`  Participants:`);
      createdDM.participants.forEach(p => {
        const isRoss = p.userId === ROSS_USER_ID;
        console.log(`    - ${p.user.name} (${p.user.email}) ${isRoss ? '[ROSS]' : '[TEST USER]'}`);
      });
    }

    // Clean up - remove test user and DM
    console.log(`\n🧹 Cleaning up test data...`);
    
    if (createdDM) {
      await prisma.oasisDMParticipant.deleteMany({
        where: { dmId: createdDM.id }
      });
      await prisma.oasisDirectMessage.delete({
        where: { id: createdDM.id }
      });
      console.log(`✅ Deleted test DM`);
    }

    await prisma.workspace_users.deleteMany({
      where: { userId: testUser.id }
    });
    await prisma.users.delete({
      where: { id: testUser.id }
    });
    console.log(`✅ Deleted test user`);

    console.log(`\n🎉 Test completed successfully!`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testNewUserDM();
