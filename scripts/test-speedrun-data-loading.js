#!/usr/bin/env node

/**
 * Speedrun Data Loading Test Script
 * 
 * Tests that actual data is loading correctly for all Speedrun views
 * by examining the response content for specific data indicators
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
    
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testSpeedrunDataLoading() {
  console.log('🧪 Testing Speedrun Data Loading...\n');
  
  const baseUrl = 'http://localhost:3000';
  const views = [
    { 
      name: 'Actions', 
      url: '/pipeline/speedrun?view=actions',
      dataIndicators: ['sales_actions', 'SalesAction', 'generateDailySalesActions', 'Today\'s Goals']
    },
    { 
      name: 'Insights', 
      url: '/pipeline/speedrun?view=insights',
      dataIndicators: ['SpeedrunInsightsTable', 'Fresh Insights', 'Industry Trends', 'Competitive Intel']
    },
    { 
      name: 'Targets', 
      url: '/pipeline/speedrun?view=targets',
      dataIndicators: ['readyPeople', 'prospects', 'pain', 'valueDriver', 'Ready for Speedrun']
    },
    { 
      name: 'Calendar', 
      url: '/pipeline/speedrun?view=calendar',
      dataIndicators: ['DailySchedule', 'timeBlocks', 'focusBlocks', 'Today\'s Schedule']
    }
  ];
  
  const results = {};
  
  for (const view of views) {
    console.log(`📋 Testing ${view.name} View Data Loading...`);
    
    try {
      const response = await makeRequest(`${baseUrl}${view.url}`);
      
      if (response.statusCode !== 200) {
        results[view.name.toLowerCase()] = {
          success: false,
          error: `HTTP ${response.statusCode}`,
          statusCode: response.statusCode
        };
        console.log(`❌ ${view.name}: HTTP ${response.statusCode}`);
        continue;
      }
      
      // Check for data indicators
      const dataFound = view.dataIndicators.some(indicator => 
        response.data.includes(indicator)
      );
      
      // Check for empty state indicators
      const isEmpty = response.data.includes('No speedrun yet') || 
                     response.data.includes('No data available') ||
                     response.data.includes('No prospects ready');
      
      // Check for loading states
      const isLoading = response.data.includes('Loading') || 
                       response.data.includes('animate-spin');
      
      // Check for actual data content
      const hasDataContent = response.data.includes('bg-white border') && 
                            response.data.includes('rounded-lg') &&
                            !response.data.includes('No speedrun yet');
      
      results[view.name.toLowerCase()] = {
        success: true,
        statusCode: response.statusCode,
        dataLength: response.data.length,
        dataFound,
        isEmpty,
        isLoading,
        hasDataContent,
        indicatorsFound: view.dataIndicators.filter(indicator => 
          response.data.includes(indicator)
        ),
        indicatorsMissing: view.dataIndicators.filter(indicator => 
          !response.data.includes(indicator)
        )
      };
      
      console.log(`✅ ${view.name}: HTTP 200 (${response.data.length} bytes)`);
      
      if (dataFound) {
        console.log(`  📊 Data indicators found: ${results[view.name.toLowerCase()].indicatorsFound.length}/${view.dataIndicators.length}`);
        if (results[view.name.toLowerCase()].indicatorsFound.length > 0) {
          console.log(`    Found: ${results[view.name.toLowerCase()].indicatorsFound.join(', ')}`);
        }
      } else {
        console.log(`  ⚠️  No data indicators found`);
      }
      
      if (isEmpty) {
        console.log(`  ⚠️  Shows empty state`);
      }
      
      if (isLoading) {
        console.log(`  ⏳ Shows loading state`);
      }
      
      if (hasDataContent) {
        console.log(`  📋 Has data content structure`);
      }
      
    } catch (error) {
      results[view.name.toLowerCase()] = {
        success: false,
        error: error.message
      };
      console.log(`❌ ${view.name}: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary Report
  console.log('\n📊 Data Loading Test Results:');
  console.log('=============================');
  
  Object.entries(results).forEach(([view, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const info = result.success ? 
      `(HTTP ${result.statusCode}, ${result.dataLength} bytes)` : 
      `(${result.error})`;
    
    console.log(`${status} ${view.toUpperCase()}: ${info}`);
    
    if (result.success) {
      if (result.dataFound) {
        console.log(`  📊 Data: ${result.indicatorsFound.length}/${result.indicatorsFound.length + result.indicatorsMissing.length} indicators found`);
      } else {
        console.log(`  ⚠️  Data: No indicators found`);
      }
      
      if (result.isEmpty) {
        console.log(`  ⚠️  State: Empty`);
      } else if (result.isLoading) {
        console.log(`  ⏳ State: Loading`);
      } else if (result.hasDataContent) {
        console.log(`  📋 State: Has content`);
      } else {
        console.log(`  ❓ State: Unknown`);
      }
    }
  });
  
  const allPassed = Object.values(results).every(r => r.success);
  const allHaveData = Object.values(results).every(r => r.success && r.dataFound);
  
  console.log(`\n${allPassed ? '🎉 All HTTP tests passed!' : '⚠️  Some HTTP tests failed.'}`);
  console.log(`${allHaveData ? '🎉 All views have data indicators!' : '⚠️  Some views missing data indicators.'}`);
  
  // Detailed Analysis
  console.log('\n📋 Detailed Analysis:');
  console.log('====================');
  
  Object.entries(results).forEach(([view, result]) => {
    if (result.success) {
      console.log(`\n${view.toUpperCase()}:`);
      console.log(`  Status: HTTP ${result.statusCode}`);
      console.log(`  Size: ${result.dataLength} bytes`);
      console.log(`  Data Indicators: ${result.indicatorsFound.length}/${result.indicatorsFound.length + result.indicatorsMissing.length}`);
      
      if (result.indicatorsFound.length > 0) {
        console.log(`  Found: ${result.indicatorsFound.join(', ')}`);
      }
      
      if (result.indicatorsMissing.length > 0) {
        console.log(`  Missing: ${result.indicatorsMissing.join(', ')}`);
      }
      
      console.log(`  State: ${result.isEmpty ? 'Empty' : result.isLoading ? 'Loading' : result.hasDataContent ? 'Has Content' : 'Unknown'}`);
    }
  });
  
  return results;
}

// Run the test
if (require.main === module) {
  console.log('Make sure the development server is running at http://localhost:3000\n');
  
  testSpeedrunDataLoading()
    .then(() => {
      console.log('\n✅ Data loading test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Data loading test failed:', error);
      process.exit(1);
    });
}

module.exports = { testSpeedrunDataLoading };
