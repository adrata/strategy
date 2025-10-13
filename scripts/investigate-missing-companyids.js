#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function investigateMissingCompanyIds() {
  try {
    // Get people with companyId references that weren't found
    const peopleWithMissingCompanyIds = await prisma.people.findMany({
      where: {
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
        deletedAt: null,
        companyId: null,
        OR: [
          { enrichedData: { path: ['overview', 'companyId'], not: null } },
          { customFields: { path: ['enrichedData', 'overview', 'companyId'], not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        enrichedData: true,
        customFields: true
      },
      take: 10
    });

    console.log('People with missing companyIds:');
    peopleWithMissingCompanyIds.forEach((person, i) => {
      const companyId1 = person.enrichedData?.overview?.companyId;
      const companyId2 = person.customFields?.enrichedData?.overview?.companyId;
      console.log(`${i+1}. ${person.fullName}`);
      console.log(`   enrichedData.companyId: ${companyId1}`);
      console.log(`   customFields.companyId: ${companyId2}`);
    });

    // Check if these companyIds exist in other workspaces
    const companyIds = peopleWithMissingCompanyIds
      .map(p => [p.enrichedData?.overview?.companyId, p.customFields?.enrichedData?.overview?.companyId])
      .flat()
      .filter(id => id);

    console.log(`\nChecking if these companyIds exist in other workspaces:`);
    for (const companyId of companyIds.slice(0, 5)) {
      const company = await prisma.companies.findFirst({
        where: { id: companyId },
        select: { id: true, name: true, workspaceId: true }
      });
      if (company) {
        console.log(`   ${companyId}: ${company.name} (workspace: ${company.workspaceId})`);
      } else {
        console.log(`   ${companyId}: NOT FOUND`);
      }
    }

    // Also check people with no company info at all
    const peopleWithNoCompanyInfo = await prisma.people.findMany({
      where: {
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
        deletedAt: null,
        companyId: null,
        enrichedData: null,
        coresignalData: null,
        customFields: null
      },
      select: {
        id: true,
        fullName: true,
        email: true
      },
      take: 5
    });

    console.log(`\nPeople with no company info at all:`);
    peopleWithNoCompanyInfo.forEach((person, i) => {
      console.log(`${i+1}. ${person.fullName} (${person.email})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateMissingCompanyIds();
