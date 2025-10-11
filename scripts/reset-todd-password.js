#!/usr/bin/env node

/**
 * 🔧 RESET TODD'S PASSWORD
 * Resets Todd's password to a known value for testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetToddPassword() {
  try {
    console.log('🔧 Resetting Todd\'s password...');

    // Hash a new password
    const newPassword = 'ToddGenius!'; // Todd's preferred password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // First find Todd's ID
    const toddUser = await prisma.users.findFirst({
      where: { 
        OR: [
          { username: 'todd' },
          { email: 'todd@adrata.com' }
        ]
      },
      select: { id: true }
    });

    if (!toddUser) {
      console.log('❌ Todd not found in database');
      return;
    }

    // Update Todd's password using his ID
    const updatedUser = await prisma.users.update({
      where: { id: toddUser.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true
      }
    });

    console.log('✅ Todd\'s password updated successfully!');
    console.log('📧 Email:', updatedUser.email);
    console.log('👤 Username:', updatedUser.username);
    console.log('📝 Name:', updatedUser.name);
    console.log('🔑 New Password:', newPassword);

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetToddPassword();
