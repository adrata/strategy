#!/usr/bin/env node

/**
 * 📊 CHECK PEOPLE COUNT COMPARISON
 * 
 * Shows total people count and buyer group people breakdown
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPeopleCount() {
  try {
    console.log('📊 PEOPLE COUNT ANALYSIS FOR CLOUDCADDIE');
    console.log('==========================================\n');
    
    await prisma.$connect();
    
    // Find CloudCaddie workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'CloudCaddie', mode: 'insensitive' } },
          { slug: { contains: 'cloudcaddie', mode: 'insensitive' } },
          { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ CloudCaddie workspace not found');
      return;
    }
    
    // Find Justin
    const justin = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'justin.johnson@cloudcaddie.com' },
          { username: 'justin' }
        ]
      }
    });
    
    if (!justin) {
      console.log('❌ Justin not found');
      return;
    }
    
    // Total people count
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });
    
    // Buyer group people count
    const buyerGroupPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        isBuyerGroupMember: true,
        deletedAt: null
      }
    });
    
    // Non-buyer group people
    const nonBuyerGroupPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        isBuyerGroupMember: { not: true },
        deletedAt: null
      }
    });
    
    // People created recently (last 24 hours) - likely from buyer group script
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    const recentPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          gte: oneDayAgo
        },
        deletedAt: null
      }
    });
    
    // Buyer group people created recently
    const recentBuyerGroupPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        isBuyerGroupMember: true,
        createdAt: {
          gte: oneDayAgo
        },
        deletedAt: null
      }
    });
    
    // Get oldest people to estimate baseline
    const oldestPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 1
    });
    
    const oldestDate = oldestPeople[0]?.createdAt;
    
    // People created before today (estimated baseline)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const peopleBeforeToday = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        createdAt: {
          lt: today
        },
        deletedAt: null
      }
    });
    
    console.log(`✅ Workspace: ${workspace.name}`);
    console.log(`👤 User: ${justin.name}\n`);
    
    console.log(`📊 CURRENT COUNTS:`);
    console.log(`   Total People: ${totalPeople}`);
    console.log(`   Buyer Group People: ${buyerGroupPeople}`);
    console.log(`   Non-Buyer Group People: ${nonBuyerGroupPeople}\n`);
    
    console.log(`📅 TIMELINE ANALYSIS:`);
    if (oldestDate) {
      console.log(`   Oldest Person Created: ${new Date(oldestDate).toLocaleString()}`);
    }
    console.log(`   People Created Before Today: ${peopleBeforeToday}`);
    console.log(`   People Created in Last 24 Hours: ${recentPeople}`);
    console.log(`   Buyer Group People Created in Last 24 Hours: ${recentBuyerGroupPeople}\n`);
    
    console.log(`📈 ESTIMATED CHANGE:`);
    const estimatedBefore = peopleBeforeToday;
    const estimatedAfter = totalPeople;
    const estimatedAdded = estimatedAfter - estimatedBefore;
    
    console.log(`   Estimated Before (before today): ${estimatedBefore}`);
    console.log(`   Current Total: ${estimatedAfter}`);
    console.log(`   Estimated Added: ${estimatedAdded}`);
    console.log(`   (This includes ${recentBuyerGroupPeople} buyer group people)\n`);
    
    // Breakdown by company
    console.log(`📋 BREAKDOWN BY COMPANY:`);
    const peopleByCompany = await prisma.people.groupBy({
      by: ['companyId'],
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });
    
    const companiesMap = {};
    for (const group of peopleByCompany) {
      if (group.companyId) {
        const company = await prisma.companies.findUnique({
          where: { id: group.companyId },
          select: { name: true }
        });
        companiesMap[group.companyId] = {
          name: company?.name || 'Unknown',
          count: group._count.id
        };
      }
    }
    
    console.log(`   Top companies by people count:`);
    Object.values(companiesMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .forEach((company, idx) => {
        console.log(`   ${idx + 1}. ${company.name}: ${company.count} people`);
      });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleCount();

