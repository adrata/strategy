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
    // Get speedrun data for Ross
    const speedrunPeople = await prisma.people.findMany({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null }
      },
      orderBy: { globalRank: 'asc' },
      take: 15,
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        mainSellerId: true,
        company: {
          select: { name: true }
        }
      }
    });

    console.log('\nTop 15 ranked people in workspace:');
    speedrunPeople.forEach(p => {
      console.log(`Rank ${p.globalRank}: ${p.fullName} (${p.company?.name}) - Owner: ${p.mainSellerId === ross.id ? 'Ross' : p.mainSellerId || 'None'}`);
    });
    
    // Count total people by ownership
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null }
      }
    });
    
    const rossPeople = await prisma.people.count({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: ross.id
      }
    });
    
    const unassignedPeople = await prisma.people.count({
      where: {
        workspaceId: ross.activeWorkspaceId,
        deletedAt: null,
        companyId: { not: null },
        mainSellerId: null
      }
    });
    
    console.log('\nPeople counts:');
    console.log(`Total: ${totalPeople}`);
    console.log(`Ross's: ${rossPeople}`);
    console.log(`Unassigned: ${unassignedPeople}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);

