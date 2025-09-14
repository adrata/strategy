#!/usr/bin/env node

/**
 * Comprehensive Speed Test for Adrata Pipeline with Redis Caching
 * Tests API response times, caching effectiveness, and left panel performance
 */

const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3000';
const TEST_RUNS = 5;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    
    const req = require(url.startsWith('https') ? 'https' : 'http').request(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'User-Agent': 'Adrata-Speed-Test/1.0',
        ...options.headers
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            duration: Math.round(duration),
            status: res.statusCode,
            data: jsonData,
            headers: res.headers,
            size: Buffer.byteLength(data, 'utf8')
          });
        } catch (error) {
          resolve({
            duration: Math.round(duration),
            status: res.statusCode,
            data: data,
            headers: res.headers,
            size: Buffer.byteLength(data, 'utf8'),
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testEndpoint(name, url, expectedCacheHit = false) {
  log(`\n🧪 Testing ${name}...`, 'cyan');
  log(`   URL: ${url}`, 'blue');
  
  const results = [];
  let cacheHits = 0;
  let errors = 0;
  
  for (let i = 0; i < TEST_RUNS; i++) {
    try {
      const result = await makeRequest(url);
      results.push(result);
      
      // Check for cache indicators in response
      if (result.headers['x-cache'] === 'HIT' || 
          (result.data && typeof result.data === 'object' && result.data.cached)) {
        cacheHits++;
      }
      
      const cacheStatus = i === 0 ? '(MISS)' : cacheHits > 0 ? '(HIT?)' : '(MISS)';
      log(`   Run ${i + 1}: ${result.duration}ms ${cacheStatus} [${result.status}]`, 
          result.duration < 100 ? 'green' : result.duration < 500 ? 'yellow' : 'red');
      
      // Wait between requests to avoid rate limiting
      if (i < TEST_RUNS - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      errors++;
      log(`   Run ${i + 1}: ERROR - ${error.message}`, 'red');
    }
  }
  
  if (results.length > 0) {
    const durations = results.map(r => r.duration);
    const avgDuration = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const avgSize = Math.round(results.reduce((a, r) => a + r.size, 0) / results.length);
    
    log(`\n📊 ${name} Results:`, 'bold');
    log(`   Average: ${avgDuration}ms`, avgDuration < 100 ? 'green' : avgDuration < 500 ? 'yellow' : 'red');
    log(`   Min: ${minDuration}ms | Max: ${maxDuration}ms`);
    log(`   Cache Hits: ${cacheHits}/${TEST_RUNS} (${Math.round(cacheHits/TEST_RUNS*100)}%)`);
    log(`   Response Size: ${(avgSize/1024).toFixed(1)}KB`);
    log(`   Errors: ${errors}/${TEST_RUNS}`);
    
    return {
      name,
      avgDuration,
      minDuration,
      maxDuration,
      cacheHits,
      errors,
      avgSize
    };
  }
  
  return { name, avgDuration: 0, errors: TEST_RUNS };
}

async function testCachePerformance() {
  log('🎯 Testing Cache Performance (Upstash Redis)', 'bold');
  
  // Test cache set/get directly
  try {
    const testKey = `speed-test-${Date.now()}`;
    const testValue = { test: true, timestamp: Date.now(), data: 'x'.repeat(1000) };
    
    // Test SET
    const setStart = performance.now();
    const setResponse = await makeRequest(`https://flexible-bluegill-57912.upstash.io/set/${testKey}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer AeI4AAIncDEyYTI4ZmNhYjNmNGI0NjljOTQzZjRjNTk2ZDQwNmRjMXAxNTc5MTI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(JSON.stringify(testValue))
    });
    const setDuration = performance.now() - setStart;
    
    // Test GET
    const getStart = performance.now();
    const getResponse = await makeRequest(`https://flexible-bluegill-57912.upstash.io/get/${testKey}`, {
      headers: {
        'Authorization': 'Bearer AeI4AAIncDEyYTI4ZmNhYjNmNGI0NjljOTQzZjRjNTk2ZDQwNmRjMXAxNTc5MTI'
      }
    });
    const getDuration = performance.now() - getStart;
    
    log(`\n🔧 Direct Redis Performance:`, 'cyan');
    log(`   SET: ${Math.round(setDuration)}ms`);
    log(`   GET: ${Math.round(getDuration)}ms`);
    
    // Cleanup
    await makeRequest(`https://flexible-bluegill-57912.upstash.io/del/${testKey}`, {
      headers: {
        'Authorization': 'Bearer AeI4AAIncDEyYTI4ZmNhYjNmNGI0NjljOTQzZjRjNTk2ZDQwNmRjMXAxNTc5MTI'
      }
    });
    
  } catch (error) {
    log(`❌ Redis direct test failed: ${error.message}`, 'red');
  }
}

async function runSpeedTests() {
  log('🚀 ADRATA PIPELINE SPEED TEST SUITE', 'bold');
  log('=====================================\n', 'bold');
  
  // Test Redis cache directly first
  await testCachePerformance();
  
  const testSuites = [
    {
      name: 'Core API Endpoints',
      tests: [
        ['Unified Data API (Cold)', `${BASE_URL}/api/data/unified?t=${Date.now()}`],
        ['Unified Data API (Warm)', `${BASE_URL}/api/data/unified`],
        ['Pipeline Data API', `${BASE_URL}/api/pipeline`],
        ['Auth Check API', `${BASE_URL}/api/auth/me`],
      ]
    },
    {
      name: 'Pipeline Sections',
      tests: [
        ['Speedrun Data', `${BASE_URL}/api/data/unified?section=speedrun`],
        ['Leads Data', `${BASE_URL}/api/data/unified?section=leads`],
        ['Prospects Data', `${BASE_URL}/api/data/unified?section=prospects`],
        ['Opportunities Data', `${BASE_URL}/api/data/unified?section=opportunities`],
      ]
    },
    {
      name: 'Page Load Performance',
      tests: [
        ['Pipeline Speedrun Page', `${BASE_URL}/pipeline/speedrun`],
        ['Pipeline Leads Page', `${BASE_URL}/pipeline/leads`],
        ['Pipeline Prospects Page', `${BASE_URL}/pipeline/prospects`],
      ]
    }
  ];
  
  const allResults = [];
  
  for (const suite of testSuites) {
    log(`\n🎯 ${suite.name}`, 'bold');
    log('='.repeat(suite.name.length + 4), 'bold');
    
    for (const [name, url] of suite.tests) {
      const result = await testEndpoint(name, url);
      allResults.push(result);
    }
  }
  
  // Summary Report
  log('\n📈 PERFORMANCE SUMMARY', 'bold');
  log('=====================\n', 'bold');
  
  const apiResults = allResults.filter(r => r.name.includes('API'));
  const pageResults = allResults.filter(r => r.name.includes('Page'));
  
  if (apiResults.length > 0) {
    const avgApiTime = Math.round(apiResults.reduce((a, r) => a + r.avgDuration, 0) / apiResults.length);
    log(`🔌 API Average: ${avgApiTime}ms`, avgApiTime < 200 ? 'green' : avgApiTime < 500 ? 'yellow' : 'red');
  }
  
  if (pageResults.length > 0) {
    const avgPageTime = Math.round(pageResults.reduce((a, r) => a + r.avgDuration, 0) / pageResults.length);
    log(`📄 Page Average: ${avgPageTime}ms`, avgPageTime < 1000 ? 'green' : avgPageTime < 2000 ? 'yellow' : 'red');
  }
  
  const totalErrors = allResults.reduce((a, r) => a + r.errors, 0);
  const totalTests = allResults.length * TEST_RUNS;
  const successRate = Math.round(((totalTests - totalErrors) / totalTests) * 100);
  
  log(`✅ Success Rate: ${successRate}%`, successRate > 95 ? 'green' : successRate > 80 ? 'yellow' : 'red');
  
  // Performance Grades
  log('\n🏆 PERFORMANCE GRADES', 'bold');
  log('====================', 'bold');
  
  const fastestAPI = apiResults.reduce((min, r) => r.avgDuration < min.avgDuration ? r : min, { avgDuration: Infinity });
  const slowestAPI = apiResults.reduce((max, r) => r.avgDuration > max.avgDuration ? r : max, { avgDuration: 0 });
  
  if (fastestAPI.avgDuration !== Infinity) {
    log(`🥇 Fastest API: ${fastestAPI.name} (${fastestAPI.avgDuration}ms)`, 'green');
  }
  if (slowestAPI.avgDuration > 0) {
    log(`🐌 Slowest API: ${slowestAPI.name} (${slowestAPI.avgDuration}ms)`, 'red');
  }
  
  // Recommendations
  log('\n💡 RECOMMENDATIONS', 'bold');
  log('==================', 'bold');
  
  const slowAPIs = allResults.filter(r => r.avgDuration > 500);
  if (slowAPIs.length > 0) {
    log('⚠️  Slow endpoints detected:', 'yellow');
    slowAPIs.forEach(api => {
      log(`   - ${api.name}: ${api.avgDuration}ms`, 'yellow');
    });
  } else {
    log('✅ All endpoints performing well!', 'green');
  }
  
  if (totalErrors > 0) {
    log(`⚠️  ${totalErrors} errors detected - check server logs`, 'yellow');
  }
  
  log('\n🎉 Speed test complete!', 'bold');
}

// Handle HTTP requests for POST method
function makePostRequest(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    const postData = JSON.stringify(data);
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 10000
    };
    
    const req = require(url.startsWith('https') ? 'https' : 'http').request(url, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            duration: Math.round(duration),
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            duration: Math.round(duration),
            status: res.statusCode,
            data: responseData,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

// Run the tests
if (require.main === module) {
  runSpeedTests().catch(console.error);
}

module.exports = { runSpeedTests, testEndpoint, makeRequest };
