#!/usr/bin/env node

/**
 * 🧪 Test Sales Emails
 * 
 * Script to test the three types of sales emails:
 * 1. Monday Morning Prep
 * 2. End of Day Progress
 * 3. Weekly Summary
 */

const testUsers = {
  seller: {
    id: 'seller-001',
    name: 'Dano',
    email: 'dan@adrata.com',
    role: 'seller',
    workspaceId: 'ne-workspace',
    workspaceName: 'Notary Everyday'
  },
  manager: {
    id: 'manager-001',
    name: 'Derek',
    email: 'derek@adrata.com',
    role: 'manager',
    workspaceId: 'rps-workspace',
    workspaceName: 'Retail Product Solutions',
    sellers: [
      {
        id: 'seller-002',
        name: 'Sarah',
        email: 'sarah@adrata.com',
        role: 'seller',
        workspaceId: 'rps-workspace',
        workspaceName: 'Retail Product Solutions',
        managerId: 'manager-001'
      },
      {
        id: 'seller-003',
        name: 'Mike',
        email: 'mike@adrata.com',
        role: 'seller',
        workspaceId: 'rps-workspace',
        workspaceName: 'Retail Product Solutions',
        managerId: 'manager-001'
      }
    ]
  }
};

const testProgress = {
  callsMade: 12,
  emailsSent: 45,
  meetings: 3,
  dealsAdvanced: 2,
  newOpportunities: 1,
  pipelineValueAdded: 2.5,
  wins: [
    'Closed $50K deal with TechCorp',
    'Advanced 3 opportunities to proposal stage',
    'Booked 5 meetings for next week'
  ],
  activities: [
    'Called 12 prospects',
    'Sent 45 personalized emails',
    'Had 3 discovery meetings'
  ]
};

const testWeeklySummary = {
  totalCalls: 67,
  totalEmails: 234,
  totalMeetings: 18,
  dealsClosed: 3,
  revenueGenerated: 150,
  pipelineGrowth: 25,
  topWins: [
    'Closed $150K in new revenue',
    'Advanced 8 opportunities to next stage',
    'Generated 15 new qualified leads',
    'Exceeded weekly targets by 20%'
  ],
  keyMetrics: {
    newOpportunities: 12,
    avgDealSize: 50,
    conversionRate: 15,
    pipelineVelocity: 45
  }
};

async function testMondayPrepEmail() {
  console.log('🏁 Testing Monday Prep Email...');
  
  try {
    const response = await fetch('http://localhost:3000/api/email/sales/monday-prep', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUsers.seller
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Monday prep email sent successfully!');
    } else {
      console.log('❌ Failed to send Monday prep email:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing Monday prep email:', error.message);
  }
}

async function testEndOfDayEmail() {
  console.log('📊 Testing End of Day Email...');
  
  try {
    const response = await fetch('http://localhost:3000/api/email/sales/end-of-day', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUsers.seller,
        progress: testProgress
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ End of day email sent successfully!');
    } else {
      console.log('❌ Failed to send end of day email:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing end of day email:', error.message);
  }
}

async function testManagerRollupEmail() {
  console.log('👥 Testing Manager Rollup Email...');
  
  try {
    const teamProgress = [
      { userId: 'seller-002', ...testProgress },
      { userId: 'seller-003', ...testProgress }
    ];
    
    const response = await fetch('http://localhost:3000/api/email/sales/end-of-day', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUsers.manager,
        progress: testProgress,
        teamProgress: teamProgress
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Manager rollup email sent successfully!');
    } else {
      console.log('❌ Failed to send manager rollup email:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing manager rollup email:', error.message);
  }
}

async function testWeeklySummaryEmail() {
  console.log('🏆 Testing Weekly Summary Email...');
  
  try {
    const response = await fetch('http://localhost:3000/api/email/sales/weekly-summary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUsers.seller,
        summary: testWeeklySummary
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Weekly summary email sent successfully!');
    } else {
      console.log('❌ Failed to send weekly summary email:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing weekly summary email:', error.message);
  }
}

async function testFridayCombinedEmail() {
  console.log('🏁 Testing Friday Combined Email...');
  
  try {
    const response = await fetch('http://localhost:3000/api/email/sales/friday-combined', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user: testUsers.seller,
        dailyProgress: testProgress,
        weeklySummary: testWeeklySummary
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Friday combined email sent successfully!');
    } else {
      console.log('❌ Failed to send Friday combined email:', result.error);
    }
  } catch (error) {
    console.log('❌ Error testing Friday combined email:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Sales Email Tests...\n');
  
  await testMondayPrepEmail();
  console.log('');
  
  await testEndOfDayEmail();
  console.log('');
  
  await testManagerRollupEmail();
  console.log('');
  
  await testWeeklySummaryEmail();
  console.log('');
  
  await testFridayCombinedEmail();
  console.log('');
  
  console.log('🎉 All tests completed!');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testMondayPrepEmail,
  testEndOfDayEmail,
  testManagerRollupEmail,
  testWeeklySummaryEmail,
  testFridayCombinedEmail,
  runAllTests
};
