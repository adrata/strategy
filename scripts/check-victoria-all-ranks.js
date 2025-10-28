#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check all people for Victoria
    const people = await prisma.people.findMany({
      where: {
        workspaceId: '01K75ZD7DWHG1XF16HAF2YVKCK',
        mainSellerId: '01K7B327HWN9G6KGWA97S1TK43',
        deletedAt: null,
        companyId: { not: null }
      },
      orderBy: { globalRank: 'asc' },
      take: 20,
      select: {
        globalRank: true,
        firstName: true,
        lastName: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Found ${people.length} people for Victoria Leland`);
    console.log('First 20 people by globalRank:');
    people.forEach(p => console.log(`Rank ${p.globalRank}: ${p.firstName} ${p.lastName} (${p.company?.name})`));
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();

