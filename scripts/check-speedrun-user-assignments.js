#!/usr/bin/env node

/**
 * Check Speedrun User Assignments Script
 * 
 * This script checks which users have people assigned to them in the speedrun system
 * and what their globalRank values look like.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function checkUserAssignments() {
  try {
    console.log('🔍 Checking Speedrun User Assignments\n');

    // Get all users
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        activeWorkspaceId: true
      }
    });

    console.log(`📊 Found ${users.length} users in the database\n`);

    for (const user of users) {
      // Count people assigned to this user
      const peopleCount = await prisma.people.count({
        where: {
          workspaceId: user.workspaceId,
          deletedAt: null,
          companyId: { not: null },
          mainSellerId: user.id
        }
      });

      // Get sample of people with their ranks
      const samplePeople = await prisma.people.findMany({
        where: {
          workspaceId: user.workspaceId,
          deletedAt: null,
          companyId: { not: null },
          mainSellerId: user.id,
          globalRank: { not: null }
        },
        orderBy: { globalRank: 'asc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          globalRank: true,
          company: {
            select: { name: true }
          }
        }
      });

      console.log(`👤 User: ${user.name} (${user.email})`);
      console.log(`   Workspace: ${user.activeWorkspaceId}`);
      console.log(`   People assigned: ${peopleCount}`);
      
      if (samplePeople.length > 0) {
        console.log(`   Sample ranks: ${samplePeople.map(p => p.globalRank).join(', ')}`);
        console.log(`   Top 3:`);
        samplePeople.slice(0, 3).forEach(p => {
          console.log(`     Rank ${p.globalRank}: ${p.fullName} (${p.company?.name})`);
        });
      } else {
        console.log(`   No ranked people found`);
      }
      console.log('');
    }

    // Check for people with high ranks (like 19235-19246)
    console.log('🔍 Checking for people with high globalRank values...\n');
    
    const highRankPeople = await prisma.people.findMany({
      where: {
        deletedAt: null,
        companyId: { not: null },
        globalRank: { gte: 10000 } // Look for ranks >= 10000
      },
      orderBy: { globalRank: 'asc' },
      take: 20,
      select: {
        id: true,
        fullName: true,
        globalRank: true,
        mainSellerId: true,
        workspaceId: true,
        company: {
          select: { name: true }
        }
      }
    });

    if (highRankPeople.length > 0) {
      console.log(`⚠️  Found ${highRankPeople.length} people with high globalRank values:`);
      highRankPeople.forEach(p => {
        console.log(`   Rank ${p.globalRank}: ${p.fullName} (${p.company?.name}) - User: ${p.mainSellerId} - Workspace: ${p.workspaceId}`);
      });
    } else {
      console.log('✅ No people with high globalRank values found');
    }

  } catch (error) {
    console.error('❌ Error checking user assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAssignments();
