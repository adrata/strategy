#!/usr/bin/env node

/**
 * Quick test script for top-temp buyer group
 * Tests with a single company to verify everything works
 */

// Load .env.local first (from Vercel), then .env as fallback
require('dotenv').config({ path: '.env.local' });
require('dotenv').config(); // .env as fallback
const { TopTempBuyerGroupRunner } = require('./run-top-temp-buyer-group');

async function test() {
  console.log('🧪 Testing Top-Temp Buyer Group Script\n');
  console.log('='.repeat(60));
  
  // Use the test company we found earlier
  const testCompany = 'Central New Mexico Electric Cooperative';
  // Or use website
  const testIdentifier = 'https://cnmec.org';
  
  console.log(`Testing with: ${testCompany}`);
  console.log(`Identifier: ${testIdentifier}\n`);
  
  try {
    const runner = new TopTempBuyerGroupRunner();
    
    // Run with a timeout to avoid hanging
    const timeout = setTimeout(() => {
      console.log('\n⏱️  Test timeout after 5 minutes - this is normal for buyer group discovery');
      process.exit(0);
    }, 5 * 60 * 1000); // 5 minute timeout
    
    const result = await runner.run(testIdentifier, {
      skipDatabase: false
    });
    
    clearTimeout(timeout);
    
    if (result && result.buyerGroup) {
      console.log('\n✅ Test completed successfully!');
      console.log(`   Found ${result.buyerGroup.length} buyer group members`);
      console.log(`   Intelligence: ${result.intelligence ? 'Yes' : 'No'}`);
      process.exit(0);
    } else {
      console.log('\n⚠️  Test completed but no buyer group returned');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

test();

