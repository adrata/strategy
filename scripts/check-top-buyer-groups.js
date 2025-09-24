#!/usr/bin/env node

/**
 * Check buyer group data specifically for TOP workspace
 */

const { PrismaClient } = require('@prisma/client');

async function checkTopBuyerGroups() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING TOP WORKSPACE BUYER GROUP DATA');
    console.log('==========================================');
    
    const TOP_WORKSPACE_ID = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    // Check total people in TOP workspace
    const totalPeople = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID
      }
    });
    
    // Check people with buyer group roles in TOP workspace
    const peopleWithBuyerGroups = await prisma.people.count({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        }
      }
    });
    
    console.log(`📊 TOP Workspace People: ${totalPeople}`);
    console.log(`🎯 People with Buyer Group Roles: ${peopleWithBuyerGroups}`);
    console.log(`📈 Buyer Group Coverage: ${((peopleWithBuyerGroups / totalPeople) * 100).toFixed(1)}%`);
    console.log('');
    
    // Check companies in TOP workspace with buyer group data
    const companiesWithBuyerGroups = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        people: {
          some: {
            customFields: {
              path: ['buyerGroupRole'],
              not: null
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
                  not: null
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
    
    console.log('🏢 TOP Workspace Companies with Buyer Group Data:');
    companiesWithBuyerGroups.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company._count.people} people)`);
    });
    
    // Check recent buyer group activity in TOP workspace
    const recentBuyerGroups = await prisma.people.findMany({
      where: {
        workspaceId: TOP_WORKSPACE_ID,
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      select: {
        fullName: true,
        jobTitle: true,
        customFields: true,
        createdAt: true,
        company: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('');
    console.log(`🕒 Recent Buyer Group Activity (Last 7 days): ${recentBuyerGroups.length} people`);
    recentBuyerGroups.forEach((person, index) => {
      const buyerGroupRole = person.customFields?.buyerGroupRole || 'Unknown';
      const company = person.company?.name || 'Unknown Company';
      const createdAt = person.createdAt.toISOString();
      
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle}) - ${buyerGroupRole} at ${company} - ${createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking TOP workspace buyer group data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkTopBuyerGroups();
}

module.exports = checkTopBuyerGroups;
