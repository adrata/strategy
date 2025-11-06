#!/usr/bin/env node

/**
 * Webhook Endpoints Test Script
 * 
 * Tests webhook endpoint accessibility, signature verification, and payload handling
 * for Nango, Outlook, and Microsoft Graph webhooks.
 */

const crypto = require('crypto');

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
const NANGO_SECRET_KEY = process.env.NANGO_SECRET_KEY || process.env.NANGO_SECRET_KEY_DEV;

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

/**
 * Generate Nango webhook signature
 */
function generateNangoSignature(payload, secretKey) {
  const combined = secretKey + payload;
  return crypto.createHash('sha256').update(combined).digest('hex');
}

/**
 * Test Nango webhook endpoint
 */
async function testNangoWebhook() {
  logSection('Testing Nango Webhook Endpoint');
  
  const endpoint = `${BASE_URL}/api/webhooks/nango/email`;
  log(`Endpoint: ${endpoint}`, 'blue');
  
  // Test 1: Connection creation webhook
  log('\n[Test 1] Connection Creation Webhook', 'yellow');
  const connectionPayload = {
    type: 'auth',
    operation: 'creation',
    success: true,
    connectionId: 'test-connection-123',
    providerConfigKey: 'outlook',
    endUser: {
      endUserId: 'test-user-123',
      tags: {
        workspaceId: 'test-workspace-123'
      }
    }
  };
  
  const payloadString = JSON.stringify(connectionPayload);
  const signature = generateNangoSignature(payloadString, NANGO_SECRET_KEY || 'test-secret');
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nango-signature': signature
      },
      body: payloadString
    });
    
    const result = await response.text();
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    log(`Response: ${result.substring(0, 200)}`);
    
    if (response.status === 200 || response.status === 201) {
      log('✅ Connection creation webhook test PASSED', 'green');
    } else {
      log('❌ Connection creation webhook test FAILED', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  // Test 2: Sync webhook
  log('\n[Test 2] Sync Webhook', 'yellow');
  const syncPayload = {
    type: 'sync',
    connectionId: 'test-connection-123',
    providerConfigKey: 'outlook',
    syncName: 'email-sync',
    success: true
  };
  
  const syncPayloadString = JSON.stringify(syncPayload);
  const syncSignature = generateNangoSignature(syncPayloadString, NANGO_SECRET_KEY || 'test-secret');
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nango-signature': syncSignature
      },
      body: syncPayloadString
    });
    
    const result = await response.text();
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    log(`Response: ${result.substring(0, 200)}`);
    
    if (response.status === 200 || response.status === 201) {
      log('✅ Sync webhook test PASSED', 'green');
    } else {
      log('❌ Sync webhook test FAILED', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  // Test 3: Invalid signature
  log('\n[Test 3] Invalid Signature Test', 'yellow');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-nango-signature': 'invalid-signature-123'
      },
      body: payloadString
    });
    
    log(`Status: ${response.status}`, response.status === 401 ? 'green' : 'red');
    
    if (response.status === 401) {
      log('✅ Invalid signature correctly rejected', 'green');
    } else {
      log('❌ Invalid signature was not rejected', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  // Test 4: Missing signature
  log('\n[Test 4] Missing Signature Test', 'yellow');
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payloadString
    });
    
    log(`Status: ${response.status}`);
    
    if (response.status === 401) {
      log('✅ Missing signature correctly rejected', 'green');
    } else if (!NANGO_SECRET_KEY) {
      log('⚠️  No secret key configured - webhook accepts without signature', 'yellow');
    } else {
      log('❌ Missing signature was not rejected', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Test Outlook webhook endpoint
 */
async function testOutlookWebhook() {
  logSection('Testing Outlook Webhook Endpoint');
  
  const endpoint = `${BASE_URL}/api/webhooks/outlook`;
  log(`Endpoint: ${endpoint}`, 'blue');
  
  // Test 1: Validation token (Microsoft Graph requirement)
  log('\n[Test 1] Validation Token Test', 'yellow');
  const validationToken = 'test-validation-token-12345';
  
  try {
    const response = await fetch(`${endpoint}?validationToken=${encodeURIComponent(validationToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: validationToken
    });
    
    const result = await response.text();
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    log(`Response: ${result}`);
    
    if (response.status === 200 && result === validationToken) {
      log('✅ Validation token test PASSED', 'green');
    } else {
      log('❌ Validation token test FAILED', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
  
  // Test 2: Notification payload
  log('\n[Test 2] Notification Payload Test', 'yellow');
  const notificationPayload = {
    value: [{
      changeType: 'created',
      resource: 'me/messages/12345',
      resourceData: {
        id: '12345'
      },
      clientState: 'test-account-id_1234567890',
      subscriptionId: 'test-subscription-123'
    }]
  };
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(notificationPayload)
    });
    
    const result = await response.text();
    log(`Status: ${response.status}`);
    log(`Response: ${result.substring(0, 200)}`);
    
    if (response.status === 200 || response.status === 201) {
      log('✅ Notification payload test PASSED', 'green');
    } else {
      log('⚠️  Notification payload test returned non-200 status', 'yellow');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Test Microsoft Graph webhook endpoint
 */
async function testMicrosoftGraphWebhook() {
  logSection('Testing Microsoft Graph Webhook Endpoint');
  
  const endpoint = `${BASE_URL}/api/webhooks/microsoft-graph`;
  log(`Endpoint: ${endpoint}`, 'blue');
  
  // Test 1: Validation token
  log('\n[Test 1] Validation Token Test', 'yellow');
  const validationToken = 'test-validation-token-67890';
  
  try {
    const response = await fetch(`${endpoint}?validationToken=${encodeURIComponent(validationToken)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: validationToken
    });
    
    const result = await response.text();
    log(`Status: ${response.status}`, response.status === 200 ? 'green' : 'red');
    log(`Response: ${result}`);
    
    if (response.status === 200 && result === validationToken) {
      log('✅ Validation token test PASSED', 'green');
    } else {
      log('❌ Validation token test FAILED', 'red');
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
  }
}

/**
 * Test endpoint accessibility
 */
async function testEndpointAccessibility() {
  logSection('Testing Endpoint Accessibility');
  
  const endpoints = [
    '/api/webhooks/nango/email',
    '/api/webhooks/outlook',
    '/api/webhooks/microsoft-graph'
  ];
  
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}`;
    log(`\nTesting: ${url}`, 'blue');
    
    try {
      // Test GET request (should return info or 405)
      const getResponse = await fetch(url, { method: 'GET' });
      log(`  GET Status: ${getResponse.status}`, getResponse.status < 500 ? 'green' : 'red');
      
      // Test POST request (should handle webhook)
      const postResponse = await fetch(url, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      log(`  POST Status: ${postResponse.status}`, postResponse.status < 500 ? 'green' : 'red');
      
      if (getResponse.status < 500 && postResponse.status < 500) {
        log(`  ✅ ${endpoint} is accessible`, 'green');
      } else {
        log(`  ❌ ${endpoint} has issues`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${endpoint} is not accessible: ${error.message}`, 'red');
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('WEBHOOK ENDPOINTS AUDIT TEST', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`Base URL: ${BASE_URL}`, 'blue');
  log(`Nango Secret Key: ${NANGO_SECRET_KEY ? 'Configured' : 'Not configured'}`, NANGO_SECRET_KEY ? 'green' : 'yellow');
  
  try {
    await testEndpointAccessibility();
    await testNangoWebhook();
    await testOutlookWebhook();
    await testMicrosoftGraphWebhook();
    
    logSection('Test Summary');
    log('Webhook endpoint tests completed. Review results above.', 'blue');
    log('\nNote: Some tests may fail if webhooks require real connection IDs or workspace IDs.', 'yellow');
    log('This is expected for integration testing.', 'yellow');
    
  } catch (error) {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests, testNangoWebhook, testOutlookWebhook, testMicrosoftGraphWebhook };

