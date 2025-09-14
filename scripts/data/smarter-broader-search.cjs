const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🧠 SMARTER BROADER SEARCH STRATEGY');
console.log('💡 Problem: Our criteria are too restrictive (0.1% match rate)');
console.log('✨ Solution: Find broader pool, then filter manually');
console.log('');

async function runSmarterSearch() {
  try {
    // STRATEGY 1: Salesforce Solution Architects (any experience)
    console.log('=== STRATEGY 1: SALESFORCE SOLUTION ARCHITECTS (50 results) ===');
    console.log('🎯 Get the best architects, then check their backgrounds manually');
    
    const architectsFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
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
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce solution architect"
            }
          ]
        }
      ]
    };

    const response1 = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=50`,
      { 
        dataset_id: DATASET_ID,
        filter: architectsFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Architects search created: ${response1.data.snapshot_id}`);

    // STRATEGY 2: Salesforce + Nonprofit (broader match)
    console.log('');
    console.log('=== STRATEGY 2: SALESFORCE + NONPROFIT EXPERIENCE (100 results) ===');
    console.log('🎯 Anyone with Salesforce AND nonprofit - we can find architects among them');
    
    const nonprofitFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce"
            }
          ]
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "experience",
              "operator": "includes",
              "value": "nonprofit"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "fundraising"
            },
            {
              "name": "current_company_name",
              "operator": "includes",
              "value": "nonprofit"
            }
          ]
        }
      ]
    };

    const response2 = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=100`,
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

    // STRATEGY 3: Salesforce + Fundraising (specific skill)
    console.log('');
    console.log('=== STRATEGY 3: SALESFORCE + FUNDRAISING (75 results) ===');
    console.log('🎯 Focus on fundraising expertise specifically');
    
    const fundraisingFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
        },
        {
          "operator": "or",
          "filters": [
            {
              "name": "position",
              "operator": "includes",
              "value": "salesforce"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce"
            }
          ]
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

    const response3 = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=75`,
      { 
        dataset_id: DATASET_ID,
        filter: fundraisingFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Fundraising search created: ${response3.data.snapshot_id}`);

    // Monitor all searches
    const searches = {
      'Solution Architects': { id: response1.data.snapshot_id, status: 'building', limit: 50 },
      'Salesforce + Nonprofit': { id: response2.data.snapshot_id, status: 'building', limit: 100 },
      'Salesforce + Fundraising': { id: response3.data.snapshot_id, status: 'building', limit: 75 }
    };

    console.log('');
    console.log('⏱️  Monitoring searches (estimated cost: ~$11.25)...');
    console.log('');

    // Check status every 10 seconds for up to 3 minutes
    for (let i = 0; i < 18; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      let allCompleted = true;
      
      for (const [strategy, search] of Object.entries(searches)) {
        if (search.status === 'building' || search.status === 'scheduled') {
          allCompleted = false;
          try {
            const statusResponse = await axios.get(
              `${BASE_URL}/datasets/snapshots/${search.id}`,
              { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            
            search.status = statusResponse.data.status;
            search.dataset_size = statusResponse.data.dataset_size;
            search.cost = statusResponse.data.cost;
            
            console.log(`📊 ${strategy}: ${search.status} (${search.dataset_size || 0}/${search.limit}) $${search.cost || '0.00'}`);
            
            if (search.status === 'ready' && search.dataset_size > 0) {
              console.log(`🎯 ${strategy} SUCCESS! Found ${search.dataset_size} candidates to review!`);
            }
          } catch (error) {
            console.log(`⚠️  Error checking ${strategy}: ${error.message}`);
          }
        }
      }
      
      if (allCompleted) break;
    }

    // Results summary
    console.log('');
    console.log('🎯 SMARTER SEARCH RESULTS:');
    console.log('==========================');
    
    let totalCandidates = 0;
    let totalCost = 0;
    
    for (const [strategy, search] of Object.entries(searches)) {
      console.log(`${strategy}:`);
      console.log(`  - Status: ${search.status}`);
      console.log(`  - Results: ${search.dataset_size || 0}/${search.limit}`);
      console.log(`  - Cost: $${search.cost || '0.00'}`);
      
      if (search.status === 'ready' && search.dataset_size > 0) {
        console.log(`  - Download: curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${search.id}/download?format=csv" -o ${strategy.replace(/[^a-zA-Z0-9]/g, '_')}.csv`);
        totalCandidates += search.dataset_size;
      }
      
      totalCost += parseFloat(search.cost || 0);
      console.log('');
    }
    
    console.log(`📈 TOTAL RESULTS: ${totalCandidates} candidates across ${Object.keys(searches).length} searches`);
    console.log(`💰 Total Cost: $${totalCost.toFixed(2)}`);
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. Download all 3 datasets');
    console.log('2. Manually review for perfect matches');
    console.log('3. Look for Solution Architects in the nonprofit dataset');
    console.log('4. Cross-reference candidates across datasets');
    console.log('5. Much higher success rate than ultra-restrictive search!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

runSmarterSearch(); 