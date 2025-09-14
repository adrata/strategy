#!/usr/bin/env node

/**
 * DEBUG COLLECTION ENDPOINT - Find the correct way to collect profiles
 */

const CONFIG = {
    CORESIGNAL_API_KEY: 'CREDENTIAL_REMOVED_FOR_SECURITY',
    CORESIGNAL_BASE_URL: 'https://api.coresignal.com'
};

async function testCollectionMethods(candidateIds) {
    console.log(`🔍 Testing collection methods for IDs: ${candidateIds.slice(0, 2)}`);
    
    // Method 1: GET with query params
    console.log('\n1️⃣ Testing GET with query params...');
    try {
        const response1 = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect?member_ids=${candidateIds.slice(0, 2).join(',')}`, {
            method: 'GET',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Accept': 'application/json'
            }
        });
        
        console.log(`   Status: ${response1.status}`);
        if (response1.ok) {
            const data = await response1.json();
            console.log(`   Success! Got ${Array.isArray(data) ? data.length : 'non-array'} profiles`);
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   First profile: ${data[0].first_name} ${data[0].last_name}`);
            }
        } else {
            const errorText = await response1.text();
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
    
    // Method 2: POST with body
    console.log('\n2️⃣ Testing POST with body...');
    try {
        const response2 = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                member_ids: candidateIds.slice(0, 2)
            })
        });
        
        console.log(`   Status: ${response2.status}`);
        if (response2.ok) {
            const data = await response2.json();
            console.log(`   Success! Got ${Array.isArray(data) ? data.length : 'non-array'} profiles`);
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   First profile: ${data[0].first_name} ${data[0].last_name}`);
            }
        } else {
            const errorText = await response2.text();
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
    
    // Method 3: Different endpoint
    console.log('\n3️⃣ Testing different endpoint...');
    try {
        const response3 = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v1/linkedin/person/collect`, {
            method: 'POST',
            headers: {
                'apikey': CONFIG.CORESIGNAL_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                member_ids: candidateIds.slice(0, 2)
            })
        });
        
        console.log(`   Status: ${response3.status}`);
        if (response3.ok) {
            const data = await response3.json();
            console.log(`   Success! Got ${Array.isArray(data) ? data.length : 'non-array'} profiles`);
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   First profile: ${data[0].first_name} ${data[0].last_name}`);
            }
        } else {
            const errorText = await response3.text();
            console.log(`   Error: ${errorText}`);
        }
    } catch (error) {
        console.log(`   Exception: ${error.message}`);
    }
}

async function main() {
    console.log('🚀 COLLECTION ENDPOINT DEBUG');
    console.log('Finding the correct way to collect profiles...\n');
    
    // Use some candidate IDs we know exist from Toast
    const testIds = ['438518384', '22436173'];
    
    await testCollectionMethods(testIds);
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Debug script failed:', error);
        process.exit(1);
    });
}
