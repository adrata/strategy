#!/usr/bin/env node

/**
 * 📊 CHECK SNAPSHOT STATUS
 * 
 * Manually check the status of recent snapshots
 */

const https = require('https');

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

async function checkSnapshots() {
  const snapshots = [
    'snap_md7uogs11kysld465n', // Latest working snapshot
    'snap_md7u301q1hq8fvs40h', // Previous targeted search
    'snap_md7tush72jehhnj4v2'  // Simple "salesforce" filter
  ];

  for (const snapshotId of snapshots) {
    try {
      console.log(`\n🔍 Checking snapshot: ${snapshotId}`);
      
      const response = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
      
      if (response.status === 200) {
        const data = response.data;
        console.log(`📊 Status: ${data.status}`);
        console.log(`📈 Records: ${data.record_count || 'Unknown'}`);
        console.log(`⏰ Created: ${data.created_at || 'Unknown'}`);
        console.log(`🔄 Updated: ${data.updated_at || 'Unknown'}`);
        
        if (data.status === 'ready') {
          console.log(`✅ This snapshot is ready for download!`);
          
          // Try to download a sample
          console.log(`🔽 Attempting to download sample...`);
          const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`);
          
          if (downloadResponse.status === 200) {
            const sampleData = Array.isArray(downloadResponse.data) ? downloadResponse.data : [downloadResponse.data];
            console.log(`📄 Sample data (${sampleData.length} records):`);
            
            sampleData.forEach((record, index) => {
              console.log(`\n--- Record ${index + 1} ---`);
              console.log(`Name: ${record.name || 'N/A'}`);
              console.log(`Position: ${record.position || 'N/A'}`);
              console.log(`Company: ${record.current_company_name || 'N/A'}`);
              console.log(`LinkedIn: ${record.linkedin_url || 'N/A'}`);
            });
          } else {
            console.log(`❌ Download failed: ${downloadResponse.status}`);
          }
        }
      } else {
        console.log(`❌ Failed to get status: ${response.status} - ${JSON.stringify(response.data)}`);
      }
      
    } catch (error) {
      console.error(`❌ Error checking ${snapshotId}:`, error.message);
    }
  }
}

// Execute the check
checkSnapshots(); 