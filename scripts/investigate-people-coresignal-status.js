const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigatePeopleCoreSignalStatus() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING PEOPLE CORESIGNAL STATUS');
    console.log('==========================================');

    // Get total people count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);

    // Check people with CoreSignal data
    const withCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Check people with any customFields
    const withCustomFields = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          not: null
        }
      }
    });

    // Check people with any enrichment data
    const withAnyEnrichment = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: { not: null } },
          { lastEnriched: { not: null } },
          { enrichmentSources: { has: 'coresignal' } }
        ]
      }
    });

    // Check people with enrichment sources
    const withEnrichmentSources = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      }
    });

    // Check people with lastEnriched date
    const withLastEnriched = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      }
    });

    console.log('\n📈 CORESIGNAL COVERAGE ANALYSIS:');
    console.log('================================');
    console.log(`✅ With CoreSignal data in customFields: ${withCoreSignal} (${Math.round((withCoreSignal/totalPeople)*100)}%)`);
    console.log(`📋 With any customFields: ${withCustomFields} (${Math.round((withCustomFields/totalPeople)*100)}%)`);
    console.log(`🔍 With any enrichment data: ${withAnyEnrichment} (${Math.round((withAnyEnrichment/totalPeople)*100)}%)`);
    console.log(`🔍 With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/totalPeople)*100)}%)`);
    console.log(`📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/totalPeople)*100)}%)`);

    // Get recent enrichment activity
    const recentActivity = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        },
        lastEnriched: true,
        enrichmentSources: true,
        customFields: true
      },
      orderBy: {
        lastEnriched: 'desc'
      },
      take: 10
    });

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 24 hours):');
      console.log('===================================================');
      recentActivity.forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
        console.log(`   CoreSignal: ${hasCoreSignal} | Sources: ${person.enrichmentSources?.join(', ') || 'None'} | ${timeAgo}h ago`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 24 hours');
    }

    // Check people without CoreSignal data
    const withoutCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
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
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        },
        customFields: true,
        lastEnriched: true
      },
      take: 10
    });

    console.log('\n❌ PEOPLE WITHOUT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    withoutCoreSignal.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   CustomFields: ${person.customFields ? 'Has data' : 'None'}`);
    });

    // Check how people got CoreSignal data
    const peopleWithCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      },
      select: {
        fullName: true,
        enrichmentSources: true,
        customFields: true,
        lastEnriched: true
      },
      take: 5
    });

    console.log('\n🔍 HOW PEOPLE GOT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    peopleWithCoreSignal.forEach((person, index) => {
      const enrichmentSource = person.customFields?.enrichmentSource || 'Unknown';
      const sources = person.enrichmentSources?.join(', ') || 'None';
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Enrichment source: ${enrichmentSource}`);
      console.log(`   Sources array: ${sources}`);
      console.log(`   Last enriched: ${person.lastEnriched}`);
    });

    // Check companies with people
    const companiesWithPeople = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        people: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            people: true
          }
        }
      },
      orderBy: {
        people: {
          _count: 'desc'
        }
      },
      take: 10
    });

    console.log('\n🏢 COMPANIES WITH MOST PEOPLE:');
    console.log('==============================');
    companiesWithPeople.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}: ${company._count.people} people`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/totalPeople)*100)}%)`);
    console.log(`Without CoreSignal data: ${totalPeople - withCoreSignal} (${Math.round(((totalPeople - withCoreSignal)/totalPeople)*100)}%)`);
    
    if (withCoreSignal > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. People enrichment appears to be working through:');
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

investigatePeopleCoreSignalStatus();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function investigatePeopleCoreSignalStatus() {
  try {
    await prisma.$connect();
    console.log('🔍 INVESTIGATING PEOPLE CORESIGNAL STATUS');
    console.log('==========================================');

    // Get total people count
    const totalPeople = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    console.log(`📊 TOTAL PEOPLE: ${totalPeople}`);

    // Check people with CoreSignal data
    const withCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Check people with any customFields
    const withCustomFields = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          not: null
        }
      }
    });

    // Check people with any enrichment data
    const withAnyEnrichment = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          { customFields: { not: null } },
          { lastEnriched: { not: null } },
          { enrichmentSources: { has: 'coresignal' } }
        ]
      }
    });

    // Check people with enrichment sources
    const withEnrichmentSources = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        enrichmentSources: {
          has: 'coresignal'
        }
      }
    });

    // Check people with lastEnriched date
    const withLastEnriched = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          not: null
        }
      }
    });

    console.log('\n📈 CORESIGNAL COVERAGE ANALYSIS:');
    console.log('================================');
    console.log(`✅ With CoreSignal data in customFields: ${withCoreSignal} (${Math.round((withCoreSignal/totalPeople)*100)}%)`);
    console.log(`📋 With any customFields: ${withCustomFields} (${Math.round((withCustomFields/totalPeople)*100)}%)`);
    console.log(`🔍 With any enrichment data: ${withAnyEnrichment} (${Math.round((withAnyEnrichment/totalPeople)*100)}%)`);
    console.log(`🔍 With 'coresignal' in enrichmentSources: ${withEnrichmentSources} (${Math.round((withEnrichmentSources/totalPeople)*100)}%)`);
    console.log(`📅 With lastEnriched date: ${withLastEnriched} (${Math.round((withLastEnriched/totalPeople)*100)}%)`);

    // Get recent enrichment activity
    const recentActivity = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        lastEnriched: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        },
        lastEnriched: true,
        enrichmentSources: true,
        customFields: true
      },
      orderBy: {
        lastEnriched: 'desc'
      },
      take: 10
    });

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 24 hours):');
      console.log('===================================================');
      recentActivity.forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.lastEnriched)) / 1000 / 60 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
        console.log(`   CoreSignal: ${hasCoreSignal} | Sources: ${person.enrichmentSources?.join(', ') || 'None'} | ${timeAgo}h ago`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 24 hours');
    }

    // Check people without CoreSignal data
    const withoutCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
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
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        },
        customFields: true,
        lastEnriched: true
      },
      take: 10
    });

    console.log('\n❌ PEOPLE WITHOUT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    withoutCoreSignal.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company.name}`);
      console.log(`   Last enriched: ${person.lastEnriched || 'Never'}`);
      console.log(`   CustomFields: ${person.customFields ? 'Has data' : 'None'}`);
    });

    // Check how people got CoreSignal data
    const peopleWithCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      },
      select: {
        fullName: true,
        enrichmentSources: true,
        customFields: true,
        lastEnriched: true
      },
      take: 5
    });

    console.log('\n🔍 HOW PEOPLE GOT CORESIGNAL DATA (Sample):');
    console.log('==========================================');
    peopleWithCoreSignal.forEach((person, index) => {
      const enrichmentSource = person.customFields?.enrichmentSource || 'Unknown';
      const sources = person.enrichmentSources?.join(', ') || 'None';
      console.log(`${index + 1}. ${person.fullName}`);
      console.log(`   Enrichment source: ${enrichmentSource}`);
      console.log(`   Sources array: ${sources}`);
      console.log(`   Last enriched: ${person.lastEnriched}`);
    });

    // Check companies with people
    const companiesWithPeople = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        people: {
          some: {}
        }
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            people: true
          }
        }
      },
      orderBy: {
        people: {
          _count: 'desc'
        }
      },
      take: 10
    });

    console.log('\n🏢 COMPANIES WITH MOST PEOPLE:');
    console.log('==============================');
    companiesWithPeople.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name}: ${company._count.people} people`);
    });

    console.log('\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total people: ${totalPeople}`);
    console.log(`With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/totalPeople)*100)}%)`);
    console.log(`Without CoreSignal data: ${totalPeople - withCoreSignal} (${Math.round(((totalPeople - withCoreSignal)/totalPeople)*100)}%)`);
    
    if (withCoreSignal > 0) {
      console.log('\n🎯 RECOMMENDATIONS:');
      console.log('==================');
      console.log('1. People enrichment appears to be working through:');
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

investigatePeopleCoreSignalStatus();
