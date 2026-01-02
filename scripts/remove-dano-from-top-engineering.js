#!/usr/bin/env node

/**
 * Remove Dano from TOP Engineering Plus Workspace
 * 
 * This script checks if dano@notaryeveryday.com is connected to
 * TOP Engineering Plus workspace and removes them if found.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const TARGET_USER = {
  email: 'dano@notaryeveryday.com',
  name: 'Dano'
};

async function removeDanoFromTopEngineering() {
  console.log('========================================');
  console.log('   REMOVE DANO FROM TOP ENGINEERING PLUS');
  console.log('========================================');
  console.log(`Target: ${TARGET_USER.email}`);
  console.log('');

  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Find Dano user
    console.log('🔍 Finding Dano user...');
    const user = await prisma.users.findFirst({
      where: { 
        email: { equals: TARGET_USER.email, mode: 'insensitive' },
        isActive: true 
      },
      select: { 
        id: true, 
        email: true, 
        name: true
      }
    });

    if (!user) {
      throw new Error(`User not found: ${TARGET_USER.email}`);
    }

    console.log(`✅ Found user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name || 'N/A'}`);
    console.log(`  Email: ${user.email}\n`);

    // Find TOP Engineering Plus workspace
    console.log('🔍 Finding TOP Engineering Plus workspace...');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'TOP Engineering Plus' },
          { name: { contains: 'TOP Engineering Plus', mode: 'insensitive' } },
          { name: { contains: 'TOP Engineering', mode: 'insensitive' } },
          { slug: { equals: 'top', mode: 'insensitive' } },
          { slug: { contains: 'top-engineering-plus', mode: 'insensitive' } },
          { slug: { contains: 'top-engineering', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!workspace) {
      console.log('⚠️  TOP Engineering Plus workspace not found');
      console.log('   Dano cannot be connected to a non-existent workspace.');
      return { success: true, message: 'Workspace not found, no action needed' };
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`   Slug: ${workspace.slug}\n`);

    // Check if dano is a member of TOP Engineering Plus
    console.log('🔍 Checking workspace membership...');
    const membership = await prisma.workspace_users.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspace.id
      }
    });

    if (!membership) {
      console.log('✅ Dano is NOT a member of TOP Engineering Plus workspace');
      console.log('   No action needed.\n');
      return { success: true, message: 'User is not a member, no action needed' };
    }

    console.log(`⚠️  Found membership:`);
    console.log(`   Membership ID: ${membership.id}`);
    console.log(`   Role: ${membership.role}`);
    console.log(`   Is Active: ${membership.isActive}`);
    console.log(`   Joined At: ${membership.joinedAt}\n`);

    // Remove the membership (soft delete by setting isActive to false)
    console.log('🔄 Removing Dano from TOP Engineering Plus workspace...');
    await prisma.workspace_users.update({
      where: { id: membership.id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    console.log('\n========================================');
    console.log('   MEMBERSHIP REMOVED SUCCESSFULLY');
    console.log('========================================');
    console.log('');
    console.log(`User: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Workspace: ${workspace.name}`);
    console.log('');
    console.log('✅ Dano has been removed from TOP Engineering Plus workspace.');
    console.log('========================================\n');

    return { 
      success: true, 
      message: 'User removed from workspace',
      membershipId: membership.id
    };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

removeDanoFromTopEngineering();

