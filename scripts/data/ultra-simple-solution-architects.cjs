const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🎯 ULTRA-SIMPLE SOLUTION ARCHITECT SEARCH');
console.log('=========================================');
console.log('💡 Strategy: Get basic Solution Architects, then manually filter');
console.log('⚡ Simple enough to complete within 5-minute timeout');
console.log('');

async function runUltraSimpleSearch() {
  try {
    console.log('🔍 Searching for: US Solution Architects (25 results)');
    console.log('📝 We\'ll manually check these for Salesforce + nonprofit + fundraising');
    console.log('');

    const simpleFilter = {
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
    };

    console.log('📤 Sending request...');
    const response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=25`,
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

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Search created: ${snapshotId}`);
    console.log('⏱️  Monitoring search progress...');
    console.log('');

    // Monitor the search for up to 4 minutes (well within 5-minute limit)
    for (let i = 0; i < 24; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/datasets/snapshots/${snapshotId}`,
          { headers: { 'Authorization': `Bearer ${API_KEY}` } }
        );
        
        const status = statusResponse.data.status;
        const size = statusResponse.data.dataset_size || 0;
        const cost = statusResponse.data.cost || '0.00';
        
        console.log(`📊 Status: ${status} | Records: ${size}/25 | Cost: $${cost} | Time: ${(i + 1) * 10}s`);
        
        if (status === 'ready') {
          console.log('');
          console.log('🎉 SUCCESS! Search completed successfully!');
          console.log('================================');
          console.log(`📋 Snapshot ID: ${snapshotId}`);
          console.log(`📊 Results: ${size} solution architects found`);
          console.log(`💰 Cost: $${cost}`);
          console.log('');
          console.log('📥 DOWNLOAD COMMAND:');
          console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshotId}/download?format=csv" -o solution_architects.csv`);
          console.log('');
          console.log('🔍 NEXT STEPS:');
          console.log('1. Download the CSV file');
          console.log('2. Manually review each candidate for:');
          console.log('   - Salesforce experience');
          console.log('   - Nonprofit cloud experience');
          console.log('   - Fundraising experience');
          console.log('3. Create shortlist of perfect matches');
          console.log('4. These are your CloudCaddie recruitment targets!');
          
          return; // Exit successfully
        } else if (status === 'failed' || status === 'cancelled') {
          console.log('');
          console.log('❌ Search failed or was cancelled');
          console.log('💡 This might be due to the 5-minute timeout limit');
          console.log('💡 Try an even simpler search or different criteria');
          return;
        }
        
      } catch (error) {
        console.log(`⚠️  Error checking status: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('⏰ Search taking longer than expected (4+ minutes)');
    console.log('💡 It may still complete, but approaching the 5-minute timeout limit');
    console.log(`📋 Snapshot ID: ${snapshotId} (check status manually)`);

  } catch (error) {
    console.error('❌ Error running search:', error.response?.data || error.message);
    
    if (error.response?.data?.message?.includes('timeout') || error.response?.data?.message?.includes('5 minutes')) {
      console.log('');
      console.log('💡 TIMEOUT SOLUTION:');
      console.log('The search criteria might still be too complex for the 5-minute limit.');
      console.log('Consider searching for just "architect" or reducing filters further.');
    }
  }
}

runUltraSimpleSearch(); 