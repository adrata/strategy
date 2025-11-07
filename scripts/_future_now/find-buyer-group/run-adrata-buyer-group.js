#!/usr/bin/env node

/**
 * Adrata Workspace Buyer Group Discovery
 * 
 * Runs buyer group discovery for all companies in Dan's Adrata workspace
 * that don't have buyer group members yet.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('./index');

const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';

class AdrataBuyerGroupRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = ADRATA_WORKSPACE_ID;
    this.dealSize = 50000; // Default deal size for Adrata
    this.productCategory = 'sales'; // Sales intelligence software
  }

  async run() {
    console.log('🚀 Adrata Workspace - Buyer Group Discovery');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}`);
    console.log(`User: Dan Mirolli (${DAN_USER_ID})\n`);

    try {
      // Get companies without buyer groups
      const companies = await this.getCompaniesNeedingBuyerGroups();
      console.log(`📊 Found ${companies.length} companies needing buyer groups\n`);

      if (companies.length === 0) {
        console.log('✅ All companies already have buyer groups!');
        return;
      }

      let successful = 0;
      let failed = 0;
      const results = [];

      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Processing ${i + 1}/${companies.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}\n`);

        try {
          const identifier = company.website || company.linkedinUrl || company.name;
          const result = await this.runBuyerGroupDiscovery(company, identifier);

          if (result && result.buyerGroup && result.buyerGroup.length > 0) {
            const realEmails = result.buyerGroup.filter(m => {
              const email = m.email || (m.fullProfile?.email) || '';
              return email && !email.includes('@coresignal.temp') && email.includes('@');
            });

            results.push({
              company: company.name,
              success: true,
              buyerGroupSize: result.buyerGroup.length,
              realEmails: realEmails.length
            });

            successful++;
            console.log(`✅ Success: ${result.buyerGroup.length} members, ${realEmails.length} real emails`);
          } else {
            results.push({
              company: company.name,
              success: false,
              error: 'No buyer group returned'
            });
            failed++;
            console.log(`❌ Failed: No buyer group returned`);
          }
        } catch (error) {
          results.push({
            company: company.name,
            success: false,
            error: error.message
          });
          failed++;
          console.error(`❌ Error: ${error.message}`);
        }

        // Wait between companies
        if (i < companies.length - 1) {
          console.log('\n⏳ Waiting 15 seconds before next company...');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      // Summary
      this.printSummary(successful, failed, results);

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get companies that need buyer groups
   */
  async getCompaniesNeedingBuyerGroups() {
    // Get all companies in Adrata workspace
    const allCompanies = await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null,
                isBuyerGroupMember: true
              }
            }
          }
        }
      }
    });

    // Filter to companies with no buyer group members
    return allCompanies.filter(c => c._count.people === 0);
  }

  /**
   * Run buyer group discovery for a company
   * Uses workspace-specific company data from database
   */
  async runBuyerGroupDiscovery(company, identifier) {
    // ENHANCED: Pass full company object to ensure workspace-specific data is used
    const pipeline = new SmartBuyerGroupPipeline({
      workspaceId: this.workspaceId,
      dealSize: this.dealSize,
      productCategory: this.productCategory,
      usaOnly: false, // Adrata may have international companies
      prisma: this.prisma,
      skipDatabase: false
    });

    // Use workspace-specific company data (from database query)
    const companyData = {
      id: company.id, // Include ID so pipeline can use workspace-specific data
      name: company.name,
      linkedinUrl: company.linkedinUrl,
      website: company.website,
      industry: company.industry, // Workspace-specific industry
      employeeCount: company.employeeCount, // Workspace-specific employee count
      revenue: company.revenue, // Workspace-specific revenue
      // This ensures the pipeline uses Dan's workspace company data as context
    };

    console.log(`   📊 Using workspace company data: ${company.name}`);
    console.log(`   🏢 Industry: ${company.industry || 'N/A'}, Employees: ${company.employeeCount || 'N/A'}`);

    return await pipeline.run(companyData);
  }

  /**
   * Tag existing people as in or out of buyer group
   */
  async tagExistingPeople(buyerGroup, intelligence) {
    try {
      const company = await this.prisma.companies.findFirst({
        where: {
          workspaceId: this.workspaceId,
          OR: [
            { website: intelligence.website },
            { linkedinUrl: intelligence.linkedinUrl },
            { name: intelligence.companyName }
          ]
        }
      });

      if (!company) {
        console.log('⚠️  Company not found in database, skipping tagging');
        return;
      }

      // Get all people for this company
      const allPeople = await this.prisma.people.findMany({
        where: {
          companyId: company.id,
          workspaceId: this.workspaceId,
          deletedAt: null
        }
      });

      // Create a set of buyer group member identifiers
      const buyerGroupIdentifiers = new Set();
      buyerGroup.forEach(member => {
        if (member.email) buyerGroupIdentifiers.add(member.email.toLowerCase());
        if (member.linkedinUrl) buyerGroupIdentifiers.add(member.linkedinUrl);
        if (member.name) buyerGroupIdentifiers.add(member.name.toLowerCase());
      });

      // Tag people
      let taggedIn = 0;
      let taggedOut = 0;

      for (const person of allPeople) {
        const personIdentifiers = new Set();
        if (person.email) personIdentifiers.add(person.email.toLowerCase());
        if (person.linkedinUrl) personIdentifiers.add(person.linkedinUrl);
        if (person.name) personIdentifiers.add(person.name.toLowerCase());

        const isInBuyerGroup = Array.from(personIdentifiers).some(id => buyerGroupIdentifiers.has(id));

        const currentTags = person.tags || [];
        const newTags = currentTags.filter(t => t !== 'in_buyer_group' && t !== 'out_of_buyer_group');

        if (isInBuyerGroup) {
          newTags.push('in_buyer_group');
          taggedIn++;
        } else {
          newTags.push('out_of_buyer_group');
          taggedOut++;
        }

        await this.prisma.people.update({
          where: { id: person.id },
          data: { tags: newTags }
        });
      }

      console.log(`\n✅ Tagged ${taggedIn} people as in_buyer_group, ${taggedOut} as out_of_buyer_group`);
    } catch (error) {
      console.error('❌ Failed to tag existing people:', error.message);
    }
  }

  /**
   * Print summary
   */
  printSummary(successful, failed, results) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Successful: ${successful}`);
    const successfulResults = results.filter(r => r.success);
    if (successfulResults.length > 0) {
      successfulResults.slice(0, 10).forEach(r => {
        console.log(`   - ${r.company}: ${r.buyerGroupSize} members, ${r.realEmails} real emails`);
      });
      if (successfulResults.length > 10) {
        console.log(`   ... and ${successfulResults.length - 10} more`);
      }
    }

    if (failed > 0) {
      console.log(`\n❌ Failed: ${failed}`);
      const failedResults = results.filter(r => !r.success);
      failedResults.slice(0, 10).forEach(r => {
        console.log(`   - ${r.company}: ${r.error}`);
      });
      if (failedResults.length > 10) {
        console.log(`   ... and ${failedResults.length - 10} more`);
      }
    }

    const totalRealEmails = successfulResults.reduce((sum, r) => sum + (r.realEmails || 0), 0);
    const totalMembers = successfulResults.reduce((sum, r) => sum + (r.buyerGroupSize || 0), 0);

    console.log(`\n📧 Total Statistics:`);
    console.log(`   - Total buyer group members: ${totalMembers}`);
    console.log(`   - Total real emails: ${totalRealEmails}`);
    console.log(`   - Average members per company: ${successful > 0 ? (totalMembers / successful).toFixed(1) : 0}`);

    console.log('\n✅ Processing complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new AdrataBuyerGroupRunner();
  runner.run().catch(console.error);
}

module.exports = { AdrataBuyerGroupRunner };

