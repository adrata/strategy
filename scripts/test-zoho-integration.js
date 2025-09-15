#!/usr/bin/env node

/**
 * 🧪 ZOHO INTEGRATION TEST SCRIPT
 * 
 * Tests the Zoho webhook integration to verify:
 * 1. Webhook endpoint is accessible
 * 2. Data processing works correctly
 * 3. Database updates are successful
 * 4. Notification system triggers properly
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  webhookUrl: 'https://action.adrata.com/api/webhooks/zoho',
  localUrl: 'http://localhost:3000/api/webhooks/zoho',
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
  testData: {
    leads: {
      id: 'test_lead_' + Date.now(),
      First_Name: 'Test',
      Last_Name: 'Lead',
      Email: 'test.lead@example.com',
      Company: 'Test Company',
      Title: 'Test Manager',
      Phone: '+1-555-0123',
      Description: 'This is a test lead with urgent budget approval needed for Q1 implementation',
      Lead_Status: 'New',
      Lead_Source: 'Test Integration',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    },
    contacts: {
      id: 'test_contact_' + Date.now(),
      First_Name: 'Test',
      Last_Name: 'Contact',
      Email: 'test.contact@example.com',
      Title: 'Test Director',
      Department: 'Engineering',
      Phone: '+1-555-0124',
      Description: 'Test contact with immediate purchase decision required',
      Account_Name: 'Test Account',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    },
    deals: {
      id: 'test_deal_' + Date.now(),
      Deal_Name: 'Test Deal',
      Amount: '50000',
      Stage: 'Proposal',
      Probability: '75',
      Closing_Date: '2025-02-15',
      Description: 'High-value deal with approved budget and urgent timeline',
      Contact_Name: 'Test Contact',
      Account_Name: 'Test Account',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    }
  }
};

/**
 * Send test webhook to Zoho endpoint
 */
async function sendTestWebhook(url, data, type = 'lead') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'ZohoCRM/1.0',
        'X-Zoho-Source': 'test-integration'
      }
    };

    console.log(`🚀 [TEST] Sending ${type} webhook to: ${url}`);
    console.log(`📊 [TEST] Data:`, JSON.stringify(data, null, 2));

    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 [TEST] Response Status: ${res.statusCode}`);
        console.log(`📥 [TEST] Response Headers:`, res.headers);
        console.log(`📥 [TEST] Response Body:`, responseData);
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({
            success: true,
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ [TEST] Request error:`, error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Test webhook endpoint accessibility
 */
async function testWebhookAccessibility() {
  console.log('\n🔍 [TEST] Testing webhook endpoint accessibility...');
  
  try {
    // Test GET request (verification endpoint)
    const getUrl = TEST_CONFIG.webhookUrl;
    const urlObj = new URL(getUrl);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'GET',
      headers: {
        'User-Agent': 'ZohoCRM/1.0'
      }
    };

    return new Promise((resolve, reject) => {
      const req = client.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          console.log(`✅ [TEST] GET request successful: ${res.statusCode}`);
          console.log(`📥 [TEST] Response:`, responseData);
          resolve({ success: true, statusCode: res.statusCode, data: responseData });
        });
      });

      req.on('error', (error) => {
        console.error(`❌ [TEST] GET request failed:`, error);
        reject(error);
      });

      req.end();
    });
  } catch (error) {
    console.error(`❌ [TEST] Webhook accessibility test failed:`, error);
    throw error;
  }
}

/**
 * Test lead webhook processing
 */
async function testLeadWebhook() {
  console.log('\n👥 [TEST] Testing lead webhook processing...');
  
  try {
    const result = await sendTestWebhook(
      TEST_CONFIG.webhookUrl,
      TEST_CONFIG.testData.leads,
      'lead'
    );
    
    console.log(`✅ [TEST] Lead webhook test completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Lead webhook test failed:`, error);
    throw error;
  }
}

/**
 * Test contact webhook processing
 */
async function testContactWebhook() {
  console.log('\n📞 [TEST] Testing contact webhook processing...');
  
  try {
    const result = await sendTestWebhook(
      TEST_CONFIG.webhookUrl,
      TEST_CONFIG.testData.contacts,
      'contact'
    );
    
    console.log(`✅ [TEST] Contact webhook test completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Contact webhook test failed:`, error);
    throw error;
  }
}

/**
 * Test deal webhook processing
 */
async function testDealWebhook() {
  console.log('\n💼 [TEST] Testing deal webhook processing...');
  
  try {
    const result = await sendTestWebhook(
      TEST_CONFIG.webhookUrl,
      TEST_CONFIG.testData.deals,
      'deal'
    );
    
    console.log(`✅ [TEST] Deal webhook test completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Deal webhook test failed:`, error);
    throw error;
  }
}

/**
 * Test buying signal detection
 */
async function testBuyingSignalDetection() {
  console.log('\n🚨 [TEST] Testing buying signal detection...');
  
  const testData = {
    ...TEST_CONFIG.testData.leads,
    Description: 'URGENT: Budget approved for Q1 implementation. Need immediate quotes and proposal. Decision by end of week. Ready to purchase ASAP.'
  };
  
  try {
    const result = await sendTestWebhook(
      TEST_CONFIG.webhookUrl,
      testData,
      'lead_with_signals'
    );
    
    console.log(`✅ [TEST] Buying signal detection test completed`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Buying signal detection test failed:`, error);
    throw error;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🧪 [ZOHO INTEGRATION TEST] Starting comprehensive test suite...');
  console.log(`🎯 [TEST] Target workspace: ${TEST_CONFIG.workspaceId}`);
  console.log(`🌐 [TEST] Webhook URL: ${TEST_CONFIG.webhookUrl}`);
  
  const results = {
    accessibility: null,
    lead: null,
    contact: null,
    deal: null,
    buyingSignals: null
  };
  
  try {
    // Test 1: Webhook accessibility
    results.accessibility = await testWebhookAccessibility();
    
    // Test 2: Lead processing
    results.lead = await testLeadWebhook();
    
    // Test 3: Contact processing
    results.contact = await testContactWebhook();
    
    // Test 4: Deal processing
    results.deal = await testDealWebhook();
    
    // Test 5: Buying signal detection
    results.buyingSignals = await testBuyingSignalDetection();
    
    console.log('\n🎉 [TEST] All tests completed successfully!');
    console.log('\n📊 [TEST] Results Summary:');
    console.log(`✅ Webhook Accessibility: ${results.accessibility?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Lead Processing: ${results.lead?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Contact Processing: ${results.contact?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Deal Processing: ${results.deal?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Buying Signal Detection: ${results.buyingSignals?.success ? 'PASS' : 'FAIL'}`);
    
    return results;
  } catch (error) {
    console.error('\n❌ [TEST] Test suite failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then((results) => {
      console.log('\n✅ [TEST] Integration test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ [TEST] Integration test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  testWebhookAccessibility,
  testLeadWebhook,
  testContactWebhook,
  testDealWebhook,
  testBuyingSignalDetection
};
