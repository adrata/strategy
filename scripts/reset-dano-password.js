#!/usr/bin/env node

/**
 * Direct Password Reset for Dano in Notary Everyday Workspace
 * 
 * Target: dano@notaryeveryday.com
 * Workspace: Notary Everyday
 * New Password: DanoIsGreat01!
 * 
 * This script resets the password directly in the database.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TARGET_USER = {
  email: 'dano@notaryeveryday.com',
  name: 'Dano'
};

const NEW_PASSWORD = 'DanoIsGreat01!';

async function resetPassword() {
  console.log('========================================');
  console.log('   DIRECT PASSWORD RESET - DANO');
  console.log('   Workspace: Notary Everyday');
  console.log('========================================');
  console.log(`Target: ${TARGET_USER.email}`);
  console.log('');

  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Find Notary Everyday workspace
    console.log('🔍 Finding Notary Everyday workspace...');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: 'Notary Everyday' },
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ],
        isActive: true
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`   Slug: ${workspace.slug}\n`);

    // Find the user
    console.log('🔍 Finding Dano user...');
    const user = await prisma.users.findFirst({
      where: { 
        email: { equals: TARGET_USER.email, mode: 'insensitive' },
        isActive: true 
      },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        firstName: true, 
        lastName: true 
      }
    });

    if (!user) {
      throw new Error(`User not found: ${TARGET_USER.email}`);
    }

    console.log(`✅ Found user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}`);
    console.log(`  Email: ${user.email}\n`);

    // Verify user is in Notary Everyday workspace
    console.log('🔍 Verifying workspace membership...');
    const workspaceMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: user.id,
        workspaceId: workspace.id,
        isActive: true
      }
    });

    if (!workspaceMembership) {
      console.log('⚠️  WARNING: User is not a member of Notary Everyday workspace');
      console.log('   Proceeding with password reset anyway...\n');
    } else {
      console.log(`✅ User is a member of Notary Everyday workspace\n`);
    }

    // Hash the password with bcrypt
    console.log('🔐 Hashing new password...');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, saltRounds);

    // Update user's password in database
    console.log('🔄 Updating password in database...');
    await prisma.users.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    // Invalidate any existing reset tokens
    await prisma.reset_tokens.updateMany({
      where: {
        userId: user.id,
        used: false
      },
      data: {
        used: true
      }
    });

    console.log('\n========================================');
    console.log('   PASSWORD RESET SUCCESSFUL');
    console.log('========================================');
    console.log('');
    console.log(`User: ${user.name || TARGET_USER.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Workspace: ${workspace.name}`);
    console.log('');
    console.log('NEW CREDENTIALS:');
    console.log('----------------------------------------');
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${NEW_PASSWORD}`);
    console.log('----------------------------------------');
    console.log('');
    console.log('Password has been reset successfully.');
    console.log('========================================\n');

    return { success: true, email: user.email, password: NEW_PASSWORD };

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();

