#!/usr/bin/env node

/**
 * 🧪 SIMPLE SALESFORCE TEST
 * 
 * Basic test to see if simple filtering works on LinkedIn dataset
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_l1viktl72bvl7bjuj0";

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
        ...options.headers
      }
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function simpleTest() {
  try {
    console.log('🧪 SIMPLE SALESFORCE TEST - Basic Filtering');
    
    // Very simple filter: just "salesforce" in position
    const simpleFilter = {
      "name": "position",
      "value": "salesforce",
      "operator": "includes"
    };

    console.log('\n🔍 Creating snapshot with simple filter...');
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: {
        dataset_id: LINKEDIN_PEOPLE_DATASET,
        filter: simpleFilter
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to create snapshot: ${JSON.stringify(response.data)}`);
    }

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Snapshot created: ${snapshotId}`);
    
    // Check status every 30 seconds for 5 minutes max
    console.log(`⏳ Waiting for completion...`);
    for (let i = 1; i <= 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/meta`);
      
      if (statusResponse.status === 200) {
        const status = statusResponse.data.status;
        console.log(`📊 Status check ${i}/10: ${status}`);
        
        if (status === 'ready') {
          console.log(`✅ Snapshot ready! Records: ${statusResponse.data.record_count}`);
          
          // Download a few records to test
          const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}?format=json&limit=5`);
          
          if (downloadResponse.status === 200) {
            console.log('\n📄 Sample Results:');
            const sampleData = Array.isArray(downloadResponse.data) ? downloadResponse.data : [downloadResponse.data];
            sampleData.slice(0, 3).forEach((record, index) => {
              console.log(`\n--- Record ${index + 1} ---`);
              console.log(`Name: ${record.name || 'N/A'}`);
              console.log(`Position: ${record.position || 'N/A'}`);
              console.log(`Company: ${record.current_company_name || 'N/A'}`);
              console.log(`LinkedIn: ${record.linkedin_url || 'N/A'}`);
            });
            
            console.log('\n✅ Basic filtering works! This confirms the API is functional.');
            return;
          }
        } else if (status === 'failed') {
          throw new Error(`Snapshot failed: ${JSON.stringify(statusResponse.data)}`);
        }
      }
    }
    
    throw new Error('Simple test timed out after 5 minutes');
    
  } catch (error) {
    console.error('❌ Error in simple test:', error.message);
  }
}

// Execute the test
simpleTest(); 