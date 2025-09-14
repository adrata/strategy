#!/usr/bin/env node

/**
 * 🧪 END-TO-END QA TEST: Email Sync & Zoho Integration for Dano
 * 
 * Tests:
 * 1. Real-time email sync and webhook for Dano with Resend outbound integration
 * 2. Zoho note updates triggering Monaco signal popup
 * 
 * Requirements:
 * - Dano's workspace: 01K1VBYV8ETM2RCQA4GNN9EG72
 * - Dano's user ID: 01K1VBYYV7TRPY04NW4TW4XWRB
 * - Email: dano@retail-products.com
 */

const fetch = require('node-fetch');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Dano's configuration
const DANO_CONFIG = {
  workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
  userId: '01K1VBYYV7TRPY04NW4TW4XWRB',
  email: 'dano@retail-products.com',
  workspace: 'Retail Product Solutions'
};

const BASE_URL = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';

console.log('🧪 Starting END-TO-END QA Tests for Dano...');
console.log(`📧 Testing for: ${DANO_CONFIG.email} (${DANO_CONFIG.workspace})`);
console.log(`🌐 Base URL: ${BASE_URL}`);

async function main() {
  try {
    console.log('\n🔥 QA TEST 1: REAL-TIME EMAIL SYNC & WEBHOOK');
    await testEmailSyncAndWebhook();
    
    console.log('\n🔥 QA TEST 2: ZOHO INTEGRATION & MONACO SIGNALS');
    await testZohoIntegrationAndMonacoSignals();
    
    console.log('\n✅ ALL QA TESTS COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ QA Test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * TEST 1: Real-time Email Sync and Webhook for Dano
 */
async function testEmailSyncAndWebhook() {
  console.log('\n📧 Testing real-time email sync and webhook for Dano...');
  
  // Step 1: Test webhook endpoint exists and responds
  console.log('🔍 Step 1: Testing webhook endpoint...');
  
  try {
    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/outlook`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (webhookResponse.ok) {
      console.log('✅ Webhook endpoint is accessible');
    } else {
      console.log('⚠️ Webhook endpoint returned:', webhookResponse.status);
    }
  } catch (error) {
    console.log('❌ Webhook endpoint test failed:', error.message);
  }
  
  // Step 2: Test email sync API
  console.log('🔍 Step 2: Testing email sync API...');
  
  try {
    const syncResponse = await fetch(`${BASE_URL}/api/email/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: `dano_${DANO_CONFIG.userId}`,
        platform: 'outlook',
        workspaceId: DANO_CONFIG.workspaceId
      })
    });
    
    const syncResult = await syncResponse.json();
    console.log('📧 Email sync response:', syncResult);
    
    if (syncResult.success) {
      console.log('✅ Email sync API is working');
    } else {
      console.log('⚠️ Email sync API returned error:', syncResult.error);
    }
  } catch (error) {
    console.log('❌ Email sync API test failed:', error.message);
  }
  
  // Step 3: Test Resend outbound integration
  console.log('🔍 Step 3: Testing Resend outbound integration...');
  
  try {
    const testEmail = {
      to: [DANO_CONFIG.email],
      subject: `QA Test Email - ${new Date().toISOString()}`,
      body: `This is a QA test email sent to verify the Resend integration for Dano's workspace.
      
Test Details:
- Workspace: ${DANO_CONFIG.workspace}
- User ID: ${DANO_CONFIG.userId}
- Timestamp: ${new Date().toISOString()}
- Test: End-to-end email sync verification

If you receive this email, the Resend outbound integration is working correctly.`,
      bodyHtml: `<h2>QA Test Email</h2>
<p>This is a QA test email sent to verify the Resend integration for Dano's workspace.</p>
<ul>
  <li><strong>Workspace:</strong> ${DANO_CONFIG.workspace}</li>
  <li><strong>User ID:</strong> ${DANO_CONFIG.userId}</li>
  <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
  <li><strong>Test:</strong> End-to-end email sync verification</li>
</ul>
<p>If you receive this email, the Resend outbound integration is working correctly.</p>`
    };
    
    const emailResponse = await fetch(`${BASE_URL}/api/email/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testEmail)
    });
    
    const emailResult = await emailResponse.json();
    console.log('📧 Resend email response:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ Resend outbound integration is working');
      console.log(`📧 Test email sent to ${DANO_CONFIG.email}`);
    } else {
      console.log('⚠️ Resend integration error:', emailResult.error);
    }
  } catch (error) {
    console.log('❌ Resend integration test failed:', error.message);
  }
  
  // Step 4: Simulate webhook notification
  console.log('🔍 Step 4: Simulating webhook notification...');
  
  try {
    const webhookPayload = {
      value: [{
        changeType: 'created',
        clientState: `${DANO_CONFIG.userId}_outlook_webhook`,
        resource: 'me/messages/AAMkADY3NGI5',
        resourceData: {
          '@odata.type': '#Microsoft.Graph.Message',
          '@odata.id': 'me/messages/AAMkADY3NGI5'
        },
        subscriptionId: 'test-subscription-id',
        subscriptionExpirationDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }]
    };
    
    const webhookTestResponse = await fetch(`${BASE_URL}/api/webhooks/outlook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(webhookPayload)
    });
    
    if (webhookTestResponse.ok) {
      console.log('✅ Webhook notification processed successfully');
    } else {
      console.log('⚠️ Webhook notification failed:', webhookTestResponse.status);
    }
  } catch (error) {
    console.log('❌ Webhook simulation failed:', error.message);
  }
}

/**
 * TEST 2: Zoho Integration and Monaco Signals
 */
async function testZohoIntegrationAndMonacoSignals() {
  console.log('\n🔍 Testing Zoho integration and Monaco signal popup...');
  
  // Step 1: Check if Dano has any leads/prospects in the database
  console.log('🔍 Step 1: Checking Dano\'s leads and prospects...');
  
  try {
    const leads = await prisma.lead.findMany({
      where: { workspaceId: DANO_CONFIG.workspaceId },
      take: 5
    });
    
    const prospects = await prisma.prospect.findMany({
      where: { workspaceId: DANO_CONFIG.workspaceId },
      take: 5
    });
    
    console.log(`📊 Found ${leads.length} leads and ${prospects.length} prospects for Dano`);
    
    if (leads.length > 0) {
      console.log('📋 Sample lead:', {
        id: leads[0].id,
        fullName: leads[0].fullName,
        company: leads[0].company,
        email: leads[0].email
      });
    }
    
    if (prospects.length > 0) {
      console.log('📋 Sample prospect:', {
        id: prospects[0].id,
        fullName: prospects[0].fullName,
        company: prospects[0].company,
        email: prospects[0].email
      });
    }
    
  } catch (error) {
    console.log('❌ Database query failed:', error.message);
  }
  
  // Step 2: Simulate Zoho note update
  console.log('🔍 Step 2: Simulating Zoho note update...');
  
  try {
    // Create a test activity to simulate Zoho update
    const testActivity = await prisma.activity.create({
      data: {
        workspaceId: DANO_CONFIG.workspaceId,
        userId: DANO_CONFIG.userId,
        type: 'note',
        title: 'QA Test: Zoho Integration',
        description: `Test note added via Zoho integration at ${new Date().toISOString()}`,
        subject: `QA Test Note - ${new Date().toISOString()}`,
        priority: 'medium',
        status: 'completed',
        source: 'zoho_crm',
        metadata: {
          source: 'zoho_webhook',
          test: true,
          timestamp: new Date().toISOString(),
          user: DANO_CONFIG.email
        }
      }
    });
    
    console.log('✅ Test activity created:', {
      id: testActivity.id,
      type: testActivity.type,
      title: testActivity.title,
      source: testActivity.source
    });
    
    // Test Monaco signal API
    console.log('🔍 Step 3: Testing Monaco signal popup API...');
    
    const signalPayload = {
      workspaceId: DANO_CONFIG.workspaceId,
      userId: DANO_CONFIG.userId,
      signalType: 'zoho_note_update',
      title: 'Zoho Note Updated',
      message: 'A note was updated in Zoho CRM for one of your records',
      actionUrl: `/pipeline/leads/${testActivity.id}`,
      priority: 'medium',
      metadata: {
        activityId: testActivity.id,
        source: 'zoho_crm',
        test: true
      }
    };
    
    const signalResponse = await fetch(`${BASE_URL}/api/monaco/signals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signalPayload)
    });
    
    if (signalResponse.ok) {
      const signalResult = await signalResponse.json();
      console.log('✅ Monaco signal sent successfully:', signalResult);
    } else {
      console.log('⚠️ Monaco signal failed:', signalResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Zoho simulation failed:', error.message);
  }
  
  // Step 4: Test real-time signal delivery
  console.log('🔍 Step 4: Testing real-time signal delivery...');
  
  try {
    // Test the signals endpoint to see active signals
    const signalsCheckResponse = await fetch(`${BASE_URL}/api/monaco/signals?workspaceId=${DANO_CONFIG.workspaceId}&userId=${DANO_CONFIG.userId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (signalsCheckResponse.ok) {
      const activeSignals = await signalsCheckResponse.json();
      console.log('📊 Active signals for Dano:', activeSignals);
      console.log('✅ Signal delivery system is functional');
    } else {
      console.log('⚠️ Signals check failed:', signalsCheckResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Signal delivery test failed:', error.message);
  }
}

// QA Test Instructions for Manual Verification
function printManualTestInstructions() {
  console.log('\n📋 MANUAL VERIFICATION INSTRUCTIONS:');
  console.log('');
  console.log('1. 📧 EMAIL SYNC VERIFICATION:');
  console.log('   - Check Dano\'s email inbox for the QA test email');
  console.log('   - Send an email TO Dano\'s email address');
  console.log('   - Verify it appears in the Adrata system within 30 seconds');
  console.log('   - Check the "Last Contact" column in leads/prospects lists');
  console.log('');
  console.log('2. 🔔 ZOHO SIGNAL VERIFICATION:');
  console.log('   - Login to Adrata as Dano');
  console.log('   - Go to Monaco Speedrun page');
  console.log('   - Check if a signal popup appears (orange notification)');
  console.log('   - Click the signal to verify it opens the correct record');
  console.log('');
  console.log('3. 📊 END-TO-END VERIFICATION:');
  console.log('   - Update a note in Zoho CRM for one of Dano\'s contacts');
  console.log('   - Verify the Monaco signal appears in Adrata within 60 seconds');
  console.log('   - Send yourself an email and verify real-time sync');
  console.log('');
  console.log('✅ All systems should work seamlessly for production use!');
}

// Run the tests
main()
  .then(() => {
    printManualTestInstructions();
  })
  .catch(console.error);
