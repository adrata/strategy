#!/usr/bin/env node

/**
 * Check the remaining people who don't have CoreSignal IDs
 */

const { PrismaClient } = require('@prisma/client');

async function checkRemainingPeople() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING REMAINING PEOPLE WITHOUT CORESIGNAL IDs');
    console.log('====================================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get people without coresignalId
    const peopleWithoutCoreSignalId = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          equals: null
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        tags: true,
        customFields: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });
    
    console.log(`📊 PEOPLE WITHOUT CORESIGNAL IDs: ${peopleWithoutCoreSignalId.length}`);
    console.log('');
    
    peopleWithoutCoreSignalId.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Created: ${person.createdAt.toISOString()}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check if these people have buyer group roles
    const peopleWithBuyerGroups = peopleWithoutCoreSignalId.filter(person => 
      person.customFields?.buyerGroupRole || 
      person.tags?.some(tag => ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder', 'Buyer Group'].includes(tag))
    );
    
    console.log(`🎯 PEOPLE WITHOUT CORESIGNAL IDs BUT WITH BUYER GROUP ROLES: ${peopleWithBuyerGroups.length}`);
    peopleWithBuyerGroups.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Buyer Group Role: ${person.customFields?.buyerGroupRole || 'Unknown'}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log('');
    });
    
    // Check total count
    const totalWithoutCoreSignalId = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          equals: null
        }
      }
    });
    
    console.log(`📈 TOTAL PEOPLE WITHOUT CORESIGNAL IDs: ${totalWithoutCoreSignalId}`);
    
  } catch (error) {
    console.error('❌ Error checking remaining people:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkRemainingPeople();
}

module.exports = checkRemainingPeople;
