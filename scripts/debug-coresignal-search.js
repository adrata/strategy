#!/usr/bin/env node

/**
 * 🔍 DEBUG CORESIGNAL SEARCH
 * 
 * Simple test to debug why CoreSignal search isn't working
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env' });

async function debugSearch() {
  console.log('🔍 DEBUGGING CORESIGNAL SEARCH');
  console.log('==============================');
  
  // Test with First Premier Bank (we know this company ID works)
  const companyName = 'First Premier Bank';
  const companyId = '7578901';
  
  console.log(`🏢 Testing with: ${companyName} (ID: ${companyId})`);
  console.log(`🔑 API Key available: ${process.env.CORESIGNAL_API_KEY ? 'YES' : 'NO'}`);
  console.log('');
  
  // Test 1: Company collect endpoint (we know this works)
  console.log('📊 Test 1: Company collect endpoint');
  try {
    const collectUrl = `https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`;
    console.log(`   URL: ${collectUrl}`);
    
    const collectResponse = await fetch(collectUrl, {
      headers: { 'apikey': process.env.CORESIGNAL_API_KEY }
    });
    
    console.log(`   Status: ${collectResponse.status}`);
    
    if (collectResponse.ok) {
      const collectData = await collectResponse.json();
      console.log(`   ✅ Company collect works: ${collectData.key_executives?.length || 0} executives`);
    } else {
      console.log(`   ❌ Company collect failed: ${collectResponse.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Company collect error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 2: Employee search endpoint
  console.log('🔍 Test 2: Employee search endpoint');
  try {
    const searchUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl';
    console.log(`   URL: ${searchUrl}`);
    
    const searchQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_name: companyName
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(searchQuery, null, 2)}`);
    
    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(searchQuery)
    });
    
    console.log(`   Status: ${searchResponse.status}`);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log(`   ✅ Employee search works: ${searchData.hits?.hits?.length || 0} employees`);
      if (searchData.hits?.hits?.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(searchData.hits.hits[0], null, 2)}`);
      }
    } else {
      const errorText = await searchResponse.text();
      console.log(`   ❌ Employee search failed: ${searchResponse.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Employee search error: ${error.message}`);
  }
  
  console.log('');
  
  // Test 3: Employee search preview endpoint
  console.log('👀 Test 3: Employee search preview endpoint');
  try {
    const previewUrl = 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl/preview';
    console.log(`   URL: ${previewUrl}`);
    
    const previewQuery = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_name: companyName
              }
            }
          ]
        }
      }
    };
    
    console.log(`   Query: ${JSON.stringify(previewQuery, null, 2)}`);
    
    const previewResponse = await fetch(previewUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(previewQuery)
    });
    
    console.log(`   Status: ${previewResponse.status}`);
    
    if (previewResponse.ok) {
      const previewData = await previewResponse.json();
      console.log(`   ✅ Employee search preview works: ${previewData.length || 0} employees`);
      if (previewData.length > 0) {
        console.log(`   📋 First employee: ${JSON.stringify(previewData[0], null, 2)}`);
      }
    } else {
      const errorText = await previewResponse.text();
      console.log(`   ❌ Employee search preview failed: ${previewResponse.statusText}`);
      console.log(`   Error details: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Employee search preview error: ${error.message}`);
  }
  
  console.log('');
  console.log('🎯 DEBUG COMPLETE');
}

// Run the debug
debugSearch().catch(console.error);
