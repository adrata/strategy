const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigatePeopleCustomFields() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING PEOPLE CUSTOMFIELDS');
    console.log('====================================');

    // Get sample of people with customFields
    const peopleWithCustomFields = await prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        customFields: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });

    console.log(`📊 Found ${peopleWithCustomFields.length} people with customFields`);

    console.log('\n🔍 SAMPLE PEOPLE CUSTOMFIELDS ANALYSIS:');
    console.log('=========================================');
    
    peopleWithCustomFields.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      
      // Show what's actually in customFields
      if (person.customFields) {
        console.log(`   CustomFields content:`);
        Object.entries(person.customFields).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`     ${key}: ${Object.keys(value).join(', ')} (${typeof value})`);
          } else {
            console.log(`     ${key}: ${value} (${typeof value})`);
          }
        });
      }
    });

    // Check for different enrichment sources
    const enrichmentSources = {};
    peopleWithCustomFields.forEach(person => {
      if (person.enrichmentSources) {
        person.enrichmentSources.forEach(source => {
          enrichmentSources[source] = (enrichmentSources[source] || 0) + 1;
        });
      }
    });

    console.log('\n📊 ENRICHMENT SOURCES DISTRIBUTION:');
    console.log('===================================');
    Object.entries(enrichmentSources).forEach(([source, count]) => {
      console.log(`${source}: ${count} people`);
    });

    // Check for specific enrichment patterns
    const coresignalPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.coresignalData
    );

    const buyerGroupPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.buyerGroupData || person.customFields?.buyerGroup
    );

    const unifiedEnrichmentPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.enrichmentSource
    );

    console.log('\n🔍 ENRICHMENT PATTERNS:');
    console.log('========================');
    console.log(`People with CoreSignal data: ${coresignalPattern.length}`);
    console.log(`People with buyer group data: ${buyerGroupPattern.length}`);
    console.log(`People with unified enrichment: ${unifiedEnrichmentPattern.length}`);

    // Show examples of each pattern
    if (buyerGroupPattern.length > 0) {
      console.log('\n📋 BUYER GROUP PATTERN EXAMPLE:');
      const example = buyerGroupPattern[0];
      console.log(`${example.fullName} - Buyer Group Data:`);
      console.log(JSON.stringify(example.customFields?.buyerGroupData || example.customFields?.buyerGroup, null, 2));
    }

    if (unifiedEnrichmentPattern.length > 0) {
      console.log('\n📋 UNIFIED ENRICHMENT PATTERN EXAMPLE:');
      const example = unifiedEnrichmentPattern[0];
      console.log(`${example.fullName} - Enrichment Source: ${example.customFields?.enrichmentSource}`);
      console.log(`CustomFields keys: ${Object.keys(example.customFields || {}).join(', ')}`);
    }

    // Check how people are being created
    const recentPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        enrichmentSources: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n🕒 RECENT PEOPLE CREATION (Last 7 days):');
    console.log('======================================');
    recentPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigatePeopleCustomFields();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigatePeopleCustomFields() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING PEOPLE CUSTOMFIELDS');
    console.log('====================================');

    // Get sample of people with customFields
    const peopleWithCustomFields = await prisma.people.findMany({
      where: { 
        workspaceId: TOP_WORKSPACE_ID,
        customFields: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 10
    });

    console.log(`📊 Found ${peopleWithCustomFields.length} people with customFields`);

    console.log('\n🔍 SAMPLE PEOPLE CUSTOMFIELDS ANALYSIS:');
    console.log('=========================================');
    
    peopleWithCustomFields.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      
      // Show what's actually in customFields
      if (person.customFields) {
        console.log(`   CustomFields content:`);
        Object.entries(person.customFields).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            console.log(`     ${key}: ${Object.keys(value).join(', ')} (${typeof value})`);
          } else {
            console.log(`     ${key}: ${value} (${typeof value})`);
          }
        });
      }
    });

    // Check for different enrichment sources
    const enrichmentSources = {};
    peopleWithCustomFields.forEach(person => {
      if (person.enrichmentSources) {
        person.enrichmentSources.forEach(source => {
          enrichmentSources[source] = (enrichmentSources[source] || 0) + 1;
        });
      }
    });

    console.log('\n📊 ENRICHMENT SOURCES DISTRIBUTION:');
    console.log('===================================');
    Object.entries(enrichmentSources).forEach(([source, count]) => {
      console.log(`${source}: ${count} people`);
    });

    // Check for specific enrichment patterns
    const coresignalPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.coresignalData
    );

    const buyerGroupPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.buyerGroupData || person.customFields?.buyerGroup
    );

    const unifiedEnrichmentPattern = peopleWithCustomFields.filter(person => 
      person.customFields?.enrichmentSource
    );

    console.log('\n🔍 ENRICHMENT PATTERNS:');
    console.log('========================');
    console.log(`People with CoreSignal data: ${coresignalPattern.length}`);
    console.log(`People with buyer group data: ${buyerGroupPattern.length}`);
    console.log(`People with unified enrichment: ${unifiedEnrichmentPattern.length}`);

    // Show examples of each pattern
    if (buyerGroupPattern.length > 0) {
      console.log('\n📋 BUYER GROUP PATTERN EXAMPLE:');
      const example = buyerGroupPattern[0];
      console.log(`${example.fullName} - Buyer Group Data:`);
      console.log(JSON.stringify(example.customFields?.buyerGroupData || example.customFields?.buyerGroup, null, 2));
    }

    if (unifiedEnrichmentPattern.length > 0) {
      console.log('\n📋 UNIFIED ENRICHMENT PATTERN EXAMPLE:');
      const example = unifiedEnrichmentPattern[0];
      console.log(`${example.fullName} - Enrichment Source: ${example.customFields?.enrichmentSource}`);
      console.log(`CustomFields keys: ${Object.keys(example.customFields || {}).join(', ')}`);
    }

    // Check how people are being created
    const recentPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        enrichmentSources: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log('\n🕒 RECENT PEOPLE CREATION (Last 7 days):');
    console.log('======================================');
    recentPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigatePeopleCustomFields();
