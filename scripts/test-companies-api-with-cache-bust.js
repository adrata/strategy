const fetch = require('node-fetch');

async function testCompaniesAPIWithCacheBust() {
  try {
    console.log('🔍 Testing companies API with cache busting...');
    
    // Test the exact API call that the frontend makes
    const url = `http://localhost:3000/api/data/section?section=companies&workspaceId=01K1VBYX2YERMXBFJ60RC6J194&userId=01K1VBYZMWTCT09FWEKBDMCXZM&limit=1000&t=${Date.now()}`;
    console.log('🌐 API URL:', url);
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'auth-token=your-token-here' // This might be the issue - no auth
      }
    });
    
    if (!response.ok) {
      console.log('❌ API Response not OK:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('📊 API Response:', {
      success: result.success,
      hasData: !!result.data,
      dataType: typeof result.data,
      hasDataData: !!result.data?.data,
      dataDataIsArray: Array.isArray(result.data?.data),
      dataDataLength: result.data?.data?.length
    });
    
    if (result.success && result.data?.data && Array.isArray(result.data.data)) {
      const companies = result.data.data;
      console.log(`📈 Total companies returned: ${companies.length}`);
      
      // Check for Sarah's companies specifically
      const sarahCompanies = companies.filter(c => c.assignedUserId === 'cybersecurity-seller-2');
      console.log(`🎯 Sarah Rodriguez companies: ${sarahCompanies.length}`);
      
      if (sarahCompanies.length > 0) {
        console.log('✅ Sarah has companies in API response:');
        sarahCompanies.slice(0, 5).forEach(company => {
          console.log(`  - ${company.name} (${company.assignedUserId})`);
        });
      } else {
        console.log('❌ No companies found for Sarah Rodriguez');
        
        // Show sample assigned user IDs
        const assignedUserIds = [...new Set(companies.map(c => c.assignedUserId))];
        console.log('📋 Sample assigned user IDs in API response:');
        assignedUserIds.slice(0, 10).forEach(id => {
          const count = companies.filter(c => c.assignedUserId === id).length;
          console.log(`  ${id}: ${count} companies`);
        });
      }
    } else {
      console.log('❌ API response structure is invalid');
      console.log('❌ Full response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing companies API:', error);
  }
}

testCompaniesAPIWithCacheBust();
