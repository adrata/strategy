const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSpeedrunStatus() {
  try {
    console.log('🔍 Checking Speedrun status for Dan in Adrata workspace...\n');
    
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
    
    // Count total people in adrata workspace
    const totalPeople = await prisma.people.count({
      where: { workspaceId }
    });
    
    console.log(`📊 Total people in Adrata workspace: ${totalPeople}\n`);
    
    // Count people assigned to Dan
    const dansPeople = await prisma.people.count({
      where: { 
        workspaceId,
        assignedToId: dan.id
      }
    });
    
    console.log(`👤 People assigned to Dan: ${dansPeople}\n`);
    
    // Check people with globalRank
    const peopleWithRank = await prisma.people.findMany({
      where: { 
        workspaceId,
        globalRank: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        assignedToId: true
      },
      orderBy: { globalRank: 'asc' }
    });
    
    console.log(`📊 People with globalRank set: ${peopleWithRank.length}`);
    if (peopleWithRank.length > 0) {
      console.log('\nPeople with ranks:');
      peopleWithRank.forEach(p => {
        console.log(`  ${p.globalRank}. ${p.fullName} ${p.assignedToId === dan.id ? '(Dan)' : ''}`);
      });
    }
    
    // Check buyer group members
    const buyerGroupMembers = await prisma.people.count({
      where: {
        workspaceId,
        isBuyerGroupMember: true
      }
    });
    
    console.log(`\n🎯 Buyer group members: ${buyerGroupMembers}\n`);
    
    // Get summary of buyer groups
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { members: true }
        },
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log(`📋 Buyer groups created: ${buyerGroups.length}\n`);
    buyerGroups.forEach(bg => {
      console.log(`  • ${bg.company.name}: ${bg._count.members} members`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSpeedrunStatus();

