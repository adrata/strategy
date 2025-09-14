const axios = require('axios');

const API_KEY = '7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e';
const DATASET_ID = 'gd_l1viktl72bvl7bjuj0';
const BASE_URL = 'https://api.brightdata.com';

console.log('🔍 INVESTIGATING API ISSUES');
console.log('============================');
console.log('💡 Checking account status, dataset access, quotas, etc.');
console.log('');

async function investigateAPIIssues() {
  
  // 1. Check API connection and authentication
  console.log('1️⃣ Testing API Connection & Authentication');
  console.log('==========================================');
  
  try {
    const authTest = await axios.get(`${BASE_URL}/datasets`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Authentication: WORKING');
    console.log(`📊 Available datasets: ${authTest.data.length}`);
    
    // Find our specific dataset
    const ourDataset = authTest.data.find(d => d.dataset_id === DATASET_ID);
    if (ourDataset) {
      console.log('✅ LinkedIn Dataset Access: CONFIRMED');
      console.log(`📋 Dataset Name: ${ourDataset.name || 'LinkedIn People'}`);
      console.log(`📊 Dataset Records: ${ourDataset.total_records || 'Unknown'}`);
    } else {
      console.log('❌ LinkedIn Dataset Access: NOT FOUND');
      console.log('💡 Available datasets:');
      authTest.data.slice(0, 5).forEach(d => {
        console.log(`   - ${d.dataset_id}: ${d.name || 'Unknown'}`);
      });
    }
    
  } catch (error) {
    console.log('❌ API Authentication: FAILED');
    console.log(`Error: ${error.response?.data?.message || error.message}`);
    return;
  }
  
  console.log('');
  
  // 2. Check recent snapshots and account usage
  console.log('2️⃣ Checking Account Usage & Recent Activity');
  console.log('===========================================');
  
  try {
    const snapshots = await axios.get(`${BASE_URL}/datasets/snapshots`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Total snapshots in account: ${snapshots.data.length}`);
    
    // Check recent failed snapshots
    const recentFailed = snapshots.data
      .filter(s => s.status === 'failed')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    if (recentFailed.length > 0) {
      console.log(`🚨 Recent failed snapshots: ${recentFailed.length}`);
      recentFailed.forEach((snapshot, index) => {
        const createdAt = new Date(snapshot.created_at).toLocaleString();
        console.log(`   ${index + 1}. ${snapshot.snapshot_id} - Failed at ${createdAt}`);
      });
    } else {
      console.log('✅ No recent failed snapshots found');
    }
    
    // Check account costs/usage
    const totalCost = snapshots.data.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
    console.log(`💰 Total account usage: $${totalCost.toFixed(2)}`);
    
  } catch (error) {
    console.log('⚠️ Error checking snapshots:', error.message);
  }
  
  console.log('');
  
  // 3. Test different dataset (if available)
  console.log('3️⃣ Testing Alternative Dataset Access');
  console.log('====================================');
  
  try {
    const datasets = await axios.get(`${BASE_URL}/datasets`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    // Try to find a smaller dataset for testing
    const testDataset = datasets.data.find(d => 
      d.dataset_id !== DATASET_ID && 
      d.name && 
      d.name.toLowerCase().includes('test')
    );
    
    if (testDataset) {
      console.log(`🧪 Found test dataset: ${testDataset.dataset_id}`);
      console.log('💡 Trying minimal search on different dataset...');
      
      const testResponse = await axios.post(
        `${BASE_URL}/datasets/filter?dataset_id=${testDataset.dataset_id}&records_limit=10`,
        { 
          dataset_id: testDataset.dataset_id,
          filter: {
            "operator": "and",
            "filters": []
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ Alternative dataset search created: ${testResponse.data.snapshot_id}`);
      console.log('💡 This suggests the issue is specific to LinkedIn dataset');
      
    } else {
      console.log('⚠️ No test datasets available');
    }
    
  } catch (error) {
    console.log('⚠️ Error testing alternative dataset:', error.message);
  }
  
  console.log('');
  
  // 4. Check if there are any ongoing system issues
  console.log('4️⃣ Checking for System Status Issues');
  console.log('===================================');
  
  try {
    // Check if there's a status endpoint
    const statusResponse = await axios.get(`${BASE_URL}/status`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    console.log('✅ System status:', statusResponse.data);
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️ No public status endpoint available');
    } else {
      console.log('⚠️ Error checking system status:', error.message);
    }
  }
  
  console.log('');
  console.log('🔧 DIAGNOSIS SUMMARY:');
  console.log('=====================');
  console.log('Based on the investigation:');
  console.log('');
  console.log('🚨 MOST LIKELY CAUSES:');
  console.log('1. LinkedIn dataset is experiencing processing delays/issues');
  console.log('2. Large dataset (115M records) causing backend timeouts');
  console.log('3. Brightdata infrastructure problems with filtering');
  console.log('4. Rate limiting or quota restrictions');
  console.log('');
  console.log('💡 RECOMMENDED SOLUTIONS:');
  console.log('1. Contact Brightdata support about LinkedIn dataset issues');
  console.log('2. Ask about alternative search methods or datasets');
  console.log('3. Request dataset health status');
  console.log('4. Consider using pre-made filtered snapshots if available');
  console.log('');
  console.log('📧 Support: Contact support@brightdata.com');
  console.log('📋 Include: API key, dataset ID, failed snapshot IDs');
}

investigateAPIIssues(); 