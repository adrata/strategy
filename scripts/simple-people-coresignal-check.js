const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkPeopleCoreSignalStatus() {
  try {
    await prisma.$connect();
    console.log('🔍 PEOPLE CORESIGNAL STATUS CHECK');
    console.log('=================================');

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

    // Analyze in JavaScript
    let withCoreSignal = 0;
    let withCustomFields = 0;
    let withEnrichmentSources = 0;
    let withLastEnriched = 0;
    let recentActivity = [];

    allPeople.forEach(person => {
      // Check for CoreSignal data
      if (person.customFields?.coresignalData) {
        withCoreSignal++;
      }

      // Check for any customFields
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        withCustomFields++;
      }

      // Check for enrichment sources
      if (person.enrichmentSources && person.enrichmentSources.includes('coresignal')) {
        withEnrichmentSources++;
      }

      // Check for lastEnriched
      if (person.lastEnriched) {
        withLastEnriched++;
      }

      // Check for recent activity (last 24 hours)
      if (person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        recentActivity.push(person);
      }
    });

    console.log('\n📈 CORESIGNAL COVERAGE ANALYSIS:');
    console.log('================================');
    console.log(`✅ With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/allPeople.length)*100)}%)`);
    console.log(`📋 With any customFields: ${withCustomFields} (${Math.round((withCustomFields/allPeople.length)*100)}%)`);
    console.log(`🔍 With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/allPeople.length)*100)}%)`);
    console.log(`📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 24 hours):');
      console.log('===================================================');
      recentActivity.slice(0, 10).forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
        console.log(`   CoreSignal: ${hasCoreSignal} | Sources: ${person.enrichmentSources?.join(', ') || 'None'} | ${timeAgo}h ago`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 24 hours');
    }

    // Find people without CoreSignal data
    const withoutCoreSignal = allPeople.filter(person => 
      !person.customFields?.coresignalData
    );

    console.log('\n❌ PEOPLE WITHOUT CORESIGNAL DATA:');
    console.log('==================================');
    console.log(`Total without CoreSignal: ${withoutCoreSignal.length} (${Math.round((withoutCoreSignal.length/allPeople.length)*100)}%)`);

    // Show sample of people without CoreSignal
    console.log('\n📋 SAMPLE PEOPLE WITHOUT CORESIGNAL DATA:');
    withoutCoreSignal.slice(0, 10).forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   CustomFields: ${person.customFields ? 'Has data' : 'None'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
    });

    // Find people with CoreSignal data to understand how they got it
    const withCoreSignalData = allPeople.filter(person => 
      person.customFields?.coresignalData
    );

    console.log('\n🔍 HOW PEOPLE GOT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    withCoreSignalData.slice(0, 5).forEach((person, index) => {
      const enrichmentSource = person.customFields?.enrichmentSource || 'Unknown';
      const sources = person.enrichmentSources?.join(', ') || 'None';
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Enrichment source: ${enrichmentSource}`);
      console.log(`   Sources array: ${sources}`);
      console.log(`   Last enriched: ${person.lastEnriched}`);
    });

    // Group by company to see distribution
    const companyStats = {};
    allPeople.forEach(person => {
      const companyName = person.company.name;
      if (!companyStats[companyName]) {
        companyStats[companyName] = { total: 0, withCoreSignal: 0 };
      }
      companyStats[companyName].total++;
      if (person.customFields?.coresignalData) {
        companyStats[companyName].withCoreSignal++;
      }
    });

    console.log('\n🏢 COMPANIES WITH PEOPLE (Top 10):');
    console.log('==================================');
    const sortedCompanies = Object.entries(companyStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 10);

    sortedCompanies.forEach(([companyName, stats], index) => {
      const percentage = Math.round((stats.withCoreSignal / stats.total) * 100);
      console.log(`${index + 1}. ${companyName}: ${stats.withCoreSignal}/${stats.total} (${percentage}%)`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal data: ${withoutCoreSignal.length} (${Math.round((withoutCoreSignal.length/allPeople.length)*100)}%)`);
    
    if (withCoreSignal > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. People enrichment is working through:');
      console.log('   - UnifiedEnrichmentSystem (people search)');
      console.log('   - Buyer group generation');
      console.log('   - CoreSignal AI integration');
      console.log('2. To ensure all people have CoreSignal data:');
      console.log('   - Run people enrichment for remaining people');
      console.log('   - Use the same CoreSignal API for people as companies');
      console.log('   - Consider batch processing people by company');
    }

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCoreSignalStatus();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function checkPeopleCoreSignalStatus() {
  try {
    await prisma.$connect();
    console.log('🔍 PEOPLE CORESIGNAL STATUS CHECK');
    console.log('=================================');

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

    // Analyze in JavaScript
    let withCoreSignal = 0;
    let withCustomFields = 0;
    let withEnrichmentSources = 0;
    let withLastEnriched = 0;
    let recentActivity = [];

    allPeople.forEach(person => {
      // Check for CoreSignal data
      if (person.customFields?.coresignalData) {
        withCoreSignal++;
      }

      // Check for any customFields
      if (person.customFields && Object.keys(person.customFields).length > 0) {
        withCustomFields++;
      }

      // Check for enrichment sources
      if (person.enrichmentSources && person.enrichmentSources.includes('coresignal')) {
        withEnrichmentSources++;
      }

      // Check for lastEnriched
      if (person.lastEnriched) {
        withLastEnriched++;
      }

      // Check for recent activity (last 24 hours)
      if (person.lastEnriched && new Date(person.lastEnriched) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        recentActivity.push(person);
      }
    });

    console.log('\n📈 CORESIGNAL COVERAGE ANALYSIS:');
    console.log('================================');
    console.log(`✅ With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/allPeople.length)*100)}%)`);
    console.log(`📋 With any customFields: ${withCustomFields} (${Math.round((withCustomFields/allPeople.length)*100)}%)`);
    console.log(`🔍 With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/allPeople.length)*100)}%)`);
    console.log(`📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 24 hours):');
      console.log('===================================================');
      recentActivity.slice(0, 10).forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
        console.log(`   CoreSignal: ${hasCoreSignal} | Sources: ${person.enrichmentSources?.join(', ') || 'None'} | ${timeAgo}h ago`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 24 hours');
    }

    // Find people without CoreSignal data
    const withoutCoreSignal = allPeople.filter(person => 
      !person.customFields?.coresignalData
    );

    console.log('\n❌ PEOPLE WITHOUT CORESIGNAL DATA:');
    console.log('==================================');
    console.log(`Total without CoreSignal: ${withoutCoreSignal.length} (${Math.round((withoutCoreSignal.length/allPeople.length)*100)}%)`);

    // Show sample of people without CoreSignal
    console.log('\n📋 SAMPLE PEOPLE WITHOUT CORESIGNAL DATA:');
    withoutCoreSignal.slice(0, 10).forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   CustomFields: ${person.customFields ? 'Has data' : 'None'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
    });

    // Find people with CoreSignal data to understand how they got it
    const withCoreSignalData = allPeople.filter(person => 
      person.customFields?.coresignalData
    );

    console.log('\n🔍 HOW PEOPLE GOT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    withCoreSignalData.slice(0, 5).forEach((person, index) => {
      const enrichmentSource = person.customFields?.enrichmentSource || 'Unknown';
      const sources = person.enrichmentSources?.join(', ') || 'None';
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Enrichment source: ${enrichmentSource}`);
      console.log(`   Sources array: ${sources}`);
      console.log(`   Last enriched: ${person.lastEnriched}`);
    });

    // Group by company to see distribution
    const companyStats = {};
    allPeople.forEach(person => {
      const companyName = person.company.name;
      if (!companyStats[companyName]) {
        companyStats[companyName] = { total: 0, withCoreSignal: 0 };
      }
      companyStats[companyName].total++;
      if (person.customFields?.coresignalData) {
        companyStats[companyName].withCoreSignal++;
      }
    });

    console.log('\n🏢 COMPANIES WITH PEOPLE (Top 10):');
    console.log('==================================');
    const sortedCompanies = Object.entries(companyStats)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 10);

    sortedCompanies.forEach(([companyName, stats], index) => {
      const percentage = Math.round((stats.withCoreSignal / stats.total) * 100);
      console.log(`${index + 1}. ${companyName}: ${stats.withCoreSignal}/${stats.total} (${percentage}%)`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal data: ${withoutCoreSignal.length} (${Math.round((withoutCoreSignal.length/allPeople.length)*100)}%)`);
    
    if (withCoreSignal > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. People enrichment is working through:');
      console.log('   - UnifiedEnrichmentSystem (people search)');
      console.log('   - Buyer group generation');
      console.log('   - CoreSignal AI integration');
      console.log('2. To ensure all people have CoreSignal data:');
      console.log('   - Run people enrichment for remaining people');
      console.log('   - Use the same CoreSignal API for people as companies');
      console.log('   - Consider batch processing people by company');
    }

  } catch (error) {
    console.error('❌ Investigation error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCoreSignalStatus();


