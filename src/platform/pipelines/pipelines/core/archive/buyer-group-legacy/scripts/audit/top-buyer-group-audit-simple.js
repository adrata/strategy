#!/usr/bin/env node

/**
 * TOP Database Buyer Group Audit Script - Simplified Version
 * Comprehensive analysis of buyer group roles and enrichment status
 * For client presentation verification
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runBuyerGroupAudit() {
  console.log('🔍 TOP DATABASE BUYER GROUP AUDIT');
  console.log('=====================================\n');

  try {
    // 1. OVERALL DATABASE STATISTICS
    console.log('📊 DATABASE OVERVIEW');
    console.log('-------------------');
    
    const totalPeople = await prisma.people.count();
    const totalCompanies = await prisma.companies.count();
    const totalBuyerGroups = await prisma.buyer_groups.count();
    const totalBuyerGroupRelations = await prisma.buyerGroupToPerson.count();
    
    console.log(`Total People: ${totalPeople.toLocaleString()}`);
    console.log(`Total Companies: ${totalCompanies.toLocaleString()}`);
    console.log(`Total Buyer Groups: ${totalBuyerGroups.toLocaleString()}`);
    console.log(`Total Buyer Group Relations: ${totalBuyerGroupRelations.toLocaleString()}\n`);

    // 2. BUYER GROUP ROLE ASSIGNMENT ANALYSIS
    console.log('🎯 BUYER GROUP ROLE ASSIGNMENT');
    console.log('------------------------------');
    
    // People with buyer group roles
    const peopleWithBuyerGroupRoles = await prisma.people.count({
      where: {
        buyerGroupRole: {
          not: null
        }
      }
    });
    
    // People without buyer group roles
    const peopleWithoutBuyerGroupRoles = totalPeople - peopleWithBuyerGroupRoles;
    
    console.log(`People WITH buyer group roles: ${peopleWithBuyerGroupRoles.toLocaleString()}`);
    console.log(`People WITHOUT buyer group roles: ${peopleWithoutBuyerGroupRoles.toLocaleString()}`);
    console.log(`Coverage: ${((peopleWithBuyerGroupRoles / totalPeople) * 100).toFixed(1)}%\n`);

    // 3. BUYER GROUP ROLE DISTRIBUTION
    console.log('📈 BUYER GROUP ROLE DISTRIBUTION');
    console.log('--------------------------------');
    
    const roleDistribution = await prisma.people.groupBy({
      by: ['buyerGroupRole'],
      _count: {
        buyerGroupRole: true
      },
      where: {
        buyerGroupRole: {
          not: null
        }
      },
      orderBy: {
        _count: {
          buyerGroupRole: 'desc'
        }
      }
    });

    roleDistribution.forEach(role => {
      const percentage = ((role._count.buyerGroupRole / peopleWithBuyerGroupRoles) * 100).toFixed(1);
      console.log(`${role.buyerGroupRole || 'NULL'}: ${role._count.buyerGroupRole.toLocaleString()} (${percentage}%)`);
    });
    console.log('');

    // 4. BUYER GROUP RELATIONSHIP ANALYSIS
    console.log('🔗 BUYER GROUP RELATIONSHIPS');
    console.log('----------------------------');
    
    const relationshipRoles = await prisma.buyerGroupToPerson.groupBy({
      by: ['role'],
      _count: {
        role: true
      },
      orderBy: {
        _count: {
          role: 'desc'
        }
      }
    });

    relationshipRoles.forEach(rel => {
      const percentage = ((rel._count.role / totalBuyerGroupRelations) * 100).toFixed(1);
      console.log(`${rel.role || 'NULL'}: ${rel._count.role.toLocaleString()} (${percentage}%)`);
    });
    console.log('');

    // 5. ENRICHMENT STATUS ANALYSIS
    console.log('💎 ENRICHMENT STATUS ANALYSIS');
    console.log('-----------------------------');
    
    // People with enrichment data
    const enrichedPeople = await prisma.people.count({
      where: {
        OR: [
          { lastEnriched: { not: null } },
          { enrichmentScore: { not: null } }
        ]
      }
    });
    
    const notEnrichedPeople = totalPeople - enrichedPeople;
    
    console.log(`Enriched People: ${enrichedPeople.toLocaleString()}`);
    console.log(`Not Enriched People: ${notEnrichedPeople.toLocaleString()}`);
    console.log(`Enrichment Coverage: ${((enrichedPeople / totalPeople) * 100).toFixed(1)}%\n`);

    // 6. ENRICHMENT SCORE DISTRIBUTION
    console.log('📊 ENRICHMENT SCORE DISTRIBUTION');
    console.log('--------------------------------');
    
    const enrichmentScores = await prisma.people.findMany({
      where: {
        enrichmentScore: { not: null }
      },
      select: {
        enrichmentScore: true
      }
    });

    if (enrichmentScores.length > 0) {
      const scores = enrichmentScores.map(p => parseFloat(p.enrichmentScore));
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      
      console.log(`Average Enrichment Score: ${avgScore.toFixed(2)}`);
      console.log(`Min Score: ${minScore.toFixed(2)}`);
      console.log(`Max Score: ${maxScore.toFixed(2)}`);
      console.log(`People with Scores: ${scores.length.toLocaleString()}\n`);
    }

    // 7. COMPANY BUYER GROUP ANALYSIS
    console.log('🏢 COMPANY BUYER GROUP ANALYSIS');
    console.log('-------------------------------');
    
    const companiesWithBuyerGroups = await prisma.companies.count({
      where: {
        buyerGroups: {
          some: {}
        }
      }
    });
    
    const companiesWithoutBuyerGroups = totalCompanies - companiesWithBuyerGroups;
    
    console.log(`Companies WITH buyer groups: ${companiesWithBuyerGroups.toLocaleString()}`);
    console.log(`Companies WITHOUT buyer groups: ${companiesWithoutBuyerGroups.toLocaleString()}`);
    console.log(`Company Coverage: ${((companiesWithBuyerGroups / totalCompanies) * 100).toFixed(1)}%\n`);

    // 8. SAMPLE BUYER GROUP DETAILS
    console.log('🔍 SAMPLE BUYER GROUP DETAILS');
    console.log('-----------------------------');
    
    const buyerGroupDetails = await prisma.buyer_groups.findMany({
      include: {
        people: {
          include: {
            person: {
              select: {
                fullName: true,
                jobTitle: true,
                buyerGroupRole: true
              }
            }
          }
        },
        company: {
          select: {
            name: true
          }
        }
      },
      take: 5 // Show first 5 for sample
    });

    buyerGroupDetails.forEach((group, index) => {
      console.log(`\n${index + 1}. ${group.name} (${group.company?.name || 'No Company'})`);
      console.log(`   Status: ${group.status || 'Unknown'}`);
      console.log(`   Priority: ${group.priority || 'Unknown'}`);
      console.log(`   People Count: ${group.people.length}`);
      
      group.people.slice(0, 3).forEach(person => {
        console.log(`   - ${person.person.fullName} (${person.person.jobTitle || 'No Title'}) - Role: ${person.role || 'No Role'}`);
      });
      if (group.people.length > 3) {
        console.log(`   ... and ${group.people.length - 3} more people`);
      }
    });

    // 9. SUMMARY AND RECOMMENDATIONS
    console.log('\n📋 AUDIT SUMMARY & RECOMMENDATIONS');
    console.log('===================================');
    
    const buyerGroupCoverage = ((peopleWithBuyerGroupRoles / totalPeople) * 100).toFixed(1);
    const enrichmentCoverage = ((enrichedPeople / totalPeople) * 100).toFixed(1);
    const companyCoverage = ((companiesWithBuyerGroups / totalCompanies) * 100).toFixed(1);
    
    console.log(`✅ Buyer Group Role Coverage: ${buyerGroupCoverage}%`);
    console.log(`✅ Enrichment Coverage: ${enrichmentCoverage}%`);
    console.log(`✅ Company Buyer Group Coverage: ${companyCoverage}%`);
    
    console.log('\n🎯 KEY FINDINGS:');
    if (buyerGroupCoverage < 80) {
      console.log(`⚠️  Buyer group role coverage is below 80% (${buyerGroupCoverage}%)`);
    } else {
      console.log(`✅ Buyer group role coverage is good (${buyerGroupCoverage}%)`);
    }
    
    if (enrichmentCoverage < 70) {
      console.log(`⚠️  Enrichment coverage is below 70% (${enrichmentCoverage}%)`);
    } else {
      console.log(`✅ Enrichment coverage is good (${enrichmentCoverage}%)`);
    }
    
    if (companyCoverage < 60) {
      console.log(`⚠️  Company buyer group coverage is below 60% (${companyCoverage}%)`);
    } else {
      console.log(`✅ Company buyer group coverage is good (${companyCoverage}%)`);
    }

    console.log('\n🚀 RECOMMENDATIONS:');
    if (buyerGroupCoverage < 80) {
      console.log('1. Run buyer group role assignment for remaining people');
    }
    if (enrichmentCoverage < 70) {
      console.log('2. Execute enrichment process for unenriched people');
    }
    if (companyCoverage < 60) {
      console.log('3. Create buyer groups for companies without them');
    }
    
    console.log('\n✅ Audit completed successfully!');

  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
runBuyerGroupAudit();

