#!/usr/bin/env node

/**
 * 🔍 DEBUG SNAPSHOT FAILURE
 * Check why LinkedIn People snapshots are failing
 */

const https = require('https');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const FAILED_SNAPSHOT_ID = "snap_md7s4nxd2mjqxcuayn"; // From the failed run

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
          console.log(`📡 Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            console.log(`❌ Error Response: ${data}`);
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function debugSnapshot(snapshotId) {
  console.log(`🔍 DEBUGGING SNAPSHOT: ${snapshotId}`);
  console.log('=====================================');
  
  try {
    // Check snapshot status and metadata
    const statusUrl = `https://api.brightdata.com/datasets/snapshots/${snapshotId}`;
    console.log(`🌐 Checking: ${statusUrl}`);
    
    const status = await makeRequest(statusUrl);
    
    console.log('📊 SNAPSHOT DETAILS:');
    console.log('====================');
    console.log(JSON.stringify(status, null, 2));
    
    if (status.status === 'failed') {
      console.log('❌ FAILURE ANALYSIS:');
      console.log('===================');
      console.log(`Error: ${status.error || 'No error message provided'}`);
      console.log(`Failed at: ${status.failed_at || 'Unknown time'}`);
      console.log(`Records found: ${status.records_count || 0}`);
    }
    
  } catch (error) {
    console.error(`❌ Debug failed: ${error.message}`);
  }
}

async function testBasicDatasetAccess() {
  console.log('🧪 TESTING BASIC DATASET ACCESS');
  console.log('===============================');
  
  const LINKEDIN_PEOPLE_DATASET = "gd_ld7ll037kqy322v05";
  
  // Try the absolute simplest filter possible - no actual filtering
  const basicFilter = {
    "name": "id",
    "operator": "is_not_null"
  };
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: basicFilter,
    records_limit: 5  // Just 5 records to minimize cost
  };
  
  try {
    console.log('🔄 Creating minimal test snapshot...');
    console.log(`Filter: ${JSON.stringify(basicFilter, null, 2)}`);
    
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (response.snapshot_id) {
      console.log(`✅ Test snapshot created: ${response.snapshot_id}`);
      
      // Wait a bit and check status
      await new Promise(resolve => setTimeout(resolve, 10000));
      await debugSnapshot(response.snapshot_id);
      
    } else {
      console.log('❌ No snapshot created');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

// Main execution
if (require.main === module) {
  const action = process.argv[2] || 'debug';
  
  if (action === 'debug') {
    debugSnapshot(FAILED_SNAPSHOT_ID);
  } else if (action === 'test') {
    testBasicDatasetAccess();
  } else {
    console.log('Usage: node debug-snapshot.cjs [debug|test]');
    console.log('  debug - Debug the failed snapshot');
    console.log('  test  - Test basic dataset access');
  }
} 