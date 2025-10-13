#!/usr/bin/env node

/**
 * 👥 CHECK NOTARY EVERYDAY WORKSPACE MEMBERS
 * 
 * Lists all current users in the Notary Everyday workspace
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNotaryWorkspaceMembers() {
  try {
    console.log('🔍 Checking current members of Notary Everyday workspace...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }
    
    console.log(`🏢 Workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get all workspace members
    const workspaceMembers = await prisma.workspace_users.findMany({
      where: {
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            firstName: true,
            lastName: true,
            timezone: true,
            isActive: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
    
    console.log(`👥 Workspace Members (${workspaceMembers.length}):`);
    console.log('=====================================');
    
    workspaceMembers.forEach((member, index) => {
      console.log(`\n${index + 1}. ${member.user.name}`);
      console.log(`   📧 Email: ${member.user.email}`);
      console.log(`   🆔 User ID: ${member.user.id}`);
      console.log(`   👑 Role: ${member.role}`);
      console.log(`   🌍 Timezone: ${member.user.timezone || 'Not set'}`);
      console.log(`   📅 Joined: ${member.joinedAt.toLocaleDateString()}`);
      console.log(`   ✅ Status: ${member.user.isActive ? 'Active' : 'Inactive'}`);
    });
    
    // Summary by role
    console.log('\n📊 Summary by Role:');
    console.log('===================');
    
    const roleCounts = workspaceMembers.reduce((acc, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`   ${role}: ${count} user(s)`);
    });
    
    console.log(`\n✅ Total active members: ${workspaceMembers.length}`);
    
  } catch (error) {
    console.error('❌ Error checking workspace members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkNotaryWorkspaceMembers();
