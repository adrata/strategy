const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkProgress() {
  try {
    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    const total = await prisma.companies.count({
      where: { workspaceId: workspaceId }
    });

    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null }
      }
    });

    const recentActivity = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });

    const coreSignalProgress = Math.round((withCoreSignal/total)*100);
    const remaining = total - withCoreSignal;

    console.log(`\n🔍 [${new Date().toLocaleTimeString()}] PROGRESS CHECK:`);
    console.log(`   CoreSignal: ${withCoreSignal}/${total} (${coreSignalProgress}%)`);
    console.log(`   Overall: ${withCustomFields}/${total} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`   Recent activity: ${recentActivity} companies (5min)`);
    console.log(`   Remaining: ${remaining} companies`);

    if (coreSignalProgress >= 90) {
      console.log(`   🎉 NEARLY COMPLETE! (${coreSignalProgress}%)`);
      return true; // Stop monitoring
    } else if (recentActivity > 0) {
      const estimatedMinutes = Math.ceil(remaining / (recentActivity / 5));
      console.log(`   ⏱️  Estimated completion: ~${estimatedMinutes} minutes`);
    } else {
      console.log(`   ⏸️  No recent activity - script may have stopped`);
    }

    return false; // Continue monitoring

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function continuousMonitor() {
  console.log('🔄 STARTING CONTINUOUS MONITORING');
  console.log('==================================');
  console.log('Checking progress every 3 minutes...\n');

  let checkCount = 0;
  const maxChecks = 20; // Monitor for up to 60 minutes

  while (checkCount < maxChecks) {
    checkCount++;
    console.log(`\n📊 CHECK #${checkCount}/${maxChecks}`);
    
    const shouldStop = await checkProgress();
    
    if (shouldStop) {
      console.log('\n🎉 MONITORING COMPLETE - Target reached!');
      break;
    }

    if (checkCount < maxChecks) {
      console.log('\n⏳ Waiting 3 minutes for next check...');
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
    }
  }

  if (checkCount >= maxChecks) {
    console.log('\n⏰ MONITORING TIMEOUT - 60 minutes reached');
  }

  await prisma.$disconnect();
}

continuousMonitor();

const prisma = new PrismaClient();

async function checkProgress() {
  try {
    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    const total = await prisma.companies.count({
      where: { workspaceId: workspaceId }
    });

    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null }
      }
    });

    const recentActivity = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null },
        updatedAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });

    const coreSignalProgress = Math.round((withCoreSignal/total)*100);
    const remaining = total - withCoreSignal;

    console.log(`\n🔍 [${new Date().toLocaleTimeString()}] PROGRESS CHECK:`);
    console.log(`   CoreSignal: ${withCoreSignal}/${total} (${coreSignalProgress}%)`);
    console.log(`   Overall: ${withCustomFields}/${total} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`   Recent activity: ${recentActivity} companies (5min)`);
    console.log(`   Remaining: ${remaining} companies`);

    if (coreSignalProgress >= 90) {
      console.log(`   🎉 NEARLY COMPLETE! (${coreSignalProgress}%)`);
      return true; // Stop monitoring
    } else if (recentActivity > 0) {
      const estimatedMinutes = Math.ceil(remaining / (recentActivity / 5));
      console.log(`   ⏱️  Estimated completion: ~${estimatedMinutes} minutes`);
    } else {
      console.log(`   ⏸️  No recent activity - script may have stopped`);
    }

    return false; // Continue monitoring

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function continuousMonitor() {
  console.log('🔄 STARTING CONTINUOUS MONITORING');
  console.log('==================================');
  console.log('Checking progress every 3 minutes...\n');

  let checkCount = 0;
  const maxChecks = 20; // Monitor for up to 60 minutes

  while (checkCount < maxChecks) {
    checkCount++;
    console.log(`\n📊 CHECK #${checkCount}/${maxChecks}`);
    
    const shouldStop = await checkProgress();
    
    if (shouldStop) {
      console.log('\n🎉 MONITORING COMPLETE - Target reached!');
      break;
    }

    if (checkCount < maxChecks) {
      console.log('\n⏳ Waiting 3 minutes for next check...');
      await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));
    }
  }

  if (checkCount >= maxChecks) {
    console.log('\n⏰ MONITORING TIMEOUT - 60 minutes reached');
  }

  await prisma.$disconnect();
}

continuousMonitor();


