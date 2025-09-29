#!/usr/bin/env node

/**
 * 🔍 AUTHENTICATION ENDPOINTS TEST SCRIPT
 * 
 * This script tests the authentication endpoints to ensure they're working
 * and accessible from different networks.
 */

const https = require('https');
const http = require('http');

console.log('🔍 [AUTH TEST] Testing authentication endpoints...\n');

// Test endpoints
const endpoints = [
  {
    name: 'Sign-in API',
    url: 'https://action.adrata.com/api/auth/sign-in',
    methods: ['GET', 'POST', 'OPTIONS']
  },
  {
    name: 'Unified Auth API', 
    url: 'https://action.adrata.com/api/auth/unified',
    methods: ['GET', 'POST', 'OPTIONS']
  }
];

// Test function
async function testEndpoint(endpoint) {
  console.log(`📡 Testing ${endpoint.name}: ${endpoint.url}`);
  
  for (const method of endpoint.methods) {
    try {
      const result = await makeRequest(endpoint.url, method);
      console.log(`  ✅ ${method}: ${result.status} - ${result.message}`);
    } catch (error) {
      console.log(`  ❌ ${method}: ${error.message}`);
    }
  }
  console.log('');
}

// Make HTTP request
function makeRequest(url, method) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: method,
      headers: {
        'User-Agent': 'Adrata-Auth-Test/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            message: jsonData.message || 'OK',
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            message: 'Non-JSON response',
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`));
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// Main test function
async function runTests() {
  console.log('🚀 [AUTH TEST] Starting endpoint tests...\n');
  
  for (const endpoint of endpoints) {
    await testEndpoint(endpoint);
  }
  
  console.log('📊 [AUTH TEST] Test Summary');
  console.log('==========================');
  console.log('✅ If all tests pass, authentication endpoints are working');
  console.log('❌ If any tests fail, there may be network or server issues');
  console.log('');
  console.log('🔧 [TROUBLESHOOTING]');
  console.log('===================');
  console.log('1. If GET requests fail: Server may not be running');
  console.log('2. If POST requests fail: Authentication logic may have issues');
  console.log('3. If OPTIONS requests fail: CORS may be misconfigured');
  console.log('4. If all requests timeout: Network connectivity issues');
  console.log('');
  console.log('🌐 [NETWORK TESTING]');
  console.log('===================');
  console.log('Try these URLs in your browser:');
  console.log('- https://action.adrata.com/api/auth/sign-in');
  console.log('- https://action.adrata.com/api/auth/unified');
  console.log('');
  console.log('Expected: JSON response with success: true');
  console.log('If you get 405 error: HTTP method not allowed (fixed with this update)');
  console.log('If you get 404 error: Endpoint not found (server issue)');
  console.log('If you get timeout: Network connectivity issue');
}

// Run tests
runTests().catch(console.error);
