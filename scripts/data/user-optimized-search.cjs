#!/usr/bin/env node

/**
 * 🎯 USER-OPTIMIZED SEARCH
 * 
 * Using the user's smart curl approach:
 * position: "salesforce architect" AND experience: "fundraising" AND "nonprofit"
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

async function userOptimizedSearch() {
  try {
    console.log('🎯 USER-OPTIMIZED CLOUDCADDIE SEARCH');
    console.log('Filter: position="salesforce architect" + experience="fundraising" + experience="nonprofit"');
    
    // User's optimized filter
    const filter = {
      "operator": "and",
      "filters": [
        {
          "name": "position",
          "value": "salesforce architect",
          "operator": "includes"
        },
        {
          "name": "experience", 
          "value": "fundraising",
          "operator": "includes"
        },
        {
          "name": "experience",
          "value": "nonprofit", 
          "operator": "includes"
        }
      ]
    };

    console.log('\n🔍 Creating snapshot with user-optimized filter...');
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: {
        dataset_id: LINKEDIN_PEOPLE_DATASET,
        filter: filter
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to create snapshot: ${JSON.stringify(response.data)}`);
    }

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Snapshot created: ${snapshotId}`);
    
    // Check status every 2 minutes for up to 20 minutes  
    console.log(`⏳ Waiting for processing... (checking every 2 minutes)`);
    
    for (let attempt = 1; attempt <= 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
      
      try {
        const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
        
        if (statusResponse.status === 200) {
          const status = statusResponse.data.status;
          const recordCount = statusResponse.data.record_count || 0;
          
          console.log(`📊 Check ${attempt}/10: ${status} (${recordCount} candidates found)`);
          
          if (status === 'ready') {
            console.log(`\n✅ SUCCESS! Found ${recordCount} qualified candidates`);
            
            // Download with retry logic
            console.log(`📥 Downloading candidates...`);
            let downloadAttempts = 0;
            let candidatesData = null;
            
            while (downloadAttempts < 5) {
              try {
                const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`);
                
                if (downloadResponse.status === 200) {
                  candidatesData = downloadResponse.data;
                  break;
                } else if (downloadResponse.status === 202) {
                  downloadAttempts++;
                  console.log(`⏳ Download attempt ${downloadAttempts}/5: Still building, waiting 2 minutes...`);
                  await new Promise(resolve => setTimeout(resolve, 120000));
                } else {
                  throw new Error(`Download failed: ${downloadResponse.status}`);
                }
              } catch (downloadError) {
                downloadAttempts++;
                console.log(`❌ Download attempt ${downloadAttempts}/5 failed: ${downloadError.message}`);
                if (downloadAttempts < 5) {
                  await new Promise(resolve => setTimeout(resolve, 120000));
                }
              }
            }
            
            if (!candidatesData) {
              console.log('❌ Download failed after 5 attempts');
              console.log(`💡 But we know there are ${recordCount} candidates! Try the download later or manually.`);
              return;
            }
            
            // Process the candidates
            let candidates = [];
            if (Array.isArray(candidatesData)) {
              candidates = candidatesData;
            } else if (candidatesData && typeof candidatesData === 'object') {
              candidates = [candidatesData];
            }
            
            console.log(`📊 Downloaded ${candidates.length} qualified CloudCaddie candidates`);
            
            if (candidates.length > 0) {
              console.log('\n🏆 CLOUDCADDIE RECRUITMENT SUCCESS!');
              console.log('🎯 These candidates have ALL requirements:');
              console.log('   ✅ Salesforce Architect position');  
              console.log('   ✅ Fundraising experience');
              console.log('   ✅ Nonprofit experience');
              
              console.log('\n📋 YOUR QUALIFIED CANDIDATES:');
              
              candidates.forEach((candidate, index) => {
                console.log(`\n=== CANDIDATE ${index + 1} ===`);
                console.log(`👤 Name: ${candidate.name || 'N/A'}`);
                console.log(`💼 Position: ${candidate.position || 'N/A'}`);
                console.log(`🏢 Company: ${candidate.current_company_name || 'N/A'}`);
                console.log(`📍 Location: ${candidate.location || 'N/A'}`);
                console.log(`📧 Email: ${candidate.email || 'N/A'}`);
                console.log(`🔗 LinkedIn: ${candidate.linkedin_url || 'N/A'}`);
                
                // Show relevant experience snippets
                if (candidate.experience) {
                  const exp = candidate.experience.toLowerCase();
                  if (exp.includes('nonprofit') && exp.includes('fundraising')) {
                    console.log(`✅ PERFECT MATCH: Has both nonprofit AND fundraising experience`);
                  }
                }
              });
              
              // Export to CSV
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `CloudCaddie_PERFECT_MATCHES_${timestamp}.csv`;
              
              const headers = Object.keys(candidates[0]);
              const csvLines = [headers.join(',')];
              
              candidates.forEach(record => {
                const row = headers.map(header => {
                  const value = record[header] || '';
                  return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvLines.push(row.join(','));
              });
              
              const desktopPath = path.join(os.homedir(), 'Desktop');
              const filepath = path.join(desktopPath, filename);
              
              fs.writeFileSync(filepath, csvLines.join('\n'));
              
              console.log(`\n🎉 PERFECT! ${candidates.length} qualified candidates exported to:`);
              console.log(`📁 ${filepath}`);
              console.log(`\n🎯 These are exactly the "Salesforce Architect + nonprofit + fundraising" people you need!`);
              
            } else {
              console.log('\n⚠️  No data downloaded, but API shows candidates exist');
              console.log(`💡 ${recordCount} candidates found - try manual download or wait longer`);
            }
            
            return;
            
          } else if (status === 'failed') {
            throw new Error(`Search failed: ${JSON.stringify(statusResponse.data)}`);
          } else if (status === 'scheduled') {
            console.log(`⏳ Still queued for processing...`);
          } else {
            console.log(`🔄 Processing... (${recordCount} candidates found so far)`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Status check ${attempt} failed: ${error.message}`);
      }
    }
    
    console.log('⏰ Search taking longer than expected, but this approach should work!');
    
  } catch (error) {
    console.error('❌ Search failed:', error.message);
  }
}

// Execute the user's optimized search
userOptimizedSearch(); 