const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const BASE_URL = 'https://api.brightdata.com';

console.log('🔍 CHECKING STATUS OF RECENT SEARCHES');
console.log('=====================================');

async function checkAllSnapshots() {
  try {
    // Get list of all snapshots to find our recent ones
    const response = await axios.get(
      `${BASE_URL}/datasets/snapshots`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const snapshots = response.data;
    console.log(`📊 Found ${snapshots.length} total snapshots in account`);
    console.log('');

    // Filter for recent snapshots (last few created)
    const recentSnapshots = snapshots
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10); // Get last 10 snapshots

    console.log('🕐 RECENT SNAPSHOTS (Last 10):');
    console.log('==============================');

    for (const snapshot of recentSnapshots) {
      const createdAt = new Date(snapshot.created_at).toLocaleString();
      console.log(`📋 Snapshot: ${snapshot.snapshot_id}`);
      console.log(`   Status: ${snapshot.status}`);
      console.log(`   Created: ${createdAt}`);
      console.log(`   Dataset Size: ${snapshot.dataset_size || 0} records`);
      console.log(`   Cost: $${snapshot.cost || '0.00'}`);
      
      if (snapshot.status === 'ready' && snapshot.dataset_size > 0) {
        console.log(`   ✅ READY FOR DOWNLOAD!`);
        console.log(`   📥 Download: curl -H "Authorization: Bearer ${API_KEY}" "${BASE_URL}/datasets/snapshots/${snapshot.snapshot_id}/download?format=csv" -o snapshot_${snapshot.snapshot_id}.csv`);
      } else if (snapshot.status === 'scheduled' || snapshot.status === 'building') {
        console.log(`   ⏳ Still processing...`);
      } else if (snapshot.status === 'failed' || snapshot.status === 'cancelled') {
        console.log(`   ❌ Failed or cancelled`);
      }
      console.log('');
    }

    // Look for our specific broader search snapshots (ones with reasonable sizes)
    const readySnapshots = recentSnapshots.filter(s => 
      s.status === 'ready' && 
      s.dataset_size > 0 && 
      s.dataset_size <= 150 // Our searches were 50, 75, 100 records
    );

    if (readySnapshots.length > 0) {
      console.log('🎯 POTENTIAL BROADER SEARCH RESULTS:');
      console.log('===================================');
      
      let totalCandidates = 0;
      let totalCost = 0;
      
      readySnapshots.forEach((snapshot, index) => {
        console.log(`Search ${index + 1}: ${snapshot.dataset_size} records ($${snapshot.cost})`);
        console.log(`  Snapshot ID: ${snapshot.snapshot_id}`);
        console.log(`  Status: ${snapshot.status}`);
        totalCandidates += snapshot.dataset_size;
        totalCost += parseFloat(snapshot.cost || 0);
      });
      
      console.log('');
      console.log(`📈 TOTAL READY: ${totalCandidates} candidates across ${readySnapshots.length} searches`);
      console.log(`💰 Total Cost: $${totalCost.toFixed(2)}`);
      console.log('');
      console.log('💡 NEXT STEPS:');
      console.log('1. Download ready datasets using the curl commands above');
      console.log('2. Cross-reference to find Solution Architects with nonprofit + fundraising');
      console.log('3. Create final candidate list for CloudCaddie recruitment');
    } else {
      console.log('⏳ No ready snapshots found yet. Searches may still be processing or failed due to 5-minute timeout.');
      console.log('💡 Consider running simpler searches if current ones are stuck.');
    }

  } catch (error) {
    console.error('❌ Error checking snapshots:', error.response?.data || error.message);
  }
}

checkAllSnapshots(); 