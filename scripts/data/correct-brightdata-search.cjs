const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0'; // LinkedIn People dataset
const BASE_URL = 'https://api.brightdata.com'; // Correct base URL

console.log('🚀 CloudCaddie CORRECT Salesforce + Nonprofit Search');
console.log('📊 Using CORRECT Brightdata API format');
console.log('');

async function createCorrectSearch() {
  try {
    console.log('=== STRATEGY 1: COMPREHENSIVE SEARCH (CORRECT FORMAT) ===');
    console.log('🔍 Using correct filter syntax from Brightdata docs...');
    
    // CORRECT filter format from Brightdata documentation
    const comprehensiveFilter = {
      "operator": "and",
      "filters": [
        // Geographic filter - US/Canada
        {
          "name": "country_code",
          "operator": "in",
          "value": ["US", "CA"]
        },
        // Salesforce Solution Architect in position OR experience
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
              "name": "position",
              "operator": "includes", 
              "value": "salesforce architect"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "salesforce solution architect"
            }
          ]
        },
        // Nonprofit experience (work history)
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
              "value": "non-profit"
            },
            {
              "name": "experience",
              "operator": "includes",
              "value": "foundation"
            },
            {
              "name": "current_company_name",
              "operator": "includes",
              "value": "nonprofit"
            }
          ]
        },
        // Fundraising/Cloud experience
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
              "name": "experience",
              "operator": "includes",
              "value": "salesforce.org"
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

    console.log('📤 Creating comprehensive search...');
    const comprehensiveResponse = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=100`,
      { 
        dataset_id: DATASET_ID,
        filter: comprehensiveFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const comprehensiveId = comprehensiveResponse.data.snapshot_id;
    console.log(`✅ Comprehensive search created: ${comprehensiveId}`);

    // Strategy 2: Simplified search
    console.log('');
    console.log('=== STRATEGY 2: SIMPLIFIED SEARCH ===');
    
    const simplifiedFilter = {
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
            }
          ]
        }
      ]
    };

    console.log('📤 Creating simplified search...');
    const simplifiedResponse = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=50`,
      { 
        dataset_id: DATASET_ID,
        filter: simplifiedFilter 
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const simplifiedId = simplifiedResponse.data.snapshot_id;
    console.log(`✅ Simplified search created: ${simplifiedId}`);

    // Monitor searches
    console.log('');
    console.log('⏱️  Monitoring search progress...');
    
    const searches = {
      comprehensive: { id: comprehensiveId, status: 'building' },
      simplified: { id: simplifiedId, status: 'building' }
    };

    // Check status every 15 seconds for up to 5 minutes
    for (let i = 0; i < 20; i++) {
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      for (const [strategy, search] of Object.entries(searches)) {
        if (search.status === 'building' || search.status === 'scheduled') {
          try {
            const statusResponse = await axios.get(
              `${BASE_URL}/datasets/snapshots/${search.id}`,
              {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
              }
            );
            
            search.status = statusResponse.data.status;
            search.dataset_size = statusResponse.data.dataset_size;
            search.cost = statusResponse.data.cost;
            
            console.log(`📊 ${strategy}: ${search.status} (${search.dataset_size || 0} results) ${search.cost ? `$${search.cost}` : ''}`);
            
            if (search.status === 'ready' && search.dataset_size > 0) {
              console.log(`🎯 SUCCESS! ${strategy} found ${search.dataset_size} qualified candidates!`);
            } else if (search.status === 'failed') {
              console.log(`❌ ${strategy} search failed`);
            }
          } catch (error) {
            console.log(`⚠️  Error checking ${strategy}: ${error.message}`);
          }
        }
      }
      
      // Check if all done
      const allDone = Object.values(searches).every(s => 
        s.status === 'ready' || s.status === 'failed'
      );
      if (allDone) break;
    }

    // Final results
    console.log('');
    console.log('🎯 FINAL RESULTS SUMMARY:');
    console.log('========================');
    
    for (const [strategy, search] of Object.entries(searches)) {
      console.log(`${strategy.toUpperCase()}:`);
      console.log(`  - Snapshot ID: ${search.id}`);
      console.log(`  - Status: ${search.status}`);
      console.log(`  - Results: ${search.dataset_size || 0} candidates`);
      console.log(`  - Cost: ${search.cost ? `$${search.cost}` : 'Calculating...'}`);
      
      if (search.status === 'ready' && search.dataset_size > 0) {
        console.log(`  - Download: curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${search.id}/download?format=json" -o ${strategy}-salesforce-nonprofit.json`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the corrected search
createCorrectSearch(); 