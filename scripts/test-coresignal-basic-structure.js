#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL BASIC API STRUCTURE TEST
 * 
 * Test basic CoreSignal API structure to find working endpoints
 */

require('dotenv').config();

class CoreSignalBasicStructureTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testBasicStructure() {
    console.log('🔍 TESTING CORESIGNAL BASIC API STRUCTURE');
    console.log('=========================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test basic API health
    await this.testAPIHealth();
    
    // Test different base URLs
    await this.testDifferentBaseUrls();
    
    // Test different endpoint patterns
    await this.testDifferentEndpointPatterns();
  }

  async testAPIHealth() {
    console.log('🔍 TESTING API HEALTH');
    console.log('=====================');
    
    try {
      // Test a simple endpoint that should work
      const url = `${this.baseUrl}/companies/search?name=test&limit=1`;
      console.log('Testing basic company search...');
      console.log('URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Status:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS: Basic API is working');
        console.log('Response:', JSON.stringify(data, null, 2));
      } else {
        const errorText = await response.text();
        console.log('❌ Error:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ Exception:', error.message);
    }
    
    console.log('');
  }

  async testDifferentBaseUrls() {
    console.log('🔍 TESTING DIFFERENT BASE URLS');
    console.log('==============================');
    
    const baseUrls = [
      'https://api.coresignal.com/cdapi/v2',
      'https://api.coresignal.com/cdapi/v1',
      'https://api.coresignal.com/v2',
      'https://api.coresignal.com/v1',
      'https://api.coresignal.com/api/v2',
      'https://api.coresignal.com/api/v1'
    ];
    
    for (const baseUrl of baseUrls) {
      try {
        const url = `${baseUrl}/companies/search?name=test&limit=1`;
        console.log(`Testing base URL: ${baseUrl}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log(`   ✅ SUCCESS: ${baseUrl} is working`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
      console.log('');
    }
  }

  async testDifferentEndpointPatterns() {
    console.log('🔍 TESTING DIFFERENT ENDPOINT PATTERNS');
    console.log('======================================');
    
    const endpoints = [
      '/companies/search?name=test&limit=1',
      '/company/search?name=test&limit=1',
      '/companies/find?name=test&limit=1',
      '/company/find?name=test&limit=1',
      '/companies/lookup?name=test&limit=1',
      '/company/lookup?name=test&limit=1',
      '/companies/enrich?name=test&limit=1',
      '/company/enrich?name=test&limit=1'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        console.log(`Testing endpoint: ${endpoint}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'apikey': this.apiKey,
            'accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`   Status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ SUCCESS: ${endpoint} is working`);
          console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`   ❌ Exception: ${error.message}`);
      }
      console.log('');
    }
  }
}

// Run the test
async function main() {
  const tester = new CoreSignalBasicStructureTest();
  await tester.testBasicStructure();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalBasicStructureTest;
