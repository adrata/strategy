#!/usr/bin/env node

/**
 * 🔍 CHECK SCRIPT STATUS
 * 
 * Checks if buyer group generation script is still running
 * by looking at recent database activity
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkScriptStatus() {
  try {
    console.log('🔍 CHECKING BUYER GROUP SCRIPT STATUS');
    console.log('=====================================\n');
    
    await prisma.$connect();
    
    const workspace = await prisma.workspaces.findFirst({
      where: { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
    });
    
    // Check for people created in last hour
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          gte: oneHourAgo
        },
        deletedAt: null
      },
      select: {
        id: true,
        fullName: true,
        company: {
          select: {
            name: true
          }
        },
        createdAt: true,
        isBuyerGroupMember: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Check for people created in last 5 minutes (very recent activity)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const veryRecentPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          gte: fiveMinutesAgo
        },
        deletedAt: null
      }
    });
    
    // Get all companies and check which ones have buyer group people
    const allCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        mainSellerId: '01K7DSY21KRQYWDNFTCA29NZKK', // Justin's ID
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            people: {
              where: {
                isBuyerGroupMember: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    const companiesWithBuyerGroups = allCompanies.filter(c => c._count.people > 0);
    const companiesWithoutBuyerGroups = allCompanies.filter(c => c._count.people === 0);
    
    console.log(`📊 RECENT ACTIVITY (Last Hour):`);
    console.log(`   People created: ${recentPeople.length}`);
    if (recentPeople.length > 0) {
      console.log(`   Most recent: ${recentPeople[0].fullName} at ${new Date(recentPeople[0].createdAt).toLocaleTimeString()}`);
      console.log(`   Company: ${recentPeople[0].company?.name || 'Unknown'}`);
    }
    
    console.log(`\n⏱️  VERY RECENT ACTIVITY (Last 5 Minutes):`);
    console.log(`   People created: ${veryRecentPeople}`);
    if (veryRecentPeople > 0) {
      console.log(`   ✅ Script appears to be ACTIVE`);
    } else {
      console.log(`   ⏸️  No recent activity - script may be paused or completed`);
    }
    
    console.log(`\n📋 COMPANY STATUS:`);
    console.log(`   Companies with buyer groups: ${companiesWithBuyerGroups.length}/${allCompanies.length}`);
    console.log(`   Companies without buyer groups: ${companiesWithoutBuyerGroups.length}/${allCompanies.length}`);
    
    if (companiesWithoutBuyerGroups.length > 0) {
      console.log(`\n   Companies still needing buyer groups:`);
      companiesWithoutBuyerGroups.slice(0, 10).forEach((c, idx) => {
        console.log(`   ${idx + 1}. ${c.name}`);
      });
      if (companiesWithoutBuyerGroups.length > 10) {
        console.log(`   ... and ${companiesWithoutBuyerGroups.length - 10} more`);
      }
    }
    
    // Estimate completion
    if (companiesWithoutBuyerGroups.length > 0) {
      const avgTimePerCompany = 10 * 60; // 10 minutes per company (conservative estimate)
      const remainingTime = (companiesWithoutBuyerGroups.length * avgTimePerCompany) / 60;
      console.log(`\n⏳ ESTIMATED TIME REMAINING:`);
      console.log(`   ${companiesWithoutBuyerGroups.length} companies remaining`);
      console.log(`   Estimated: ${Math.round(remainingTime)} minutes (${Math.round(remainingTime / 60)} hours)`);
    } else {
      console.log(`\n✅ All companies have buyer groups!`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkScriptStatus();

