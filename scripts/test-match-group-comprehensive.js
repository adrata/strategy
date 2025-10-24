const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function testMatchGroupComprehensive() {
  console.log('🔍 COMPREHENSIVE MATCH GROUP TESTING');
  console.log('=====================================');
  
  const companyId = '24972212';
  const companyName = 'Match Group';
  
  console.log(`Company: ${companyName}`);
  console.log(`Company ID: ${companyId}`);
  console.log('');

  // Test 1: Try different field names for company ID
  console.log('🧪 Test 1: Different company ID field names...');
  const fieldTests = [
    { field: 'company_id', description: 'company_id field' },
    { field: 'active_experience_company_id', description: 'active_experience_company_id field' },
    { field: 'current_company_id', description: 'current_company_id field' },
    { field: 'active_company_id', description: 'active_company_id field' }
  ];

  for (const test of fieldTests) {
    try {
      const query = {
        query: {
          bool: {
            must: [
              {
                term: {
                  [test.field]: companyId
                }
              }
            ]
          }
        }
      };

      const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      const data = await response.json();
      console.log(`   ${test.description}: ${data.total || 0} employees`);
    } catch (error) {
      console.log(`   ${test.description}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 2: Try company name variations
  console.log('🧪 Test 2: Company name variations...');
  const nameVariations = [
    'Match Group',
    'Match Group Inc',
    'Match Group, Inc.',
    'match group',
    'MATCH GROUP',
    'MatchGroup',
    'matchgroup'
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
          'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      const data = await response.json();
      console.log(`   "${name}": ${data.total || 0} employees`);
    } catch (error) {
      console.log(`   "${name}": Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 3: Try website domain search
  console.log('🧪 Test 3: Website domain search...');
  try {
    const query = {
      query: {
        bool: {
          must: [
            {
              match: {
                company_website: 'mtch.com'
              }
            }
          ]
        }
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    console.log(`   Website "mtch.com": ${data.total || 0} employees`);
  } catch (error) {
    console.log(`   Website "mtch.com": Error - ${error.message}`);
  }

  console.log('');

  // Test 4: Try broad search for any employees and see if we can find Match Group employees
  console.log('🧪 Test 4: Broad search to find any Match Group employees...');
  try {
    const query = {
      query: {
        match_all: {}
      }
    };

    const response = await fetch(`${CORESIGNAL_BASE_URL}/employee_multi_source/search/es_dsl/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CORESIGNAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(query)
    });

    const data = await response.json();
    console.log(`   Total employees in database: ${data.total || 0}`);
    
    if (data.hits && data.hits.length > 0) {
      console.log('   Sample companies from first 5 employees:');
      data.hits.slice(0, 5).forEach((hit, index) => {
        const company = hit._source?.company_name || 'Unknown';
        console.log(`     ${index + 1}. ${company}`);
      });
    }
  } catch (error) {
    console.log(`   Broad search: Error - ${error.message}`);
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('If all tests return 0 employees, this suggests:');
  console.log('1. Match Group employees are not in the CoreSignal employee database');
  console.log('2. The company ID format is different than expected');
  console.log('3. There might be a data sync issue between company and employee databases');
  console.log('4. We may need to use a different API endpoint or approach');
}

testMatchGroupComprehensive().catch(console.error);
