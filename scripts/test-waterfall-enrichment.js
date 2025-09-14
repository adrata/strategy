#!/usr/bin/env node

/**
 * 🌊 WATERFALL ENRICHMENT SYSTEM TEST
 * 
 * Tests the adaptive waterfall enrichment with actual API keys:
 * - ZeroBounce: CREDENTIAL_REMOVED_FOR_SECURITY
 * - Prospeo: CREDENTIAL_REMOVED_FOR_SECURITY
 * - Lusha: CREDENTIAL_REMOVED_FOR_SECURITY
 */

const fetch = globalThis.fetch || require('node-fetch');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testData: {
    // Test email verification
    emailVerification: {
      email: 'test@example.com',
      type: 'email_verification'
    },
    // Test email finding
    emailFinding: {
      firstName: 'John',
      lastName: 'Doe',
      company: 'Microsoft',
      domain: 'microsoft.com',
      type: 'email_finding'
    },
    // Test phone lookup
    phoneLookup: {
      phone: '+1-555-123-4567',
      type: 'phone_lookup'
    }
  }
};

// API Keys from environment (should be set locally)
const API_KEYS = {
  ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
  PROSPEO_API_KEY: process.env.PROSPEO_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
  LUSHA_API_KEY: process.env.LUSHA_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
  CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN
};

async function testWaterfallEnrichment() {
  console.log('🌊 Testing Adaptive Waterfall Enrichment System');
  console.log('=' .repeat(60));

  // Check API keys
  console.log('\n📋 API Key Status:');
  Object.entries(API_KEYS).forEach(([key, value]) => {
    const status = value ? '✅' : '❌';
    const display = value ? `${value.substring(0, 8)}...` : 'Not set';
    console.log(`  ${status} ${key}: ${display}`);
  });

  // Test 1: Email Verification with ZeroBounce
  console.log('\n🔍 Test 1: Email Verification (ZeroBounce)');
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email_verification',
        data: TEST_CONFIG.testData.emailVerification,
        priority: 'high',
        maxCost: 0.50,
        requiredConfidence: 80,
        userId: 'test-user',
        workspaceId: 'test-workspace'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Email verification successful');
      console.log(`  📊 Provider: ${result.provider}`);
      console.log(`  💰 Cost: $${result.cost}`);
      console.log(`  🎯 Confidence: ${result.confidence}%`);
    } else {
      console.log(`  ❌ Email verification failed: ${response.status}`);
      const error = await response.text();
      console.log(`  📝 Error: ${error}`);
    }
  } catch (error) {
    console.log(`  ❌ Email verification error: ${error.message}`);
  }

  // Test 2: Email Finding with Prospeo
  console.log('\n🔍 Test 2: Email Finding (Prospeo)');
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'email_finding',
        data: TEST_CONFIG.testData.emailFinding,
        priority: 'high',
        maxCost: 1.00,
        requiredConfidence: 70,
        userId: 'test-user',
        workspaceId: 'test-workspace'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Email finding successful');
      console.log(`  📊 Provider: ${result.provider}`);
      console.log(`  💰 Cost: $${result.cost}`);
      console.log(`  🎯 Confidence: ${result.confidence}%`);
      console.log(`  📧 Found email: ${result.data.email || 'N/A'}`);
    } else {
      console.log(`  ❌ Email finding failed: ${response.status}`);
      const error = await response.text();
      console.log(`  📝 Error: ${error}`);
    }
  } catch (error) {
    console.log(`  ❌ Email finding error: ${error.message}`);
  }

  // Test 3: Phone Lookup with Twilio
  console.log('\n🔍 Test 3: Phone Lookup (Twilio)');
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'phone_lookup',
        data: TEST_CONFIG.testData.phoneLookup,
        priority: 'medium',
        maxCost: 0.25,
        requiredConfidence: 75,
        userId: 'test-user',
        workspaceId: 'test-workspace'
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('  ✅ Phone lookup successful');
      console.log(`  📊 Provider: ${result.provider}`);
      console.log(`  💰 Cost: $${result.cost}`);
      console.log(`  🎯 Confidence: ${result.confidence}%`);
    } else {
      console.log(`  ❌ Phone lookup failed: ${response.status}`);
      const error = await response.text();
      console.log(`  📝 Error: ${error}`);
    }
  } catch (error) {
    console.log(`  ❌ Phone lookup error: ${error.message}`);
  }

  // Test 4: Provider Health Check
  console.log('\n🔍 Test 4: Provider Health Check');
  try {
    const response = await fetch(`${TEST_CONFIG.baseUrl}/api/enrichment/waterfall/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.ok) {
      const health = await response.json();
      console.log('  ✅ Health check successful');
      console.log('  📊 Provider Status:');
      health.providers.forEach(provider => {
        const status = provider.isActive ? '✅' : '❌';
        console.log(`    ${status} ${provider.name}: ${provider.successRate * 100}% success rate`);
      });
    } else {
      console.log(`  ❌ Health check failed: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ❌ Health check error: ${error.message}`);
  }

  console.log('\n🎯 Waterfall Enrichment Test Complete');
  console.log('=' .repeat(60));
}

// Run tests if called directly
if (require.main === module) {
  testWaterfallEnrichment().catch(console.error);
}

module.exports = { testWaterfallEnrichment };
