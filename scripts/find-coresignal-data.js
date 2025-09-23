const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function findCoreSignalData() {
  try {
    console.log('🔍 FINDING CORESIGNAL DATA');
    console.log('==========================');

    // Get all companies and check their customFields structure
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 10
    });

    console.log(`📊 Checking ${companies.length} companies for CoreSignal data`);

    let coresignalCount = 0;
    let perplexityCount = 0;

    companies.forEach((company, i) => {
      if (company.customFields) {
        console.log(`\n${i + 1}. ${company.name}:`);
        
        if (company.customFields.coresignalData) {
          console.log('   ✅ Has CoreSignal data');
          coresignalCount++;
        } else if (company.customFields.ceo || company.customFields.founded) {
          console.log('   ✅ Has Perplexity data');
          perplexityCount++;
        } else {
          console.log('   ❌ No enrichment data');
        }
      } else {
        console.log(`\n${i + 1}. ${company.name}: ❌ No custom fields`);
      }
    });

    console.log(`\n📊 SUMMARY:`);
    console.log(`CoreSignal data: ${coresignalCount}`);
    console.log(`Perplexity data: ${perplexityCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findCoreSignalData();
