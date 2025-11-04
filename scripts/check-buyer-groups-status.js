#!/usr/bin/env node

/**
 * 📊 CHECK BUYER GROUPS STATUS
 * 
 * Checks how many companies have buyer groups generated
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBuyerGroupsStatus() {
  try {
    console.log('📊 CHECKING BUYER GROUPS STATUS');
    console.log('================================\n');
    
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
    
    // Get all companies
    const allCompanies = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        mainSellerId: justin.id,
        deletedAt: null
      }
    });
    
    // Get companies with buyer groups
    const companiesWithBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        id: true,
        companyName: true,
        totalMembers: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Get people marked as buyer group members
    const buyerGroupPeople = await prisma.people.count({
      where: {
        workspaceId: workspace.id,
        isBuyerGroupMember: true
      }
    });
    
    console.log(`✅ Workspace: ${workspace.name}`);
    console.log(`👤 User: ${justin.name}\n`);
    
    console.log(`📊 STATISTICS:`);
    console.log(`   Total Companies: ${allCompanies}`);
    console.log(`   Companies with Buyer Groups: ${companiesWithBuyerGroups.length}`);
    console.log(`   Companies Needing Buyer Groups: ${allCompanies - companiesWithBuyerGroups.length}`);
    console.log(`   Total Buyer Group People: ${buyerGroupPeople}\n`);
    
    if (companiesWithBuyerGroups.length > 0) {
      console.log(`📋 Recent Buyer Groups:`);
      companiesWithBuyerGroups.slice(0, 10).forEach((bg, idx) => {
        console.log(`   ${idx + 1}. ${bg.companyName} - ${bg.totalMembers} members (${new Date(bg.createdAt).toLocaleDateString()})`);
      });
      if (companiesWithBuyerGroups.length > 10) {
        console.log(`   ... and ${companiesWithBuyerGroups.length - 10} more`);
      }
    }
    
    // Check config
    const config = workspace.customFields?.buyerGroupConfig;
    if (config) {
      console.log(`\n✅ CloudCaddie Configuration Saved:`);
      console.log(`   Product: ${config.productName}`);
      console.log(`   Deal Size: $${config.dealSizeRange?.toLocaleString() || 'N/A'}`);
      console.log(`   USA Only: ${config.usaOnly ? 'Yes' : 'No'}`);
    } else {
      console.log(`\n⚠️  No buyer group configuration found in workspace`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyerGroupsStatus();

