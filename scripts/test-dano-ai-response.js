#!/usr/bin/env node

/**
 * Test Dano's AI Response Style
 * Tests if the AI is responding with Dano's "tough love" personality
 */

async function testDanoAIResponse() {
  console.log('🎭 Testing Dano\'s AI Response Style\n');
  
  try {
    // Test the AI chat API with Dano's user ID
    const response = await fetch('http://localhost:3000/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'I need help with my pipeline',
        userId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's user ID
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72', // Dano's workspace ID
        appType: 'Pipeline',
        currentRecord: {
          id: 'test-record',
          name: 'Test Company',
          industry: 'Technology'
        },
        recordType: 'account'
      })
    });
    
    if (!response.ok) {
      console.log('❌ API request failed:', response.status, response.statusText);
      console.log('   Make sure the development server is running: npm run dev');
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ AI Response Received!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Response:');
    console.log(data.response || data.message || 'No response content');
    
    // Check if the response has Dano's "tough love" characteristics
    const responseText = (data.response || data.message || '').toLowerCase();
    const hasToughLove = responseText.includes('unacceptable') || 
                        responseText.includes('step it up') || 
                        responseText.includes('no excuse') ||
                        responseText.includes('demanding') ||
                        responseText.includes('firm') ||
                        responseText.includes('excellence');
    
    console.log('\n🎯 Personality Analysis:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`• Tough Love Style: ${hasToughLove ? '✅' : '❌'}`);
    console.log(`• Response Length: ${(data.response || data.message || '').length} characters`);
    
    if (hasToughLove) {
      console.log('\n🎉 SUCCESS! Dano\'s "Tough Love" personality is working!');
      console.log('   The AI is responding with his firm, demanding style.');
    } else {
      console.log('\n⚠️  The response doesn\'t show Dano\'s "tough love" style.');
      console.log('   This might be because:');
      console.log('   • The AI context service isn\'t loading personality preferences');
      console.log('   • The personality preferences aren\'t being applied to the system prompt');
      console.log('   • The response is using fallback logic');
    }
    
  } catch (error) {
    console.error('❌ Error testing AI response:', error);
    console.log('\n🔧 This might be because:');
    console.log('   • Development server is not running');
    console.log('   • API endpoint is not available');
    console.log('   • Network connection issues');
  }
}

testDanoAIResponse();
