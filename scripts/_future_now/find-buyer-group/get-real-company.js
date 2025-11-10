const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getTestCompany() {
  // Get a company with website and LinkedIn URL for better results
  const company = await prisma.companies.findFirst({
    where: {
      workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2',
      deletedAt: null,
      website: { not: null },
      linkedinUrl: { not: null }
    },
    select: {
      id: true,
      name: true,
      website: true,
      linkedinUrl: true,
      mainSellerId: true,
      industry: true,
      employeeCount: true
    },
    take: 1
  });
  
  if (!company) {
    // Fallback to any company with website
    const fallback = await prisma.companies.findFirst({
      where: {
        workspaceId: '01K9QAP09FHT6EAP1B4G2KP3D2',
        deletedAt: null,
        website: { not: null }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        mainSellerId: true,
        industry: true,
        employeeCount: true
      },
      take: 1
    });
    
    console.log('Selected company:', JSON.stringify(fallback, null, 2));
    await prisma.$disconnect();
    return fallback;
  }
  
  console.log('Selected company:', JSON.stringify(company, null, 2));
  await prisma.$disconnect();
  return company;
}

getTestCompany().catch(console.error);

