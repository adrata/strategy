#!/usr/bin/env node

/**
 * 🚀 QUICK MONACO TEST - SIMPLE EXAMPLE
 * 
 * The fastest way to test Monaco with your companies.
 * Just add company names and run!
 */

const { Monaco360Runner } = require('./run_monaco_with_360_companies');

async function quickTest() {
  console.log('🚀 QUICK MONACO TEST');
  console.log('===================');
  console.log('');

  // 🏢 ADD YOUR COMPANIES HERE (just names!)
  const testCompanies = [
    'Dell Technologies',
    'Salesforce',
    'ServiceNow',
    'HubSpot',
    'Zoom Video Communications'
  ];

  console.log('🎯 Testing Monaco with these companies:');
  testCompanies.forEach((company, index) => {
    console.log(`   ${index + 1}. ${company}`);
  });
  console.log('');

  try {
    // Initialize Monaco runner
    const runner = new Monaco360Runner();
    
    // Load company names (Monaco will enrich everything else)
    await runner.loadFromNames(testCompanies);
    
    // Run in test mode (fast, limited steps)
    await runner.runMonacoPipeline('test');
    
    console.log('');
    console.log('✅ MONACO TEST COMPLETED!');
    console.log('=======================');
    console.log('📁 Check ./monaco-360-output/ for results');
    console.log('🎯 Ready to run with your full company list!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
quickTest(); 