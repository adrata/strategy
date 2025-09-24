const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getPeopleEnrichmentStatus() {
  try {
    await prisma.$connect();

    const total = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
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

    const withRawData = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['rawData'],
          not: null
        }
      }
    });

    const recentActivity = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        },
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        updatedAt: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log('🤖 PEOPLE ENRICHMENT STATUS');
    console.log('===========================');
    console.log(`📊 TOTAL PEOPLE: ${total}`);
    console.log(`✅ WITH CORESIGNAL DATA: ${withCoreSignal} (${coresignalProgress}%)`);
    console.log(`🆔 WITH CORESIGNAL ID: ${withCoreSignalId} (${Math.round((withCoreSignalId/total)*100)}%)`);
    console.log(`📋 WITH RAW DATA: ${withRawData} (${Math.round((withRawData/total)*100)}%)`);
    console.log(`⏳ REMAINING: ${remaining} people need CoreSignal data`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 10 minutes):');
      recentActivity.forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.updatedAt)) / 1000 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   CoreSignal: ${hasCoreSignal} (${timeAgo}m ago)`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 10 minutes');
    }

    console.log(`\n🎯 OVERALL PROGRESS: ${coresignalProgress}%`);
    
    if (coresignalProgress >= 90) {
      console.log('🚀 EXCELLENT PROGRESS! 90%+ CoreSignal coverage achieved!');
    } else if (coresignalProgress >= 70) {
      console.log('📈 GOOD PROGRESS! Making steady gains!');
    } else if (coresignalProgress >= 50) {
      console.log('⏳ MAKING PROGRESS! Continuing to chip away...');
    } else {
      console.log('🔄 EARLY STAGES! Building momentum...');
    }

    // Estimate completion
    if (remaining > 0) {
      const estimatedBatches = Math.ceil(remaining / 50);
      console.log(`\n📅 ESTIMATED COMPLETION:`);
      console.log(`   Remaining batches: ~${estimatedBatches}`);
      console.log(`   Estimated time: ~${estimatedBatches * 2} minutes`);
    }

    return { total, withCoreSignal, remaining, progress: coresignalProgress };

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

getPeopleEnrichmentStatus();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getPeopleEnrichmentStatus() {
  try {
    await prisma.$connect();

    const total = await prisma.people.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
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

    const withRawData = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['rawData'],
          not: null
        }
      }
    });

    const recentActivity = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        },
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        updatedAt: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log('🤖 PEOPLE ENRICHMENT STATUS');
    console.log('===========================');
    console.log(`📊 TOTAL PEOPLE: ${total}`);
    console.log(`✅ WITH CORESIGNAL DATA: ${withCoreSignal} (${coresignalProgress}%)`);
    console.log(`🆔 WITH CORESIGNAL ID: ${withCoreSignalId} (${Math.round((withCoreSignalId/total)*100)}%)`);
    console.log(`📋 WITH RAW DATA: ${withRawData} (${Math.round((withRawData/total)*100)}%)`);
    console.log(`⏳ REMAINING: ${remaining} people need CoreSignal data`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT PEOPLE ENRICHMENT ACTIVITY (Last 10 minutes):');
      recentActivity.forEach((person, index) => {
        const hasCoreSignal = person.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(person.updatedAt)) / 1000 / 60);
        console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) at ${person.company?.name || 'Unknown'}`);
        console.log(`   CoreSignal: ${hasCoreSignal} (${timeAgo}m ago)`);
      });
    } else {
      console.log('\n⏸️  No recent people enrichment activity in the last 10 minutes');
    }

    console.log(`\n🎯 OVERALL PROGRESS: ${coresignalProgress}%`);
    
    if (coresignalProgress >= 90) {
      console.log('🚀 EXCELLENT PROGRESS! 90%+ CoreSignal coverage achieved!');
    } else if (coresignalProgress >= 70) {
      console.log('📈 GOOD PROGRESS! Making steady gains!');
    } else if (coresignalProgress >= 50) {
      console.log('⏳ MAKING PROGRESS! Continuing to chip away...');
    } else {
      console.log('🔄 EARLY STAGES! Building momentum...');
    }

    // Estimate completion
    if (remaining > 0) {
      const estimatedBatches = Math.ceil(remaining / 50);
      console.log(`\n📅 ESTIMATED COMPLETION:`);
      console.log(`   Remaining batches: ~${estimatedBatches}`);
      console.log(`   Estimated time: ~${estimatedBatches * 2} minutes`);
    }

    return { total, withCoreSignal, remaining, progress: coresignalProgress };

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

getPeopleEnrichmentStatus();


