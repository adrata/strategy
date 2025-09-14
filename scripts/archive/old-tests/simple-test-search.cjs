const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🧪 SIMPLE TEST: Validate our API format works');
console.log('');

async function runSimpleTest() {
  try {
    // Test 1: Very simple "salesforce" search
    console.log('=== TEST 1: Simple "salesforce" search ===');
    const simpleFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "in", 
          "value": ["US", "CA"]
        },
        {
          "name": "position",
          "operator": "includes",
          "value": "salesforce"
        }
      ]
    };

    const response1 = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=10`,
      { 
        dataset_id: DATASET_ID,
        filter: simpleFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Simple search created: ${response1.data.snapshot_id}`);

    // Test 2: Add "nonprofit" requirement  
    console.log('');
    console.log('=== TEST 2: "salesforce" + "nonprofit" ===');
    const nonprofitFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code", 
          "operator": "in",
          "value": ["US", "CA"]
        },
        {
          "name": "position",
          "operator": "includes",
          "value": "salesforce"
        },
        {
          "name": "experience", 
          "operator": "includes",
          "value": "nonprofit"
        }
      ]
    };

    const response2 = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=10`,
      { 
        dataset_id: DATASET_ID,
        filter: nonprofitFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Nonprofit search created: ${response2.data.snapshot_id}`);

    // Monitor both tests
    const tests = {
      simple: { id: response1.data.snapshot_id, status: 'building' },
      nonprofit: { id: response2.data.snapshot_id, status: 'building' }
    };

    console.log('');
    console.log('⏱️  Monitoring test results...');

    for (let i = 0; i < 12; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      for (const [test, search] of Object.entries(tests)) {
        if (search.status === 'building' || search.status === 'scheduled') {
          try {
            const statusResponse = await axios.get(
              `${BASE_URL}/datasets/snapshots/${search.id}`,
              { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            
            search.status = statusResponse.data.status;
            search.dataset_size = statusResponse.data.dataset_size;
            
            console.log(`📊 ${test}: ${search.status} (${search.dataset_size || 0} results)`);
            
            if (search.status === 'ready') {
              if (search.dataset_size > 0) {
                console.log(`🎯 ${test.toUpperCase()} WORKS! Found ${search.dataset_size} results`);
              } else {
                console.log(`⚠️  ${test} completed but 0 results (may be too specific)`);
              }
            }
          } catch (error) {
            console.log(`❌ Error checking ${test}: ${error.message}`);
          }
        }
      }
      
      if (Object.values(tests).every(s => s.status === 'ready' || s.status === 'failed')) {
        break;
      }
    }

    console.log('');
    console.log('🧪 TEST RESULTS SUMMARY:');
    console.log('========================');
    for (const [test, search] of Object.entries(tests)) {
      console.log(`${test.toUpperCase()}:`);
      console.log(`  Status: ${search.status}`);
      console.log(`  Results: ${search.dataset_size || 0}`);
      console.log(`  Interpretation: ${search.dataset_size > 0 ? '✅ Search format works!' : '⚠️ May be too specific'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

runSimpleTest(); 