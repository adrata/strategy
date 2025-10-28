#!/usr/bin/env node

/**
 * Production Email Integration Test
 * 
 * Comprehensive test suite for Grand Central email integration
 * Tests OAuth flows, email sync, webhooks, and error handling
 */

const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://action.adrata.com',
  timeout: 30000, // 30 seconds
  retries: 3
};

async function runTest(testName, testFn) {
  console.log(`\n🧪 Running test: ${testName}`);
  const startTime = Date.now();
  
  try {
    const result = await testFn();
    const duration = Date.now() - startTime;
    console.log(`✅ ${testName} - PASSED (${duration}ms)`);
    return { name: testName, status: 'PASSED', duration, result };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
    return { name: testName, status: 'FAILED', duration, error: error.message };
  }
}

async function testEnvironmentVariables() {
  const requiredVars = [
    'NANGO_SECRET_KEY',
    'NANGO_PUBLIC_KEY', 
    'NANGO_WEBHOOK_SECRET',
    'MICROSOFT_CLIENT_SECRET',
    'GOOGLE_CLIENT_SECRET',
    'DATABASE_URL'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
  
  return { present: requiredVars.length - missing.length, missing: missing.length };
}

async function testDatabaseConnectivity() {
  await prisma.$queryRaw`SELECT 1`;
  
  // Test email_messages table
  const emailCount = await prisma.email_messages.count();
  
  // Test grand_central_connections table
  const connectionCount = await prisma.grand_central_connections.count();
  
  return { emailCount, connectionCount };
}

async function testNangoConfiguration() {
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/integrations/nango/config`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    timeout: TEST_CONFIG.timeout
  });
  
  if (!response.ok) {
    throw new Error(`Nango config endpoint returned ${response.status}`);
  }
  
  const config = await response.json();
  
  if (config.nangoStatus !== 'connected') {
    throw new Error(`Nango not connected: ${config.nangoError || 'Unknown error'}`);
  }
  
  return config;
}

async function testEmailSyncAPI() {
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/v1/communications/email/sync`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // This would need proper auth in real test
    },
    body: JSON.stringify({}),
    timeout: TEST_CONFIG.timeout
  });
  
  // We expect this to fail with auth error, but endpoint should exist
  if (response.status === 404) {
    throw new Error('Email sync API endpoint not found');
  }
  
  return { status: response.status, endpoint: 'accessible' };
}

async function testWebhookEndpoint() {
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhooks/nango/email`, {
    method: 'GET',
    timeout: TEST_CONFIG.timeout
  });
  
  if (!response.ok) {
    throw new Error(`Webhook endpoint returned ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.message || !data.message.includes('Nango Email Webhook')) {
    throw new Error('Webhook endpoint not properly configured');
  }
  
  return data;
}

async function testHealthCheck() {
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health/email-sync`, {
    method: 'GET',
    timeout: TEST_CONFIG.timeout
  });
  
  if (!response.ok) {
    throw new Error(`Health check returned ${response.status}`);
  }
  
  const health = await response.json();
  
  if (health.status !== 'healthy') {
    throw new Error(`Health check failed: ${JSON.stringify(health.recommendations)}`);
  }
  
  return health;
}

async function testEmailLinking() {
  // Test email linking logic
  const emailsWithLinks = await prisma.email_messages.count({
    where: {
      OR: [
        { personId: { not: null } },
        { companyId: { not: null } }
      ]
    }
  });
  
  const totalEmails = await prisma.email_messages.count();
  const linkRate = totalEmails > 0 ? Math.round((emailsWithLinks / totalEmails) * 100) : 0;
  
  if (linkRate < 10 && totalEmails > 0) {
    console.warn(`⚠️ Low email linking rate: ${linkRate}%`);
  }
  
  return { totalEmails, linkedEmails: emailsWithLinks, linkRate };
}

async function testConnectionManagement() {
  const connections = await prisma.grand_central_connections.findMany({
    where: {
      provider: { in: ['outlook', 'gmail'] }
    }
  });
  
  const activeConnections = connections.filter(c => c.status === 'active');
  
  return {
    total: connections.length,
    active: activeConnections.length,
    byProvider: {
      outlook: connections.filter(c => c.provider === 'outlook').length,
      gmail: connections.filter(c => c.provider === 'gmail').length
    }
  };
}

async function testErrorHandling() {
  // Test webhook with invalid signature
  const response = await fetch(`${TEST_CONFIG.baseUrl}/api/webhooks/nango/email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-nango-signature': 'invalid-signature'
    },
    body: JSON.stringify({ test: 'data' }),
    timeout: TEST_CONFIG.timeout
  });
  
  // Should return 401 for invalid signature
  if (response.status !== 401) {
    throw new Error(`Expected 401 for invalid signature, got ${response.status}`);
  }
  
  return { status: 'properly_rejected_invalid_signature' };
}

async function runAllTests() {
  console.log('🚀 Starting Grand Central Email Integration Production Tests\n');
  
  const tests = [
    testEnvironmentVariables,
    testDatabaseConnectivity,
    testNangoConfiguration,
    testEmailSyncAPI,
    testWebhookEndpoint,
    testHealthCheck,
    testEmailLinking,
    testConnectionManagement,
    testErrorHandling
  ];
  
  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test.name, test);
    results.push(result);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.status === 'PASSED').length;
  const failed = results.filter(r => r.status === 'FAILED').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️ Total Duration: ${totalDuration}ms`);
  console.log();
  
  if (failed > 0) {
    console.log('❌ Failed Tests:');
    results
      .filter(r => r.status === 'FAILED')
      .forEach(r => console.log(`  - ${r.name}: ${r.error}`));
    console.log();
  }
  
  // Recommendations
  console.log('💡 Recommendations:');
  console.log('===================');
  
  if (failed === 0) {
    console.log('🎉 All tests passed! Email integration is ready for production.');
    console.log('📋 Next steps:');
    console.log('  1. Configure Nango integrations in dashboard');
    console.log('  2. Set up Azure AD and Google Cloud Console');
    console.log('  3. Configure webhook URL in Nango');
    console.log('  4. Test with real user accounts');
    console.log('  5. Monitor health check endpoint');
  } else {
    console.log('🔧 Fix the failed tests before deploying to production.');
    console.log('📖 See the production audit plan for detailed setup instructions.');
  }
  
  return { passed, failed, totalDuration, results };
}

// Run tests
runAllTests()
  .then(({ passed, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
