const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTestCompany() {
  const company = await prisma.companies.findFirst({
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
    take: 1
  });
  
  console.log('Test company:', JSON.stringify(company, null, 2));
  await prisma.$disconnect();
  
  if (company) {
    return company;
  }
  return null;
}

getTestCompany().catch(console.error);

