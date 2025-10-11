#!/usr/bin/env node

/**
 * Validate if buyer group analysis enriched existing people or found new people
 */

const { PrismaClient } = require('@prisma/client');

async function validateBuyerGroupTimeline() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 VALIDATING BUYER GROUP TIMELINE');
    console.log('==================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check people created in the last 2 days (new people)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    
    console.log(`📅 Checking timeline from ${twoDaysAgo.toISOString()} to now`);
    console.log('');
    
    // 1. Check people created in last 2 days with buyer group roles
    const newPeopleWithBuyerGroups = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        createdAt: {
          gte: twoDaysAgo
        },
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
      },
      select: {
        fullName: true,
        jobTitle: true,
        createdAt: true,
        customFields: true,
        tags: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    console.log(`🆕 NEW PEOPLE WITH BUYER GROUPS (Last 2 days): ${newPeopleWithBuyerGroups.length}`);
    newPeopleWithBuyerGroups.forEach((person, index) => {
      const buyerGroupRole = person.customFields?.buyerGroupRole || 'Unknown';
      const company = person.company?.name || 'Unknown';
      const createdAt = person.createdAt.toISOString();
      
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${company}`);
      console.log(`   Role: ${buyerGroupRole}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log('');
    });
    
    // 2. Check people updated in last 2 days with buyer group roles (enriched existing)
    const enrichedPeople = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        updatedAt: {
          gte: twoDaysAgo
        },
        createdAt: {
          lt: twoDaysAgo  // Created before 2 days ago
        },
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
      },
      select: {
        fullName: true,
        jobTitle: true,
        createdAt: true,
        updatedAt: true,
        customFields: true,
        tags: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    
    console.log(`🔄 ENRICHED EXISTING PEOPLE (Last 2 days): ${enrichedPeople.length}`);
    enrichedPeople.forEach((person, index) => {
      const buyerGroupRole = person.customFields?.buyerGroupRole || 'Unknown';
      const company = person.company?.name || 'Unknown';
      const createdAt = person.createdAt.toISOString();
      const updatedAt = person.updatedAt.toISOString();
      
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${company}`);
      console.log(`   Role: ${buyerGroupRole}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Updated: ${updatedAt}`);
      console.log(`   Tags: ${person.tags?.join(', ') || 'None'}`);
      console.log('');
    });
    
    // 3. Check total people created in last 2 days
    const totalNewPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        createdAt: {
          gte: twoDaysAgo
        }
      }
    });
    
    // 4. Check total people updated in last 2 days
    const totalUpdatedPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        updatedAt: {
          gte: twoDaysAgo
        }
      }
    });
    
    // 5. Check companies with recent activity
    const companiesWithRecentActivity = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        OR: [
          {
            people: {
              some: {
                createdAt: {
                  gte: twoDaysAgo
                }
              }
            }
          },
          {
            people: {
              some: {
                updatedAt: {
                  gte: twoDaysAgo
                }
              }
            }
          }
        ]
      },
      select: {
        name: true,
        _count: {
          select: {
            people: {
              where: {
                OR: [
                  {
                    createdAt: {
                      gte: twoDaysAgo
                    }
                  },
                  {
                    updatedAt: {
                      gte: twoDaysAgo
                    }
                  }
                ]
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
    
    console.log('📊 TIMELINE SUMMARY:');
    console.log(`   Total new people (last 2 days): ${totalNewPeople}`);
    console.log(`   Total updated people (last 2 days): ${totalUpdatedPeople}`);
    console.log(`   New people with buyer groups: ${newPeopleWithBuyerGroups.length}`);
    console.log(`   Enriched existing people: ${enrichedPeople.length}`);
    console.log('');
    
    console.log('🏢 COMPANIES WITH RECENT ACTIVITY:');
    companiesWithRecentActivity.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company._count.people} people with recent activity)`);
    });
    
    // 6. Check if we can see the pattern of enrichment vs new discovery
    const enrichmentRatio = enrichedPeople.length / (newPeopleWithBuyerGroups.length + enrichedPeople.length);
    const newDiscoveryRatio = newPeopleWithBuyerGroups.length / (newPeopleWithBuyerGroups.length + enrichedPeople.length);
    
    console.log('');
    console.log('🎯 BUYER GROUP ANALYSIS PATTERN:');
    console.log(`   Enrichment ratio: ${(enrichmentRatio * 100).toFixed(1)}% (existing people enriched)`);
    console.log(`   New discovery ratio: ${(newDiscoveryRatio * 100).toFixed(1)}% (new people found)`);
    
    if (enrichmentRatio > 0.7) {
      console.log('   ✅ PREDOMINANTLY ENRICHMENT: The buyer group analysis mainly enriched existing people');
    } else if (newDiscoveryRatio > 0.7) {
      console.log('   ✅ PREDOMINANTLY NEW DISCOVERY: The buyer group analysis mainly found new people');
    } else {
      console.log('   ✅ MIXED APPROACH: The buyer group analysis both enriched existing people and found new people');
    }
    
  } catch (error) {
    console.error('❌ Error validating buyer group timeline:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  validateBuyerGroupTimeline();
}

module.exports = validateBuyerGroupTimeline;
