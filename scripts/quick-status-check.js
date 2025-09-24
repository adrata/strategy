const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickStatusCheck() {
  try {
    console.log('📊 QUICK STATUS CHECK');
    console.log('====================');

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

    // Get recent enrichment activity
    const recent = await prisma.companies.findMany({
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
      take: 3
    });

    console.log(`📊 TOTAL COMPANIES: ${total}`);
    console.log(`✅ WITH CORESIGNAL DATA: ${withCoreSignal} (${Math.round((withCoreSignal/total)*100)}%)`);
    console.log(`📋 WITH CUSTOMFIELDS: ${withCustomFields} (${Math.round((withCustomFields/total)*100)}%)`);
    console.log(`⏳ REMAINING: ${total - withCoreSignal} companies need CoreSignal data`);

    console.log(`\n🕒 RECENT ENRICHMENT ACTIVITY:`);
    recent.forEach((company, i) => {
      const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
      const lastEnriched = company.customFields?.lastEnrichedAt || 'Unknown';
      console.log(`${i+1}. ${company.name} - CoreSignal: ${hasCoreSignal} (${lastEnriched})`);
    });

    const progress = Math.round((withCoreSignal/total)*100);
    console.log(`\n🎯 OVERALL PROGRESS: ${progress}%`);
    
    if (progress >= 90) {
      console.log('🎉 NEARLY COMPLETE!');
    } else if (progress >= 50) {
      console.log('🚀 MAKING GOOD PROGRESS!');
    } else {
      console.log('⏳ STILL PROCESSING...');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickStatusCheck();
