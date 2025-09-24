const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function rawSqlPeopleAnalysis() {
  try {
    await prisma.$connect();
    console.log('🔍 RAW SQL PEOPLE ANALYSIS');
    console.log('===========================');

    // Get total count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);

    // Get people with coresignalId using raw SQL
    const peopleWithCoreSignalId = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
      LIMIT 10
    `;

    // Get people without coresignalId using raw SQL
    const peopleWithoutCoreSignalId = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      LIMIT 10
    `;

    console.log(`📊 PEOPLE WITH CORESIGNAL ID (sample): ${peopleWithCoreSignalId.length}`);
    console.log(`📊 PEOPLE WITHOUT CORESIGNAL ID (sample): ${peopleWithoutCoreSignalId.length}`);

    // Analyze people WITH coresignalId
    console.log('\n🔍 PEOPLE WITH CORESIGNAL ID ANALYSIS:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle})`);
      
      if (person.customFields) {
        const customFields = typeof person.customFields === 'string' 
          ? JSON.parse(person.customFields) 
          : person.customFields;
        
        console.log(`   CustomFields keys: ${Object.keys(customFields).join(', ')}`);
        console.log(`   CoreSignal ID: ${customFields.coresignalId}`);
        
        // Check for CoreSignal data in different locations
        const coresignalData = customFields.coresignalData || 
                              customFields.coresignal_data || 
                              customFields.coreSignalData || 
                              customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
          console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (customFields.rawData) {
          console.log(`   Raw data: ${typeof customFields.rawData} (${Object.keys(customFields.rawData || {}).length} keys)`);
        }
        
        if (customFields.richProfile) {
          console.log(`   Rich profile: ${typeof customFields.richProfile} (${Object.keys(customFields.richProfile || {}).length} keys)`);
        }
        
        if (customFields.careerData) {
          console.log(`   Career data: ${typeof customFields.careerData} (${Object.keys(customFields.careerData || {}).length} keys)`);
        }
        
        // Check for API usage tracking
        if (customFields.apiUsage) {
          console.log(`   API usage: ${JSON.stringify(customFields.apiUsage)}`);
        }
        
        if (customFields.charges) {
          console.log(`   Charges: ${JSON.stringify(customFields.charges)}`);
        }
        
        if (customFields.billing) {
          console.log(`   Billing: ${JSON.stringify(customFields.billing)}`);
        }
      }
    });

    // Analyze people WITHOUT coresignalId
    console.log('\n🔍 PEOPLE WITHOUT CORESIGNAL ID ANALYSIS:');
    console.log('==========================================');
    
    peopleWithoutCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle})`);
      
      if (person.customFields) {
        const customFields = typeof person.customFields === 'string' 
          ? JSON.parse(person.customFields) 
          : person.customFields;
        
        console.log(`   CustomFields keys: ${Object.keys(customFields).join(', ')}`);
        
        // Check for any CoreSignal data
        const coresignalData = customFields.coresignalData || 
                              customFields.coresignal_data || 
                              customFields.coreSignalData || 
                              customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (customFields.rawData) {
          console.log(`   Raw data: ${typeof customFields.rawData} (${Object.keys(customFields.rawData || {}).length} keys)`);
        }
        
        if (customFields.richProfile) {
          console.log(`   Rich profile: ${typeof customFields.richProfile} (${Object.keys(customFields.richProfile || {}).length} keys)`);
        }
        
        if (customFields.careerData) {
          console.log(`   Career data: ${typeof customFields.careerData} (${Object.keys(customFields.careerData || {}).length} keys)`);
        }
      } else {
        console.log(`   ❌ No customFields at all`);
      }
    });

    // Check for duplicate protection
    console.log('\n🛡️ DUPLICATE PROTECTION ANALYSIS:');
    console.log('==================================');
    
    const duplicateCheck = await prisma.$queryRaw`
      SELECT "customFields"->>'coresignalId' as coresignal_id, COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
      GROUP BY "customFields"->>'coresignalId'
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;

    console.log(`Duplicate CoreSignal IDs found: ${duplicateCheck.length}`);
    if (duplicateCheck.length > 0) {
      console.log('Top duplicate IDs:');
      duplicateCheck.forEach(dup => {
        console.log(`  ID ${dup.coresignal_id}: ${dup.count} people`);
      });
    }

    // Check for people with actual CoreSignal data
    console.log('\n🎯 CORESIGNAL DATA LOCATION ANALYSIS:');
    console.log('=====================================');
    
    const coresignalDataCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (
          "customFields"->>'coresignalData' IS NOT NULL OR
          "customFields"->>'coresignal_data' IS NOT NULL OR
          "customFields"->>'coreSignalData' IS NOT NULL OR
          "customFields"->>'core_signal_data' IS NOT NULL
        )
    `;

    console.log(`People with actual CoreSignal data: ${coresignalDataCheck[0].count}`);

    // Check for API usage tracking
    console.log('\n💰 API USAGE TRACKING ANALYSIS:');
    console.log('================================');
    
    const apiUsageCheck = await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN "customFields"->>'apiUsage' IS NOT NULL THEN 1 END) as api_usage,
        COUNT(CASE WHEN "customFields"->>'charges' IS NOT NULL THEN 1 END) as charges,
        COUNT(CASE WHEN "customFields"->>'billing' IS NOT NULL THEN 1 END) as billing,
        COUNT(CASE WHEN "customFields"->>'lastEnriched' IS NOT NULL THEN 1 END) as last_enriched,
        COUNT(CASE WHEN "customFields"->>'enrichmentSources' IS NOT NULL THEN 1 END) as enrichment_sources
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID}
    `;

    const stats = apiUsageCheck[0];
    console.log(`People with API usage tracking: ${stats.api_usage}`);
    console.log(`People with charges tracking: ${stats.charges}`);
    console.log(`People with billing tracking: ${stats.billing}`);
    console.log(`People with lastEnriched: ${stats.last_enriched}`);
    console.log(`People with enrichmentSources: ${stats.enrichment_sources}`);

    // Check for people with coresignalId count
    const coresignalIdCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
    `;

    console.log(`\n📊 CORESIGNAL ID STATISTICS:`);
    console.log('============================');
    console.log(`People with CoreSignal IDs: ${coresignalIdCount[0].count} (${Math.round((coresignalIdCount[0].count/totalPeople)*100)}%)`);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`People with CoreSignal IDs: ${coresignalIdCount[0].count} (${Math.round((coresignalIdCount[0].count/totalPeople)*100)}%)`);
    console.log(`People with actual CoreSignal data: ${coresignalDataCheck[0].count}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateCheck.length}`);

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

rawSqlPeopleAnalysis();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function rawSqlPeopleAnalysis() {
  try {
    await prisma.$connect();
    console.log('🔍 RAW SQL PEOPLE ANALYSIS');
    console.log('===========================');

    // Get total count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);

    // Get people with coresignalId using raw SQL
    const peopleWithCoreSignalId = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
      LIMIT 10
    `;

    // Get people without coresignalId using raw SQL
    const peopleWithoutCoreSignalId = await prisma.$queryRaw`
      SELECT id, "fullName", "jobTitle", "customFields", "companyId"
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND ("customFields" IS NULL OR "customFields"->>'coresignalId' IS NULL)
      LIMIT 10
    `;

    console.log(`📊 PEOPLE WITH CORESIGNAL ID (sample): ${peopleWithCoreSignalId.length}`);
    console.log(`📊 PEOPLE WITHOUT CORESIGNAL ID (sample): ${peopleWithoutCoreSignalId.length}`);

    // Analyze people WITH coresignalId
    console.log('\n🔍 PEOPLE WITH CORESIGNAL ID ANALYSIS:');
    console.log('======================================');
    
    peopleWithCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle})`);
      
      if (person.customFields) {
        const customFields = typeof person.customFields === 'string' 
          ? JSON.parse(person.customFields) 
          : person.customFields;
        
        console.log(`   CustomFields keys: ${Object.keys(customFields).join(', ')}`);
        console.log(`   CoreSignal ID: ${customFields.coresignalId}`);
        
        // Check for CoreSignal data in different locations
        const coresignalData = customFields.coresignalData || 
                              customFields.coresignal_data || 
                              customFields.coreSignalData || 
                              customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
          console.log(`   CoreSignal data keys: ${Object.keys(coresignalData).slice(0, 10).join(', ')}${Object.keys(coresignalData).length > 10 ? '...' : ''}`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (customFields.rawData) {
          console.log(`   Raw data: ${typeof customFields.rawData} (${Object.keys(customFields.rawData || {}).length} keys)`);
        }
        
        if (customFields.richProfile) {
          console.log(`   Rich profile: ${typeof customFields.richProfile} (${Object.keys(customFields.richProfile || {}).length} keys)`);
        }
        
        if (customFields.careerData) {
          console.log(`   Career data: ${typeof customFields.careerData} (${Object.keys(customFields.careerData || {}).length} keys)`);
        }
        
        // Check for API usage tracking
        if (customFields.apiUsage) {
          console.log(`   API usage: ${JSON.stringify(customFields.apiUsage)}`);
        }
        
        if (customFields.charges) {
          console.log(`   Charges: ${JSON.stringify(customFields.charges)}`);
        }
        
        if (customFields.billing) {
          console.log(`   Billing: ${JSON.stringify(customFields.billing)}`);
        }
      }
    });

    // Analyze people WITHOUT coresignalId
    console.log('\n🔍 PEOPLE WITHOUT CORESIGNAL ID ANALYSIS:');
    console.log('==========================================');
    
    peopleWithoutCoreSignalId.forEach((person, index) => {
      console.log(`\n${index + 1}. ${person.fullName} (${person.jobTitle})`);
      
      if (person.customFields) {
        const customFields = typeof person.customFields === 'string' 
          ? JSON.parse(person.customFields) 
          : person.customFields;
        
        console.log(`   CustomFields keys: ${Object.keys(customFields).join(', ')}`);
        
        // Check for any CoreSignal data
        const coresignalData = customFields.coresignalData || 
                              customFields.coresignal_data || 
                              customFields.coreSignalData || 
                              customFields.core_signal_data;
        
        if (coresignalData) {
          console.log(`   ✅ FOUND CORESIGNAL DATA!`);
        } else {
          console.log(`   ❌ No CoreSignal data found`);
        }
        
        // Check for other data sources
        if (customFields.rawData) {
          console.log(`   Raw data: ${typeof customFields.rawData} (${Object.keys(customFields.rawData || {}).length} keys)`);
        }
        
        if (customFields.richProfile) {
          console.log(`   Rich profile: ${typeof customFields.richProfile} (${Object.keys(customFields.richProfile || {}).length} keys)`);
        }
        
        if (customFields.careerData) {
          console.log(`   Career data: ${typeof customFields.careerData} (${Object.keys(customFields.careerData || {}).length} keys)`);
        }
      } else {
        console.log(`   ❌ No customFields at all`);
      }
    });

    // Check for duplicate protection
    console.log('\n🛡️ DUPLICATE PROTECTION ANALYSIS:');
    console.log('==================================');
    
    const duplicateCheck = await prisma.$queryRaw`
      SELECT "customFields"->>'coresignalId' as coresignal_id, COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
      GROUP BY "customFields"->>'coresignalId'
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 10
    `;

    console.log(`Duplicate CoreSignal IDs found: ${duplicateCheck.length}`);
    if (duplicateCheck.length > 0) {
      console.log('Top duplicate IDs:');
      duplicateCheck.forEach(dup => {
        console.log(`  ID ${dup.coresignal_id}: ${dup.count} people`);
      });
    }

    // Check for people with actual CoreSignal data
    console.log('\n🎯 CORESIGNAL DATA LOCATION ANALYSIS:');
    console.log('=====================================');
    
    const coresignalDataCheck = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND (
          "customFields"->>'coresignalData' IS NOT NULL OR
          "customFields"->>'coresignal_data' IS NOT NULL OR
          "customFields"->>'coreSignalData' IS NOT NULL OR
          "customFields"->>'core_signal_data' IS NOT NULL
        )
    `;

    console.log(`People with actual CoreSignal data: ${coresignalDataCheck[0].count}`);

    // Check for API usage tracking
    console.log('\n💰 API USAGE TRACKING ANALYSIS:');
    console.log('================================');
    
    const apiUsageCheck = await prisma.$queryRaw`
      SELECT 
        COUNT(CASE WHEN "customFields"->>'apiUsage' IS NOT NULL THEN 1 END) as api_usage,
        COUNT(CASE WHEN "customFields"->>'charges' IS NOT NULL THEN 1 END) as charges,
        COUNT(CASE WHEN "customFields"->>'billing' IS NOT NULL THEN 1 END) as billing,
        COUNT(CASE WHEN "customFields"->>'lastEnriched' IS NOT NULL THEN 1 END) as last_enriched,
        COUNT(CASE WHEN "customFields"->>'enrichmentSources' IS NOT NULL THEN 1 END) as enrichment_sources
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID}
    `;

    const stats = apiUsageCheck[0];
    console.log(`People with API usage tracking: ${stats.api_usage}`);
    console.log(`People with charges tracking: ${stats.charges}`);
    console.log(`People with billing tracking: ${stats.billing}`);
    console.log(`People with lastEnriched: ${stats.last_enriched}`);
    console.log(`People with enrichmentSources: ${stats.enrichment_sources}`);

    // Check for people with coresignalId count
    const coresignalIdCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
    `;

    console.log(`\n📊 CORESIGNAL ID STATISTICS:`);
    console.log('============================');
    console.log(`People with CoreSignal IDs: ${coresignalIdCount[0].count} (${Math.round((coresignalIdCount[0].count/totalPeople)*100)}%)`);

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`People with CoreSignal IDs: ${coresignalIdCount[0].count} (${Math.round((coresignalIdCount[0].count/totalPeople)*100)}%)`);
    console.log(`People with actual CoreSignal data: ${coresignalDataCheck[0].count}`);
    console.log(`Duplicate CoreSignal IDs: ${duplicateCheck.length}`);

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

rawSqlPeopleAnalysis();


