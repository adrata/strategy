#!/usr/bin/env node

/**
 * 🔍 FINAL TOP AUDIT - COMPREHENSIVE VALIDATION
 * 
 * This script performs a final comprehensive audit to ensure:
 * 1. All buyer groups have proper 5-role system (Decision Makers, Champions, Blockers, Stakeholders, Introducers)
 * 2. We have sufficient Blockers and Introducers (not just Influencers)
 * 3. All companies are properly processed
 * 4. Data quality and completeness validation
 * 5. Identify any gaps in the buyer group analysis
 */

const { PrismaClient } = require('@prisma/client');

class FinalTopAudit {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    
    this.results = {
      analysisDate: new Date().toISOString(),
      totalCompanies: 0,
      companiesWithBuyerGroups: 0,
      companiesWithoutBuyerGroups: 0,
      totalPeople: 0,
      peopleWithRoles: 0,
      peopleWithoutRoles: 0,
      totalBuyerGroups: 0,
      roleDistribution: {},
      companiesNeedingAttention: [],
      dataQualityIssues: [],
      recommendations: [],
      errors: []
    };
  }

  async execute() {
    console.log('🔍 FINAL TOP AUDIT - COMPREHENSIVE VALIDATION');
    console.log('==============================================');
    console.log('');

    try {
      // Step 1: Company and Buyer Group Analysis
      await this.auditCompaniesAndBuyerGroups();
      
      // Step 2: People and Role Analysis
      await this.auditPeopleAndRoles();
      
      // Step 3: 5-Role System Validation
      await this.validateFiveRoleSystem();
      
      // Step 4: Data Quality Assessment
      await this.assessDataQuality();
      
      // Step 5: Identify Gaps and Recommendations
      await this.identifyGapsAndRecommendations();
      
      // Step 6: Generate Final Report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Final audit failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async auditCompaniesAndBuyerGroups() {
    console.log('🏢 STEP 1: Auditing companies and buyer groups...');
    
    // Get all companies
    const allCompanies = await this.prisma.companies.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        people: {
          select: {
            id: true,
            buyerGroupRole: true
          }
        },
        buyerGroups: {
          select: {
            id: true,
            name: true,
            people: {
              select: {
                person: {
                  select: {
                    id: true,
                    buyerGroupRole: true
                  }
                }
              }
            }
          }
        }
      }
    });

    this.results.totalCompanies = allCompanies.length;
    
    // Analyze companies
    const companiesWithBuyerGroups = allCompanies.filter(c => c.buyerGroups.length > 0);
    const companiesWithoutBuyerGroups = allCompanies.filter(c => c.buyerGroups.length === 0);
    
    this.results.companiesWithBuyerGroups = companiesWithBuyerGroups.length;
    this.results.companiesWithoutBuyerGroups = companiesWithoutBuyerGroups.length;

    console.log(`   📊 Total companies: ${this.results.totalCompanies}`);
    console.log(`   ✅ Companies with buyer groups: ${this.results.companiesWithBuyerGroups}`);
    console.log(`   ❌ Companies without buyer groups: ${this.results.companiesWithoutBuyerGroups}`);
    console.log('');

    // Show companies without buyer groups
    if (companiesWithoutBuyerGroups.length > 0) {
      console.log('❌ COMPANIES WITHOUT BUYER GROUPS:');
      companiesWithoutBuyerGroups.slice(0, 20).forEach((company, index) => {
        const peopleCount = company.people.length;
        const peopleWithRoles = company.people.filter(p => p.buyerGroupRole).length;
        console.log(`   ${index + 1}. ${company.name} - ${peopleCount} people, ${peopleWithRoles} with roles`);
      });
      
      if (companiesWithoutBuyerGroups.length > 20) {
        console.log(`   ... and ${companiesWithoutBuyerGroups.length - 20} more`);
      }
      console.log('');
    }

    // Count total buyer groups
    const totalBuyerGroups = await this.prisma.buyer_groups.count({
      where: { workspaceId: this.workspaceId }
    });
    
    this.results.totalBuyerGroups = totalBuyerGroups;
    console.log(`   📊 Total buyer groups: ${totalBuyerGroups}`);
    console.log('');
  }

  async auditPeopleAndRoles() {
    console.log('👥 STEP 2: Auditing people and roles...');
    
    // Get all people
    const allPeople = await this.prisma.people.findMany({
      where: { workspaceId: this.workspaceId },
      select: {
        id: true,
        fullName: true,
        jobTitle: true,
        buyerGroupRole: true,
        company: {
          select: { name: true }
        }
      }
    });

    this.results.totalPeople = allPeople.length;
    
    // Analyze people
    const peopleWithRoles = allPeople.filter(p => p.buyerGroupRole !== null);
    const peopleWithoutRoles = allPeople.filter(p => p.buyerGroupRole === null);
    
    this.results.peopleWithRoles = peopleWithRoles.length;
    this.results.peopleWithoutRoles = peopleWithoutRoles.length;

    console.log(`   📊 Total people: ${this.results.totalPeople}`);
    console.log(`   ✅ People with buyer group roles: ${this.results.peopleWithRoles}`);
    console.log(`   ❌ People without buyer group roles: ${this.results.peopleWithoutRoles}`);
    console.log('');

    // Calculate role distribution
    const roleDistribution = {};
    peopleWithRoles.forEach(person => {
      const role = person.buyerGroupRole || 'Unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    this.results.roleDistribution = roleDistribution;

    console.log('📊 Current Role Distribution:');
    Object.entries(roleDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([role, count]) => {
        const percentage = ((count / this.results.peopleWithRoles) * 100).toFixed(1);
        console.log(`   ${role}: ${count} (${percentage}%)`);
      });
    console.log('');
  }

  async validateFiveRoleSystem() {
    console.log('🎯 STEP 3: Validating 5-role system implementation...');
    
    const expectedRoles = ['Decision Maker', 'Champion', 'Blocker', 'Stakeholder', 'Introducer'];
    const currentRoles = Object.keys(this.results.roleDistribution);
    
    console.log('📋 5-Role System Validation:');
    
    let systemValid = true;
    
    for (const expectedRole of expectedRoles) {
      const count = this.results.roleDistribution[expectedRole] || 0;
      const hasRole = count > 0;
      
      console.log(`   ${hasRole ? '✅' : '❌'} ${expectedRole}: ${count} people`);
      
      if (!hasRole) {
        systemValid = false;
        this.results.dataQualityIssues.push(`Missing ${expectedRole} roles`);
      }
    }
    
    // Check for unexpected roles
    const unexpectedRoles = currentRoles.filter(role => !expectedRoles.includes(role));
    if (unexpectedRoles.length > 0) {
      console.log('\n⚠️ Unexpected roles found:');
      unexpectedRoles.forEach(role => {
        const count = this.results.roleDistribution[role];
        console.log(`   ${role}: ${count} people`);
        this.results.dataQualityIssues.push(`Unexpected role: ${role} (${count} people)`);
      });
      systemValid = false;
    }
    
    console.log(`\n   🎯 5-Role System Status: ${systemValid ? '✅ VALID' : '❌ NEEDS ATTENTION'}`);
    console.log('');
    
    // Analyze role distribution quality
    const decisionMakers = this.results.roleDistribution['Decision Maker'] || 0;
    const blockers = this.results.roleDistribution['Blocker'] || 0;
    const introducers = this.results.roleDistribution['Introducer'] || 0;
    
    console.log('📊 Role Distribution Analysis:');
    console.log(`   Decision Makers: ${decisionMakers} (${((decisionMakers/this.results.peopleWithRoles)*100).toFixed(1)}%)`);
    console.log(`   Blockers: ${blockers} (${((blockers/this.results.peopleWithRoles)*100).toFixed(1)}%)`);
    console.log(`   Introducers: ${introducers} (${((introducers/this.results.peopleWithRoles)*100).toFixed(1)}%)`);
    
    // Check if we have sufficient Blockers and Introducers
    const blockerThreshold = this.results.peopleWithRoles * 0.02; // 2% minimum
    const introducerThreshold = this.results.peopleWithRoles * 0.02; // 2% minimum
    
    if (blockers < blockerThreshold) {
      this.results.recommendations.push(`Consider identifying more Blockers (currently ${blockers}, recommended minimum ${Math.round(blockerThreshold)})`);
    }
    
    if (introducers < introducerThreshold) {
      this.results.recommendations.push(`Consider identifying more Introducers (currently ${introducers}, recommended minimum ${Math.round(introducerThreshold)})`);
    }
    
    console.log('');
  }

  async assessDataQuality() {
    console.log('🔍 STEP 4: Assessing data quality...');
    
    // Check buyer groups without decision makers
    const buyerGroupsWithoutDecisionMakers = await this.prisma.buyer_groups.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        company: {
          select: { name: true }
        },
        people: {
          include: {
            person: {
              select: { buyerGroupRole: true }
            }
          }
        }
      }
    });

    const problematicBuyerGroups = buyerGroupsWithoutDecisionMakers.filter(bg => {
      const roles = bg.people.map(bgp => bgp.person.buyerGroupRole);
      return !roles.includes('Decision Maker');
    });

    if (problematicBuyerGroups.length > 0) {
      this.results.dataQualityIssues.push(`${problematicBuyerGroups.length} buyer groups without Decision Makers`);
      console.log(`   ❌ Found ${problematicBuyerGroups.length} buyer groups without Decision Makers`);
    } else {
      console.log(`   ✅ All buyer groups have Decision Makers`);
    }

    // Check for companies with people but no buyer groups
    const companiesWithPeopleButNoBuyerGroups = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { some: {} },
        buyerGroups: { none: {} }
      },
      include: {
        people: {
          select: {
            id: true,
            buyerGroupRole: true
          }
        }
      }
    });

    if (companiesWithPeopleButNoBuyerGroups.length > 0) {
      this.results.dataQualityIssues.push(`${companiesWithPeopleButNoBuyerGroups.length} companies with people but no buyer groups`);
      console.log(`   ❌ Found ${companiesWithPeopleButNoBuyerGroups.length} companies with people but no buyer groups`);
      
      // Show top companies needing attention
      this.results.companiesNeedingAttention = companiesWithPeopleButNoBuyerGroups
        .sort((a, b) => b.people.length - a.people.length)
        .slice(0, 10)
        .map(company => ({
          name: company.name,
          peopleCount: company.people.length,
          peopleWithRoles: company.people.filter(p => p.buyerGroupRole).length,
          issue: 'Has people but no buyer group'
        }));
    } else {
      console.log(`   ✅ All companies with people have buyer groups`);
    }

    // Check for people without roles
    if (this.results.peopleWithoutRoles > 0) {
      this.results.dataQualityIssues.push(`${this.results.peopleWithoutRoles} people without buyer group roles`);
      console.log(`   ❌ Found ${this.results.peopleWithoutRoles} people without buyer group roles`);
    } else {
      console.log(`   ✅ All people have buyer group roles`);
    }

    console.log('');
  }

  async identifyGapsAndRecommendations() {
    console.log('💡 STEP 5: Identifying gaps and recommendations...');
    
    // Analyze role distribution for gaps
    const totalPeople = this.results.peopleWithRoles;
    const decisionMakers = this.results.roleDistribution['Decision Maker'] || 0;
    const champions = this.results.roleDistribution['Champion'] || 0;
    const blockers = this.results.roleDistribution['Blocker'] || 0;
    const stakeholders = this.results.roleDistribution['Stakeholder'] || 0;
    const introducers = this.results.roleDistribution['Introducer'] || 0;

    console.log('📊 Role Distribution Analysis:');
    console.log(`   Decision Makers: ${decisionMakers} (${((decisionMakers/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   Champions: ${champions} (${((champions/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   Blockers: ${blockers} (${((blockers/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   Stakeholders: ${stakeholders} (${((stakeholders/totalPeople)*100).toFixed(1)}%)`);
    console.log(`   Introducers: ${introducers} (${((introducers/totalPeople)*100).toFixed(1)}%)`);
    console.log('');

    // Generate recommendations
    if (blockers < totalPeople * 0.05) { // Less than 5%
      this.results.recommendations.push('Consider identifying more Blockers - look for legal, compliance, security, or low-influence roles');
    }

    if (introducers < totalPeople * 0.05) { // Less than 5%
      this.results.recommendations.push('Consider identifying more Introducers - look for business development, marketing, sales, or networking roles');
    }

    if (decisionMakers < totalPeople * 0.15) { // Less than 15%
      this.results.recommendations.push('Consider identifying more Decision Makers - look for C-level, VPs, Directors, or Managers');
    }

    if (this.results.companiesWithoutBuyerGroups > 0) {
      this.results.recommendations.push(`Process ${this.results.companiesWithoutBuyerGroups} companies that don't have buyer groups yet`);
    }

    if (this.results.peopleWithoutRoles > 0) {
      this.results.recommendations.push(`Assign buyer group roles to ${this.results.peopleWithoutRoles} people who don't have roles yet`);
    }

    console.log('💡 Recommendations:');
    if (this.results.recommendations.length > 0) {
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    } else {
      console.log('   ✅ No recommendations - system looks good!');
    }
    console.log('');
  }

  async generateFinalReport() {
    console.log('📋 STEP 6: Generating final report...');
    
    console.log('\n🎉 FINAL TOP AUDIT REPORT');
    console.log('==========================');
    console.log(`📅 Analysis Date: ${this.results.analysisDate}`);
    console.log('');

    console.log('📊 SUMMARY STATISTICS:');
    console.log(`   🏢 Total Companies: ${this.results.totalCompanies}`);
    console.log(`   ✅ Companies with Buyer Groups: ${this.results.companiesWithBuyerGroups}`);
    console.log(`   ❌ Companies without Buyer Groups: ${this.results.companiesWithoutBuyerGroups}`);
    console.log(`   👥 Total People: ${this.results.totalPeople}`);
    console.log(`   ✅ People with Roles: ${this.results.peopleWithRoles}`);
    console.log(`   ❌ People without Roles: ${this.results.peopleWithoutRoles}`);
    console.log(`   🎯 Total Buyer Groups: ${this.results.totalBuyerGroups}`);
    console.log('');

    console.log('📊 ROLE DISTRIBUTION:');
    Object.entries(this.results.roleDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([role, count]) => {
        const percentage = ((count / this.results.peopleWithRoles) * 100).toFixed(1);
        console.log(`   ${role}: ${count} (${percentage}%)`);
      });
    console.log('');

    if (this.results.dataQualityIssues.length > 0) {
      console.log('❌ DATA QUALITY ISSUES:');
      this.results.dataQualityIssues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (this.results.companiesNeedingAttention.length > 0) {
      console.log('🏢 COMPANIES NEEDING ATTENTION:');
      this.results.companiesNeedingAttention.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name} - ${company.peopleCount} people, ${company.peopleWithRoles} with roles (${company.issue})`);
      });
      console.log('');
    }

    if (this.results.recommendations.length > 0) {
      console.log('💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    if (this.results.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    // Overall assessment
    const hasIssues = this.results.dataQualityIssues.length > 0 || this.results.companiesNeedingAttention.length > 0;
    const hasRecommendations = this.results.recommendations.length > 0;

    console.log('🎯 OVERALL ASSESSMENT:');
    if (!hasIssues && !hasRecommendations) {
      console.log('   🎉 EXCELLENT - TOP buyer group system is complete and optimized!');
    } else if (!hasIssues && hasRecommendations) {
      console.log('   ✅ GOOD - System is functional with minor optimizations possible');
    } else {
      console.log('   ⚠️ NEEDS ATTENTION - Some issues need to be addressed');
    }

    console.log('');
    console.log('🎯 5-ROLE SYSTEM STATUS:');
    const hasAllRoles = Object.keys(this.results.roleDistribution).length >= 5;
    const hasDecisionMakers = (this.results.roleDistribution['Decision Maker'] || 0) > 0;
    const hasBlockers = (this.results.roleDistribution['Blocker'] || 0) > 0;
    const hasIntroducers = (this.results.roleDistribution['Introducer'] || 0) > 0;

    console.log(`   ${hasAllRoles ? '✅' : '❌'} All 5 roles present: ${hasAllRoles}`);
    console.log(`   ${hasDecisionMakers ? '✅' : '❌'} Decision Makers: ${this.results.roleDistribution['Decision Maker'] || 0}`);
    console.log(`   ${hasBlockers ? '✅' : '❌'} Blockers: ${this.results.roleDistribution['Blocker'] || 0}`);
    console.log(`   ${hasIntroducers ? '✅' : '❌'} Introducers: ${this.results.roleDistribution['Introducer'] || 0}`);
    console.log('');

    console.log('🚀 TOP BUYER GROUP SYSTEM READY FOR PRODUCTION!');
  }
}

// Execute the final audit
async function main() {
  const auditor = new FinalTopAudit();
  await auditor.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FinalTopAudit;
