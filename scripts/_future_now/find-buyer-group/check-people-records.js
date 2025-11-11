#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function checkPeopleRecords() {
  const prisma = new PrismaClient();
  
  try {
    // Get buyer groups created today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const recentBuyerGroups = await prisma.buyerGroups.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        createdAt: { gte: today }
      },
      select: {
        id: true,
        companyName: true,
        companyId: true,
        createdAt: true,
        totalMembers: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\n📊 People Records Check\n`);
    console.log('='.repeat(60));
    console.log(`Buyer groups created today: ${recentBuyerGroups.length}\n`);
    
    // Check people records created/updated today
    const recentPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        OR: [
          { createdAt: { gte: today } },
          { updatedAt: { gte: today } }
        ]
      },
      select: {
        id: true,
        fullName: true,
        companyId: true,
        isBuyerGroupMember: true,
        buyerGroupStatus: true,
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 50
    });
    
    const createdToday = recentPeople.filter(p => {
      const created = new Date(p.createdAt);
      return created >= today;
    });
    
    const updatedToday = recentPeople.filter(p => {
      const updated = new Date(p.updatedAt);
      return updated >= today && new Date(p.createdAt) < today;
    });
    
    const buyerGroupMembers = recentPeople.filter(p => p.isBuyerGroupMember === true);
    const taggedIn = recentPeople.filter(p => p.buyerGroupStatus === 'in_buyer_group');
    const taggedOut = recentPeople.filter(p => p.buyerGroupStatus === 'out_of_buyer_group');
    
    console.log(`📈 People Records Statistics:`);
    console.log(`   - Created today: ${createdToday.length}`);
    console.log(`   - Updated today: ${updatedToday.length}`);
    console.log(`   - Total recent activity: ${recentPeople.length}`);
    console.log(`   - Marked as buyer group members: ${buyerGroupMembers.length}`);
    console.log(`   - Tagged "in_buyer_group": ${taggedIn.length}`);
    console.log(`   - Tagged "out_of_buyer_group": ${taggedOut.length}`);
    
    // Check buyer group members records - get buyer group IDs first
    const buyerGroupIds = recentBuyerGroups.map(bg => bg.id).filter(Boolean);
    const buyerGroupMemberRecords = buyerGroupIds.length > 0 ? await prisma.buyerGroupMembers.findMany({
      where: {
        buyerGroupId: { in: buyerGroupIds }
      },
      select: {
        id: true,
        name: true,
        buyerGroupId: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    }) : [];
    
    console.log(`\n📋 BuyerGroupMembers Records:`);
    console.log(`   - Created for today's buyer groups: ${buyerGroupMemberRecords.length}`);
    
    if (recentBuyerGroups.length > 0) {
      console.log(`\n📊 Sample Buyer Groups:`);
      recentBuyerGroups.slice(0, 10).forEach((bg, i) => {
        console.log(`   ${i + 1}. ${bg.companyName || 'Unknown'}`);
        console.log(`      - Total members: ${bg.totalMembers || 0}`);
        console.log(`      - CompanyId: ${bg.companyId || 'NULL'}`);
        console.log(`      - Created: ${bg.createdAt.toISOString()}`);
      });
    }
    
    if (recentPeople.length > 0) {
      console.log(`\n👥 Sample People Records:`);
      recentPeople.slice(0, 10).forEach((p, i) => {
        const isNew = new Date(p.createdAt) >= today;
        const status = p.buyerGroupStatus || 'not tagged';
        console.log(`   ${i + 1}. ${p.fullName || 'Unknown'}`);
        console.log(`      - Company: ${p.company?.name || 'Unknown'}`);
        console.log(`      - Status: ${isNew ? 'CREATED' : 'UPDATED'} today`);
        console.log(`      - Buyer group status: ${status}`);
        console.log(`      - Is member: ${p.isBuyerGroupMember ? 'Yes' : 'No'}`);
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

checkPeopleRecords();

