#!/usr/bin/env node

/**
 * Set global ranks for Noel's people to populate Speedrun
 * Uses the same ranking algorithm as set-all-global-ranks.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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
  
  // Phone number bonus (having phone = higher priority)
  if (person.phone || person.mobilePhone || person.workPhone) {
    rank -= 50;
  }
  
  // Email bonus (having email = higher priority)
  if (person.email || person.workEmail) {
    rank -= 30;
  }
  
  // LinkedIn URL bonus (having LinkedIn = higher priority)
  if (person.linkedinUrl) {
    rank -= 20;
  }
  
  // Ensure rank is positive
  return Math.max(1, Math.round(rank));
}

async function setNoelGlobalRanks() {
  try {
    console.log('\n' + '═'.repeat(70));
    console.log('   SETTING GLOBAL RANKS FOR NOEL\'S PEOPLE');
    console.log('═'.repeat(70) + '\n');
    
    // Find Noel
    const noel = await prisma.users.findFirst({
      where: { email: 'noel@notaryeveryday.com' }
    });

    if (!noel) {
      throw new Error('Noel (noel@notaryeveryday.com) not found');
    }

    console.log(`✅ Found Noel: ${noel.name} (${noel.id})\n`);

    // Find workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      throw new Error('Notary Everyday workspace not found');
    }

    console.log(`✅ Found Workspace: ${workspace.name} (${workspace.id})\n`);
    
    // Get ALL people for Noel
    const allPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        deletedAt: null
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
        const hasPhone = person.phone || person.mobilePhone || person.workPhone ? '📞' : '';
        const hasEmail = person.email || person.workEmail ? '📧' : '';
        const hasLinkedIn = person.linkedinUrl ? '🔗' : '';
        
        if (updated < 20 || globalRank <= 100) {
          console.log(`✅ Rank ${globalRank}: ${person.fullName}${roleInfo} ${hasPhone}${hasEmail}${hasLinkedIn} - ${person.company?.name || 'No company'}`);
        }
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
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        globalRank: { not: null },
        deletedAt: null
      },
      select: {
        fullName: true,
        globalRank: true,
        buyerGroupRole: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        email: true,
        workEmail: true,
        linkedinUrl: true,
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
      const hasPhone = person.phone || person.mobilePhone || person.workPhone ? '📞' : '';
      const hasEmail = person.email || person.workEmail ? '📧' : '';
      const hasLinkedIn = person.linkedinUrl ? '🔗' : '';
      console.log(`  ${index + 1}. Rank ${person.globalRank}: ${person.fullName} (${roleInfo}) ${hasPhone}${hasEmail}${hasLinkedIn} - ${person.company?.name || 'No company'}`);
    });
    
    // Count by buyer group status
    const buyerGroupCount = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        buyerGroupRole: { not: null },
        deletedAt: null
      }
    });
    
    const withRank = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: noel.id,
        globalRank: { not: null },
        deletedAt: null
      }
    });
    
    console.log(`\n📊 Distribution:`);
    console.log(`  🎯 Buyer group members: ${buyerGroupCount}`);
    console.log(`  📈 People with global rank: ${withRank}`);
    console.log(`  📋 Total people: ${allPeople.length}`);
    
  } catch (error) {
    console.error('\n❌ Error setting global ranks:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setNoelGlobalRanks().catch(console.error);
