#!/usr/bin/env node

/**
 * 🔧 RESET JUSTIN JOHNSON PASSWORD
 * Resets Justin's password to a known value for CloudCaddie access
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetJustinPassword() {
  try {
    console.log('🔧 Resetting Justin Johnson\'s password...\n');

    // Generate a secure random password
    const crypto = require('crypto');
    const generateSecurePassword = () => {
      // Generate 32 random bytes (256 bits)
      const randomBytes = crypto.randomBytes(32);
      // Convert to base64 and take first 24 characters
      const base64 = randomBytes.toString('base64');
      // Add some special characters for complexity
      const specialChars = '!@#$%^&*';
      const randomSpecial = specialChars[Math.floor(Math.random() * specialChars.length)];
      // Combine: 20 chars from base64 + 1 special + 3 numbers
      const numbers = Math.floor(100 + Math.random() * 900).toString();
      return base64.substring(0, 20) + randomSpecial + numbers;
    };
    
    const newPassword = generateSecurePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 12); // Increased rounds for better security

    // Find Justin's user record
    const justinUser = await prisma.users.findFirst({
      where: { 
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { name: { contains: 'Justin Johnson', mode: 'insensitive' } }
        ]
      },
      select: { id: true, email: true, name: true }
    });

    if (!justinUser) {
      console.log('❌ Justin Johnson not found in database');
      return;
    }

    console.log(`✅ Found user: ${justinUser.name} (${justinUser.email})`);

    // Update Justin's password
    const updatedUser = await prisma.users.update({
      where: { id: justinUser.id },
      data: { 
        password: hashedPassword,
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    console.log('\n✅ Justin\'s password updated successfully!');
    console.log('═══════════════════════════════════════');
    console.log('🔑 LOGIN CREDENTIALS:');
    console.log('═══════════════════════════════════════');
    console.log(`   Email: ${updatedUser.email}`);
    console.log(`   Password: ${newPassword}`);
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetJustinPassword();

