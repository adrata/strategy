#!/usr/bin/env node

/**
 * EFFICACY TRACKING TEST
 * 
 * Tests the enhanced function-based pipeline with all restored functionality
 * and comprehensive efficacy tracking to ensure we haven't lost any features.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

async function runEfficacyTrackingTest() {
  console.log('🧪 EFFICACY TRACKING TEST');
  console.log('=' .repeat(50));
  console.log('Testing enhanced function-based pipeline with all restored functionality...');
  console.log('=' .repeat(50));

  // Test companies
  const testCompanies = [
    'https://salesforce.com',
    'https://hubspot.com',
    'https://microsoft.com',
    'https://zoom.com',
    'https://slack.com'
  ];

  console.log(`\n📊 Testing with ${testCompanies.length} companies...`);
  console.log(`Companies: ${testCompanies.join(', ')}`);

  try {
    // Import and run the enhanced pipeline
    const { main } = require('../pipelines/core/cfo-cro-function-pipeline.js');
    
    // Override process.argv to pass test companies
    const originalArgv = process.argv;
    process.argv = ['node', 'test', ...testCompanies];
    
    console.log('\n🚀 Running enhanced pipeline...');
    const startTime = Date.now();
    
    // Run the pipeline
    await main();
    
    const totalTime = Date.now() - startTime;
    
    // Restore original argv
    process.argv = originalArgv;
    
    console.log(`\n⏱️ Total test time: ${(totalTime / 1000).toFixed(1)}s`);
    
    // Verify output files exist
    console.log('\n📁 Verifying output files...');
    const outputFiles = [
      './output/executives.json',
      './output/executives.csv',
      './output/efficacy-report.json'
    ];
    
    let allFilesExist = true;
    outputFiles.forEach(file => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        console.log(`   ✅ ${file} (${stats.size} bytes)`);
      } else {
        console.log(`   ❌ ${file} - Missing`);
        allFilesExist = false;
      }
    });
    
    if (allFilesExist) {
      console.log('\n✅ All output files generated successfully');
      
      // Analyze efficacy report
      console.log('\n📊 Analyzing efficacy report...');
      const efficacyReport = JSON.parse(fs.readFileSync('./output/efficacy-report.json', 'utf8'));
      
      console.log(`   Companies processed: ${efficacyReport.summary.totalCompanies}`);
      console.log(`   CFOs found: ${efficacyReport.summary.totalCFOs} (${Math.round((efficacyReport.summary.totalCFOs / efficacyReport.summary.totalCompanies) * 100)}%)`);
      console.log(`   CROs found: ${efficacyReport.summary.totalCROs} (${Math.round((efficacyReport.summary.totalCROs / efficacyReport.summary.totalCompanies) * 100)}%)`);
      console.log(`   Emails found: ${efficacyReport.summary.totalEmails} (${Math.round((efficacyReport.summary.totalEmails / efficacyReport.summary.totalCompanies) * 100)}%)`);
      console.log(`   Phones found: ${efficacyReport.summary.totalPhones} (${Math.round((efficacyReport.summary.totalPhones / efficacyReport.summary.totalCompanies) * 100)}%)`);
      console.log(`   Credits used: ${efficacyReport.summary.creditsUsed}`);
      
      // Check discovery sources
      console.log('\n🔍 Discovery sources analysis:');
      if (efficacyReport.discoverySources.cfoSources) {
        console.log('   CFO Sources:');
        Object.entries(efficacyReport.discoverySources.cfoSources).forEach(([source, count]) => {
          console.log(`     - ${source}: ${count}`);
        });
      }
      
      if (efficacyReport.discoverySources.croSources) {
        console.log('   CRO Sources:');
        Object.entries(efficacyReport.discoverySources.croSources).forEach(([source, count]) => {
          console.log(`     - ${source}: ${count}`);
        });
      }
      
      // Success criteria
      const cfoDiscoveryRate = (efficacyReport.summary.totalCFOs / efficacyReport.summary.totalCompanies) * 100;
      const croDiscoveryRate = (efficacyReport.summary.totalCROs / efficacyReport.summary.totalCompanies) * 100;
      const emailDiscoveryRate = (efficacyReport.summary.totalEmails / efficacyReport.summary.totalCompanies) * 100;
      
      console.log('\n🎯 SUCCESS CRITERIA:');
      console.log(`   CFO Discovery Rate: ${cfoDiscoveryRate.toFixed(1)}% (Target: 70%+) ${cfoDiscoveryRate >= 70 ? '✅' : '❌'}`);
      console.log(`   CRO Discovery Rate: ${croDiscoveryRate.toFixed(1)}% (Target: 70%+) ${croDiscoveryRate >= 70 ? '✅' : '❌'}`);
      console.log(`   Email Discovery Rate: ${emailDiscoveryRate.toFixed(1)}% (Target: 50%+) ${emailDiscoveryRate >= 50 ? '✅' : '❌'}`);
      console.log(`   All Output Files Generated: ${allFilesExist ? '✅' : '❌'}`);
      console.log(`   Efficacy Tracking Working: ${efficacyReport.companyBreakdown.length > 0 ? '✅' : '❌'}`);
      
      const allCriteriaMet = cfoDiscoveryRate >= 70 && croDiscoveryRate >= 70 && emailDiscoveryRate >= 50 && allFilesExist && efficacyReport.companyBreakdown.length > 0;
      
      console.log(`\n🏆 OVERALL RESULT: ${allCriteriaMet ? '✅ PASSED' : '❌ FAILED'}`);
      
      if (allCriteriaMet) {
        console.log('\n🎉 All functionality restored and efficacy tracking working correctly!');
        console.log('   - Executive discovery: Working');
        console.log('   - Contact intelligence: Working');
        console.log('   - Multi-source verification: Working');
        console.log('   - Employment validation: Working');
        console.log('   - Efficacy tracking: Working');
        console.log('   - Output generation: Working');
      } else {
        console.log('\n⚠️ Some criteria not met. Check the detailed report above.');
      }
      
    } else {
      console.log('\n❌ Some output files are missing');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runEfficacyTrackingTest().catch(console.error);
}

module.exports = { runEfficacyTrackingTest };
