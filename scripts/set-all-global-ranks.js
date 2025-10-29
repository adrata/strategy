const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate global rank for any person
 * @param {object} person - Person record
 * @returns {number} Global rank (lower = higher priority)
 */
function calculateGlobalRank(person) {
  let rank = 1000; // Base rank
  
  // Role priority: Champion → Introducer → Decision → Stakeholder → Blocker
  if (person.buyerGroupRole) {
    switch (person.buyerGroupRole) {
      case 'champion':
        rank -= 500; // Highest priority
        break;
      case 'introducer':
        rank -= 400;
        break;
      case 'decision':
        rank -= 300;
        break;
      case 'stakeholder':
        rank -= 200;
        break;
      case 'blocker':
        rank += 100; // Lowest priority
        break;
    }
  } else {
    // Non-buyer-group members get lower priority
    rank += 500;
  }
  
  // Influence score (higher influence = lower rank)
  const influenceScore = person.influenceScore || 0;
  rank -= influenceScore * 20;
  
  // Engagement score (higher engagement = lower rank)
  const engagementScore = person.engagementScore || 0;
  rank -= engagementScore * 2;
  
  // LinkedIn connections (more connections = lower rank)
  const connections = person.linkedinConnections || 0;
  if (connections > 1000) rank -= 100;
  else if (connections > 500) rank -= 50;
  else if (connections > 200) rank -= 25;
  
  // LinkedIn followers (more followers = lower rank)
  const followers = person.linkedinFollowers || 0;
  if (followers > 5000) rank -= 50;
  else if (followers > 1000) rank -= 25;
  else if (followers > 100) rank -= 10;
  
  // Data quality (better data = lower rank)
  const dataQuality = person.dataQualityScore || 0;
  rank -= dataQuality * 2;
  
  // Ensure rank is positive
  return Math.max(1, Math.round(rank));
}

async function setAllGlobalRanks() {
  try {
    console.log('🔄 Setting global ranks for ALL people in Adrata workspace...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // adrata workspace
    
    // Get ALL people in the workspace
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null // Exclude soft-deleted
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log(`📊 Found ${allPeople.length} total people to rank\n`);
    
    let updated = 0;
    let errors = 0;
    
    for (const person of allPeople) {
      try {
        const globalRank = calculateGlobalRank(person);
        
        await prisma.people.update({
          where: { id: person.id },
          data: { globalRank }
        });
        
        const roleInfo = person.buyerGroupRole ? ` (${person.buyerGroupRole})` : ' (no role)';
        console.log(`✅ Rank ${globalRank}: ${person.fullName}${roleInfo} - ${person.company?.name || 'No company'}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating ${person.fullName}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${updated} people`);
    console.log(`❌ Errors: ${errors} people`);
    
    // Show top 20 by rank
    const topPeople = await prisma.people.findMany({
      where: {
        workspaceId,
        globalRank: { not: null }
      },
      select: {
        fullName: true,
        globalRank: true,
        buyerGroupRole: true,
        company: {
          select: { name: true }
        }
      },
      orderBy: { globalRank: 'asc' },
      take: 20
    });
    
    console.log(`\n🏆 Top 20 in Speedrun:`);
    topPeople.forEach((person, index) => {
      const roleInfo = person.buyerGroupRole || 'no role';
      console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.fullName} (${roleInfo}) - ${person.company?.name || 'No company'}`);
    });
    
    // Count by buyer group status
    const buyerGroupCount = await prisma.people.count({
      where: {
        workspaceId,
        isBuyerGroupMember: true,
        deletedAt: null
      }
    });
    
    const nonBuyerGroupCount = await prisma.people.count({
      where: {
        workspaceId,
        isBuyerGroupMember: { not: true },
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Distribution:`);
    console.log(`  🎯 Buyer group members: ${buyerGroupCount}`);
    console.log(`  📋 Non-buyer-group members: ${nonBuyerGroupCount}`);
    console.log(`  📈 Total: ${buyerGroupCount + nonBuyerGroupCount}`);
    
  } catch (error) {
    console.error('❌ Error setting global ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setAllGlobalRanks();

