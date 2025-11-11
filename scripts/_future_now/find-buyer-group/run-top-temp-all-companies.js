#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for All Top-Temp Companies
 * 
 * Runs buyer group discovery for all companies in top-temp workspace
 * with USA-only enabled and ensures complete buyer groups with real data.
 * Respects mainSellerId from company records.
 * 
 * Uses updated pipeline with:
 * - Deal size range: $150K-$500K+ (average $300K)
 * - LinkedIn URL priority for company matching
 * - Enhanced validation that trusts LinkedIn search results
 * - API key cleaning for all services (Coresignal, Lusha, Prospeo, Claude)
 * - Automatic tagging of existing people as in/out of buyer group
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
      console.log(`📊 Found ${companies.length} companies total\n`);

      if (companies.length === 0) {
        console.log('❌ No companies found. Exiting.');
        return;
      }

      // Filter to only companies that don't have buyer groups yet
      const companiesWithBuyerGroups = await this.prisma.buyerGroups.findMany({
        where: {
          workspaceId: this.workspaceId,
          companyId: { not: null }
        },
        select: {
          companyId: true
        }
      });
      
      const processedCompanyIds = new Set(companiesWithBuyerGroups.map(bg => bg.companyId).filter(Boolean));
      
      const companiesToProcess = companies
        .filter(c => !processedCompanyIds.has(c.id))
        .map(c => ({
          ...c,
          peopleCount: c._count.people
        }));
      
      console.log(`📊 Companies already processed: ${processedCompanyIds.size}`);
      console.log(`🎯 Companies to process: ${companiesToProcess.length}`);
      console.log(`⏭️  Skipping ${companies.length - companiesToProcess.length} companies that already have buyer groups\n`);

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
          // Prioritize LinkedIn URL (most reliable) over website
          const identifier = company.linkedinUrl || company.website || company.name;
          const runner = new TopTempBuyerGroupRunner({
            mainSellerId: company.mainSellerId // Use company's mainSellerId
          });
          
          const result = await runner.run(identifier, {
            skipDatabase: false
          });

          // A successful run means the pipeline completed, even if no members were found
          // (0 members is a valid result - it means no employees were found in Coresignal)
          if (result && result.buyerGroup !== undefined) {
            const buyerGroupSize = result.buyerGroup.length || 0;
            
            // Verify we got real data (only if there are members)
            const realEmails = buyerGroupSize > 0 ? result.buyerGroup.filter(m => {
              const email = m.email || (m.fullProfile?.email) || '';
              return email && !email.includes('@coresignal.temp') && email.includes('@');
            }) : [];

            const hasRealData = buyerGroupSize > 0 && result.buyerGroup.some(m => 
              m.fullProfile || m.linkedinUrl || (m.email && !m.email.includes('@coresignal.temp'))
            );

            this.results.push({
              company: company.name,
              success: true,
              buyerGroupSize: buyerGroupSize,
              realEmails: realEmails.length,
              hasRealData: hasRealData,
              intelligence: result.intelligence,
              mainSellerId: company.mainSellerId
            });

            successful++;
            
            if (buyerGroupSize === 0) {
              console.log(`✅ Success: 0 members found (no employees in Coresignal for this company)`);
            } else {
              console.log(`✅ Success: ${buyerGroupSize} members, ${realEmails.length} real emails`);
              if (!hasRealData) {
                console.log(`⚠️  WARNING: Buyer group may not have complete data`);
              }
            }
          } else {
            // This is a real failure - pipeline didn't return a result object
            this.results.push({
              company: company.name,
              success: false,
              error: 'No buyer group returned from pipeline',
              mainSellerId: company.mainSellerId
            });
            failed++;
            console.log(`❌ Failed: Pipeline did not return results`);
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

