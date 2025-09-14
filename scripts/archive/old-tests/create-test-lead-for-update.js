/**
 * 🎯 CREATE TEST LEAD FOR ZOHO UPDATE
 * 
 * This script creates a test lead in Zoho that you can update to test the webhook pipeline
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestLeadForUpdate() {
  console.log('🎯 [ZOHO TEST] Creating test lead for update testing...\n');

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

    const accessToken = zohoToken.accessToken;
    console.log('✅ Found Zoho credentials');

    // Create a test lead with clear identification
    const testIdentifier = `UPDATE-TEST-${Date.now()}`;
    console.log(`\n📝 Creating test lead: ${testIdentifier}`);
    
    const testLead = {
      data: [
        {
          First_Name: 'UpdateTest',
          Last_Name: testIdentifier,
          Company: 'Signal Test Company',
          Email: `update.test.${testIdentifier}@signaltest.com`,
          Phone: '+1-555-SIGNAL',
          Lead_Source: 'Speedrun Signal Test',
          Lead_Status: 'Not Contacted',
          Description: 'This lead is created for testing Speedrun signal updates via Zoho webhooks. Please add notes to test the pipeline.'
        }
      ]
    };

    const createResponse = await fetch('https://www.zohoapis.com/crm/v3/Leads', {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testLead)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`Failed to create test lead: ${createResponse.status} - ${errorText}`);
    }

    const createData = await createResponse.json();
    const leadId = createData.data?.[0]?.details?.id;

    if (!leadId) {
      throw new Error('Failed to get lead ID from create response');
    }

    console.log(`✅ Test lead created successfully!`);
    console.log(`\n📋 LEAD DETAILS FOR TESTING:`);
    console.log(`==========================`);
    console.log(`🆔 Lead ID: ${leadId}`);
    console.log(`👤 Name: UpdateTest ${testIdentifier}`);
    console.log(`🏢 Company: Signal Test Company`);
    console.log(`📧 Email: update.test.${testIdentifier}@signaltest.com`);
    console.log(`📱 Phone: +1-555-SIGNAL`);

    console.log(`\n🧪 TESTING INSTRUCTIONS:`);
    console.log(`========================`);
    console.log(`1. 🔗 Go to your Zoho CRM`);
    console.log(`2. 🔍 Find the lead: "UpdateTest ${testIdentifier}"`);
    console.log(`3. ✏️  Add notes with buying signals like:`);
    console.log(`   • "We're looking to purchase a solution soon"`);
    console.log(`   • "Budget approved for Q1 implementation"`);
    console.log(`   • "Need pricing for 100 users"`);
    console.log(`   • "Can we schedule a demo next week?"`);
    console.log(`4. 💾 Save the changes`);
    console.log(`5. 🔍 Check Speedrun for signal notifications`);

    console.log(`\n📊 WHAT TO EXPECT:`);
    console.log(`==================`);
    console.log(`• ✅ Zoho webhook should trigger`);
    console.log(`• ✅ Lead should update in Adrata database`);
    console.log(`• ✅ Buying signals should be detected`);
    console.log(`• ✅ Lead should move up in Speedrun priority`);
    console.log(`• ✅ Signal notification should appear`);

    // Also create a corresponding lead in Adrata database for immediate testing
    console.log(`\n💾 Creating corresponding lead in Adrata database...`);
    
    try {
      await prisma.lead.create({
        data: {
          workspaceId: workspaceId,
          firstName: 'UpdateTest',
          lastName: testIdentifier,
          email: `update.test.${testIdentifier}@signaltest.com`,
          phone: '+1-555-SIGNAL',
          company: 'Signal Test Company',
          title: 'Test Lead',
          source: 'Speedrun Signal Test',
          status: 'New',
          zohoId: leadId,
          notes: 'Created for testing Speedrun signal updates via Zoho webhooks.',
          assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB' // Dano's user ID
        }
      });
      
      console.log(`✅ Lead created in Adrata database`);
      console.log(`📍 The lead is now ready for webhook testing!`);
      
    } catch (dbError) {
      console.log(`⚠️ Failed to create lead in Adrata database: ${dbError.message}`);
      console.log(`📍 Webhook will create it when you update in Zoho`);
    }

    console.log(`\n🎯 READY FOR TESTING!`);
    console.log(`Lead ID ${leadId} is ready for your notes update test.`);

  } catch (error) {
    console.error(`❌ [ZOHO TEST] Error:`, error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  createTestLeadForUpdate().catch(console.error);
}

module.exports = { createTestLeadForUpdate };
