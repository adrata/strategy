#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL PERSON ENDPOINTS TEST
 * 
 * Test various CoreSignal person endpoints to find working ones
 */

require('dotenv').config();

class CoreSignalPersonEndpointsTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testPersonEndpoints() {
    console.log('🔍 TESTING CORESIGNAL PERSON ENDPOINTS');
    console.log('=====================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test different person endpoint variations
    const endpoints = [
      // Person enrichment endpoints
      { endpoint: '/person_multi_source/enrich?website=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrichment by LinkedIn URL' },
      { endpoint: '/person/enrich?website=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrich by LinkedIn URL' },
      { endpoint: '/people/enrich?website=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'People enrich by LinkedIn URL' },
      
      // Person search endpoints
      { endpoint: '/person/search?name=Jeffrey Sexton&limit=1', description: 'Person search by name' },
      { endpoint: '/people/search?name=Jeffrey Sexton&limit=1', description: 'People search by name' },
      { endpoint: '/person/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829&limit=1', description: 'Person search by LinkedIn URL' },
      { endpoint: '/people/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829&limit=1', description: 'People search by LinkedIn URL' },
      
      // Employee endpoints
      { endpoint: '/employee_multi_source/search?name=Jeffrey Sexton&limit=1', description: 'Employee search by name' },
      { endpoint: '/employee_multi_source/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829&limit=1', description: 'Employee search by LinkedIn URL' },
      { endpoint: '/employee/search?name=Jeffrey Sexton&limit=1', description: 'Employee search by name (singular)' },
      { endpoint: '/employees/search?name=Jeffrey Sexton&limit=1', description: 'Employees search by name' },
      
      // Alternative base URLs
      { endpoint: '/person_multi_source/enrich?website=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrichment (v1)', baseUrl: 'https://api.coresignal.com/cdapi/v1' },
      { endpoint: '/person/enrich?website=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrich (v1)', baseUrl: 'https://api.coresignal.com/cdapi/v1' },
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
      console.log('\\n✅ WORKING PERSON ENDPOINTS:');
      workingEndpoints.forEach((endpoint, index) => {
        console.log(`${index + 1}. ${endpoint.description}`);
        console.log(`   URL: ${endpoint.baseUrl || this.baseUrl}${endpoint.endpoint}`);
        console.log(`   Status: ${endpoint.status}`);
        console.log('');
      });
    } else {
      console.log('\\n❌ NO WORKING PERSON ENDPOINTS FOUND');
      console.log('This suggests:');
      console.log('1. Person enrichment endpoints may be deprecated');
      console.log('2. Different authentication method required');
      console.log('3. API structure has changed significantly');
      console.log('4. Person data may not be available in current API');
    }
  }

  async testEndpoint(test, workingEndpoints) {
    try {
      const baseUrl = test.baseUrl || this.baseUrl;
      const url = `${baseUrl}${test.endpoint}`;
      
      console.log(`Testing: ${test.description}`);
      console.log(`   URL: ${url}`);
      
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
        console.log(`   ✅ SUCCESS: ${test.description} is working!`);
        console.log(`   Response: ${JSON.stringify(data).substring(0, 200)}...`);
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
  const tester = new CoreSignalPersonEndpointsTest();
  await tester.testPersonEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalPersonEndpointsTest;
