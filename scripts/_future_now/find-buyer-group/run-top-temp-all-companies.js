#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for All Top-Temp Companies
 * 
 * Runs buyer group discovery for all companies in top-temp workspace
 * with USA-only enabled and ensures complete buyer groups with real data.
 * Respects mainSellerId from company records.
 */

// Load .env.local first (from Vercel), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // .env as fallback
const { PrismaClient } = require('@prisma/client');
const { TopTempBuyerGroupRunner } = require('./run-top-temp-buyer-group');

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

class TopTempAllCompaniesRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_TEMP_WORKSPACE_ID;
    this.results = [];
  }

  async run() {
    console.log('🚀 Top-Temp - Full Buyer Group Discovery');
    console.log('='.repeat(70));
    console.log(`Workspace: ${this.workspaceId}\n`);

    try {
      // Get all companies with websites or LinkedIn URLs
      const companies = await this.getCompanies();
      console.log(`📊 Found ${companies.length} companies to process\n`);

      if (companies.length === 0) {
        console.log('❌ No companies found. Exiting.');
        return;
      }

      // Process ALL companies (re-running buyer group discovery)
      const companiesToProcess = companies.map(c => ({
        ...c,
        peopleCount: c._count.people
      }));
      console.log(`🎯 Processing ALL ${companiesToProcess.length} companies (re-running buyer group discovery)\n`);

      // Process companies
      let processed = 0;
      let successful = 0;
      let failed = 0;

      for (const company of companiesToProcess) {
        processed++;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`\n📊 Processing ${processed}/${companiesToProcess.length}: ${company.name}`);
        console.log(`   Website: ${company.website || 'N/A'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'N/A'}`);
        console.log(`   People: ${company.peopleCount || 0}`);
        console.log(`   Main Seller: ${company.mainSellerId || 'Not assigned'}`);
        console.log('');

        try {
          const identifier = company.website || company.linkedinUrl || company.name;
          const runner = new TopTempBuyerGroupRunner({
            mainSellerId: company.mainSellerId // Use company's mainSellerId
          });
          
          const result = await runner.run(identifier, {
            skipDatabase: false
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
              hasRealData: hasRealData,
              intelligence: result.intelligence,
              mainSellerId: company.mainSellerId
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
              error: 'No buyer group returned',
              mainSellerId: company.mainSellerId
            });
            failed++;
            console.log(`❌ Failed: No buyer group returned`);
          }

        } catch (error) {
          this.results.push({
            company: company.name,
            success: false,
            error: error.message,
            mainSellerId: company.mainSellerId
          });
          failed++;
          console.error(`❌ Error: ${error.message}`);
        }

        // Wait between companies to avoid rate limiting
        if (processed < companiesToProcess.length) {
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
   * Get all companies for top-temp workspace
   */
  async getCompanies() {
    return await this.prisma.companies.findMany({
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
        industry: true,
        mainSellerId: true,
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
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Filter companies that need buyer groups
   */
  async filterCompaniesNeedingBuyerGroups(companies) {
    const needsBuyerGroup = [];

    for (const company of companies) {
      const peopleCount = company._count.people;
      
      // Company needs buyer group if:
      // 1. Has no buyer group members, OR
      // 2. Has less than 3 buyer group members (incomplete)
      if (peopleCount === 0 || peopleCount < 3) {
        needsBuyerGroup.push({
          ...company,
          peopleCount
        });
      }
    }

    return needsBuyerGroup;
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
    successfulResults.forEach(r => {
      console.log(`   - ${r.company}: ${r.buyerGroupSize} members, ${r.realEmails} real emails${r.mainSellerId ? ` (Seller: ${r.mainSellerId})` : ''}`);
    });

    if (failed > 0) {
      console.log(`\n❌ Failed: ${failed}`);
      const failedResults = this.results.filter(r => !r.success);
      failedResults.forEach(r => {
        console.log(`   - ${r.company}: ${r.error}${r.mainSellerId ? ` (Seller: ${r.mainSellerId})` : ''}`);
      });
    }

    const totalRealEmails = successfulResults.reduce((sum, r) => sum + (r.realEmails || 0), 0);
    const totalMembers = successfulResults.reduce((sum, r) => sum + (r.buyerGroupSize || 0), 0);

    console.log(`\n📧 Total Statistics:`);
    console.log(`   - Total buyer group members: ${totalMembers}`);
    console.log(`   - Total real emails: ${totalRealEmails}`);
    console.log(`   - Average members per company: ${successful > 0 ? (totalMembers / successful).toFixed(1) : 0}`);

    // Group by seller
    const bySeller = {};
    successfulResults.forEach(r => {
      const sellerId = r.mainSellerId || 'unassigned';
      if (!bySeller[sellerId]) {
        bySeller[sellerId] = { companies: 0, members: 0, emails: 0 };
      }
      bySeller[sellerId].companies++;
      bySeller[sellerId].members += r.buyerGroupSize || 0;
      bySeller[sellerId].emails += r.realEmails || 0;
    });

    if (Object.keys(bySeller).length > 0) {
      console.log(`\n👤 By Seller:`);
      Object.entries(bySeller).forEach(([sellerId, stats]) => {
        console.log(`   - ${sellerId}: ${stats.companies} companies, ${stats.members} members, ${stats.emails} emails`);
      });
    }

    console.log('\n✅ Processing complete!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TopTempAllCompaniesRunner();
  runner.run().catch(console.error);
}

module.exports = { TopTempAllCompaniesRunner };

