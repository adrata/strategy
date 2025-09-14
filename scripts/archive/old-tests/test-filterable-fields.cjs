#!/usr/bin/env node

/**
 * 🧪 TEST FILTERABLE FIELDS
 * Find which fields can actually be used for filtering
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
          console.log(`📡 Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            console.log(`❌ Error Response: ${data}`);
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
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

async function testFilter(fieldName, testValue = "test") {
  console.log(`\n🧪 Testing field: ${fieldName}`);
  
  const filter = {
    "name": fieldName,
    "operator": "includes",
    "value": testValue
  };
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
  };

  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ ${fieldName} - FILTERABLE (snapshot: ${response.snapshot_id})`);
      return true;
    } else {
      console.log(`❌ ${fieldName} - FAILED: ${JSON.stringify(response)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${fieldName} - ERROR: ${error.message}`);
    return false;
  }
}

async function findFilterableFields() {
  console.log('🔍 TESTING WHICH FIELDS CAN BE FILTERED');
  console.log('========================================');
  
  // Test basic fields that should exist
  const fieldsToTest = [
    'id',
    'name', 
    'city',
    'country_code',
    'position',
    'about',
    'current_company',
    'link',  // Maybe there's a main LinkedIn URL field?
    'url',   // Alternative name
    'profile_url',
    'linkedin_url'
  ];
  
  const filterableFields = [];
  
  for (const field of fieldsToTest) {
    const isFilterable = await testFilter(field);
    if (isFilterable) {
      filterableFields.push(field);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎉 FILTERABLE FIELDS FOUND:');
  console.log('============================');
  filterableFields.forEach(field => console.log(`✅ ${field}`));
  
  if (filterableFields.length === 0) {
    console.log('❌ No filterable fields found - dataset may not support filtering');
  }
  
  return filterableFields;
}

if (require.main === module) {
  findFilterableFields()
    .then(fields => {
      console.log(`\n📊 Total filterable fields: ${fields.length}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Test failed: ${error.message}`);
      process.exit(1);
    });
} 