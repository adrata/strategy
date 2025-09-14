#!/usr/bin/env node

/**
 * 🎯 Test LinkedIn People Dataset with Proper Syntax
 * Using the exact format from user's examples
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

async function testPeopleDatasetFields() {
  console.log('🎯 Testing LinkedIn People Dataset with Proper Filter Syntax');
  console.log('==========================================================');
  
  // Test individual fields using exact user syntax
  const fieldsToTest = [
    'position',
    'experience', 
    'about',
    'volunteer_experience',
    'current_company_name',
    'education',
    'certifications',
    'organizations'
  ];
  
  const filterableFields = [];
  
  for (const field of fieldsToTest) {
    console.log(`\n🧪 Testing field: ${field}`);
    
    // Use exact syntax from user's examples
    const filter = {
      "operator": "and",
      "filters": [
        {
          "name": field,
          "value": "salesforce",
          "operator": "includes"
        }
      ]
    };
    
    const payload = {
      "dataset_id": LINKEDIN_PEOPLE_DATASET,
      "filter": filter
    };
    
    console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
    
    try {
      const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.snapshot_id) {
        console.log(`✅ ${field}: FILTERABLE! (snapshot: ${response.snapshot_id})`);
        filterableFields.push(field);
      } else {
        console.log(`❓ ${field}: Unexpected response`);
      }
    } catch (error) {
      const errorMsg = error.message;
      if (errorMsg.includes('unsupported filters')) {
        console.log(`❌ ${field}: NOT FILTERABLE`);
      } else if (errorMsg.includes('no records found')) {
        console.log(`✅ ${field}: FILTERABLE (no matches for "salesforce")`);
        filterableFields.push(field);
      } else {
        console.log(`⚠️ ${field}: ${errorMsg}`);
      }
    }
    
    // Delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n🎉 RESULTS FOR LINKEDIN PEOPLE DATASET:');
  console.log('======================================');
  console.log(`✅ Filterable fields: ${filterableFields.length}`);
  
  if (filterableFields.length > 0) {
    console.log('\n🔍 FILTERABLE FIELDS:');
    filterableFields.forEach(field => console.log(`   ✅ ${field}`));
    
    // If we found recruitment-relevant fields, test combined filters
    if (filterableFields.some(f => ['position', 'experience', 'about'].includes(f))) {
      console.log('\n🎯 Testing combined filters for Salesforce Solution Architect search...');
      await testCombinedFilters(filterableFields);
    }
  } else {
    console.log('❌ No additional filterable fields found beyond name and url');
  }
  
  return filterableFields;
}

async function testCombinedFilters(filterableFields) {
  // Test your exact requirements: Salesforce Solution Architect + nonprofit + fundraising
  const relevantFields = filterableFields.filter(f => 
    ['position', 'experience', 'about', 'volunteer_experience'].includes(f)
  );
  
  if (relevantFields.length === 0) {
    console.log('❌ No relevant fields for recruitment search');
    return;
  }
  
  console.log('\n🚀 Testing Salesforce Solution Architect search...');
  
  // Create filter using available fields
  const filters = [];
  
  // Add Salesforce + Solution + Architect search to available fields
  relevantFields.forEach(field => {
    if (field === 'position') {
      filters.push(
        {"name": field, "value": "salesforce", "operator": "includes"},
        {"name": field, "value": "solution", "operator": "includes"},
        {"name": field, "value": "architect", "operator": "includes"}
      );
    } else {
      filters.push({"name": field, "value": "salesforce", "operator": "includes"});
    }
  });
  
  const combinedFilter = {
    "operator": "and",
    "filters": filters.slice(0, 6) // Limit to avoid too complex filter
  };
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": combinedFilter,
    "records_limit": 50
  };
  
  console.log(`🔍 Combined filter: ${JSON.stringify(combinedFilter, null, 2)}`);
  
  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Combined search successful! Snapshot: ${response.snapshot_id}`);
      console.log('🎯 This can be used for your Salesforce Solution Architect recruitment');
    }
  } catch (error) {
    console.log(`❌ Combined search failed: ${error.message}`);
  }
}

if (require.main === module) {
  testPeopleDatasetFields()
    .then(filterable => {
      console.log(`\n✅ Found ${filterable.length} filterable fields in LinkedIn People dataset!`);
      if (filterable.length > 0) {
        console.log('🎯 Ready to create recruitment filters!');
      }
    })
    .catch(error => {
      console.error(`❌ Test failed: ${error.message}`);
    });
} 