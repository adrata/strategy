#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for TOP Companies Missing Buyer Groups
 * 
 * Runs buyer group discovery for all companies in TOP workspace
 * that don't have buyer group members yet
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { TOPBuyerGroupRunner } = require('./run-top-buyer-group');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

class TOPMissingBuyerGroupsRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
    this.results = [];
  }

  async run() {
    console.log('🚀 TOP Engineers Plus - Buyer Group Discovery for Missing Companies');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Get companies without buyer groups
      const companies = await this.getCompaniesNeedingBuyerGroups();
      console.log(`📊 Found ${companies.length} companies without buyer groups\n`);

      if (companies.length === 0) {
        console.log('✅ All companies already have buyer groups!');
        return;
      }

      // Process companies
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const company of companies) {
        processed++;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Processing ${processed}/${companies.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   Industry: ${company.industry || 'N/A'}`);
        console.log(`   Employees: ${company.employeeCount || 'N/A'}`);
        console.log(`   Revenue: ${company.revenue || 'N/A'}\n`);

        try {
          const identifier = company.website || company.linkedinUrl || company.name;
          const runner = new TOPBuyerGroupRunner();
          
          const result = await runner.run(identifier, {
            skipDatabase: false,
            companyData: {
              id: company.id,
              name: company.name,
              industry: company.industry,
              employeeCount: company.employeeCount,
              revenue: company.revenue
            }
          });

          if (result && result.buyerGroup && result.buyerGroup.length > 0) {
            // Verify we got real data
            const realEmails = result.buyerGroup.filter(m => {
              const email = m.email || (m.fullProfile?.email) || '';
              return email && !email.includes('@coresignal.temp') && email.includes('@');
            });

            const hasRealData = result.buyerGroup.some(m => 
              m.fullProfile || m.linkedinUrl || (m.email && !m.email.includes('@coresignal.temp'))
            );

            this.results.push({
              company: company.name,
              success: true,
              buyerGroupSize: result.buyerGroup.length,
              realEmails: realEmails.length,
              hasRealData: hasRealData
            });

            successful++;
            console.log(`✅ Success: ${result.buyerGroup.length} members, ${realEmails.length} real emails`);

            if (!hasRealData) {
              console.log(`⚠️  WARNING: Buyer group may not have complete data`);
            }
          } else {
            this.results.push({
              company: company.name,
              success: false,
              error: 'No buyer group returned'
            });
            failed++;
            console.log(`❌ Failed: No buyer group returned`);
          }

        } catch (error) {
          this.results.push({
            company: company.name,
            success: false,
            error: error.message
          });
          failed++;
          console.error(`❌ Error: ${error.message}`);
        }

        // Wait between companies to avoid rate limiting
        if (processed < companies.length) {
          console.log('\n⏳ Waiting 15 seconds before next company...');
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      // Summary
      this.printSummary(successful, failed);

    } catch (error) {
      console.error('❌ Error:', error.message);
      console.error(error.stack);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Get companies that need buyer groups
   */
  async getCompaniesNeedingBuyerGroups() {
    return await this.prisma.companies.findMany({
      where: {
        workspaceId: this.workspaceId,
        deletedAt: null,
        OR: [
          { website: { not: null } },
          { linkedinUrl: { not: null } }
        ],
        // Companies with no buyer group members
        people: {
          none: {
            deletedAt: null,
            isBuyerGroupMember: true
          }
        }
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        employeeCount: true,
        revenue: true
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Print summary
   */
  printSummary(successful, failed) {
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 FINAL SUMMARY');
    console.log('='.repeat(70));

    console.log(`\n✅ Successful: ${successful}`);
    const successfulResults = this.results.filter(r => r.success);
    if (successfulResults.length > 0) {
      console.log(`\n   Top 10 successful:`);
      successfulResults.slice(0, 10).forEach(r => {
        console.log(`   - ${r.company}: ${r.buyerGroupSize} members, ${r.realEmails} real emails`);
      });
      if (successfulResults.length > 10) {
        console.log(`   ... and ${successfulResults.length - 10} more`);
      }
    }

    if (failed > 0) {
      console.log(`\n❌ Failed: ${failed}`);
      const failedResults = this.results.filter(r => !r.success);
      console.log(`\n   Top 10 failed:`);
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
    console.log(`   - Success rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);

    console.log('\n✅ Processing complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TOPMissingBuyerGroupsRunner();
  runner.run().catch(console.error);
}

module.exports = { TOPMissingBuyerGroupsRunner };

