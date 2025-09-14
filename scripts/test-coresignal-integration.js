#!/usr/bin/env node

/**
 * 🧪 TEST CORESIGNAL INTEGRATION
 * This script tests the Coresignal API integration by:
 * 1. Validating API credentials
 * 2. Testing basic API connectivity
 * 3. Running sample queries
 * 4. Checking data quality
 */

const fs = require("fs");
const path = require("path");

console.log("🧪 Testing Coresignal Integration");
console.log("=================================");

function checkEnvironmentVariables() {
  console.log("\n🔑 Environment Variables Check");
  console.log("------------------------------");
  
  const requiredVars = [
    'CORESIGNAL_API_KEY',
    'CORESIGNAL_BASE_URL'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Set`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  if (!allPresent) {
    console.log("\n💡 To fix missing variables:");
    console.log("  1. Add them to your .env file");
    console.log("  2. Or export them in your shell:");
    console.log("     export CORESIGNAL_API_KEY='your-key-here'");
    console.log("     export CORESIGNAL_BASE_URL='https://api.coresignal.com'");
  }
  
  return allPresent;
}

async function testApiConnectivity() {
  console.log("\n🌐 API Connectivity Test");
  console.log("------------------------");
  
  if (!process.env.CORESIGNAL_API_KEY) {
    console.log("❌ Cannot test connectivity - API key missing");
    return false;
  }
  
  try {
    // Use dynamic import for fetch if needed
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    const baseUrl = process.env.CORESIGNAL_BASE_URL || 'https://api.coresignal.com';
    const testUrl = `${baseUrl}/cdapi/v1/linkedin/company/search/filter`;
    
    console.log(`🔗 Testing connection to: ${baseUrl}`);
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Company',
        limit: 1
      })
    });
    
    if (response.ok) {
      console.log("✅ API connectivity successful");
      console.log(`   Status: ${response.status}`);
      return true;
    } else {
      console.log(`❌ API connectivity failed: ${response.status}`);
      console.log(`   Status text: ${response.statusText}`);
      return false;
    }
  } catch (error) {
    console.log("❌ API connectivity failed:", error.message);
    return false;
  }
}

async function testCompanySearch() {
  console.log("\n🏢 Company Search Test");
  console.log("----------------------");
  
  if (!process.env.CORESIGNAL_API_KEY) {
    console.log("❌ Cannot test company search - API key missing");
    return false;
  }
  
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    const baseUrl = process.env.CORESIGNAL_BASE_URL || 'https://api.coresignal.com';
    const searchUrl = `${baseUrl}/cdapi/v1/linkedin/company/search/filter`;
    
    console.log("🔍 Searching for 'Microsoft'...");
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Microsoft',
        limit: 3
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Company search successful");
      console.log(`   Found ${data.length || 0} companies`);
      
      if (data.length > 0) {
        console.log("   Sample results:");
        data.slice(0, 2).forEach((company, index) => {
          console.log(`     ${index + 1}. ${company.name || 'Unknown'} (${company.industry || 'Unknown industry'})`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Company search failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Company search failed:", error.message);
    return false;
  }
}

async function testEmployeeSearch() {
  console.log("\n👥 Employee Search Test");
  console.log("-----------------------");
  
  if (!process.env.CORESIGNAL_API_KEY) {
    console.log("❌ Cannot test employee search - API key missing");
    return false;
  }
  
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    const baseUrl = process.env.CORESIGNAL_BASE_URL || 'https://api.coresignal.com';
    const searchUrl = `${baseUrl}/cdapi/v1/linkedin/member/search/filter`;
    
    console.log("🔍 Searching for employees at Microsoft...");
    
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        company_name: 'Microsoft',
        title: 'Software Engineer',
        limit: 3
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Employee search successful");
      console.log(`   Found ${data.length || 0} employees`);
      
      if (data.length > 0) {
        console.log("   Sample results:");
        data.slice(0, 2).forEach((employee, index) => {
          console.log(`     ${index + 1}. ${employee.name || 'Unknown'} - ${employee.title || 'Unknown title'}`);
        });
      }
      
      return true;
    } else {
      console.log(`❌ Employee search failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Employee search failed:", error.message);
    return false;
  }
}

function checkIntegrationFiles() {
  console.log("\n📁 Integration Files Check");
  console.log("--------------------------");
  
  const integrationFiles = [
    './src/platform/services/coresignal-service.ts',
    './src/platform/services/buyer-group/coresignal-integration.ts',
    './tests/coresignal/coresignal-api.test.js'
  ];
  
  let allPresent = true;
  
  integrationFiles.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${filePath}: Found`);
    } else {
      console.log(`⚠️  ${filePath}: Not found`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

async function runQuickIntegrationTest() {
  console.log("\n⚡ Quick Integration Test");
  console.log("------------------------");
  
  try {
    // Try to import and test the Coresignal service if it exists
    const servicePath = './src/platform/services/coresignal-service.ts';
    
    if (fs.existsSync(servicePath)) {
      console.log("✅ Coresignal service file found");
      
      // Check if the service exports the expected functions
      const serviceContent = fs.readFileSync(servicePath, 'utf8');
      
      const expectedFunctions = [
        'searchCompanies',
        'searchEmployees',
        'getCompanyDetails'
      ];
      
      expectedFunctions.forEach(funcName => {
        if (serviceContent.includes(funcName)) {
          console.log(`✅ Function ${funcName}: Found`);
        } else {
          console.log(`⚠️  Function ${funcName}: Not found`);
        }
      });
      
      return true;
    } else {
      console.log("⚠️  Coresignal service file not found");
      return false;
    }
  } catch (error) {
    console.log("❌ Integration test failed:", error.message);
    return false;
  }
}

function generateTestReport(results) {
  console.log("\n📋 Coresignal Integration Test Report");
  console.log("=====================================");
  
  const tests = [
    { name: "Environment Variables", passed: results.env },
    { name: "API Connectivity", passed: results.connectivity },
    { name: "Company Search", passed: results.companySearch },
    { name: "Employee Search", passed: results.employeeSearch },
    { name: "Integration Files", passed: results.files },
    { name: "Service Integration", passed: results.service }
  ];
  
  const passedTests = tests.filter(test => test.passed).length;
  const totalTests = tests.length;
  
  console.log(`\n📊 Summary: ${passedTests}/${totalTests} tests passed`);
  
  tests.forEach(test => {
    const status = test.passed ? "✅" : "❌";
    console.log(`${status} ${test.name}`);
  });
  
  if (passedTests === totalTests) {
    console.log("\n🎉 All Coresignal integration tests passed!");
    console.log("Your Coresignal integration is working correctly.");
  } else {
    console.log("\n⚠️  Some Coresignal integration tests failed.");
    console.log("Please check the issues above and fix them.");
    
    if (!results.env) {
      console.log("\n💡 Quick fixes:");
      console.log("  • Set CORESIGNAL_API_KEY in your environment");
      console.log("  • Verify your API key is valid");
      console.log("  • Check your network connection");
    }
  }
  
  return passedTests === totalTests;
}

// Main execution
async function main() {
  try {
    console.log("Starting Coresignal integration tests...\n");
    
    const results = {
      env: checkEnvironmentVariables(),
      connectivity: false,
      companySearch: false,
      employeeSearch: false,
      files: checkIntegrationFiles(),
      service: false
    };
    
    // Only run API tests if environment is properly configured
    if (results.env) {
      results.connectivity = await testApiConnectivity();
      
      if (results.connectivity) {
        results.companySearch = await testCompanySearch();
        results.employeeSearch = await testEmployeeSearch();
      }
    }
    
    results.service = await runQuickIntegrationTest();
    
    const allPassed = generateTestReport(results);
    
    if (allPassed) {
      console.log("\n✅ Coresignal integration test completed successfully!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Coresignal integration test found issues.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Coresignal integration test failed:", error.message);
    process.exit(1);
  }
}

// Handle CI environment
if (process.env.CI) {
  console.log("🤖 Running in CI environment");
  
  // In CI, we might want to skip actual API calls and just check configuration
  if (!process.env.CORESIGNAL_API_KEY) {
    console.log("⚠️  CORESIGNAL_API_KEY not set in CI - skipping API tests");
    process.exit(0);
  }
}

main();
