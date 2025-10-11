#!/usr/bin/env node

/**
 * Check for people marked as "not in the buyer group" or similar
 */

const { PrismaClient } = require('@prisma/client');

async function checkNotInBuyerGroup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING "NOT IN BUYER GROUP" MARKINGS');
    console.log('==========================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check for people with "not in buyer group" related tags
    const notInBuyerGroupTags = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        tags: {
          hasSome: ['Not in Buyer Group', 'Not in buyer group', 'not in buyer group', 'No Buyer Group', 'No buyer group', 'Excluded from Buyer Group', 'Buyer Group Excluded']
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        tags: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });
    
    console.log(`🚫 PEOPLE MARKED AS "NOT IN BUYER GROUP": ${notInBuyerGroupTags.length}`);
    notInBuyerGroupTags.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check for people with no buyer group data at all
    const noBuyerGroupData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['buyerGroupRole'],
          equals: null
        },
        NOT: {
          tags: {
            hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder', 'Buyer Group']
          }
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        tags: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });
    
    console.log(`❌ PEOPLE WITH NO BUYER GROUP DATA: ${noBuyerGroupData.length}`);
    noBuyerGroupData.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check for people with "excluded" or "not found" in customFields
    const excludedPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'excluded'
            }
          },
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'not found'
            }
          },
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'not in buyer group'
            }
          },
          {
            customFields: {
              path: ['excludedFromBuyerGroup'],
              equals: true
            }
          },
          {
            customFields: {
              path: ['buyerGroupExcluded'],
              equals: true
            }
          }
        ]
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });
    
    console.log(`🚫 PEOPLE EXCLUDED FROM BUYER GROUP: ${excludedPeople.length}`);
    excludedPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   CustomFields: ${JSON.stringify(person.customFields, null, 2)}`);
      console.log('');
    });
    
    // Check for people with "no data" or "insufficient data" markings
    const insufficientData = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'insufficient data'
            }
          },
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'no data'
            }
          },
          {
            customFields: {
              path: ['buyerGroupStatus'],
              equals: 'not enough data'
            }
          }
        ]
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        company: {
          select: {
            name: true
          }
        }
      },
      take: 20
    });
    
    console.log(`📊 PEOPLE WITH INSUFFICIENT DATA: ${insufficientData.length}`);
    insufficientData.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   CustomFields: ${JSON.stringify(person.customFields, null, 2)}`);
      console.log('');
    });
    
    // Summary
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID
      }
    });
    
    const peopleWithBuyerGroups = await prisma.people.count({
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
            tags: {
              hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder']
            }
          }
        ]
      }
    });
    
    console.log('📈 SUMMARY:');
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   People with buyer groups: ${peopleWithBuyerGroups}`);
    console.log(`   People marked as "not in buyer group": ${notInBuyerGroupTags.length}`);
    console.log(`   People with no buyer group data: ${noBuyerGroupData.length}`);
    console.log(`   People excluded from buyer group: ${excludedPeople.length}`);
    console.log(`   People with insufficient data: ${insufficientData.length}`);
    
    const unprocessed = totalPeople - peopleWithBuyerGroups;
    console.log(`   Unprocessed people: ${unprocessed}`);
    
  } catch (error) {
    console.error('❌ Error checking "not in buyer group" markings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkNotInBuyerGroup();
}

module.exports = checkNotInBuyerGroup;
