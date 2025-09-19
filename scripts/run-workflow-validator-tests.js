#!/usr/bin/env node

/**
 * 🧪 Workflow Validator Test Runner
 * 
 * Comprehensive test execution with quality reporting
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      coverage: { lines: 0, functions: 0, branches: 0, statements: 0 }
    };
  }

  async runTests() {
    console.log('🧪 WORKFLOW VALIDATOR TEST SUITE');
    console.log('==================================\n');

    try {
      // Run unit tests
      await this.runUnitTests();
      
      // Run integration tests
      await this.runIntegrationTests();
      
      // Run E2E tests
      await this.runE2ETests();
      
      // Generate coverage report
      await this.generateCoverageReport();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('🔬 Running Unit Tests...');
    console.log('------------------------');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config=jest.config.workflow-validator.js',
        '--testPathPattern=tests/unit',
        '--coverage',
        '--verbose'
      ], {
        stdio: 'inherit'
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Unit tests passed\n');
          resolve();
        } else {
          console.log('❌ Unit tests failed\n');
          reject(new Error('Unit tests failed'));
        }
      });
    });
  }

  async runIntegrationTests() {
    console.log('🔗 Running Integration Tests...');
    console.log('--------------------------------');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config=jest.config.workflow-validator.js',
        '--testPathPattern=tests/integration',
        '--coverage',
        '--verbose'
      ], {
        stdio: 'inherit'
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Integration tests passed\n');
          resolve();
        } else {
          console.log('❌ Integration tests failed\n');
          reject(new Error('Integration tests failed'));
        }
      });
    });
  }

  async runE2ETests() {
    console.log('🎭 Running End-to-End Tests...');
    console.log('-------------------------------');
    
    return new Promise((resolve, reject) => {
      const playwright = spawn('npx', [
        'playwright',
        'test',
        'tests/e2e/workflow-validator.spec.ts',
        '--reporter=html'
      ], {
        stdio: 'inherit'
      });

      playwright.on('close', (code) => {
        if (code === 0) {
          console.log('✅ E2E tests passed\n');
          resolve();
        } else {
          console.log('❌ E2E tests failed\n');
          reject(new Error('E2E tests failed'));
        }
      });
    });
  }

  async generateCoverageReport() {
    console.log('📊 Generating Coverage Report...');
    console.log('---------------------------------');
    
    return new Promise((resolve, reject) => {
      const jest = spawn('npx', [
        'jest',
        '--config=jest.config.workflow-validator.js',
        '--coverage',
        '--coverageReporters=html',
        '--coverageReporters=text',
        '--coverageReporters=json'
      ], {
        stdio: 'inherit'
      });

      jest.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Coverage report generated\n');
          resolve();
        } else {
          console.log('❌ Coverage report generation failed\n');
          reject(new Error('Coverage report generation failed'));
        }
      });
    });
  }

  generateFinalReport() {
    console.log('📋 FINAL TEST REPORT');
    console.log('====================');
    
    // Read coverage data
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;
      
      console.log('\n📈 COVERAGE SUMMARY:');
      console.log(`Lines: ${total.lines.pct}% (${total.lines.covered}/${total.lines.total})`);
      console.log(`Functions: ${total.functions.pct}% (${total.functions.covered}/${total.functions.total})`);
      console.log(`Branches: ${total.branches.pct}% (${total.branches.covered}/${total.branches.total})`);
      console.log(`Statements: ${total.statements.pct}% (${total.statements.covered}/${total.statements.total})`);
      
      // Quality assessment
      const qualityScore = this.calculateQualityScore(total);
      console.log(`\n🎯 QUALITY SCORE: ${qualityScore}/100`);
      
      if (qualityScore >= 90) {
        console.log('🏆 EXCELLENT: All quality thresholds exceeded!');
      } else if (qualityScore >= 80) {
        console.log('✅ GOOD: Quality thresholds met');
      } else if (qualityScore >= 70) {
        console.log('⚠️  FAIR: Some quality thresholds not met');
      } else {
        console.log('❌ POOR: Quality thresholds not met');
      }
    }
    
    console.log('\n📁 REPORTS GENERATED:');
    console.log('- Coverage: ./coverage/index.html');
    console.log('- Test Results: ./test-reports/workflow-validator-report.html');
    console.log('- E2E Results: ./playwright-report/index.html');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('1. Review coverage report for uncovered code');
    console.log('2. Check test results for any failures');
    console.log('3. Run performance tests if needed');
    console.log('4. Deploy to staging for integration testing');
  }

  calculateQualityScore(coverage) {
    const weights = {
      lines: 0.4,
      functions: 0.3,
      branches: 0.2,
      statements: 0.1
    };
    
    const score = 
      (coverage.lines.pct * weights.lines) +
      (coverage.functions.pct * weights.functions) +
      (coverage.branches.pct * weights.branches) +
      (coverage.statements.pct * weights.statements);
    
    return Math.round(score);
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runTests().catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = TestRunner;
