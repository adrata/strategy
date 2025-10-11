require('dotenv').config();

/**
 * 🔍 PERPLEXITY API KEY VALIDATION
 * 
 * Test different approaches to validate the API key
 */

async function validatePerplexityKey() {
    console.log('🔍 PERPLEXITY API KEY VALIDATION');
    console.log('==================================\n');

    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    if (!apiKey) {
        console.log('❌ No API key found in PERPLEXITY_API_KEY');
        return;
    }

    console.log('🔑 API Key Info:');
    console.log(`   Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`);
    console.log(`   Length: ${apiKey.length}`);
    console.log('');

    // Test different models and endpoints
    const testCases = [
        {
            name: 'Sonar Model (Standard)',
            model: 'sonar',
            endpoint: 'https://api.perplexity.ai/chat/completions'
        },
        {
            name: 'Sonar Pro Model',
            model: 'sonar-pro',
            endpoint: 'https://api.perplexity.ai/chat/completions'
        },
        {
            name: 'Llama 3.1 Sonar',
            model: 'llama-3.1-sonar',
            endpoint: 'https://api.perplexity.ai/chat/completions'
        },
        {
            name: 'Mistral 7B (Alternative)',
            model: 'mistral-7b-instruct',
            endpoint: 'https://api.perplexity.ai/chat/completions'
        },
        {
            name: 'Legacy Endpoint',
            model: 'sonar',
            endpoint: 'https://api.perplexity.ai/v1/chat/completions'
        }
    ];

    for (const testCase of testCases) {
        console.log(`🧪 Testing: ${testCase.name}`);
        console.log(`   Model: ${testCase.model}`);
        console.log(`   Endpoint: ${testCase.endpoint}`);
        
        try {
            const response = await fetch(testCase.endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: testCase.model,
                    messages: [{ 
                        role: 'user', 
                        content: 'Hello' 
                    }],
                    temperature: 0.1,
                    max_tokens: 10
                })
            });

            console.log(`   Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ SUCCESS: ${testCase.name}`);
                console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
                console.log(`   Model used: ${data.model || 'Unknown'}`);
                break; // Stop on first success
            } else {
                const errorText = await response.text();
                console.log(`   ❌ FAILED: ${testCase.name}`);
                
                // Try to parse error response
                try {
                    const errorData = JSON.parse(errorText);
                    console.log(`   Error details: ${JSON.stringify(errorData, null, 2)}`);
                } catch {
                    console.log(`   Error text: ${errorText.substring(0, 200)}...`);
                }
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${testCase.name}`);
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }

    // Test account status
    console.log('📊 Testing Account Status...');
    try {
        const response = await fetch('https://api.perplexity.ai/account', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Account info: SUCCESS');
            console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
        } else {
            const errorText = await response.text();
            console.log('   ❌ Account info: FAILED');
            console.log(`   Error: ${errorText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.log('   ❌ Account info: ERROR');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n💡 TROUBLESHOOTING SUGGESTIONS:');
    console.log('1. Check if API key is activated in Perplexity dashboard');
    console.log('2. Verify API key has sufficient credits');
    console.log('3. Check if API key has expired');
    console.log('4. Try generating a new API key');
    console.log('5. Check Perplexity API status page');

    console.log('\n🏁 API KEY VALIDATION COMPLETE');
}

// Run the validation
validatePerplexityKey().catch(console.error);
