#!/usr/bin/env node

/**
 * Test Production Email System
 * Verifies the complete email scheduling and sending system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testProductionEmails() {
  try {
    console.log('🧪 Testing Production Email System...\n');
    
    // Test 1: Check if Dano exists
    console.log('1️⃣ Checking Dano user...');
    const dano = await prisma.user.findUnique({
      where: { email: 'dan@adrata.com' },
      include: {
        workspaceMemberships: {
          include: {
            workspace: true
          }
        }
      }
    });
    
    if (dano) {
      console.log('✅ Dano found:');
      console.log(`   - Name: ${dano.name}`);
      console.log(`   - Timezone: ${dano.timezone}`);
      console.log(`   - Role: ${dano.title}`);
      console.log(`   - Workspace: ${dano.workspaceMemberships[0]?.workspace?.name}`);
    } else {
      console.log('❌ Dano not found - run add-dano-user.js first');
      return;
    }
    
    // Test 2: Test email scheduler API
    console.log('\n2️⃣ Testing email scheduler API...');
    const schedulerResponse = await fetch('http://localhost:3000/api/email/scheduler/start', {
      method: 'GET'
    });
    
    if (schedulerResponse.ok) {
      const schedulerData = await schedulerResponse.json();
      console.log('✅ Scheduler API working:');
      console.log(`   - Users found: ${schedulerData.users?.length || 0}`);
      if (schedulerData.users?.length > 0) {
        schedulerData.users.forEach(user => {
          console.log(`   - ${user.name} (${user.email}) - ${user.timezone} - ${user.role}`);
        });
      }
    } else {
      console.log('❌ Scheduler API failed');
    }
    
    // Test 3: Test individual email endpoints
    console.log('\n3️⃣ Testing email endpoints...');
    
    const testUser = {
      id: dano.id,
      name: dano.name,
      email: dano.email,
      role: 'seller',
      workspaceId: dano.workspaceMemberships[0]?.workspace?.id || '',
      workspaceName: dano.workspaceMemberships[0]?.workspace?.name || 'Adrata'
    };
    
    const testProgress = {
      callsMade: 15,
      emailsSent: 45,
      meetings: 3,
      dealsAdvanced: 2,
      newOpportunities: 1,
      pipelineValueAdded: 2.5,
      wins: [
        'Booked 3 meetings for next week',
        'Advanced 2 deals to proposal stage'
      ],
      activities: [
        'Called 15 prospects',
        'Sent 45 personalized emails'
      ]
    };
    
    const testWeeklySummary = {
      totalCalls: 75,
      totalEmails: 225,
      totalMeetings: 15,
      dealsClosed: 2,
      revenueGenerated: 125,
      pipelineGrowth: 15,
      topWins: [
        'Closed $125K in new revenue',
        'Advanced 6 opportunities to next stage'
      ],
      keyMetrics: {
        newOpportunities: 8,
        avgDealSize: 35,
        conversionRate: 12,
        pipelineVelocity: 25
      }
    };
    
    // Test Monday prep email
    console.log('   Testing Monday prep email...');
    const mondayResponse = await fetch('http://localhost:3000/api/email/sales/monday-prep', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: testUser })
    });
    
    if (mondayResponse.ok) {
      console.log('   ✅ Monday prep email endpoint working');
    } else {
      console.log('   ❌ Monday prep email endpoint failed');
    }
    
    // Test daily wrap email
    console.log('   Testing daily wrap email...');
    const dailyResponse = await fetch('http://localhost:3000/api/email/sales/end-of-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user: testUser, 
        progress: testProgress 
      })
    });
    
    if (dailyResponse.ok) {
      console.log('   ✅ Daily wrap email endpoint working');
    } else {
      console.log('   ❌ Daily wrap email endpoint failed');
    }
    
    // Test Friday combined email
    console.log('   Testing Friday combined email...');
    const fridayResponse = await fetch('http://localhost:3000/api/email/sales/friday-combined', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user: testUser, 
        dailyProgress: testProgress,
        weeklySummary: testWeeklySummary
      })
    });
    
    if (fridayResponse.ok) {
      console.log('   ✅ Friday combined email endpoint working');
    } else {
      console.log('   ❌ Friday combined email endpoint failed');
    }
    
    // Test 4: Check timezone logic
    console.log('\n4️⃣ Testing timezone logic...');
    const now = new Date();
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: 'America/New_York' }));
    const currentHour = userTime.getHours();
    const currentDay = userTime.getDay();
    
    console.log(`   Current time in ET: ${userTime.toLocaleString()}`);
    console.log(`   Day of week: ${currentDay} (0=Sunday, 1=Monday, etc.)`);
    console.log(`   Hour: ${currentHour}`);
    
    const shouldSendMonday = currentDay === 1 && currentHour === 8;
    const shouldSendDaily = currentDay >= 1 && currentDay <= 5 && currentHour === 17;
    const shouldSendFriday = currentDay === 5 && currentHour === 17;
    
    console.log(`   Should send Monday prep: ${shouldSendMonday}`);
    console.log(`   Should send daily wrap: ${shouldSendDaily}`);
    console.log(`   Should send Friday combined: ${shouldSendFriday}`);
    
    console.log('\n🎉 Production email system test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run: node scripts/add-dano-user.js (if not done)');
    console.log('2. Start the scheduler: POST /api/email/scheduler/start');
    console.log('3. Monitor logs for email sending');
    console.log('4. Check email delivery in your inbox');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  testProductionEmails().catch(console.error);
}

module.exports = { testProductionEmails };
