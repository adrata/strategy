#!/usr/bin/env node

/**
 * 🧪 SIMPLE BRIGHTDATA TEST - Exact curl replication
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

// Simple test - exact copy of your curl example
async function simpleTest() {
  console.log('🧪 SIMPLE BRIGHTDATA TEST');
  console.log('=========================');
  
  // Use the exact filter format from your curl example
  const filter = {
    "name": "name",
    "operator": "=", 
    "value": "Bitstamp"  // Use the company from your example response
  };
  
  const datasetId = "gd_l1viktl72bvl7bjuj0"; // LinkedIn companies dataset
  
  console.log(`📊 Dataset: ${datasetId}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  // Step 1: Create snapshot using Monaco pipeline JSON format
  const payload = {
    dataset_id: datasetId,
    filter: filter
  };
  
  console.log('🔄 Creating snapshot...');
  console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);
  
  const createResponse = await makeRequest('https://api.brightdata.com/datasets/filter', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  console.log('✅ Snapshot response:', createResponse);
  
  if (!createResponse.snapshot_id) {
    throw new Error('No snapshot_id received');
  }
  
  const snapshotId = createResponse.snapshot_id;
  console.log(`✅ Snapshot ID: ${snapshotId}`);
  
  // Step 2: Wait for completion (shortened for testing)
  for (let i = 0; i < 5; i++) {
    console.log(`🔍 Checking status (${i+1}/5)...`);
    
    const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      }
    });
    
    console.log(`📊 Status: ${statusResponse.status || 'unknown'}`);
    
    if (statusResponse.status === 'ready') {
      console.log('✅ Snapshot ready!');
      
      // Step 3: Quick download test
      console.log('📥 Testing download...');
      const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        }
      });
      
      console.log('✅ Download successful!');
      console.log(`📊 Data preview:`, typeof downloadResponse === 'string' ? downloadResponse.substring(0, 200) + '...' : downloadResponse);
      
      // Save raw response to desktop for inspection
      const desktopPath = path.join(os.homedir(), 'Desktop');
      const fileName = `brightdata-test-${Date.now()}.json`;
      const filePath = path.join(desktopPath, fileName);
      
      fs.writeFileSync(filePath, typeof downloadResponse === 'string' ? downloadResponse : JSON.stringify(downloadResponse, null, 2));
      console.log(`💾 Raw data saved to: ${filePath}`);
      
      return { success: true, filePath, snapshotId };
    } else if (statusResponse.status === 'failed') {
      throw new Error(`Snapshot failed: ${statusResponse.error || 'Unknown error'}`);
    }
    
    // Wait 10 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Snapshot not ready after 5 checks');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 60000,
    };
    
    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    
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
              resolve(data); // Return raw text if not JSON
            }
          } else {
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Run the test
if (require.main === module) {
  simpleTest().then(result => {
    console.log('🎉 Test completed successfully!', result);
  }).catch(error => {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  });
}

module.exports = { simpleTest }; 