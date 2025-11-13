#!/usr/bin/env ts-node
/**
 * Find LiteLinx company by the ID from the URL
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findByCompanyId() {
  const companyId = '01K9QD3V1XX8M1FXQ54B2MTDKG'; // From URL
  
  console.log(`\n🔍 [SEARCH] Looking for company ID: ${companyId}\n`);

  // Find company by ID
  const company = await prisma.companies.findUnique({
    where: {
      id: companyId,
    },
    select: {
      id: true,
      name: true,
      website: true,
      workspaceId: true,
      deletedAt: true,
      _count: {
        select: {
          people: true,
        },
      },
    },
  });

  if (!company) {
    console.log('❌ Company not found with that ID');
    return;
  }

  console.log(`✅ Found company:`);
  console.log(`   Name: ${company.name}`);
  console.log(`   ID: ${company.id}`);
  console.log(`   Workspace: ${company.workspaceId}`);
  console.log(`   Website: ${company.website || 'Not set'}`);
  console.log(`   Deleted: ${company.deletedAt ? 'YES' : 'NO'}`);
  console.log(`   People count: ${company._count.people}\n`);

  // Find people for this company
  const people = await prisma.people.findMany({
    where: {
      companyId: companyId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      jobTitle: true,
      email: true,
      status: true,
    },
  });

  console.log(`📊 Found ${people.length} people with companyId set to this company:\n`);

  if (people.length > 0) {
    people.forEach((person, i) => {
      console.log(`${i + 1}. ${person.fullName} - ${person.jobTitle || 'No title'}`);
      console.log(`   Email: ${person.email || 'Not set'}`);
      console.log(`   Status: ${person.status || 'Not set'}`);
      console.log(`   ID: ${person.id}\n`);
    });
  } else {
    console.log('   No people linked to this company\n');

    // Search for people with company name but no companyId
    console.log(`🔍 Searching for people with currentCompany = "${company.name}"...\n`);
    
    const unlinkedPeople = await prisma.people.findMany({
      where: {
        OR: [
          { currentCompany: { contains: company.name, mode: 'insensitive' } },
          { currentCompany: { contains: 'LiteLinx', mode: 'insensitive' } },
        ],
        workspaceId: company.workspaceId,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        status: true,
        companyId: true,
        currentCompany: true,
      },
    });

    console.log(`📊 Found ${unlinkedPeople.length} people with matching company name:\n`);

    unlinkedPeople.forEach((person, i) => {
      console.log(`${i + 1}. ${person.fullName} - ${person.jobTitle || 'No title'}`);
      console.log(`   Email: ${person.email || 'Not set'}`);
      console.log(`   Status: ${person.status || 'Not set'}`);
      console.log(`   companyId: ${person.companyId || 'NULL'}`);
      console.log(`   currentCompany: ${person.currentCompany || 'Not set'}`);
      console.log(`   ID: ${person.id}\n`);
    });
  }
}

async function main() {
  try {
    await findByCompanyId();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

