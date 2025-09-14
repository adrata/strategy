#!/usr/bin/env node

/**
 * 🔬 SYSTEMATIC FIELD FILTERABILITY TEST
 * 
 * Test each field from the LinkedIn People metadata to find
 * which ones are actually filterable for recruitment searches.
 */

const https = require('https');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_ld7ll037kqy322v05";

// All fields from the user's metadata
const METADATA_FIELDS = [
  'timestamp',
  'linkedin_num_id', 
  'url',
  'name',
  'country_code',
  'city',
  'about',
  'followers',
  'connections',
  'position',
  'experience',
  'current_company',
  'current_company_name',
  'current_company_company_id',
  'posts',
  'activity',
  'education',
  'educations_details',
  'courses',
  'certifications',
  'honors_and_awards',
  'volunteer_experience',
  'organizations',
  'recommendations_count',
  'recommendations',
  'languages',
  'projects',
  'patents',
  'publications',
  'avatar',
  'default_avatar',
  'banner_image',
  'similar_profiles',
  'people_also_viewed',
  'memorialized_account',
  'input_url',
  'linkedin_id',
  'bio_links',
  'first_name',
  'last_name'
];

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

/**
 * Test if a specific field is filterable
 */
async function testFieldFilterability(fieldName, testValue = "test", operator = "includes") {
  console.log(`\n🧪 Testing: ${fieldName} (${operator})`);
  
  const filter = {
    "name": fieldName,
    "operator": operator,
    "value": testValue
  };
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
    records_limit: 5  // Minimal to reduce cost
  };

  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ ${fieldName}: FILTERABLE (snapshot: ${response.snapshot_id})`);
      return { field: fieldName, filterable: true, snapshot_id: response.snapshot_id, operator };
    } else {
      console.log(`❓ ${fieldName}: Unexpected response`);
      return { field: fieldName, filterable: false, error: 'No snapshot_id' };
    }
  } catch (error) {
    const errorMsg = error.message;
    if (errorMsg.includes('unsupported filters')) {
      console.log(`❌ ${fieldName}: NOT FILTERABLE`);
      return { field: fieldName, filterable: false, error: 'unsupported filter' };
    } else if (errorMsg.includes('no records found')) {
      console.log(`✅ ${fieldName}: FILTERABLE (no matches for test value)`);
      return { field: fieldName, filterable: true, error: 'no records found' };
    } else {
      console.log(`⚠️ ${fieldName}: ${errorMsg}`);
      return { field: fieldName, filterable: false, error: errorMsg };
    }
  }
}

/**
 * Test different operators for known filterable fields
 */
async function testOperators(fieldName) {
  const operators = [
    { op: "includes", value: "test" },
    { op: "=", value: "US" },
    { op: "is_not_null", value: null },
    { op: "!=", value: "" }
  ];
  
  console.log(`\n🔧 Testing operators for: ${fieldName}`);
  const results = [];
  
  for (const { op, value } of operators) {
    if (op === "is_not_null") {
      // Special case - no value needed
      const filter = { "name": fieldName, "operator": op };
      const payload = { dataset_id: LINKEDIN_PEOPLE_DATASET, filter, records_limit: 5 };
      
      try {
        const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        
        if (response.snapshot_id) {
          console.log(`✅ ${fieldName} ${op}: Works`);
          results.push({ operator: op, works: true });
        }
      } catch (error) {
        console.log(`❌ ${fieldName} ${op}: ${error.message}`);
        results.push({ operator: op, works: false });
      }
    } else {
      const result = await testFieldFilterability(fieldName, value, op);
      results.push({ operator: op, works: result.filterable });
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}

/**
 * Main systematic test function
 */
async function runSystematicTest() {
  console.log('🔬 SYSTEMATIC LINKEDIN PEOPLE FIELD FILTERABILITY TEST');
  console.log('======================================================');
  console.log(`Testing ${METADATA_FIELDS.length} fields for filterability...`);
  
  const results = [];
  const filterableFields = [];
  
  // Test each field with 'includes' operator first
  for (let i = 0; i < METADATA_FIELDS.length; i++) {
    const field = METADATA_FIELDS[i];
    console.log(`\n[${i + 1}/${METADATA_FIELDS.length}] Testing: ${field}`);
    
    const result = await testFieldFilterability(field, "salesforce", "includes");
    results.push(result);
    
    if (result.filterable) {
      filterableFields.push(field);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log('\n🎉 SYSTEMATIC TEST COMPLETE!');
  console.log('============================');
  console.log(`✅ Filterable fields found: ${filterableFields.length}`);
  console.log(`❌ Non-filterable fields: ${METADATA_FIELDS.length - filterableFields.length}`);
  
  if (filterableFields.length > 0) {
    console.log('\n🔍 FILTERABLE FIELDS:');
    filterableFields.forEach(field => console.log(`   ✅ ${field}`));
    
    // Test operators on the most promising fields for recruitment
    const recruitmentFields = filterableFields.filter(field => 
      ['position', 'about', 'experience', 'volunteer_experience', 'current_company_name'].includes(field)
    );
    
    if (recruitmentFields.length > 0) {
      console.log('\n🎯 TESTING OPERATORS ON RECRUITMENT-RELEVANT FIELDS:');
      for (const field of recruitmentFields) {
        await testOperators(field);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }
  
  // Save results
  const reportPath = require('path').join(require('os').homedir(), 'Desktop', `linkedin-field-test-${Date.now()}.json`);
  require('fs').writeFileSync(reportPath, JSON.stringify({
    totalFields: METADATA_FIELDS.length,
    filterableFields,
    allResults: results,
    timestamp: new Date().toISOString()
  }, null, 2));
  
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  return filterableFields;
}

// CLI Interface  
if (require.main === module) {
  const mode = process.argv[2] || 'systematic';
  
  if (mode === 'systematic') {
    runSystematicTest()
      .then(filterableFields => {
        console.log(`\n✅ Found ${filterableFields.length} filterable fields for recruitment!`);
        process.exit(0);
      })
      .catch(error => {
        console.error(`❌ Test failed: ${error.message}`);
        process.exit(1);
      });
  } else if (mode === 'quick') {
    // Quick test of most likely fields
    const likelyFields = ['name', 'position', 'about', 'city', 'country_code', 'first_name', 'last_name'];
    console.log('🚀 Quick test of most likely filterable fields...');
    
    Promise.all(likelyFields.map(field => testFieldFilterability(field)))
      .then(results => {
        const filterable = results.filter(r => r.filterable);
        console.log(`\n✅ Quick test complete: ${filterable.length}/${likelyFields.length} fields filterable`);
        filterable.forEach(r => console.log(`   ✅ ${r.field}`));
      })
      .catch(console.error);
  } else {
    console.log('Usage: node systematic-field-test.cjs [systematic|quick]');
    console.log('  systematic - Test all metadata fields (thorough but slow)');
    console.log('  quick      - Test most likely fields only');
  }
}

module.exports = { testFieldFilterability, runSystematicTest }; 