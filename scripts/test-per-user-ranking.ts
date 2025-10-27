import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Ross's user ID
  const ross = await prisma.users.findFirst({
    where: {
      OR: [
        { email: { contains: 'ross' } },
        { name: { contains: 'Ross' } }
      ]
    },
    select: { id: true, name: true, email: true, activeWorkspaceId: true }
  });

  console.log('Ross user:', ross);

  if (ross && ross.activeWorkspaceId) {
    // First, assign some people to Ross for testing
    console.log('\nAssigning people to Ross for testing...');
    
    const unassignedPeople = await prisma.people.findMany({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: null
      },
      take: 5,
      select: { id: true, fullName: true }
    });

    if (unassignedPeople.length > 0) {
      console.log(`Found ${unassignedPeople.length} unassigned people to assign to Ross`);
      
      // Assign first 5 people to Ross
      await prisma.people.updateMany({
        where: {
          id: { in: unassignedPeople.map(p => p.id) }
        },
        data: {
          mainSellerId: ross.id
        }
      });
      
      console.log('Assigned people to Ross:', unassignedPeople.map(p => p.fullName));
    }

    // Now check Ross's people before re-ranking
    console.log('\nRoss\'s people before re-ranking:');
    const rossPeopleBefore = await prisma.people.findMany({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ross.id
      },
      orderBy: { globalRank: 'asc' },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    rossPeopleBefore.forEach(p => {
      console.log(`Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });

    // Simulate re-ranking by calling the re-rank endpoint
    console.log('\nTriggering re-rank for Ross...');
    
    try {
      const response = await fetch('http://localhost:3000/api/v1/speedrun/re-rank', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-workspace-id': ross.activeWorkspaceId,
          'x-user-id': ross.id
        },
        body: JSON.stringify({
          completedCount: 0,
          triggerAutoFetch: false,
          isDailyReset: false,
          manualRankUpdate: false,
          trigger: 'manual-test'
        })
      });

      const result = await response.json();
      console.log('Re-rank result:', result.success ? 'Success' : 'Failed', result.message || result.error);

      if (result.success) {
        // Check Ross's people after re-ranking
        console.log('\nRoss\'s people after re-ranking:');
        const rossPeopleAfter = await prisma.people.findMany({
          where: {
            workspaceId: ross.activeWorkspaceId,
            deletedAt: null,
            companyId: { not: null },
            mainSellerId: ross.id
          },
          orderBy: { globalRank: 'asc' },
          select: {
            id: true,
            fullName: true,
            globalRank: true,
            company: { select: { name: true } }
          }
        });

        rossPeopleAfter.forEach(p => {
          console.log(`Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
        });
      }
    } catch (error) {
      console.error('Error calling re-rank endpoint:', error);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
