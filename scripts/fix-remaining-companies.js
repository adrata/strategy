#!/usr/bin/env node

/**
 * 🔧 FIX REMAINING COMPANIES
 * 
 * This script fixes the remaining 14 companies that have people but no buyer groups.
 * These companies need formal buyer group records created.
 */

const { PrismaClient } = require('@prisma/client');

class FixRemainingCompanies {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1'; // TOP Engineering Plus workspace
    
    this.results = {
      analysisDate: new Date().toISOString(),
      companiesProcessed: 0,
      buyerGroupsCreated: 0,
      peopleLinked: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🔧 FIXING REMAINING COMPANIES WITH PEOPLE BUT NO BUYER GROUPS');
    console.log('============================================================');
    console.log('');

    try {
      // Step 1: Find companies with people but no buyer groups
      await this.findCompaniesNeedingBuyerGroups();
      
      // Step 2: Create buyer groups for these companies
      await this.createBuyerGroupsForCompanies();
      
      // Step 3: Generate final report
      await this.generateFinalReport();

    } catch (error) {
      console.error('❌ Fix failed:', error);
      this.results.errors.push(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesNeedingBuyerGroups() {
    console.log('🔍 STEP 1: Finding companies with people but no buyer groups...');
    
    const companiesNeedingBuyerGroups = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { some: {} },
        buyerGroups: { none: {} }
      },
      include: {
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true
          }
        }
      }
    });

    console.log(`   📊 Found ${companiesNeedingBuyerGroups.length} companies with people but no buyer groups`);
    console.log('');

    // Show the companies
    console.log('📋 Companies needing buyer groups:');
    companiesNeedingBuyerGroups.forEach((company, index) => {
      const peopleWithRoles = company.people.filter(p => p.buyerGroupRole).length;
      console.log(`   ${index + 1}. ${company.name} - ${company.people.length} people, ${peopleWithRoles} with roles`);
    });
    console.log('');

    return companiesNeedingBuyerGroups;
  }

  async createBuyerGroupsForCompanies() {
    console.log('🔧 STEP 2: Creating buyer groups for companies...');
    
    const companiesNeedingBuyerGroups = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: { some: {} },
        buyerGroups: { none: {} }
      },
      include: {
        people: {
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true
          }
        }
      }
    });

    for (const company of companiesNeedingBuyerGroups) {
      try {
        console.log(`   🏢 Processing ${company.name}...`);
        
        const peopleWithRoles = company.people.filter(p => p.buyerGroupRole);
        
        if (peopleWithRoles.length === 0) {
          console.log(`   ⚠️ Skipping ${company.name} - no people with buyer group roles`);
          continue;
        }

        // Create buyer group members
        const buyerGroupMembers = peopleWithRoles.map(person => ({
          personId: person.id,
          influence: this.determineInfluenceLevel(person.buyerGroupRole),
          isPrimary: person.buyerGroupRole === 'Decision Maker'
        }));

        // Calculate role distribution
        const roleCounts = {
          'Decision Maker': 0,
          'Champion': 0,
          'Blocker': 0,
          'Stakeholder': 0,
          'Introducer': 0
        };

        peopleWithRoles.forEach(person => {
          const role = person.buyerGroupRole || 'Stakeholder';
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });

        // Create the buyer group
        const buyerGroupName = `${company.name} - Buyer Group`;
        const buyerGroupDescription = `Buyer group for ${company.name} with ${peopleWithRoles.length} people`;
        const buyerGroupPurpose = `To facilitate targeted sales and marketing efforts for ${company.name}`;

        const newBuyerGroup = await this.prisma.buyer_groups.create({
          data: {
            workspaceId: this.workspaceId,
            companyId: company.id,
            name: buyerGroupName,
            description: buyerGroupDescription,
            purpose: buyerGroupPurpose,
            status: 'active',
            priority: 'medium',
            people: {
              create: buyerGroupMembers
            },
            customFields: {
              roleDistribution: roleCounts,
              createdBy: 'automated_fix_script',
              createdAt: new Date().toISOString()
            }
          }
        });

        this.results.companiesProcessed++;
        this.results.buyerGroupsCreated++;
        this.results.peopleLinked += peopleWithRoles.length;

        console.log(`   ✅ Created buyer group "${buyerGroupName}" with ${peopleWithRoles.length} people`);
        console.log(`      Roles: ${Object.entries(roleCounts).filter(([role, count]) => count > 0).map(([role, count]) => `${count} ${role}`).join(', ')}`);

      } catch (error) {
        console.error(`   ❌ Failed to create buyer group for ${company.name}:`, error.message);
        this.results.errors.push(`Buyer group creation failed for ${company.name}: ${error.message}`);
      }
    }

    console.log('');
  }

  determineInfluenceLevel(role) {
    switch (role) {
      case 'Decision Maker': return 'high';
      case 'Champion': return 'high';
      case 'Introducer': return 'medium';
      case 'Stakeholder': return 'medium';
      case 'Blocker': return 'low';
      default: return 'medium';
    }
  }

  async generateFinalReport() {
    console.log('📋 STEP 3: Generating final report...');
    
    console.log('\n🎉 FINAL REPORT - REMAINING COMPANIES FIXED');
    console.log('============================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`✅ Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log(`✅ People linked to buyer groups: ${this.results.peopleLinked}`);
    console.log('');

    if (this.results.errors.length > 0) {
      console.log('❌ Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log('');
    }

    console.log('🎯 All companies with people now have formal buyer groups!');
  }
}

// Execute the fix
async function main() {
  const fixer = new FixRemainingCompanies();
  await fixer.execute();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = FixRemainingCompanies;
