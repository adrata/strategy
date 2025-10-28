#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find Victoria's user record
    const victoria = await prisma.users.findFirst({
      where: {
        name: { contains: 'Victoria' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeWorkspaceId: true
      }
    });
    
    console.log('Victoria user record:', victoria);
    
    if (victoria) {
      // Check people assigned to Victoria
      const people = await prisma.people.findMany({
        where: {
          mainSellerId: victoria.id
        },
        take: 5,
        select: {
          id: true,
          fullName: true,
          globalRank: true,
          workspaceId: true
        }
      });
      
      console.log(`\nPeople assigned to Victoria (${people.length} total):`);
      people.forEach(p => console.log(`  ${p.fullName} - Rank: ${p.globalRank} - Workspace: ${p.workspaceId}`));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
})();
