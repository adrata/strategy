#!/usr/bin/env node

/**
 * Run Buyer Group Discovery for All of Noel's Companies
 * 
 * Runs buyer group discovery for all companies assigned to Noel
 * in the Notary Everyday workspace. This includes the new companies
 * we just added across different verticals:
 * - Insurance Claims
 * - Auto Lending
 * - Estate Planning
 * - Credit Union
 * 
 * Usage: node scripts/users/run-buyer-groups-for-noel-companies.js
 * 
 * Options:
 *   --limit N        Process only first N companies (default: all)
 *   --start N        Start from company index N (default: 0)
 *   --company NAME   Run for specific company only
 *   --skip-db        Skip saving to database (testing mode)
 */

require('dotenv').config();
const { NotaryEverydayBuyerGroupRunner } = require('../data/enrichment/run-notary-everyday-buyer-group.cjs');

async function main() {
  console.log('\n============================================================');
  console.log('   BUYER GROUP DISCOVERY FOR NOEL\'S COMPANIES');
  console.log('============================================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {
    limit: null,
    startIndex: 0,
    company: null,
    skipDatabase: false
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      options.limit = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--start' && args[i + 1]) {
      options.startIndex = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--company' && args[i + 1]) {
      options.company = args[i + 1];
      i++;
    } else if (args[i] === '--skip-db') {
      options.skipDatabase = true;
    }
  }

  try {
    // Initialize runner
    const runner = new NotaryEverydayBuyerGroupRunner({
      dealSize: 35000, // $35K average deal size
      productCategory: 'notary-automation',
      productName: 'Notary Quality & Automation Platform'
    });

    // Initialize workspace and user
    await runner.initialize();

    if (options.company) {
      // Run for specific company
      const companies = await runner.getTargetCompanies();
      const company = companies.find(c =>
        c.name.toLowerCase().includes(options.company.toLowerCase())
      );

      if (!company) {
        console.error(`❌ Company not found: ${options.company}`);
        console.log('\nAvailable companies:');
        companies.slice(0, 10).forEach(c => console.log(`  - ${c.name}`));
        process.exit(1);
      }

      console.log(`\n🎯 Running buyer group discovery for: ${company.name}\n`);
      await runner.runForCompany(company, options);
    } else {
      // Run for all companies
      console.log('🚀 Running buyer group discovery for all of Noel\'s companies...\n');
      await runner.runAll(options);
    }

    console.log('\n✅ Buyer group discovery completed!\n');

  } catch (error) {
    console.error('❌ Execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Disconnect is handled by the runner
  }
}

main().catch(console.error);
