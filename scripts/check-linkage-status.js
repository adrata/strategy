#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatus() {
  try {
    const totalPeople = await prisma.people.count({
      where: { workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', deletedAt: null }
    });
    
    const linkedPeople = await prisma.people.count({
      where: { 
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', 
        deletedAt: null,
        companyId: { not: null }
      }
    });
    
    const unlinkedPeople = await prisma.people.findMany({
      where: { 
        workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1', 
        deletedAt: null,
        companyId: null
      },
      select: {
        id: true,
        fullName: true,
        enrichedData: true,
        coresignalData: true,
        customFields: true
      },
      take: 5
    });
    
    console.log('Current Status:');
    console.log('Total people:', totalPeople);
    console.log('Linked people:', linkedPeople);
    console.log('Unlinked people:', totalPeople - linkedPeople);
    console.log('Linkage rate:', ((linkedPeople / totalPeople) * 100).toFixed(1) + '%');
    
    console.log('\nSample unlinked people data:');
    unlinkedPeople.forEach((person, i) => {
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

checkStatus();
