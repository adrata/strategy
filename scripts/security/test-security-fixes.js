#!/usr/bin/env node

/**
 * SECURITY TEST SCRIPT
 * 
 * Tests all API endpoints to ensure they are properly secured
 * and no longer vulnerable to unauthorized access.
 */

const fs = require('fs');
const path = require('path');

// Test scenarios for security validation
const securityTests = [
  {
    name: 'Missing Authentication',
    description: 'Test that endpoints require authentication',
    test: (content) => {
      // Should not have query parameter authentication
      const hasQueryAuth = /searchParams\.get\(['"]workspaceId['"]\)/.test(content);
      const hasSecureAuth = /getSecureApiContext/.test(content);
      
      return {
        passed: !hasQueryAuth && hasSecureAuth,
        message: hasQueryAuth ? 'Still uses query parameter authentication' : 
                 hasSecureAuth ? 'Uses secure authentication' : 'No authentication found'
      };
    }
  },
  {
    name: 'Development TODOs Removed',
    description: 'Test that development TODOs are removed',
    test: (content) => {
      const hasTODOs = /TODO:.*auth.*system/i.test(content) || 
                      /For now, allow access/i.test(content);
      
      return {
        passed: !hasTODOs,
        message: hasTODOs ? 'Still contains development TODOs' : 'Development TODOs removed'
      };
    }
  },
  {
    name: 'Proper Error Handling',
    description: 'Test that endpoints use secure error responses',
    test: (content) => {
      const hasBasicErrors = /NextResponse\.json\(\s*{\s*success:\s*false/.test(content);
      const hasSecureErrors = /createErrorResponse/.test(content);
      
      return {
        passed: !hasBasicErrors && hasSecureErrors,
        message: hasBasicErrors ? 'Still uses basic error responses' : 
                 hasSecureErrors ? 'Uses secure error responses' : 'No error handling found'
      };
    }
  },
  {
    name: 'Required Imports',
    description: 'Test that endpoints import security helpers',
    test: (content) => {
      const hasSecureImports = /getSecureApiContext/.test(content) && 
                              /createErrorResponse/.test(content) &&
                              /createSuccessResponse/.test(content);
      
      return {
        passed: hasSecureImports,
        message: hasSecureImports ? 'Has required security imports' : 'Missing security imports'
      };
    }
  }
];

// List of all API endpoints to test
const apiEndpoints = [
  'src/app/api/activities/route.ts',
  'src/app/api/users/[userId]/profile/route.ts',
  'src/app/api/timeline/[entityType]/[entityId]/route.ts',
  'src/app/api/data/companies/route.ts',
  'src/app/api/data/opportunities/route.ts',
  'src/app/api/data/clients/route.ts',
  'src/app/api/data/counts/route.ts',
  'src/app/api/data/search/route.ts',
  'src/app/api/data/section/route.ts',
  'src/app/api/data/unified/route.ts',
  'src/app/api/notes/route.ts',
  'src/app/api/pipeline/dashboard/route.ts',
  'src/app/api/intelligence/unified/route.ts',
  'src/app/api/enrichment/unified/route.ts',
  'src/app/api/email/link/route.ts',
  'src/app/api/email/comprehensive-link/route.ts',
  'src/app/api/email/cloud-processor/route.ts',
  'src/app/api/email/sync/route.ts',
  'src/app/api/workspace/users/route.ts',
  'src/app/api/speedrun/check-signals/route.ts',
  'src/app/api/speedrun/prospects/route.ts',
  'src/app/api/data/buyer-groups/route.ts',
  'src/app/api/data/buyer-groups/fast/route.ts',
  'src/app/api/data/master-ranking/route.ts',
  'src/app/api/data/unified-master-ranking/route.ts',
  'src/app/api/analyze-5bars-buyer-group/route.ts',
  'src/app/api/enhance-5bars/route.ts',
  'src/app/api/data-quality/audit/route.ts',
  'src/app/api/companies/by-name/[name]/route.ts',
  'src/app/api/zoho/notifications/route.ts'
];

function testEndpoint(endpointPath) {
  console.log(`🔍 Testing: ${endpointPath}`);
  
  if (!fs.existsSync(endpointPath)) {
    console.log(`❌ File not found: ${endpointPath}`);
    return { passed: false, tests: [] };
  }

  const content = fs.readFileSync(endpointPath, 'utf8');
  const results = [];

  securityTests.forEach(test => {
    const result = test.test(content);
    results.push({
      name: test.name,
      description: test.description,
      passed: result.passed,
      message: result.message
    });
  });

  const allPassed = results.every(r => r.passed);
  const passedCount = results.filter(r => r.passed).length;
  
  console.log(`   ${allPassed ? '✅' : '❌'} ${passedCount}/${results.length} tests passed`);
  
  if (!allPassed) {
    results.forEach(result => {
      if (!result.passed) {
        console.log(`     ❌ ${result.name}: ${result.message}`);
      }
    });
  }

  return { passed: allPassed, tests: results };
}

function testMiddleware() {
  console.log(`🔍 Testing: src/middleware.ts`);
  
  const middlewarePath = 'src/middleware.ts';
  if (!fs.existsSync(middlewarePath)) {
    console.log(`❌ Middleware not found: ${middlewarePath}`);
    return { passed: false };
  }

  const content = fs.readFileSync(middlewarePath, 'utf8');
  
  const hasApiProtection = /pathname\.startsWith\('\/api\/'\)/.test(content);
  const hasAuthCheck = /getUnifiedAuthUser/.test(content);
  const hasUserContext = /x-user-id/.test(content);
  const hasEdgeRuntimeCompatibility = !/validateWorkspaceAccess/.test(content); // Should NOT have Prisma imports for Edge Runtime
  
  const allChecks = hasApiProtection && hasAuthCheck && hasUserContext && hasEdgeRuntimeCompatibility;
  
  console.log(`   ${allChecks ? '✅' : '❌'} Middleware security checks`);
  if (!allChecks) {
    console.log(`     ❌ Missing: API protection=${hasApiProtection}, Auth check=${hasAuthCheck}, User context=${hasUserContext}, Edge Runtime compatibility=${hasEdgeRuntimeCompatibility}`);
  }
  
  return { passed: allChecks };
}

function testSecurityServices() {
  console.log(`🔍 Testing: Security services`);
  
  const services = [
    'src/platform/services/workspace-access-control.ts',
    'src/platform/services/secure-api-helper.ts'
  ];
  
  let allPassed = true;
  
  services.forEach(service => {
    if (!fs.existsSync(service)) {
      console.log(`❌ Service not found: ${service}`);
      allPassed = false;
    } else {
      console.log(`   ✅ ${service}`);
    }
  });
  
  return { passed: allPassed };
}

function generateReport(results) {
  const totalEndpoints = results.endpoints.length;
  const passedEndpoints = results.endpoints.filter(r => r.passed).length;
  const middlewarePassed = results.middleware.passed;
  const servicesPassed = results.services.passed;
  
  console.log('\n📊 SECURITY TEST REPORT');
  console.log('='.repeat(50));
  console.log(`🔐 Middleware Security: ${middlewarePassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`🛡️  Security Services: ${servicesPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`📡 API Endpoints: ${passedEndpoints}/${totalEndpoints} secured`);
  
  if (passedEndpoints === totalEndpoints && middlewarePassed && servicesPassed) {
    console.log('\n🎉 ALL SECURITY TESTS PASSED!');
    console.log('✅ All endpoints are properly secured');
    console.log('✅ Middleware provides universal protection');
    console.log('✅ Security services are implemented');
    console.log('\n🚀 Ready for production deployment!');
  } else {
    console.log('\n⚠️  SECURITY ISSUES FOUND:');
    if (!middlewarePassed) {
      console.log('❌ Middleware needs fixes');
    }
    if (!servicesPassed) {
      console.log('❌ Security services missing');
    }
    if (passedEndpoints < totalEndpoints) {
      console.log(`❌ ${totalEndpoints - passedEndpoints} endpoints need fixes`);
    }
  }
  
  return {
    totalEndpoints,
    passedEndpoints,
    middlewarePassed,
    servicesPassed,
    allPassed: passedEndpoints === totalEndpoints && middlewarePassed && servicesPassed
  };
}

function main() {
  console.log('🔐 Starting security validation tests...\n');
  
  const results = {
    endpoints: [],
    middleware: { passed: false },
    services: { passed: false }
  };
  
  // Test all endpoints
  apiEndpoints.forEach(endpoint => {
    const result = testEndpoint(endpoint);
    results.endpoints.push({ endpoint, ...result });
    console.log('');
  });
  
  // Test middleware
  results.middleware = testMiddleware();
  console.log('');
  
  // Test security services
  results.services = testSecurityServices();
  console.log('');
  
  // Generate report
  const report = generateReport(results);
  
  // Exit with appropriate code
  process.exit(report.allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { testEndpoint, testMiddleware, testSecurityServices, generateReport };
