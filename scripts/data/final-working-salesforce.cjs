#!/usr/bin/env node

/**
 * 🎯 FINAL WORKING SALESFORCE RECRUITMENT
 * 
 * Uses correct Brightdata API endpoints discovered through testing
 * Target: Salesforce Solution Architects with nonprofit experience
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

async function checkSnapshotStatus(snapshotId) {
  const response = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
  
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(`Status check failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
}

async function downloadSnapshot(snapshotId) {
  const response = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`);
  
  if (response.status === 200) {
    return response.data;
  } else {
    throw new Error(`Download failed: ${response.status} - ${JSON.stringify(response.data)}`);
  }
}

async function findSalesforceArchitects() {
  try {
    console.log('🎯 FINAL WORKING SALESFORCE SOLUTION ARCHITECT RECRUITMENT');
    console.log('TARGET: Salesforce Solution Architect + Nonprofit Experience');
    
    // Create targeted filter for Salesforce Solution Architects
    const filter = {
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

    console.log('\n🔍 Creating snapshot...');
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
    
    // Wait for completion using correct endpoint
    console.log(`⏳ Waiting for processing (checking every 2 minutes)...`);
    
    for (let attempt = 1; attempt <= 20; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
      
      try {
        const statusData = await checkSnapshotStatus(snapshotId);
        const status = statusData.status;
        const recordCount = statusData.record_count || 0;
        
        console.log(`📊 Check ${attempt}/20: ${status} (${recordCount} records)`);
        
        if (status === 'ready') {
          console.log(`\n✅ SUCCESS! Snapshot ready with ${recordCount} records`);
          
          // Download the data
          console.log(`📥 Downloading Salesforce Solution Architects...`);
          const data = await downloadSnapshot(snapshotId);
          
          let salesforceArchitects = [];
          if (Array.isArray(data)) {
            salesforceArchitects = data;
          } else if (data && typeof data === 'object') {
            // Handle single record response
            salesforceArchitects = [data];
          }
          
          console.log(`📊 Downloaded ${salesforceArchitects.length} Salesforce Solution Architects`);
          
          // Filter for nonprofit experience
          const nonprofitCandidates = salesforceArchitects.filter(person => {
            const experience = (person.experience || '').toLowerCase();
            const about = (person.about || '').toLowerCase();
            const volunteer = (person.volunteer_experience || '').toLowerCase();
            const position = (person.position || '').toLowerCase();
            
            return experience.includes('nonprofit') || 
                   about.includes('nonprofit') || 
                   volunteer.includes('nonprofit') ||
                   experience.includes('fundraising') ||
                   about.includes('fundraising') ||
                   volunteer.includes('fundraising');
          });
          
          console.log(`🎯 Found ${nonprofitCandidates.length} candidates with nonprofit/fundraising experience`);
          
          if (nonprofitCandidates.length > 0) {
            console.log('\n📋 TOP CANDIDATES:');
            nonprofitCandidates.slice(0, 10).forEach((candidate, index) => {
              console.log(`\n--- CANDIDATE ${index + 1} ---`);
              console.log(`👤 Name: ${candidate.name || 'N/A'}`);
              console.log(`💼 Position: ${candidate.position || 'N/A'}`);
              console.log(`🏢 Company: ${candidate.current_company_name || 'N/A'}`);
              console.log(`🔗 LinkedIn: ${candidate.linkedin_url || 'N/A'}`);
              console.log(`📍 Location: ${candidate.location || 'N/A'}`);
              
              // Highlight nonprofit/fundraising experience
              const experience = (candidate.experience || '').toLowerCase();
              const about = (candidate.about || '').toLowerCase();
              const volunteer = (candidate.volunteer_experience || '').toLowerCase();
              
              if (experience.includes('nonprofit')) {
                console.log(`✅ NONPROFIT work experience detected`);
              }
              if (experience.includes('fundraising')) {
                console.log(`✅ FUNDRAISING work experience detected`);
              }
              if (volunteer.includes('nonprofit')) {
                console.log(`✅ Nonprofit volunteer experience detected`);
              }
            });
            
            // Export to CSV
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `CloudCaddie_Salesforce_Solution_Architects_${timestamp}.csv`;
            
            // Create detailed CSV
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
            console.log(`\n✅ RECRUITMENT DATA EXPORTED TO: ${filepath}`);
            console.log(`📊 Total qualified candidates: ${nonprofitCandidates.length}`);
            
            // Summary
            console.log('\n🎉 CLOUDCADDIE RECRUITMENT COMPLETED!');
            console.log('🎯 Found qualified Salesforce Solution Architects with nonprofit/fundraising experience');
            console.log('📁 Check your Desktop for the complete candidate list');
            
          } else {
            console.log('\n⚠️  No candidates with nonprofit/fundraising experience found');
            console.log('💡 Try expanding search criteria or adjusting keywords');
            
            // Export all Salesforce architects for manual review
            if (salesforceArchitects.length > 0) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `All_Salesforce_Solution_Architects_${timestamp}.csv`;
              
              const headers = Object.keys(salesforceArchitects[0] || {});
              const csvLines = [headers.join(',')];
              
              salesforceArchitects.forEach(record => {
                const row = headers.map(header => {
                  const value = record[header] || '';
                  return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvLines.push(row.join(','));
              });
              
              const desktopPath = path.join(os.homedir(), 'Desktop');
              const filepath = path.join(desktopPath, filename);
              
              fs.writeFileSync(filepath, csvLines.join('\n'));
              console.log(`📁 All Salesforce Solution Architects exported to: ${filepath}`);
            }
          }
          
          return;
          
        } else if (status === 'failed') {
          throw new Error(`Snapshot failed: ${JSON.stringify(statusData)}`);
        } else if (status === 'scheduled') {
          console.log(`⏳ Still queued for processing...`);
        } else {
          console.log(`🔄 Processing... Status: ${status}`);
        }
        
      } catch (statusError) {
        console.log(`⚠️  Status check error: ${statusError.message}`);
      }
    }
    
    throw new Error('Search timed out after 40 minutes');
    
  } catch (error) {
    console.error('❌ Error in recruitment search:', error.message);
  }
}

// Execute the search
findSalesforceArchitects(); 