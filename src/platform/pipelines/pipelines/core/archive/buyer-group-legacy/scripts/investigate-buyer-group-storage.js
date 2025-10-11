#!/usr/bin/env node

/**
 * Investigate all possible ways buyer group data might be stored
 */

const { PrismaClient } = require('@prisma/client');

async function investigateBuyerGroupStorage() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 INVESTIGATING BUYER GROUP DATA STORAGE');
    console.log('=========================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check total people in TOP workspace
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID
      }
    });
    
    console.log(`📊 Total people in TOP workspace: ${totalPeople}`);
    console.log('');
    
    // Check different ways buyer group data might be stored
    
    // 1. Check customFields.buyerGroupRole
    const buyerGroupRole = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        }
      }
    });
    
    // 2. Check customFields.role
    const role = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['role'],
          not: null
        }
      }
    });
    
    // 3. Check customFields.buyerGroup
    const buyerGroup = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['buyerGroup'],
          not: null
        }
      }
    });
    
    // 4. Check customFields.analysis
    const analysis = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['analysis'],
          not: null
        }
      }
    });
    
    // 5. Check customFields.careerData
    const careerData = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['careerData'],
          not: null
        }
      }
    });
    
    // 6. Check people with ANY customFields data
    const anyCustomFields = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          not: null
        }
      }
    });
    
    // 7. Check people with tags
    const withTags = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        tags: {
          hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder']
        }
      }
    });
    
    console.log('🎯 BUYER GROUP DATA STORAGE ANALYSIS:');
    console.log(`   customFields.buyerGroupRole: ${buyerGroupRole}`);
    console.log(`   customFields.role: ${role}`);
    console.log(`   customFields.buyerGroup: ${buyerGroup}`);
    console.log(`   customFields.analysis: ${analysis}`);
    console.log(`   customFields.careerData: ${careerData}`);
    console.log(`   Any customFields data: ${anyCustomFields}`);
    console.log(`   People with buyer group tags: ${withTags}`);
    console.log('');
    
    // Check for people with buyer group related tags
    const peopleWithTags = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        tags: {
          hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder']
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        tags: true,
        customFields: true
      },
      take: 10
    });
    
    console.log('🏷️ PEOPLE WITH BUYER GROUP TAGS:');
    peopleWithTags.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check for people with buyer group data in customFields
    const peopleWithBuyerGroupData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          {
            customFields: {
              path: ['buyerGroupRole'],
              not: null
            }
          },
          {
            customFields: {
              path: ['role'],
              not: null
            }
          },
          {
            customFields: {
              path: ['buyerGroup'],
              not: null
            }
          },
          {
            customFields: {
              path: ['analysis'],
              not: null
            }
          }
        ]
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true
      },
      take: 10
    });
    
    console.log('📋 PEOPLE WITH BUYER GROUP DATA IN CUSTOMFIELDS:');
    peopleWithBuyerGroupData.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   CustomFields: ${JSON.stringify(person.customFields, null, 2)}`);
      console.log('');
    });
    
    // Calculate total coverage
    const totalWithBuyerGroupData = Math.max(buyerGroupRole, role, buyerGroup, analysis, withTags);
    const coverage = ((totalWithBuyerGroupData / totalPeople) * 100).toFixed(1);
    
    console.log(`📈 TOTAL BUYER GROUP COVERAGE: ${totalWithBuyerGroupData}/${totalPeople} (${coverage}%)`);
    
  } catch (error) {
    console.error('❌ Error investigating buyer group storage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  investigateBuyerGroupStorage();
}

module.exports = investigateBuyerGroupStorage;
