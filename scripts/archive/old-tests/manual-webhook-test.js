/**
 * 🔧 MANUAL WEBHOOK TEST
 * 
 * Manually trigger webhook with Sarah Mitchell data to test the pipeline
 */

const { spawn } = require('child_process');

async function manualWebhookTest() {
  console.log('🔧 [MANUAL WEBHOOK] Triggering Sarah Mitchell webhook test...\n');

  const webhookPayload = {
    module: 'Leads',
    operation: 'update',
    data: [
      {
        id: 'zoho-sarah-mitchell-' + Date.now(),
        First_Name: 'Sarah',
        Last_Name: 'Mitchell',
        Email: 'sarah.mitchell@retailsolutions.com',
        Company: 'Retail Solutions Inc',
        Title: 'IT Director',
        Phone: '+1-555-0123',
        Lead_Status: 'Hot Lead',
        Description: 'URGENT: Looking to purchase POS system next quarter with budget approved for $50K solution. Need implementation by Q2 2024. Decision timeline is critical - end of month deadline. Ready to move forward immediately with the right vendor.',
        Modified_Time: new Date().toISOString(),
        Modified_By: {
          name: 'Dan (Manual Webhook Test)',
          id: 'test-user'
        }
      }
    ]
  };

  console.log('📨 Webhook payload:');
  console.log(JSON.stringify(webhookPayload, null, 2));
  console.log('');

  // Create curl command
  const curlCommand = [
    'curl',
    '-X', 'POST',
    'https://action.adrata.com/api/webhooks/zoho',
    '-H', 'Content-Type: application/json',
    '-H', 'User-Agent: Zoho-Manual-Test',
    '-d', JSON.stringify(webhookPayload)
  ];

  console.log('🚀 Sending webhook to production endpoint...');
  console.log('📍 Command:', curlCommand.join(' '));
  console.log('');

  return new Promise((resolve, reject) => {
    const curl = spawn('curl', curlCommand.slice(1));
    
    let output = '';
    let error = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      error += data.toString();
    });

    curl.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Webhook sent successfully!');
        console.log('📍 Response:', output);
        
        if (output.includes('success') || output.includes('200') || output.includes('OK')) {
          console.log('🎉 Webhook processed successfully!');
        } else {
          console.log('⚠️ Webhook response unclear, but sent successfully');
        }
        
        console.log('\n🔍 Next steps:');
        console.log('1. Wait 30 seconds for processing');
        console.log('2. Run: node scripts/check-sarah-mitchell-webhook.js');
        console.log('3. Go to: http://localhost:3000/pipeline/speedrun');
        console.log('4. Press Cmd+I to test Monaco Signal popup');
        
        resolve(output);
      } else {
        console.log('❌ Webhook send failed!');
        console.log('📍 Error:', error);
        console.log('📍 Exit code:', code);
        reject(new Error(error));
      }
    });
  });
}

if (require.main === module) {
  manualWebhookTest().catch(console.error);
}

module.exports = { manualWebhookTest };
