#!/usr/bin/env node

/**
 * Check for recent buyer group data in the database
 */

const { PrismaClient } = require('@prisma/client');

async function checkRecentBuyerGroups() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 CHECKING RECENT BUYER GROUP DATA');
    console.log('==================================');
    
    // Check for people with buyer group roles created in the last 24 hours
    const recentPeople = await prisma.people.findMany({
      where: {
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
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
      take: 20
    });
    
    console.log(`📊 Found ${recentPeople.length} people with buyer group roles in last 24 hours:`);
    console.log('');
    
    recentPeople.forEach((person, index) => {
      const buyerGroupRole = person.customFields?.buyerGroupRole || 'Unknown';
      const company = person.company?.name || 'Unknown Company';
      const createdAt = person.createdAt.toISOString();
      
      console.log(`${index + 1}. ${person.fullName} (${person.jobTitle})`);
      console.log(`   Company: ${company}`);
      console.log(`   Role: ${buyerGroupRole}`);
      console.log(`   Created: ${createdAt}`);
      console.log('');
    });
    
    // Check total count of people with buyer group roles
    const totalBuyerGroupPeople = await prisma.people.count({
      where: {
        customFields: {
          path: ['buyerGroupRole'],
          not: null
        }
      }
    });
    
    console.log(`📈 Total people with buyer group roles: ${totalBuyerGroupPeople}`);
    
    // Check companies with buyer group data
    const companiesWithBuyerGroups = await prisma.companies.findMany({
      where: {
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
      take: 10
    });
    
    console.log('');
    console.log('🏢 Top companies with buyer group data:');
    companiesWithBuyerGroups.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (${company._count.people} people)`);
    });
    
  } catch (error) {
    console.error('❌ Error checking buyer group data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkRecentBuyerGroups();
}

module.exports = checkRecentBuyerGroups;
