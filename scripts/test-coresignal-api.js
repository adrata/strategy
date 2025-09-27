#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL API TEST
 * 
 * Test CoreSignal API endpoints and authentication
 */

require('dotenv').config();

class CoreSignalAPITest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testAPI() {
    console.log('🔍 TESTING CORESIGNAL API');
    console.log('=========================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('API Key length:', this.apiKey.length);
    console.log('');
    
    // Test different endpoints
    await this.testEndpoint('/companies/search?name=test&limit=1', 'Company Search');
    await this.testEndpoint('/people/search?name=test&limit=1', 'People Search');
    await this.testEndpoint('/people/search?linkedin_url=https://linkedin.com/in/test&limit=1', 'LinkedIn Search');
    
    // Test with a real person
    console.log('\\n🔍 TESTING WITH REAL PERSON:');
    console.log('=============================');
    await this.testRealPerson();
  }

  async testEndpoint(endpoint, description) {
    try {
      console.log(`Testing ${description}...`);
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
        return true;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
        return false;
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
      return false;
    }
  }

  async testRealPerson() {
    // Test with Jeffrey Sexton from our database
    const testLinkedIn = 'https://www.linkedin.com/in/jeffrey-sexton-362b6829';
    const testName = 'Jeffrey Sexton';
    const testCompany = 'Dairyland Power Cooperative';
    
    console.log('Testing with Jeffrey Sexton...');
    console.log('LinkedIn:', testLinkedIn);
    console.log('Name:', testName);
    console.log('Company:', testCompany);
    console.log('');
    
    // Test LinkedIn URL search
    await this.testEndpoint(`/people/search?linkedin_url=${encodeURIComponent(testLinkedIn)}&limit=1`, 'LinkedIn URL Search');
    
    // Test name + company search
    await this.testEndpoint(`/people/search?name=${encodeURIComponent(testName)}&company=${encodeURIComponent(testCompany)}&limit=1`, 'Name + Company Search');
    
    // Test name only search
    await this.testEndpoint(`/people/search?name=${encodeURIComponent(testName)}&limit=1`, 'Name Only Search');
  }
}

// Run the test
async function main() {
  const tester = new CoreSignalAPITest();
  await tester.testAPI();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalAPITest;