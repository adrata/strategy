/**
 * 📋 COMPLETE ZOHO WEBHOOK SETUP GUIDE
 * 
 * This provides step-by-step instructions for setting up ALL Zoho webhooks
 */

function printCompleteSetupGuide() {
  console.log('📋 COMPLETE ZOHO WEBHOOK SETUP GUIDE');
  console.log('=====================================\n');

  console.log('🎯 OBJECTIVE: Set up real-time sync for ALL Zoho modules to Adrata\n');

  console.log('📍 WEBHOOK ENDPOINT: https://action.adrata.com/api/webhooks/zoho');
  console.log('✅ SUPPORTED MODULES: Leads, Contacts, Deals, Accounts\n');

  console.log('🔧 STEP 1: CREATE 4 WEBHOOKS');
  console.log('=============================');
  console.log('Go to: Setup > Automation > Actions > Webhooks\n');

  const webhooks = [
    { name: 'Adrata Lead Sync', module: 'Leads', description: 'Sync lead changes to Adrata' },
    { name: 'Adrata Contact Sync', module: 'Contacts', description: 'Sync contact changes to Adrata' },
    { name: 'Adrata Deal Sync', module: 'Deals', description: 'Sync deal/opportunity changes to Adrata' },
    { name: 'Adrata Account Sync', module: 'Accounts', description: 'Sync account/company changes to Adrata' }
  ];

  webhooks.forEach((webhook, index) => {
    console.log(`📍 WEBHOOK ${index + 1}: ${webhook.name}`);
    console.log('   • Click "Create Webhook"');
    console.log(`   • Name: ${webhook.name}`);
    console.log('   • URL to Notify: https://action.adrata.com/api/webhooks/zoho');
    console.log('   • Method: POST');
    console.log('   • Content Type: application/json');
    console.log(`   • Module: ${webhook.module}`);
    console.log(`   • Description: ${webhook.description}`);
    console.log('   • Click "Save"\n');
  });

  console.log('🔄 STEP 2: CREATE 4 WORKFLOW RULES');
  console.log('==================================');
  console.log('Go to: Setup > Automation > Workflow Rules\n');

  webhooks.forEach((webhook, index) => {
    console.log(`📍 WORKFLOW RULE ${index + 1}: ${webhook.module} Auto-Sync`);
    console.log('   • Click "Create Rule"');
    console.log(`   • Rule Name: ${webhook.module} Auto-Sync to Adrata`);
    console.log(`   • Module: ${webhook.module}`);
    console.log('   • When to Trigger: All (Create, Update, Delete)');
    console.log('   • Criteria: All records (no specific criteria)');
    console.log('   • Under "Instant Actions": Select "Webhook"');
    console.log(`   • Choose: ${webhook.name}`);
    console.log('   • Click "Associate"');
    console.log('   • Click "Save"\n');
  });

  console.log('🧪 STEP 3: TEST THE WEBHOOKS');
  console.log('=============================');
  console.log('After setting up all webhooks and workflow rules:\n');
  
  console.log('✅ TEST LEADS:');
  console.log('   • Create or update a lead in Zoho');
  console.log('   • Add notes with buying signals');
  console.log('   • Check Adrata Speedrun for the lead');
  console.log('   • Verify signal notifications appear\n');

  console.log('✅ TEST CONTACTS:');
  console.log('   • Create or update a contact in Zoho');
  console.log('   • Check Adrata contacts list');
  console.log('   • Verify contact appears/updates\n');

  console.log('✅ TEST DEALS:');
  console.log('   • Create or update a deal in Zoho');
  console.log('   • Check Adrata opportunities pipeline');
  console.log('   • Verify deal appears/updates\n');

  console.log('✅ TEST ACCOUNTS:');
  console.log('   • Create or update an account in Zoho');
  console.log('   • Check Adrata accounts list');
  console.log('   • Verify account appears/updates\n');

  console.log('📊 STEP 4: MONITOR & VERIFY');
  console.log('===========================');
  console.log('• 🔍 Check webhook logs in Zoho for successful calls');
  console.log('• 📈 Monitor Adrata for real-time data updates');
  console.log('• 🎯 Verify buying signals trigger in Speedrun');
  console.log('• 📧 Test with different types of updates\n');

  console.log('🔧 TROUBLESHOOTING:');
  console.log('==================');
  console.log('• If webhooks fail: Check URL is exactly https://action.adrata.com/api/webhooks/zoho');
  console.log('• If no data syncs: Ensure workflow rules are active and associated');
  console.log('• If partial sync: Check all 4 webhooks are created and working');
  console.log('• If errors: Check Zoho webhook logs for specific error messages\n');

  console.log('🎉 SUCCESS INDICATORS:');
  console.log('======================');
  console.log('✅ Real-time sync working across all modules');
  console.log('✅ Buying signals detected from Zoho updates');
  console.log('✅ Speedrun prioritization working');
  console.log('✅ Data consistency between Zoho and Adrata');
  console.log('✅ Webhook logs show successful calls\n');

  console.log('🚀 READY FOR PRODUCTION!');
  console.log('========================');
  console.log('Once all 4 webhooks are working:');
  console.log('• Any Zoho update will instantly sync to Adrata');
  console.log('• Buying signals will be detected automatically');
  console.log('• Speedrun will prioritize hot leads in real-time');
  console.log('• Your sales team will have the most up-to-date information');
}

if (require.main === module) {
  printCompleteSetupGuide();
}

module.exports = { printCompleteSetupGuide };
