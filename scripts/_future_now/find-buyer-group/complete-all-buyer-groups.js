#!/usr/bin/env node

/**
 * Complete All Buyer Groups - Comprehensive Retry System
 * 
 * 1. Waits for TOP to finish
 * 2. Finds all failed companies in TOP workspace
 * 3. Retries with enhanced methods until all have buyer groups
 * 4. Does the same for Dan's Adrata workspace
 * 5. Continues improving until 100% coverage
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { RetryFailedCompanies } = require('./retry-failed-companies');
const fs = require('fs');

const TOP_WORKSPACE_ID = '01K75ZD7DWHG1XF16HAF2YVKCK';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';
const TOP_LOG_FILE = '/tmp/top-buyer-group-enhanced-run.log';

class CompleteAllBuyerGroups {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPLETE ALL BUYER GROUPS - Comprehensive System');
    console.log('='.repeat(70));
    console.log('');

    try {
      // Step 1: Wait for TOP to finish
      console.log('📊 Step 1: Checking TOP workspace status...');
      await this.waitForTOPToFinish();
      
      // Step 2: Process TOP workspace
      console.log('\n📊 Step 2: Processing TOP workspace failed companies...');
      const topResults = await this.processWorkspace(TOP_WORKSPACE_ID, 'TOP Engineers Plus');
      
      // Step 3: Process Adrata workspace
      console.log('\n📊 Step 3: Processing Adrata workspace failed companies...');
      const adrataResults = await this.processWorkspace(ADRATA_WORKSPACE_ID, 'Adrata (Dan)');
      
      // Final summary
      this.printFinalSummary(topResults, adrataResults);

    } catch (error) {
      console.error('❌ Error:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Wait for TOP process to finish
   */
  async waitForTOPToFinish() {
    const maxWaitTime = 3600000; // 1 hour max
    const checkInterval = 30000; // Check every 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      if (!fs.existsSync(TOP_LOG_FILE)) {
        console.log('⚠️  TOP log file not found, assuming complete');
        return;
      }

      const content = fs.readFileSync(TOP_LOG_FILE, 'utf-8');
      
      if (content.includes('FINAL SUMMARY') || content.includes('Processing complete')) {
        console.log('✅ TOP process is complete!');
        return;
      }

      // Check if process is still running
      const matches = content.match(/Processing (\d+)\/(\d+):/g);
      if (matches) {
        const lastMatch = matches[matches.length - 1];
        const [, current, total] = lastMatch.match(/Processing (\d+)\/(\d+):/);
        const percent = ((parseInt(current) / parseInt(total)) * 100).toFixed(1);
        console.log(`⏳ TOP still running: ${current}/${total} (${percent}%)`);
      }

      console.log('   Waiting 30 seconds before next check...');
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    console.log('⚠️  Max wait time reached, proceeding anyway');
  }

  /**
   * Process a workspace - retry failed companies until all have buyer groups
   */
  async processWorkspace(workspaceId, workspaceName) {
    let iteration = 1;
    let totalSuccessful = 0;
    let totalFailed = 0;
    const allResults = [];
    const maxIterations = 5; // Increased to 5 for maximum coverage

    while (true) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`\n🔄 ${workspaceName} - Iteration ${iteration}`);
      console.log('='.repeat(70));

      const retry = new RetryFailedCompanies(workspaceId, workspaceName);
      const results = await retry.run();

      totalSuccessful += results.successful;
      totalFailed = results.failed;
      allResults.push(results);

      // If no failures, we're done!
      if (results.failed === 0) {
        console.log(`\n✅ ${workspaceName} - All companies now have buyer groups!`);
        break;
      }

      // If we've tried max times and still have failures, log and continue
      if (iteration >= maxIterations) {
        console.log(`\n⚠️  ${workspaceName} - Reached max iterations (${maxIterations})`);
        console.log(`   ${results.failed} companies still without buyer groups`);
        console.log(`   These may be companies not in Coresignal database`);
        console.log(`   Consider manual research or Perplexity API for these companies`);
        break;
      }

      iteration++;
      console.log(`\n⏳ Waiting 60 seconds before next iteration...`);
      await new Promise(resolve => setTimeout(resolve, 60000));
    }

    return {
      workspaceName,
      totalSuccessful,
      totalFailed,
      iterations: iteration,
      results: allResults
    };
  }

  /**
   * Print final summary
   */
  printFinalSummary(topResults, adrataResults) {
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL SUMMARY - ALL WORKSPACES');
    console.log('='.repeat(70));

    console.log(`\n✅ TOP Engineers Plus:`);
    console.log(`   - Successful: ${topResults.totalSuccessful}`);
    console.log(`   - Still Failed: ${topResults.totalFailed}`);
    console.log(`   - Iterations: ${topResults.iterations}`);

    console.log(`\n✅ Adrata (Dan):`);
    console.log(`   - Successful: ${adrataResults.totalSuccessful}`);
    console.log(`   - Still Failed: ${adrataResults.totalFailed}`);
    console.log(`   - Iterations: ${adrataResults.iterations}`);

    const totalSuccessful = topResults.totalSuccessful + adrataResults.totalSuccessful;
    const totalFailed = topResults.totalFailed + adrataResults.totalFailed;

    console.log(`\n📊 Overall:`);
    console.log(`   - Total Successful: ${totalSuccessful}`);
    console.log(`   - Total Still Failed: ${totalFailed}`);
    console.log(`   - Success Rate: ${totalFailed === 0 ? '100%' : ((totalSuccessful / (totalSuccessful + totalFailed)) * 100).toFixed(1) + '%'}`);

    if (totalFailed > 0) {
      console.log(`\n⚠️  Note: ${totalFailed} companies still without buyer groups.`);
      console.log(`   These are likely companies not in Coresignal database or with no LinkedIn presence.`);
      console.log(`   Consider manual research or Perplexity API for these companies.`);
    } else {
      console.log(`\n🎉 SUCCESS! All companies now have buyer groups!`);
    }

    console.log('\n✅ Complete buyer group discovery finished!\n');
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new CompleteAllBuyerGroups();
  runner.run().catch(console.error);
}

module.exports = { CompleteAllBuyerGroups };

