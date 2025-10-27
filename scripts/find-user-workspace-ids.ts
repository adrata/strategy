import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find Dano, Ryan, and Ross user IDs
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { name: { contains: 'Dano' } },
        { name: { contains: 'Ryan' } },
        { name: { contains: 'Ross' } }
      ]
    },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      activeWorkspaceId: true 
    }
  });

  console.log('Users found:');
  users.forEach(user => {
    console.log(`${user.name} (${user.email}): ${user.id}`);
    console.log(`  Active Workspace: ${user.activeWorkspaceId}`);
  });

  // Find Notary Everyday workspace
  const notaryWorkspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary' } },
        { name: { contains: 'notary' } },
        { slug: { contains: 'notary' } }
      ]
    },
    select: { id: true, name: true, slug: true }
  });

  console.log('\nNotary Everyday workspace:');
  console.log(`${notaryWorkspace?.name} (${notaryWorkspace?.slug}): ${notaryWorkspace?.id}`);

  // Check current assignments in Notary workspace
  if (notaryWorkspace) {
    const companies = await prisma.companies.count({
      where: { workspaceId: notaryWorkspace.id }
    });
    
    const people = await prisma.people.count({
      where: { workspaceId: notaryWorkspace.id }
    });

    console.log(`\nNotary workspace has ${companies} companies and ${people} people`);

    // Check current main seller assignments
    const companiesWithSellers = await prisma.companies.findMany({
      where: { 
        workspaceId: notaryWorkspace.id,
        mainSellerId: { not: null }
      },
      select: { id: true, name: true, mainSellerId: true }
    });

    console.log(`\nCompanies with main sellers: ${companiesWithSellers.length}`);
    companiesWithSellers.slice(0, 5).forEach(c => {
      console.log(`  ${c.name}: ${c.mainSellerId}`);
    });
  }

  await prisma.$disconnect();
}

main().catch(console.error);
