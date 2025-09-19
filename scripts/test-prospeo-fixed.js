#!/usr/bin/env node

/**
 * 🔧 TEST PROSPEO API WITH CORRECT HEADER FORMAT
 */

const axios = require('axios');
require('dotenv').config();

async function testProspeoFixed() {
    console.log('🔧 TESTING PROSPEO API WITH CORRECT FORMAT');
    console.log('='.repeat(40));

    if (!process.env.PROSPEO_API_KEY) {
        console.log('❌ Prospeo API key not available');
        return;
    }

    const apiKey = process.env.PROSPEO_API_KEY;
    console.log(`🔑 Using API Key: ${apiKey.substring(0, 8)}...${apiKey.slice(-4)}`);

    try {
        console.log('   Testing with X-KEY header...');
        
        // Try different endpoints
        const endpoints = [
            'https://api.prospeo.io/email-finder',
            'https://api.prospeo.io/v1/email-finder',
            'https://api.prospeo.io/find-email'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`   Testing endpoint: ${endpoint}`);
                
                const response = await axios({
                    method: 'POST',
                    url: endpoint,
                    headers: {
                        'X-KEY': apiKey,
                        'Content-Type': 'application/json'
                    },
                    data: {
                        first_name: 'John',
                        last_name: 'Doe',
                        company: 'microsoft.com'
                    },
                    timeout: 10000
                });

                console.log(`   ✅ Prospeo API: Status ${response.status} on ${endpoint}`);
                console.log(`   📋 Response:`, response.data);
                return { working: true, status: response.status, data: response.data, endpoint };
            } catch (error) {
                console.log(`   ❌ ${endpoint}: ${error.response?.status || error.message}`);
                if (error.response?.data) {
                    console.log(`   📋 Error:`, error.response.data);
                }
            }
        }

        return { working: false, error: 'All endpoints failed' };
    } catch (error) {
        console.log(`   ❌ Prospeo API: ${error.response?.status || error.message}`);
        if (error.response?.data) {
            console.log(`   📋 Error Response:`, error.response.data);
        }
        return { working: false, error: error.message };
    }
}

// Run the test
if (require.main === module) {
    testProspeoFixed()
        .then(result => {
            if (result.working) {
                console.log('\n🎉 Prospeo API working!');
                process.exit(0);
            } else {
                console.log('\n⚠️ Prospeo API needs attention.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Prospeo test failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testProspeoFixed };
