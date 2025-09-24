const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function finalPeopleSummary() {
  try {
    await prisma.$connect();
    console.log('🔍 FINAL PEOPLE SUMMARY');
    console.log('========================');

    // Get total count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    // Get people with coresignalId count
    const coresignalIdCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
    `;

    // Get people with actual CoreSignal data
    const coresignalDataCount = await prisma.$queryRaw`
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

    // Get people with rawData
    const rawDataCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
    `;

    // Get people with richProfile
    const richProfileCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'richProfile' IS NOT NULL
    `;

    // Get people with careerData
    const careerDataCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'careerData' IS NOT NULL
    `;

    // Get people with lastEnriched
    const lastEnrichedCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'lastEnriched' IS NOT NULL
    `;

    // Get people with enrichmentSources
    const enrichmentSourcesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'enrichmentSources' IS NOT NULL
    `;

    // Check for duplicates
    const duplicateCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "customFields"->>'coresignalId' as coresignal_id
        FROM people 
        WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
          AND "customFields"->>'coresignalId' IS NOT NULL
        GROUP BY "customFields"->>'coresignalId'
        HAVING COUNT(*) > 1
      ) as duplicates
    `;

    const coresignalIdCountNum = Number(coresignalIdCount[0].count);
    const coresignalDataCountNum = Number(coresignalDataCount[0].count);
    const rawDataCountNum = Number(rawDataCount[0].count);
    const richProfileCountNum = Number(richProfileCount[0].count);
    const careerDataCountNum = Number(careerDataCount[0].count);
    const lastEnrichedCountNum = Number(lastEnrichedCount[0].count);
    const enrichmentSourcesCountNum = Number(enrichmentSourcesCount[0].count);
    const duplicateCountNum = Number(duplicateCount[0].count);

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);
    console.log(`✅ WITH CORESIGNAL ID: ${coresignalIdCountNum} (${Math.round((coresignalIdCountNum/totalPeople)*100)}%)`);
    console.log(`❌ WITHOUT CORESIGNAL ID: ${totalPeople - coresignalIdCountNum} (${Math.round(((totalPeople - coresignalIdCountNum)/totalPeople)*100)}%)`);
    console.log(`🎯 WITH ACTUAL CORESIGNAL DATA: ${coresignalDataCountNum} (${Math.round((coresignalDataCountNum/totalPeople)*100)}%)`);
    console.log(`📋 WITH RAW DATA: ${rawDataCountNum} (${Math.round((rawDataCountNum/totalPeople)*100)}%)`);
    console.log(`👤 WITH RICH PROFILE: ${richProfileCountNum} (${Math.round((richProfileCountNum/totalPeople)*100)}%)`);
    console.log(`💼 WITH CAREER DATA: ${careerDataCountNum} (${Math.round((careerDataCountNum/totalPeople)*100)}%)`);
    console.log(`📅 WITH LAST ENRICHED: ${lastEnrichedCountNum} (${Math.round((lastEnrichedCountNum/totalPeople)*100)}%)`);
    console.log(`🔍 WITH ENRICHMENT SOURCES: ${enrichmentSourcesCountNum} (${Math.round((enrichmentSourcesCountNum/totalPeople)*100)}%)`);
    console.log(`⚠️ DUPLICATE CORESIGNAL IDs: ${duplicateCountNum}`);

    console.log('\n🎯 KEY FINDINGS:');
    console.log('===============');
    console.log(`1. ${coresignalIdCountNum} people have CoreSignal IDs but NO actual CoreSignal data`);
    console.log(`2. ${rawDataCountNum} people have rawData (likely contains CoreSignal data)`);
    console.log(`3. ${richProfileCountNum} people have richProfile data`);
    console.log(`4. ${careerDataCountNum} people have careerData`);
    console.log(`5. ${duplicateCountNum} duplicate CoreSignal IDs (good for duplicate protection)`);

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. The CoreSignal data is likely stored in rawData field, not coresignalData');
    console.log('2. We can use existing coresignalId values to fetch missing data');
    console.log('3. Implement duplicate protection using existing coresignalId values');
    console.log('4. Add API usage tracking to prevent double charging');
    console.log('5. Consider enriching the remaining people without CoreSignal IDs');

    console.log('\n🛡️ DUPLICATE PROTECTION STRATEGY:');
    console.log('==================================');
    console.log('1. Check existing coresignalId before making API calls');
    console.log('2. Store API usage in customFields to track charges');
    console.log('3. Use coresignalId as unique identifier to prevent duplicates');
    console.log('4. Implement rate limiting to avoid API overuse');

  } catch (error) {
    console.error('❌ Summary error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalPeopleSummary();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function finalPeopleSummary() {
  try {
    await prisma.$connect();
    console.log('🔍 FINAL PEOPLE SUMMARY');
    console.log('========================');

    // Get total count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    // Get people with coresignalId count
    const coresignalIdCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'coresignalId' IS NOT NULL
    `;

    // Get people with actual CoreSignal data
    const coresignalDataCount = await prisma.$queryRaw`
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

    // Get people with rawData
    const rawDataCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'rawData' IS NOT NULL
    `;

    // Get people with richProfile
    const richProfileCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'richProfile' IS NOT NULL
    `;

    // Get people with careerData
    const careerDataCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'careerData' IS NOT NULL
    `;

    // Get people with lastEnriched
    const lastEnrichedCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'lastEnriched' IS NOT NULL
    `;

    // Get people with enrichmentSources
    const enrichmentSourcesCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM people 
      WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
        AND "customFields"->>'enrichmentSources' IS NOT NULL
    `;

    // Check for duplicates
    const duplicateCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM (
        SELECT "customFields"->>'coresignalId' as coresignal_id
        FROM people 
        WHERE "workspaceId" = ${TOP_WORKSPACE_ID} 
          AND "customFields"->>'coresignalId' IS NOT NULL
        GROUP BY "customFields"->>'coresignalId'
        HAVING COUNT(*) > 1
      ) as duplicates
    `;

    const coresignalIdCountNum = Number(coresignalIdCount[0].count);
    const coresignalDataCountNum = Number(coresignalDataCount[0].count);
    const rawDataCountNum = Number(rawDataCount[0].count);
    const richProfileCountNum = Number(richProfileCount[0].count);
    const careerDataCountNum = Number(careerDataCount[0].count);
    const lastEnrichedCountNum = Number(lastEnrichedCount[0].count);
    const enrichmentSourcesCountNum = Number(enrichmentSourcesCount[0].count);
    const duplicateCountNum = Number(duplicateCount[0].count);

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);
    console.log(`✅ WITH CORESIGNAL ID: ${coresignalIdCountNum} (${Math.round((coresignalIdCountNum/totalPeople)*100)}%)`);
    console.log(`❌ WITHOUT CORESIGNAL ID: ${totalPeople - coresignalIdCountNum} (${Math.round(((totalPeople - coresignalIdCountNum)/totalPeople)*100)}%)`);
    console.log(`🎯 WITH ACTUAL CORESIGNAL DATA: ${coresignalDataCountNum} (${Math.round((coresignalDataCountNum/totalPeople)*100)}%)`);
    console.log(`📋 WITH RAW DATA: ${rawDataCountNum} (${Math.round((rawDataCountNum/totalPeople)*100)}%)`);
    console.log(`👤 WITH RICH PROFILE: ${richProfileCountNum} (${Math.round((richProfileCountNum/totalPeople)*100)}%)`);
    console.log(`💼 WITH CAREER DATA: ${careerDataCountNum} (${Math.round((careerDataCountNum/totalPeople)*100)}%)`);
    console.log(`📅 WITH LAST ENRICHED: ${lastEnrichedCountNum} (${Math.round((lastEnrichedCountNum/totalPeople)*100)}%)`);
    console.log(`🔍 WITH ENRICHMENT SOURCES: ${enrichmentSourcesCountNum} (${Math.round((enrichmentSourcesCountNum/totalPeople)*100)}%)`);
    console.log(`⚠️ DUPLICATE CORESIGNAL IDs: ${duplicateCountNum}`);

    console.log('\n🎯 KEY FINDINGS:');
    console.log('===============');
    console.log(`1. ${coresignalIdCountNum} people have CoreSignal IDs but NO actual CoreSignal data`);
    console.log(`2. ${rawDataCountNum} people have rawData (likely contains CoreSignal data)`);
    console.log(`3. ${richProfileCountNum} people have richProfile data`);
    console.log(`4. ${careerDataCountNum} people have careerData`);
    console.log(`5. ${duplicateCountNum} duplicate CoreSignal IDs (good for duplicate protection)`);

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('==================');
    console.log('1. The CoreSignal data is likely stored in rawData field, not coresignalData');
    console.log('2. We can use existing coresignalId values to fetch missing data');
    console.log('3. Implement duplicate protection using existing coresignalId values');
    console.log('4. Add API usage tracking to prevent double charging');
    console.log('5. Consider enriching the remaining people without CoreSignal IDs');

    console.log('\n🛡️ DUPLICATE PROTECTION STRATEGY:');
    console.log('==================================');
    console.log('1. Check existing coresignalId before making API calls');
    console.log('2. Store API usage in customFields to track charges');
    console.log('3. Use coresignalId as unique identifier to prevent duplicates');
    console.log('4. Implement rate limiting to avoid API overuse');

  } catch (error) {
    console.error('❌ Summary error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

finalPeopleSummary();
