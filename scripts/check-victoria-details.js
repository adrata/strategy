#!/usr/bin/env node

/**
 * 🔍 CHECK VICTORIA'S DETAILS
 * Check Victoria's role and password status
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkVictoriaDetails() {
  try {
    console.log('🔍 Checking Victoria\'s details...\n');

    // Get Victoria's full details
    const victoria = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'vleland@topengineersplus.com' },
          { username: 'vleland' }
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

    if (!victoria) {
      console.log('❌ Victoria not found');
      return;
    }

    console.log('👤 VICTORIA\'S DETAILS:');
    console.log(`   Name: ${victoria.name}`);
    console.log(`   Email: ${victoria.email}`);
    console.log(`   Username: ${victoria.username}`);
    console.log(`   Timezone: ${victoria.timezone}`);
    console.log(`   Has Password: ${!!victoria.password}`);
    console.log(`   Active: ${victoria.isActive}`);
    console.log('');

    console.log('🔗 WORKSPACE MEMBERSHIPS:');
    victoria.workspace_users.forEach((membership, index) => {
      console.log(`${index + 1}. ${membership.workspace.name} (${membership.workspace.slug})`);
      console.log(`   Role: ${membership.role}`);
      console.log(`   Active: ${membership.isActive}`);
      console.log('');
    });

    // Check if she has a password and test common ones
    if (victoria.password) {
      console.log('🔐 PASSWORD TESTING:');
      const commonPasswords = [
        'password',
        'victoria',
        'vleland',
        'top123',
        'Victoria123!',
        'Vleland123!',
        'TOP123!',
        'password123',
        'admin',
        'test'
      ];
      
      for (const testPassword of commonPasswords) {
        const isValid = await bcrypt.compare(testPassword, victoria.password);
        console.log(`   ${testPassword}: ${isValid ? '✅ MATCH' : '❌ No match'}`);
      }
    } else {
      console.log('⚠️ No password set for Victoria');
    }

  } catch (error) {
    console.error('❌ Error checking Victoria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkVictoriaDetails();
