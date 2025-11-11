#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkProgress() {
  const prisma = new PrismaClient();
  
  try {
    // Total companies to process
    const totalCompanies = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      }
    });
    
    // Companies with buyer groups (match the script's logic exactly)
    const buyerGroupsWithCompanyId = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        companyId: { not: null }
      },
      select: {
        companyId: true
      }
    });
    
    const uniqueCompaniesWithBuyerGroups = new Set(
      buyerGroupsWithCompanyId.map(bg => bg.companyId).filter(Boolean)
    );
    
    const companiesWithBuyerGroups = Array.from(uniqueCompaniesWithBuyerGroups).map(id => ({ companyId: id }));
    
    // Recent buyer groups (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentBuyerGroupsRaw = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        createdAt: { gte: oneDayAgo }
      },
      select: {
        id: true,
        companyId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    // Get company names for recent buyer groups
    const recentBuyerGroups = await Promise.all(
      recentBuyerGroupsRaw
        .filter(bg => bg.companyId) // Filter out null companyIds
        .map(async (bg) => {
          const company = await prisma.companies.findUnique({
            where: { id: bg.companyId },
            select: { name: true }
          });
          return {
            ...bg,
            companyName: company?.name || 'Unknown'
          };
        })
    );
    
    console.log('\n📊 Top-Temp Buyer Group Discovery Progress\n');
    console.log('='.repeat(60));
    console.log(`Total companies to process: ${totalCompanies}`);
    console.log(`Companies with buyer groups: ${companiesWithBuyerGroups.length}`);
    console.log(`Remaining: ${totalCompanies - companiesWithBuyerGroups.length}`);
    console.log(`Progress: ${((companiesWithBuyerGroups.length / totalCompanies) * 100).toFixed(1)}%`);
    
    if (recentBuyerGroups.length > 0) {
      console.log(`\n✅ Recent activity (last 24 hours): ${recentBuyerGroups.length} buyer groups created`);
      console.log('\nMost recent companies processed:');
      recentBuyerGroups.forEach((bg, i) => {
        const timeAgo = Math.round((Date.now() - bg.createdAt.getTime()) / 1000 / 60);
        const hoursAgo = Math.floor(timeAgo / 60);
        const minsAgo = timeAgo % 60;
        const timeStr = hoursAgo > 0 ? `${hoursAgo}h ${minsAgo}m ago` : `${minsAgo}m ago`;
        console.log(`  ${i + 1}. ${bg.companyName} - ${timeStr}`);
      });
    } else {
      console.log('\n⚠️  No recent activity in the last 24 hours');
    }
    
    // Check all buyer groups (not just recent)
    const allBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID
      },
      select: {
        companyId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const uniqueCompaniesProcessed = new Set(allBuyerGroups.map(bg => bg.companyId).filter(Boolean));
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   - Total buyer groups ever created: ${allBuyerGroups.length}`);
    console.log(`   - Unique companies with buyer groups: ${uniqueCompaniesProcessed.size}`);
    console.log(`   - Still need processing: ${totalCompanies - uniqueCompaniesProcessed.size}`);
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error checking progress:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkProgress();

