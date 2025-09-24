const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function monitorEnrichmentProgress() {
  try {
    console.log('🔍 ENRICHMENT PROGRESS MONITOR');
    console.log('==============================');
    console.log(`⏰ Check time: ${new Date().toLocaleString()}`);

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get total companies
    const total = await prisma.companies.count({
      where: { workspaceId: workspaceId }
    });

    // Get companies with CoreSignal data
    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Get companies with customFields (any enrichment)
    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null }
      }
    });

    // Get companies without any enrichment
    const withoutEnrichment = total - withCustomFields;

    // Get recent enrichment activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivity = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null },
        updatedAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    // Get the most recently enriched companies
    const recentCompanies = await prisma.companies.findMany({
      where: { 
        workspaceId: workspaceId,
        customFields: { not: null }
      },
      select: { 
        name: true, 
        customFields: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log(`\n📊 CURRENT STATUS:`);
    console.log(`   Total companies: ${total}`);
    console.log(`   ✅ With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/total)*100)}%)`);
    console.log(`   📋 With customFields: ${withCustomFields} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`   ❌ Without enrichment: ${withoutEnrichment} (${Math.round((withoutEnrichment/total)*100)}%)`);
    console.log(`   🔄 Recent activity (5min): ${recentActivity} companies`);

    const coreSignalProgress = Math.round((withCoreSignal/total)*100);
    const overallProgress = Math.round((withCustomFields/total)*100);
    const remaining = total - withCoreSignal;

    console.log(`\n🎯 PROGRESS SUMMARY:`);
    console.log(`   CoreSignal coverage: ${coreSignalProgress}%`);
    console.log(`   Overall enrichment: ${overallProgress}%`);
    console.log(`   Remaining for CoreSignal: ${remaining} companies`);

    // Progress indicators
    if (coreSignalProgress >= 90) {
      console.log(`   🎉 NEARLY COMPLETE! (${coreSignalProgress}%)`);
    } else if (coreSignalProgress >= 75) {
      console.log(`   🚀 EXCELLENT PROGRESS! (${coreSignalProgress}%)`);
    } else if (coreSignalProgress >= 50) {
      console.log(`   📈 GOOD PROGRESS! (${coreSignalProgress}%)`);
    } else {
      console.log(`   ⏳ STILL PROCESSING... (${coreSignalProgress}%)`);
    }

    console.log(`\n🕒 RECENT ENRICHMENT ACTIVITY:`);
    recentCompanies.forEach((company, i) => {
      const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
      const lastEnriched = company.customFields?.lastEnrichedAt || 'Unknown';
      const timeAgo = company.updatedAt ? 
        Math.round((Date.now() - new Date(company.updatedAt).getTime()) / 1000 / 60) + 'min ago' : 
        'Unknown';
      console.log(`   ${i+1}. ${company.name}`);
      console.log(`      CoreSignal: ${hasCoreSignal} | Last enriched: ${lastEnriched} | Updated: ${timeAgo}`);
    });

    // Activity status
    if (recentActivity > 0) {
      console.log(`\n🔄 ACTIVE ENRICHMENT: ${recentActivity} companies enriched in last 5 minutes`);
    } else {
      console.log(`\n⏸️  NO RECENT ACTIVITY: No companies enriched in last 5 minutes`);
    }

    // Estimate completion
    if (recentActivity > 0 && remaining > 0) {
      const estimatedMinutes = Math.ceil(remaining / (recentActivity / 5));
      console.log(`\n⏱️  ESTIMATED COMPLETION: ~${estimatedMinutes} minutes at current rate`);
    }

    console.log(`\n${'='.repeat(50)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the monitor
monitorEnrichmentProgress();

const prisma = new PrismaClient();

async function monitorEnrichmentProgress() {
  try {
    console.log('🔍 ENRICHMENT PROGRESS MONITOR');
    console.log('==============================');
    console.log(`⏰ Check time: ${new Date().toLocaleString()}`);

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get total companies
    const total = await prisma.companies.count({
      where: { workspaceId: workspaceId }
    });

    // Get companies with CoreSignal data
    const withCoreSignal = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Get companies with customFields (any enrichment)
    const withCustomFields = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null }
      }
    });

    // Get companies without any enrichment
    const withoutEnrichment = total - withCustomFields;

    // Get recent enrichment activity (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentActivity = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: { not: null },
        updatedAt: {
          gte: fiveMinutesAgo
        }
      }
    });

    // Get the most recently enriched companies
    const recentCompanies = await prisma.companies.findMany({
      where: { 
        workspaceId: workspaceId,
        customFields: { not: null }
      },
      select: { 
        name: true, 
        customFields: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    });

    console.log(`\n📊 CURRENT STATUS:`);
    console.log(`   Total companies: ${total}`);
    console.log(`   ✅ With CoreSignal data: ${withCoreSignal} (${Math.round((withCoreSignal/total)*100)}%)`);
    console.log(`   📋 With customFields: ${withCustomFields} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`   ❌ Without enrichment: ${withoutEnrichment} (${Math.round((withoutEnrichment/total)*100)}%)`);
    console.log(`   🔄 Recent activity (5min): ${recentActivity} companies`);

    const coreSignalProgress = Math.round((withCoreSignal/total)*100);
    const overallProgress = Math.round((withCustomFields/total)*100);
    const remaining = total - withCoreSignal;

    console.log(`\n🎯 PROGRESS SUMMARY:`);
    console.log(`   CoreSignal coverage: ${coreSignalProgress}%`);
    console.log(`   Overall enrichment: ${overallProgress}%`);
    console.log(`   Remaining for CoreSignal: ${remaining} companies`);

    // Progress indicators
    if (coreSignalProgress >= 90) {
      console.log(`   🎉 NEARLY COMPLETE! (${coreSignalProgress}%)`);
    } else if (coreSignalProgress >= 75) {
      console.log(`   🚀 EXCELLENT PROGRESS! (${coreSignalProgress}%)`);
    } else if (coreSignalProgress >= 50) {
      console.log(`   📈 GOOD PROGRESS! (${coreSignalProgress}%)`);
    } else {
      console.log(`   ⏳ STILL PROCESSING... (${coreSignalProgress}%)`);
    }

    console.log(`\n🕒 RECENT ENRICHMENT ACTIVITY:`);
    recentCompanies.forEach((company, i) => {
      const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
      const lastEnriched = company.customFields?.lastEnrichedAt || 'Unknown';
      const timeAgo = company.updatedAt ? 
        Math.round((Date.now() - new Date(company.updatedAt).getTime()) / 1000 / 60) + 'min ago' : 
        'Unknown';
      console.log(`   ${i+1}. ${company.name}`);
      console.log(`      CoreSignal: ${hasCoreSignal} | Last enriched: ${lastEnriched} | Updated: ${timeAgo}`);
    });

    // Activity status
    if (recentActivity > 0) {
      console.log(`\n🔄 ACTIVE ENRICHMENT: ${recentActivity} companies enriched in last 5 minutes`);
    } else {
      console.log(`\n⏸️  NO RECENT ACTIVITY: No companies enriched in last 5 minutes`);
    }

    // Estimate completion
    if (recentActivity > 0 && remaining > 0) {
      const estimatedMinutes = Math.ceil(remaining / (recentActivity / 5));
      console.log(`\n⏱️  ESTIMATED COMPLETION: ~${estimatedMinutes} minutes at current rate`);
    }

    console.log(`\n${'='.repeat(50)}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the monitor
monitorEnrichmentProgress();


