/**
 * Test script for AI Chat API endpoint
 */

async function testAIChatAPI() {
  console.log('🧪 Testing AI Chat API Endpoint...');
  
  const baseUrl = 'http://localhost:3000';
  const testMessage = "What's the best way to approach a new prospect?";
  
  try {
    console.log('\n1. Testing basic AI chat request...');
    
    const response = await fetch(`${baseUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        appType: 'sales',
        workspaceId: 'test-workspace',
        userId: 'test-user',
        conversationHistory: [],
        currentRecord: null,
        recordType: null,
        enableVoiceResponse: false,
        selectedVoiceId: 'default'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('✅ API Response received:');
    console.log('Success:', data.success);
    console.log('Response length:', data.response?.length || 0);
    console.log('Model:', data.metadata?.model || 'unknown');
    console.log('Confidence:', data.metadata?.confidence || 'unknown');
    console.log('Processing time:', data.metadata?.processingTime || 'unknown', 'ms');
    
    if (data.response) {
      console.log('\n📝 Sample response:');
      console.log(data.response.substring(0, 300) + '...');
    }
    
    console.log('\n🎉 AI Chat API test completed successfully!');
    
  } catch (error) {
    console.error('❌ API test failed:', error);
    console.log('\n💡 Make sure your development server is running on localhost:3000');
  }
}

// Run the test
testAIChatAPI();
