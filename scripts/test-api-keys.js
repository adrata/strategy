/**
 * Test script to verify OpenRouter and Anthropic API keys work
 * Run with: node scripts/test-api-keys.js
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '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';

async function testOpenRouter() {
  console.log('🧪 Testing OpenRouter API...');
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://adrata.com',
        'X-Title': 'Adrata AI Assistant'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4.5',
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, OpenRouter is working!" if you can read this.'
          }
        ],
        max_tokens: 50
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ OpenRouter API Success!');
    console.log('Response:', data.choices[0]?.message?.content || 'No content');
    return true;
  } catch (error) {
    console.error('❌ OpenRouter API Error:', error.message);
    return false;
  }
}

async function testAnthropic() {
  console.log('\n🧪 Testing Anthropic Claude API...');
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: 'Say "Hello, Claude is working!" if you can read this.'
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Anthropic API Error:', response.status, errorText);
      return false;
    }

    const data = await response.json();
    console.log('✅ Anthropic API Success!');
    console.log('Response:', data.content[0]?.text || 'No content');
    return true;
  } catch (error) {
    console.error('❌ Anthropic API Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔑 API Key Test Script\n');
  console.log('OpenRouter Key:', OPENROUTER_API_KEY.substring(0, 20) + '...');
  console.log('Anthropic Key:', ANTHROPIC_API_KEY.substring(0, 20) + '...\n');

  const openRouterWorks = await testOpenRouter();
  const anthropicWorks = await testAnthropic();

  console.log('\n📊 Results:');
  console.log('OpenRouter:', openRouterWorks ? '✅ Working' : '❌ Failed');
  console.log('Anthropic:', anthropicWorks ? '✅ Working' : '❌ Failed');

  if (openRouterWorks && anthropicWorks) {
    console.log('\n🎉 Both APIs are working!');
    process.exit(0);
  } else {
    console.log('\n⚠️ Some APIs failed. Check the errors above.');
    process.exit(1);
  }
}

main().catch(console.error);

