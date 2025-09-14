const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🧪 ULTRA-MINIMAL TEST');
console.log('====================');
console.log('💡 Testing if ANY search can complete within 5-minute limit');
console.log('⚡ Absolutely minimal filters, tiny record count');
console.log('');

async function runMinimalTest() {
  try {
    console.log('🔍 Test: Just US professionals (50 records only)');
    console.log('📝 No complex filters - just country filter');
    console.log('');

    const minimalFilter = {
      "operator": "and", 
      "filters": [
        {
          "name": "country_code",
          "operator": "=",
          "value": "US"
        }
      ]
    };

    console.log('📤 Sending ultra-minimal request...');
    const response = await axios.post(
      `${BASE_URL}/datasets/filter?dataset_id=${DATASET_ID}&records_limit=50`,
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

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Minimal search created: ${snapshotId}`);
    console.log('⏱️  Monitoring for 3 minutes max...');
    console.log('');

    // Monitor for just 3 minutes (well under the 5-minute limit)
    for (let i = 0; i < 18; i++) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/datasets/snapshots/${snapshotId}`,
          { headers: { 'Authorization': `Bearer ${API_KEY}` } }
        );
        
        const status = statusResponse.data.status;
        const size = statusResponse.data.dataset_size || 0;
        const cost = statusResponse.data.cost || '0.00';
        
        console.log(`📊 ${(i + 1) * 10}s: ${status} | ${size}/50 records | $${cost}`);
        
        if (status === 'ready') {
          console.log('');
          console.log('🎉 SUCCESS! Minimal search works!');
          console.log('=================================');
          console.log(`📋 Snapshot ID: ${snapshotId}`);
          console.log(`📊 Results: ${size} US professionals`);
          console.log(`💰 Cost: $${cost}`);
          console.log('');
          console.log('📥 Download Command:');
          console.log(`curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshotId}/download?format=csv" -o minimal_test.csv`);
          console.log('');
          console.log('💡 NEXT STEP: Try slightly more complex searches');
          console.log('   - Add "architect" filter');
          console.log('   - Increase to 100 records');
          console.log('   - Add "salesforce" filter');
          
          return true;
        } else if (status === 'failed' || status === 'cancelled') {
          console.log('');
          console.log('❌ Even minimal search failed!');
          console.log('💡 This suggests a deeper API issue');
          console.log('🔧 Possible solutions:');
          console.log('   1. Contact Brightdata support');
          console.log('   2. Check API quota/limits');
          console.log('   3. Try different dataset');
          console.log('   4. Use different search approach');
          return false;
        }
        
      } catch (error) {
        console.log(`⚠️  Error checking status: ${error.message}`);
      }
    }
    
    console.log('');
    console.log('⏰ Minimal search taking 3+ minutes');
    console.log('💡 This indicates the API is having processing issues');
    console.log(`📋 Snapshot ID: ${snapshotId} (may still complete)`);
    return false;

  } catch (error) {
    console.error('❌ Error creating minimal search:', error.response?.data || error.message);
    
    console.log('');
    console.log('🔧 TROUBLESHOOTING:');
    console.log('===================');
    
    if (error.response?.status === 401) {
      console.log('🔑 Authentication issue - check API key');
    } else if (error.response?.status === 429) {
      console.log('🚫 Rate limited - wait before trying again');
    } else if (error.response?.status === 400) {
      console.log('📝 Bad request - check filter syntax');
    } else {
      console.log('🌐 Network/API issue - check Brightdata status');
    }
    
    return false;
  }
}

console.log('🚀 Starting ultra-minimal test...');
runMinimalTest().then(success => {
  if (success) {
    console.log('\n✅ MINIMAL TEST PASSED - API is working!');
    console.log('💡 Problem is with filter complexity or record count');
  } else {
    console.log('\n❌ MINIMAL TEST FAILED - API has deeper issues');
    console.log('💡 Need to investigate root cause before proceeding');
  }
}); 