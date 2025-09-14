/**
 * 🔍 CHECK SARAH MITCHELL WEBHOOK TEST
 * 
 * Check if the Sarah Mitchell lead creation triggered our webhook
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSarahMitchellWebhook() {
  console.log('🔍 [WEBHOOK TEST] Checking if Sarah Mitchell webhook worked...\n');

  try {
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Dano's workspace

    // Check for Sarah Mitchell in leads
    console.log('👤 Step 1: Looking for Sarah Mitchell in leads...');
    const sarahLeads = await prisma.lead.findMany({
      where: {
        workspaceId: workspaceId,
        OR: [
          { fullName: { contains: 'Sarah Mitchell' } },
          { firstName: 'Sarah', lastName: 'Mitchell' },
          { email: 'sarah.mitchell@retailsolutions.com' }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        description: true,
        priority: true,
        createdAt: true,
        updatedAt: true
      }
    });

    console.log(`📍 Found ${sarahLeads.length} Sarah Mitchell leads`);
    
    if (sarahLeads.length > 0) {
      console.log('✅ Sarah Mitchell leads found:');
      sarahLeads.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.fullName}`);
        console.log(`      Email: ${lead.email}`);
        console.log(`      Company: ${lead.company}`);
        console.log(`      Priority: ${lead.priority}`);
        console.log(`      Description: ${lead.description ? lead.description.substring(0, 200) + '...' : 'No description'}`);
        console.log(`      Created: ${lead.createdAt}`);
        console.log(`      Updated: ${lead.updatedAt}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No Sarah Mitchell leads found yet');
    }

    // Check recent webhook activity (last 10 minutes)
    console.log('📡 Step 2: Checking recent lead updates (last 10 minutes)...');
    const recentUpdates = await prisma.lead.findMany({
      where: {
        workspaceId: workspaceId,
        updatedAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 10,
      select: {
        id: true,
        fullName: true,
        email: true,
        company: true,
        description: true,
        updatedAt: true
      }
    });

    console.log(`📍 Found ${recentUpdates.length} recent lead updates`);
    
    if (recentUpdates.length > 0) {
      console.log('✅ Recent lead activity:');
      recentUpdates.forEach((lead, index) => {
        console.log(`   ${index + 1}. ${lead.fullName} (${lead.company || 'No company'})`);
        console.log(`      Email: ${lead.email || 'No email'}`);
        console.log(`      Description: ${lead.description ? lead.description.substring(0, 100) + '...' : 'No description'}`);
        console.log(`      Updated: ${lead.updatedAt}`);
        console.log('');
      });
    }

    // Check for buying signals in recent emails
    console.log('🔍 Step 3: Checking for recent buying signals...');
    const recentSignals = await prisma.emailMessage.findMany({
      where: {
        account: {
          workspaceId: workspaceId
        },
        buyingSignalScore: {
          gt: 0
        },
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        subject: true,
        from: true,
        buyingSignalScore: true,
        createdAt: true
      }
    });

    console.log(`📍 Found ${recentSignals.length} recent buying signals`);
    
    if (recentSignals.length > 0) {
      console.log('✅ Recent buying signals:');
      recentSignals.forEach((signal, index) => {
        console.log(`   ${index + 1}. From: ${signal.from}`);
        console.log(`      Subject: ${signal.subject || 'No subject'}`);
        console.log(`      Score: ${signal.buyingSignalScore}`);
        console.log(`      Time: ${signal.createdAt}`);
        console.log('');
      });
    }

    // Summary
    console.log('📊 WEBHOOK TEST SUMMARY');
    console.log('=======================');
    console.log(`• Sarah Mitchell Leads: ${sarahLeads.length} found`);
    console.log(`• Recent Updates: ${recentUpdates.length} in last 10 minutes`);
    console.log(`• Recent Signals: ${recentSignals.length} in last 10 minutes`);

    if (sarahLeads.length > 0) {
      console.log('\n🎉 SUCCESS! Sarah Mitchell lead found in database');
      console.log('🚨 Now test the Monaco Signal popup:');
      console.log('   1. Go to: http://localhost:3000/pipeline/speedrun');
      console.log('   2. Press Cmd+I');
      console.log('   3. Check if Sarah Mitchell appears in the signal popup');
    } else {
      console.log('\n⏱️  Webhook may still be processing...');
      console.log('🔧 If no lead appears after 2 minutes:');
      console.log('   1. Check Zoho webhook configuration');
      console.log('   2. Verify webhook URL is correct');
      console.log('   3. Check server logs for webhook activity');
    }

    console.log('\n✅ WEBHOOK CHECK COMPLETE!');

  } catch (error) {
    console.error('❌ [WEBHOOK TEST] Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  checkSarahMitchellWebhook().catch(console.error);
}

module.exports = { checkSarahMitchellWebhook };
