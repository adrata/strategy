#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.users.findMany({
      select: { id: true, username: true, email: true }
    });
    
    console.log('Available users:');
    users.forEach(u => console.log(`- ${u.username} (${u.email})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();