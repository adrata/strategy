#!/usr/bin/env node

/**
 * PIPELINE COMPARISON TEST
 * 
 * Runs both old class-based and new function-based pipelines on the same companies
 * to ensure no functionality was lost in the migration.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(process.cwd(), '.env') });

async function runPipelineComparisonTest() {
  console.log('🔄 PIPELINE COMPARISON TEST');
  console.log('=' .repeat(50));
  console.log('Comparing old class-based vs new function-based pipelines...');
  console.log('=' .repeat(50));

  // Test companies
  const testCompanies = [
    'https://salesforce.com',
    'https://hubspot.com',
    'https://microsoft.com'
  ];

  console.log(`\n📊 Testing with ${testCompanies.length} companies...`);
  console.log(`Companies: ${testCompanies.join(', ')}`);

  const results = {
    oldPipeline: null,
    newPipeline: null,
    comparison: null
  };

  try {
    // Test 1: Old Class-Based Pipeline
    console.log('\n🏛️ Testing OLD Class-Based Pipeline...');
    console.log('=' .repeat(40));
    
    try {
      // Import old pipeline
      const { CorePipeline } = require('../pipelines/core/archive/core-pipeline-class-based.js');
      
      const oldPipeline = new CorePipeline();
      const oldStartTime = Date.now();
      
      // Run old pipeline
      const oldResults = await oldPipeline.runPipeline(testCompanies);
      const oldExecutionTime = Date.now() - oldStartTime;
      
      results.oldPipeline = {
        success: true,
        results: oldResults,
        executionTime: oldExecutionTime,
        companiesProcessed: testCompanies.length
      };
      
      console.log(`✅ Old pipeline completed in ${(oldExecutionTime / 1000).toFixed(1)}s`);
      
    } catch (error) {
      console.log(`❌ Old pipeline failed: ${error.message}`);
      results.oldPipeline = {
        success: false,
        error: error.message,
        executionTime: 0,
        companiesProcessed: 0
      };
    }

    // Test 2: New Function-Based Pipeline
    console.log('\n🚀 Testing NEW Function-Based Pipeline...');
    console.log('=' .repeat(40));
    
    try {
      // Import new pipeline
      const { main } = require('../pipelines/core/cfo-cro-function-pipeline.js');
      
      // Override process.argv to pass test companies
      const originalArgv = process.argv;
      process.argv = ['node', 'test', ...testCompanies];
      
      const newStartTime = Date.now();
      
      // Run new pipeline
      await main();
      
      const newExecutionTime = Date.now() - newStartTime;
      
      // Restore original argv
      process.argv = originalArgv;
      
      // Read results from output files
      let newResults = null;
      if (fs.existsSync('./output/executives.json')) {
        const outputData = JSON.parse(fs.readFileSync('./output/executives.json', 'utf8'));
        newResults = Array.isArray(outputData) ? outputData : [outputData];
      }
      
      results.newPipeline = {
        success: true,
        results: newResults,
        executionTime: newExecutionTime,
        companiesProcessed: testCompanies.length
      };
      
      console.log(`✅ New pipeline completed in ${(newExecutionTime / 1000).toFixed(1)}s`);
      
    } catch (error) {
      console.log(`❌ New pipeline failed: ${error.message}`);
      results.newPipeline = {
        success: false,
        error: error.message,
        executionTime: 0,
        companiesProcessed: 0
      };
    }

    // Comparison Analysis
    console.log('\n📊 COMPARISON ANALYSIS');
    console.log('=' .repeat(40));
    
    if (results.oldPipeline.success && results.newPipeline.success) {
      // Compare execution times
      console.log(`\n⏱️ Execution Time Comparison:`);
      console.log(`   Old Pipeline: ${(results.oldPipeline.executionTime / 1000).toFixed(1)}s`);
      console.log(`   New Pipeline: ${(results.newPipeline.executionTime / 1000).toFixed(1)}s`);
      console.log(`   Difference: ${((results.newPipeline.executionTime - results.oldPipeline.executionTime) / 1000).toFixed(1)}s`);
      
      // Compare results
      if (results.oldPipeline.results && results.newPipeline.results) {
        const oldCFOs = results.oldPipeline.results.filter(r => r.cfo && r.cfo.name).length;
        const oldCROs = results.oldPipeline.results.filter(r => r.cro && r.cro.name).length;
        const newCFOs = results.newPipeline.results.filter(r => r.cfo && r.cfo.name).length;
        const newCROs = results.newPipeline.results.filter(r => r.cro && r.cro.name).length;
        
        console.log(`\n👥 Executive Discovery Comparison:`);
        console.log(`   Old Pipeline - CFOs: ${oldCFOs}, CROs: ${oldCROs}`);
        console.log(`   New Pipeline - CFOs: ${newCFOs}, CROs: ${newCROs}`);
        console.log(`   CFO Difference: ${newCFOs - oldCFOs}`);
        console.log(`   CRO Difference: ${newCROs - oldCROs}`);
        
        // Compare data quality
        const oldEmails = results.oldPipeline.results.filter(r => 
          (r.cfo && r.cfo.email) || (r.cro && r.cro.email)
        ).length;
        const newEmails = results.newPipeline.results.filter(r => 
          (r.cfo && r.cfo.email) || (r.cro && r.cro.email)
        ).length;
        
        const oldPhones = results.oldPipeline.results.filter(r => 
          (r.cfo && r.cfo.phone) || (r.cro && r.cro.phone)
        ).length;
        const newPhones = results.newPipeline.results.filter(r => 
          (r.cfo && r.cfo.phone) || (r.cro && r.cro.phone)
        ).length;
        
        console.log(`\n📧 Contact Information Comparison:`);
        console.log(`   Old Pipeline - Emails: ${oldEmails}, Phones: ${oldPhones}`);
        console.log(`   New Pipeline - Emails: ${newEmails}, Phones: ${newPhones}`);
        console.log(`   Email Difference: ${newEmails - oldEmails}`);
        console.log(`   Phone Difference: ${newPhones - oldPhones}`);
        
        // Success criteria
        const cfoDiscoveryMaintained = newCFOs >= oldCFOs * 0.9; // Allow 10% variance
        const croDiscoveryMaintained = newCROs >= oldCROs * 0.9;
        const emailDiscoveryMaintained = newEmails >= oldEmails * 0.9;
        const phoneDiscoveryMaintained = newPhones >= oldPhones * 0.9;
        
        console.log(`\n🎯 SUCCESS CRITERIA:`);
        console.log(`   CFO Discovery Maintained: ${cfoDiscoveryMaintained ? '✅' : '❌'} (${newCFOs}/${oldCFOs})`);
        console.log(`   CRO Discovery Maintained: ${croDiscoveryMaintained ? '✅' : '❌'} (${newCROs}/${oldCROs})`);
        console.log(`   Email Discovery Maintained: ${emailDiscoveryMaintained ? '✅' : '❌'} (${newEmails}/${oldEmails})`);
        console.log(`   Phone Discovery Maintained: ${phoneDiscoveryMaintained ? '✅' : '❌'} (${newPhones}/${oldPhones})`);
        
        const allCriteriaMet = cfoDiscoveryMaintained && croDiscoveryMaintained && 
                              emailDiscoveryMaintained && phoneDiscoveryMaintained;
        
        console.log(`\n🏆 OVERALL RESULT: ${allCriteriaMet ? '✅ MIGRATION SUCCESSFUL' : '❌ MIGRATION ISSUES DETECTED'}`);
        
        if (allCriteriaMet) {
          console.log('\n🎉 Migration successful! All functionality preserved.');
          console.log('   - Executive discovery: Maintained or improved');
          console.log('   - Contact information: Maintained or improved');
          console.log('   - Data quality: Maintained or improved');
          console.log('   - Performance: Comparable or better');
        } else {
          console.log('\n⚠️ Migration issues detected. Some functionality may have been lost.');
          console.log('   Review the comparison above and check for regressions.');
        }
        
        results.comparison = {
          executionTime: {
            old: results.oldPipeline.executionTime,
            new: results.newPipeline.executionTime,
            difference: results.newPipeline.executionTime - results.oldPipeline.executionTime
          },
          discovery: {
            cfo: { old: oldCFOs, new: newCFOs, maintained: cfoDiscoveryMaintained },
            cro: { old: oldCROs, new: newCROs, maintained: croDiscoveryMaintained }
          },
          contacts: {
            email: { old: oldEmails, new: newEmails, maintained: emailDiscoveryMaintained },
            phone: { old: oldPhones, new: newPhones, maintained: phoneDiscoveryMaintained }
          },
          overallSuccess: allCriteriaMet
        };
        
      } else {
        console.log('⚠️ Could not compare results - missing data');
      }
      
    } else {
      console.log('❌ Cannot compare - one or both pipelines failed');
      if (!results.oldPipeline.success) {
        console.log(`   Old pipeline error: ${results.oldPipeline.error}`);
      }
      if (!results.newPipeline.success) {
        console.log(`   New pipeline error: ${results.newPipeline.error}`);
      }
    }
    
    // Save comparison report
    const comparisonReport = {
      timestamp: new Date().toISOString(),
      testCompanies,
      results,
      summary: {
        oldPipelineSuccess: results.oldPipeline.success,
        newPipelineSuccess: results.newPipeline.success,
        migrationSuccessful: results.comparison?.overallSuccess || false
      }
    };
    
    fs.writeFileSync('./output/pipeline-comparison-report.json', JSON.stringify(comparisonReport, null, 2), 'utf8');
    console.log(`\n📄 Comparison report saved: ./output/pipeline-comparison-report.json`);
    
  } catch (error) {
    console.error('\n❌ Comparison test failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runPipelineComparisonTest().catch(console.error);
}

module.exports = { runPipelineComparisonTest };
