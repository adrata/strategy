#!/usr/bin/env ts-node
/**
 * Check if LiteLinx leads have companyId set
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkLiteLinxLeads() {
  console.log('\n🔍 [CHECK] Looking for LiteLinx leads...\n');

  // Find LiteLinx company
  const liteLinxCompany = await prisma.companies.findFirst({
    where: {
      name: { contains: 'LiteLinx', mode: 'insensitive' },
      workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!liteLinxCompany) {
    console.log('❌ LiteLinx company not found');
    return;
  }

  console.log(`✅ Found company: ${liteLinxCompany.name} (${liteLinxCompany.id})\n`);

  // Find people at LiteLinx
  const liteLinxPeople = await prisma.people.findMany({
    where: {
      companyId: liteLinxCompany.id,
      workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      email: true,
      companyId: true,
      currentCompany: true,
    },
  });

  console.log(`📊 Found ${liteLinxPeople.length} people with companyId = LiteLinx\n`);

  if (liteLinxPeople.length > 0) {
    console.log('People linked to LiteLinx:');
    liteLinxPeople.forEach((person, i) => {
      console.log(`${i + 1}. ${person.fullName} - ${person.jobTitle || 'No title'} - ${person.email || 'No email'}`);
      console.log(`   ID: ${person.id}`);
      console.log(`   companyId: ${person.companyId}`);
      console.log(`   currentCompany: ${person.currentCompany || 'Not set'}\n`);
    });
  }

  // Also search by name in case they're stored differently
  const leadsByName = await prisma.people.findMany({
    where: {
      OR: [
        { fullName: { contains: 'Alex Freylekhman', mode: 'insensitive' } },
        { fullName: { contains: 'Shane Turner', mode: 'insensitive' } },
        { fullName: { contains: 'Taryn Sipperly', mode: 'insensitive' } },
        { fullName: { contains: 'Plinio Corrêa', mode: 'insensitive' } },
        { fullName: { contains: 'Plinio Correa', mode: 'insensitive' } },
      ],
      workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      email: true,
      companyId: true,
      currentCompany: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  console.log(`\n🔍 Searching for specific leads by name: Found ${leadsByName.length}\n`);

  leadsByName.forEach((person, i) => {
    console.log(`${i + 1}. ${person.fullName} - ${person.jobTitle || 'No title'}`);
    console.log(`   ID: ${person.id}`);
    console.log(`   companyId: ${person.companyId || 'NULL'}`);
    console.log(`   currentCompany: ${person.currentCompany || 'Not set'}`);
    if (person.company) {
      console.log(`   Linked Company: ${person.company.name} (${person.company.id})`);
    } else {
      console.log(`   Linked Company: NONE`);
    }
    console.log();
  });
}

async function main() {
  try {
    await checkLiteLinxLeads();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

