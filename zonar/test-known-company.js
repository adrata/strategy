#!/usr/bin/env node

/**
 * Test script to verify Coresignal API works with a known large company
 */

require('dotenv').config();

const apiKey = process.env.CORESIGNAL_API_KEY;

async function testKnownCompany(domain, companyName) {
  console.log(`\n🏢 Testing: ${companyName}`);
  console.log(`   Domain: ${domain}`);
  console.log('='.repeat(60));
  
  // Test 1: Direct enrichment
  console.log('\n1️⃣ Testing direct enrichment endpoint...');
  try {
    const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/enrich?website=${encodeURIComponent(domain)}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Success! Found company:');
      console.log(`      Name: ${data.name}`);
      console.log(`      Website: ${data.website}`);
      console.log(`      Domain: ${data.domain}`);
      console.log(`      LinkedIn: ${data.linkedin_url}`);
      console.log(`      Industry: ${data.industry}`);
      console.log(`      Employees: ${data.employee_count}`);
      console.log(`      ID: ${data.id}`);
    } else if (response.status === 404) {
      console.log('   ❌ Company not found (404)');
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
  
  // Test 2: exact_website filter
  console.log('\n2️⃣ Testing exact_website filter...');
  const query = {
    query: {
      bool: {
        must: [
          { term: { 'exact_website': domain } }
        ]
      }
    }
  };
  
  try {
    const response = await fetch('https://api.coresignal.com/cdapi/v2/company_multi_source/search/es_dsl?items_per_page=5', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      
      // Handle different response formats
      let companyIds = [];
      if (Array.isArray(data)) {
        companyIds = data;
      } else if (data.hits?.hits) {
        companyIds = data.hits.hits.map(hit => hit._id || hit._source?.id);
      } else if (data.hits) {
        companyIds = data.hits;
      }
      
      if (companyIds.length > 0) {
        console.log(`   ✅ Found ${companyIds.length} company(ies)`);
        console.log(`      IDs: ${companyIds.join(', ')}`);
      } else {
        console.log('   ❌ No companies found');
      }
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }
}

async function run() {
  console.log('🚀 Testing Coresignal API with Known Companies');
  console.log('='.repeat(60));
  
  // Test with well-known large companies
  await testKnownCompany('microsoft.com', 'Microsoft');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testKnownCompany('google.com', 'Google');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testKnownCompany('apple.com', 'Apple');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testKnownCompany('amazon.com', 'Amazon');
}

run().catch(console.error);

