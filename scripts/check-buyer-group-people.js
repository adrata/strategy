#!/usr/bin/env node

/**
 * 🔍 CHECK BUYER GROUP PEOPLE DETAILS
 * 
 * See what buyer group people exist and which companies they're from
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBuyerGroupPeople() {
  try {
    await prisma.$connect();
    
    const workspace = await prisma.workspaces.findFirst({
      where: { id: '01K7DSWP8ZBA75K5VSWVXPEMAH' }
    });
    
    // Get buyer group people with their companies
    const buyerGroupPeople = await prisma.people.findMany({
      where: {
        workspaceId: workspace.id,
        isBuyerGroupMember: true
      },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        company: {
          select: {
            name: true
          }
        },
        buyerGroupRole: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    console.log(`📊 Found ${buyerGroupPeople.length} buyer group people:\n`);
    
    // Group by company
    const byCompany = {};
    buyerGroupPeople.forEach(person => {
      const companyName = person.company?.name || 'Unknown';
      if (!byCompany[companyName]) {
        byCompany[companyName] = [];
      }
      byCompany[companyName].push(person);
    });
    
    console.log(`📋 Grouped by Company:\n`);
    Object.entries(byCompany).forEach(([company, people]) => {
      console.log(`   ${company}: ${people.length} members`);
      people.slice(0, 3).forEach(p => {
        console.log(`      - ${p.fullName} (${p.jobTitle || 'N/A'}) - ${p.buyerGroupRole || 'N/A'}`);
      });
      if (people.length > 3) {
        console.log(`      ... and ${people.length - 3} more`);
      }
      console.log('');
    });
    
    // Check if there are any BuyerGroups records
    const buyerGroups = await prisma.buyerGroups.findMany({
      where: { workspaceId: workspace.id },
      select: {
        id: true,
        companyName: true,
        totalMembers: true,
        createdAt: true
      }
    });
    
    console.log(`\n📋 BuyerGroups Records: ${buyerGroups.length}`);
    buyerGroups.forEach(bg => {
      console.log(`   - ${bg.companyName}: ${bg.totalMembers} members (${new Date(bg.createdAt).toLocaleString()})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyerGroupPeople();

