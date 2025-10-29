const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpeedrunCounts() {
  try {
    console.log('🔍 Checking Speedrun counts...');
    
    // Check people with ranks 1-50
    const peopleWithRanks = await prisma.people.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    // Check companies with ranks 1-50
    const companiesWithRanks = await prisma.companies.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    // Check people with ranks 1-50 who haven't been actioned today (like counts API)
    const peopleNotActionedToday = await prisma.people.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 },
        OR: [
          { lastActionDate: null },
          { 
            lastActionDate: {
              lt: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        ]
      }
    });
    
    // Check companies with ranks 1-50 and 0 people
    const companiesWithRanksNoPeople = await prisma.companies.count({
      where: {
        workspaceId: '01K7464TNANHQXPCZT1FYX205V',
        globalRank: { not: null, gte: 1, lte: 50 },
        people: { none: {} }
      }
    });
    
    console.log(`📊 People with ranks 1-50: ${peopleWithRanks}`);
    console.log(`📊 Companies with ranks 1-50: ${companiesWithRanks}`);
    console.log(`📊 People with ranks 1-50 (not actioned today): ${peopleNotActionedToday}`);
    console.log(`📊 Companies with ranks 1-50 (no people): ${companiesWithRanksNoPeople}`);
    console.log(`📊 Total Speedrun count (like counts API): ${peopleNotActionedToday + companiesWithRanksNoPeople}`);
    
  } catch (error) {
    console.error('❌ Error checking counts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedrunCounts();

