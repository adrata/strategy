/**
 * 🧪 ZOHO NOTIFICATIONS BROWSER TEST SCRIPT
 * 
 * Run this in your browser console to test Zoho notifications
 * Copy and paste this entire script into the browser console
 */

(function() {
  console.log('🧪 [ZOHO NOTIFICATIONS TEST] Starting browser test...');
  
  // Test configuration
  const TEST_CONFIG = {
    workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace
    webhookUrl: '/api/webhooks/zoho',
    notificationsApiUrl: '/api/zoho/notifications'
  };

  // Test data
  const testData = {
    lead: {
      id: 'browser_test_lead_' + Date.now(),
      First_Name: 'Browser',
      Last_Name: 'Test',
      Email: 'browser.test@example.com',
      Company: 'Browser Test Company',
      Title: 'Test Manager',
      Phone: '+1-555-0999',
      Description: 'Browser test lead with urgent budget approval needed for Q1 implementation',
      Lead_Status: 'New',
      Lead_Source: 'Browser Test',
      workspaceId: TEST_CONFIG.workspaceId
    },
    contact: {
      id: 'browser_test_contact_' + Date.now(),
      First_Name: 'Browser',
      Last_Name: 'Contact',
      Email: 'browser.contact@example.com',
      Title: 'Test Director',
      Department: 'Engineering',
      Phone: '+1-555-0998',
      Description: 'Browser test contact with immediate purchase decision required',
      Account_Name: 'Browser Test Account',
      workspaceId: TEST_CONFIG.workspaceId
    },
    deal: {
      id: 'browser_test_deal_' + Date.now(),
      Deal_Name: 'Browser Test Deal',
      Amount: '125000',
      Stage: 'Proposal',
      Probability: '90',
      Closing_Date: '2025-02-28',
      Description: 'High-value browser test deal with approved budget and urgent timeline',
      Contact_Name: 'Browser Test Contact',
      Account_Name: 'Browser Test Account',
      workspaceId: TEST_CONFIG.workspaceId
    }
  };

  // Test functions
  const testFunctions = {
    // Send test webhook
    async sendWebhook(type) {
      console.log(`🚀 [BROWSER TEST] Sending ${type} webhook...`);
      
      try {
        const response = await fetch(TEST_CONFIG.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(testData[type])
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`✅ [BROWSER TEST] ${type} webhook sent successfully:`, result);
          return { success: true, data: result };
        } else {
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        console.error(`❌ [BROWSER TEST] ${type} webhook failed:`, error);
        return { success: false, error: error.message };
      }
    },

    // Test notifications API
    async testNotificationsAPI() {
      console.log('📡 [BROWSER TEST] Testing notifications API...');
      
      try {
        const response = await fetch(`${TEST_CONFIG.notificationsApiUrl}?workspaceId=${TEST_CONFIG.workspaceId}&limit=10`);
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ [BROWSER TEST] Notifications API test successful:', result);
          return { success: true, data: result };
        } else {
          throw new Error(`HTTP ${response.status}: ${JSON.stringify(result)}`);
        }
      } catch (error) {
        console.error('❌ [BROWSER TEST] Notifications API test failed:', error);
        return { success: false, error: error.message };
      }
    },

    // Test all webhooks
    async testAllWebhooks() {
      console.log('🧪 [BROWSER TEST] Testing all webhook types...');
      
      const results = {};
      
      for (const type of ['lead', 'contact', 'deal']) {
        results[type] = await this.sendWebhook(type);
        // Wait 2 seconds between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log('📊 [BROWSER TEST] All webhook test results:', results);
      return results;
    },

    // Run complete test suite
    async runCompleteTest() {
      console.log('🎯 [BROWSER TEST] Running complete test suite...');
      
      const results = {
        webhooks: await this.testAllWebhooks(),
        api: await this.testNotificationsAPI()
      };
      
      console.log('🎉 [BROWSER TEST] Complete test results:', results);
      return results;
    },

    // Listen for notifications (if Pusher is available)
    listenForNotifications() {
      console.log('👂 [BROWSER TEST] Setting up notification listener...');
      
      // Check if Pusher is available
      if (typeof window.Pusher !== 'undefined') {
        console.log('📡 [BROWSER TEST] Pusher found, setting up real-time listener...');
        
        const pusher = new window.Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY || 'your-pusher-key', {
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2'
        });
        
        const channel = pusher.subscribe(`workspace-${TEST_CONFIG.workspaceId}`);
        
        channel.bind('zoho_update', (data) => {
          console.log('🔔 [BROWSER TEST] Real-time notification received:', data);
        });
        
        channel.bind('speedrun_signal', (data) => {
          console.log('🚨 [BROWSER TEST] Speedrun signal received:', data);
        });
        
        console.log('✅ [BROWSER TEST] Real-time listener set up successfully');
        return pusher;
      } else {
        console.log('⚠️ [BROWSER TEST] Pusher not available, skipping real-time listener');
        return null;
      }
    }
  };

  // Make test functions available globally
  window.zohoTest = testFunctions;
  
  console.log('✅ [BROWSER TEST] Test functions loaded! Available commands:');
  console.log('  zohoTest.sendWebhook("lead") - Send lead webhook');
  console.log('  zohoTest.sendWebhook("contact") - Send contact webhook');
  console.log('  zohoTest.sendWebhook("deal") - Send deal webhook');
  console.log('  zohoTest.testAllWebhooks() - Test all webhook types');
  console.log('  zohoTest.testNotificationsAPI() - Test notifications API');
  console.log('  zohoTest.runCompleteTest() - Run complete test suite');
  console.log('  zohoTest.listenForNotifications() - Set up real-time listener');
  
  // Auto-run a quick test
  console.log('🚀 [BROWSER TEST] Auto-running quick test...');
  testFunctions.sendWebhook('lead').then(result => {
    if (result.success) {
      console.log('🎉 [BROWSER TEST] Quick test passed! Zoho notifications are working.');
    } else {
      console.log('❌ [BROWSER TEST] Quick test failed. Check the error above.');
    }
  });

})();
