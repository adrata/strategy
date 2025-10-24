const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testCoreSignalDatabase() {
  console.log('🔍 TESTING CORESIGNAL DATABASE');
  console.log('==============================');
  
  // Test 1: Basic search to see if database has any employees
  console.log('🧪 Test 1: Basic database search...');
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

    const data = await response.json();
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      console.log(`✅ Database has ${data.total || 0} total employees`);
      
      if (data.hits && data.hits.length > 0) {
        console.log('📋 Sample companies from first 5 employees:');
        data.hits.slice(0, 5).forEach((hit, index) => {
          const employee = hit._source;
          const company = employee?.company_name || 'Unknown';
          const name = employee?.full_name || 'Unknown';
          const title = employee?.active_experience_title || 'Unknown';
          console.log(`   ${index + 1}. ${name} - ${title} at ${company}`);
        });
      }
    } else {
      console.log(`❌ Error: ${data.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Search for specific companies we know work
  console.log('🧪 Test 2: Testing known working companies...');
  const knownCompanies = [
    { name: 'First Premier Bank', id: '7578901' },
    { name: 'Zuora', id: '10782378' }
  ];

  for (const company of knownCompanies) {
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                term: {
                  active_experience_company_id: company.id
                }
              }
            ]
          }
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

      const data = await response.json();
      console.log(`   ${company.name} (ID: ${company.id}): ${data.total || 0} employees`);
    } catch (error) {
      console.log(`   ${company.name}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 3: Search for Match Group by name variations
  console.log('🧪 Test 3: Searching for Match Group by name...');
  const nameVariations = [
    'Match Group',
    'Match Group Inc',
    'Match Group, Inc.',
    'match group',
    'MATCH GROUP'
  ];

  for (const name of nameVariations) {
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                match: {
                  company_name: name
                }
              }
            ]
          }
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

      const data = await response.json();
      console.log(`   "${name}": ${data.total || 0} employees`);
      
      if (data.hits && data.hits.length > 0) {
        console.log(`     Sample: ${data.hits[0]._source?.full_name || 'Unknown'} - ${data.hits[0]._source?.active_experience_title || 'Unknown'}`);
      }
    } catch (error) {
      console.log(`   "${name}": Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 4: Search for employees with "Match" in company name
  console.log('🧪 Test 4: Searching for companies with "Match" in name...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              wildcard: {
                company_name: "*Match*"
              }
            }
          ]
        }
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

    const data = await response.json();
    console.log(`   Companies with "Match" in name: ${data.total || 0} employees`);
    
    if (data.hits && data.hits.length > 0) {
      console.log('   Sample companies:');
      data.hits.slice(0, 3).forEach((hit, index) => {
        const employee = hit._source;
        const company = employee?.company_name || 'Unknown';
        const name = employee?.full_name || 'Unknown';
        console.log(`     ${index + 1}. ${name} at ${company}`);
      });
    }
  } catch (error) {
    console.log(`   Wildcard search: Error - ${error.message}`);
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If the CoreSignal employee database has any data at all');
  console.log('2. If our known working companies still work');
  console.log('3. If Match Group employees exist under different company names');
  console.log('4. If there are any Match-related companies in the database');
}

testCoreSignalDatabase().catch(console.error);
