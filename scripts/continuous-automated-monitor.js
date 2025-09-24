const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getStatus() {
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

    const recentActivity = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        },
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      select: {
        name: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log(`\n🤖 AUTOMATED PROCESSOR STATUS - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));
    console.log(`📊 PROGRESS: ${withCoreSignal}/${total} (${coresignalProgress}%)`);
    console.log(`⏳ REMAINING: ${remaining} companies`);

    if (recentActivity.length > 0) {
      console.log('🕒 RECENT ACTIVITY:');
      recentActivity.forEach((company, index) => {
        const timeAgo = Math.round((Date.now() - new Date(company.updatedAt)) / 1000 / 60);
        console.log(`   ${index + 1}. ${company.name} (${timeAgo}m ago)`);
      });
    } else {
      console.log('⏸️  No recent activity in last 5 minutes');
    }

    if (coresignalProgress >= 95) {
      console.log('🎉 NEARLY COMPLETE! 95%+ CoreSignal coverage!');
    } else if (coresignalProgress >= 90) {
      console.log('🚀 EXCELLENT! 90%+ CoreSignal coverage achieved!');
    } else if (coresignalProgress >= 80) {
      console.log('📈 GREAT PROGRESS! 80%+ CoreSignal coverage!');
    } else if (coresignalProgress >= 70) {
      console.log('⏳ GOOD PROGRESS! 70%+ CoreSignal coverage!');
    } else {
      console.log('🔄 BUILDING MOMENTUM! Continuing to process...');
    }

    if (remaining > 0) {
      const estimatedBatches = Math.ceil(remaining / 50);
      console.log(`📅 ~${estimatedBatches} batches remaining (~${estimatedBatches * 2} minutes)`);
    }

    return { total, withCoreSignal, remaining, progress: coresignalProgress };

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function continuousMonitor() {
  console.log('🤖 CONTINUOUS AUTOMATED MONITOR');
  console.log('================================');
  console.log('Monitoring automated batch processor every 3 minutes...\n');

  let lastProgress = 0;
  let checkCount = 0;
  const maxChecks = 20; // Monitor for up to 60 minutes

  while (checkCount < maxChecks) {
    const status = await getStatus();
    
    if (status) {
      const progressGained = status.progress - lastProgress;
      if (progressGained > 0) {
        console.log(`📈 GAINED: +${progressGained}% progress since last check!`);
      }
      lastProgress = status.progress;

      if (status.remaining === 0) {
        console.log('\n🎉🎉🎉 ENRICHMENT COMPLETED! 🎉🎉🎉');
        console.log('===================================');
        console.log(`✅ ALL ${status.total} COMPANIES HAVE CORESIGNAL DATA!`);
        console.log(`📊 FINAL COVERAGE: 100%`);
        break;
      }
    }

    checkCount++;
    
    if (checkCount < maxChecks) {
      console.log(`\n⏳ Next check in 3 minutes... (${checkCount}/${maxChecks})`);
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000)); // 3 minutes
    }
  }

  if (checkCount >= maxChecks) {
    console.log('\n⏰ MONITORING COMPLETE');
    console.log('=====================');
    console.log('Reached maximum monitoring time. Check final status manually.');
  }
}

continuousMonitor();

const prisma = new PrismaClient();
const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';

async function getStatus() {
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

    const recentActivity = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        },
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      select: {
        name: true,
        updatedAt: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 3
    });

    const coresignalProgress = Math.round((withCoreSignal / total) * 100);
    const remaining = total - withCoreSignal;

    console.log(`\n🤖 AUTOMATED PROCESSOR STATUS - ${new Date().toLocaleTimeString()}`);
    console.log('='.repeat(60));
    console.log(`📊 PROGRESS: ${withCoreSignal}/${total} (${coresignalProgress}%)`);
    console.log(`⏳ REMAINING: ${remaining} companies`);

    if (recentActivity.length > 0) {
      console.log('🕒 RECENT ACTIVITY:');
      recentActivity.forEach((company, index) => {
        const timeAgo = Math.round((Date.now() - new Date(company.updatedAt)) / 1000 / 60);
        console.log(`   ${index + 1}. ${company.name} (${timeAgo}m ago)`);
      });
    } else {
      console.log('⏸️  No recent activity in last 5 minutes');
    }

    if (coresignalProgress >= 95) {
      console.log('🎉 NEARLY COMPLETE! 95%+ CoreSignal coverage!');
    } else if (coresignalProgress >= 90) {
      console.log('🚀 EXCELLENT! 90%+ CoreSignal coverage achieved!');
    } else if (coresignalProgress >= 80) {
      console.log('📈 GREAT PROGRESS! 80%+ CoreSignal coverage!');
    } else if (coresignalProgress >= 70) {
      console.log('⏳ GOOD PROGRESS! 70%+ CoreSignal coverage!');
    } else {
      console.log('🔄 BUILDING MOMENTUM! Continuing to process...');
    }

    if (remaining > 0) {
      const estimatedBatches = Math.ceil(remaining / 50);
      console.log(`📅 ~${estimatedBatches} batches remaining (~${estimatedBatches * 2} minutes)`);
    }

    return { total, withCoreSignal, remaining, progress: coresignalProgress };

  } catch (error) {
    console.error('❌ Status check error:', error.message);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

async function continuousMonitor() {
  console.log('🤖 CONTINUOUS AUTOMATED MONITOR');
  console.log('================================');
  console.log('Monitoring automated batch processor every 3 minutes...\n');

  let lastProgress = 0;
  let checkCount = 0;
  const maxChecks = 20; // Monitor for up to 60 minutes

  while (checkCount < maxChecks) {
    const status = await getStatus();
    
    if (status) {
      const progressGained = status.progress - lastProgress;
      if (progressGained > 0) {
        console.log(`📈 GAINED: +${progressGained}% progress since last check!`);
      }
      lastProgress = status.progress;

      if (status.remaining === 0) {
        console.log('\n🎉🎉🎉 ENRICHMENT COMPLETED! 🎉🎉🎉');
        console.log('===================================');
        console.log(`✅ ALL ${status.total} COMPANIES HAVE CORESIGNAL DATA!`);
        console.log(`📊 FINAL COVERAGE: 100%`);
        break;
      }
    }

    checkCount++;
    
    if (checkCount < maxChecks) {
      console.log(`\n⏳ Next check in 3 minutes... (${checkCount}/${maxChecks})`);
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000)); // 3 minutes
    }
  }

  if (checkCount >= maxChecks) {
    console.log('\n⏰ MONITORING COMPLETE');
    console.log('=====================');
    console.log('Reached maximum monitoring time. Check final status manually.');
  }
}

continuousMonitor();


