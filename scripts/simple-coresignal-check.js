#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

async function simpleCheck() {
  const prisma = new PrismaClient();
  
  try {
    const total = await prisma.people.count({ where: { workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1' } });
    const withId = await prisma.people.count({ 
      where: { 
        workspaceId: '01K5D01YCQJ9TJ7CT4DZDE79T1',
        customFields: { path: ['coresignalId'], not: null }
      } 
    });
    
    console.log(`Total: ${total}`);
    console.log(`With CoreSignal ID: ${withId}`);
    console.log(`Without CoreSignal ID: ${total - withId}`);
    console.log(`Coverage: ${((withId/total)*100).toFixed(1)}%`);
    
  } finally {
    await prisma.$disconnect();
  }
}

simpleCheck();
