#!/usr/bin/env node

/**
 * 🧪 TEST MINIMAL BUYER GROUP DISCOVERY
 * 
 * Test the absolute minimal approach to buyer group discovery
 */

const testMinimalBuyerGroup = async () => {
  console.log('🧪 Testing Minimal Buyer Group Discovery...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Endpoint Info
    console.log('1️⃣ Testing Endpoint Info...');
    const infoResponse = await fetch(`${baseUrl}/api/intelligence/buyer-group-bulk`);
    const infoData = await infoResponse.json();
    
    if (infoData.endpoint) {
      console.log('✅ Endpoint Info: PASSED');
      console.log(`   Description: ${infoData.description}`);
      console.log(`   Performance: ${infoData.performance.singleAccount} per account`);
    } else {
      console.log('❌ Endpoint Info: FAILED');
    }
    
    console.log('\n');
    
    // Test 2: Small Bulk Search (3 accounts)
    console.log('2️⃣ Testing Small Bulk Search (3 accounts)...');
    const smallBulkResponse = await fetch(`${baseUrl}/api/intelligence/buyer-group-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'dan',
        workspaceId: 'adrata',
        accounts: ['Dell', 'Microsoft', 'Apple'],
        targetRoles: ['CEO', 'CFO'] // Keep it small for testing
      })
    });
    
    const smallBulkData = await smallBulkResponse.json();
    
    if (smallBulkData.success) {
      console.log('✅ Small Bulk Search: PASSED');
      console.log(`   Accounts Processed: ${smallBulkData.summary.accountsProcessed}`);
      console.log(`   People Found: ${smallBulkData.summary.totalPeopleFound}`);
      console.log(`   Success Rate: ${smallBulkData.summary.overallSuccessRate}%`);
      console.log(`   Processing Time: ${smallBulkData.summary.processingTimeMs}ms`);
      console.log(`   API Calls Used: ${smallBulkData.summary.apiCallsUsed}`);
      console.log(`   Cost Estimate: ${smallBulkData.summary.costEstimate}`);
      
      console.log('\n   📋 Found People:');
      smallBulkData.buyerGroups.forEach(bg => {
        console.log(`     🏢 ${bg.accountName} (${bg.peopleCount} people, ${bg.successRate}% success):`);
        bg.people.forEach(person => {
          console.log(`        • ${person.name} (${person.role}) - ${person.buyerGroupRole} - ${person.confidence}% confidence`);
          if (person.email) console.log(`          📧 ${person.email}`);
          if (person.phone) console.log(`          📞 ${person.phone}`);
        });
      });
      
    } else {
      console.log('❌ Small Bulk Search: FAILED');
      console.log(`   Error: ${smallBulkData.error}`);
      if (smallBulkData.missing) {
        console.log(`   Missing: ${smallBulkData.missing.join(', ')}`);
        console.log(`   Recommendations: ${smallBulkData.recommendations.join(', ')}`);
      }
    }
    
    console.log('\n');
    
    // Test 3: Performance Check
    console.log('3️⃣ Performance Analysis:');
    if (smallBulkData.success && smallBulkData.summary) {
      const avgTimePerAccount = smallBulkData.summary.processingTimeMs / smallBulkData.summary.accountsProcessed;
      const avgPeoplePerAccount = smallBulkData.summary.avgPeoplePerAccount;
      
      console.log(`   Average Time per Account: ${Math.round(avgTimePerAccount)}ms`);
      console.log(`   Average People per Account: ${avgPeoplePerAccount}`);
      console.log(`   Projected Time for 150 accounts: ${Math.round(avgTimePerAccount * 150 / 1000)}s`);
      
      const performance = avgTimePerAccount < 3000 ? '🚀 Excellent' : 
                         avgTimePerAccount < 5000 ? '⚡ Good' : 
                         avgTimePerAccount < 10000 ? '⏰ Acceptable' : '🐌 Slow';
      console.log(`   Performance Rating: ${performance}`);
    }
    
    console.log('\n');
    
    // Test 4: Error Handling
    console.log('4️⃣ Testing Error Handling...');
    const errorResponse = await fetch(`${baseUrl}/api/intelligence/buyer-group-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'dan',
        workspaceId: 'adrata',
        accounts: [] // Empty array should cause error
      })
    });
    
    const errorData = await errorResponse.json();
    
    if (errorData.error && errorData.error.includes('Empty accounts')) {
      console.log('✅ Error Handling: PASSED');
      console.log(`   Correctly caught empty accounts array`);
    } else {
      console.log('❌ Error Handling: FAILED');
      console.log(`   Unexpected response:`, errorData);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    if (error.message.includes('fetch')) {
      console.error('   Make sure the development server is running: npm run dev');
    }
  }
  
  console.log('\n🏁 Minimal Buyer Group Discovery Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   - Test with real Lusha API key');
  console.log('   - Try larger account lists (10, 50, 150)');
  console.log('   - Monitor rate limits and costs');
  console.log('   - Add parallel processing for speed');
};

// Run the test
testMinimalBuyerGroup();
