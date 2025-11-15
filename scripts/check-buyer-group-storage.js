#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBuyerGroupStorage() {
  try {
    const workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    console.log('Checking buyer group data storage...\n');
    
    const total = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      }
    });
    
    const withBuyerGroupRole = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        buyerGroupRole: { not: null }
      }
    });
    
    const withIsMember = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        isBuyerGroupMember: true
      }
    });
    
    const withCoresignal = await prisma.people.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        coresignalData: { not: null }
      }
    });
    
    // Check for tags
    const withTags = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        tags: { has: 'in_buyer_group' }
      },
      take: 5
    });
    
    // Check for customFields
    const samplePeople = await prisma.people.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        buyerGroupRole: true,
        isBuyerGroupMember: true,
        tags: true,
        customFields: true,
        coresignalData: true
      }
    });
    
    console.log('📊 COUNTS:');
    console.log(`   Total people: ${total}`);
    console.log(`   With buyerGroupRole: ${withBuyerGroupRole}`);
    console.log(`   With isBuyerGroupMember: true: ${withIsMember}`);
    console.log(`   With coresignalData: ${withCoresignal}`);
    console.log(`   With 'in_buyer_group' tag: ${withTags.length} (showing first 5)`);
    console.log('');
    
    console.log('📋 SAMPLE PEOPLE (first 10):');
    for (const person of samplePeople) {
      console.log(`\n   ${person.fullName || 'Unknown'}:`);
      console.log(`      buyerGroupRole: ${person.buyerGroupRole || 'null'}`);
      console.log(`      isBuyerGroupMember: ${person.isBuyerGroupMember || 'null'}`);
      console.log(`      tags: ${person.tags?.join(', ') || 'none'}`);
      console.log(`      has customFields: ${person.customFields ? 'yes' : 'no'}`);
      console.log(`      has coresignalData: ${person.coresignalData ? 'yes' : 'no'}`);
      
      if (person.customFields) {
        const cf = typeof person.customFields === 'object' ? person.customFields : JSON.parse(person.customFields || '{}');
        if (cf.buyerGroupInfo || cf.buyerGroupRole) {
          console.log(`      customFields.buyerGroupInfo: ${JSON.stringify(cf.buyerGroupInfo || cf.buyerGroupRole)}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBuyerGroupStorage();

