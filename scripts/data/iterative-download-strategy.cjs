const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🔄 ITERATIVE DOWNLOAD & FILTER STRATEGY');
console.log('======================================');
console.log('💡 Smart Approach: Download broad → Filter local → Repeat until 500 candidates');
console.log('⚡ Avoids 5-minute timeout by keeping searches simple');
console.log('');

const searches = [
  {
    name: 'US Solution Architects',
    description: 'Any solution architect in the US',
    records: 1000,
    filter: {
      "operator": "and",
      "filters": [
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
        },
        {
          "name": "position",
          "operator": "includes",
          "value": "solution architect"
        }
      ]
    }
  },
  {
    name: 'US Salesforce Professionals',
    description: 'Anyone with Salesforce in their profile',
    records: 1000,
    filter: {
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
        }
      ]
    }
  },
  {
    name: 'US Nonprofit Professionals',
    description: 'Anyone with nonprofit experience',
    records: 1000,
    filter: {
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
    }
  }
];

async function runIterativeStrategy() {
  console.log('🎯 RUNNING 3 BROAD SEARCHES:');
  console.log('============================');
  
  const results = [];
  
  for (let i = 0; i < searches.length; i++) {
    const search = searches[i];
    console.log(`\n${i + 1}. ${search.name} (${search.records} records)`);
    console.log(`   📝 ${search.description}`);
    
    try {
      console.log('   📤 Sending request...');
      
      const response = await axios.post(
        `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=${search.records}`,
        { 
          dataset_id: DATASET_ID,
          filter: search.filter 
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const snapshotId = response.data.snapshot_id;
      console.log(`   ✅ Search created: ${snapshotId}`);
      
      results.push({
        name: search.name,
        snapshotId: snapshotId,
        records: search.records,
        status: 'building'
      });
      
      // Wait a bit between requests to be nice to the API
      if (i < searches.length - 1) {
        console.log('   ⏳ Waiting 5 seconds before next search...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.response?.data?.message || error.message}`);
      results.push({
        name: search.name,
        snapshotId: null,
        records: search.records,
        status: 'failed',
        error: error.message
      });
    }
  }
  
  console.log('\n📊 SEARCH SUMMARY:');
  console.log('==================');
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}:`);
    console.log(`   Status: ${result.status}`);
    console.log(`   Snapshot: ${result.snapshotId || 'N/A'}`);
    console.log(`   Expected Records: ${result.records}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const successfulSearches = results.filter(r => r.snapshotId);
  
  if (successfulSearches.length > 0) {
    console.log('\n⏱️  MONITORING PROGRESS:');
    console.log('========================');
    console.log('Checking every 30 seconds for up to 10 minutes...');
    
    // Monitor all searches
    for (let check = 0; check < 20; check++) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      console.log(`\n📊 Check ${check + 1} (${(check + 1) * 30}s):`);
      
      let allCompleted = true;
      
      for (const result of successfulSearches) {
        if (result.status === 'building' || result.status === 'scheduled') {
          allCompleted = false;
          
          try {
            const statusResponse = await axios.get(
              `${BASE_URL}/datasets/snapshots/${result.snapshotId}`,
              { headers: { 'Authorization': `Bearer ${API_KEY}` } }
            );
            
            result.status = statusResponse.data.status;
            result.actualRecords = statusResponse.data.dataset_size || 0;
            result.cost = statusResponse.data.cost || '0.00';
            
            console.log(`   ${result.name}: ${result.status} (${result.actualRecords}/${result.records}) $${result.cost}`);
            
          } catch (error) {
            console.log(`   ${result.name}: Error checking status`);
          }
        } else {
          console.log(`   ${result.name}: ${result.status} ✅`);
        }
      }
      
      if (allCompleted) {
        console.log('\n🎉 ALL SEARCHES COMPLETED!');
        break;
      }
    }
    
    // Final results
    console.log('\n🎯 DOWNLOAD COMMANDS:');
    console.log('====================');
    
    let totalRecords = 0;
    let totalCost = 0;
    
    successfulSearches.forEach((result, index) => {
      if (result.status === 'ready' && result.actualRecords > 0) {
        console.log(`\n${index + 1}. ${result.name} (${result.actualRecords} records, $${result.cost}):`);
        console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${result.snapshotId}/download?format=csv" -o "${result.name.replace(/[^a-zA-Z0-9]/g, '_')}.csv"`);
        
        totalRecords += result.actualRecords;
        totalCost += parseFloat(result.cost);
      }
    });
    
    console.log(`\n📈 TOTAL: ${totalRecords} records across ${successfulSearches.length} datasets ($${totalCost.toFixed(2)})`);
    
    console.log('\n🔍 NEXT STEPS:');
    console.log('==============');
    console.log('1. Download all CSV files using the commands above');
    console.log('2. Run local filtering script to find perfect matches:');
    console.log('   - Solution Architect + Salesforce + (Nonprofit OR Fundraising)');
    console.log('3. If we need more candidates, repeat with different search terms');
    console.log('4. Target: 500 qualified candidates for CloudCaddie recruitment');
    
  } else {
    console.log('\n❌ No successful searches. All failed due to timeout or other issues.');
    console.log('💡 Consider even simpler search terms or smaller record limits.');
  }
}

runIterativeStrategy(); 