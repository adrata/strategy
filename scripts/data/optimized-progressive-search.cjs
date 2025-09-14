const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🎯 OPTIMIZED PROGRESSIVE SEARCH STRATEGY');
console.log('📊 Based on Brightdata best practices for cost control');
console.log('');

async function runProgressiveSearch() {
  try {
    // STEP 1: Minimal test - verify API works (SMALL & CHEAP)
    console.log('=== STEP 1: MINIMAL TEST (5 records) ===');
    console.log('🧪 Testing basic "salesforce" search with tiny limit...');
    
    const minimalFilter = {
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

    const step1Response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=5`,
      { 
        dataset_id: DATASET_ID,
        filter: minimalFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Step 1 created: ${step1Response.data.snapshot_id} (max 5 results, ~$0.25)`);

    // STEP 2: Add nonprofit requirement (STILL SMALL)
    console.log('');
    console.log('=== STEP 2: ADD NONPROFIT FILTER (10 records) ===');
    console.log('🎯 Adding nonprofit requirement...');
    
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

    const step2Response = await axios.post(
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

    console.log(`✅ Step 2 created: ${step2Response.data.snapshot_id} (max 10 results, ~$0.50)`);

    // STEP 3: Add "solution architect" specificity (MODERATE SIZE)
    console.log('');
    console.log('=== STEP 3: SOLUTION ARCHITECT FOCUS (25 records) ===');
    console.log('🎯 Adding solution architect specificity...');
    
    const architectFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "in",
          "value": ["US", "CA"]
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce solution architect"
            },
            {
              "name": "position",
              "operator": "includes",
              "value": "solution architect salesforce"
            }
          ]
        },
        {
          "name": "experience",
          "operator": "includes",
          "value": "nonprofit"
        }
      ]
    };

    const step3Response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=25`,
      { 
        dataset_id: DATASET_ID,
        filter: architectFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Step 3 created: ${step3Response.data.snapshot_id} (max 25 results, ~$1.25)`);

    // STEP 4: Full requirements (IF previous steps worked)
    console.log('');
    console.log('=== STEP 4: FULL REQUIREMENTS (50 records MAX) ===');
    console.log('🎯 Adding fundraising requirement for complete match...');
    
    const fullFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "in",
          "value": ["US", "CA"]
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce solution architect"
            },
            {
              "name": "position",
              "operator": "includes",
              "value": "solution architect salesforce"
            }
          ]
        },
        {
          "name": "experience",
          "operator": "includes",
          "value": "nonprofit"
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "experience",
              "operator": "includes",
              "value": "fundraising"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "nonprofit cloud"
            },
            {
              "name": "about",
              "operator": "includes",
              "value": "fundraising"
            }
          ]
        }
      ]
    };

    const step4Response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=50`,
      { 
        dataset_id: DATASET_ID,
        filter: fullFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Step 4 created: ${step4Response.data.snapshot_id} (max 50 results, ~$2.50)`);

    // Monitor all searches
    const searches = {
      'Step 1 (Basic)': { id: step1Response.data.snapshot_id, status: 'building', limit: 5 },
      'Step 2 (+ Nonprofit)': { id: step2Response.data.snapshot_id, status: 'building', limit: 10 },
      'Step 3 (+ Solution Architect)': { id: step3Response.data.snapshot_id, status: 'building', limit: 25 },
      'Step 4 (Complete)': { id: step4Response.data.snapshot_id, status: 'building', limit: 50 }
    };

    console.log('');
    console.log('⏱️  Monitoring all searches (max 3 minutes)...');
    console.log('💰 Total estimated cost: <$5.00');
    console.log('');

    // Check status every 10 seconds for up to 3 minutes
    for (let i = 0; i < 18; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      for (const [step, search] of Object.entries(searches)) {
        if (search.status === 'building' || search.status === 'scheduled') {
          try {
            const statusResponse = await axios.get(
              `${BASE_URL}/datasets/snapshots/${search.id}`,
              { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            
            search.status = statusResponse.data.status;
            search.dataset_size = statusResponse.data.dataset_size;
            search.cost = statusResponse.data.cost;
            
            console.log(`📊 ${step}: ${search.status} (${search.dataset_size || 0}/${search.limit} results) $${search.cost || '0.00'}`);
            
            if (search.status === 'ready' && search.dataset_size > 0) {
              console.log(`🎯 ${step} SUCCESS! Found ${search.dataset_size} qualified candidates!`);
            }
          } catch (error) {
            console.log(`⚠️  Error checking ${step}: ${error.message}`);
          }
        }
      }
      
      // Check if all done
      const allDone = Object.values(searches).every(s => 
        s.status === 'ready' || s.status === 'failed'
      );
      if (allDone) break;
    }

    // Results analysis
    console.log('');
    console.log('🎯 PROGRESSIVE SEARCH RESULTS:');
    console.log('================================');
    
    let totalCost = 0;
    for (const [step, search] of Object.entries(searches)) {
      console.log(`${step}:`);
      console.log(`  - Status: ${search.status}`);
      console.log(`  - Results: ${search.dataset_size || 0}/${search.limit}`);
      console.log(`  - Cost: $${search.cost || '0.00'}`);
      console.log(`  - ID: ${search.id}`);
      
      if (search.status === 'ready' && search.dataset_size > 0) {
        console.log(`  - Download: curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${search.id}/download?format=json" -o ${step.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
      }
      
      totalCost += parseFloat(search.cost || 0);
      console.log('');
    }
    
    console.log(`💰 Total actual cost: $${totalCost.toFixed(2)}`);
    console.log('');
    console.log('📈 OPTIMIZATION INSIGHTS:');
    console.log('- Started with 5 records to validate approach');
    console.log('- Progressive filtering to find optimal balance');
    console.log('- Limited max records to control costs');
    console.log('- Total cost under $5 vs potentially hundreds without limits');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

runProgressiveSearch(); 