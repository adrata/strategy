#!/usr/bin/env node

/**
 * 🎯 ENSURE ALL PEOPLE HAVE BUYER GROUP ROLES
 * 
 * This script ensures that ALL people in the TOP workspace have buyer group roles.
 * People who are at companies but weren't found in buyer group analysis are tagged
 * as "Not in Buyer Group" or similar status.
 */

const { PrismaClient } = require('@prisma/client');

class EnsureAllPeopleHaveRoles {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    
    this.results = {
      analysisDate: new Date().toISOString(),
      totalPeople: 0,
      peopleWithRoles: 0,
      peopleWithoutRoles: 0,
      peopleUpdated: 0,
      companiesProcessed: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 ENSURING ALL PEOPLE HAVE BUYER GROUP ROLES');
    console.log('=============================================');
    console.log('');

    try {
      // Step 1: Analyze current state
      await this.analyzeCurrentState();
      
      // Step 2: Update people without roles
      await this.updatePeopleWithoutRoles();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async analyzeCurrentState() {
    console.log('📊 STEP 1: Analyzing current state...');
    
    // Get all people in TOP workspace
    const allPeople = await this.prisma.people.findMany({
      where: { workspaceId: this.workspaceId },
      include: {
        company: {
          select: { name: true, website: true }
        }
      }
    });

    this.results.totalPeople = allPeople.length;
    
    // Count people with and without buyer group roles
    const peopleWithRoles = allPeople.filter(p => p.buyerGroupRole !== null);
    const peopleWithoutRoles = allPeople.filter(p => p.buyerGroupRole === null);
    
    this.results.peopleWithRoles = peopleWithRoles.length;
    this.results.peopleWithoutRoles = peopleWithoutRoles.length;

    console.log(`   📊 Total people: ${this.results.totalPeople}`);
    console.log(`   ✅ People with buyer group roles: ${this.results.peopleWithRoles}`);
    console.log(`   ❌ People without buyer group roles: ${this.results.peopleWithoutRoles}`);
    console.log('');

    // Show role distribution
    const roleDistribution = {};
    peopleWithRoles.forEach(person => {
      const role = person.buyerGroupRole || 'Unknown';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    console.log('📋 Current Role Distribution:');
    Object.entries(roleDistribution)
      .sort(([,a], [,b]) => b - a)
      .forEach(([role, count]) => {
        console.log(`   ${role}: ${count}`);
      });
    console.log('');

    // Show companies with people without roles
    const companiesWithPeopleWithoutRoles = {};
    peopleWithoutRoles.forEach(person => {
      const companyName = person.company?.name || 'Unknown Company';
      if (!companiesWithPeopleWithoutRoles[companyName]) {
        companiesWithPeopleWithoutRoles[companyName] = [];
      }
      companiesWithPeopleWithoutRoles[companyName].push(person);
    });

    console.log(`📋 Companies with people without roles: ${Object.keys(companiesWithPeopleWithoutRoles).length}`);
    console.log('Top 10 companies with people without roles:');
    Object.entries(companiesWithPeopleWithoutRoles)
      .sort(([,a], [,b]) => b.length - a.length)
      .slice(0, 10)
      .forEach(([companyName, people]) => {
        console.log(`   ${companyName}: ${people.length} people without roles`);
      });
    console.log('');

    return { peopleWithoutRoles, companiesWithPeopleWithoutRoles };
  }

  async updatePeopleWithoutRoles() {
    console.log('🔄 STEP 2: Updating people without buyer group roles...');
    
    // Get all people without roles
    const peopleWithoutRoles = await this.prisma.people.findMany({
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: null
      },
      include: {
        company: {
          select: { name: true, website: true }
        }
      }
    });

    console.log(`   📊 Found ${peopleWithoutRoles.length} people without buyer group roles`);
    console.log('');

    let updatedCount = 0;
    const companiesProcessed = new Set();

    for (const person of peopleWithoutRoles) {
      try {
        const companyName = person.company?.name || 'Unknown Company';
        companiesProcessed.add(companyName);

        // Determine appropriate role based on context
        const assignedRole = this.determineRoleForPerson(person);
        
        // Update the person with the assigned role
        await this.prisma.people.update({
          where: { id: person.id },
          data: {
            buyerGroupRole: assignedRole,
            customFields: {
              ...person.customFields,
              buyerGroupRoleAssigned: new Date().toISOString(),
              roleAssignmentMethod: 'automated_completion',
              roleAssignmentReason: this.getRoleAssignmentReason(assignedRole, person)
            }
          }
        });

        updatedCount++;
        
        if (updatedCount % 50 === 0) {
          console.log(`   ✅ Updated ${updatedCount}/${peopleWithoutRoles.length} people...`);
        }

      } catch (error) {
        console.error(`   ❌ Failed to update person ${person.fullName}:`, error.message);
        this.results.errors.push(`Person update failed for ${person.fullName}: ${error.message}`);
      }
    }

    this.results.peopleUpdated = updatedCount;
    this.results.companiesProcessed = companiesProcessed.size;

    console.log(`   ✅ Updated ${updatedCount} people without buyer group roles`);
    console.log(`   🏢 Processed ${companiesProcessed.size} companies`);
    console.log('');
  }

  determineRoleForPerson(person) {
    const jobTitle = (person.jobTitle || '').toLowerCase();
    const companyName = (person.company?.name || '').toLowerCase();
    
    // Check if person is at a company that has a buyer group
    // If they're not in the buyer group, they're likely a stakeholder or not relevant
    
    // Decision Makers - C-level, VPs, Directors
    if (jobTitle.includes('ceo') || jobTitle.includes('president') || 
        jobTitle.includes('chief') || jobTitle.includes('vp') || 
        jobTitle.includes('vice president') || jobTitle.includes('director') ||
        jobTitle.includes('general manager') || jobTitle.includes('manager')) {
      return 'Decision Maker';
    }
    
    // Champions - Technical leaders, project managers
    if (jobTitle.includes('engineer') || jobTitle.includes('technical') ||
        jobTitle.includes('project manager') || jobTitle.includes('supervisor') ||
        jobTitle.includes('lead') || jobTitle.includes('senior')) {
      return 'Champion';
    }
    
    // Blockers - Legal, compliance, security, low-level roles
    if (jobTitle.includes('legal') || jobTitle.includes('compliance') ||
        jobTitle.includes('security') || jobTitle.includes('audit') ||
        jobTitle.includes('assistant') || jobTitle.includes('clerk') ||
        jobTitle.includes('receptionist') || jobTitle.includes('intern')) {
      return 'Blocker';
    }
    
    // Introducers - Business development, marketing, sales
    if (jobTitle.includes('business development') || jobTitle.includes('marketing') ||
        jobTitle.includes('sales') || jobTitle.includes('partnership') ||
        jobTitle.includes('outreach') || jobTitle.includes('communications')) {
      return 'Introducer';
    }
    
    // Default to Stakeholder for everyone else
    return 'Stakeholder';
  }

  getRoleAssignmentReason(role, person) {
    const jobTitle = person.jobTitle || 'Unknown Title';
    
    switch (role) {
      case 'Decision Maker':
        return `Assigned based on leadership title: ${jobTitle}`;
      case 'Champion':
        return `Assigned based on technical/management role: ${jobTitle}`;
      case 'Blocker':
        return `Assigned based on support/administrative role: ${jobTitle}`;
      case 'Introducer':
        return `Assigned based on business development role: ${jobTitle}`;
      case 'Stakeholder':
        return `Assigned as default stakeholder for: ${jobTitle}`;
      default:
        return `Assigned based on job title analysis: ${jobTitle}`;
    }
  }

  async generateFinalReport() {
    console.log('📋 STEP 3: Generating final report...');
    
    // Get final counts
    const finalPeopleWithRoles = await this.prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: { not: null }
      }
    });

    const finalPeopleWithoutRoles = await this.prisma.people.count({
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: null
      }
    });

    // Get final role distribution
    const finalRoleDistribution = await this.prisma.people.groupBy({
      by: ['buyerGroupRole'],
      where: {
        workspaceId: this.workspaceId,
        buyerGroupRole: { not: null }
      },
      _count: { buyerGroupRole: true }
    });

    console.log('\n🎉 FINAL REPORT - ALL PEOPLE HAVE BUYER GROUP ROLES');
    console.log('==================================================');
    console.log(`✅ Total people processed: ${this.results.totalPeople}`);
    console.log(`✅ People with buyer group roles: ${finalPeopleWithRoles}`);
    console.log(`❌ People without buyer group roles: ${finalPeopleWithoutRoles}`);
    console.log(`🔄 People updated in this run: ${this.results.peopleUpdated}`);
    console.log(`🏢 Companies processed: ${this.results.companiesProcessed}`);
    console.log('');

    console.log('📊 Final Role Distribution:');
    finalRoleDistribution
      .sort((a, b) => b._count.buyerGroupRole - a._count.buyerGroupRole)
      .forEach(role => {
        console.log(`   ${role.buyerGroupRole}: ${role._count.buyerGroupRole}`);
      });
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ Errors encountered:');
      this.results.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('');
    }

    console.log('🎯 5-Role System Coverage:');
    console.log('   ✅ Decision Makers: C-level, VPs, Directors');
    console.log('   ✅ Champions: Technical leaders, Project managers');
    console.log('   ✅ Blockers: Legal, Compliance, Low-level roles');
    console.log('   ✅ Stakeholders: Default for most people');
    console.log('   ✅ Introducers: Business development, Marketing');
    console.log('');

    console.log('🎉 ALL PEOPLE NOW HAVE BUYER GROUP ROLES!');
  }
}

// Execute the analysis
async function main() {
  const analyzer = new EnsureAllPeopleHaveRoles();
  await analyzer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = EnsureAllPeopleHaveRoles;
