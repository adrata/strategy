const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDanBuyerGroup() {
  try {
    console.log('🎯 TESTING BUYER GROUP ANALYSIS FOR DAN');
    console.log('=====================================\n');
    
    const testData = {
      companyName: 'Tech Corporation',
      website: 'https://techcorp.com',
      industry: 'Technology',
      dealSize: 75000,
      targetRoles: ['CEO', 'CTO', 'VP Engineering', 'Product Manager']
    };
    
    console.log('📊 Test Account Data:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('\n🚀 Running Buyer Group Analysis...');
    
    // Test the intelligence API
    const response = await fetch('http://localhost:3000/api/intelligence/research', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': '01K1VBYZMWTCT09FWEKBDMCXZM', // Dan's user ID
        'x-workspace-id': '01K1VBYXHD0J895XAN0HGFBKJP' // Adrata workspace ID
      },
      body: JSON.stringify({
        workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
        userId: '01K1VBYZMWTCT09FWEKBDMCXZM',
        accounts: [testData],
        researchDepth: 'comprehensive',
        targetRoles: testData.targetRoles
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Buyer Group Analysis Results:');
      console.log('================================');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(result, null, 2));
      
      // Check if data was saved to database
      if (result.executives && result.executives.length > 0) {
        console.log('\n🎉 SUCCESS: Buyer group analysis completed!');
        console.log(`   👥 Executives found: ${result.executives.length}`);
        console.log(`   📝 Contacts added: ${result.contactsAdded || 0}`);
        console.log(`   🎯 Leads created: ${result.leadsAdded || 0}`);
      }
      
    } else {
      console.log('\n❌ API Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('\n❌ Error running buyer group analysis:', error.message);
  }
}

testDanBuyerGroup();
