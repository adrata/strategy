const fetch = require('node-fetch');

async function testStacksAPI() {
  try {
    console.log('🔍 Testing Stacks API...');
    
    const response = await fetch('http://localhost:3000/api/v1/stacks/stories?workspaceId=01K7DNYR5VZ7JY36KGKKN76XZ1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('📊 Response body:', data);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testStacksAPI();
