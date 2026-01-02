#!/usr/bin/env node

/**
 * Direct Password Reset for Finn
 * 
 * Target: finn@runegateco.com
 * 
 * This script generates a new temporary password and updates it directly in the database.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

const TARGET_USER = {
  email: 'finn@runegateco.com',
  name: 'Finn'
};

// Generate a secure random password
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const special = '!@#$%&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function resetPassword() {
  console.log('========================================');
  console.log('   DIRECT PASSWORD RESET - FINN');
  console.log('========================================');
  console.log(`Target: ${TARGET_USER.email}`);
  console.log('');

  try {
    await prisma.$connect();
    console.log('Connected to database');

    // Find the user
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
      console.log(`\nERROR: User not found: ${TARGET_USER.email}`);
      return;
    }

    console.log(`\nFound user:`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Name: ${user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}`);
    console.log(`  Email: ${user.email}`);

    // Generate new password
    const newPassword = generateSecurePassword(14);
    
    // Hash the password with bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user's password in database
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
    console.log('');
    console.log('NEW CREDENTIALS:');
    console.log('----------------------------------------');
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${newPassword}`);
    console.log('----------------------------------------');
    console.log('');
    console.log('Please share these credentials securely with Finn.');
    console.log('They should change this password after first login.');
    console.log('========================================\n');

    return { success: true, email: user.email, password: newPassword };

  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
