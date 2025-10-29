const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignAllToDan() {
  try {
    console.log('🔄 Assigning all people and companies to Dan...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // adrata workspace
    
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
    
    // 1. Assign all people to Dan
    console.log('👥 Assigning all people to Dan...');
    const peopleUpdate = await prisma.people.updateMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      data: {
        mainSellerId: dan.id
      }
    });
    
    console.log(`✅ Updated ${peopleUpdate.count} people\n`);
    
    // 2. Assign all companies to Dan
    console.log('🏢 Assigning all companies to Dan...');
    const companiesUpdate = await prisma.companies.updateMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      data: {
        mainSellerId: dan.id
      }
    });
    
    console.log(`✅ Updated ${companiesUpdate.count} companies\n`);
    
    // 3. Verify Speedrun conditions
    console.log('📊 Verifying Speedrun conditions...\n');
    
    const speedrunPeople = await prisma.people.findMany({
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
        companyId: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { globalRank: 'asc' }
    });
    
    console.log(`🎯 Speedrun people (ranks 1-50): ${speedrunPeople.length}\n`);
    
    // Show first 10
    console.log('Top 10:');
    speedrunPeople.slice(0, 10).forEach(person => {
      console.log(`  ${person.globalRank}. ${person.fullName} (${person.buyerGroupRole}) - ${person.company?.name}`);
    });
    
    console.log('\n...\n');
    
    // Show last 10
    console.log('Last 10:');
    speedrunPeople.slice(-10).forEach(person => {
      console.log(`  ${person.globalRank}. ${person.fullName} (${person.buyerGroupRole}) - ${person.company?.name}`);
    });
    
    // Check for people without companyId
    const peopleWithoutCompany = await prisma.people.count({
      where: {
        workspaceId,
        deletedAt: null,
        globalRank: { not: null, gte: 1, lte: 50 },
        companyId: null
      }
    });
    
    if (peopleWithoutCompany > 0) {
      console.log(`\n⚠️ WARNING: ${peopleWithoutCompany} people with ranks 1-50 have no companyId`);
      
      const peopleWithoutCompanyDetails = await prisma.people.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          globalRank: { not: null, gte: 1, lte: 50 },
          companyId: null
        },
        select: {
          fullName: true,
          globalRank: true,
          buyerGroupRole: true
        },
        orderBy: { globalRank: 'asc' }
      });
      
      console.log('\nPeople without companyId:');
      peopleWithoutCompanyDetails.forEach(person => {
        console.log(`  ${person.globalRank}. ${person.fullName} (${person.buyerGroupRole})`);
      });
    }
    
    console.log(`\n✅ Assignment complete!`);
    console.log(`📊 Speedrun should now show ${Math.min(speedrunPeople.length, 50)} people (capped at 50)`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignAllToDan();

