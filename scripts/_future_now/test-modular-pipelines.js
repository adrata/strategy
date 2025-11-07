#!/usr/bin/env node

/**
 * Test Suite for Modularized Pipelines
 * 
 * Verifies all pipelines follow the find-buyer-group modular pattern
 */

require('dotenv').config();

console.log('\n' + '='.repeat(80));
console.log('🧪 MODULAR ARCHITECTURE VERIFICATION TEST');
console.log('='.repeat(80));

/**
 * Test modular structure exists
 */
function testModularStructure() {
  console.log('\n📁 Test 1: Modular Structure Verification');
  console.log('-'.repeat(80));
  
  const fs = require('fs');
  const path = require('path');
  
  const pipelines = [
    { name: 'find-company', expectedModules: 6 },
    { name: 'find-person', expectedModules: 5 },
    { name: 'find-role', expectedModules: 5 },
    { name: 'find-optimal-buyer-group', expectedModules: 10 }
  ];
  
  let allPassed = true;
  
  for (const pipeline of pipelines) {
    const modulesDir = path.join(__dirname, pipeline.name, 'modules');
    const orchestrator = path.join(__dirname, pipeline.name, 'index-modular.js');
    
    const hasModulesDir = fs.existsSync(modulesDir);
    const hasOrchestrator = fs.existsSync(orchestrator);
    
    if (hasModulesDir) {
      const modules = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
      const moduleCount = modules.length;
      
      console.log(`\n${pipeline.name}:`);
      console.log(`   Modules directory: ${hasModulesDir ? '✅' : '❌'}`);
      console.log(`   Orchestrator file: ${hasOrchestrator ? '✅' : '❌'}`);
      console.log(`   Module count: ${moduleCount}/${pipeline.expectedModules} ${moduleCount >= pipeline.expectedModules ? '✅' : '⚠️'}`);
      console.log(`   Modules: ${modules.join(', ')}`);
      
      if (!hasOrchestrator || moduleCount < pipeline.expectedModules) {
        allPassed = false;
      }
    } else {
      console.log(`\n${pipeline.name}: ❌ No modules directory found`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Test orchestrator file sizes
 */
function testOrchestratorSizes() {
  console.log('\n📏 Test 2: Orchestrator Size Verification (<350 lines target)');
  console.log('-'.repeat(80));
  
  const fs = require('fs');
  const path = require('path');
  
  const pipelines = ['find-company', 'find-person', 'find-role', 'find-optimal-buyer-group'];
  let allPassed = true;
  
  for (const pipeline of pipelines) {
    const orchestratorPath = path.join(__dirname, pipeline, 'index-modular.js');
    
    if (fs.existsSync(orchestratorPath)) {
      const content = fs.readFileSync(orchestratorPath, 'utf8');
      const lines = content.split('\n').length;
      const status = lines <= 350 ? '✅' : lines <= 450 ? '⚠️' : '❌';
      
      console.log(`${pipeline}: ${lines} lines ${status}`);
      
      if (lines > 450) {
        allPassed = false;
      }
    } else {
      console.log(`${pipeline}: ❌ No modular orchestrator found`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

/**
 * Test module imports work
 */
function testModuleImports() {
  console.log('\n🔗 Test 3: Module Import Verification');
  console.log('-'.repeat(80));
  
  const tests = [
    { pipeline: 'find-company', module: './find-company/modules/ContactDiscovery', class: 'ContactDiscovery' },
    { pipeline: 'find-company', module: './find-company/modules/ContactVerifier', class: 'ContactVerifier' },
    { pipeline: 'find-person', module: './find-person/modules/PersonSearcher', class: 'PersonSearcher' },
    { pipeline: 'find-person', module: './find-person/modules/PersonMatcher', class: 'PersonMatcher' },
    { pipeline: 'find-role', module: './find-role/modules/RoleVariationGenerator', class: 'RoleVariationGenerator' },
    { pipeline: 'find-role', module: './find-role/modules/RoleSearcher', class: 'RoleSearcher' },
    { pipeline: 'find-optimal-buyer-group', module: './find-optimal-buyer-group/modules/QueryBuilder', class: 'QueryBuilder' },
    { pipeline: 'find-optimal-buyer-group', module: './find-optimal-buyer-group/modules/CompanyScorer', class: 'CompanyScorer' }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const module = require(test.module);
      const hasClass = !!module[test.class];
      
      if (hasClass) {
        console.log(`✅ ${test.pipeline}/${test.class}`);
        passed++;
      } else {
        console.log(`❌ ${test.pipeline}/${test.class} - Class not exported`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.pipeline}/${test.class} - ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Import Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Test orchestrators can be instantiated
 */
function testOrchestratorInstantiation() {
  console.log('\n🏗️  Test 4: Orchestrator Instantiation');
  console.log('-'.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  // Test find-company
  try {
    const CompanyEnrichment = require('./find-company/index-modular');
    const enrichment = new CompanyEnrichment();
    console.log('✅ find-company instantiates correctly');
    passed++;
  } catch (error) {
    console.log(`❌ find-company: ${error.message}`);
    failed++;
  }
  
  // Test find-person
  try {
    const PersonEnrichment = require('./find-person/index-modular');
    const enrichment = new PersonEnrichment();
    console.log('✅ find-person instantiates correctly');
    passed++;
  } catch (error) {
    console.log(`❌ find-person: ${error.message}`);
    failed++;
  }
  
  // Test find-role
  try {
    const RoleEnrichment = require('./find-role/index-modular');
    const enrichment = new RoleEnrichment({ targetRole: 'CEO' });
    console.log('✅ find-role instantiates correctly');
    passed++;
  } catch (error) {
    console.log(`❌ find-role: ${error.message}`);
    failed++;
  }
  
  // Test find-optimal-buyer-group
  try {
    const OptimalBuyerGroupFinder = require('./find-optimal-buyer-group/index-modular');
    const finder = new OptimalBuyerGroupFinder({ industries: ['Software'] });
    console.log('✅ find-optimal-buyer-group instantiates correctly');
    passed++;
  } catch (error) {
    console.log(`❌ find-optimal-buyer-group: ${error.message}`);
    failed++;
  }
  
  console.log(`\n📊 Instantiation Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

/**
 * Main test runner
 */
function runAllTests() {
  const results = [];
  
  results.push({
    name: 'Modular Structure',
    passed: testModularStructure()
  });
  
  results.push({
    name: 'Orchestrator Sizes',
    passed: testOrchestratorSizes()
  });
  
  results.push({
    name: 'Module Imports',
    passed: testModuleImports()
  });
  
  results.push({
    name: 'Orchestrator Instantiation',
    passed: testOrchestratorInstantiation()
  });
  
  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  
  console.log('\n📋 Test Results:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.passed ? '✅ PASS' : '❌ FAIL'}`);
  });
  
  console.log('\n' + '='.repeat(80));
  
  if (failed === 0) {
    console.log('🎉 ALL MODULAR ARCHITECTURE TESTS PASSED!');
    console.log('\n✅ All 4 pipelines now follow find-buyer-group pattern:');
    console.log('   - find-company: Modular architecture ✅');
    console.log('   - find-person: Modular architecture ✅');
    console.log('   - find-role: Modular architecture ✅');
    console.log('   - find-optimal-buyer-group: Modular architecture ✅');
    console.log('\n🚀 Professional, maintainable codebase achieved!');
  } else {
    console.log(`⚠️ ${failed} test(s) failed. Please review output above.`);
  }
  
  console.log('='.repeat(80) + '\n');
  
  return failed === 0 ? 0 : 1;
}

// Run tests
const exitCode = runAllTests();
process.exit(exitCode);

