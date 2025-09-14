#!/usr/bin/env node

/**
 * 🎯 BROADER SALESFORCE SEARCH
 * 
 * Cast a wider net with just "salesforce" in position
 * Then filter locally for Solution Architects + nonprofit experience
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

async function broaderSalesforceSearch() {
  try {
    console.log('🎯 BROADER SALESFORCE SEARCH STRATEGY');
    console.log('Cast wider net: Just "salesforce" → filter locally for Solution Architects + nonprofit');
    
    // Much broader filter - just salesforce in position
    const filter = {
      "name": "position",
      "value": "salesforce",
      "operator": "includes"
    };

    console.log('\n🔍 Creating broader snapshot (just "salesforce" in position)...');
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
    console.log(`✅ Broader snapshot created: ${snapshotId}`);
    
    // Wait for completion
    console.log(`⏳ Waiting for processing (this might take 10-20+ minutes for broader search)...`);
    
    for (let attempt = 1; attempt <= 30; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 120000)); // Wait 2 minutes
      
      try {
        const statusData = await checkSnapshotStatus(snapshotId);
        const status = statusData.status;
        const recordCount = statusData.record_count || 0;
        
        console.log(`📊 Check ${attempt}/30: ${status} (${recordCount} records so far)`);
        
        if (status === 'ready') {
          console.log(`\n✅ SUCCESS! Broader search ready with ${recordCount} total Salesforce professionals`);
          
          // Download the data
          console.log(`📥 Downloading all Salesforce professionals...`);
          
          // Try download with retries for "still building" errors
          let downloadAttempts = 0;
          let salesforceData = null;
          
          while (downloadAttempts < 5) {
            try {
              salesforceData = await downloadSnapshot(snapshotId);
              break; // Success
            } catch (downloadError) {
              downloadAttempts++;
              if (downloadError.message.includes('202')) {
                console.log(`⏳ Download attempt ${downloadAttempts}/5: Still building, waiting 2 minutes...`);
                await new Promise(resolve => setTimeout(resolve, 120000));
              } else {
                throw downloadError;
              }
            }
          }
          
          if (!salesforceData) {
            throw new Error('Download failed after 5 attempts');
          }
          
          let salesforceProfs = [];
          if (Array.isArray(salesforceData)) {
            salesforceProfs = salesforceData;
          } else if (salesforceData && typeof salesforceData === 'object') {
            salesforceProfs = [salesforceData];
          }
          
          console.log(`📊 Downloaded ${salesforceProfs.length} total Salesforce professionals`);
          
          // LOCAL FILTERING: Find Solution Architects
          const solutionArchitects = salesforceProfs.filter(person => {
            const position = (person.position || '').toLowerCase();
            return position.includes('solution') && position.includes('architect');
          });
          
          console.log(`🎯 Found ${solutionArchitects.length} Salesforce Solution Architects`);
          
          // LOCAL FILTERING: Find those with nonprofit/fundraising experience
          const nonprofitCandidates = solutionArchitects.filter(person => {
            const experience = (person.experience || '').toLowerCase();
            const about = (person.about || '').toLowerCase();
            const volunteer = (person.volunteer_experience || '').toLowerCase();
            
            return experience.includes('nonprofit') || 
                   about.includes('nonprofit') || 
                   volunteer.includes('nonprofit') ||
                   experience.includes('fundraising') ||
                   about.includes('fundraising') ||
                   volunteer.includes('fundraising') ||
                   experience.includes('charity') ||
                   about.includes('charity') ||
                   volunteer.includes('charity');
          });
          
          console.log(`🎯 FOUND ${nonprofitCandidates.length} Salesforce Solution Architects with nonprofit/fundraising experience!`);
          
          if (nonprofitCandidates.length > 0) {
            console.log('\n🏆 CLOUDCADDIE TARGET CANDIDATES:');
            nonprofitCandidates.slice(0, 15).forEach((candidate, index) => {
              console.log(`\n=== CANDIDATE ${index + 1} ===`);
              console.log(`👤 Name: ${candidate.name || 'N/A'}`);
              console.log(`💼 Position: ${candidate.position || 'N/A'}`);
              console.log(`🏢 Company: ${candidate.current_company_name || 'N/A'}`);
              console.log(`🔗 LinkedIn: ${candidate.linkedin_url || 'N/A'}`);
              console.log(`📍 Location: ${candidate.location || 'N/A'}`);
              console.log(`📧 Email: ${candidate.email || 'N/A'}`);
              
              // Highlight specific experience
              const experience = (candidate.experience || '').toLowerCase();
              const about = (candidate.about || '').toLowerCase();
              const volunteer = (candidate.volunteer_experience || '').toLowerCase();
              
              let experienceFlags = [];
              if (experience.includes('nonprofit') || about.includes('nonprofit') || volunteer.includes('nonprofit')) {
                experienceFlags.push('NONPROFIT');
              }
              if (experience.includes('fundraising') || about.includes('fundraising') || volunteer.includes('fundraising')) {
                experienceFlags.push('FUNDRAISING');
              }
              if (experience.includes('charity') || about.includes('charity') || volunteer.includes('charity')) {
                experienceFlags.push('CHARITY');
              }
              
              console.log(`✅ QUALIFICATIONS: ${experienceFlags.join(' + ')}`);
            });
            
            // Export qualified candidates
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `CloudCaddie_QUALIFIED_Salesforce_Solution_Architects_${timestamp}.csv`;
            
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
            console.log(`\n🎉 CLOUDCADDIE RECRUITMENT SUCCESS!`);
            console.log(`✅ ${nonprofitCandidates.length} qualified candidates exported to: ${filepath}`);
            console.log(`🎯 These are exactly the "Salesforce Solution Architect" + "nonprofit/fundraising" candidates you need!`);
            
          } else {
            console.log('\n⚠️  No qualifying candidates found');
            
            // Export all Salesforce Solution Architects for manual review
            if (solutionArchitects.length > 0) {
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `All_Salesforce_Solution_Architects_${timestamp}.csv`;
              
              const headers = Object.keys(solutionArchitects[0] || {});
              const csvLines = [headers.join(',')];
              
              solutionArchitects.forEach(record => {
                const row = headers.map(header => {
                  const value = record[header] || '';
                  return `"${String(value).replace(/"/g, '""')}"`;
                });
                csvLines.push(row.join(','));
              });
              
              const desktopPath = path.join(os.homedir(), 'Desktop');
              const filepath = path.join(desktopPath, filename);
              
              fs.writeFileSync(filepath, csvLines.join('\n'));
              console.log(`📁 All ${solutionArchitects.length} Salesforce Solution Architects exported to: ${filepath}`);
              console.log(`💡 Review manually for nonprofit/fundraising connections`);
            }
          }
          
          return;
          
        } else if (status === 'failed') {
          throw new Error(`Snapshot failed: ${JSON.stringify(statusData)}`);
        } else if (status === 'scheduled') {
          console.log(`⏳ Still queued for processing... (larger searches take longer)`);
        } else {
          console.log(`🔄 Processing... Status: ${status} (${recordCount} records found so far)`);
        }
        
      } catch (statusError) {
        console.log(`⚠️  Status check error: ${statusError.message}`);
      }
    }
    
    throw new Error('Broader search timed out after 60 minutes');
    
  } catch (error) {
    console.error('❌ Error in broader search:', error.message);
  }
}

// Execute the search
broaderSalesforceSearch(); 