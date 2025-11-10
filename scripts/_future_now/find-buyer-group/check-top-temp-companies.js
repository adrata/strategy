const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getCompanies() {
  const companies = await prisma.companies.findMany({
    where: {
      workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2',
      deletedAt: null,
      OR: [
        { website: { not: null } },
        { linkedinUrl: { not: null } }
      ]
    },
    select: {
      id: true,
      name: true,
      website: true,
      linkedinUrl: true,
      mainSellerId: true
    },
    take: 5,
    orderBy: { name: 'asc' }
  });
  
  console.log(JSON.stringify(companies, null, 2));
  await prisma.$disconnect();
}

getCompanies().catch(console.error);

