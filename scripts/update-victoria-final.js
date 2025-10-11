#!/usr/bin/env node

/**
 * 🔧 UPDATE VICTORIA'S FINAL SETTINGS
 * Set Victoria's correct password and East Coast timezone
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updateVictoriaFinal() {
  try {
    console.log('🔧 Updating Victoria\'s final settings...\n');

    // Get Victoria's details
    const victoria = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'vleland@topengineersplus.com' },
          { username: 'vleland' }
        ]
      }
    });

    if (!victoria) {
      console.log('❌ Victoria not found');
      return;
    }

    console.log('👤 Current Victoria setup:');
    console.log(`   Name: ${victoria.name}`);
    console.log(`   Email: ${victoria.email}`);
    console.log(`   Username: ${victoria.username}`);
    console.log(`   Timezone: ${victoria.timezone}`);
    console.log('');

    // Update Victoria's password and timezone
    console.log('🔄 Updating Victoria\'s password and timezone...');
    
    const newPassword = 'TOPgtm01!';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedVictoria = await prisma.users.update({
      where: { id: victoria.id },
      data: { 
        password: hashedPassword,
        timezone: 'America/New_York', // East Coast timezone
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        timezone: true,
        isActive: true
      }
    });

    console.log('✅ Victoria\'s settings updated successfully!');
    console.log('');
    console.log('📋 FINAL VICTORIA SETUP:');
    console.log(`   Name: ${updatedVictoria.name}`);
    console.log(`   Email: ${updatedVictoria.email}`);
    console.log(`   Username: ${updatedVictoria.username}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Timezone: ${updatedVictoria.timezone} (East Coast)`);
    console.log(`   Active: ${updatedVictoria.isActive}`);
    console.log('');

    // Verify password works
    console.log('🔐 Verifying password...');
    const passwordTest = await bcrypt.compare(newPassword, hashedPassword);
    console.log(`   Password verification: ${passwordTest ? '✅ SUCCESS' : '❌ FAILED'}`);

    // Check workspace membership
    const membership = await prisma.workspace_users.findFirst({
      where: { userId: victoria.id },
      include: {
        workspace: {
          select: { name: true, slug: true }
        }
      }
    });

    if (membership) {
      console.log(`   Workspace: ${membership.workspace.name} (${membership.role})`);
    }

    console.log('');
    console.log('🎉 Victoria is ready to log in with:');
    console.log('   Username: vleland');
    console.log('   Password: TOPgtm01!');

  } catch (error) {
    console.error('❌ Error updating Victoria:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateVictoriaFinal();
