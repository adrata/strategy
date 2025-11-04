#!/usr/bin/env node

/**
 * 🔍 CHECK JUSTIN JOHNSON USERNAME
 * 
 * Checks if Justin has a username set and what it is
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkJustinUsername() {
  try {
    console.log('🔍 CHECKING JUSTIN JOHNSON USERNAME');
    console.log('===================================\n');
    
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
        username: true
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
    console.log(`   Username: ${justin.username || 'NOT SET (null)'}`);
    
    if (!justin.username) {
      console.log('\n⚠️  Justin does NOT have a username set.');
      console.log('   The system may allow login with email instead.');
      console.log('   I can set a username if needed.');
    } else {
      console.log(`\n✅ Username is set to: "${justin.username}"`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJustinUsername();

