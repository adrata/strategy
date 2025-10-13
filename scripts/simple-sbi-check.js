#!/usr/bin/env node

/**
 * 🔍 SIMPLE SBI CHECK
 * 
 * Simple check for any data that might be SBI-related
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleSbiCheck() {
  try {
    console.log('🔍 Simple SBI data check...\n');

    // 1. Check for any companies with SBI-related terms
    console.log('📊 COMPANIES:');
    const sbiCompanies = await prisma.companies.findMany({
      where: {
        OR: [
          { name: { contains: 'SBI', mode: 'insensitive' } },
          { industry: { contains: 'SBI', mode: 'insensitive' } },
          { description: { contains: 'SBI', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        description: true,
        createdAt: true
      },
      take: 10
    });

    console.log(`   Found ${sbiCompanies.length} companies with SBI-related terms`);
    if (sbiCompanies.length > 0) {
      sbiCompanies.forEach(company => {
        console.log(`     - ${company.name} (${company.industry}) - ${company.createdAt}`);
      });
    }

    // 2. Check for any people with SBI-related terms
    console.log('\n👥 PEOPLE:');
    const sbiPeople = await prisma.people.findMany({
      where: {
        OR: [
          { fullName: { contains: 'SBI', mode: 'insensitive' } },
          { title: { contains: 'SBI', mode: 'insensitive' } },
          { jobTitle: { contains: 'SBI', mode: 'insensitive' } },
          { source: { contains: 'SBI', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        title: true,
        jobTitle: true,
        source: true,
        createdAt: true
      },
      take: 10
    });

    console.log(`   Found ${sbiPeople.length} people with SBI-related terms`);
    if (sbiPeople.length > 0) {
      sbiPeople.forEach(person => {
        console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
      });
    }

    // 3. Check for any people with executive titles (CFO, CRO, CEO)
    console.log('\n👑 EXECUTIVES:');
    const executives = await prisma.people.findMany({
      where: {
        OR: [
          { title: { contains: 'CFO', mode: 'insensitive' } },
          { title: { contains: 'CRO', mode: 'insensitive' } },
          { title: { contains: 'CEO', mode: 'insensitive' } },
          { jobTitle: { contains: 'CFO', mode: 'insensitive' } },
          { jobTitle: { contains: 'CRO', mode: 'insensitive' } },
          { jobTitle: { contains: 'CEO', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        title: true,
        jobTitle: true,
        source: true,
        createdAt: true
      },
      take: 10
    });

    console.log(`   Found ${executives.length} executives`);
    if (executives.length > 0) {
      executives.forEach(person => {
        console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
      });
    }

    // 4. Check for any companies with custom fields
    console.log('\n🔧 CUSTOM FIELDS:');
    const companiesWithCustomFields = await prisma.companies.count({
      where: {
        customFields: { not: null }
      }
    });

    const peopleWithCustomFields = await prisma.people.count({
      where: {
        customFields: { not: null }
      }
    });

    console.log(`   Companies with custom fields: ${companiesWithCustomFields}`);
    console.log(`   People with custom fields: ${peopleWithCustomFields}`);

    // 5. Check for any data that might be from bulk analysis
    console.log('\n📊 BULK ANALYSIS DATA:');
    const bulkCompanies = await prisma.companies.count({
      where: {
        name: { contains: 'bulk', mode: 'insensitive' }
      }
    });

    const bulkPeople = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'bulk', mode: 'insensitive' } },
          { source: { contains: 'bulk', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "bulk" in name: ${bulkCompanies}`);
    console.log(`   People with "bulk" in name/source: ${bulkPeople}`);

    // 6. Check for any data that might be from enrichment
    console.log('\n🔍 ENRICHMENT DATA:');
    const enrichedCompanies = await prisma.companies.count({
      where: {
        name: { contains: 'enrichment', mode: 'insensitive' }
      }
    });

    const enrichedPeople = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'enrichment', mode: 'insensitive' } },
          { source: { contains: 'enrichment', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "enrichment" in name: ${enrichedCompanies}`);
    console.log(`   People with "enrichment" in name/source: ${enrichedPeople}`);

    // 7. Check for any data that might be from analysis
    console.log('\n📈 ANALYSIS DATA:');
    const analysisCompanies = await prisma.companies.count({
      where: {
        name: { contains: 'analysis', mode: 'insensitive' }
      }
    });

    const analysisPeople = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'analysis', mode: 'insensitive' } },
          { source: { contains: 'analysis', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "analysis" in name: ${analysisCompanies}`);
    console.log(`   People with "analysis" in name/source: ${analysisPeople}`);

    // 8. Check for any data that might be from pipeline
    console.log('\n🔧 PIPELINE DATA:');
    const pipelineCompanies = await prisma.companies.count({
      where: {
        name: { contains: 'pipeline', mode: 'insensitive' }
      }
    });

    const pipelinePeople = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'pipeline', mode: 'insensitive' } },
          { source: { contains: 'pipeline', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "pipeline" in name: ${pipelineCompanies}`);
    console.log(`   People with "pipeline" in name/source: ${pipelinePeople}`);

    // 9. Check for any data that might be from monaco
    console.log('\n🎯 MONACO DATA:');
    const monacoCompanies = await prisma.companies.count({
      where: {
        name: { contains: 'monaco', mode: 'insensitive' }
      }
    });

    const monacoPeople = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'monaco', mode: 'insensitive' } },
          { source: { contains: 'monaco', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "monaco" in name: ${monacoCompanies}`);
    console.log(`   People with "monaco" in name/source: ${monacoPeople}`);

    // 10. Check for any data that might be from SBI
    console.log('\n🏢 SBI DATA:');
    const sbiCompaniesCount = await prisma.companies.count({
      where: {
        name: { contains: 'SBI', mode: 'insensitive' }
      }
    });

    const sbiPeopleCount = await prisma.people.count({
      where: {
        OR: [
          { fullName: { contains: 'SBI', mode: 'insensitive' } },
          { source: { contains: 'SBI', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`   Companies with "SBI" in name: ${sbiCompaniesCount}`);
    console.log(`   People with "SBI" in name/source: ${sbiPeopleCount}`);

    console.log('\n✅ Simple SBI check completed!');

  } catch (error) {
    console.error('❌ Error during simple SBI check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
simpleSbiCheck();
