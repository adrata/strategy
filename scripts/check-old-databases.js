#!/usr/bin/env node

/**
 * 🔍 OLD DATABASE CHECKER
 * 
 * Checks different database instances for SBI data
 */

const { PrismaClient } = require('@prisma/client');

// Database instances to check
const databaseInstances = [
  {
    name: 'Production (Current)',
    url: 'postgresql://neondb_owner:npg_DtnFYHvWj6m8@ep-damp-math-a8ht5oj3.eastus2.azure.neon.tech/neondb?sslmode=require'
  },
  {
    name: 'Demo',
    url: 'postgresql://neondb_owner:npg_VKvSsd4Ay5ah@ep-twilight-flower-a84fjbo5.eastus2.azure.neon.tech/neondb?sslmode=require'
  },
  {
    name: 'Staging',
    url: 'postgresql://neondb_owner:npg_jdnNpCH0si6T@ep-yellow-butterfly-a8jr2jxz.eastus2.azure.neon.tech/neondb?sslmode=require'
  }
];

async function checkDatabase(instance) {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: instance.url
      }
    }
  });

  try {
    console.log(`\n🔍 Checking ${instance.name}...`);
    
    // Check if we can connect
    await prisma.$connect();
    console.log(`   ✅ Connected to ${instance.name}`);

    // Check for SBI data
    const sbiCompanies = await prisma.companies.count({
      where: {
        OR: [
          { name: { contains: 'SBI', mode: 'insensitive' } },
          { industry: { contains: 'SBI', mode: 'insensitive' } },
          { customFields: { path: ['sbi'], not: null } },
          { customFields: { path: ['source'], equals: 'sbi' } }
        ]
      }
    });

    const sbiPeople = await prisma.people.count({
      where: {
        OR: [
          { source: { contains: 'sbi', mode: 'insensitive' } },
          { customFields: { path: ['sbi'], not: null } },
          { customFields: { path: ['source'], equals: 'sbi' } }
        ]
      }
    });

    const totalCompanies = await prisma.companies.count();
    const totalPeople = await prisma.people.count();

    console.log(`   📊 Total companies: ${totalCompanies}`);
    console.log(`   👥 Total people: ${totalPeople}`);
    console.log(`   🏢 SBI companies: ${sbiCompanies}`);
    console.log(`   👤 SBI people: ${sbiPeople}`);

    if (sbiCompanies > 0 || sbiPeople > 0) {
      console.log(`   🎯 FOUND SBI DATA in ${instance.name}!`);
      
      // Get sample SBI data
      if (sbiCompanies > 0) {
        const sampleCompanies = await prisma.companies.findMany({
          where: {
            OR: [
              { name: { contains: 'SBI', mode: 'insensitive' } },
              { industry: { contains: 'SBI', mode: 'insensitive' } },
              { customFields: { path: ['sbi'], not: null } },
              { customFields: { path: ['source'], equals: 'sbi' } }
            ]
          },
          select: {
            id: true,
            name: true,
            industry: true,
            customFields: true,
            createdAt: true
          },
          take: 3
        });

        console.log(`   📋 Sample SBI companies:`);
        sampleCompanies.forEach(company => {
          console.log(`      - ${company.name} (${company.industry}) - ${company.createdAt}`);
        });
      }

      if (sbiPeople > 0) {
        const samplePeople = await prisma.people.findMany({
          where: {
            OR: [
              { source: { contains: 'sbi', mode: 'insensitive' } },
              { customFields: { path: ['sbi'], not: null } },
              { customFields: { path: ['source'], equals: 'sbi' } }
            ]
          },
          select: {
            id: true,
            fullName: true,
            title: true,
            source: true,
            customFields: true,
            createdAt: true
          },
          take: 3
        });

        console.log(`   📋 Sample SBI people:`);
        samplePeople.forEach(person => {
          console.log(`      - ${person.fullName} (${person.title}) - ${person.source} - ${person.createdAt}`);
        });
      }

      return {
        instance: instance.name,
        url: instance.url,
        sbiCompanies,
        sbiPeople,
        totalCompanies,
        totalPeople
      };
    }

    return null;

  } catch (error) {
    console.log(`   ❌ Error connecting to ${instance.name}: ${error.message}`);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function checkAllDatabases() {
  console.log('🔍 Checking all database instances for SBI data...\n');

  const results = [];
  
  for (const instance of databaseInstances) {
    const result = await checkDatabase(instance);
    if (result) {
      results.push(result);
    }
  }

  console.log('\n📋 SUMMARY:');
  if (results.length === 0) {
    console.log('   ⚠️  No SBI data found in any database instance.');
    console.log('   This suggests:');
    console.log('   1. SBI data might be in a different database not listed here');
    console.log('   2. SBI data might have been deleted or moved');
    console.log('   3. SBI data might be in a different format or location');
  } else {
    console.log(`   🎯 Found SBI data in ${results.length} database instance(s):`);
    results.forEach(result => {
      console.log(`      - ${result.instance}: ${result.sbiCompanies} companies, ${result.sbiPeople} people`);
    });
  }
}

// Run the check
checkAllDatabases().catch(console.error);
