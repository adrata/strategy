#!/usr/bin/env node

/**
 * 🎯 RUN NOTARY EVERYDAY BUYER GROUP INTELLIGENCE
 * 
 * Run Level 1 (IDENTIFY) buyer group intelligence for all companies with linked people
 * This will assign buyer group roles and enrich both people and companies
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

class NotaryBuyerGroupIntelligence {
  constructor() {
    this.workspaceId = null;
    this.results = {
      totalCompanies: 0,
      companiesProcessed: 0,
      peopleWithRoles: 0,
      peopleUpdated: 0,
      buyerGroupsCreated: 0,
      errors: []
    };
  }

  async findNotaryEverydayWorkspace() {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }

    this.workspaceId = workspace.id;
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    return workspace;
  }

  async getCompaniesWithLinkedPeople() {
    console.log('\n🏢 Getting companies with linked people...');
    
    // Get companies that have people linked to them
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        people: {
          some: {
            companyId: { not: null }
          }
        }
      },
      include: {
        people: {
          where: {
            companyId: { not: null }
          },
          select: {
            id: true,
            fullName: true,
            jobTitle: true,
            buyerGroupRole: true,
            decisionPower: true,
            influenceLevel: true,
            enrichedData: true,
            customFields: true
          }
        }
      }
    });

    this.results.totalCompanies = companies.length;
    console.log(`   📊 Found ${companies.length} companies with linked people`);
    
    // Count total people across all companies
    const totalPeople = companies.reduce((sum, company) => sum + company.people.length, 0);
    console.log(`   📊 Total linked people: ${totalPeople}`);

    return companies;
  }

  determineBuyerGroupRole(person, company) {
    const title = (person.jobTitle || '').toLowerCase();
    const enrichedData = person.enrichedData || person.customFields?.enrichedData || {};
    const seniority = enrichedData.career?.seniority || '';
    const department = enrichedData.career?.department || '';

    // Decision Makers (C-level, VPs with budget authority)
    if (title.includes('ceo') || title.includes('president') || 
        title.includes('cfo') || title.includes('cto') || 
        title.includes('coo') || title.includes('owner') ||
        (title.includes('vp') && title.includes('finance')) ||
        seniority.toLowerCase().includes('executive')) {
      return 'Decision Maker';
    }
    
    // Champions (operational leaders who benefit from the solution)
    if (title.includes('director') || title.includes('head of') || 
        title.includes('vp') || title.includes('manager') ||
        title.includes('lead') || title.includes('supervisor') ||
        seniority.toLowerCase().includes('manager')) {
      return 'Champion';
    }
    
    // Blockers (procurement, legal, security)
    if (title.includes('procurement') || title.includes('legal') || 
        title.includes('security') || title.includes('compliance') ||
        title.includes('audit') || title.includes('risk')) {
      return 'Blocker';
    }
    
    // Introducers (customer-facing, sales, account management)
    if (title.includes('sales') || title.includes('account') || 
        title.includes('customer success') || title.includes('business development') ||
        title.includes('relationship') || title.includes('client')) {
      return 'Introducer';
    }
    
    // Stakeholders (everyone else)
    return 'Stakeholder';
  }

  determineInfluenceLevel(role) {
    switch (role) {
      case 'Decision Maker': return 'High';
      case 'Champion': return 'High';
      case 'Blocker': return 'Medium';
      case 'Introducer': return 'Medium';
      case 'Stakeholder': return 'Low';
      default: return 'Low';
    }
  }

  determineDecisionPower(role) {
    switch (role) {
      case 'Decision Maker': return 100;
      case 'Champion': return 80;
      case 'Blocker': return 60;
      case 'Introducer': return 40;
      case 'Stakeholder': return 20;
      default: return 20;
    }
  }

  async updatePersonWithBuyerGroupRole(person, role, company) {
    try {
      const influenceLevel = this.determineInfluenceLevel(role);
      const decisionPower = this.determineDecisionPower(role);

      await prisma.people.update({
        where: { id: person.id },
        data: {
          buyerGroupRole: role,
          influenceLevel: influenceLevel,
          decisionPower: decisionPower,
          customFields: {
            ...person.customFields,
            buyerGroupRoleAssigned: new Date().toISOString(),
            roleAssignmentMethod: 'automated_buyer_group_intelligence',
            roleAssignmentReason: `Assigned based on job title: ${person.jobTitle || 'Unknown'}`,
            companyContext: company.name
          }
        }
      });

      this.results.peopleUpdated++;
      console.log(`   ✅ Updated ${person.fullName}: ${role} (${influenceLevel} influence, ${decisionPower}% decision power)`);
    } catch (error) {
      console.error(`   ❌ Failed to update ${person.fullName}: ${error.message}`);
      this.results.errors.push(`Failed to update ${person.fullName}: ${error.message}`);
    }
  }

  async createBuyerGroup(company, people) {
    try {
      if (people.length === 0) {
        return false;
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
      const buyerGroup = await prisma.buyer_groups.create({
        data: {
          workspaceId: this.workspaceId,
          companyId: company.id,
          name: `${company.name} - Buyer Group`,
          description: `Buyer group for ${company.name} with ${people.length} people`,
          purpose: `To facilitate targeted sales and marketing efforts for ${company.name}`,
          status: 'active',
          priority: 'medium',
          people: {
            create: buyerGroupMembers
          },
          customFields: {
            roleDistribution: roleCounts,
            createdBy: 'notary_buyer_group_intelligence',
            createdAt: new Date().toISOString(),
            enrichmentLevel: 'identify',
            totalMembers: people.length
          }
        }
      });

      this.results.buyerGroupsCreated++;
      console.log(`   🎯 Created buyer group: ${buyerGroup.name} (${people.length} members)`);
      return true;

    } catch (error) {
      console.error(`   ❌ Failed to create buyer group for ${company.name}: ${error.message}`);
      this.results.errors.push(`Failed to create buyer group for ${company.name}: ${error.message}`);
      return false;
    }
  }

  async processCompany(company) {
    console.log(`\n🏢 Processing: ${company.name} (${company.people.length} people)`);
    
    let peopleWithRoles = 0;
    const updatedPeople = [];

    // Process each person in the company
    for (const person of company.people) {
      // Determine buyer group role
      const role = this.determineBuyerGroupRole(person, company);
      
      // Update person with role
      await this.updatePersonWithBuyerGroupRole(person, role, company);
      
      // Track updated person
      updatedPeople.push({
        ...person,
        buyerGroupRole: role,
        influenceLevel: this.determineInfluenceLevel(role),
        decisionPower: this.determineDecisionPower(role)
      });
      
      peopleWithRoles++;
    }

    this.results.peopleWithRoles += peopleWithRoles;

    // Create buyer group for the company
    await this.createBuyerGroup(company, updatedPeople);

    this.results.companiesProcessed++;
    console.log(`   ✅ Completed: ${company.name} (${peopleWithRoles} people with roles)`);
  }

  async processCompaniesInBatches(companies, batchSize = 10) {
    console.log(`\n🔄 Processing companies in batches of ${batchSize}...`);
    
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(companies.length / batchSize)}`);
      
      for (const company of batch) {
        try {
          await this.processCompany(company);
        } catch (error) {
          console.error(`❌ Error processing company ${company.name}: ${error.message}`);
          this.results.errors.push(`Error processing company ${company.name}: ${error.message}`);
        }
      }

      // Progress update
      const processed = Math.min(i + batchSize, companies.length);
      console.log(`   📈 Progress: ${processed}/${companies.length} companies processed`);
    }
  }

  async generateReport() {
    console.log('\n📊 GENERATING BUYER GROUP INTELLIGENCE REPORT...');
    
    // Calculate final statistics
    const totalPeopleWithRoles = await prisma.people.count({
      where: { 
        workspaceId: this.workspaceId,
        buyerGroupRole: { not: null }
      }
    });

    const totalBuyerGroups = await prisma.buyer_groups.count({
      where: { workspaceId: this.workspaceId }
    });

    const report = {
      timestamp: new Date().toISOString(),
      workspaceId: this.workspaceId,
      results: this.results,
      finalStats: {
        totalCompanies: this.results.totalCompanies,
        companiesProcessed: this.results.companiesProcessed,
        totalPeopleWithRoles,
        totalBuyerGroups,
        peopleUpdated: this.results.peopleUpdated,
        buyerGroupsCreated: this.results.buyerGroupsCreated
      }
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'notary-buyer-group-intelligence-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${reportPath}`);

    // Display summary
    console.log('\n🎯 BUYER GROUP INTELLIGENCE RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`📊 Total companies: ${this.results.totalCompanies}`);
    console.log(`📊 Companies processed: ${this.results.companiesProcessed}`);
    console.log(`📊 People with roles: ${totalPeopleWithRoles}`);
    console.log(`📊 People updated: ${this.results.peopleUpdated}`);
    console.log(`📊 Buyer groups created: ${this.results.buyerGroupsCreated}`);
    console.log(`📊 Errors: ${this.results.errors.length}`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.results.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      if (this.results.errors.length > 10) {
        console.log(`   ... and ${this.results.errors.length - 10} more errors`);
      }
    }

    return report;
  }

  async run() {
    try {
      console.log('🎯 NOTARY EVERYDAY BUYER GROUP INTELLIGENCE');
      console.log('='.repeat(50));
      
      // Find workspace
      await this.findNotaryEverydayWorkspace();
      
      // Get companies with linked people
      const companies = await this.getCompaniesWithLinkedPeople();
      
      if (companies.length === 0) {
        console.log('❌ No companies found with linked people');
        return;
      }
      
      // Process companies in batches
      await this.processCompaniesInBatches(companies);
      
      // Generate report
      await this.generateReport();
      
      console.log('\n🎉 Buyer group intelligence completed successfully!');
      
    } catch (error) {
      console.error('❌ Fatal error during buyer group intelligence:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the script
if (require.main === module) {
  const intelligence = new NotaryBuyerGroupIntelligence();
  intelligence.run()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = NotaryBuyerGroupIntelligence;
