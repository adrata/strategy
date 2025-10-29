const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Calculate global rank for Speedrun prioritization
 * @param {object} person - Person record
 * @returns {number} Global rank (lower = higher priority)
 */
function calculateGlobalRank(person) {
  let rank = 1000; // Base rank
  
  // Role priority: Champion → Introducer → Decision → Stakeholder → Blocker
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

async function updateGlobalRanks() {
  try {
    console.log('🔄 Updating global ranks for all buyer group members...\n');
    
    const workspaceId = '01K7464TNANHQXPCZT1FYX205V'; // adrata workspace
    
    // Get all buyer group members
    const buyerGroupMembers = await prisma.people.findMany({
      where: {
        workspaceId,
        isBuyerGroupMember: true
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log(`📊 Found ${buyerGroupMembers.length} buyer group members to update\n`);
    
    let updated = 0;
    let errors = 0;
    
    for (const person of buyerGroupMembers) {
      try {
        const globalRank = calculateGlobalRank(person);
        
        await prisma.people.update({
          where: { id: person.id },
          data: { globalRank }
        });
        
        console.log(`✅ Updated ${person.fullName} (${person.company?.name}) - Rank: ${globalRank}, Role: ${person.buyerGroupRole}`);
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating ${person.fullName}:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${updated} people`);
    console.log(`❌ Errors: ${errors} people`);
    
    // Verify the update
    const peopleWithRanks = await prisma.people.count({
      where: {
        workspaceId,
        globalRank: { not: null }
      }
    });
    
    console.log(`\n🎯 Total people with globalRank: ${peopleWithRanks}`);
    
    // Show top 10 by rank
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
      take: 10
    });
    
    console.log(`\n🏆 Top 10 by rank:`);
    topPeople.forEach((person, index) => {
      console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.fullName} (${person.buyerGroupRole}) - ${person.company?.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error updating global ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateGlobalRanks();
