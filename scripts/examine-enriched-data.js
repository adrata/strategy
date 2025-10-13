#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function examineData() {
  try {
    const people = await prisma.people.findMany({
      where: { 
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
        OR: [
          { enrichedData: { not: null } },
          { coresignalData: { not: null } },
          { customFields: { path: ['coresignalData'], not: null } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true
      },
      take: 3
    });

    console.log('Sample enriched data structure:');
    people.forEach((person, i) => {
      console.log(`\nPerson ${i+1}: ${person.fullName}`);
      console.log('enrichedData:', JSON.stringify(person.enrichedData, null, 2));
      console.log('coresignalData:', JSON.stringify(person.coresignalData, null, 2));
      console.log('customFields:', JSON.stringify(person.customFields, null, 2));
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

examineData();
