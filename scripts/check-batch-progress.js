const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBatchProgress() {
  try {
    console.log('🔍 CHECKING BATCH PROGRESS');
    console.log('==========================');

    // Get total companies
    const total = await prisma.companies.count({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' }
    });

    // Get enriched companies
    const enriched = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: { not: null }
      }
    });

    // Get companies with CoreSignal data
    const coresignal = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Get recent enriched companies
    const recent = await prisma.companies.findMany({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: { not: null }
      },
      select: { 
        name: true, 
        customFields: true,
        updatedAt: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    console.log('📊 BATCH PROGRESS:');
    console.log('================');
    console.log(`Total companies: ${total}`);
    console.log(`Enriched companies: ${enriched}`);
    console.log(`CoreSignal data: ${coresignal}`);
    console.log(`Remaining: ${total - enriched}`);
    console.log(`Progress: ${Math.round((enriched/total)*100)}%`);
    
    // Calculate batches run
    const batchesRun = Math.ceil(enriched / 50);
    console.log(`\n🔄 BATCHES RUN: ${batchesRun}`);
    
    console.log('\n📋 RECENT COMPANIES:');
    recent.forEach((company, i) => {
      const hasCoreSignal = company.customFields?.coresignalData ? '✅' : '❌';
      const hasStrategic = company.customFields?.strategicData ? '✅' : '❌';
      const source = company.customFields?.enrichmentSource || 'Unknown';
      console.log(`${i+1}. ${company.name}`);
      console.log(`   CoreSignal: ${hasCoreSignal} | Strategic: ${hasStrategic} | Source: ${source}`);
    });

    if (enriched < total) {
      const remainingBatches = Math.ceil((total - enriched) / 50);
      console.log(`\n🚀 STATUS: Still processing...`);
      console.log(`⏳ ${remainingBatches} batches remaining (${total - enriched} companies)`);
    } else {
      console.log(`\n🎉 COMPLETE: All companies enriched!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBatchProgress();
