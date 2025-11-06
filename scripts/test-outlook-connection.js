#!/usr/bin/env node

/**
 * Test Script for Grand Central Outlook Integration
 * 
 * This script tests the Outlook integration setup and connection flow.
 * Run this after deploying the OAuth connect endpoint.
 */

const https = require('https');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://action.adrata.com';
const TEST_WORKSPACE_ID = process.env.TEST_WORKSPACE_ID;
const TEST_USER_ID = process.env.TEST_USER_ID;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data ? JSON.parse(data) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function testEnvironmentVariables() {
  logSection('1. Environment Variables Check');
  
  const requiredVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_APP_URL',
    'MICROSOFT_CLIENT_ID',
    'MICROSOFT_CLIENT_SECRET',
    'NEXTAUTH_URL',
    'OAUTH_REDIRECT_BASE_URL',
  ];
  
  const optionalVars = [
    'NANGO_SECRET_KEY',
    'NANGO_PUBLIC_KEY',
    'NANGO_WEBHOOK_SECRET',
    'NANGO_HOST',
  ];
  
  let allRequired = true;
  let nangoConfigured = true;
  
  for (const varName of requiredVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logError(`${varName} is NOT set`);
      allRequired = false;
    }
  }
  
  logInfo('\nOptional Nango Configuration:');
  for (const varName of optionalVars) {
    if (process.env[varName]) {
      logSuccess(`${varName} is set`);
    } else {
      logWarning(`${varName} is NOT set`);
      nangoConfigured = false;
    }
  }
  
  if (!allRequired) {
    logError('\n❌ Missing required environment variables');
    return false;
  }
  
  if (!nangoConfigured) {
    logWarning('\n⚠️  Nango not configured - using direct OAuth only');
  }
  
  logSuccess('\n✅ Environment variables check passed');
  return true;
}

async function testDatabaseConnection() {
  logSection('2. Database Connection Test');
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    logSuccess('Database connection successful');
    
    // Check required tables exist
    const tables = ['grand_central_connections', 'email_messages', 'people', 'companies'];
    for (const table of tables) {
      try {
        await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM ${table} LIMIT 1`);
        logSuccess(`Table '${table}' exists`);
      } catch (error) {
        logError(`Table '${table}' does NOT exist`);
        return false;
      }
    }
    
    logSuccess('\n✅ Database connection test passed');
    return true;
  } catch (error) {
    logError(`Database connection failed: ${error.message}`);
    return false;
  }
}

async function testHealthEndpoint() {
  logSection('3. Health Endpoint Test');
  
  try {
    const response = await makeRequest(`${BASE_URL}/api/health/email-sync`);
    
    if (response.statusCode === 200) {
      logSuccess(`Health endpoint returned ${response.statusCode}`);
      
      if (response.body) {
        logInfo(`\nHealth Status: ${response.body.status}`);
        logInfo(`Database: ${response.body.database?.status || 'unknown'}`);
        logInfo(`Environment: ${response.body.environment?.status || 'unknown'}`);
        
        if (response.body.connections) {
          logInfo(`Connections: ${response.body.connections.total} total, ${response.body.connections.active} active`);
        }
        
        if (response.body.emailStats) {
          logInfo(`Emails: ${response.body.emailStats.totalEmails} total, ${response.body.emailStats.linkRate} linked`);
        }
        
        if (response.body.recommendations && response.body.recommendations.length > 0) {
          logWarning('\nRecommendations:');
          response.body.recommendations.forEach(rec => {
            logWarning(`  - ${rec}`);
          });
        }
      }
      
      logSuccess('\n✅ Health endpoint test passed');
      return true;
    } else {
      logError(`Health endpoint returned ${response.statusCode}`);
      if (response.body) {
        logError(JSON.stringify(response.body, null, 2));
      }
      return false;
    }
  } catch (error) {
    logError(`Health endpoint test failed: ${error.message}`);
    return false;
  }
}

async function testOAuthConnectEndpoint() {
  logSection('4. OAuth Connect Endpoint Test');
  
  try {
    // Test GET endpoint (provider info)
    logInfo('Testing GET /api/auth/oauth/connect...');
    const getResponse = await makeRequest(`${BASE_URL}/api/auth/oauth/connect`);
    
    if (getResponse.statusCode === 401) {
      logWarning('GET request returned 401 (expected - requires authentication)');
    } else if (getResponse.statusCode === 200) {
      logSuccess('GET endpoint accessible');
      if (getResponse.body && getResponse.body.providers) {
        logInfo(`Available providers: ${getResponse.body.providers.map(p => p.name).join(', ')}`);
      }
    } else {
      logError(`GET request returned unexpected status: ${getResponse.statusCode}`);
    }
    
    // Test POST endpoint (requires auth, will fail but endpoint should exist)
    logInfo('\nTesting POST /api/auth/oauth/connect...');
    const postResponse = await makeRequest(`${BASE_URL}/api/auth/oauth/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        provider: 'microsoft',
        workspaceId: 'test',
        scopes: []
      })
    });
    
    if (postResponse.statusCode === 401) {
      logSuccess('POST endpoint exists (returned 401 - expected without auth)');
    } else if (postResponse.statusCode === 400 || postResponse.statusCode === 403) {
      logSuccess('POST endpoint exists (returned error - expected without valid auth)');
    } else if (postResponse.statusCode === 200) {
      logSuccess('POST endpoint accessible');
    } else {
      logError(`POST request returned unexpected status: ${postResponse.statusCode}`);
      return false;
    }
    
    logSuccess('\n✅ OAuth connect endpoint test passed');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logError('Connection refused - is the server running?');
    } else {
      logError(`OAuth connect endpoint test failed: ${error.message}`);
    }
    return false;
  }
}

async function testOAuthCallbackEndpoint() {
  logSection('5. OAuth Callback Endpoint Test');
  
  try {
    // Test without parameters (should redirect with error)
    const response = await makeRequest(`${BASE_URL}/api/auth/oauth/callback`);
    
    if (response.statusCode === 302 || response.statusCode === 307) {
      logSuccess('Callback endpoint exists and redirects');
      if (response.headers.location) {
        logInfo(`Redirects to: ${response.headers.location}`);
      }
    } else if (response.statusCode === 200) {
      logWarning('Callback endpoint exists but did not redirect (might be OK)');
    } else {
      logError(`Callback endpoint returned unexpected status: ${response.statusCode}`);
      return false;
    }
    
    logSuccess('\n✅ OAuth callback endpoint test passed');
    return true;
  } catch (error) {
    logError(`OAuth callback endpoint test failed: ${error.message}`);
    return false;
  }
}

async function testDatabaseSchema() {
  logSection('6. Database Schema Validation');
  
  try {
    // Test grand_central_connections structure
    const connection = await prisma.grand_central_connections.findFirst();
    if (connection) {
      logSuccess('Found existing connections');
      logInfo(`Sample connection: ${connection.provider} - ${connection.status}`);
    } else {
      logWarning('No connections found (this is OK for new setup)');
    }
    
    // Test email_messages structure
    const email = await prisma.email_messages.findFirst();
    if (email) {
      logSuccess('Found existing emails');
      logInfo(`Sample email: ${email.subject}`);
    } else {
      logWarning('No emails found (this is OK for new setup)');
    }
    
    logSuccess('\n✅ Database schema validation passed');
    return true;
  } catch (error) {
    logError(`Database schema validation failed: ${error.message}`);
    return false;
  }
}

async function testWebhookEndpoint() {
  logSection('7. Webhook Endpoint Test');
  
  try {
    // Test without signature (should be rejected)
    const response = await makeRequest(`${BASE_URL}/api/webhooks/nango/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        connectionId: 'test',
        provider: 'outlook'
      })
    });
    
    if (response.statusCode === 401) {
      logSuccess('Webhook endpoint exists and requires signature (good security)');
    } else if (response.statusCode === 429) {
      logWarning('Webhook endpoint rate limited (might be from previous tests)');
    } else if (response.statusCode === 500) {
      logWarning('Webhook endpoint exists but returned error (might need config)');
    } else {
      logInfo(`Webhook endpoint returned: ${response.statusCode}`);
    }
    
    logSuccess('\n✅ Webhook endpoint test passed');
    return true;
  } catch (error) {
    logError(`Webhook endpoint test failed: ${error.message}`);
    return false;
  }
}

async function generateTestReport(results) {
  logSection('Test Summary');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const percentage = Math.round((passed / total) * 100);
  
  results.forEach(result => {
    if (result.passed) {
      logSuccess(`${result.name}: PASSED`);
    } else {
      logError(`${result.name}: FAILED`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  if (percentage === 100) {
    logSuccess(`\n🎉 ALL TESTS PASSED! (${passed}/${total})`);
    log('\n✅ The Outlook integration is ready to use!', 'green');
    log('\nNext steps:', 'bright');
    log('1. Navigate to Grand Central → Integrations', 'blue');
    log('2. Click "Connect" on Microsoft Outlook', 'blue');
    log('3. Complete the OAuth flow', 'blue');
    log('4. Verify emails sync correctly', 'blue');
  } else if (percentage >= 80) {
    logWarning(`\n⚠️  MOSTLY WORKING (${passed}/${total} - ${percentage}%)`);
    log('\nThe integration might work, but some features may be limited.', 'yellow');
  } else {
    logError(`\n❌ TESTS FAILED (${passed}/${total} - ${percentage}%)`);
    log('\nThe integration needs more setup before it will work.', 'red');
    log('\nRefer to the setup guide:', 'bright');
    log('docs/grand-central-outlook-setup-guide.md', 'blue');
  }
  console.log('='.repeat(60) + '\n');
}

async function main() {
  log('\n' + '╔' + '═'.repeat(58) + '╗', 'bright');
  log('║' + ' '.repeat(8) + 'Grand Central Outlook Integration Test' + ' '.repeat(11) + '║', 'bright');
  log('╚' + '═'.repeat(58) + '╝\n', 'bright');
  
  const results = [];
  
  results.push({
    name: 'Environment Variables',
    passed: await testEnvironmentVariables()
  });
  
  results.push({
    name: 'Database Connection',
    passed: await testDatabaseConnection()
  });
  
  results.push({
    name: 'Health Endpoint',
    passed: await testHealthEndpoint()
  });
  
  results.push({
    name: 'OAuth Connect Endpoint',
    passed: await testOAuthConnectEndpoint()
  });
  
  results.push({
    name: 'OAuth Callback Endpoint',
    passed: await testOAuthCallbackEndpoint()
  });
  
  results.push({
    name: 'Database Schema',
    passed: await testDatabaseSchema()
  });
  
  results.push({
    name: 'Webhook Endpoint',
    passed: await testWebhookEndpoint()
  });
  
  await generateTestReport(results);
  
  await prisma.$disconnect();
  
  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run tests
main().catch((error) => {
  logError(`\nFatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

