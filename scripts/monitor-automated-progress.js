const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getDetailedStatus() {
  try {
    await prisma.$connect();

    const total = await prisma.companies.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          not: null
        }
      }
    });

    const recentActivity = await prisma.companies.findMany({
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
        name: true,
        updatedAt: true,
        customFields: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log('🤖 AUTOMATED BATCH PROCESSOR STATUS');
    console.log('==================================');
    console.log(`📊 TOTAL COMPANIES: ${total}`);
    console.log(`✅ WITH CORESIGNAL DATA: ${withCoreSignal} (${coresignalProgress}%)`);
    console.log(`📋 WITH CUSTOMFIELDS: ${withCustomFields} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`⏳ REMAINING: ${remaining} companies need CoreSignal data`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT ENRICHMENT ACTIVITY (Last 10 minutes):');
      recentActivity.forEach((company, index) => {
        const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(company.updatedAt)) / 1000 / 60);
        console.log(`${index + 1}. ${company.name} - CoreSignal: ${hasCoreSignal} (${timeAgo}m ago)`);
      });
    } else {
      console.log('\n⏸️  No recent activity in the last 10 minutes');
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

  } catch (error) {
    console.error('❌ Status check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getDetailedStatus();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getDetailedStatus() {
  try {
    await prisma.$connect();

    const total = await prisma.companies.count({
      where: { workspaceId: TOP_WORKSPACE_ID }
    });

    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          not: null
        }
      }
    });

    const recentActivity = await prisma.companies.findMany({
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
        name: true,
        updatedAt: true,
        customFields: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log('🤖 AUTOMATED BATCH PROCESSOR STATUS');
    console.log('==================================');
    console.log(`📊 TOTAL COMPANIES: ${total}`);
    console.log(`✅ WITH CORESIGNAL DATA: ${withCoreSignal} (${coresignalProgress}%)`);
    console.log(`📋 WITH CUSTOMFIELDS: ${withCustomFields} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`⏳ REMAINING: ${remaining} companies need CoreSignal data`);

    if (recentActivity.length > 0) {
      console.log('\n🕒 RECENT ENRICHMENT ACTIVITY (Last 10 minutes):');
      recentActivity.forEach((company, index) => {
        const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
        const timeAgo = Math.round((Date.now() - new Date(company.updatedAt)) / 1000 / 60);
        console.log(`${index + 1}. ${company.name} - CoreSignal: ${hasCoreSignal} (${timeAgo}m ago)`);
      });
    } else {
      console.log('\n⏸️  No recent activity in the last 10 minutes');
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

  } catch (error) {
    console.error('❌ Status check error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

getDetailedStatus();


