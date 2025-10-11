require('dotenv').config();

/**
 * 🔍 PERPLEXITY AUTHENTICATION DEBUG
 * 
 * Debug Perplexity API authentication issues
 */

async function debugPerplexityAuth() {
    console.log('🔍 PERPLEXITY AUTHENTICATION DEBUG');
    console.log('===================================\n');

    const apiKey = process.env.PERPLEXITY_API_KEY;
    
    console.log('🔑 API Key Analysis:');
    console.log(`   Raw key: "${apiKey}"`);
    console.log(`   Length: ${apiKey ? apiKey.length : 0}`);
    console.log(`   Starts with 'pplx-': ${apiKey ? apiKey.startsWith('pplx-') : false}`);
    console.log(`   Has spaces: ${apiKey ? apiKey.includes(' ') : false}`);
    console.log(`   Has newlines: ${apiKey ? apiKey.includes('\n') : false}`);
    console.log(`   Trimmed: "${apiKey ? apiKey.trim() : 'N/A'}"`);
    console.log('');

    if (!apiKey) {
        console.log('❌ No API key found in PERPLEXITY_API_KEY');
        return;
    }

    // Test different header formats
    const headerFormats = [
        { name: 'Bearer (standard)', header: `Bearer ${apiKey.trim()}` },
        { name: 'Direct key', header: apiKey.trim() },
        { name: 'pplx- prefix', header: `pplx-${apiKey.trim()}` },
        { name: 'API-Key header', header: apiKey.trim(), headerName: 'API-Key' }
    ];

    for (const format of headerFormats) {
        console.log(`🧪 Testing: ${format.name}`);
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (format.headerName) {
                headers[format.headerName] = format.header;
            } else {
                headers['Authorization'] = format.header;
            }

            console.log(`   Headers: ${JSON.stringify(headers, null, 2)}`);

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    model: 'sonar',
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
                console.log(`   ✅ SUCCESS: ${format.name}`);
                console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
                break; // Stop on first success
            } else {
                const errorText = await response.text();
                console.log(`   ❌ FAILED: ${format.name}`);
                console.log(`   Error: ${errorText.substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`   ❌ ERROR: ${format.name}`);
            console.log(`   Error: ${error.message}`);
        }
        console.log('');
    }

    // Test with web search to verify API key validity
    console.log('🌐 Testing with web search capability...');
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
                    content: 'What is the current date?' 
                }],
                temperature: 0.1,
                max_tokens: 50
            })
        });

        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('   ✅ Web search test: SUCCESS');
            console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
        } else {
            const errorText = await response.text();
            console.log('   ❌ Web search test: FAILED');
            console.log(`   Error: ${errorText.substring(0, 200)}...`);
        }
    } catch (error) {
        console.log('   ❌ Web search test: ERROR');
        console.log(`   Error: ${error.message}`);
    }

    console.log('\n🏁 AUTHENTICATION DEBUG COMPLETE');
}

// Run the debug
debugPerplexityAuth().catch(console.error);
