const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function simplePeopleComparison() {
  try {
    await prisma.$connect();
    console.log('🔍 SIMPLE PEOPLE COMPARISON');
    console.log('===========================');

    // Get all people and analyze in JavaScript
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            name: true,
            customFields: true
          }
        }
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);

    // Analyze in JavaScript
    let withCoreSignalId = 0;
    let withoutCoreSignalId = 0;
    let withActualCoreSignalData = 0;
    let withRawData = 0;
    let withRichProfile = 0;
    let withCareerData = 0;
    let withApiUsage = 0;
    let withCharges = 0;
    let withBilling = 0;
    let withLastEnriched = 0;
    let withEnrichmentSources = 0;

    const coresignalIds = new Set();
    const duplicateIds = [];
    const sampleWithId = [];
    const sampleWithoutId = [];
    const sampleWithCoreSignalData = [];

    allPeople.forEach(person => {
      const hasCoreSignalId = person.customFields?.coresignalId;
      const hasActualCoreSignalData = person.customFields?.coresignalData || 
                                     person.customFields?.coresignal_data || 
                                     person.customFields?.coreSignalData || 
                                     person.customFields?.core_signal_data;

      if (hasCoreSignalId) {
        withCoreSignalId++;
        if (coresignalIds.has(person.customFields.coresignalId)) {
          duplicateIds.push({
            name: person.fullName,
            id: person.customFields.coresignalId
          });
        } else {
          coresignalIds.add(person.customFields.coresignalId);
        }
        if (sampleWithId.length < 3) {
          sampleWithId.push(person);
        }
      } else {
        withoutCoreSignalId++;
        if (sampleWithoutId.length < 3) {
          sampleWithoutId.push(person);
        }
      }

      if (hasActualCoreSignalData) {
        withActualCoreSignalData++;
        if (sampleWithCoreSignalData.length < 3) {
          sampleWithCoreSignalData.push(person);
        }
      }

      if (person.customFields) {
        if (person.customFields.rawData) withRawData++;
        if (person.customFields.richProfile) withRichProfile++;
        if (person.customFields.careerData) withCareerData++;
        if (person.customFields.apiUsage) withApiUsage++;
        if (person.customFields.charges) withCharges++;
        if (person.customFields.billing) withBilling++;
        if (person.customFields.lastEnriched) withLastEnriched++;
        if (person.customFields.enrichmentSources) withEnrichmentSources++;
      }
    });

    console.log('\n📊 PEOPLE WITH CORESIGNAL ID:');
    console.log('==============================');
    console.log(`Count: ${withCoreSignalId} (${Math.round((withCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`Unique IDs: ${coresignalIds.size}`);
    console.log(`Duplicate IDs: ${duplicateIds.length}`);

    console.log('\n📊 PEOPLE WITHOUT CORESIGNAL ID:');
    console.log('=================================');
    console.log(`Count: ${withoutCoreSignalId} (${Math.round((withoutCoreSignalId/allPeople.length)*100)}%)`);

    console.log('\n📊 DATA STORAGE ANALYSIS:');
    console.log('=========================');
    console.log(`With actual CoreSignal data: ${withActualCoreSignalData} (${Math.round((withActualCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`With rawData: ${withRawData} (${Math.round((withRawData/allPeople.length)*100)}%)`);
    console.log(`With richProfile: ${withRichProfile} (${Math.round((withRichProfile/allPeople.length)*100)}%)`);
    console.log(`With careerData: ${withCareerData} (${Math.round((withCareerData/allPeople.length)*100)}%)`);

    console.log('\n📊 API USAGE TRACKING:');
    console.log('======================');
    console.log(`With API usage tracking: ${withApiUsage} (${Math.round((withApiUsage/allPeople.length)*100)}%)`);
    console.log(`With charges tracking: ${withCharges} (${Math.round((withCharges/allPeople.length)*100)}%)`);
    console.log(`With billing tracking: ${withBilling} (${Math.round((withBilling/allPeople.length)*100)}%)`);
    console.log(`With lastEnriched: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);
    console.log(`With enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/allPeople.length)*100)}%)`);

    // Show samples
    console.log('\n🔍 SAMPLE PEOPLE WITH CORESIGNAL ID:');
    console.log('====================================');
    sampleWithId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Updated: ${person.updatedAt}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        console.log(`   CoreSignal ID: ${person.customFields.coresignalId}`);
        
        // Check for CoreSignal data in different locations
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
          console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (person.customFields.rawData) {
          console.log(`   Raw data: ${typeof person.customFields.rawData} (${Object.keys(person.customFields.rawData || {}).length} keys)`);
        }
        
        if (person.customFields.richProfile) {
          console.log(`   Rich profile: ${typeof person.customFields.richProfile} (${Object.keys(person.customFields.richProfile || {}).length} keys)`);
        }
        
        if (person.customFields.careerData) {
          console.log(`   Career data: ${typeof person.customFields.careerData} (${Object.keys(person.customFields.careerData || {}).length} keys)`);
        }
        
        // Check for API usage tracking
        if (person.customFields.apiUsage) {
          console.log(`   API usage: ${JSON.stringify(person.customFields.apiUsage)}`);
        }
        
        if (person.customFields.charges) {
          console.log(`   Charges: ${JSON.stringify(person.customFields.charges)}`);
        }
        
        if (person.customFields.billing) {
          console.log(`   Billing: ${JSON.stringify(person.customFields.billing)}`);
        }
      }
    });

    console.log('\n🔍 SAMPLE PEOPLE WITHOUT CORESIGNAL ID:');
    console.log('=========================================');
    sampleWithoutId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Updated: ${person.updatedAt}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        
        // Check for any CoreSignal data
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (person.customFields.rawData) {
          console.log(`   Raw data: ${typeof person.customFields.rawData} (${Object.keys(person.customFields.rawData || {}).length} keys)`);
        }
        
        if (person.customFields.richProfile) {
          console.log(`   Rich profile: ${typeof person.customFields.richProfile} (${Object.keys(person.customFields.richProfile || {}).length} keys)`);
        }
        
        if (person.customFields.careerData) {
          console.log(`   Career data: ${typeof person.customFields.careerData} (${Object.keys(person.customFields.careerData || {}).length} keys)`);
        }
      } else {
        console.log(`   ❌ No customFields at all`);
      }
    });

    if (sampleWithCoreSignalData.length > 0) {
      console.log('\n🎯 SAMPLE PEOPLE WITH ACTUAL CORESIGNAL DATA:');
      console.log('==============================================');
      sampleWithCoreSignalData.forEach((person, index) => {
        console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
      });
    }

    if (duplicateIds.length > 0) {
      console.log('\n⚠️ DUPLICATE CORESIGNAL IDs:');
      console.log('============================');
      duplicateIds.forEach(dup => {
        console.log(`${dup.name}: ${dup.id}`);
      });
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With CoreSignal IDs: ${withCoreSignalId} (${Math.round((withCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal IDs: ${withoutCoreSignalId} (${Math.round((withoutCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`With actual CoreSignal data: ${withActualCoreSignalData} (${Math.round((withActualCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`Unique CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. Check if CoreSignal data is stored in rawData or richProfile fields');
    console.log('2. Implement duplicate protection using existing coresignalId values');
    console.log('3. Add API usage tracking to prevent double charging');
    console.log('4. Consider using existing IDs to fetch missing data');

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simplePeopleComparison();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function simplePeopleComparison() {
  try {
    await prisma.$connect();
    console.log('🔍 SIMPLE PEOPLE COMPARISON');
    console.log('===========================');

    // Get all people and analyze in JavaScript
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        customFields: true,
        enrichmentSources: true,
        lastEnriched: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            name: true,
            customFields: true
          }
        }
      }
    });

    console.log(`📊 TOTAL PEOPLE: ${allPeople.length}`);

    // Analyze in JavaScript
    let withCoreSignalId = 0;
    let withoutCoreSignalId = 0;
    let withActualCoreSignalData = 0;
    let withRawData = 0;
    let withRichProfile = 0;
    let withCareerData = 0;
    let withApiUsage = 0;
    let withCharges = 0;
    let withBilling = 0;
    let withLastEnriched = 0;
    let withEnrichmentSources = 0;

    const coresignalIds = new Set();
    const duplicateIds = [];
    const sampleWithId = [];
    const sampleWithoutId = [];
    const sampleWithCoreSignalData = [];

    allPeople.forEach(person => {
      const hasCoreSignalId = person.customFields?.coresignalId;
      const hasActualCoreSignalData = person.customFields?.coresignalData || 
                                     person.customFields?.coresignal_data || 
                                     person.customFields?.coreSignalData || 
                                     person.customFields?.core_signal_data;

      if (hasCoreSignalId) {
        withCoreSignalId++;
        if (coresignalIds.has(person.customFields.coresignalId)) {
          duplicateIds.push({
            name: person.fullName,
            id: person.customFields.coresignalId
          });
        } else {
          coresignalIds.add(person.customFields.coresignalId);
        }
        if (sampleWithId.length < 3) {
          sampleWithId.push(person);
        }
      } else {
        withoutCoreSignalId++;
        if (sampleWithoutId.length < 3) {
          sampleWithoutId.push(person);
        }
      }

      if (hasActualCoreSignalData) {
        withActualCoreSignalData++;
        if (sampleWithCoreSignalData.length < 3) {
          sampleWithCoreSignalData.push(person);
        }
      }

      if (person.customFields) {
        if (person.customFields.rawData) withRawData++;
        if (person.customFields.richProfile) withRichProfile++;
        if (person.customFields.careerData) withCareerData++;
        if (person.customFields.apiUsage) withApiUsage++;
        if (person.customFields.charges) withCharges++;
        if (person.customFields.billing) withBilling++;
        if (person.customFields.lastEnriched) withLastEnriched++;
        if (person.customFields.enrichmentSources) withEnrichmentSources++;
      }
    });

    console.log('\n📊 PEOPLE WITH CORESIGNAL ID:');
    console.log('==============================');
    console.log(`Count: ${withCoreSignalId} (${Math.round((withCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`Unique IDs: ${coresignalIds.size}`);
    console.log(`Duplicate IDs: ${duplicateIds.length}`);

    console.log('\n📊 PEOPLE WITHOUT CORESIGNAL ID:');
    console.log('=================================');
    console.log(`Count: ${withoutCoreSignalId} (${Math.round((withoutCoreSignalId/allPeople.length)*100)}%)`);

    console.log('\n📊 DATA STORAGE ANALYSIS:');
    console.log('=========================');
    console.log(`With actual CoreSignal data: ${withActualCoreSignalData} (${Math.round((withActualCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`With rawData: ${withRawData} (${Math.round((withRawData/allPeople.length)*100)}%)`);
    console.log(`With richProfile: ${withRichProfile} (${Math.round((withRichProfile/allPeople.length)*100)}%)`);
    console.log(`With careerData: ${withCareerData} (${Math.round((withCareerData/allPeople.length)*100)}%)`);

    console.log('\n📊 API USAGE TRACKING:');
    console.log('======================');
    console.log(`With API usage tracking: ${withApiUsage} (${Math.round((withApiUsage/allPeople.length)*100)}%)`);
    console.log(`With charges tracking: ${withCharges} (${Math.round((withCharges/allPeople.length)*100)}%)`);
    console.log(`With billing tracking: ${withBilling} (${Math.round((withBilling/allPeople.length)*100)}%)`);
    console.log(`With lastEnriched: ${withLastEnriched} (${Math.round((withLastEnriched/allPeople.length)*100)}%)`);
    console.log(`With enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/allPeople.length)*100)}%)`);

    // Show samples
    console.log('\n🔍 SAMPLE PEOPLE WITH CORESIGNAL ID:');
    console.log('====================================');
    sampleWithId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Updated: ${person.updatedAt}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        console.log(`   CoreSignal ID: ${person.customFields.coresignalId}`);
        
        // Check for CoreSignal data in different locations
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
          console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (person.customFields.rawData) {
          console.log(`   Raw data: ${typeof person.customFields.rawData} (${Object.keys(person.customFields.rawData || {}).length} keys)`);
        }
        
        if (person.customFields.richProfile) {
          console.log(`   Rich profile: ${typeof person.customFields.richProfile} (${Object.keys(person.customFields.richProfile || {}).length} keys)`);
        }
        
        if (person.customFields.careerData) {
          console.log(`   Career data: ${typeof person.customFields.careerData} (${Object.keys(person.customFields.careerData || {}).length} keys)`);
        }
        
        // Check for API usage tracking
        if (person.customFields.apiUsage) {
          console.log(`   API usage: ${JSON.stringify(person.customFields.apiUsage)}`);
        }
        
        if (person.customFields.charges) {
          console.log(`   Charges: ${JSON.stringify(person.customFields.charges)}`);
        }
        
        if (person.customFields.billing) {
          console.log(`   Billing: ${JSON.stringify(person.customFields.billing)}`);
        }
      }
    });

    console.log('\n🔍 SAMPLE PEOPLE WITHOUT CORESIGNAL ID:');
    console.log('=========================================');
    sampleWithoutId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
      console.log(`   Email: ${person.email || 'None'}`);
      console.log(`   Phone: ${person.phone || 'None'}`);
      console.log(`   LinkedIn: ${person.linkedinUrl || 'None'}`);
      console.log(`   Created: ${person.createdAt}`);
      console.log(`   Updated: ${person.updatedAt}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   Sources: ${person.enrichmentSources?.join(', ') || 'None'}`);
      
      if (person.customFields) {
        console.log(`   CustomFields keys: ${Object.keys(person.customFields).join(', ')}`);
        
        // Check for any CoreSignal data
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (person.customFields.rawData) {
          console.log(`   Raw data: ${typeof person.customFields.rawData} (${Object.keys(person.customFields.rawData || {}).length} keys)`);
        }
        
        if (person.customFields.richProfile) {
          console.log(`   Rich profile: ${typeof person.customFields.richProfile} (${Object.keys(person.customFields.richProfile || {}).length} keys)`);
        }
        
        if (person.customFields.careerData) {
          console.log(`   Career data: ${typeof person.customFields.careerData} (${Object.keys(person.customFields.careerData || {}).length} keys)`);
        }
      } else {
        console.log(`   ❌ No customFields at all`);
      }
    });

    if (sampleWithCoreSignalData.length > 0) {
      console.log('\n🎯 SAMPLE PEOPLE WITH ACTUAL CORESIGNAL DATA:');
      console.log('==============================================');
      sampleWithCoreSignalData.forEach((person, index) => {
        console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
      });
    }

    if (duplicateIds.length > 0) {
      console.log('\n⚠️ DUPLICATE CORESIGNAL IDs:');
      console.log('============================');
      duplicateIds.forEach(dup => {
        console.log(`${dup.name}: ${dup.id}`);
      });
    }

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${allPeople.length}`);
    console.log(`With CoreSignal IDs: ${withCoreSignalId} (${Math.round((withCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`Without CoreSignal IDs: ${withoutCoreSignalId} (${Math.round((withoutCoreSignalId/allPeople.length)*100)}%)`);
    console.log(`With actual CoreSignal data: ${withActualCoreSignalData} (${Math.round((withActualCoreSignalData/allPeople.length)*100)}%)`);
    console.log(`Unique CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);

    console.log('\n🎯 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. Check if CoreSignal data is stored in rawData or richProfile fields');
    console.log('2. Implement duplicate protection using existing coresignalId values');
    console.log('3. Add API usage tracking to prevent double charging');
    console.log('4. Consider using existing IDs to fetch missing data');

  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simplePeopleComparison();


