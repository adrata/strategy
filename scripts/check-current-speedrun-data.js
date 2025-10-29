const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentSpeedrunData() {
  try {
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    const danMirolliId = '01K7B327HWN9G6KGWA97S1TK43';
    
    console.log('🔍 Checking current Speedrun data...\n');
    
    // Check people with ranks
    const peopleWithRanks = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null, gte: 1 },
        mainSellerId: danMirolliId
      },
      select: {
        fullName: true,
        globalRank: true,
        companyId: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 10
    });
    
    console.log(`👥 People with ranks: ${peopleWithRanks.length}`);
    console.log('First 10 people:');
    peopleWithRanks.forEach(p => {
      console.log(`  Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
    });
    
    // Check companies with ranks
    const companiesWithRanks = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null, gte: 1 },
        mainSellerId: danMirolliId
      },
      select: {
        name: true,
        globalRank: true
      },
      orderBy: { globalRank: 'asc' },
      take: 10
    });
    
    console.log(`\n🏢 Companies with ranks: ${companiesWithRanks.length}`);
    console.log('First 10 companies:');
    companiesWithRanks.forEach(c => {
      console.log(`  Rank ${c.globalRank}: ${c.name}`);
    });
    
    // Check total counts
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        mainSellerId: danMirolliId
      }
    });
    
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId,
        deletedAt: null,
        mainSellerId: danMirolliId
      }
    });
    
    console.log(`\n📊 Total counts:`);
    console.log(`  People: ${totalPeople}`);
    console.log(`  Companies: ${totalCompanies}`);
    console.log(`  Total: ${totalPeople + totalCompanies}`);
    
    // Check rank distribution
    const allRanks = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null },
        mainSellerId: danMirolliId
      },
      select: { globalRank: true },
      orderBy: { globalRank: 'asc' }
    });
    
    const companyRanks = await prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null },
        mainSellerId: danMirolliId
      },
      select: { globalRank: true },
      orderBy: { globalRank: 'asc' }
    });
    
    console.log(`\n🎯 Rank distribution:`);
    console.log(`  People ranks: ${allRanks.map(p => p.globalRank).join(', ')}`);
    console.log(`  Company ranks: ${companyRanks.map(c => c.globalRank).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentSpeedrunData();

