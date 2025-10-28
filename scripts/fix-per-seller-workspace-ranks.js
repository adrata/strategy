#!/usr/bin/env node

/**
 * Fix Per-Seller, Per-Workspace Global Ranks Script
 * 
 * This script assigns proper sequential globalRank values (1-N) to all people
 * per workspace AND per seller (mainSellerId) for the speedrun system.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPerSellerWorkspaceRanks() {
  try {
    console.log('🔧 Starting per-seller, per-workspace global ranks fix...');
    
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
          createdAt: true,
          company: {
            select: { name: true }
          }
        }
      });
      
      console.log(`   Found ${people.length} people assigned to this user`);
      
      if (people.length === 0) {
        console.log(`   ⏭️  Skipping - no people assigned\n`);
        continue;
      }
      
      // Update people with sequential globalRank values (1-N for this seller in this workspace)
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
    
    console.log('✅ Successfully fixed per-seller, per-workspace globalRank for all users');
    
    // Now trigger the re-ranking system for each user
    console.log('\n🔄 Triggering re-ranking system for each user...');
    
    for (const user of users) {
      if (user.activeWorkspaceId) {
        try {
          console.log(`🔄 Triggering re-rank for ${user.name}...`);
          
          const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/v1/speedrun/re-rank`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-workspace-id': user.activeWorkspaceId,
              'x-user-id': user.id
            },
            body: JSON.stringify({
              completedCount: 0,
              trigger: 'per_seller_workspace_fix',
              timestamp: new Date().toISOString()
            })
          });
          
          if (response.ok) {
            console.log(`   ✅ Re-ranking triggered successfully for ${user.name}`);
          } else {
            console.log(`   ⚠️  Re-ranking failed for ${user.name}: ${response.status}`);
          }
        } catch (error) {
          console.log(`   ❌ Error triggering re-rank for ${user.name}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error fixing per-seller, per-workspace global ranks:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPerSellerWorkspaceRanks();
