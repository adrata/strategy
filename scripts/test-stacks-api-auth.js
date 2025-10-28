const fetch = require('node-fetch');

async function testStacksAPI() {
  try {
    console.log('🔍 Testing Stacks API authentication...\n');

    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/v1/stacks/stories?workspaceId=01K7DNYR5VZ7JY36KGKKN76XZ1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: No authentication cookies in this test
      }
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body:', responseText);

    if (response.status === 401) {
      console.log('\n❌ API is returning 401 Unauthorized - authentication issue');
      console.log('💡 This is expected when testing without browser cookies');
      console.log('💡 The API should work when called from the browser with proper authentication');
    } else if (response.status === 200) {
      console.log('\n✅ API is working correctly');
    } else {
      console.log(`\n⚠️ Unexpected status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testStacksAPI();
