#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking intelligence status...\n');
  
  // Check for Minnesota Power specifically
  const minnesotaPower = await prisma.companies.findFirst({
    where: {
      name: {
        contains: 'Minnesota Power',
        mode: 'insensitive'
      },
      deletedAt: null
    },
    select: {
      id: true,
      name: true,
      industry: true,
      sector: true,
      customFields: true,
      descriptionEnriched: true
    }
  });
  
  if (minnesotaPower) {
    console.log('📊 Minnesota Power Status:');
    console.log(`   Name: ${minnesotaPower.name}`);
    console.log(`   ID: ${minnesotaPower.id}`);
    console.log(`   Industry: ${minnesotaPower.industry || 'NULL'}`);
    console.log(`   Sector: ${minnesotaPower.sector || 'NULL'}`);
    const customFields = minnesotaPower.customFields as any;
    console.log(`   Has Cached Intelligence: ${!!customFields?.intelligence ? 'YES' : 'NO'}`);
    if (customFields?.intelligence) {
      console.log(`   Cached Intelligence Industry: ${customFields.intelligence.industry}`);
    }
    if (customFields?.coresignalData?.industry) {
      console.log(`   CoreSignal Industry: ${customFields.coresignalData.industry}`);
    }
    console.log(`   Description Enriched: ${minnesotaPower.descriptionEnriched ? 'YES' : 'NO'}`);
    if (minnesotaPower.descriptionEnriched) {
      console.log(`   Description Preview: ${minnesotaPower.descriptionEnriched.substring(0, 150)}...`);
    }
  } else {
    console.log('❌ Minnesota Power not found in database');
  }
  
  // Check overall status
  console.log('\n📊 Overall Status:');
  const totalCompanies = await prisma.companies.count({
    where: { deletedAt: null }
  });
  
  const allCompanies = await prisma.companies.findMany({
    where: { deletedAt: null },
    select: { customFields: true }
  });
  
  const companiesWithIntelligence = allCompanies.filter(c => {
    const customFields = c.customFields as any;
    return customFields?.intelligence;
  }).length;
  
  console.log(`   Total companies: ${totalCompanies}`);
  console.log(`   Companies with cached intelligence: ${companiesWithIntelligence}`);
  console.log(`   Companies without cached intelligence: ${totalCompanies - companiesWithIntelligence}`);
  
  await prisma.$disconnect();
}

main()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

