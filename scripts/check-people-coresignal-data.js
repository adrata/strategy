const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkPeopleCoreSignalData() {
  try {
    await prisma.$connect();
    console.log('🔍 CHECKING PEOPLE CORESIGNAL DATA');
    console.log('==================================');

    // Get all people
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
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
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);

    // Check for CoreSignal data in customFields
    let withCoreSignalData = 0;
    let withAnyCustomFields = 0;
    let sampleCoreSignalData = null;

    allPeople.forEach(person => {
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        withAnyCustomFields++;
        
        // Check for CoreSignal data specifically
        if (person.customFields.coresignalData || 
            person.customFields.coresignal_data ||
            person.customFields.coreSignalData ||
            person.customFields.core_signal_data) {
          withCoreSignalData++;
          if (!sampleCoreSignalData) {
            sampleCoreSignalData = person;
          }
        }
      }
    });

    console.log(`📋 With any customFields: ${withAnyCustomFields} (${Math.round((withAnyCustomFields/allPeople.length)*100)}%)`);
    console.log(`✅ With CoreSignal data: ${withCoreSignalData} (${Math.round((withCoreSignalData/allPeople.length)*100)}%)`);

    // Show sample of what's actually in customFields
    if (sampleCoreSignalData) {
      console.log('\n🔍 SAMPLE CORESIGNAL DATA:');
      console.log('==========================');
      console.log(`Person: ${sampleCoreSignalData.fullName}`);
      console.log(`Company: ${sampleCoreSignalData.company?.name || 'Unknown'}`);
      console.log(`CustomFields keys: ${Object.keys(sampleCoreSignalData.customFields || {}).join(', ')}`);
      
      if (sampleCoreSignalData.customFields) {
        Object.entries(sampleCoreSignalData.customFields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('core') || key.toLowerCase().includes('signal')) {
            console.log(`\n🎯 CORESIGNAL-RELATED FIELD: ${key}`);
            if (typeof value === 'object' && value !== null) {
              console.log(`   Type: ${typeof value}`);
              console.log(`   Keys: ${Object.keys(value).slice(0, 10).join(', ')}${Object.keys(value).length > 10 ? '...' : ''}`);
            } else {
              console.log(`   Value: ${value}`);
            }
          }
        });
      }
    }

    // Check for different patterns of CoreSignal data
    const coresignalPatterns = {
      'coresignalData': 0,
      'coresignal_data': 0,
      'coreSignalData': 0,
      'core_signal_data': 0,
      'enrichmentData': 0,
      'enrichment_data': 0
    };

    allPeople.forEach(person => {
      if (person.customFields) {
        Object.keys(person.customFields).forEach(key => {
          if (key.toLowerCase().includes('core') && key.toLowerCase().includes('signal')) {
            coresignalPatterns[key] = (coresignalPatterns[key] || 0) + 1;
          }
          if (key.toLowerCase().includes('enrichment')) {
            coresignalPatterns[key] = (coresignalPatterns[key] || 0) + 1;
          }
        });
      }
    });

    console.log('\n📊 CORESIGNAL DATA PATTERNS:');
    console.log('============================');
    Object.entries(coresignalPatterns).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`${pattern}: ${count} people`);
      }
    });

    // Check for people with enrichment sources
    const enrichmentSources = {};
    allPeople.forEach(person => {
      if (person.enrichmentSources) {
        person.enrichmentSources.forEach(source => {
          enrichmentSources[source] = (enrichmentSources[source] || 0) + 1;
        });
      }
    });

    console.log('\n📊 ENRICHMENT SOURCES:');
    console.log('======================');
    Object.entries(enrichmentSources).forEach(([source, count]) => {
      console.log(`${source}: ${count} people`);
    });

    // Check for people with lastEnriched dates
    const withLastEnriched = allPeople.filter(person => person.lastEnriched).length;
    console.log(`\n📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);

    // Show recent activity
    const recentActivity = allPeople
      .filter(person => person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.lastEnriched) - new Date(a.lastEnriched))
      .slice(0, 5);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ACTIVITY (Last 7 days):');
      console.log('========================================');
      recentActivity.forEach((person, index) => {
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   Last enriched: ${timeAgo}h ago`);
        console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      });
    } else {
      console.log('\n⏸️  No recent people activity in the last 7 days');
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With any customFields: ${withAnyCustomFields} (${Math.round((withAnyCustomFields/allPeople.length)*100)}%)`);
    console.log(`With CoreSignal data: ${withCoreSignalData} (${Math.round((withCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal data: ${allPeople.length - withCoreSignalData} (${Math.round(((allPeople.length - withCoreSignalData)/allPeople.length)*100)}%)`);

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCoreSignalData();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkPeopleCoreSignalData() {
  try {
    await prisma.$connect();
    console.log('🔍 CHECKING PEOPLE CORESIGNAL DATA');
    console.log('==================================');

    // Get all people
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
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
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);

    // Check for CoreSignal data in customFields
    let withCoreSignalData = 0;
    let withAnyCustomFields = 0;
    let sampleCoreSignalData = null;

    allPeople.forEach(person => {
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        withAnyCustomFields++;
        
        // Check for CoreSignal data specifically
        if (person.customFields.coresignalData || 
            person.customFields.coresignal_data ||
            person.customFields.coreSignalData ||
            person.customFields.core_signal_data) {
          withCoreSignalData++;
          if (!sampleCoreSignalData) {
            sampleCoreSignalData = person;
          }
        }
      }
    });

    console.log(`📋 With any customFields: ${withAnyCustomFields} (${Math.round((withAnyCustomFields/allPeople.length)*100)}%)`);
    console.log(`✅ With CoreSignal data: ${withCoreSignalData} (${Math.round((withCoreSignalData/allPeople.length)*100)}%)`);

    // Show sample of what's actually in customFields
    if (sampleCoreSignalData) {
      console.log('\n🔍 SAMPLE CORESIGNAL DATA:');
      console.log('==========================');
      console.log(`Person: ${sampleCoreSignalData.fullName}`);
      console.log(`Company: ${sampleCoreSignalData.company?.name || 'Unknown'}`);
      console.log(`CustomFields keys: ${Object.keys(sampleCoreSignalData.customFields || {}).join(', ')}`);
      
      if (sampleCoreSignalData.customFields) {
        Object.entries(sampleCoreSignalData.customFields).forEach(([key, value]) => {
          if (key.toLowerCase().includes('core') || key.toLowerCase().includes('signal')) {
            console.log(`\n🎯 CORESIGNAL-RELATED FIELD: ${key}`);
            if (typeof value === 'object' && value !== null) {
              console.log(`   Type: ${typeof value}`);
              console.log(`   Keys: ${Object.keys(value).slice(0, 10).join(', ')}${Object.keys(value).length > 10 ? '...' : ''}`);
            } else {
              console.log(`   Value: ${value}`);
            }
          }
        });
      }
    }

    // Check for different patterns of CoreSignal data
    const coresignalPatterns = {
      'coresignalData': 0,
      'coresignal_data': 0,
      'coreSignalData': 0,
      'core_signal_data': 0,
      'enrichmentData': 0,
      'enrichment_data': 0
    };

    allPeople.forEach(person => {
      if (person.customFields) {
        Object.keys(person.customFields).forEach(key => {
          if (key.toLowerCase().includes('core') && key.toLowerCase().includes('signal')) {
            coresignalPatterns[key] = (coresignalPatterns[key] || 0) + 1;
          }
          if (key.toLowerCase().includes('enrichment')) {
            coresignalPatterns[key] = (coresignalPatterns[key] || 0) + 1;
          }
        });
      }
    });

    console.log('\n📊 CORESIGNAL DATA PATTERNS:');
    console.log('============================');
    Object.entries(coresignalPatterns).forEach(([pattern, count]) => {
      if (count > 0) {
        console.log(`${pattern}: ${count} people`);
      }
    });

    // Check for people with enrichment sources
    const enrichmentSources = {};
    allPeople.forEach(person => {
      if (person.enrichmentSources) {
        person.enrichmentSources.forEach(source => {
          enrichmentSources[source] = (enrichmentSources[source] || 0) + 1;
        });
      }
    });

    console.log('\n📊 ENRICHMENT SOURCES:');
    console.log('======================');
    Object.entries(enrichmentSources).forEach(([source, count]) => {
      console.log(`${source}: ${count} people`);
    });

    // Check for people with lastEnriched dates
    const withLastEnriched = allPeople.filter(person => person.lastEnriched).length;
    console.log(`\n📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);

    // Show recent activity
    const recentActivity = allPeople
      .filter(person => person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.lastEnriched) - new Date(a.lastEnriched))
      .slice(0, 5);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ACTIVITY (Last 7 days):');
      console.log('========================================');
      recentActivity.forEach((person, index) => {
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   Last enriched: ${timeAgo}h ago`);
        console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      });
    } else {
      console.log('\n⏸️  No recent people activity in the last 7 days');
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With any customFields: ${withAnyCustomFields} (${Math.round((withAnyCustomFields/allPeople.length)*100)}%)`);
    console.log(`With CoreSignal data: ${withCoreSignalData} (${Math.round((withCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal data: ${allPeople.length - withCoreSignalData} (${Math.round(((allPeople.length - withCoreSignalData)/allPeople.length)*100)}%)`);

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCoreSignalData();


