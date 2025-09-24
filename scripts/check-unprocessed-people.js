#!/usr/bin/env node

/**
 * Check the 798 unprocessed people to see their status
 */

const { PrismaClient } = require('@prisma/client');

async function checkUnprocessedPeople() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING UNPROCESSED PEOPLE');
    console.log('===============================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Get people without buyer group data
    const unprocessedPeople = await prisma.people.findMany({
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
        createdAt: true,
        updatedAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 30
    });
    
    console.log(`📊 UNPROCESSED PEOPLE: ${unprocessedPeople.length}`);
    console.log('');
    
    unprocessedPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   Created: ${person.createdAt.toISOString()}`);
      console.log(`   Updated: ${person.updatedAt.toISOString()}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log(`   CustomFields keys: ${Object.keys(person.customFields || {}).join(', ')}`);
      console.log('');
    });
    
    // Check if these people have any enrichment data
    const peopleWithSomeData = await prisma.people.findMany({
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
        },
        customFields: {
          not: null
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
    
    console.log(`📋 UNPROCESSED PEOPLE WITH SOME DATA: ${peopleWithSomeData.length}`);
    peopleWithSomeData.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${person.company?.name || 'Unknown'}`);
      console.log(`   CustomFields: ${JSON.stringify(person.customFields, null, 2)}`);
      console.log('');
    });
    
    // Check companies with unprocessed people
    const companiesWithUnprocessed = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        people: {
          some: {
            customFields: {
              path: ['buyerGroupRole'],
              equals: null
            },
            NOT: {
              tags: {
                hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder', 'Buyer Group']
              }
            }
          }
        }
      },
      select: {
        name: true,
        _count: {
          select: {
            people: {
              where: {
                customFields: {
                  path: ['buyerGroupRole'],
                  equals: null
                },
                NOT: {
                  tags: {
                    hasSome: ['Buyer Group Member', 'Decision Maker', 'Champion', 'Influencer', 'Stakeholder', 'Buyer Group']
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        people: {
          _count: 'desc'
        }
      },
      take: 15
    });
    
    console.log('🏢 COMPANIES WITH UNPROCESSED PEOPLE:');
    companiesWithUnprocessed.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company._count.people} unprocessed people)`);
    });
    
  } catch (error) {
    console.error('❌ Error checking unprocessed people:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkUnprocessedPeople();
}

module.exports = checkUnprocessedPeople;
