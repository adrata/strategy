/**
 * Test script for Claude AI integration
 */

const { claudeAIService } = require('./src/platform/services/ClaudeAIService.ts');

async function testClaudeIntegration() {
  console.log('🧪 Testing Claude AI Integration...');
  
  try {
    // Test 1: Basic connection
    console.log('\n1. Testing Claude API connection...');
    const connectionTest = await claudeAIService.testConnection();
    console.log('✅ Connection test:', connectionTest ? 'PASSED' : 'FAILED');
    
    // Test 2: Simple chat response
    console.log('\n2. Testing simple chat response...');
    const chatResponse = await claudeAIService.generateChatResponse({
      message: "What's the best way to approach a new prospect?",
      appType: 'sales',
      workspaceId: 'test-workspace',
      userId: 'test-user'
    });
    
    console.log('✅ Chat response generated:');
    console.log('Response:', chatResponse.response.substring(0, 200) + '...');
    console.log('Confidence:', chatResponse.confidence);
    console.log('Model:', chatResponse.model);
    console.log('Processing time:', chatResponse.processingTime + 'ms');
    
    // Test 3: Context-aware response
    console.log('\n3. Testing context-aware response...');
    const contextResponse = await claudeAIService.generateChatResponse({
      message: "What should I do next with this prospect?",
      currentRecord: {
        fullName: 'John Smith',
        company: { name: 'Acme Corp' },
        title: 'VP of Sales'
      },
      recordType: 'prospect',
      appType: 'sales',
      workspaceId: 'test-workspace',
      userId: 'test-user'
    });
    
    console.log('✅ Context-aware response generated:');
    console.log('Response:', contextResponse.response.substring(0, 200) + '...');
    console.log('Confidence:', contextResponse.confidence);
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testClaudeIntegration();
