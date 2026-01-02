#!/usr/bin/env node

/**
 * Check Finn's current password hash
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkFinnPassword() {
  try {
    const finn = await prisma.users.findFirst({
      where: {
        email: { equals: 'finn@runegateco.com', mode: 'insensitive' },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        updatedAt: true
      }
    });

    if (!finn) {
      console.log('❌ Finn not found!');
      return;
    }

    console.log('Finn User Details:');
    console.log(`  ID: ${finn.id}`);
    console.log(`  Email: ${finn.email}`);
    console.log(`  Name: ${finn.name}`);
    console.log(`  Password exists: ${!!finn.password}`);
    console.log(`  Password length: ${finn.password?.length || 0}`);
    console.log(`  Password prefix: ${finn.password?.substring(0, 20) || 'N/A'}...`);
    console.log(`  Updated at: ${finn.updatedAt}`);

    // Test with the password we set
    const testPassword = 'Rn&%b53kUWfaZA';
    if (finn.password) {
      const isValid = await bcrypt.compare(testPassword, finn.password);
      console.log(`\nPassword test with 'Rn&%b53kUWfaZA': ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinnPassword();
