#!/usr/bin/env node

/**
 * Generate Global Ranks Script
 * 
 * This script assigns proper sequential globalRank values (1-N) to all people
 * in the database for the speedrun system.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generateGlobalRanks() {
  try {
    console.log('🔧 Starting global ranks generation for people...');
    
    // Get all people with companies, ordered by creation date
    const people = await prisma.people.findMany({
      where: {
        deletedAt: null,
        companyId: { not: null } // Only people with companies
      },
      orderBy: [
        { createdAt: 'asc' } // Oldest first for consistent ranking
      ],
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${people.length} people to rank`);
    
    if (people.length === 0) {
      console.log('❌ No people found to rank');
      return;
    }
    
    // Update people with sequential globalRank values
    const batchSize = 100;
    for (let i = 0; i < people.length; i += batchSize) {
      const batch = people.slice(i, i + batchSize);
      const updatePromises = batch.map((person, batchIndex) => {
        const newRank = i + batchIndex + 1;
        return prisma.people.update({
          where: { id: person.id },
          data: { globalRank: newRank }
        });
      });
      
      await Promise.all(updatePromises);
      console.log(`✅ Updated people ${i + 1}-${Math.min(i + batchSize, people.length)} with globalRank`);
    }
    
    console.log(`✅ Successfully generated globalRank for ${people.length} people`);
    
    // Show top 10 for verification
    const top10 = await prisma.people.findMany({
      where: {
        deletedAt: null,
        companyId: { not: null },
        globalRank: { not: null }
      },
      orderBy: { globalRank: 'asc' },
      take: 10,
      select: {
        globalRank: true,
        fullName: true,
        company: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n🏆 Top 10 people by globalRank:');
    top10.forEach(person => {
      console.log(`  ${person.globalRank}. ${person.fullName} (${person.company?.name || 'No Company'})`);
    });
    
  } catch (error) {
    console.error('❌ Error generating global ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generateGlobalRanks();
