const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function detailedStatusCheck() {
  try {
    console.log('🔍 DETAILED ENRICHMENT STATUS CHECK');
    console.log('====================================');

    // Get total companies
    const totalCompanies = await prisma.companies.count({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' }
    });

    // Get companies with any enrichment
    const enrichedCompanies = await prisma.companies.count({
      where: { 
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: { not: null }
      }
    });

    // Get companies with CoreSignal data
    const coresignalCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    // Get companies with LinkedIn URL
    const linkedinCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        linkedinUrl: { not: null }
      }
    });

    // Get companies with descriptions
    const descriptionCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        description: { not: null }
      }
    });

    // Get companies with employee count
    const employeeCountCompanies = await prisma.companies.count({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        employeeCount: { not: null }
      }
    });

    console.log(`📊 TOTAL COMPANIES: ${totalCompanies}`);
    console.log(`📋 ENRICHED (customFields): ${enrichedCompanies}`);
    console.log(`🔗 CORESIGNAL DATA: ${coresignalCompanies}`);
    console.log(`🔗 LINKEDIN URL: ${linkedinCompanies}`);
    console.log(`📝 DESCRIPTIONS: ${descriptionCompanies}`);
    console.log(`👥 EMPLOYEE COUNT: ${employeeCountCompanies}`);
    console.log(`📈 PROGRESS: ${Math.round((enrichedCompanies/totalCompanies)*100)}%`);

    // Check a few sample companies
    const samples = await prisma.companies.findMany({
      where: { workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP' },
      select: {
        name: true,
        linkedinUrl: true,
        description: true,
        employeeCount: true,
        customFields: true
      },
      take: 5
    });

    console.log('\n📋 SAMPLE COMPANIES:');
    samples.forEach((company, i) => {
      console.log(`${i+1}. ${company.name}`);
      console.log(`   LinkedIn: ${company.linkedinUrl ? '✅' : '❌'}`);
      console.log(`   Description: ${company.description ? '✅' : '❌'}`);
      console.log(`   Employee Count: ${company.employeeCount ? '✅' : '❌'}`);
      console.log(`   Custom Fields: ${company.customFields ? '✅' : '❌'}`);
      if (company.customFields) {
        console.log(`   CoreSignal: ${company.customFields.coresignalData ? '✅' : '❌'}`);
        console.log(`   Strategic: ${company.customFields.strategicData ? '✅' : '❌'}`);
      }
    });

    if (enrichedCompanies < totalCompanies) {
      console.log(`\n🚀 READY FOR NEXT BATCH: ${totalCompanies - enrichedCompanies} companies remaining`);
    } else {
      console.log(`\n🎉 ALL COMPANIES ENRICHED!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

detailedStatusCheck();
