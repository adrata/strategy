#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL API CORRECT ENDPOINTS TEST
 * 
 * Test CoreSignal API with correct endpoint formats
 */

require('dotenv').config();

class CoreSignalCorrectEndpointsTest {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async testCorrectEndpoints() {
    console.log('🔍 TESTING CORESIGNAL API WITH CORRECT ENDPOINTS');
    console.log('================================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test the correct endpoint format based on documentation
    await this.testCompanyEnrichment();
    await this.testPersonEnrichment();
    await this.testPersonSearch();
  }

  async testCompanyEnrichment() {
    console.log('🔍 TESTING COMPANY ENRICHMENT ENDPOINT');
    console.log('=====================================');
    
    const testUrl = 'https://www.linkedin.com/company/dairyland-power-cooperative';
    
    try {
      const url = `${this.baseUrl}/company_multi_source/enrich?website=${encodeURIComponent(testUrl)}`;
      console.log('Testing company enrichment with:', testUrl);
      
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
        console.log(`   ✅ Success: Company enrichment working`);
        console.log(`   Company: ${data.name || 'Not found'}`);
        console.log(`   Industry: ${data.industry || 'Not found'}`);
        console.log(`   Size: ${data.employee_count || 'Not found'}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('');
  }

  async testPersonEnrichment() {
    console.log('🔍 TESTING PERSON ENRICHMENT ENDPOINT');
    console.log('=====================================');
    
    const testLinkedIn = 'https://www.linkedin.com/in/jeffrey-sexton-362b6829';
    
    try {
      const url = `${this.baseUrl}/person_multi_source/enrich?website=${encodeURIComponent(testLinkedIn)}`;
      console.log('Testing person enrichment with:', testLinkedIn);
      
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
        console.log(`   ✅ Success: Person enrichment working`);
        console.log(`   Name: ${data.full_name || 'Not found'}`);
        console.log(`   Title: ${data.active_experience_title || 'Not found'}`);
        console.log(`   Company: ${data.active_experience_company || 'Not found'}`);
        console.log(`   Email: ${data.primary_professional_email || 'Not found'}`);
        console.log(`   Phone: ${data.phone || 'Not found'}`);
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
    
    console.log('');
  }

  async testPersonSearch() {
    console.log('🔍 TESTING PERSON SEARCH ENDPOINT');
    console.log('==================================');
    
    try {
      // Test different search endpoint formats
      const searchEndpoints = [
        '/person/search?name=Jeffrey Sexton&limit=1',
        '/people/search?name=Jeffrey Sexton&limit=1',
        '/person/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829&limit=1',
        '/people/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829&limit=1'
      ];
      
      for (const endpoint of searchEndpoints) {
        console.log(`Testing endpoint: ${endpoint}`);
        
        const url = `${this.baseUrl}${endpoint}`;
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
          console.log(`   ✅ Success: ${JSON.stringify(data).substring(0, 100)}...`);
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Error: ${errorText.substring(0, 100)}...`);
        }
        console.log('');
      }
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
    }
  }
}

// Run the test
async function main() {
  const tester = new CoreSignalCorrectEndpointsTest();
  await tester.testCorrectEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalCorrectEndpointsTest;
