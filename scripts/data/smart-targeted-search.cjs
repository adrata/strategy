#!/usr/bin/env node

/**
 * 🧠 SMART TARGETED SEARCH
 * 
 * Start with "Solution Architect" (more specific than "salesforce")
 * This should return a manageable number of people to filter locally
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

async function smartTargetedSearch() {
  try {
    console.log('🧠 SMART TARGETED SEARCH');
    console.log('Strategy: Start with "Solution Architect" → filter for Salesforce + nonprofit locally');
    console.log('This should give us hundreds, not thousands of people');
    
    // Start with the more specific term
    const filter = {
      "name": "position",
      "value": "Solution Architect",
      "operator": "includes"
    };

    console.log('\n🔍 Searching for "Solution Architect" in positions...');
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
    
    // Check status every 3 minutes for up to 30 minutes
    console.log(`⏳ Waiting for processing... (checking every 3 minutes)`);
    
    for (let attempt = 1; attempt <= 10; attempt++) {
      await new Promise(resolve => setTimeout(resolve, 180000)); // Wait 3 minutes
      
      try {
        const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
        
        if (statusResponse.status === 200) {
          const status = statusResponse.data.status;
          const recordCount = statusResponse.data.record_count || 0;
          
          console.log(`📊 Check ${attempt}/10: ${status} (${recordCount} Solution Architects found)`);
          
          if (status === 'ready') {
            console.log(`\n✅ SUCCESS! Found ${recordCount} total Solution Architects`);
            
            if (recordCount > 10000) {
              console.log(`⚠️  That's a lot of people (${recordCount}). Let me try a more specific search instead.`);
              
              // If too many, try a more specific search
              return await tryMoreSpecificSearch();
            }
            
            // Download with retry logic
            console.log(`📥 Downloading ${recordCount} Solution Architects...`);
            let downloadAttempts = 0;
            let architectsData = null;
            
            while (downloadAttempts < 3) {
              try {
                const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`);
                
                if (downloadResponse.status === 200) {
                  architectsData = downloadResponse.data;
                  break;
                } else if (downloadResponse.status === 202) {
                  downloadAttempts++;
                  console.log(`⏳ Download attempt ${downloadAttempts}/3: Still building, waiting 3 minutes...`);
                  await new Promise(resolve => setTimeout(resolve, 180000));
                } else {
                  throw new Error(`Download failed: ${downloadResponse.status}`);
                }
              } catch (downloadError) {
                downloadAttempts++;
                console.log(`❌ Download attempt ${downloadAttempts}/3 failed: ${downloadError.message}`);
                if (downloadAttempts < 3) {
                  await new Promise(resolve => setTimeout(resolve, 180000));
                }
              }
            }
            
            if (!architectsData) {
              throw new Error('Download failed after 3 attempts');
            }
            
            // Process the data
            let allArchitects = [];
            if (Array.isArray(architectsData)) {
              allArchitects = architectsData;
            } else if (architectsData && typeof architectsData === 'object') {
              allArchitects = [architectsData];
            }
            
            console.log(`📊 Downloaded ${allArchitects.length} Solution Architects`);
            
            // Filter for Salesforce professionals
            const salesforceArchitects = allArchitects.filter(person => {
              const position = (person.position || '').toLowerCase();
              const experience = (person.experience || '').toLowerCase();
              const about = (person.about || '').toLowerCase();
              
              return position.includes('salesforce') || 
                     experience.includes('salesforce') || 
                     about.includes('salesforce');
            });
            
            console.log(`🎯 Found ${salesforceArchitects.length} Salesforce Solution Architects`);
            
            // Filter for nonprofit/fundraising experience
            const qualifiedCandidates = salesforceArchitects.filter(person => {
              const experience = (person.experience || '').toLowerCase();
              const about = (person.about || '').toLowerCase();
              const volunteer = (person.volunteer_experience || '').toLowerCase();
              
              const hasNonprofit = experience.includes('nonprofit') || about.includes('nonprofit') || volunteer.includes('nonprofit');
              const hasFundraising = experience.includes('fundraising') || about.includes('fundraising') || volunteer.includes('fundraising');
              const hasCharity = experience.includes('charity') || about.includes('charity') || volunteer.includes('charity');
              
              return hasNonprofit || hasFundraising || hasCharity;
            });
            
            console.log(`🏆 FOUND ${qualifiedCandidates.length} QUALIFIED CLOUDCADDIE CANDIDATES!`);
            
            if (qualifiedCandidates.length > 0) {
              console.log('\n🎯 YOUR CLOUDCADDIE RECRUITMENT TARGETS:');
              
              qualifiedCandidates.forEach((candidate, index) => {
                console.log(`\n=== CANDIDATE ${index + 1} ===`);
                console.log(`👤 ${candidate.name || 'N/A'}`);
                console.log(`💼 ${candidate.position || 'N/A'}`);
                console.log(`🏢 ${candidate.current_company_name || 'N/A'}`);
                console.log(`📍 ${candidate.location || 'N/A'}`);
                console.log(`🔗 ${candidate.linkedin_url || 'N/A'}`);
                
                // Show why they qualify
                const experience = (candidate.experience || '').toLowerCase();
                const about = (candidate.about || '').toLowerCase();
                const volunteer = (candidate.volunteer_experience || '').toLowerCase();
                
                let qualifications = [];
                if (experience.includes('nonprofit') || about.includes('nonprofit') || volunteer.includes('nonprofit')) {
                  qualifications.push('NONPROFIT EXPERIENCE');
                }
                if (experience.includes('fundraising') || about.includes('fundraising') || volunteer.includes('fundraising')) {
                  qualifications.push('FUNDRAISING EXPERIENCE');
                }
                if (experience.includes('charity') || about.includes('charity') || volunteer.includes('charity')) {
                  qualifications.push('CHARITY EXPERIENCE');
                }
                
                console.log(`✅ ${qualifications.join(' + ')}`);
              });
              
              // Export to CSV
              const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
              const filename = `CloudCaddie_Final_Qualified_Candidates_${timestamp}.csv`;
              
              if (qualifiedCandidates.length > 0) {
                const headers = Object.keys(qualifiedCandidates[0]);
                const csvLines = [headers.join(',')];
                
                qualifiedCandidates.forEach(record => {
                  const row = headers.map(header => {
                    const value = record[header] || '';
                    return `"${String(value).replace(/"/g, '""')}"`;
                  });
                  csvLines.push(row.join(','));
                });
                
                const desktopPath = path.join(os.homedir(), 'Desktop');
                const filepath = path.join(desktopPath, filename);
                
                fs.writeFileSync(filepath, csvLines.join('\n'));
                console.log(`\n🎉 SUCCESS! ${qualifiedCandidates.length} qualified candidates exported to:`);
                console.log(`📁 ${filepath}`);
                console.log(`\n🎯 These are exactly the people you need for CloudCaddie!`);
              }
              
            } else {
              console.log(`\n⚠️  No qualified candidates found among ${salesforceArchitects.length} Salesforce Solution Architects`);
              console.log(`💡 Consider expanding criteria or manual review of the ${salesforceArchitects.length} Salesforce candidates`);
              
              // Export Salesforce architects for manual review
              if (salesforceArchitects.length > 0 && salesforceArchitects.length <= 100) {
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const filename = `Salesforce_Solution_Architects_For_Review_${timestamp}.csv`;
                
                const headers = Object.keys(salesforceArchitects[0]);
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
                console.log(`📁 ${salesforceArchitects.length} Salesforce Solution Architects exported for manual review: ${filepath}`);
              }
            }
            
            return;
            
          } else if (status === 'failed') {
            throw new Error(`Search failed: ${JSON.stringify(statusResponse.data)}`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Status check ${attempt} failed: ${error.message}`);
      }
    }
    
    throw new Error('Search timed out after 30 minutes');
    
  } catch (error) {
    console.error('❌ Smart search failed:', error.message);
  }
}

async function tryMoreSpecificSearch() {
  console.log('\n🎯 TRYING MORE SPECIFIC SEARCH: "Senior Solution Architect"');
  
  const filter = {
    "name": "position", 
    "value": "Senior Solution Architect",
    "operator": "includes"
  };
  
  // Same logic but with more specific title
  // [Implementation would be similar but with the more specific filter]
  console.log('💡 This would filter for "Senior Solution Architect" to get fewer results');
  console.log('📋 For now, let\'s see how the current search performs');
}

// Execute the search
smartTargetedSearch(); 