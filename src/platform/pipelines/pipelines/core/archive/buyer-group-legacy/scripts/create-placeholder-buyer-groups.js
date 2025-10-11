#!/usr/bin/env node

/**
 * 🎯 CREATE PLACEHOLDER BUYER GROUPS
 * 
 * Creates placeholder buyer groups for companies that can't be enriched
 * This ensures we have complete coverage for all companies
 */

const { PrismaClient } = require('@prisma/client');

class CreatePlaceholderBuyerGroups {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    this.results = {
      companiesProcessed: 0,
      buyerGroupsCreated: 0,
      errors: []
    };
  }

  async execute() {
    console.log('🎯 CREATING PLACEHOLDER BUYER GROUPS');
    console.log('===================================\n');

    try {
      const companies = await this.findCompaniesWithoutBuyerGroups();
      await this.createPlaceholderBuyerGroups(companies);
      this.generateReport();
    } catch (error) {
      console.error('❌ Processing failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findCompaniesWithoutBuyerGroups() {
    console.log('🔍 STEP 1: Finding companies without buyer groups...');
    
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        buyerGroups: { none: {} }
      },
      select: { 
        id: true, 
        name: true, 
        website: true,
        industry: true,
        _count: {
          select: { people: true }
        }
      }
    });

    console.log(`📊 Found ${companies.length} companies without buyer groups`);
    console.log('');

    // Show companies with people vs without people
    const companiesWithPeople = companies.filter(c => c._count.people > 0);
    const companiesWithoutPeople = companies.filter(c => c._count.people === 0);
    
    console.log(`   👥 Companies with people: ${companiesWithPeople.length}`);
    console.log(`   ❌ Companies without people: ${companiesWithoutPeople.length}`);
    console.log('');

    return companies;
  }

  async createPlaceholderBuyerGroups(companies) {
    console.log('🔍 STEP 2: Creating placeholder buyer groups...');
    
    for (const company of companies) {
      try {
        console.log(`\n🏢 Processing ${company.name}...`);
        
        if (company._count.people > 0) {
          // Company has people but no buyer group - create formal buyer group
          await this.createFormalBuyerGroup(company);
        } else {
          // Company has no people - create placeholder buyer group
          await this.createPlaceholderBuyerGroup(company);
        }
        
        this.results.companiesProcessed++;
        this.results.buyerGroupsCreated++;
        
        console.log(`   ✅ Created buyer group for ${company.name}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to create buyer group for ${company.name}:`, error.message);
        this.results.errors.push(`Company ${company.name}: ${error.message}`);
      }
    }
  }

  async createFormalBuyerGroup(company) {
    // Get all people for this company
    const people = await this.prisma.people.findMany({
      where: { companyId: company.id },
      select: { id: true, buyerGroupRole: true }
    });

    if (people.length === 0) {
      throw new Error('No people found for company');
    }

    // Calculate role distribution
    const roleCounts = {
      'Decision Maker': 0,
      'Champion': 0,
      'Blocker': 0,
      'Stakeholder': 0,
      'Introducer': 0
    };

    people.forEach(person => {
      const role = person.buyerGroupRole || 'Stakeholder';
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    // Create buyer group members
    const buyerGroupMembers = people.map(person => ({
      personId: person.id,
      influence: this.determineInfluenceLevel(person.buyerGroupRole),
      isPrimary: person.buyerGroupRole === 'Decision Maker'
    }));

    // Create the buyer group
    await this.prisma.buyer_groups.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: company.id,
        name: `${company.name} - Buyer Group`,
        description: `Formal buyer group for ${company.name} with ${people.length} people`,
        purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
        status: 'active',
        priority: 'medium',
        people: {
          create: buyerGroupMembers
        },
        customFields: {
          roleDistribution: roleCounts,
          createdBy: 'formal_buyer_group_creation',
          createdAt: new Date().toISOString(),
          type: 'formal'
        }
      }
    });

    console.log(`   🎯 Created formal buyer group with ${people.length} people`);
  }

  async createPlaceholderBuyerGroup(company) {
    // Create a placeholder buyer group for companies without people
    await this.prisma.buyer_groups.create({
      data: {
        workspaceId: this.workspaceId,
        companyId: company.id,
        name: `${company.name} - Buyer Group (Placeholder)`,
        description: `Placeholder buyer group for ${company.name} - needs employee discovery`,
        purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
        status: 'pending',
        priority: 'low',
        customFields: {
          createdBy: 'placeholder_buyer_group_creation',
          createdAt: new Date().toISOString(),
          type: 'placeholder',
          needsEmployeeDiscovery: true,
          website: company.website,
          industry: company.industry
        }
      }
    });

    console.log(`   📝 Created placeholder buyer group (needs employee discovery)`);
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

  generateReport() {
    console.log('\n🎉 PLACEHOLDER BUYER GROUPS REPORT');
    console.log('==================================');
    console.log(`✅ Companies processed: ${this.results.companiesProcessed}`);
    console.log(`🎯 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. All companies now have buyer groups (formal or placeholder)');
    console.log('   2. Placeholder buyer groups can be updated when employees are discovered');
    console.log('   3. Run final validation to confirm complete coverage');
    console.log('\n🚀 Placeholder buyer groups creation complete!');
  }
}

if (require.main === module) {
  const processor = new CreatePlaceholderBuyerGroups();
  processor.execute().catch(console.error);
}

module.exports = CreatePlaceholderBuyerGroups;
