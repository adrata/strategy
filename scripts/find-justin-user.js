#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findJustinUser() {
  try {
    await prisma.$connect();
    
    // Search for users with cloudcaddieconsulting.com
    const users = await prisma.users.findMany({
      where: {
        OR: [
          { email: { contains: 'cloudcaddieconsulting', mode: 'insensitive' } },
          { email: { contains: 'justin', mode: 'insensitive' } },
          { name: { contains: 'Justin', mode: 'insensitive' } }
        ],
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
    
    console.log('Found users:');
    console.log(JSON.stringify(users, null, 2));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

findJustinUser();
