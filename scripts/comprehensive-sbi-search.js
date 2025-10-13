#!/usr/bin/env node

/**
 * 🔍 COMPREHENSIVE SBI SEARCH
 * 
 * Searches for any data that might be SBI-related in the current database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveSbiSearch() {
  try {
    console.log('🔍 Starting comprehensive SBI search...\n');

    // 1. Search for any companies with SBI-related terms
    console.log('📊 SEARCHING COMPANIES:');
    const sbiCompanyTerms = ['SBI', 'Strategic', 'Business', 'Intelligence', 'Bulk', 'Analysis'];
    
    for (const term of sbiCompanyTerms) {
      const companies = await prisma.companies.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { industry: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          industry: true,
          description: true,
          createdAt: true
        },
        take: 5
      });

      if (companies.length > 0) {
        console.log(`   Found ${companies.length} companies with "${term}":`);
        companies.forEach(company => {
          console.log(`     - ${company.name} (${company.industry}) - ${company.createdAt}`);
        });
      }
    }

    // 2. Search for any people with SBI-related terms
    console.log('\n👥 SEARCHING PEOPLE:');
    const sbiPeopleTerms = ['SBI', 'Strategic', 'Business', 'Intelligence', 'Bulk', 'Analysis', 'CFO', 'CRO', 'CEO'];
    
    for (const term of sbiPeopleTerms) {
      const people = await prisma.people.findMany({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
            { jobTitle: { contains: term, mode: 'insensitive' } },
            { source: { contains: term, mode: 'insensitive' } }
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
        take: 5
      });

      if (people.length > 0) {
        console.log(`   Found ${people.length} people with "${term}":`);
        people.forEach(person => {
          console.log(`     - ${person.fullName} (${person.title || person.jobTitle}) - ${person.source} - ${person.createdAt}`);
        });
      }
    }

    // 3. Check for any custom fields that might contain SBI data
    console.log('\n🔧 SEARCHING CUSTOM FIELDS:');
    const companiesWithCustomFields = await prisma.companies.findMany({
      where: {
        customFields: { not: null }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 10
    });

    console.log(`   Found ${companiesWithCustomFields.length} companies with custom fields`);
    if (companiesWithCustomFields.length > 0) {
      console.log('   Sample custom fields:');
      companiesWithCustomFields.forEach(company => {
        console.log(`     - ${company.name}: ${JSON.stringify(company.customFields, null, 2)}`);
      });
    }

    const peopleWithCustomFields = await prisma.people.findMany({
      where: {
        customFields: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        customFields: true
      },
      take: 10
    });

    console.log(`   Found ${peopleWithCustomFields.length} people with custom fields`);
    if (peopleWithCustomFields.length > 0) {
      console.log('   Sample custom fields:');
      peopleWithCustomFields.forEach(person => {
        console.log(`     - ${person.fullName}: ${JSON.stringify(person.customFields, null, 2)}`);
      });
    }

    // 4. Check for any actions with SBI-related terms
    console.log('\n📝 SEARCHING ACTIONS:');
    const sbiActionTerms = ['SBI', 'Strategic', 'Business', 'Intelligence', 'Bulk', 'Analysis'];
    
    for (const term of sbiActionTerms) {
      const actions = await prisma.actions.findMany({
        where: {
          OR: [
            { subject: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          subject: true,
          description: true,
          createdAt: true
        },
        take: 5
      });

      if (actions.length > 0) {
        console.log(`   Found ${actions.length} actions with "${term}":`);
        actions.forEach(action => {
          console.log(`     - ${action.subject} - ${action.createdAt}`);
        });
      }
    }

    // 5. Check for any workspaces that might contain SBI data
    console.log('\n🏢 SEARCHING WORKSPACES:');
    const workspaces = await prisma.workspaces.findMany({
      where: {
        OR: [
          { name: { contains: 'SBI', mode: 'insensitive' } },
          { slug: { contains: 'sbi', mode: 'insensitive' } },
          { description: { contains: 'SBI', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            companies: true,
            people: true
          }
        }
      }
    });

    console.log(`   Found ${workspaces.length} workspaces with SBI-related terms`);
    if (workspaces.length > 0) {
      workspaces.forEach(workspace => {
        console.log(`     - ${workspace.name} (${workspace.slug}): ${workspace._count.companies} companies, ${workspace._count.people} people`);
      });
    }

    // 6. Check for any data that might be from bulk analysis or enrichment
    console.log('\n🔍 SEARCHING FOR BULK/ENRICHMENT DATA:');
    const bulkTerms = ['bulk', 'enrichment', 'analysis', 'pipeline', 'monaco'];
    
    for (const term of bulkTerms) {
      const companies = await prisma.companies.count({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { source: { contains: term, mode: 'insensitive' } }
          ]
        }
      });

      const people = await prisma.people.count({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { source: { contains: term, mode: 'insensitive' } }
          ]
        }
      });

      if (companies > 0 || people > 0) {
        console.log(`   Found ${companies} companies and ${people} people with "${term}"`);
      }
    }

    // 7. Check for any data with confidence scores or analysis metadata
    console.log('\n📊 SEARCHING FOR ANALYSIS METADATA:');
    const companiesWithAnalysis = await prisma.companies.findMany({
      where: {
        OR: [
          { customFields: { path: ['confidence'], not: null } },
          { customFields: { path: ['analysis'], not: null } },
          { customFields: { path: ['enrichment'], not: null } },
          { customFields: { path: ['pipeline'], not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 5
    });

    console.log(`   Found ${companiesWithAnalysis.length} companies with analysis metadata`);
    if (companiesWithAnalysis.length > 0) {
      console.log('   Sample analysis metadata:');
      companiesWithAnalysis.forEach(company => {
        console.log(`     - ${company.name}: ${JSON.stringify(company.customFields, null, 2)}`);
      });
    }

    console.log('\n✅ Comprehensive SBI search completed!');

  } catch (error) {
    console.error('❌ Error during comprehensive SBI search:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the search
comprehensiveSbiSearch();
