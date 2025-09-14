#!/usr/bin/env node

/**
 * 🎯 TEST CORRECT LINKEDIN PEOPLE DATASET
 * 
 * Testing gd_l1viktl72bvl7bjuj0 (LinkedIn people profiles - 115M records)
 * to find filterable fields for Salesforce Solution Architect recruitment
 */

const https = require('https');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_l1viktl72bvl7bjuj0"; // Correct people dataset with 115M records

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

async function testPeopleDatasetCorrect() {
  console.log('🎯 TESTING CORRECT LINKEDIN PEOPLE DATASET');
  console.log('==========================================');
  console.log(`Dataset: ${LINKEDIN_PEOPLE_DATASET} (LinkedIn people profiles - 115M records)`);
  
  // Test fields using your exact curl syntax
  const recruitmentFields = [
    'position',
    'experience', 
    'about',
    'volunteer_experience',
    'current_company_name',
    'education',
    'certifications',
    'organizations',
    'name',
    'first_name',
    'last_name'
  ];
  
  const filterableFields = [];
  
  for (const field of recruitmentFields) {
    console.log(`\n🧪 Testing field: ${field}`);
    
    // Use exact syntax from your curl examples
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
      "filter": filter,
      "records_limit": 10
    };
    
    console.log(`🔍 Testing: ${field} includes "salesforce"`);
    
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
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n🎉 RESULTS FOR LINKEDIN PEOPLE DATASET:');
  console.log('======================================');
  console.log(`✅ Filterable fields: ${filterableFields.length}`);
  
  if (filterableFields.length > 0) {
    console.log('\n🔍 FILTERABLE FIELDS:');
    filterableFields.forEach(field => console.log(`   ✅ ${field}`));
    
    // Test your exact Salesforce Solution Architect requirements
    if (filterableFields.includes('position')) {
      console.log('\n🎯 Testing Salesforce Solution Architect search...');
      await testSalesforceArchitectSearch(filterableFields);
    }
  } else {
    console.log('❌ No filterable fields found in people dataset');
  }
  
  return filterableFields;
}

async function testSalesforceArchitectSearch(filterableFields) {
  console.log('\n🚀 TESTING YOUR EXACT REQUIREMENTS:');
  console.log('===================================');
  console.log('Target: "Salesforce Solution Architect" + "nonprofit" + "fundraising"');
  
  // Create filter using your requirements
  const salesforceFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "value": "salesforce",
        "operator": "includes"
      },
      {
        "name": "position", 
        "value": "solution",
        "operator": "includes"
      },
      {
        "name": "position",
        "value": "architect",
        "operator": "includes"
      }
    ]
  };
  
  console.log('\n🔍 Testing: position contains "salesforce" AND "solution" AND "architect"');
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": salesforceFilter,
    "records_limit": 20
  };
  
  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Salesforce Solution Architect search successful!`);
      console.log(`📊 Snapshot ID: ${response.snapshot_id}`);
      console.log('🎯 This filter works for your recruitment needs!');
      
      // Test adding nonprofit/fundraising filters
      if (filterableFields.some(f => ['about', 'experience', 'volunteer_experience'].includes(f))) {
        console.log('\n🔄 Testing with nonprofit/fundraising filters...');
        await testWithNonprofitFilters(filterableFields);
      }
      
    } else {
      console.log('❓ Unexpected response for Salesforce search');
    }
  } catch (error) {
    console.log(`❌ Salesforce search failed: ${error.message}`);
  }
}

async function testWithNonprofitFilters(filterableFields) {
  // Add nonprofit and fundraising to the search
  const filters = [
    {
      "name": "position",
      "value": "salesforce",
      "operator": "includes"
    },
    {
      "name": "position",
      "value": "architect", 
      "operator": "includes"
    }
  ];
  
  // Add nonprofit search to available fields
  if (filterableFields.includes('volunteer_experience')) {
    filters.push({
      "name": "volunteer_experience",
      "value": "nonprofit",
      "operator": "includes"
    });
  }
  
  if (filterableFields.includes('about')) {
    filters.push({
      "name": "about",
      "value": "fundraising",
      "operator": "includes"
    });
  }
  
  const comprehensiveFilter = {
    "operator": "and",
    "filters": filters
  };
  
  console.log(`🔍 Testing comprehensive search with ${filters.length} filters...`);
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": comprehensiveFilter,
    "records_limit": 50
  };
  
  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Comprehensive search successful!`);
      console.log(`📊 Snapshot ID: ${response.snapshot_id}`);
      console.log('🎯 Perfect for finding Salesforce Solution Architects with nonprofit/fundraising experience!');
    }
  } catch (error) {
    console.log(`❌ Comprehensive search failed: ${error.message}`);
  }
}

if (require.main === module) {
  testPeopleDatasetCorrect()
    .then(filterable => {
      console.log(`\n🎯 Found ${filterable.length} filterable fields in LinkedIn People dataset!`);
      if (filterable.length > 0) {
        console.log('🚀 Ready to create your Salesforce Solution Architect recruitment CSV!');
      }
    })
    .catch(error => {
      console.error(`❌ Test failed: ${error.message}`);
    });
} 