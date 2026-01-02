#!/usr/bin/env node

/**
 * Test Finn's login credentials
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testFinnLogin() {
  try {
    const testEmail = 'finn@runegateco.com';
    const testPassword = 'Rn&%b53kUWfaZA';

    console.log('Testing login for:', testEmail);
    console.log('Password:', testPassword);
    console.log('');

    // Test 1: Find user with exact email (case-sensitive)
    console.log('Test 1: Find user with exact case');
    const userExact = await prisma.users.findFirst({
      where: {
        email: testEmail,
        isActive: true
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    console.log(`  Result: ${userExact ? '✅ Found' : '❌ Not found'}`);
    if (userExact) {
      console.log(`  Email in DB: "${userExact.email}"`);
      console.log(`  Email match: ${userExact.email === testEmail ? '✅ Exact match' : '❌ Case mismatch'}`);
    }

    // Test 2: Find user with lowercase email
    console.log('\nTest 2: Find user with lowercase email');
    const userLower = await prisma.users.findFirst({
      where: {
        email: testEmail.toLowerCase(),
        isActive: true
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    console.log(`  Result: ${userLower ? '✅ Found' : '❌ Not found'}`);
    if (userLower) {
      console.log(`  Email in DB: "${userLower.email}"`);
    }

    // Test 3: Find user with case-insensitive search
    console.log('\nTest 3: Find user with case-insensitive search');
    const userInsensitive = await prisma.users.findFirst({
      where: {
        email: { equals: testEmail, mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        password: true
      }
    });
    console.log(`  Result: ${userInsensitive ? '✅ Found' : '❌ Not found'}`);
    if (userInsensitive) {
      console.log(`  Email in DB: "${userInsensitive.email}"`);
    }

    // Test 4: Password validation
    const user = userInsensitive || userLower || userExact;
    if (user && user.password) {
      console.log('\nTest 4: Password validation');
      const isValid = await bcrypt.compare(testPassword, user.password);
      console.log(`  Result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      // Also test with different case variations
      console.log('\nTest 5: Password case variations');
      const variations = [
        testPassword,
        testPassword.toLowerCase(),
        testPassword.toUpperCase(),
        testPassword.trim()
      ];
      for (const variant of variations) {
        const valid = await bcrypt.compare(variant, user.password);
        console.log(`  "${variant}": ${valid ? '✅' : '❌'}`);
      }
    } else {
      console.log('\n❌ Cannot test password - user not found or no password set');
    }

    // Test 6: Check all users with similar email
    console.log('\nTest 6: All users with similar email pattern');
    const allSimilar = await prisma.users.findMany({
      where: {
        email: { contains: 'runegateco.com', mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    console.log(`  Found ${allSimilar.length} user(s):`);
    allSimilar.forEach(u => {
      console.log(`    - ${u.email} (${u.name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinnLogin();
