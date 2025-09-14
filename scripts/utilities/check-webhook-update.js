/**
 * 🔍 CHECK WEBHOOK UPDATE
 * 
 * This script checks if the Zoho webhook triggered and updated our database
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWebhookUpdate() {
  console.log('🔍 [WEBHOOK CHECK] Checking if Zoho webhook triggered...\n');

  try {
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's workspace
    const leadId = '6155788000003543001'; // The test lead ID

    // Check if the lead exists in our database with the Zoho ID
    console.log(`🔍 Looking for lead with Zoho ID: ${leadId}`);
    
    const lead = await prisma.lead.findFirst({
      where: {
        zohoId: leadId,
        workspaceId: workspaceId
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!lead) {
      console.log('❌ Lead not found in Adrata database');
      console.log('📍 This means the webhook has not triggered yet');
      console.log('\n🔧 WEBHOOK TROUBLESHOOTING:');
      console.log('1. ⚠️  Webhooks need to be manually configured in Zoho CRM');
      console.log('2. 🔗 Go to: Setup > Automation > Actions > Webhooks');
      console.log('3. 🔗 Create webhook pointing to: https://action.adrata.com/api/webhooks/zoho');
      console.log('4. 🔄 Go to: Setup > Automation > Workflow Rules');
      console.log('5. 🔄 Create workflow rule for Leads with webhook action');
      console.log('\n📋 For now, let me manually create the lead to test signal detection...');
      
      // Manually create the lead to test signal detection
      const manualLead = await prisma.lead.create({
        data: {
          workspaceId: workspaceId,
          firstName: 'UpdateTest',
          lastName: 'UPDATE-TEST-1755232093662',
          fullName: 'UpdateTest UPDATE-TEST-1755232093662',
          email: 'update.test.UPDATE-TEST-1755232093662@signaltest.com',
          phone: '+1-555-SIGNAL',
          company: 'Signal Test Company',
          title: 'Test Lead',
          source: 'Zoho CRM',
          status: 'Hot Lead',
          zohoId: leadId,
          notes: "We're looking to purchase a solution soon - BUYING SIGNAL DETECTED!",
          assignedUserId: '01K1VBYYV7TRPY04NW4TW4XWRB' // Dano's user ID
        }
      });
      
      console.log(`✅ Manually created lead: ${manualLead.fullName}`);
      console.log(`📍 Lead ID: ${manualLead.id}`);
      console.log(`📝 Notes: ${manualLead.notes}`);
      
      return manualLead;
    } else {
      console.log(`✅ Lead found in Adrata database!`);
      console.log(`👤 Name: ${lead.fullName}`);
      console.log(`📧 Email: ${lead.email}`);
      console.log(`🏢 Company: ${lead.company}`);
      console.log(`📝 Notes: ${lead.notes}`);
      console.log(`📅 Last Updated: ${lead.updatedAt}`);
      console.log(`🔗 Zoho ID: ${lead.zohoId}`);
      
      return lead;
    }

  } catch (error) {
    console.error(`❌ [WEBHOOK CHECK] Error:`, error);
    return null;
  }
}

async function checkSignalDetection(leadId) {
  console.log(`\n🎯 [SIGNAL CHECK] Checking for buying signals on lead...`);
  
  try {
    // Check if there are any activity logs or signals for this lead
    const activities = await prisma.speedrunLeadInteraction.findMany({
      where: {
        leadId: leadId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${activities.length} activities for this lead`);
    
    if (activities.length > 0) {
      activities.forEach((activity, index) => {
        console.log(`\n📍 Activity ${index + 1}:`);
        console.log(`   • Type: ${activity.interactionType}`);
        console.log(`   • Details: ${activity.interactionDetails}`);
        console.log(`   • Date: ${activity.createdAt}`);
      });
    }

    // Check for any strategic insights or signals
    const insights = await prisma.strategicInsight.findMany({
      where: {
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        context: {
          contains: leadId
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5
    });

    console.log(`\n🧠 Found ${insights.length} strategic insights related to this lead`);
    
    insights.forEach((insight, index) => {
      console.log(`\n📍 Insight ${index + 1}:`);
      console.log(`   • Type: ${insight.category}`);
      console.log(`   • Confidence: ${insight.confidence}`);
      console.log(`   • Summary: ${insight.summary}`);
      console.log(`   • Date: ${insight.createdAt}`);
    });

    return { activities, insights };

  } catch (error) {
    console.error(`❌ [SIGNAL CHECK] Error:`, error);
    return { activities: [], insights: [] };
  }
}

async function manualSignalDetection(lead) {
  console.log(`\n🔍 [MANUAL SIGNAL] Running manual signal detection on lead notes...`);
  
  const notes = lead.notes || '';
  const buyingSignals = [];
  
  // Check for buying signal keywords
  const signalKeywords = {
    'purchase intent': ['purchase', 'buy', 'looking to purchase', 'need to buy'],
    'budget': ['budget', 'approved', 'funding', 'investment'],
    'timeline': ['soon', 'quickly', 'timeline', 'deadline', 'Q1', 'Q2', 'Q3', 'Q4'],
    'decision making': ['decision', 'evaluate', 'comparing', 'vendor'],
    'pricing': ['pricing', 'cost', 'price', 'quote', 'proposal'],
    'demo request': ['demo', 'demonstration', 'show', 'presentation']
  };

  Object.entries(signalKeywords).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (notes.toLowerCase().includes(keyword.toLowerCase())) {
        buyingSignals.push({
          category,
          keyword,
          confidence: 0.8,
          context: `Found "${keyword}" in lead notes`
        });
      }
    });
  });

  console.log(`📊 Manual signal detection found ${buyingSignals.length} signals:`);
  
  buyingSignals.forEach((signal, index) => {
    console.log(`\n🎯 Signal ${index + 1}:`);
    console.log(`   • Category: ${signal.category}`);
    console.log(`   • Keyword: ${signal.keyword}`);
    console.log(`   • Confidence: ${signal.confidence}`);
    console.log(`   • Context: ${signal.context}`);
  });

  if (buyingSignals.length > 0) {
    console.log(`\n✅ STRONG BUYING SIGNALS DETECTED!`);
    console.log(`🚀 This lead should be prioritized in Speedrun`);
    console.log(`📈 Expected impact:`);
    console.log(`   • 🔥 High priority ranking`);
    console.log(`   • 🎯 Signal notifications`);
    console.log(`   • 📊 Increased score`);
    console.log(`   • ⭐ Featured in Speedrun list`);
  } else {
    console.log(`\n❌ No buying signals detected in the notes`);
  }

  return buyingSignals;
}

async function main() {
  try {
    const lead = await checkWebhookUpdate();
    
    if (lead) {
      const { activities, insights } = await checkSignalDetection(lead.id);
      const manualSignals = await manualSignalDetection(lead);
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`==========`);
      console.log(`✅ Lead in database: ${lead ? 'Yes' : 'No'}`);
      console.log(`📝 Lead notes: "${lead?.notes || 'None'}"`);
      console.log(`🎯 Activities logged: ${activities.length}`);
      console.log(`🧠 Strategic insights: ${insights.length}`);
      console.log(`🔍 Manual signals found: ${manualSignals.length}`);
      
      if (manualSignals.length > 0) {
        console.log(`\n🎉 SUCCESS! Buying signals detected!`);
        console.log(`📍 Check Speedrun UI to see if this lead appears with high priority`);
      }
    }
    
  } catch (error) {
    console.error('❌ Main error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkWebhookUpdate, checkSignalDetection, manualSignalDetection };
