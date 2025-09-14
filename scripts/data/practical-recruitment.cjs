#!/usr/bin/env node

/**
 * 🎯 PRACTICAL SALESFORCE RECRUITMENT
 * 
 * Strategy: Get broad sample of professionals using common names,
 * then filter locally for Salesforce Solution Architects with 
 * nonprofit/fundraising experience.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_PEOPLE_DATASET = "gd_ld7ll037kqy322v05";

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
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * STEP 1: Get professionals using common names
 */
async function getProfessionalSample(commonName = "michael") {
  console.log(`🔄 Getting professional sample using name: "${commonName}"`);
  
  const filter = {
    "name": "name",
    "operator": "includes",
    "value": commonName
  };
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
    records_limit: 500  // Get a good sample size
  };

  console.log(`📊 Creating snapshot with filter: ${JSON.stringify(filter, null, 2)}`);
  
  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Snapshot created: ${response.snapshot_id}`);
      return response.snapshot_id;
    } else {
      throw new Error('No snapshot_id in response');
    }
  } catch (error) {
    console.error(`❌ Snapshot creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 2: Wait for snapshot completion
 */
async function waitForSnapshot(snapshotId) {
  console.log(`⏳ Waiting for snapshot: ${snapshotId}`);
  
  for (let i = 0; i < 60; i++) {  // 5 minutes max
    try {
      const status = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
      
      console.log(`📊 Status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot ready!');
        return status;
      } else if (status.status === 'failed') {
        const warning = status.warning || 'Unknown error';
        throw new Error(`Snapshot failed: ${warning}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Snapshot timeout');
}

/**
 * STEP 3: Download and parse data
 */
async function downloadData(snapshotId) {
  console.log(`⬇️ Downloading data: ${snapshotId}`);
  
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    const response = await makeRequest(url);
    
    // Parse JSONL format
    const records = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const record = JSON.parse(line);
          records.push(record);
        } catch (e) {
          // Skip invalid lines
        }
      }
    }
    
    console.log(`✅ Downloaded ${records.length} professional profiles`);
    return records;
    
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 4: Filter for Salesforce Solution Architects locally
 */
function filterForSalesforceArchitects(professionals) {
  console.log(`🎯 Filtering ${professionals.length} profiles for Salesforce Solution Architects...`);
  
  const candidates = professionals
    .map(profile => {
      const position = (profile.position || '').toLowerCase();
      const about = (profile.about || '').toLowerCase();
      const combined = position + ' ' + about;
      
      // Score the candidate
      const scores = {
        salesforce: combined.includes('salesforce') ? 1 : 0,
        solution: combined.includes('solution') ? 1 : 0,
        architect: combined.includes('architect') ? 1 : 0,
        nonprofit: combined.includes('nonprofit') || combined.includes('non-profit') ? 1 : 0,
        fundraising: combined.includes('fundraising') || combined.includes('fundraiser') ? 1 : 0,
        cloud: combined.includes('cloud') ? 1 : 0,
      };
      
      const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
      
      return {
        ...profile,
        scores,
        totalScore,
        linkedin_url: profile.id ? `https://linkedin.com/in/${profile.id}` : '',
        isRelevant: totalScore >= 2  // Must have at least 2 relevant keywords
      };
    })
    .filter(candidate => candidate.isRelevant)
    .sort((a, b) => b.totalScore - a.totalScore);  // Best matches first
  
  console.log(`🎯 Found ${candidates.length} relevant candidates`);
  console.log(`🏆 Top scores: ${candidates.slice(0, 5).map(c => c.totalScore).join(', ')}`);
  
  return candidates;
}

/**
 * STEP 5: Save recruitment CSV
 */
function saveRecruitmentCSV(candidates) {
  if (candidates.length === 0) {
    console.log('❌ No candidates to save');
    return;
  }

  console.log(`💾 Saving ${candidates.length} candidates to CSV...`);
  
  const csvData = candidates.map(candidate => ({
    // CANDIDATE INFO
    full_name: candidate.name || '',
    linkedin_url: candidate.linkedin_url,
    current_position: candidate.position || '',
    location: candidate.city || '',
    country: candidate.country_code || '',
    
    // SCORING
    total_score: candidate.totalScore,
    has_salesforce: candidate.scores.salesforce ? 'YES' : 'NO',
    has_solution: candidate.scores.solution ? 'YES' : 'NO',
    has_architect: candidate.scores.architect ? 'YES' : 'NO',
    has_nonprofit: candidate.scores.nonprofit ? 'YES' : 'NO',
    has_fundraising: candidate.scores.fundraising ? 'YES' : 'NO',
    has_cloud: candidate.scores.cloud ? 'YES' : 'NO',
    
    // DETAILS FOR REVIEW
    about_summary: (candidate.about || '').substring(0, 200) + '...',
    raw_position: candidate.position || '',
    profile_id: candidate.id || ''
  }));
  
  // Create CSV
  const headers = Object.keys(csvData[0]);
  const csvLines = [
    headers.map(h => `"${h}"`).join(','),
    ...csvData.map(row => 
      headers.map(h => {
        const value = row[h];
        return `"${String(value || '').replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to desktop
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `salesforce-architects-${timestamp}.csv`;
  const filepath = path.join(os.homedir(), 'Desktop', filename);
  
  fs.writeFileSync(filepath, csvContent, 'utf8');
  
  console.log(`✅ RECRUITMENT CSV SAVED: ${filepath}`);
  console.log(`👥 Total candidates: ${candidates.length}`);
  console.log(`🎯 High-score (4+ points): ${candidates.filter(c => c.totalScore >= 4).length}`);
  console.log(`🔗 With LinkedIn URLs: ${candidates.filter(c => c.linkedin_url).length}`);
  
  return filepath;
}

/**
 * MAIN FUNCTION
 */
async function runRecruitment(commonName = "michael") {
  console.log('🚀 SALESFORCE SOLUTION ARCHITECT RECRUITMENT');
  console.log('===========================================');
  console.log(`Strategy: Sample professionals named "${commonName}", filter locally`);
  
  try {
    // Step 1: Get professional sample
    const snapshotId = await getProfessionalSample(commonName);
    
    // Step 2: Wait for completion
    await waitForSnapshot(snapshotId);
    
    // Step 3: Download data
    const professionals = await downloadData(snapshotId);
    
    // Step 4: Filter for candidates
    const candidates = filterForSalesforceArchitects(professionals);
    
    // Step 5: Save CSV
    const csvPath = saveRecruitmentCSV(candidates);
    
    console.log('🎉 RECRUITMENT COMPLETE!');
    return csvPath;
    
  } catch (error) {
    console.error(`❌ Recruitment failed: ${error.message}`);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const commonName = process.argv[2] || 'michael';
  
  console.log(`🎯 Searching for professionals named: "${commonName}"`);
  console.log('💡 Try common names like: michael, david, sarah, jennifer, john, etc.');
  
  runRecruitment(commonName)
    .then(path => {
      console.log(`✅ Success! Check your recruitment CSV: ${path}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { runRecruitment }; 