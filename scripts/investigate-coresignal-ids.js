const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigateCoreSignalIds() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING CORESIGNAL IDs');
    console.log('===============================');

    // Get people with coresignalId
    const peopleWithCoreSignalId = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
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

    console.log(`📊 Found ${peopleWithCoreSignalId.length} people with coresignalId`);

    console.log('\n🔍 SAMPLE PEOPLE WITH CORESIGNAL IDs:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        
        // Show the coresignalId value
        if (person.customFields.coresignalId) {
          console.log(`   CoreSignal ID: ${person.customFields.coresignalId}`);
        }
        
        // Check for other CoreSignal-related fields
        Object.entries(person.customFields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('core') || key.toLowerCase().includes('signal')) {
            console.log(`   ${key}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value}`);
          }
        });
      }
    });

    // Check for people with enrichment sources
    const peopleWithSources = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        enrichmentSources: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log('\n🔍 PEOPLE WITH CORESIGNAL IN ENRICHMENT SOURCES:');
    console.log('===============================================');
    peopleWithSources.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ')}`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

    // Check for people with lastEnriched dates
    const peopleWithLastEnriched = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        lastEnriched: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        lastEnriched: 'desc'
      },
      take: 5
    });

    console.log('\n📅 PEOPLE WITH LAST ENRICHED DATES:');
    console.log('===================================');
    peopleWithLastEnriched.forEach((person, index) => {
      const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Last enriched: ${timeAgo}h ago`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

    // Check for people with actual CoreSignal data (not just IDs)
    const peopleWithCoreSignalData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: { path: ['coresignalData'], not: null } },
          { customFields: { path: ['coresignal_data'], not: null } },
          { customFields: { path: ['coreSignalData'], not: null } },
          { customFields: { path: ['core_signal_data'], not: null } }
        ]
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log('\n🎯 PEOPLE WITH ACTUAL CORESIGNAL DATA:');
    console.log('======================================');
    if (peopleWithCoreSignalData.length > 0) {
      peopleWithCoreSignalData.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
      });
    } else {
      console.log('❌ No people found with actual CoreSignal data');
    }

    // Summary
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignalId = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });

    const withEnrichmentSources = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      }
    });

    const withLastEnriched = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`With coresignalId: ${withCoreSignalId} (${Math.round((withCoreSignalId/totalPeople)*100)}%)`);
    console.log(`With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/totalPeople)*100)}%)`);
    console.log(`With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/totalPeople)*100)}%)`);

    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    console.log('People were pulled from CoreSignal (have coresignalId) but the actual data was not stored.');
    console.log('This suggests the enrichment process stored the ID but not the full CoreSignal data.');
    console.log('We need to fetch the CoreSignal data using these IDs.');

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateCoreSignalIds();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigateCoreSignalIds() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING CORESIGNAL IDs');
    console.log('===============================');

    // Get people with coresignalId
    const peopleWithCoreSignalId = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
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

    console.log(`📊 Found ${peopleWithCoreSignalId.length} people with coresignalId`);

    console.log('\n🔍 SAMPLE PEOPLE WITH CORESIGNAL IDs:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown Company'}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        
        // Show the coresignalId value
        if (person.customFields.coresignalId) {
          console.log(`   CoreSignal ID: ${person.customFields.coresignalId}`);
        }
        
        // Check for other CoreSignal-related fields
        Object.entries(person.customFields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('core') || key.toLowerCase().includes('signal')) {
            console.log(`   ${key}: ${typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value}`);
          }
        });
      }
    });

    // Check for people with enrichment sources
    const peopleWithSources = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        enrichmentSources: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log('\n🔍 PEOPLE WITH CORESIGNAL IN ENRICHMENT SOURCES:');
    console.log('===============================================');
    peopleWithSources.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ')}`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

    // Check for people with lastEnriched dates
    const peopleWithLastEnriched = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        lastEnriched: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        lastEnriched: 'desc'
      },
      take: 5
    });

    console.log('\n📅 PEOPLE WITH LAST ENRICHED DATES:');
    console.log('===================================');
    peopleWithLastEnriched.forEach((person, index) => {
      const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Last enriched: ${timeAgo}h ago`);
      console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
    });

    // Check for people with actual CoreSignal data (not just IDs)
    const peopleWithCoreSignalData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: { path: ['coresignalData'], not: null } },
          { customFields: { path: ['coresignal_data'], not: null } },
          { customFields: { path: ['coreSignalData'], not: null } },
          { customFields: { path: ['core_signal_data'], not: null } }
        ]
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    console.log('\n🎯 PEOPLE WITH ACTUAL CORESIGNAL DATA:');
    console.log('======================================');
    if (peopleWithCoreSignalData.length > 0) {
      peopleWithCoreSignalData.forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   CustomFields: ${Object.keys(person.customFields || {}).join(', ')}`);
      });
    } else {
      console.log('❌ No people found with actual CoreSignal data');
    }

    // Summary
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignalId = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });

    const withEnrichmentSources = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      }
    });

    const withLastEnriched = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      }
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`With coresignalId: ${withCoreSignalId} (${Math.round((withCoreSignalId/totalPeople)*100)}%)`);
    console.log(`With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/totalPeople)*100)}%)`);
    console.log(`With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/totalPeople)*100)}%)`);

    console.log('\n🎯 CONCLUSION:');
    console.log('==============');
    console.log('People were pulled from CoreSignal (have coresignalId) but the actual data was not stored.');
    console.log('This suggests the enrichment process stored the ID but not the full CoreSignal data.');
    console.log('We need to fetch the CoreSignal data using these IDs.');

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateCoreSignalIds();


