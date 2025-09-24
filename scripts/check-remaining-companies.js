const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRemainingCompanies() {
  try {
    console.log('🔍 CHECKING REMAINING COMPANIES TO ENRICH');
    console.log('=========================================');

    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';

    // Get companies that still need enrichment
    const remainingCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { customFields: null },
          { customFields: {} }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        customFields: true
      },
      take: 10
    });

    console.log(`📊 Companies still needing enrichment: ${remainingCompanies.length}`);
    
    if (remainingCompanies.length > 0) {
      console.log('\n📋 Sample remaining companies:');
      remainingCompanies.forEach((company, i) => {
        console.log(`${i+1}. ${company.name} (${company.website || 'No website'})`);
      });
    } else {
      console.log('\n🎉 All companies appear to be enriched!');
    }

    // Also check companies with CoreSignal data
    const coresignalCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspaceId,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    console.log(`\n📊 CoreSignal data count: ${coresignalCompanies}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRemainingCompanies();
