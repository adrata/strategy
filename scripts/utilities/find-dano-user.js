#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function findDanoUser() {
  try {
    await prisma.$connect();
    console.log('🔍 FINDING DANO\'S USER ID\n');
    
    // Search for Dano in users table
    const danoUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u."createdAt"
      FROM users u
      WHERE (
        u."firstName" ILIKE '%Dano%' 
        OR u."lastName" ILIKE '%Dano%'
        OR u.email ILIKE '%dano%'
      )
      ORDER BY u."firstName", u."lastName"
    `;

    if (danoUsers.length > 0) {
      console.log(`Found ${danoUsers.length} Dano users:\n`);
      danoUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No Dano users found');
    }

    // Also search for "Just Dano" as mentioned in the previous activity
    const justDanoUsers = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.email,
        u."firstName",
        u."lastName",
        u."createdAt"
      FROM users u
      WHERE (
        u."firstName" ILIKE '%Just%' 
        OR u."lastName" ILIKE '%Just%'
        OR u."firstName" ILIKE '%Dano%' 
        OR u."lastName" ILIKE '%Dano%'
      )
      ORDER BY u."firstName", u."lastName"
    `;

    if (justDanoUsers.length > 0) {
      console.log(`Found ${justDanoUsers.length} users with "Just" or "Dano" in name:\n`);
      justDanoUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Email: ${user.email || 'N/A'}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findDanoUser();
