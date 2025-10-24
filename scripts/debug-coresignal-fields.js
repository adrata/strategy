const fetch = require('node-fetch');
require('dotenv').config();

const CORESIGNAL_API_KEY = process.env.CORESIGNAL_API_KEY;
const CORESIGNAL_BASE_URL = 'https://api.coresignal.com/cdapi/v2';

async function debugCoreSignalFields() {
  console.log('🔍 DEBUGGING CORESIGNAL FIELDS');
  console.log('==============================');
  
  // Test 1: Get any employees to see field structure
  console.log('🧪 Test 1: Get any employees to see field structure...');
  try {
    const query = {
      query: {
        match_all: {}
      },
      size: 1
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
        const employee = data.hits[0]._source;
        console.log('📋 Sample employee fields:');
        Object.keys(employee).forEach(key => {
          const value = employee[key];
          const displayValue = typeof value === 'string' ? value.substring(0, 50) : value;
          console.log(`   ${key}: ${displayValue}`);
        });
      } else {
        console.log('❌ No employees found in database');
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log(`❌ Error: ${errorData.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');

  // Test 2: Try to find any employees with company-related fields
  console.log('🧪 Test 2: Search for employees with company fields...');
  
  const companyFields = [
    'company_id',
    'active_experience_company_id',
    'current_company_id',
    'active_company_id',
    'company_name',
    'active_experience_company_name',
    'current_company_name'
  ];

  for (const field of companyFields) {
    try {
      const query = {
        query: {
          exists: {
            field: field
          }
        },
        size: 1
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

      if (response.ok) {
        const data = await response.json();
        console.log(`   ${field}: ${data.total || 0} employees`);
        
        if (data.hits && data.hits.length > 0) {
          const employee = data.hits[0]._source;
          const value = employee[field];
          console.log(`     Sample value: ${value}`);
        }
      } else {
        console.log(`   ${field}: Error - ${response.status}`);
      }
    } catch (error) {
      console.log(`   ${field}: Error - ${error.message}`);
    }
  }

  console.log('');

  // Test 3: Try to find employees by searching for common company names
  console.log('🧪 Test 3: Search for employees by common company names...');
  
  const commonCompanies = [
    'Microsoft',
    'Google',
    'Apple',
    'Amazon',
    'Facebook',
    'Meta',
    'Tesla',
    'Netflix',
    'Uber',
    'Airbnb'
  ];

  for (const company of commonCompanies) {
    try {
      const query = {
        query: {
          match: {
            company_name: company
          }
        },
        size: 1
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

      if (response.ok) {
        const data = await response.json();
        if (data.total > 0) {
          console.log(`   ${company}: ${data.total} employees`);
          
          if (data.hits && data.hits.length > 0) {
            const employee = data.hits[0]._source;
            const companyName = employee.company_name;
            const companyId = employee.active_experience_company_id || employee.company_id;
            console.log(`     Sample: ${employee.full_name} at ${companyName} (ID: ${companyId})`);
          }
        }
      }
    } catch (error) {
      // Ignore errors for this test
    }
  }

  console.log('');
  console.log('🎯 SUMMARY:');
  console.log('===========');
  console.log('This test will help us understand:');
  console.log('1. If there are any employees in the database at all');
  console.log('2. What the actual field names are for company data');
  console.log('3. If we can find employees from any companies');
  console.log('4. What the data structure looks like');
}

debugCoreSignalFields().catch(console.error);
