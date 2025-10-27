/**
 * Debug Workspaces
 * 
 * Check what workspaces and users exist in the database
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugWorkspaces() {
  console.log('🔍 Debugging workspaces and users...');

  try {
    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      where: { isActive: true },
      include: {
        workspace_users: {
          where: { isActive: true },
          include: {
            user: {
              select: { id: true, name: true, email: true, activeWorkspaceId: true }
            }
          }
        }
      }
    });

    console.log(`\n📊 Found ${workspaces.length} active workspaces:`);
    
    for (const workspace of workspaces) {
      console.log(`\n🏢 Workspace: ${workspace.name} (${workspace.slug})`);
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Users (${workspace.workspace_users.length}):`);
      
      for (const wu of workspace.workspace_users) {
        console.log(`     - ${wu.user.name} (${wu.user.email})`);
        console.log(`       User ID: ${wu.user.id}`);
        console.log(`       Active Workspace ID: ${wu.user.activeWorkspaceId}`);
      }
    }

    // Check Oasis channels
    console.log(`\n📺 Oasis Channels:`);
    const channels = await prisma.oasisChannel.findMany({
      include: {
        workspace: {
          select: { name: true, slug: true }
        }
      }
    });

    for (const channel of channels) {
      console.log(`   - #${channel.name} in ${channel.workspace.name} (${channel.workspace.slug})`);
    }

    // Check Oasis DMs
    console.log(`\n💬 Oasis DMs:`);
    const dms = await prisma.oasisDirectMessage.findMany({
      include: {
        workspace: {
          select: { name: true, slug: true }
        },
        participants: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    for (const dm of dms) {
      const participantNames = dm.participants.map(p => p.user.name).join(', ');
      console.log(`   - DM in ${dm.workspace.name}: ${participantNames}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWorkspaces();
