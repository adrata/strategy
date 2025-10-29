const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpeedrunFilters() {
  try {
    console.log('🔍 Checking Speedrun filter conditions...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V';
    
    // Find Dan's user ID
    const dan = await prisma.users.findFirst({
      where: { 
        email: { contains: 'dan', mode: 'insensitive' }
      }
    });
    
    if (!dan) {
      console.log('❌ Dan user not found');
      return;
    }
    
    console.log(`✅ Found Dan: ${dan.firstName} ${dan.lastName} (${dan.email})`);
    console.log(`   User ID: ${dan.id}\n`);
    
    // Check all people conditions
    const allPeople = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null
      }
    });
    
    console.log(`📊 Total people in workspace: ${allPeople}\n`);
    
    // Check people with companyId
    const peopleWithCompany = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null }
      }
    });
    
    console.log(`🏢 People with companyId: ${peopleWithCompany}\n`);
    
    // Check people with globalRank 1-50
    const peopleWithRank1to50 = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 }
      }
    });
    
    console.log(`📊 People with globalRank 1-50: ${peopleWithRank1to50}\n`);
    
    // Check people assigned to Dan
    const peopleAssignedToDan = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        mainSellerId: dan.id
      }
    });
    
    console.log(`👤 People assigned to Dan: ${peopleAssignedToDan}\n`);
    
    // Show people assigned to Dan
    const dansPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        mainSellerId: dan.id
      },
      select: {
        fullName: true,
        globalRank: true,
        buyerGroupRole: true,
        mainSellerId: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { globalRank: 'asc' }
    });
    
    console.log(`🎯 Dan's Speedrun people (${dansPeople.length}):`);
    dansPeople.forEach(person => {
      console.log(`  ${person.globalRank}. ${person.fullName} (${person.buyerGroupRole}) - ${person.company?.name}`);
    });
    
    // Check people without mainSellerId
    const peopleWithoutSeller = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        mainSellerId: null
      }
    });
    
    console.log(`\n❓ People without mainSellerId: ${peopleWithoutSeller}\n`);
    
    // Check people with different mainSellerId
    const peopleWithOtherSeller = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        mainSellerId: { not: null, not: dan.id }
      },
      select: {
        fullName: true,
        globalRank: true,
        buyerGroupRole: true,
        mainSellerId: true,
        company: {
          select: { name: true }
        }
      },
      take: 10
    });
    
    console.log(`👥 People assigned to other sellers (${peopleWithOtherSeller.length}):`);
    peopleWithOtherSeller.forEach(person => {
      console.log(`  ${person.globalRank}. ${person.fullName} (${person.buyerGroupRole}) - Seller: ${person.mainSellerId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedrunFilters();

