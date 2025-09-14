#!/usr/bin/env node

/**
 * 🔍 Test more fields in LinkedIn People dataset
 */

const https = require('https');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_ld7ll037kqy322v05";

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`${res.statusCode}: ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testField(fieldName, testValue = "test", operator = "includes") {
  console.log(`\n🧪 Testing: ${fieldName}`);
  
  const filter = {
    "name": fieldName,
    "operator": operator,
    "value": testValue
  };
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
    records_limit: 5
  };

  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ ${fieldName}: FILTERABLE`);
      return true;
    } else {
      console.log(`❓ ${fieldName}: Unexpected response`);
      return false;
    }
  } catch (error) {
    const errorMsg = error.message;
    if (errorMsg.includes('unsupported filters')) {
      console.log(`❌ ${fieldName}: NOT FILTERABLE`);
      return false;
    } else if (errorMsg.includes('no records found')) {
      console.log(`✅ ${fieldName}: FILTERABLE (no matches)`);
      return true;
    } else {
      console.log(`⚠️ ${fieldName}: ${errorMsg}`);
      return false;
    }
  }
}

async function testMoreFields() {
  console.log('🔍 Testing additional fields in LinkedIn People dataset...');
  
  // Test more fields that might be filterable
  const fieldsToTest = [
    'url',
    'linkedin_id', 
    'current_company_name',
    'followers',
    'connections',
    'experience',
    'education',
    'volunteer_experience',
    'organizations',
    'languages',
    'certifications'
  ];
  
  const filterable = [];
  
  for (const field of fieldsToTest) {
    const isFilterable = await testField(field, "salesforce");
    if (isFilterable) {
      filterable.push(field);
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 RESULTS:');
  console.log(`✅ Filterable fields: ${filterable.length}`);
  if (filterable.length > 0) {
    filterable.forEach(field => console.log(`   ✅ ${field}`));
  }
  
  return filterable;
}

if (require.main === module) {
  testMoreFields()
    .then(filterable => {
      console.log(`\n🎯 Found ${filterable.length} additional filterable fields!`);
    })
    .catch(console.error);
} 