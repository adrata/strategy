/**
 * 🔍 AI Chat 405 Debug Script
 * 
 * Uses Puppeteer to capture network requests and debug the 405 issue
 * Run with: node scripts/debug-ai-chat-405.js [environment]
 * 
 * Environments: local, staging, production
 */

const puppeteer = require('puppeteer');

const ENVIRONMENTS = {
  local: 'http://localhost:3000',
  staging: 'https://staging.adrata.com',
  production: 'https://action.adrata.com'
};

const env = process.argv[2] || 'staging';
const BASE_URL = ENVIRONMENTS[env] || ENVIRONMENTS.staging;

console.log(`\n🔍 AI Chat 405 Debug Script`);
console.log(`📍 Environment: ${env}`);
console.log(`🌐 Base URL: ${BASE_URL}\n`);

async function testEndpoint(page, url, method, body = null) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${method} ${url}`);
  console.log('='.repeat(60));

  const networkLogs = [];
  const consoleLogs = [];

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('ai-chat')) {
      networkLogs.push({
        type: 'REQUEST',
        method: request.method(),
        url: request.url(),
        headers: request.headers(),
        postData: request.postData()?.substring(0, 200)
      });
    }
  });

  // Capture network responses
  page.on('response', response => {
    if (response.url().includes('ai-chat')) {
      networkLogs.push({
        type: 'RESPONSE',
        status: response.status(),
        statusText: response.statusText(),
        url: response.url(),
        headers: response.headers()
      });
    }
  });

  // Capture console logs
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  try {
    // Make the request using page.evaluate to capture all details
    const result = await page.evaluate(async (url, method, body) => {
      const startTime = performance.now();
      
      try {
        const options = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        };

        if (body && method !== 'GET') {
          options.body = JSON.stringify(body);
        }

        console.log(`🚀 Fetch starting: ${method} ${url}`);
        
        const response = await fetch(url, options);
        
        const endTime = performance.now();
        const duration = endTime - startTime;

        let responseBody;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          responseBody = await response.json();
        } else {
          responseBody = await response.text();
        }

        console.log(`✅ Fetch complete: ${response.status} in ${duration.toFixed(0)}ms`);

        return {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: responseBody,
          duration,
          redirected: response.redirected,
          url: response.url,
          type: response.type
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }, url, method, body);

    // Print results
    console.log('\n📊 RESULT:');
    console.log(JSON.stringify(result, null, 2));

    if (networkLogs.length > 0) {
      console.log('\n🌐 NETWORK LOGS:');
      networkLogs.forEach(log => {
        console.log(JSON.stringify(log, null, 2));
      });
    }

    if (result.status === 405) {
      console.log('\n❌ 405 ERROR DETECTED!');
      console.log('Possible causes:');
      console.log('  1. Request method changed during redirect (POST → GET)');
      console.log('  2. Vercel WAF/Firewall blocking the request');
      console.log('  3. Route handler not exporting the correct method');
      console.log('  4. Middleware intercepting and returning 405');
      
      if (result.redirected) {
        console.log('\n⚠️  REQUEST WAS REDIRECTED!');
        console.log(`   Original URL: ${url}`);
        console.log(`   Final URL: ${result.url}`);
        console.log('   This redirect may have converted POST to GET!');
      }
    }

    return result;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

async function runDebugTests() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Enable request interception to see all details
  await page.setRequestInterception(true);
  page.on('request', request => {
    // Log redirects
    if (request.isNavigationRequest() && request.redirectChain().length > 0) {
      console.log('🔄 REDIRECT DETECTED:', request.redirectChain().map(r => r.url()));
    }
    request.continue();
  });

  console.log('\n' + '='.repeat(60));
  console.log('STARTING DEBUG TESTS');
  console.log('='.repeat(60));

  // Test 1: Debug endpoint GET (should always work)
  console.log('\n📋 TEST 1: Debug endpoint GET');
  await testEndpoint(page, `${BASE_URL}/api/v1/ai-chat-debug/`, 'GET');

  // Test 2: Debug endpoint POST
  console.log('\n📋 TEST 2: Debug endpoint POST');
  await testEndpoint(page, `${BASE_URL}/api/v1/ai-chat-debug/`, 'POST', { test: true });

  // Test 3: Main ai-chat endpoint with trailing slash
  console.log('\n📋 TEST 3: Main ai-chat POST with trailing slash');
  await testEndpoint(page, `${BASE_URL}/api/v1/ai-chat/`, 'POST', {
    message: 'test',
    appType: 'pipeline',
    workspaceId: 'test',
    userId: 'test'
  });

  // Test 4: Main ai-chat endpoint WITHOUT trailing slash
  console.log('\n📋 TEST 4: Main ai-chat POST WITHOUT trailing slash');
  await testEndpoint(page, `${BASE_URL}/api/v1/ai-chat`, 'POST', {
    message: 'test',
    appType: 'pipeline',
    workspaceId: 'test',
    userId: 'test'
  });

  // Test 5: Check if GET returns helpful error
  console.log('\n📋 TEST 5: Main ai-chat GET (should return 405 with message)');
  await testEndpoint(page, `${BASE_URL}/api/v1/ai-chat/`, 'GET');

  // Test 6: Test with redirect: manual to see if there's a redirect
  console.log('\n📋 TEST 6: Check for redirects with redirect: manual');
  const redirectTest = await page.evaluate(async (url) => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true }),
        redirect: 'manual'
      });
      
      return {
        status: response.status,
        type: response.type,
        headers: Object.fromEntries(response.headers.entries()),
        isRedirect: response.type === 'opaqueredirect' || (response.status >= 300 && response.status < 400)
      };
    } catch (e) {
      return { error: e.message };
    }
  }, `${BASE_URL}/api/v1/ai-chat`);
  
  console.log('Redirect test result:', JSON.stringify(redirectTest, null, 2));

  await browser.close();

  console.log('\n' + '='.repeat(60));
  console.log('DEBUG TESTS COMPLETE');
  console.log('='.repeat(60));
}

runDebugTests().catch(console.error);

