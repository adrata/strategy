#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL ALL ENDPOINTS TEST
 * 
 * Test all possible CoreSignal API endpoints to find working ones
 */

require('dotenv').config();

class CoreSignalAllEndpointsTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
  }

  async testAllEndpoints() {
    console.log('🔍 TESTING ALL CORESIGNAL API ENDPOINTS');
    console.log('=======================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test different possible person endpoints
    const endpoints = [
      // Person endpoints
      { url: 'https://api.coresignal.com/cdapi/v2/person_multi_source/search?name=test&limit=1', description: 'Person multi-source search' },
      { url: 'https://api.coresignal.com/cdapi/v2/person/search?name=test&limit=1', description: 'Person search' },
      { url: 'https://api.coresignal.com/cdapi/v2/people/search?name=test&limit=1', description: 'People search' },
      
      // Employee endpoints
      { url: 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search?name=test&limit=1', description: 'Employee multi-source search' },
      { url: 'https://api.coresignal.com/cdapi/v2/employee/search?name=test&limit=1', description: 'Employee search' },
      { url: 'https://api.coresignal.com/cdapi/v2/employees/search?name=test&limit=1', description: 'Employees search' },
      
      // V1 endpoints
      { url: 'https://api.coresignal.com/cdapi/v1/person_multi_source/search?name=test&limit=1', description: 'Person multi-source search (v1)' },
      { url: 'https://api.coresignal.com/cdapi/v1/person/search?name=test&limit=1', description: 'Person search (v1)' },
      { url: 'https://api.coresignal.com/cdapi/v1/people/search?name=test&limit=1', description: 'People search (v1)' },
      
      // Alternative base URLs
      { url: 'https://api.coresignal.com/v2/person/search?name=test&limit=1', description: 'Person search (alt base)' },
      { url: 'https://api.coresignal.com/v1/person/search?name=test&limit=1', description: 'Person search (alt base v1)' },
      { url: 'https://api.coresignal.com/api/v2/person/search?name=test&limit=1', description: 'Person search (api base)' },
      { url: 'https://api.coresignal.com/api/v1/person/search?name=test&limit=1', description: 'Person search (api base v1)' },
    ];
    
    const workingEndpoints = [];
    
    for (const test of endpoints) {
      await this.testEndpoint(test, workingEndpoints);
    }
    
    console.log('\\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total endpoints tested: ${endpoints.length}`);
    console.log(`Working endpoints: ${workingEndpoints.length}`);
    
    if (workingEndpoints.length > 0) {
      console.log('\\n✅ WORKING ENDPOINTS:');
      workingEndpoints.forEach((endpoint, index) => {
        console.log(`${index + 1}. ${endpoint.description}`);
        console.log(`   URL: ${endpoint.url}`);
        console.log(`   Status: ${endpoint.status}`);
        console.log('');
      });
    } else {
      console.log('\\n❌ NO WORKING PERSON ENDPOINTS FOUND');
      console.log('This suggests:');
      console.log('1. CoreSignal API has changed significantly');
      console.log('2. Person/employee endpoints may be deprecated');
      console.log('3. Different authentication method required');
      console.log('4. API may be down or restricted');
    }
  }

  async testEndpoint(test, workingEndpoints) {
    try {
      console.log(`Testing: ${test.description}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await fetch(test.url, {
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
        console.log(`   ✅ SUCCESS: ${test.description} is working!`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`);
        workingEndpoints.push({
          ...test,
          status: response.status,
          data: data
        });
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

// Run the test
async function main() {
  const tester = new CoreSignalAllEndpointsTest();
  await tester.testAllEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalAllEndpointsTest;
