#!/usr/bin/env node

/**
 * Test script to see the full response from direct enrichment endpoint
 */

require('dotenv').config();

const apiKey = process.env.CORESIGNAL_API_KEY;

async function testDirectEnrichment(domain) {
  console.log(`\n🔍 Testing direct enrichment for: ${domain}`);
  console.log('='.repeat(60));
  
  try {
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n📄 Full Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log(`❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

async function run() {
  await testDirectEnrichment('microsoft.com');
}

run().catch(console.error);

