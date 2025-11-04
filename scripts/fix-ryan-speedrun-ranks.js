#!/usr/bin/env node

/**
 * Fix Ryan's Speedrun ranks - assign sequential ranks 1-50 to people in Notary Everyday workspace
 * Includes both assigned and unassigned people
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function calculatePriorityScore(person) {
  let score = 1000; // Base score (lower = higher priority)
  
  // Status priority: CUSTOMER > OPPORTUNITY > PROSPECT > LEAD
  const statusPriority = {
    'CUSTOMER': 1,
    'OPPORTUNITY': 2,
    'PROSPECT': 3,
    'LEAD': 4
  };
  score += (statusPriority[person.status] || 5) * 100;
  
  // Buyer group role priority
  if (person.buyerGroupRole) {
    switch (person.buyerGroupRole) {
      case 'champion':
        score -= 500;
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
        score += 100;
        break;
    }
  } else {
    score += 500; // Non-buyer-group members get lower priority
  }
  
  // Influence score (higher = better)
  const influenceScore = person.influenceScore || 0;
  score -= influenceScore * 20;
  
  // Engagement score (higher = better)
  const engagementScore = person.engagementScore || 0;
  score -= engagementScore * 2;
  
  // LinkedIn connections
  const connections = person.linkedinConnections || 0;
  if (connections > 1000) score -= 100;
  else if (connections > 500) score -= 50;
  else if (connections > 200) score -= 25;
  
  // LinkedIn followers
  const followers = person.linkedinFollowers || 0;
  if (followers > 5000) score -= 50;
  else if (followers > 1000) score -= 25;
  else if (followers > 100) score -= 10;
  
  // Data quality
  const dataQuality = person.dataQualityScore || 0;
  score -= dataQuality * 2;
  
  // Job title priority
  const title = (person.jobTitle || '').toLowerCase();
  if (title.includes('ceo') || title.includes('president') || title.includes('owner')) score -= 50;
  else if (title.includes('vp') || title.includes('vice president') || title.includes('director')) score -= 30;
  else if (title.includes('manager') || title.includes('head')) score -= 20;
  else if (title.includes('senior') || title.includes('lead')) score -= 10;
  
  return score;
}

async function fixRyanSpeedrunRanks() {
  try {
    await prisma.$connect();
    
    // Find Ryan
    const ryan = await prisma.users.findFirst({
      where: { email: 'ryan@notaryeveryday.com' },
      select: { id: true, email: true, name: true }
    });
    
    if (!ryan) {
      console.log('❌ Ryan user not found');
      return;
    }

    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: 'notary-everyday' }
        ]
      },
      select: { id: true, name: true }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log('🔧 Fixing Speedrun Ranks for Ryan\n');
    console.log(`User: ${ryan.name} (${ryan.id})`);
    console.log(`Workspace: ${workspace.name} (${workspace.id})\n`);

    // Get all people that should show in Speedrun for Ryan:
    // 1. People assigned to Ryan (mainSellerId = ryan.id)
    // 2. Unassigned people (mainSellerId = null)
    // All must have companyId and should have ranks 1-50
    
    const allSpeedrunPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        companyId: { not: null },
        OR: [
          { mainSellerId: ryan.id },
          { mainSellerId: null }
        ]
      },
      include: {
        company: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { createdAt: 'asc' } // Oldest first for consistent ranking
      ]
    });

    console.log(`📊 Found ${allSpeedrunPeople.length} people to rank\n`);

    if (allSpeedrunPeople.length === 0) {
      console.log('❌ No people found to rank');
      return;
    }

    // Calculate priority scores for all people
    const peopleWithScores = allSpeedrunPeople.map(person => ({
      ...person,
      priorityScore: calculatePriorityScore(person)
    }));

    // Sort by priority score (ascending = highest priority first)
    peopleWithScores.sort((a, b) => a.priorityScore - b.priorityScore);

    // Assign sequential ranks 1-N (only assign ranks 1-50 for Speedrun)
    let updated = 0;
    let errors = 0;
    const maxRank = 50;

    for (let i = 0; i < peopleWithScores.length; i++) {
      const person = peopleWithScores[i];
      const globalRank = i < maxRank ? i + 1 : null; // Only assign ranks 1-50
      
      try {
        await prisma.people.update({
          where: { id: person.id },
          data: { globalRank }
        });
        
        const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
        const company = person.company?.name || 'No company';
        const assignment = person.mainSellerId === ryan.id ? '[ASSIGNED]' : '[UNASSIGNED]';
        
        if (globalRank) {
          console.log(`✅ Rank ${globalRank}: ${name} at ${company} ${assignment}`);
        } else {
          console.log(`   Rank cleared: ${name} at ${company} ${assignment} (beyond top ${maxRank})`);
        }
        updated++;
        
      } catch (error) {
        console.error(`❌ Error updating ${person.firstName} ${person.lastName}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully updated: ${updated} people`);
    console.log(`   - Ranks 1-${Math.min(maxRank, allSpeedrunPeople.length)} assigned`);
    if (allSpeedrunPeople.length > maxRank) {
      console.log(`   - ${allSpeedrunPeople.length - maxRank} people beyond rank ${maxRank} cleared`);
    }
    console.log(`❌ Errors: ${errors} people`);

    // Verify the fix
    console.log(`\n🔍 Verification:`);
    const rankedPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null, gte: 1, lte: 50 },
        OR: [
          { mainSellerId: ryan.id },
          { mainSellerId: null }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        globalRank: true,
        mainSellerId: true
      },
      orderBy: { globalRank: 'asc' },
      take: 20
    });

    console.log(`✅ Found ${rankedPeople.length} people with ranks 1-50`);
    console.log(`\nTop 10 by rank:`);
    rankedPeople.slice(0, 10).forEach((person, i) => {
      const name = `${person.firstName || ''} ${person.lastName || ''}`.trim() || 'No name';
      const assigned = person.mainSellerId === ryan.id ? '[ASSIGNED]' : '[UNASSIGNED]';
      console.log(`  ${i + 1}. Rank ${person.globalRank}: ${name} ${assigned}`);
    });

    // Check for duplicates
    const ranks = rankedPeople.map(p => p.globalRank);
    const uniqueRanks = new Set(ranks);
    if (ranks.length !== uniqueRanks.size) {
      console.log(`\n⚠️  WARNING: Found duplicate ranks!`);
      const rankCounts = {};
      ranks.forEach(rank => {
        rankCounts[rank] = (rankCounts[rank] || 0) + 1;
      });
      Object.entries(rankCounts)
        .filter(([rank, count]) => count > 1)
        .forEach(([rank, count]) => {
          console.log(`   Rank ${rank}: ${count} people`);
        });
    } else {
      console.log(`\n✅ No duplicate ranks found!`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRyanSpeedrunRanks();

