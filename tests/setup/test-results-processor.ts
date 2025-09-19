/**
 * 🧪 Test Results Processor
 * 
 * Processes test results for reporting and analysis
 */
import { TestResult, AggregatedResult } from '@jest/test-result';

export default function testResultsProcessor(results: AggregatedResult) {
  console.log('\n🧪 Test Results Summary:');
  console.log(`✅ Passed: ${results.numPassedTests}`);
  console.log(`❌ Failed: ${results.numFailedTests}`);
  console.log(`⏭️  Skipped: ${results.numPendingTests}`);
  console.log(`📊 Total: ${results.numTotalTests}`);
  console.log(`⏱️  Time: ${results.startTime ? (Date.now() - results.startTime) / 1000 : 0}s`);
  
  if (results.coverageMap) {
    const coverage = results.coverageMap.getCoverageSummary();
    console.log('\n📈 Coverage Summary:');
    console.log(`Lines: ${coverage.lines.pct}%`);
    console.log(`Functions: ${coverage.functions.pct}%`);
    console.log(`Branches: ${coverage.branches.pct}%`);
    console.log(`Statements: ${coverage.statements.pct}%`);
  }
  
  // Check if we met our quality thresholds
  const passedThreshold = results.numPassedTests / results.numTotalTests >= 0.95;
  const coverageThreshold = results.coverageMap ? 
    results.coverageMap.getCoverageSummary().lines.pct >= 90 : true;
  
  if (passedThreshold && coverageThreshold) {
    console.log('\n🎉 Quality thresholds met!');
  } else {
    console.log('\n⚠️  Quality thresholds not met:');
    if (!passedThreshold) {
      console.log(`  - Test pass rate: ${(results.numPassedTests / results.numTotalTests * 100).toFixed(1)}% (target: 95%)`);
    }
    if (!coverageThreshold) {
      console.log(`  - Code coverage: ${results.coverageMap?.getCoverageSummary().lines.pct || 0}% (target: 90%)`);
    }
  }
  
  return results;
}
