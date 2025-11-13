#!/usr/bin/env ts-node
/**
 * Find companies and people with "linx" in their name
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findLinxData() {
  console.log('\n🔍 [SEARCH] Looking for companies with "linx" in name...\n');

  // Find companies with "linx" in name
  const companies = await prisma.companies.findMany({
    where: {
      name: { contains: 'linx', mode: 'insensitive' },
      workspaceId: '01K7DNYR5VZ7JY36KGKKN76XZ1',
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      website: true,
      _count: {
        select: {
          people: true,
        },
      },
    },
  });

  console.log(`📊 Found ${companies.length} companies with "linx" in name:\n`);

  companies.forEach((company, i) => {
    console.log(`${i + 1}. ${company.name}`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Website: ${company.website || 'Not set'}`);
    console.log(`   People count: ${company._count.people}`);
    console.log();
  });

  // Find people with "linx" in company fields
  const people = await prisma.people.findMany({
    where: {
      OR: [
        { currentCompany: { contains: 'linx', mode: 'insensitive' } },
        { fullName: { contains: 'Alex Freylekhman', mode: 'insensitive' } },
        { fullName: { contains: 'Shane Turner', mode: 'insensitive' } },
        { fullName: { contains: 'Taryn Sipperly', mode: 'insensitive' } },
        { fullName: { contains: 'Plinio', mode: 'insensitive' } },
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
      enrichedData: true,
      coresignalData: true,
      company: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    take: 20,
  });

  console.log(`\n🔍 Found ${people.length} people related to search:\n`);

  people.forEach((person, i) => {
    console.log(`${i + 1}. ${person.fullName} - ${person.jobTitle || 'No title'}`);
    console.log(`   ID: ${person.id}`);
    console.log(`   Email: ${person.email || 'Not set'}`);
    console.log(`   companyId: ${person.companyId || 'NULL'}`);
    console.log(`   currentCompany: ${person.currentCompany || 'Not set'}`);
    
    if (person.company) {
      console.log(`   Linked Company: ${person.company.name} (${person.company.id})`);
    }
    
    // Check enrichedData
    if (person.enrichedData && typeof person.enrichedData === 'object') {
      const enriched = person.enrichedData as any;
      if (enriched.overview?.companyName) {
        console.log(`   enrichedData.overview.companyName: ${enriched.overview.companyName}`);
      }
      if (enriched.company) {
        console.log(`   enrichedData.company: ${enriched.company}`);
      }
    }
    
    // Check coresignalData
    if (person.coresignalData && typeof person.coresignalData === 'object') {
      const coresignal = person.coresignalData as any;
      if (coresignal.company) {
        console.log(`   coresignalData.company: ${coresignal.company}`);
      }
    }
    
    console.log();
  });
}

async function main() {
  try {
    await findLinxData();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

