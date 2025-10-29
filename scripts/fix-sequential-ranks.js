const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate priority score for ranking (lower = higher priority)
 * @param {object} person - Person record
 * @returns {number} Priority score
 */
function calculatePriorityScore(person) {
  let score = 1000; // Base score
  
  // Role priority: Champion → Introducer → Decision → Stakeholder → Blocker
  if (person.buyerGroupRole) {
    switch (person.buyerGroupRole) {
      case 'champion':
        score -= 500; // Highest priority
        break;
      case 'introducer':
        score -= 400;
        break;
      case 'decision':
        score -= 300;
        break;
      case 'stakeholder':
        score -= 200;
        break;
      case 'blocker':
        score += 100; // Lowest priority
        break;
    }
  } else {
    // Non-buyer-group members get lower priority
    score += 500;
  }
  
  // Influence score (higher influence = lower score)
  const influenceScore = person.influenceScore || 0;
  score -= influenceScore * 20;
  
  // Engagement score (higher engagement = lower score)
  const engagementScore = person.engagementScore || 0;
  score -= engagementScore * 2;
  
  // LinkedIn connections (more connections = lower score)
  const connections = person.linkedinConnections || 0;
  if (connections > 1000) score -= 100;
  else if (connections > 500) score -= 50;
  else if (connections > 200) score -= 25;
  
  // LinkedIn followers (more followers = lower score)
  const followers = person.linkedinFollowers || 0;
  if (followers > 5000) score -= 50;
  else if (followers > 1000) score -= 25;
  else if (followers > 100) score -= 10;
  
  // Data quality (better data = lower score)
  const dataQuality = person.dataQualityScore || 0;
  score -= dataQuality * 2;
  
  return score;
}

async function fixSequentialRanks() {
  try {
    console.log('🔄 Fixing global ranks to be sequential 1-N...\n');
    
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
    
    // Calculate priority scores for all people
    const peopleWithScores = allPeople.map(person => ({
      ...person,
      priorityScore: calculatePriorityScore(person)
    }));
    
    // Sort by priority score (ascending = highest priority first)
    peopleWithScores.sort((a, b) => a.priorityScore - b.priorityScore);
    
    // Assign sequential ranks 1-N
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < peopleWithScores.length; i++) {
      const person = peopleWithScores[i];
      const globalRank = i + 1; // Sequential rank starting from 1
      
      try {
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
    
    console.log(`\n🏆 Top 20 in Speedrun (Sequential Ranks 1-20):`);
    topPeople.forEach((person, index) => {
      const roleInfo = person.buyerGroupRole || 'no role';
      console.log(`  ${person.globalRank}. ${person.fullName} (${roleInfo}) - ${person.company?.name || 'No company'}`);
    });
    
    // Show bottom 10
    const bottomPeople = await prisma.people.findMany({
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
      orderBy: { globalRank: 'desc' },
      take: 10
    });
    
    console.log(`\n📉 Bottom 10 in Speedrun:`);
    bottomPeople.reverse().forEach((person, index) => {
      const roleInfo = person.buyerGroupRole || 'no role';
      console.log(`  ${person.globalRank}. ${person.fullName} (${roleInfo}) - ${person.company?.name || 'No company'}`);
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
    console.log(`  🏆 Rank range: 1-${updated}`);
    
  } catch (error) {
    console.error('❌ Error fixing sequential ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSequentialRanks();

