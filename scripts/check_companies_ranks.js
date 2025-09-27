const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCompaniesRanks() {
  try {
    console.log('🔍 Checking companies ranks in database...');
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP', // Dan's workspace
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        rank: true,
        updatedAt: true
      },
      orderBy: [
        { rank: 'asc' },
        { updatedAt: 'desc' }
      ]
    });
    
    console.log(`📊 Total companies: ${companies.length}`);
    
    // Check for missing ranks
    const companiesWithoutRank = companies.filter(c => !c.rank);
    console.log(`❌ Companies without rank: ${companiesWithoutRank.length}`);
    if (companiesWithoutRank.length > 0) {
      console.log('Companies without rank:', companiesWithoutRank.slice(0, 5).map(c => ({ name: c.name, id: c.id })));
    }
    
    // Check for duplicate ranks
    const rankCounts = {};
    companies.forEach(c => {
      if (c.rank) {
        rankCounts[c.rank] = (rankCounts[c.rank] || 0) + 1;
      }
    });
    
    const duplicateRanks = Object.entries(rankCounts).filter(([rank, count]) => count > 1);
    console.log(`🔄 Duplicate ranks: ${duplicateRanks.length}`);
    if (duplicateRanks.length > 0) {
      console.log('Duplicate ranks:', duplicateRanks.slice(0, 10));
    }
    
    // Show rank distribution
    const ranks = companies.map(c => c.rank).filter(r => r).sort((a, b) => a - b);
    console.log(`📈 Rank range: ${Math.min(...ranks)} to ${Math.max(...ranks)}`);
    console.log(`📈 First 10 ranks:`, ranks.slice(0, 10));
    console.log(`📈 Last 10 ranks:`, ranks.slice(-10));
    
    // Check for rank gaps
    const expectedRanks = Array.from({ length: ranks.length }, (_, i) => i + 1);
    const actualRanks = [...new Set(ranks)].sort((a, b) => a - b);
    const missingRanks = expectedRanks.filter(r => !actualRanks.includes(r));
    const extraRanks = actualRanks.filter(r => r > ranks.length);
    
    console.log(`🔍 Missing ranks: ${missingRanks.length}`, missingRanks.slice(0, 10));
    console.log(`🔍 Extra ranks (>${ranks.length}): ${extraRanks.length}`, extraRanks.slice(0, 10));
    
    // Show companies with ranks 1-30 to see the pattern
    const first30 = companies.filter(c => c.rank && c.rank <= 30).sort((a, b) => a.rank - b.rank);
    console.log(`🏢 First 30 companies by rank:`);
    first30.forEach(c => {
      console.log(`  ${c.rank}: ${c.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking companies ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCompaniesRanks();
