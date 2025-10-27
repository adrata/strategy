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
    // Get Ross's people
    const rossPeople = await prisma.people.findMany({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ross.id
      },
      orderBy: { createdAt: 'asc' }, // Order by creation date for consistent ranking
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        company: { select: { name: true } }
      }
    });

    console.log(`\nRoss has ${rossPeople.length} people assigned to him`);

    if (rossPeople.length > 0) {
      // Manually assign simple sequential ranks 1-N
      console.log('\nAssigning simple sequential ranks...');
      
      for (let i = 0; i < rossPeople.length; i++) {
        const person = rossPeople[i];
        await prisma.people.update({
          where: { id: person.id },
          data: {
            globalRank: i + 1,
            customFields: {
              userRank: i + 1,
              userId: ross.id,
              rankingMode: 'global'
            }
          }
        });
        
        console.log(`Assigned rank ${i + 1} to ${person.fullName}`);
      }

      // Check the results
      console.log('\nRoss\'s people after manual ranking:');
      const updatedPeople = await prisma.people.findMany({
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
          company: { select: { name: true } },
          customFields: true
        }
      });

      updatedPeople.forEach(p => {
        console.log(`Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
        console.log(`  Custom fields:`, p.customFields);
      });
    } else {
      console.log('No people assigned to Ross. Assigning some test people...');
      
      // Assign some unassigned people to Ross
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
        
        // Now run the ranking again
        console.log('\nRe-running ranking after assignment...');
        return main(); // Recursive call
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
