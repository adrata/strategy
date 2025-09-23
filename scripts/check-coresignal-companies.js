const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCoreSignalCompanies() {
  try {
    console.log('🔍 CHECKING FOR CORESIGNAL DATA');
    console.log('===============================');

    // Check for companies with CoreSignal data
    const coresignalCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      },
      select: {
        name: true,
        customFields: true
      }
    });

    console.log(`📊 Companies with CoreSignal data: ${coresignalCompanies.length}`);

    if (coresignalCompanies.length > 0) {
      coresignalCompanies.forEach((company, i) => {
        console.log(`${i + 1}. ${company.name}`);
      });
    } else {
      console.log('❌ No companies found with CoreSignal data');
    }

    // Check total companies that need enrichment
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP'
      }
    });

    const enrichedCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          not: null
        }
      }
    });

    console.log(`\n📊 ENRICHMENT STATUS:`);
    console.log(`Total companies: ${totalCompanies}`);
    console.log(`Enriched companies: ${enrichedCompanies}`);
    console.log(`Remaining: ${totalCompanies - enrichedCompanies}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoreSignalCompanies();
