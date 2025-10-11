require('dotenv').config();

/**
 * 🔍 ISOLATED PERPLEXITY API TEST
 * 
 * Test Perplexity API authentication and employment verification
 */

async function testPerplexityAPI() {
    console.log('🧪 ISOLATED PERPLEXITY API TEST');
    console.log('=====================================\n');

    // Check API key
    const apiKey = process.env.PERPLEXITY_API_KEY;
    console.log('🔑 API Key Status:');
    console.log(`   Key exists: ${apiKey ? 'YES' : 'NO'}`);
    console.log(`   Key length: ${apiKey ? apiKey.length : 0}`);
    console.log(`   Key preview: ${apiKey ? apiKey.substring(0, 8) + '...' : 'N/A'}`);
    console.log('');

    if (!apiKey) {
        console.log('❌ PERPLEXITY_API_KEY not found in environment variables');
        return;
    }

    // Test 1: Basic API connectivity
    console.log('1️⃣ Testing Basic API Connectivity...');
    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [{ 
                    role: 'user', 
                    content: 'Hello, are you working?' 
                }],
                temperature: 0.1,
                max_tokens: 50
            })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Basic connectivity: SUCCESS');
            console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
        } else {
            const errorText = await response.text();
            console.log('   ❌ Basic connectivity: FAILED');
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log('   ❌ Basic connectivity: ERROR');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Test 2: Employment verification with structured prompt
    console.log('2️⃣ Testing Employment Verification...');
    try {
        const prompt = `Is John Smith currently employed as CFO at TestCompany as of ${new Date().toISOString().split('T')[0]}? 
        
        Respond in this exact format:
        STATUS: [CURRENT|FORMER|UNKNOWN]
        CONFIDENCE: [0-100]
        LAST_KNOWN_DATE: [YYYY-MM-DD or UNKNOWN]
        NOTES: [Brief explanation]`;

        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                max_tokens: 150
            })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            console.log('   ✅ Employment verification: SUCCESS');
            console.log(`   Response: ${content}`);
            
            // Parse structured response
            const statusMatch = content.match(/STATUS:\s*([A-Z]+)/);
            const confidenceMatch = content.match(/CONFIDENCE:\s*(\d+)/);
            const dateMatch = content.match(/LAST_KNOWN_DATE:\s*([^\n]+)/);
            const notesMatch = content.match(/NOTES:\s*([^\n]+)/);
            
            console.log('   📊 Parsed Results:');
            console.log(`      Status: ${statusMatch ? statusMatch[1] : 'NOT_FOUND'}`);
            console.log(`      Confidence: ${confidenceMatch ? confidenceMatch[1] : 'NOT_FOUND'}`);
            console.log(`      Date: ${dateMatch ? dateMatch[1].trim() : 'NOT_FOUND'}`);
            console.log(`      Notes: ${notesMatch ? notesMatch[1].trim() : 'NOT_FOUND'}`);
        } else {
            const errorText = await response.text();
            console.log('   ❌ Employment verification: FAILED');
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log('   ❌ Employment verification: ERROR');
        console.log(`   Error: ${error.message}`);
    }
    console.log('');

    // Test 3: Different models
    console.log('3️⃣ Testing Different Models...');
    const models = ['sonar', 'sonar-pro', 'llama-3.1-sonar'];
    
    for (const model of models) {
        try {
            console.log(`   Testing model: ${model}`);
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [{ 
                        role: 'user', 
                        content: 'What is 2+2?' 
                    }],
                    temperature: 0.1,
                    max_tokens: 10
                })
            });

            console.log(`      Status: ${response.status} ${response.statusText}`);
            
            if (response.ok) {
                const data = await response.json();
                console.log(`      ✅ ${model}: SUCCESS`);
                console.log(`      Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
            } else {
                const errorText = await response.text();
                console.log(`      ❌ ${model}: FAILED`);
                console.log(`      Error: ${errorText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`      ❌ ${model}: ERROR`);
            console.log(`      Error: ${error.message}`);
        }
    }
    console.log('');

    // Test 4: Check API usage/limits
    console.log('4️⃣ Testing API Usage Information...');
    try {
        // Try to get usage info (this might not be available)
        const response = await fetch('https://api.perplexity.ai/usage', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            }
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Usage info: SUCCESS');
            console.log(`   Data: ${JSON.stringify(data, null, 2)}`);
        } else {
            console.log('   ⚠️ Usage info: Not available (this is normal)');
        }
    } catch (error) {
        console.log('   ⚠️ Usage info: Not available (this is normal)');
    }
    console.log('');

    console.log('🏁 PERPLEXITY API TEST COMPLETE');
}

// Run the test
testPerplexityAPI().catch(console.error);
