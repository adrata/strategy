#!/usr/bin/env node

/**
 * Test Script: Run buyer group discovery for 3 electric utility companies
 * 
 * Tests the system with real companies to ensure:
 * - Accurate company data
 * - Real email addresses (no @coresignal.temp)
 * - Good buyer group discovery
 */

require('dotenv').config();
const { TOPBuyerGroupRunner } = require('./run-top-buyer-group');

// 3 Electric Utility Companies for Testing
// Using website URLs for better company matching
const TEST_COMPANIES = [
  {
    name: 'Pacific Gas and Electric Company',
    identifier: 'https://www.pge.com',
    website: 'https://www.pge.com',
    description: 'Major California electric utility'
  },
  {
    name: 'Southern California Edison',
    identifier: 'https://www.sce.com',
    website: 'https://www.sce.com',
    description: 'Major California electric utility'
  },
  {
    name: 'Los Angeles Department of Water and Power',
    identifier: 'https://www.ladwp.com',
    website: 'https://www.ladwp.com',
    description: 'Largest municipal utility in the US'
  }
];

async function runTests() {
  console.log('🧪 TOP Engineers Plus - Buyer Group Discovery Test');
  console.log('='.repeat(70));
  console.log(`Testing ${TEST_COMPANIES.length} companies\n`);

  const results = [];

  for (let i = 0; i < TEST_COMPANIES.length; i++) {
    const company = TEST_COMPANIES[i];
    console.log(`\n${'='.repeat(70)}`);
    console.log(`\n📊 Test ${i + 1}/${TEST_COMPANIES.length}: ${company.name}`);
    console.log(`   Website: ${company.website}`);
    console.log(`   Description: ${company.description}`);
    console.log(`   Identifier: ${company.identifier}`);
    console.log('');

    try {
      const runner = new TOPBuyerGroupRunner();
      const startTime = Date.now();
      
      const result = await runner.run(company.identifier, {
        skipDatabase: false // Save to database
      });

      const duration = Math.round((Date.now() - startTime) / 1000);

      if (result && result.buyerGroup) {
        // Check for fake emails
        const fakeEmails = result.buyerGroup.filter(m => {
          const email = m.email || (m.fullProfile?.email) || '';
          return email.includes('@coresignal.temp');
        });

        const realEmails = result.buyerGroup.filter(m => {
          const email = m.email || (m.fullProfile?.email) || '';
          return email && !email.includes('@coresignal.temp') && email.includes('@');
        });

        results.push({
          company: company.name,
          success: true,
          buyerGroupSize: result.buyerGroup.length,
          realEmails: realEmails.length,
          fakeEmails: fakeEmails.length,
          duration: duration,
          intelligence: result.intelligence
        });

        console.log(`\n✅ Test ${i + 1} Complete:`);
        console.log(`   - Buyer Group Size: ${result.buyerGroup.length}`);
        console.log(`   - Real Emails: ${realEmails.length}`);
        console.log(`   - Fake Emails: ${fakeEmails.length} (should be 0)`);
        console.log(`   - Duration: ${duration}s`);

        if (fakeEmails.length > 0) {
          console.log(`\n⚠️  WARNING: Found ${fakeEmails.length} fake emails!`);
          fakeEmails.forEach(m => {
            console.log(`   - ${m.name}: ${m.email || m.fullProfile?.email}`);
          });
        }

        // Show sample buyer group members
        if (result.buyerGroup.length > 0) {
          console.log(`\n📋 Sample Buyer Group Members (first 5):`);
          result.buyerGroup.slice(0, 5).forEach((member, idx) => {
            const email = member.email || (member.fullProfile?.email) || 'No email';
            const emailStatus = email.includes('@coresignal.temp') ? '❌ FAKE' : '✅ REAL';
            console.log(`   ${idx + 1}. ${member.name} - ${member.title}`);
            console.log(`      Email: ${email} ${emailStatus}`);
            console.log(`      Role: ${member.buyerGroupRole || 'N/A'}`);
          });
        }
      } else {
        results.push({
          company: company.name,
          success: false,
          error: 'No buyer group returned'
        });
        console.log(`\n❌ Test ${i + 1} Failed: No buyer group returned`);
      }

    } catch (error) {
      results.push({
        company: company.name,
        success: false,
        error: error.message
      });
      console.error(`\n❌ Test ${i + 1} Failed:`, error.message);
      console.error(error.stack);
    }

    // Wait between companies to avoid rate limiting
    if (i < TEST_COMPANIES.length - 1) {
      console.log('\n⏳ Waiting 10 seconds before next company...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`   - ${r.company}: ${r.buyerGroupSize} members, ${r.realEmails} real emails, ${r.fakeEmails} fake emails`);
  });

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`   - ${r.company}: ${r.error}`);
    });
  }

  // Check for fake emails across all tests
  const totalFakeEmails = successful.reduce((sum, r) => sum + (r.fakeEmails || 0), 0);
  if (totalFakeEmails > 0) {
    console.log(`\n⚠️  WARNING: Total fake emails found: ${totalFakeEmails}`);
    console.log('   The system should filter out @coresignal.temp emails!');
  } else {
    console.log(`\n✅ All emails are real (no @coresignal.temp found)`);
  }

  const totalRealEmails = successful.reduce((sum, r) => sum + (r.realEmails || 0), 0);
  console.log(`\n📧 Total real emails collected: ${totalRealEmails}`);

  console.log('\n✅ Testing complete!\n');
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests, TEST_COMPANIES };

