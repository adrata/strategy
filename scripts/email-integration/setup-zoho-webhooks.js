/**
 * 🔧 SETUP ZOHO CRM WEBHOOKS
 * 
 * This script sets up webhooks in Zoho CRM for real-time notifications
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupZohoWebhooks() {
  console.log('🔧 [ZOHO WEBHOOKS] Setting up Zoho CRM webhooks...\n');

  try {
    // Get Zoho credentials
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's workspace
    
    const zohoToken = await prisma.providerToken.findUnique({
      where: {
        workspaceId_provider: {
          workspaceId: workspaceId,
          provider: 'zoho'
        }
      }
    });

    if (!zohoToken) {
      console.log('❌ No Zoho credentials found. Please complete OAuth first.');
      return;
    }

    console.log('✅ Found Zoho credentials');

    // Webhook endpoint URL
    const webhookUrl = 'https://action.adrata.com/api/webhooks/zoho';
    
    // Test the webhook endpoint first
    console.log('\n🧪 Testing webhook endpoint...');
    try {
      const testResponse = await fetch(webhookUrl);
      if (testResponse.ok) {
        console.log('✅ Webhook endpoint is accessible');
      } else {
        console.log(`⚠️ Webhook endpoint returned: ${testResponse.status}`);
      }
    } catch (error) {
      console.log(`❌ Webhook endpoint test failed: ${error.message}`);
    }

    // Create webhooks for different modules
    const webhooksToCreate = [
      {
        name: 'Adrata Lead Sync',
        module: 'Leads',
        events: ['create', 'update', 'delete'],
        description: 'Sync lead changes to Adrata'
      },
      {
        name: 'Adrata Contact Sync', 
        module: 'Contacts',
        events: ['create', 'update', 'delete'],
        description: 'Sync contact changes to Adrata'
      },
      {
        name: 'Adrata Deal Sync',
        module: 'Deals', 
        events: ['create', 'update', 'delete'],
        description: 'Sync deal changes to Adrata'
      }
    ];

    // Note: Zoho CRM uses workflow rules to trigger webhooks
    // We need to provide instructions for manual setup
    console.log('\n📋 WEBHOOK SETUP INSTRUCTIONS:');
    console.log('==================================');
    console.log('Since Zoho CRM webhooks require manual setup through the UI, please follow these steps:');
    console.log('');
    console.log('1. 🔗 WEBHOOK CREATION:');
    console.log('   • Go to: Setup > Automation > Actions > Webhooks');
    console.log('   • Click "Create Webhook"');
    console.log('   • Configure each webhook as follows:');
    console.log('');

    webhooksToCreate.forEach((webhook, index) => {
      console.log(`   📍 Webhook ${index + 1}: ${webhook.name}`);
      console.log(`      • Name: ${webhook.name}`);
      console.log(`      • URL to Notify: ${webhookUrl}`);
      console.log(`      • Method: POST`);
      console.log(`      • Content Type: application/json`);
      console.log(`      • Description: ${webhook.description}`);
      console.log('');
    });

    console.log('2. 🔄 WORKFLOW RULE CREATION:');
    console.log('   • Go to: Setup > Automation > Workflow Rules');
    console.log('   • Create rules for each module (Leads, Contacts, Deals):');
    console.log('');

    webhooksToCreate.forEach((webhook, index) => {
      console.log(`   📍 Rule ${index + 1}: ${webhook.module} Auto-Sync`);
      console.log(`      • Module: ${webhook.module}`);
      console.log(`      • Trigger: All Create/Update/Delete operations`);
      console.log(`      • Condition: All records (no specific criteria)`);
      console.log(`      • Instant Action: Associate the "${webhook.name}" webhook`);
      console.log('');
    });

    console.log('3. 🧪 TESTING:');
    console.log('   • Create/update a test lead, contact, or deal in Zoho');
    console.log('   • Check Adrata logs to verify webhook notifications are received');
    console.log('   • Verify data is synchronized in Adrata database');
    console.log('');
    console.log('4. 📊 WEBHOOK ENDPOINT DETAILS:');
    console.log(`   • Endpoint URL: ${webhookUrl}`);
    console.log('   • Method: POST');
    console.log('   • Content-Type: application/json');
    console.log('   • Expected payload format: Zoho CRM standard webhook format');
    console.log('');

    // Test webhook endpoint authentication
    console.log('🔐 WEBHOOK SECURITY:');
    console.log('   • The webhook endpoint is publicly accessible (as required by Zoho)');
    console.log('   • Consider implementing IP whitelisting for Zoho IPs if needed');
    console.log('   • Webhook payload validation is handled in the endpoint');
    console.log('');

    console.log('✅ Webhook setup instructions provided!');
    console.log('📍 Complete the manual setup in Zoho CRM UI as described above.');

  } catch (error) {
    console.error('❌ [ZOHO WEBHOOKS] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupZohoWebhooks().catch(console.error);
}

module.exports = { setupZohoWebhooks };
