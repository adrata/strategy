const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalSimple() {
  console.log('🔍 TESTING CORESIGNAL SIMPLE');
  console.log('============================');
  
  console.log(`API Key: ${CORESIGNAL_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`Base URL: ${CORESIGNAL_BASE_URL}`);
  console.log('');

  // Test 1: Company collect endpoint (we know this works)
  console.log('🧪 Test 1: Company collect endpoint...');
  try {
    const companyId = '11523857'; // Match Group ID
    const response = await fetch(`${CORESIGNAL_BASE_URL}/company_multi_source/collect/${companyId}`, {
      method: 'GET',
      headers: {
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      }
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Company collect successful`);
      console.log(`   Company: ${data.company_name || 'Unknown'}`);
      console.log(`   Employees: ${data.employees_count || 'Unknown'}`);
      console.log(`   Industry: ${data.industry || 'Unknown'}`);
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Company collect error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Company collect error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try to get any employees at all
  console.log('🧪 Test 2: Try to get any employees...');
  try {
    const query = {
      query: {
        match_all: {}
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': CORESIGNAL_API_KEY,
        'Accept': 'application/json'
      },
      body: JSON.stringify(query)
    });

    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.total || 0} total employees in database`);
      
      if (data.hits && data.hits.length > 0) {
        console.log('📋 Sample employees:');
        data.hits.slice(0, 3).forEach((hit, index) => {
          const employee = hit._source;
          const name = employee?.full_name || 'Unknown';
          const title = employee?.active_experience_title || 'Unknown';
          const company = employee?.company_name || 'Unknown';
          console.log(`   ${index + 1}. ${name} - ${title} at ${company}`);
        });
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Employee search error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Employee search error: ${error.message}`);
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If our API key works for company data');
  console.log('2. If there are any employees in the database at all');
  console.log('3. If the issue is with our specific queries or the entire database');
}

testCoreSignalSimple().catch(console.error);