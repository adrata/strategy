#!/usr/bin/env npx tsx

/**
 * Test API Key Access
 */

async function testApiKeyAccess() {
  console.log('Testing API Key Access');
  console.log('=====================');
  
  // Check environment
  const apiKey = process.env.CORESIGNAL_API_KEY;
  console.log(`API Key from env: ${apiKey ? 'Found' : 'NOT FOUND'}`);
  console.log(`API Key length: ${apiKey?.length || 0}`);
  console.log(`API Key prefix: ${apiKey?.substring(0, 10) || 'N/A'}...`);
  
  if (!apiKey) {
    console.log('ERROR: CORESIGNAL_API_KEY not found in environment');
    return;
  }
  
  // Test basic HTTP request to CoreSignal
  console.log('\nTesting CoreSignal API access...');
  
  try {
    const https = require('https');
    
    const options = {
      hostname: 'api.coresignal.com',
      port: 443,
      path: '/v1/professional-network/search',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey
      }
    };
    
    const testQuery = {
      query: {
        bool: {
          must: [
            { match: { 'experience.company': 'Dell Technologies' } }
          ]
        }
      },
      size: 1
    };
    
    const result = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(testQuery));
      req.end();
    });
    
    console.log('API Test Result:', result);
    
  } catch (error) {
    console.log('API Test Error:', error);
  }
}

testApiKeyAccess().catch(console.error);
