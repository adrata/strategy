#!/usr/bin/env node

/**
 * 🔍 CHECK TODD'S PASSWORD
 * Checks Todd's current password hash and tests common passwords
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkToddPassword() {
  try {
    console.log('🔍 Checking Todd\'s password...');

    // Get Todd's current password hash
    const user = await prisma.users.findFirst({
      where: { 
        OR: [
          { username: 'todd' },
          { email: 'todd@adrata.com' }
        ]
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        password: true
      }
    });

    if (!user) {
      console.log('❌ Todd not found in database');
      return;
    }

    console.log('✅ Todd found:');
    console.log('📧 Email:', user.email);
    console.log('👤 Username:', user.username);
    console.log('📝 Name:', user.name);
    console.log('🔑 Has Password:', !!user.password);
    
    if (user.password) {
      console.log('🔐 Password Hash (first 20 chars):', user.password.substring(0, 20) + '...');
      
      // Test common passwords
      const commonPasswords = [
        'password',
        'todd',
        'toddpass',
        'password123',
        '123456',
        'admin',
        'test'
      ];
      
      console.log('\n🧪 Testing common passwords:');
      for (const testPassword of commonPasswords) {
        const isValid = await bcrypt.compare(testPassword, user.password);
        console.log(`  ${testPassword}: ${isValid ? '✅ MATCH' : '❌ No match'}`);
      }
    } else {
      console.log('⚠️ No password set for Todd');
    }

  } catch (error) {
    console.error('❌ Error checking password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkToddPassword();
