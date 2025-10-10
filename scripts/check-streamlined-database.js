#!/usr/bin/env node

/**
 * 🔍 CHECK STREAMLINED DATABASE
 * Check what workspaces and users exist in the streamlined database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStreamlinedDatabase() {
  try {
    console.log('🔍 Checking streamlined database...\n');

    // Check all workspaces
    console.log('📁 WORKSPACES:');
    const workspaces = await prisma.workspaces.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        timezone: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (workspaces.length === 0) {
      console.log('❌ No workspaces found');
    } else {
      workspaces.forEach((ws, index) => {
        console.log(`${index + 1}. ${ws.name} (${ws.slug})`);
        console.log(`   ID: ${ws.id}`);
        console.log(`   Timezone: ${ws.timezone}`);
        console.log(`   Active: ${ws.isActive}`);
        console.log(`   Created: ${ws.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Check all users
    console.log('👥 USERS:');
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        timezone: true,
        isActive: true,
        activeWorkspaceId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (users.length === 0) {
      console.log('❌ No users found');
    } else {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Username: ${user.username || 'N/A'}`);
        console.log(`   Timezone: ${user.timezone || 'N/A'}`);
        console.log(`   Active: ${user.isActive}`);
        console.log(`   Active Workspace: ${user.activeWorkspaceId || 'N/A'}`);
        console.log(`   Created: ${user.createdAt.toISOString()}`);
        console.log('');
      });
    }

    // Check workspace memberships
    console.log('🔗 WORKSPACE MEMBERSHIPS:');
    const memberships = await prisma.workspace_users.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        workspace: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (memberships.length === 0) {
      console.log('❌ No workspace memberships found');
    } else {
      memberships.forEach((membership, index) => {
        console.log(`${index + 1}. ${membership.user.name} → ${membership.workspace.name}`);
        console.log(`   Role: ${membership.role}`);
        console.log(`   Active: ${membership.isActive}`);
        console.log(`   Joined: ${membership.joinedAt.toISOString()}`);
        console.log('');
      });
    }

    // Check for Victoria specifically
    console.log('🔍 SEARCHING FOR VICTORIA:');
    const victoria = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'victoria', mode: 'insensitive' } },
          { email: { contains: 'victoria', mode: 'insensitive' } },
          { username: { contains: 'victoria', mode: 'insensitive' } }
        ]
      },
      include: {
        workspace_users: {
          include: {
            workspace: {
              select: { name: true, slug: true }
            }
          }
        }
      }
    });

    if (victoria) {
      console.log('✅ Victoria found:');
      console.log(`   Name: ${victoria.name}`);
      console.log(`   Email: ${victoria.email}`);
      console.log(`   Username: ${victoria.username || 'N/A'}`);
      console.log(`   Timezone: ${victoria.timezone || 'N/A'}`);
      console.log(`   Active: ${victoria.isActive}`);
      console.log('   Workspaces:');
      victoria.workspace_users.forEach(ws => {
        console.log(`     - ${ws.workspace.name} (${ws.role})`);
      });
    } else {
      console.log('❌ Victoria not found in streamlined database');
    }

    // Check for TOP workspace specifically
    console.log('\n🔍 SEARCHING FOR TOP WORKSPACE:');
    const topWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'top', mode: 'insensitive' } },
          { slug: { contains: 'top', mode: 'insensitive' } }
        ]
      },
      include: {
        workspace_users: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (topWorkspace) {
      console.log('✅ TOP workspace found:');
      console.log(`   Name: ${topWorkspace.name}`);
      console.log(`   Slug: ${topWorkspace.slug}`);
      console.log(`   Timezone: ${topWorkspace.timezone}`);
      console.log(`   Active: ${topWorkspace.isActive}`);
      console.log('   Members:');
      topWorkspace.workspace_users.forEach(member => {
        console.log(`     - ${member.user.name} (${member.role})`);
      });
    } else {
      console.log('❌ TOP workspace not found in streamlined database');
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStreamlinedDatabase();
