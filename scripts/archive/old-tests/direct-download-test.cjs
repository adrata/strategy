#!/usr/bin/env node

/**
 * 🔄 DIRECT DOWNLOAD TEST
 * 
 * Try to download directly from the latest snapshot without status checking
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

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
    req.end();
  });
}

async function directDownloadTest() {
  const snapshotId = 'snap_md7u301q1hq8fvs40h'; // Latest snapshot
  
  console.log('🔄 DIRECT DOWNLOAD TEST');
  console.log(`📋 Snapshot ID: ${snapshotId}`);
  
  // Try different endpoint variations
  const endpoints = [
    `https://api.brightdata.com/datasets/snapshots/${snapshotId}`,
    `https://api.brightdata.com/datasets/snapshot/${snapshotId}`,
    `https://api.brightdata.com/datasets/snapshots/${snapshotId}?format=json`,
    `https://api.brightdata.com/datasets/snapshot/${snapshotId}?format=json`,
    `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`,
    `https://api.brightdata.com/datasets/snapshot/${snapshotId}/download`
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔽 Trying: ${endpoint}`);
      
      const response = await makeRequest(endpoint);
      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log('✅ SUCCESS! Download endpoint found');
        
        if (typeof response.data === 'object' && Array.isArray(response.data)) {
          console.log(`📄 Downloaded ${response.data.length} records`);
          
          // Show sample
          if (response.data.length > 0) {
            console.log('\n📋 Sample Record:');
            const sample = response.data[0];
            Object.keys(sample).slice(0, 5).forEach(key => {
              console.log(`${key}: ${sample[key]}`);
            });
            
            // Export to CSV
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `Salesforce_Download_Test_${timestamp}.csv`;
            
            // Create CSV
            const headers = Object.keys(response.data[0] || {});
            const csvLines = [headers.join(',')];
            
            response.data.forEach(record => {
              const row = headers.map(header => {
                const value = record[header] || '';
                return `"${String(value).replace(/"/g, '""')}"`;
              });
              csvLines.push(row.join(','));
            });
            
            const desktopPath = path.join(os.homedir(), 'Desktop');
            const filepath = path.join(desktopPath, filename);
            
            fs.writeFileSync(filepath, csvLines.join('\n'));
            console.log(`✅ Test data exported to: ${filepath}`);
          }
          
          return; // Success, exit
        } else {
          console.log(`📄 Response type: ${typeof response.data}`);
          console.log(`📄 Response preview: ${JSON.stringify(response.data).substring(0, 200)}...`);
        }
      } else if (response.status === 404) {
        console.log('❌ 404 - Endpoint not found');
      } else if (response.status === 202) {
        console.log('⏳ 202 - Still processing');
      } else {
        console.log(`❌ Error: ${response.status}`);
        console.log(`Response: ${JSON.stringify(response.data).substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n💡 Summary: Trying to find the correct download endpoint');
  console.log('📋 Next steps: Check Brightdata documentation for exact API structure');
}

// Execute the test
directDownloadTest(); 