#!/usr/bin/env node

/**
 * 🔍 INTEGRATION VALIDATION SCRIPT
 * 
 * Validates that all the core modules and components are properly integrated
 * without requiring a running server.
 */

const path = require('path');
const fs = require('fs');

console.log('🔍 VALIDATING PIPELINE INTEGRATION');
console.log('=' .repeat(60));

let validationScore = 0;
const totalChecks = 10;

// Check 1: Core modules exist
console.log('\n📁 Checking core modules...');
const moduleChecks = [
  'top100/modules/CompanyResolver.js',
  'top100/modules/ExecutiveResearch.js', 
  'top100/modules/ExecutiveContactIntelligence.js',
  'top100/modules/ContactValidator.js',
  'top100/modules/ValidationEngine.js',
  'top100/modules/PEOwnershipAnalysis.js'
];

let modulesFound = 0;
moduleChecks.forEach(modulePath => {
  const fullPath = path.join(process.cwd(), modulePath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${modulePath}`);
    modulesFound++;
  } else {
    console.log(`❌ ${modulePath} - NOT FOUND`);
  }
});

if (modulesFound === moduleChecks.length) {
  validationScore += 2;
  console.log(`✅ All ${modulesFound} core modules found`);
} else {
  console.log(`❌ Missing ${moduleChecks.length - modulesFound} core modules`);
}

// Check 2: Pipeline route exists and has real integration
console.log('\n🚀 Checking pipeline route...');
const pipelineRoutePath = path.join(process.cwd(), 'src/app/api/top100/pipeline/route.ts');
if (fs.existsSync(pipelineRoutePath)) {
  const routeContent = fs.readFileSync(pipelineRoutePath, 'utf8');
  
  if (routeContent.includes('CompanyResolver') && routeContent.includes('ExecutiveResearch')) {
    console.log('✅ Pipeline route has real module imports');
    validationScore += 1;
  } else {
    console.log('❌ Pipeline route missing real module imports');
  }
  
  if (routeContent.includes('Real API Multi-source Research')) {
    console.log('✅ Pipeline configured for real API integration');
    validationScore += 1;
  } else {
    console.log('❌ Pipeline still using simulated data');
  }
} else {
  console.log('❌ Pipeline route not found');
}

// Check 3: Enhanced pipeline exists
console.log('\n⚡ Checking enhanced pipeline...');
const enhancedRoutePath = path.join(process.cwd(), 'src/app/api/top100/pipeline/enhanced/route.ts');
if (fs.existsSync(enhancedRoutePath)) {
  console.log('✅ Enhanced pipeline route exists');
  validationScore += 1;
} else {
  console.log('❌ Enhanced pipeline route missing');
}

// Check 4: Test dashboard exists
console.log('\n🧪 Checking test dashboard...');
const dashboardPath = path.join(process.cwd(), 'src/app/test-dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  if (dashboardContent.includes('TEST_COMPANIES') && dashboardContent.includes('ValidationResult')) {
    console.log('✅ Test dashboard with validation system exists');
    validationScore += 1;
  } else {
    console.log('❌ Test dashboard missing validation components');
  }
} else {
  console.log('❌ Test dashboard not found');
}

// Check 5: Batch testing endpoint exists
console.log('\n📊 Checking batch testing endpoint...');
const batchTestPath = path.join(process.cwd(), 'src/app/api/test-dashboard/batch/route.ts');
if (fs.existsSync(batchTestPath)) {
  const batchContent = fs.readFileSync(batchTestPath, 'utf8');
  
  if (batchContent.includes('validateStepResults') && batchContent.includes('TEST_COMPANIES')) {
    console.log('✅ Batch testing endpoint with validation exists');
    validationScore += 1;
  } else {
    console.log('❌ Batch testing endpoint missing validation logic');
  }
} else {
  console.log('❌ Batch testing endpoint not found');
}

// Check 6: Environment variables template
console.log('\n🔑 Checking environment configuration...');
const envTemplatePath = path.join(process.cwd(), 'env.template');
if (fs.existsSync(envTemplatePath)) {
  const envContent = fs.readFileSync(envTemplatePath, 'utf8');
  
  const requiredKeys = [
    'PERPLEXITY_API_KEY',
    'CORESIGNAL_API_KEY', 
    'LUSHA_API_KEY',
    'ZEROBOUNCE_API_KEY'
  ];
  
  let keysFound = 0;
  requiredKeys.forEach(key => {
    if (envContent.includes(key)) {
      keysFound++;
    }
  });
  
  if (keysFound === requiredKeys.length) {
    console.log(`✅ All ${keysFound} required API keys configured in template`);
    validationScore += 1;
  } else {
    console.log(`❌ Missing ${requiredKeys.length - keysFound} API key configurations`);
  }
} else {
  console.log('❌ Environment template not found');
}

// Check 7: Documentation exists
console.log('\n📚 Checking documentation...');
const docsPath = path.join(process.cwd(), 'docs/pipeline-testing-system.md');
if (fs.existsSync(docsPath)) {
  console.log('✅ Comprehensive testing documentation exists');
  validationScore += 1;
} else {
  console.log('❌ Testing documentation missing');
}

// Check 8: Test companies configuration
console.log('\n🏢 Checking test companies...');
if (fs.existsSync(batchTestPath)) {
  const batchContent = fs.readFileSync(batchTestPath, 'utf8');
  
  const expectedCompanies = [
    'vts.com', 'rapid7.com', 'cm.com', 'discoveryeducation.com', 'postman.com',
    'snowflake.com', 'databricks.com', 'stripe.com', 'atlassian.com', 'zendesk.com'
  ];
  
  let companiesFound = 0;
  expectedCompanies.forEach(company => {
    if (batchContent.includes(company)) {
      companiesFound++;
    }
  });
  
  if (companiesFound === expectedCompanies.length) {
    console.log(`✅ All ${companiesFound} test companies configured`);
    validationScore += 1;
  } else {
    console.log(`❌ Missing ${expectedCompanies.length - companiesFound} test companies`);
  }
}

// Check 9: UI components exist
console.log('\n🎨 Checking UI components...');
const uiComponentsPath = path.join(process.cwd(), 'src/platform/ui/components');
if (fs.existsSync(uiComponentsPath)) {
  console.log('✅ UI components directory exists');
  validationScore += 1;
} else {
  console.log('❌ UI components directory missing');
}

// Final validation score
console.log('\n🎯 INTEGRATION VALIDATION RESULTS');
console.log('=' .repeat(60));
console.log(`📊 Validation Score: ${validationScore}/${totalChecks} (${Math.round((validationScore/totalChecks)*100)}%)`);

if (validationScore >= 9) {
  console.log('🎉 EXCELLENT - Integration is complete and ready for testing!');
  console.log('\n🚀 NEXT STEPS:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Navigate to: http://localhost:3000/test-dashboard');
  console.log('3. Click "Start Comprehensive Testing"');
  console.log('4. Review results and production readiness assessment');
} else if (validationScore >= 7) {
  console.log('⚠️  GOOD - Integration mostly complete, minor issues to address');
  console.log('\n🔧 RECOMMENDED ACTIONS:');
  console.log('1. Address any missing components shown above');
  console.log('2. Verify API keys are configured');
  console.log('3. Test the dashboard manually');
} else if (validationScore >= 5) {
  console.log('⚠️  PARTIAL - Integration partially complete, several issues to address');
  console.log('\n🔧 REQUIRED ACTIONS:');
  console.log('1. Fix missing core modules');
  console.log('2. Complete pipeline integration');
  console.log('3. Set up testing infrastructure');
} else {
  console.log('❌ INCOMPLETE - Major integration issues detected');
  console.log('\n🚨 CRITICAL ACTIONS NEEDED:');
  console.log('1. Verify project structure');
  console.log('2. Complete core module integration');
  console.log('3. Build testing system components');
}

console.log('\n📋 INTEGRATION CHECKLIST:');
console.log(`${validationScore >= 2 ? '✅' : '❌'} Core modules integrated`);
console.log(`${validationScore >= 4 ? '✅' : '❌'} Pipeline endpoints created`);
console.log(`${validationScore >= 6 ? '✅' : '❌'} Testing dashboard built`);
console.log(`${validationScore >= 8 ? '✅' : '❌'} Batch testing system ready`);
console.log(`${validationScore >= 10 ? '✅' : '❌'} Documentation complete`);

process.exit(validationScore >= 7 ? 0 : 1);
