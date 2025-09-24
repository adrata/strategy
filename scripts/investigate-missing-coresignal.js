const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateMissingCoreSignal() {
  try {
    console.log('🔍 INVESTIGATING MISSING CORESIGNAL DATA');
    console.log('=========================================');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get companies WITHOUT CoreSignal data
    const withoutCoreSignal = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { customFields: null },
          { 
            customFields: {
              path: ['coresignalData'],
              equals: null
            }
          }
        ]
      },
      select: {
        id: true,
        name: true,
        domain: true,
        customFields: true,
        updatedAt: true
      },
      take: 10
    });

    console.log(`\n📊 COMPANIES WITHOUT CORESIGNAL DATA (showing first 10):`);
    console.log(`Total without CoreSignal: ${withoutCoreSignal.length} companies`);
    
    withoutCoreSignal.forEach((company, i) => {
      console.log(`\n${i+1}. ${company.name}`);
      console.log(`   Domain: ${company.domain || 'No domain'}`);
      console.log(`   CustomFields: ${company.customFields ? 'Has customFields' : 'No customFields'}`);
      if (company.customFields) {
        console.log(`   CoreSignal: ${company.customFields.coresignalData ? 'Has data' : 'Missing'}`);
        console.log(`   Last enriched: ${company.customFields.lastEnrichedAt || 'Never'}`);
      }
      console.log(`   Last updated: ${company.updatedAt}`);
    });

    // Check companies with partial data
    const withPartialData = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        AND: [
          { customFields: { not: null } },
          {
            customFields: {
              path: ['coresignalData'],
              equals: null
            }
          }
        ]
      },
      select: {
        name: true,
        customFields: true
      },
      take: 5
    });

    console.log(`\n🔍 COMPANIES WITH CUSTOMFIELDS BUT NO CORESIGNAL (showing first 5):`);
    withPartialData.forEach((company, i) => {
      console.log(`\n${i+1}. ${company.name}`);
      console.log(`   CustomFields keys: ${Object.keys(company.customFields || {})}`);
      console.log(`   Has CoreSignal: ${company.customFields?.coresignalData ? 'Yes' : 'No'}`);
    });

    // Check for companies that might have failed enrichment
    const failedEnrichment = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['enrichmentError'],
          not: null
        }
      },
      select: {
        name: true,
        customFields: true
      },
      take: 5
    });

    console.log(`\n❌ COMPANIES WITH ENRICHMENT ERRORS (showing first 5):`);
    failedEnrichment.forEach((company, i) => {
      console.log(`\n${i+1}. ${company.name}`);
      console.log(`   Error: ${company.customFields?.enrichmentError}`);
    });

    // Check the enrichment status
    const enrichmentStats = await prisma.companies.groupBy({
      by: ['workspaceId'],
      where: { workspaceId: workspaceId },
      _count: {
        id: true
      }
    });

    const coreSignalStats = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const customFieldsStats = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null }
      }
    });

    console.log(`\n📊 ENRICHMENT STATISTICS:`);
    console.log(`Total companies: ${enrichmentStats[0]?._count.id || 0}`);
    console.log(`Companies with customFields: ${customFieldsStats}`);
    console.log(`Companies with CoreSignal: ${coreSignalStats}`);
    console.log(`Missing CoreSignal: ${(enrichmentStats[0]?._count.id || 0) - coreSignalStats}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

investigateMissingCoreSignal();
