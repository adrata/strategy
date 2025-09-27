#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL ENDPOINTS DISCOVERY
 * 
 * Test various CoreSignal API endpoints to find working ones
 */

require('dotenv').config();

class CoreSignalEndpointsDiscovery {
  constructor() {
    this.apiKey = process.env.CORESIGNAL_API_KEY;
    this.baseUrl = 'https://api.coresignal.com/cdapi/v2';
  }

  async discoverEndpoints() {
    console.log('🔍 DISCOVERING CORESIGNAL API ENDPOINTS');
    console.log('=======================================');
    
    if (!this.apiKey) {
      console.log('❌ CORESIGNAL_API_KEY not found in environment');
      return;
    }
    
    console.log('API Key loaded:', this.apiKey ? 'Yes' : 'No');
    console.log('');
    
    // Test different possible endpoints
    const endpoints = [
      // Company endpoints
      { endpoint: '/company_multi_source/enrich?website=dairylandpower.com', description: 'Company enrichment by domain' },
      { endpoint: '/company_multi_source/enrich?website=linkedin.com/company/dairyland-power-cooperative', description: 'Company enrichment by LinkedIn' },
      
      // Person endpoints
      { endpoint: '/person_multi_source/enrich?website=linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrichment by LinkedIn' },
      { endpoint: '/person/enrich?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person enrichment by LinkedIn URL' },
      { endpoint: '/people/enrich?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'People enrichment by LinkedIn URL' },
      
      // Search endpoints
      { endpoint: '/person/search?name=Jeffrey Sexton', description: 'Person search by name' },
      { endpoint: '/people/search?name=Jeffrey Sexton', description: 'People search by name' },
      { endpoint: '/person/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person search by LinkedIn URL' },
      { endpoint: '/people/search?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'People search by LinkedIn URL' },
      
      // Lookup endpoints
      { endpoint: '/person/lookup?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person lookup by LinkedIn URL' },
      { endpoint: '/people/lookup?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'People lookup by LinkedIn URL' },
      
      // Find endpoints
      { endpoint: '/person/find?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'Person find by LinkedIn URL' },
      { endpoint: '/people/find?linkedin_url=https://www.linkedin.com/in/jeffrey-sexton-362b6829', description: 'People find by LinkedIn URL' },
      
      // Alternative base URLs
      { endpoint: '/person/search?name=Jeffrey Sexton', description: 'Person search (v1)', baseUrl: 'https://api.coresignal.com/cdapi/v1' },
      { endpoint: '/people/search?name=Jeffrey Sexton', description: 'People search (v1)', baseUrl: 'https://api.coresignal.com/cdapi/v1' },
    ];
    
    const workingEndpoints = [];
    
    for (const test of endpoints) {
      await this.testEndpoint(test, workingEndpoints);
    }
    
    console.log('\\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total endpoints tested: \${endpoints.length}`);
    console.log(`Working endpoints: \${workingEndpoints.length}`);
    
    if (workingEndpoints.length > 0) {
      console.log('\\n✅ WORKING ENDPOINTS:');
      workingEndpoints.forEach((endpoint, index) => {
        console.log(`\${index + 1}. \${endpoint.description}`);
        console.log(`   URL: \${endpoint.baseUrl || this.baseUrl}\${endpoint.endpoint}`);
        console.log(`   Status: \${endpoint.status}`);
        console.log('');
      });
    } else {
      console.log('\\n❌ NO WORKING ENDPOINTS FOUND');
      console.log('This suggests:');
      console.log('1. API key may be invalid or expired');
      console.log('2. API endpoints may have changed');
      console.log('3. API may be down or restricted');
      console.log('4. Different authentication method required');
    }
  }

  async testEndpoint(test, workingEndpoints) {
    try {
      const baseUrl = test.baseUrl || this.baseUrl;
      const url = `\${baseUrl}\${test.endpoint}`;
      
      console.log(`Testing: \${test.description}`);
      console.log(`   URL: \${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'apikey': this.apiKey,
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`   Status: \${response.status} \${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: \${JSON.stringify(data).substring(0, 100)}...`);
        workingEndpoints.push({
          ...test,
          status: response.status,
          data: data
        });
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Error: \${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`   ❌ Exception: \${error.message}`);
    }
    
    console.log('');
  }
}

// Run the discovery
async function main() {
  const discovery = new CoreSignalEndpointsDiscovery();
  await discovery.discoverEndpoints();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = CoreSignalEndpointsDiscovery;
