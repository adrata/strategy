#!/usr/bin/env node

/**
 * 🔍 CHECK JUSTIN JOHNSON PASSWORD STATUS
 * 
 * Checks if Justin has a password set in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJustinPassword() {
  try {
    console.log('🔍 CHECKING JUSTIN JOHNSON PASSWORD STATUS');
    console.log('==========================================\n');
    
    await prisma.$connect();
    
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { name: { contains: 'Justin Johnson', mode: 'insensitive' } },
          { email: { contains: 'justin', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true
      }
    });
    
    if (!justin) {
      console.log('❌ Justin Johnson user not found');
      return;
    }
    
    console.log('👤 USER INFORMATION:');
    console.log(`   ID: ${justin.id}`);
    console.log(`   Name: ${justin.name}`);
    console.log(`   Email: ${justin.email}`);
    console.log(`   Password: ${justin.password ? 'SET (hashed)' : 'NOT SET (null)'}`);
    
    if (justin.password) {
      console.log(`   Password Hash Length: ${justin.password.length} characters`);
      console.log(`   Password Hash Preview: ${justin.password.substring(0, 20)}...`);
      console.log('\n⚠️  Password is hashed and cannot be retrieved in plain text.');
      console.log('   If you need to reset it, I can create a password reset script.');
    } else {
      console.log('\n⚠️  Justin does NOT have a password set.');
      console.log('   He will not be able to log in until a password is set.');
      console.log('   I can create a script to set a password for him.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJustinPassword();

