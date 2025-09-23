const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickStatus() {
  try {
    const total = await prisma.companies.count({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' }
    });

    const enriched = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: { not: null }
      }
    });

    const coresignal = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    console.log('📊 CURRENT STATUS:');
    console.log('================');
    console.log(`Total companies: ${total}`);
    console.log(`Enriched companies: ${enriched}`);
    console.log(`CoreSignal data: ${coresignal}`);
    console.log(`Remaining: ${total - enriched}`);
    console.log(`Progress: ${Math.round((enriched/total)*100)}%`);

    if (enriched < total) {
      console.log(`\n🚀 STATUS: Still processing...`);
      console.log(`⏳ ${total - enriched} companies remaining to be enriched`);
    } else {
      console.log(`\n🎉 COMPLETE: All companies enriched!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickStatus();
