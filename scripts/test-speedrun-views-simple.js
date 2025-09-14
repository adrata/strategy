#!/usr/bin/env node

/**
 * Speedrun Views HTTP Test Script
 * 
 * Tests that data is loading correctly for all Speedrun views by making HTTP requests
 * to the running application at localhost:3000
 */

const https = require('https');
const http = require('http');

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testSpeedrunViews() {
  console.log('🧪 Testing Speedrun Views via HTTP...\n');
  
  const baseUrl = 'http://localhost:3000';
  const views = [
    { name: 'Actions', url: '/pipeline/speedrun?view=actions' },
    { name: 'Insights', url: '/pipeline/speedrun?view=insights' },
    { name: 'Targets', url: '/pipeline/speedrun?view=targets' },
    { name: 'Calendar', url: '/pipeline/speedrun?view=calendar' }
  ];
  
  const results = {};
  
  for (const view of views) {
    console.log(`📋 Testing ${view.name} View...`);
    
    try {
      const response = await makeRequest(`${baseUrl}${view.url}`);
      
      results[view.name.toLowerCase()] = {
        success: response.statusCode === 200,
        statusCode: response.statusCode,
        dataLength: response.data.length,
        hasError: response.data.includes('error') || response.data.includes('Error'),
        hasNoData: response.data.includes('No data') || response.data.includes('No speedrun'),
        sample: response.data.substring(0, 500) + '...'
      };
      
      if (response.statusCode === 200) {
        console.log(`✅ ${view.name}: HTTP 200 (${response.data.length} bytes)`);
        
        if (results[view.name.toLowerCase()].hasError) {
          console.log(`⚠️  ${view.name}: Contains error messages`);
        }
        
        if (results[view.name.toLowerCase()].hasNoData) {
          console.log(`⚠️  ${view.name}: Shows "no data" message`);
        }
      } else {
        console.log(`❌ ${view.name}: HTTP ${response.statusCode}`);
      }
      
    } catch (error) {
      results[view.name.toLowerCase()] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${view.name}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary Report
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([view, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const info = result.success ? 
      `(HTTP ${result.statusCode}, ${result.dataLength} bytes)` : 
      `(${result.error})`;
    
    console.log(`${status} ${view.toUpperCase()}: ${info}`);
    
    if (result.success && result.hasError) {
      console.log(`  ⚠️  Contains error messages`);
    }
    
    if (result.success && result.hasNoData) {
      console.log(`  ⚠️  Shows "no data" message`);
    }
  });
  
  const allPassed = Object.values(results).every(r => r.success);
  console.log(`\n${allPassed ? '🎉 All HTTP tests passed!' : '⚠️  Some HTTP tests failed.'}`);
  
  // Check for data issues
  const hasDataIssues = Object.values(results).some(r => r.success && (r.hasError || r.hasNoData));
  if (hasDataIssues) {
    console.log('\n⚠️  Data Issues Detected:');
    console.log('=======================');
    
    Object.entries(results).forEach(([view, result]) => {
      if (result.success && (result.hasError || result.hasNoData)) {
        console.log(`\n${view.toUpperCase()}:`);
        if (result.hasError) {
          console.log('  - Contains error messages');
        }
        if (result.hasNoData) {
          console.log('  - Shows "no data" message');
        }
        console.log('  Sample response:');
        console.log(`    ${result.sample}`);
      }
    });
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  console.log('Make sure the development server is running at http://localhost:3000\n');
  
  testSpeedrunViews()
    .then(() => {
      console.log('\n✅ HTTP test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ HTTP test script failed:', error);
      process.exit(1);
    });
}

module.exports = { testSpeedrunViews };
