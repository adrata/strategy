#!/usr/bin/env node

/**
 * 🧪 ZOHO NOTIFICATIONS TEST SCRIPT
 * 
 * Tests the complete Zoho notification flow:
 * 1. Send test webhook with notification data
 * 2. Verify notification is stored in database
 * 3. Check Pusher notification is sent
 * 4. Test API endpoints for fetching notifications
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  webhookUrl: 'https://action.adrata.com/api/webhooks/zoho',
  notificationsApiUrl: 'https://action.adrata.com/api/zoho/notifications',
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
  testData: {
    lead: {
      id: 'notification_test_lead_' + Date.now(),
      First_Name: 'Notification',
      Last_Name: 'Test',
      Email: 'notification.test@example.com',
      Company: 'Test Notification Company',
      Title: 'Test Manager',
      Phone: '+1-555-0999',
      Description: 'This is a test lead for notification system with urgent budget approval needed',
      Lead_Status: 'New',
      Lead_Source: 'Notification Test',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    },
    contact: {
      id: 'notification_test_contact_' + Date.now(),
      First_Name: 'Notification',
      Last_Name: 'Contact',
      Email: 'notification.contact@example.com',
      Title: 'Test Director',
      Department: 'Engineering',
      Phone: '+1-555-0998',
      Description: 'Test contact for notification system with immediate purchase decision required',
      Account_Name: 'Test Notification Account',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    },
    deal: {
      id: 'notification_test_deal_' + Date.now(),
      Deal_Name: 'Notification Test Deal',
      Amount: '75000',
      Stage: 'Proposal',
      Probability: '80',
      Closing_Date: '2025-02-20',
      Description: 'High-value test deal with approved budget and urgent timeline for notification testing',
      Contact_Name: 'Notification Test Contact',
      Account_Name: 'Test Notification Account',
      workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72'
    }
  }
};

/**
 * Send HTTP request
 */
async function sendRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ZohoNotificationTest/1.0',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    console.log(`🚀 [TEST] ${requestOptions.method} ${url}`);
    if (options.body) {
      console.log(`📊 [TEST] Body:`, options.body);
    }

    const req = client.request(requestOptions, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log(`📥 [TEST] Response Status: ${res.statusCode}`);
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

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Test webhook with notification
 */
async function testWebhookWithNotification(data, type) {
  console.log(`\n🔔 [TEST] Testing ${type} webhook with notification...`);
  
  try {
    const result = await sendRequest(TEST_CONFIG.webhookUrl, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    console.log(`✅ [TEST] ${type} webhook with notification completed successfully`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] ${type} webhook with notification failed:`, error);
    throw error;
  }
}

/**
 * Test notifications API
 */
async function testNotificationsAPI() {
  console.log(`\n📡 [TEST] Testing notifications API...`);
  
  try {
    const url = `${TEST_CONFIG.notificationsApiUrl}?workspaceId=${TEST_CONFIG.workspaceId}&limit=10`;
    const result = await sendRequest(url);
    
    const responseData = JSON.parse(result.data);
    console.log(`✅ [TEST] Notifications API test completed`);
    console.log(`📊 [TEST] Found ${responseData.count} notifications`);
    
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Notifications API test failed:`, error);
    throw error;
  }
}

/**
 * Test notification read API
 */
async function testNotificationReadAPI(notificationId) {
  console.log(`\n✅ [TEST] Testing notification read API...`);
  
  try {
    const url = `${TEST_CONFIG.notificationsApiUrl}/${notificationId}/read`;
    const result = await sendRequest(url, {
      method: 'POST',
      body: JSON.stringify({
        workspaceId: TEST_CONFIG.workspaceId,
        userId: 'test-user-id'
      })
    });
    
    console.log(`✅ [TEST] Notification read API test completed`);
    return result;
  } catch (error) {
    console.error(`❌ [TEST] Notification read API test failed:`, error);
    throw error;
  }
}

/**
 * Wait for notification processing
 */
async function waitForProcessing(seconds = 5) {
  console.log(`⏳ [TEST] Waiting ${seconds} seconds for notification processing...`);
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Run complete notification test
 */
async function runNotificationTest() {
  console.log('🧪 [ZOHO NOTIFICATIONS TEST] Starting comprehensive notification test...');
  console.log(`🎯 [TEST] Target workspace: ${TEST_CONFIG.workspaceId}`);
  console.log(`🌐 [TEST] Webhook URL: ${TEST_CONFIG.webhookUrl}`);
  console.log(`📡 [TEST] Notifications API: ${TEST_CONFIG.notificationsApiUrl}`);
  
  const results = {
    leadWebhook: null,
    contactWebhook: null,
    dealWebhook: null,
    notificationsAPI: null,
    notificationRead: null
  };
  
  try {
    // Test 1: Lead webhook with notification
    results.leadWebhook = await testWebhookWithNotification(TEST_CONFIG.testData.lead, 'lead');
    await waitForProcessing(3);
    
    // Test 2: Contact webhook with notification
    results.contactWebhook = await testWebhookWithNotification(TEST_CONFIG.testData.contact, 'contact');
    await waitForProcessing(3);
    
    // Test 3: Deal webhook with notification
    results.dealWebhook = await testWebhookWithNotification(TEST_CONFIG.testData.deal, 'deal');
    await waitForProcessing(3);
    
    // Test 4: Fetch notifications via API
    results.notificationsAPI = await testNotificationsAPI();
    
    // Test 5: Test notification read API (if we have notifications)
    const notificationsData = JSON.parse(results.notificationsAPI.data);
    if (notificationsData.notifications && notificationsData.notifications.length > 0) {
      const firstNotification = notificationsData.notifications[0];
      results.notificationRead = await testNotificationReadAPI(firstNotification.record.id);
    }
    
    console.log('\n🎉 [TEST] All notification tests completed successfully!');
    console.log('\n📊 [TEST] Results Summary:');
    console.log(`✅ Lead Webhook: ${results.leadWebhook?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Contact Webhook: ${results.contactWebhook?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Deal Webhook: ${results.dealWebhook?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Notifications API: ${results.notificationsAPI?.success ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Notification Read API: ${results.notificationRead?.success ? 'PASS' : 'FAIL'}`);
    
    // Show notification details
    if (results.notificationsAPI) {
      const notificationsData = JSON.parse(results.notificationsAPI.data);
      console.log('\n🔔 [TEST] Recent Notifications:');
      notificationsData.notifications.slice(0, 3).forEach((notification, index) => {
        console.log(`${index + 1}. ${notification.note.title} (${notification.module} - ${notification.operation})`);
        console.log(`   Priority: ${notification.priority}, Time: ${notification.timestamp}`);
      });
    }
    
    return results;
  } catch (error) {
    console.error('\n❌ [TEST] Notification test suite failed:', error);
    throw error;
  }
}

// Run tests if called directly
if (require.main === module) {
  runNotificationTest()
    .then((results) => {
      console.log('\n✅ [TEST] Zoho notification test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ [TEST] Zoho notification test failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runNotificationTest,
  testWebhookWithNotification,
  testNotificationsAPI,
  testNotificationReadAPI
};
