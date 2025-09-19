#!/usr/bin/env node

/**
 * 🔧 TEST FIXED API HEADERS
 * 
 * Test the correct header formats for Lusha and Prospeo APIs
 */

const axios = require('axios');
require('dotenv').config();

async function testFixedHeaders() {
    console.log('🔧 TESTING FIXED API HEADERS');
    console.log('='.repeat(40));

    // Test Lusha with different header approaches
    await testLushaHeaders();
    
    // Test Prospeo with different header approaches
    await testProspeoHeaders();
}

async function testLushaHeaders() {
    console.log('\n🔧 Testing Lusha API Headers...');
    
    if (!process.env.LUSHA_API_KEY) {
        console.log('❌ Lusha API key not available');
        return;
    }

    const apiKey = process.env.LUSHA_API_KEY;
    const params = new URLSearchParams({
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Example',
        refreshJobInfo: 'true',
        revealEmails: 'true',
        revealPhones: 'true'
    });

    // Test different header formats
    const headerFormats = [
        { name: 'api_key header', headers: { 'api_key': apiKey } },
        { name: 'X-API-Key header', headers: { 'X-API-Key': apiKey } },
        { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${apiKey}` } },
        { name: 'Authorization Basic', headers: { 'Authorization': `Basic ${Buffer.from(apiKey + ':').toString('base64')}` } }
    ];

    for (const format of headerFormats) {
        try {
            console.log(`   Testing ${format.name}...`);
            
            const response = await axios({
                method: 'GET',
                url: `https://api.lusha.com/v2/person?${params}`,
                headers: {
                    ...format.headers,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            console.log(`   ✅ ${format.name}: Status ${response.status}`);
            return { working: true, format: format.name };
        } catch (error) {
            console.log(`   ❌ ${format.name}: ${error.response?.status || error.message}`);
        }
    }

    console.log('   ⚠️ No working header format found for Lusha');
    return { working: false };
}

async function testProspeoHeaders() {
    console.log('\n🔧 Testing Prospeo API Headers...');
    
    if (!process.env.PROSPEO_API_KEY) {
        console.log('❌ Prospeo API key not available');
        return;
    }

    const apiKey = process.env.PROSPEO_API_KEY;

    // Test different header formats
    const headerFormats = [
        { name: 'X-KEY header', headers: { 'X-KEY': apiKey } },
        { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${apiKey}` } },
        { name: 'X-API-Key header', headers: { 'X-API-Key': apiKey } },
        { name: 'api_key header', headers: { 'api_key': apiKey } }
    ];

    for (const format of headerFormats) {
        try {
            console.log(`   Testing ${format.name}...`);
            
            const response = await axios({
                method: 'POST',
                url: 'https://api.prospeo.io/email-finder',
                headers: {
                    ...format.headers,
                    'Content-Type': 'application/json'
                },
                data: {
                    first_name: 'John',
                    last_name: 'Doe',
                    company: 'Example'
                },
                timeout: 10000
            });

            console.log(`   ✅ ${format.name}: Status ${response.status}`);
            return { working: true, format: format.name };
        } catch (error) {
            console.log(`   ❌ ${format.name}: ${error.response?.status || error.message}`);
        }
    }

    console.log('   ⚠️ No working header format found for Prospeo');
    return { working: false };
}

// Run the tests
if (require.main === module) {
    testFixedHeaders()
        .then(() => {
            console.log('\n🎉 Header testing complete!');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Header testing failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testFixedHeaders };
