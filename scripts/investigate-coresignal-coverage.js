#!/usr/bin/env node

/**
 * Investigate CoreSignal coverage more thoroughly
 */

const { PrismaClient } = require('@prisma/client');

async function investigateCoreSignalCoverage() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 INVESTIGATING CORESIGNAL COVERAGE');
    console.log('====================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check different ways CoreSignal data might be stored
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID
      }
    });
    
    // 1. People with coresignalId in customFields
    const withCoreSignalId = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          not: null
        }
      }
    });
    
    // 2. People with coresignalData in customFields
    const withCoreSignalData = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });
    
    // 3. People with rawData in customFields
    const withRawData = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['rawData'],
          not: null
        }
      }
    });
    
    // 4. People with any CoreSignal-related data
    const withAnyCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          {
            customFields: {
              path: ['coresignalId'],
              not: null
            }
          },
          {
            customFields: {
              path: ['coresignalData'],
              not: null
            }
          },
          {
            customFields: {
              path: ['rawData'],
              not: null
            }
          }
        ]
      }
    });
    
    // 5. People without any CoreSignal data
    const withoutCoreSignal = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          equals: null
        },
        NOT: {
          customFields: {
            path: ['coresignalData'],
            not: null
          }
        }
      }
    });
    
    console.log('📊 CORESIGNAL COVERAGE ANALYSIS:');
    console.log(`   Total people: ${totalPeople}`);
    console.log(`   With coresignalId: ${withCoreSignalId} (${((withCoreSignalId/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   With coresignalData: ${withCoreSignalData} (${((withCoreSignalData/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   With rawData: ${withRawData} (${((withRawData/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   With any CoreSignal data: ${withAnyCoreSignal} (${((withAnyCoreSignal/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   Without CoreSignal data: ${withoutCoreSignal} (${((withoutCoreSignal/totalPeople)*100).toFixed(1)}%)`);
    console.log('');
    
    // Get sample of people without CoreSignal data
    const peopleWithoutCoreSignal = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['coresignalId'],
          equals: null
        },
        NOT: {
          customFields: {
            path: ['coresignalData'],
            not: null
          }
        }
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
      take: 10
    });
    
    console.log('👥 SAMPLE PEOPLE WITHOUT CORESIGNAL DATA:');
    peopleWithoutCoreSignal.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check if there are people with buyer group roles but no CoreSignal
    const peopleWithBuyerGroupNoCoreSignal = await prisma.people.count({
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
        ],
        customFields: {
          path: ['coresignalId'],
          equals: null
        }
      }
    });
    
    console.log(`🎯 People with buyer group roles but no CoreSignal: ${peopleWithBuyerGroupNoCoreSignal}`);
    
  } catch (error) {
    console.error('❌ Error investigating CoreSignal coverage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  investigateCoreSignalCoverage();
}

module.exports = investigateCoreSignalCoverage;
