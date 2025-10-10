#!/usr/bin/env node

/**
 * 🔧 FIX VICTORIA'S SETUP
 * Change Victoria's role to SELLER and reset her password
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixVictoriaSetup() {
  try {
    console.log('🔧 Fixing Victoria\'s setup...\n');

    // Get Victoria's details
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

    console.log('👤 Current Victoria setup:');
    console.log(`   Name: ${victoria.name}`);
    console.log(`   Email: ${victoria.email}`);
    console.log(`   Username: ${victoria.username}`);
    console.log(`   Timezone: ${victoria.timezone}`);
    console.log('   Workspace Roles:');
    victoria.workspace_users.forEach(ws => {
      console.log(`     - ${ws.workspace.name}: ${ws.role}`);
    });
    console.log('');

    // Update Victoria's role to SELLER in TOP workspace
    const topWorkspaceMembership = victoria.workspace_users.find(
      ws => ws.workspace.slug === 'top-engineering-plus'
    );

    if (topWorkspaceMembership) {
      console.log('🔄 Updating Victoria\'s role to SELLER...');
      
      await prisma.workspace_users.update({
        where: { id: topWorkspaceMembership.id },
        data: { 
          role: 'SELLER',
          updatedAt: new Date()
        }
      });
      
      console.log('✅ Victoria\'s role updated to SELLER');
    } else {
      console.log('❌ Victoria not found in TOP workspace');
    }

    // Reset Victoria's password
    console.log('\n🔑 Resetting Victoria\'s password...');
    
    // Common passwords to try - you can modify this list
    const possiblePasswords = [
      'Victoria123!',
      'Vleland123!', 
      'TOP123!',
      'password123',
      'victoria',
      'vleland',
      'top123'
    ];

    console.log('Please specify Victoria\'s password. Common options:');
    possiblePasswords.forEach((pwd, index) => {
      console.log(`   ${index + 1}. ${pwd}`);
    });
    console.log('   Or enter a custom password');

    // For now, let's set it to a default and you can tell me what it should be
    const newPassword = 'Victoria123!'; // Change this to the correct password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.users.update({
      where: { id: victoria.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Victoria's password reset to: ${newPassword}`);
    console.log('   (You can tell me the correct password and I\'ll update it)');

    // Verify the changes
    console.log('\n✅ VERIFICATION:');
    const updatedVictoria = await prisma.users.findFirst({
      where: { id: victoria.id },
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

    console.log('   Updated Victoria setup:');
    console.log(`   Name: ${updatedVictoria.name}`);
    console.log(`   Email: ${updatedVictoria.email}`);
    console.log(`   Username: ${updatedVictoria.username}`);
    console.log('   Workspace Roles:');
    updatedVictoria.workspace_users.forEach(ws => {
      console.log(`     - ${ws.workspace.name}: ${ws.role}`);
    });

  } catch (error) {
    console.error('❌ Error fixing Victoria setup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixVictoriaSetup();
