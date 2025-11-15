#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findTestPeople() {
  try {
    const ws = '01K75ZD7DWHG1XF16HAF2YVKCK';
    
    // Find people with LinkedIn
    const withLinkedIn = await prisma.people.findMany({
      where: {
        workspaceId: ws,
        deletedAt: null,
        linkedinUrl: { not: null },
        coresignalData: null
      },
      include: {
        company: {
          select: {
            name: true,
            linkedinUrl: true
          }
        }
      },
      take: 3
    });
    
    console.log(`People with LinkedIn (${withLinkedIn.length}):`);
    for (const p of withLinkedIn) {
      console.log(`  ${p.fullName}: ${p.linkedinUrl} (Company: ${p.company?.name})`);
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    await prisma.$disconnect();
  }
}

findTestPeople();

