require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const TOP_ENGINEERING_PLUS_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

(async () => {
  // Check top-temp
  const topTempCompanies = await prisma.companies.count({
    where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null }
  });
  const topTempPeople = await prisma.people.count({
    where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null }
  });

  // Check TOP Engineering Plus
  const topEngCompanies = await prisma.companies.count({
    where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
  });
  const topEngPeople = await prisma.people.count({
    where: { workspaceId: TOP_ENGINEERING_PLUS_WORKSPACE_ID, deletedAt: null }
  });

  console.log('Top-temp (active):', { companies: topTempCompanies, people: topTempPeople });
  console.log('TOP Engineering Plus (active):', { companies: topEngCompanies, people: topEngPeople });

  // Get a sample company ID from top-temp to check if it exists in TOP Eng
  const sampleTopTempCompany = await prisma.companies.findFirst({
    where: { workspaceId: TOP_TEMP_WORKSPACE_ID, deletedAt: null },
    select: { id: true, name: true }
  });

  if (sampleTopTempCompany) {
    const inTopEng = await prisma.companies.findUnique({
      where: { id: sampleTopTempCompany.id },
      select: { id: true, name: true, workspaceId: true }
    });
    console.log('\nSample top-temp company:', sampleTopTempCompany);
    console.log('Same company in TOP Eng:', inTopEng);
  }

  await prisma.$disconnect().catch(() => {});
})();

