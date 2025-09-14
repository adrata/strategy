#!/usr/bin/env node

/**
 * 🎯 TARGETED SALESFORCE SEARCH
 * 
 * Highly specific search to find exact matches faster
 * Target: "Salesforce Solution Architect" with nonprofit experience
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

async function targetedSearch() {
  try {
    console.log('🎯 TARGETED SALESFORCE SOLUTION ARCHITECT SEARCH');
    console.log('Strategy: Use exact phrase to narrow results quickly');
    
    // Try exact phrase "Solution Architect" which should be more specific
    const exactFilter = {
      "operator": "and",
      "filters": [
        {
          "name": "position",
          "value": "Solution Architect",
          "operator": "includes"
        },
        {
          "name": "position",
          "value": "salesforce",
          "operator": "includes"
        }
      ]
    };

    console.log('\n🔍 Creating targeted snapshot...');
    console.log('Filter: Position contains "Solution Architect" AND "salesforce"');
    
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: {
        dataset_id: LINKEDIN_PEOPLE_DATASET,
        filter: exactFilter
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to create snapshot: ${JSON.stringify(response.data)}`);
    }

    const snapshotId = response.data.snapshot_id;
    console.log(`✅ Snapshot created: ${snapshotId}`);
    
    // Wait longer but check more frequently  
    console.log(`⏳ Waiting for completion (checking every 1 minute, max 15 minutes)...`);
    
    for (let i = 1; i <= 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
      
      try {
        const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/meta`);
        
        if (statusResponse.status === 200) {
          const status = statusResponse.data.status;
          console.log(`📊 Check ${i}/15: ${status} (${statusResponse.data.record_count || 'counting...'} records)`);
          
          if (status === 'ready') {
            console.log(`\n✅ SUCCESS! Snapshot ready with ${statusResponse.data.record_count} records`);
            
            // Download the data
            console.log(`📥 Downloading data...`);
            const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}?format=json`);
            
            if (downloadResponse.status === 200) {
              const data = Array.isArray(downloadResponse.data) ? downloadResponse.data : [downloadResponse.data];
              
              console.log(`\n📊 Found ${data.length} Salesforce Solution Architects`);
              
              // Filter for nonprofit experience
              const nonprofitCandidates = data.filter(person => {
                const experience = (person.experience || '').toLowerCase();
                const about = (person.about || '').toLowerCase();
                const volunteer = (person.volunteer_experience || '').toLowerCase();
                
                return experience.includes('nonprofit') || 
                       about.includes('nonprofit') || 
                       volunteer.includes('nonprofit');
              });
              
              console.log(`🎯 ${nonprofitCandidates.length} candidates with nonprofit experience`);
              
              // Show sample results
              if (nonprofitCandidates.length > 0) {
                console.log('\n📋 Sample Candidates:');
                nonprofitCandidates.slice(0, 5).forEach((candidate, index) => {
                  console.log(`\n--- Candidate ${index + 1} ---`);
                  console.log(`Name: ${candidate.name || 'N/A'}`);
                  console.log(`Position: ${candidate.position || 'N/A'}`);
                  console.log(`Company: ${candidate.current_company_name || 'N/A'}`);
                  console.log(`LinkedIn: ${candidate.linkedin_url || 'N/A'}`);
                  
                  // Show nonprofit experience
                  if (candidate.experience && candidate.experience.toLowerCase().includes('nonprofit')) {
                    console.log(`✅ Nonprofit work experience found`);
                  }
                  if (candidate.volunteer_experience && candidate.volunteer_experience.toLowerCase().includes('nonprofit')) {
                    console.log(`✅ Nonprofit volunteer experience found`);
                  }
                });
                
                // Export to CSV
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `Salesforce_Solution_Architects_Nonprofit_${timestamp}.csv`;
                
                // Create CSV
                const headers = Object.keys(nonprofitCandidates[0] || {});
                const csvLines = [headers.join(',')];
                
                nonprofitCandidates.forEach(record => {
                  const row = headers.map(header => {
                    const value = record[header] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                  });
                  csvLines.push(row.join(','));
                });
                
                const desktopPath = path.join(os.homedir(), 'Desktop');
                const filepath = path.join(desktopPath, filename);
                
                fs.writeFileSync(filepath, csvLines.join('\n'));
                console.log(`\n✅ Results exported to: ${filepath}`);
                
              } else {
                console.log('\n❌ No candidates with nonprofit experience found in this batch');
                console.log('💡 The search worked but results may need broader nonprofit criteria');
              }
              
              return;
            } else {
              throw new Error(`Download failed: ${downloadResponse.status}`);
            }
          } else if (status === 'failed') {
            throw new Error(`Snapshot failed: ${JSON.stringify(statusResponse.data)}`);
          }
        } else {
          console.log(`⚠️  Status check failed: ${statusResponse.status}`);
        }
      } catch (statusError) {
        console.log(`⚠️  Status check error: ${statusError.message}`);
      }
    }
    
    throw new Error('Search timed out after 15 minutes');
    
  } catch (error) {
    console.error('❌ Error in targeted search:', error.message);
  }
}

// Execute the search
targetedSearch(); 