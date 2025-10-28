#!/usr/bin/env node

/**
 * Generate Per-Seller Global Ranks Script
 * 
 * This script assigns proper sequential globalRank values (1-N) to all people
 * per workspace and per seller (mainSellerId) for the speedrun system.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function generatePerSellerRanks() {
  try {
    console.log('🔧 Starting per-seller global ranks generation...');
    
    // Get all users with their workspaces
    const users = await prisma.users.findMany({
      where: {
        activeWorkspaceId: { not: null }
      },
      select: {
        id: true,
        name: true,
        email: true,
        activeWorkspaceId: true
      }
    });
    
    console.log(`📊 Found ${users.length} users with workspaces\n`);
    
    for (const user of users) {
      console.log(`👤 Processing user: ${user.name} (${user.email})`);
      console.log(`   Workspace: ${user.activeWorkspaceId}`);
      
      // Get all people assigned to this user in their workspace
      const people = await prisma.people.findMany({
        where: {
          workspaceId: user.activeWorkspaceId,
          deletedAt: null,
          companyId: { not: null },
          mainSellerId: user.id
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
      
      console.log(`   Found ${people.length} people assigned to this user`);
      
      if (people.length === 0) {
        console.log(`   ⏭️  Skipping - no people assigned\n`);
        continue;
      }
      
      // Update people with sequential globalRank values (1-N for this seller)
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
        console.log(`   ✅ Updated people ${i + 1}-${Math.min(i + batchSize, people.length)} with globalRank`);
      }
      
      // Show top 10 for verification
      const top10 = await prisma.people.findMany({
        where: {
          workspaceId: user.activeWorkspaceId,
          deletedAt: null,
          companyId: { not: null },
          mainSellerId: user.id,
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
      
      console.log(`   🏆 Top 10 people by globalRank for ${user.name}:`);
      top10.forEach(person => {
        console.log(`     Rank ${person.globalRank}: ${person.fullName} (${person.company?.name || 'No Company'})`);
      });
      console.log('');
    }
    
    console.log('✅ Successfully generated per-seller globalRank for all users');
    
  } catch (error) {
    console.error('❌ Error generating per-seller global ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

generatePerSellerRanks();
