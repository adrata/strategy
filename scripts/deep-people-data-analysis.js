const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function deepPeopleDataAnalysis() {
  try {
    await prisma.$connect();
    console.log('🔍 DEEP PEOPLE DATA ANALYSIS');
    console.log('============================');

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
      },
      take: 5
    });

    // Get people without coresignalId
    const peopleWithoutCoreSignalId = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      },
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
      },
      take: 5
    });

    console.log(`📊 PEOPLE WITH CORESIGNAL ID: ${peopleWithCoreSignalId.length}`);
    console.log(`📊 PEOPLE WITHOUT CORESIGNAL ID: ${peopleWithoutCoreSignalId.length}`);

    // Analyze people WITH coresignalId
    console.log('\n🔍 PEOPLE WITH CORESIGNAL ID ANALYSIS:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
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

    // Analyze people WITHOUT coresignalId
    console.log('\n🔍 PEOPLE WITHOUT CORESIGNAL ID ANALYSIS:');
    console.log('==========================================');
    
    peopleWithoutCoreSignalId.forEach((person, index) => {
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

    // Check for API usage tracking and billing
    console.log('\n💰 API USAGE AND BILLING ANALYSIS:');
    console.log('===================================');
    
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      select: {
        fullName: true,
        customFields: true
      },
      take: 100
    });

    let withApiUsage = 0;
    let withCharges = 0;
    let withBilling = 0;
    let withLastEnriched = 0;
    let withEnrichmentSources = 0;

    allPeople.forEach(person => {
      if (person.customFields) {
        if (person.customFields.apiUsage) withApiUsage++;
        if (person.customFields.charges) withCharges++;
        if (person.customFields.billing) withBilling++;
        if (person.customFields.lastEnriched) withLastEnriched++;
        if (person.customFields.enrichmentSources) withEnrichmentSources++;
      }
    });

    console.log(`People with API usage tracking: ${withApiUsage}`);
    console.log(`People with charges tracking: ${withCharges}`);
    console.log(`People with billing tracking: ${withBilling}`);
    console.log(`People with lastEnriched: ${withLastEnriched}`);
    console.log(`People with enrichmentSources: ${withEnrichmentSources}`);

    // Check for duplicate protection
    console.log('\n🛡️ DUPLICATE PROTECTION ANALYSIS:');
    console.log('==================================');
    
    const coresignalIds = new Set();
    const duplicateIds = [];
    
    allPeople.forEach(person => {
      if (person.customFields?.coresignalId) {
        if (coresignalIds.has(person.customFields.coresignalId)) {
          duplicateIds.push({
            name: person.fullName,
            id: person.customFields.coresignalId
          });
        } else {
          coresignalIds.add(person.customFields.coresignalId);
        }
      }
    });

    console.log(`Unique CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);
    
    if (duplicateIds.length > 0) {
      console.log('Duplicate IDs found:');
      duplicateIds.forEach(dup => {
        console.log(`  ${dup.name}: ${dup.id}`);
      });
    }

    // Check for people with actual CoreSignal data
    console.log('\n🎯 CORESIGNAL DATA LOCATION ANALYSIS:');
    console.log('=====================================');
    
    const peopleWithActualCoreSignalData = allPeople.filter(person => {
      if (!person.customFields) return false;
      return person.customFields.coresignalData || 
             person.customFields.coresignal_data || 
             person.customFields.coreSignalData || 
             person.customFields.core_signal_data;
    });

    console.log(`People with actual CoreSignal data: ${peopleWithActualCoreSignalData.length}`);
    
    if (peopleWithActualCoreSignalData.length > 0) {
      console.log('Sample people with CoreSignal data:');
      peopleWithActualCoreSignalData.slice(0, 3).forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName}`);
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people analyzed: ${allPeople.length}`);
    console.log(`People with CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`People with actual CoreSignal data: ${peopleWithActualCoreSignalData.length}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);
    console.log(`People with API usage tracking: ${withApiUsage}`);
    console.log(`People with charges tracking: ${withCharges}`);

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

deepPeopleDataAnalysis();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function deepPeopleDataAnalysis() {
  try {
    await prisma.$connect();
    console.log('🔍 DEEP PEOPLE DATA ANALYSIS');
    console.log('============================');

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
      },
      take: 5
    });

    // Get people without coresignalId
    const peopleWithoutCoreSignalId = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: null },
          {
            customFields: {
              path: ['coresignalId'],
              equals: null
            }
          }
        ]
      },
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
      },
      take: 5
    });

    console.log(`📊 PEOPLE WITH CORESIGNAL ID: ${peopleWithCoreSignalId.length}`);
    console.log(`📊 PEOPLE WITHOUT CORESIGNAL ID: ${peopleWithoutCoreSignalId.length}`);

    // Analyze people WITH coresignalId
    console.log('\n🔍 PEOPLE WITH CORESIGNAL ID ANALYSIS:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
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

    // Analyze people WITHOUT coresignalId
    console.log('\n🔍 PEOPLE WITHOUT CORESIGNAL ID ANALYSIS:');
    console.log('==========================================');
    
    peopleWithoutCoreSignalId.forEach((person, index) => {
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

    // Check for API usage tracking and billing
    console.log('\n💰 API USAGE AND BILLING ANALYSIS:');
    console.log('===================================');
    
    const allPeople = await prisma.people.findMany({
      where: { workspaceId: TOP_WORKSPACE_ID },
      select: {
        fullName: true,
        customFields: true
      },
      take: 100
    });

    let withApiUsage = 0;
    let withCharges = 0;
    let withBilling = 0;
    let withLastEnriched = 0;
    let withEnrichmentSources = 0;

    allPeople.forEach(person => {
      if (person.customFields) {
        if (person.customFields.apiUsage) withApiUsage++;
        if (person.customFields.charges) withCharges++;
        if (person.customFields.billing) withBilling++;
        if (person.customFields.lastEnriched) withLastEnriched++;
        if (person.customFields.enrichmentSources) withEnrichmentSources++;
      }
    });

    console.log(`People with API usage tracking: ${withApiUsage}`);
    console.log(`People with charges tracking: ${withCharges}`);
    console.log(`People with billing tracking: ${withBilling}`);
    console.log(`People with lastEnriched: ${withLastEnriched}`);
    console.log(`People with enrichmentSources: ${withEnrichmentSources}`);

    // Check for duplicate protection
    console.log('\n🛡️ DUPLICATE PROTECTION ANALYSIS:');
    console.log('==================================');
    
    const coresignalIds = new Set();
    const duplicateIds = [];
    
    allPeople.forEach(person => {
      if (person.customFields?.coresignalId) {
        if (coresignalIds.has(person.customFields.coresignalId)) {
          duplicateIds.push({
            name: person.fullName,
            id: person.customFields.coresignalId
          });
        } else {
          coresignalIds.add(person.customFields.coresignalId);
        }
      }
    });

    console.log(`Unique CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);
    
    if (duplicateIds.length > 0) {
      console.log('Duplicate IDs found:');
      duplicateIds.forEach(dup => {
        console.log(`  ${dup.name}: ${dup.id}`);
      });
    }

    // Check for people with actual CoreSignal data
    console.log('\n🎯 CORESIGNAL DATA LOCATION ANALYSIS:');
    console.log('=====================================');
    
    const peopleWithActualCoreSignalData = allPeople.filter(person => {
      if (!person.customFields) return false;
      return person.customFields.coresignalData || 
             person.customFields.coresignal_data || 
             person.customFields.coreSignalData || 
             person.customFields.core_signal_data;
    });

    console.log(`People with actual CoreSignal data: ${peopleWithActualCoreSignalData.length}`);
    
    if (peopleWithActualCoreSignalData.length > 0) {
      console.log('Sample people with CoreSignal data:');
      peopleWithActualCoreSignalData.slice(0, 3).forEach((person, index) => {
        console.log(`${index + 1}. ${person.fullName}`);
        const coresignalData = person.customFields.coresignalData || 
                              person.customFields.coresignal_data || 
                              person.customFields.coreSignalData || 
                              person.customFields.core_signal_data;
        console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
      });
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people analyzed: ${allPeople.length}`);
    console.log(`People with CoreSignal IDs: ${coresignalIds.size}`);
    console.log(`People with actual CoreSignal data: ${peopleWithActualCoreSignalData.length}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateIds.length}`);
    console.log(`People with API usage tracking: ${withApiUsage}`);
    console.log(`People with charges tracking: ${withCharges}`);

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

deepPeopleDataAnalysis();


