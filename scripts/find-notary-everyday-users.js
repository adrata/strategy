#!/usr/bin/env node

/**
 * 🔍 FIND NOTARY EVERYDAY WORKSPACE USERS
 * 
 * Finds all users connected to the Notary Everyday workspace in the streamlined database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findNotaryEverydayUsers() {
  try {
    console.log('🔍 Finding users in Notary Everyday workspace...\n');
    
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
    
    console.log(`🏢 Found workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get all workspace members
    const workspaceMembers = await prisma.workspaceMembership.findMany({
      where: { workspaceId: workspace.id },
      include: {
        users: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            username: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    console.log(`👥 Workspace Members (${workspaceMembers.length}):`);
    console.log('=====================================');
    
    if (workspaceMembers.length === 0) {
      console.log('   No members found in this workspace');
    } else {
      workspaceMembers.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.users.name || 'No name'}`);
        console.log(`      Email: ${member.users.email}`);
        console.log(`      Username: ${member.users.username || 'No username'}`);
        console.log(`      Role: ${member.role}`);
        console.log(`      Active: ${member.isActive}`);
        console.log(`      Joined: ${member.joinedAt}`);
        console.log('');
      });
    }
    
    // Also check for any users with notaryeveryday.com emails
    console.log('📧 Users with @notaryeveryday.com emails:');
    console.log('==========================================');
    
    const notaryEmailUsers = await prisma.users.findMany({
      where: {
        email: { contains: '@notaryeveryday.com', mode: 'insensitive' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true
      }
    });
    
    if (notaryEmailUsers.length === 0) {
      console.log('   No users found with @notaryeveryday.com emails');
    } else {
      notaryEmailUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name || 'No name'}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Username: ${user.username || 'No username'}`);
        console.log(`      ID: ${user.id}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findNotaryEverydayUsers();
