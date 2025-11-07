#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for TOP - Verified Batch
 * 
 * Runs buyer group discovery on a small batch of companies first
 * to verify we're getting complete buyer groups with real data
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { TOPBuyerGroupRunner } = require('./run-top-buyer-group');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';

// Start with 5 companies that are likely to have good data
const TEST_COMPANIES = [
  'https://www.pge.com', // Pacific Gas and Electric
  'https://www.sce.com', // Southern California Edison
  'https://www.ladwp.com', // Los Angeles Department of Water and Power
  'https://www.srpnet.com', // Salt River Project (already has 39 members - good for verification)
  'https://www.avistacorp.com' // Avista Corp
];

class TOPVerifiedBatchRunner {
  constructor() {
    this.prisma = new PrismaClient();
    this.workspaceId = TOP_WORKSPACE_ID;
  }

  async run() {
    console.log('🚀 TOP Engineers Plus - Verified Buyer Group Discovery Batch');
    console.log('='.repeat(70));
    console.log(`Testing ${TEST_COMPANIES.length} companies to verify quality\n`);

    const results = [];

    for (let i = 0; i < TEST_COMPANIES.length; i++) {
      const companyUrl = TEST_COMPANIES[i];
      console.log(`\n${'='.repeat(70)}`);
      console.log(`\n📊 Test ${i + 1}/${TEST_COMPANIES.length}: ${companyUrl}\n`);

      try {
        const runner = new TOPBuyerGroupRunner();
        const result = await runner.run(companyUrl, {
          skipDatabase: false
        });

        if (result && result.buyerGroup) {
          // Verify data quality
          const realEmails = result.buyerGroup.filter(m => {
            const email = m.email || (m.fullProfile?.email) || '';
            return email && !email.includes('@coresignal.temp') && email.includes('@');
          });

          const hasLinkedIn = result.buyerGroup.filter(m => m.linkedinUrl).length;
          const hasFullProfiles = result.buyerGroup.filter(m => m.fullProfile).length;
          const hasRealData = result.buyerGroup.some(m => 
            m.fullProfile || m.linkedinUrl || (m.email && !m.email.includes('@coresignal.temp'))
          );

          const buyerGroupSize = result.buyerGroup.length;
          const employeeCount = result.intelligence?.employeeCount || 0;
          
          // Use actual sizing logic from the system
          let expectedMin = 1;
          let expectedIdeal = 3;
          if (employeeCount <= 1) {
            expectedMin = 1;
            expectedIdeal = 1;
          } else if (employeeCount <= 3) {
            expectedMin = 1;
            expectedIdeal = 2;
          } else if (employeeCount <= 5) {
            expectedMin = 1;
            expectedIdeal = 3;
          } else if (employeeCount <= 100) {
            expectedMin = 3;
            expectedIdeal = 5;
          } else if (employeeCount <= 500) {
            expectedMin = 4;
            expectedIdeal = 6;
          } else {
            expectedMin = 6;
            expectedIdeal = 8;
          }

          // Complete if we have at least the minimum, or if we have real data and it's a small company
          const isComplete = buyerGroupSize >= expectedMin || 
            (hasRealData && buyerGroupSize >= Math.max(1, expectedIdeal * 0.5));

          results.push({
            company: companyUrl,
            success: true,
            buyerGroupSize,
            expectedSize,
            isComplete,
            realEmails: realEmails.length,
            hasLinkedIn,
            hasFullProfiles,
            hasRealData,
            intelligence: result.intelligence
          });

          console.log(`\n✅ Results:`);
          console.log(`   - Buyer Group Size: ${buyerGroupSize} (expected: ${expectedSize})`);
          console.log(`   - Complete: ${isComplete ? '✅ Yes' : '⚠️  No (may need more)'}`);
          console.log(`   - Real Emails: ${realEmails.length}`);
          console.log(`   - LinkedIn URLs: ${hasLinkedIn}`);
          console.log(`   - Full Profiles: ${hasFullProfiles}`);
          console.log(`   - Has Real Data: ${hasRealData ? '✅ Yes' : '❌ No'}`);

          if (!isComplete) {
            console.log(`\n⚠️  WARNING: Buyer group may be incomplete. Expected ~${expectedSize} members, got ${buyerGroupSize}`);
          }

          if (!hasRealData) {
            console.log(`\n⚠️  WARNING: Buyer group may not have complete data (no full profiles, LinkedIn, or real emails)`);
          }

        } else {
          results.push({
            company: companyUrl,
            success: false,
            error: 'No buyer group returned'
          });
          console.log(`\n❌ Failed: No buyer group returned`);
        }

      } catch (error) {
        results.push({
          company: companyUrl,
          success: false,
          error: error.message
        });
        console.error(`\n❌ Error: ${error.message}`);
      }

      // Wait between companies
      if (i < TEST_COMPANIES.length - 1) {
        console.log('\n⏳ Waiting 15 seconds before next company...');
        await new Promise(resolve => setTimeout(resolve, 15000));
      }
    }

    // Summary
    console.log(`\n${'='.repeat(70)}`);
    console.log('\n📊 VERIFICATION SUMMARY');
    console.log('='.repeat(70));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const complete = successful.filter(r => r.isComplete);
    const hasRealData = successful.filter(r => r.hasRealData);

    console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
    console.log(`   - Complete buyer groups: ${complete.length}`);
    console.log(`   - Has real data: ${hasRealData.length}`);

    if (failed.length > 0) {
      console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
      failed.forEach(r => console.log(`   - ${r.company}: ${r.error}`));
    }

    const avgSize = successful.length > 0 
      ? successful.reduce((sum, r) => sum + (r.buyerGroupSize || 0), 0) / successful.length 
      : 0;
    const totalRealEmails = successful.reduce((sum, r) => sum + (r.realEmails || 0), 0);

    console.log(`\n📊 Quality Metrics:`);
    console.log(`   - Average buyer group size: ${avgSize.toFixed(1)}`);
    console.log(`   - Total real emails: ${totalRealEmails}`);
    console.log(`   - Completion rate: ${complete.length}/${successful.length} (${successful.length > 0 ? Math.round((complete.length / successful.length) * 100) : 0}%)`);

    if (complete.length === successful.length && hasRealData.length === successful.length) {
      console.log(`\n✅ VERIFICATION PASSED: All buyer groups are complete with real data!`);
      console.log(`   Ready to run on all companies.\n`);
    } else {
      console.log(`\n⚠️  VERIFICATION ISSUES FOUND:`);
      if (complete.length < successful.length) {
        console.log(`   - ${successful.length - complete.length} buyer groups may be incomplete`);
      }
      if (hasRealData.length < successful.length) {
        console.log(`   - ${successful.length - hasRealData.length} buyer groups may lack real data`);
      }
      console.log(`   - Review results before running on all companies\n`);
    }

    await this.prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new TOPVerifiedBatchRunner();
  runner.run().catch(console.error);
}

module.exports = { TOPVerifiedBatchRunner };

