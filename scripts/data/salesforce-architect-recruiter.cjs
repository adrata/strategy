#!/usr/bin/env node

/**
 * 🎯 SALESFORCE SOLUTION ARCHITECT RECRUITER
 * 
 * Uses Brightdata API to find candidates for your specific role:
 * "Salesforce Solution Architect with nonprofit cloud and fundraising experience"
 * 
 * Based on official API documentation with correct filter syntax.
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
 * RECRUITMENT FILTERS: Salesforce Solution Architect Role
 * Using API documentation syntax for Text field filtering
 */
function createRecruitmentFilters() {
  console.log('🎯 Creating recruitment filters for Salesforce Solution Architect...');
  
  // APPROACH 1: Broad Salesforce Professionals (cast wide net first)
  const salesforceProfessionalsFilter = {
    "name": "name",  // Try basic name search first
    "operator": "includes",
    "value": "salesforce"
  };

  // APPROACH 2: Try filtering by validated fields we know exist
  // Based on metadata: id, name, city, country_code, position, about
  const positionBasedFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "name",
        "operator": "includes", 
        "value": "salesforce"
      }
    ]
  };

  // APPROACH 3: Simple test filter to see what works
  const basicTestFilter = {
    "name": "country_code",
    "operator": "=",
    "value": "US"
  };

  return {
    salesforceProfessionalsFilter,
    positionBasedFilter,
    basicTestFilter
  };
}

/**
 * STEP 1: Create filtered snapshot
 */
async function createSnapshot(filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${LINKEDIN_PEOPLE_DATASET}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const url = 'https://api.brightdata.com/datasets/filter';
  
  const payload = {
    dataset_id: LINKEDIN_PEOPLE_DATASET,
    filter: filter,
    records_limit: 100  // Limit for cost control during testing
  };

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (response.snapshot_id) {
      console.log(`✅ Snapshot created: ${response.snapshot_id}`);
      return response.snapshot_id;
    } else {
      throw new Error('No snapshot_id in response: ' + JSON.stringify(response));
    }
  } catch (error) {
    console.error(`❌ Snapshot creation failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 2: Wait for snapshot completion
 */
async function waitForSnapshot(snapshotId, maxWaitMs = 300000) {
  console.log(`⏳ Waiting for snapshot completion: ${snapshotId}`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}`;
      const status = await makeRequest(url);
      
      console.log(`📊 Snapshot status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot completed successfully!');
        return status;
      } else if (status.status === 'failed' || status.status === 'error') {
        throw new Error(`Snapshot failed: ${status.error || 'Unknown error'}`);
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
 * STEP 3: Download snapshot data
 */
async function downloadSnapshot(snapshotId) {
  console.log(`⬇️ Downloading snapshot: ${snapshotId}`);
  
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
          console.log(`⚠️ Skipping invalid JSON line`);
        }
      }
    }
    
    console.log(`✅ Downloaded ${records.length} candidate records`);
    return records;
    
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 4: Format for recruitment CSV
 */
function saveRecruitmentCSV(data, filename = 'salesforce-architect-candidates') {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('❌ No candidates found');
    return;
  }

  console.log(`💼 Processing ${data.length} candidates for recruitment...`);
  
  // Format for recruitment with LinkedIn profile URLs
  const candidates = data.map(record => ({
    // CANDIDATE BASICS
    full_name: record.name || '',
    linkedin_profile: record.id ? `https://linkedin.com/in/${record.id}` : '',
    
    // JOB DETAILS  
    current_position: record.position || '',
    about_summary: record.about || '',
    
    // LOCATION
    city: record.city || '',
    country: record.country_code || '',
    
    // EXPERIENCE INDICATORS (for manual review)
    has_salesforce: (record.position || '').toLowerCase().includes('salesforce') ? 'YES' : 'NO',
    has_solution: (record.position || '').toLowerCase().includes('solution') ? 'YES' : 'NO', 
    has_architect: (record.position || '').toLowerCase().includes('architect') ? 'YES' : 'NO',
    has_nonprofit: ((record.position || '') + (record.about || '')).toLowerCase().includes('nonprofit') ? 'YES' : 'NO',
    has_fundraising: ((record.position || '') + (record.about || '')).toLowerCase().includes('fundraising') ? 'YES' : 'NO',
    
    // QUALIFICATION SCORE (simple scoring)
    qualification_score: [
      (record.position || '').toLowerCase().includes('salesforce'),
      (record.position || '').toLowerCase().includes('solution'),
      (record.position || '').toLowerCase().includes('architect'),
      ((record.position || '') + (record.about || '')).toLowerCase().includes('nonprofit'),
      ((record.position || '') + (record.about || '')).toLowerCase().includes('fundraising')
    ].filter(Boolean).length,
    
    // RAW DATA
    raw_id: record.id || '',
    raw_position: record.position || '',
    raw_about: record.about || ''
  }));
  
  // Sort by qualification score (highest first)
  candidates.sort((a, b) => b.qualification_score - a.qualification_score);
  
  // Create CSV
  const headers = Object.keys(candidates[0]);
  const csvLines = [
    headers.map(header => `"${header}"`).join(','),
    ...candidates.map(candidate => 
      headers.map(header => {
        const value = candidate[header];
        if (value === null || value === undefined) return '""';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to desktop
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvFilename = `${filename}-${timestamp}.csv`;
  const csvPath = path.join(os.homedir(), 'Desktop', csvFilename);
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`✅ RECRUITMENT CSV SAVED: ${csvPath}`);
  console.log(`👥 Total candidates: ${candidates.length}`);
  console.log(`🎯 High-score candidates (4-5 points): ${candidates.filter(c => c.qualification_score >= 4).length}`);
  console.log(`🔗 LinkedIn profiles included: ${candidates.filter(c => c.linkedin_profile).length}`);
  
  return csvPath;
}

/**
 * MAIN RECRUITMENT FUNCTION
 */
async function findSalesforceArchitects(approach = 'broad') {
  console.log('🚀 SALESFORCE SOLUTION ARCHITECT RECRUITMENT');
  console.log('===========================================');
  
  try {
    const filters = createRecruitmentFilters();
    
    let filter, description;
    switch (approach) {
      case 'broad':
        filter = filters.salesforceProfessionalsFilter;
        description = 'Broad Salesforce Professionals Search';
        break;
      case 'position':
        filter = filters.positionBasedFilter;  
        description = 'Position-Based Salesforce Search';
        break;
      case 'test':
        filter = filters.basicTestFilter;
        description = 'Basic Test Filter (US candidates)';
        break;
      default:
        throw new Error('Invalid approach');
    }
    
    const snapshotId = await createSnapshot(filter, description);
    await waitForSnapshot(snapshotId);
    const data = await downloadSnapshot(snapshotId);
    const csvPath = saveRecruitmentCSV(data);
    
    console.log('🎉 RECRUITMENT SEARCH COMPLETE!');
    console.log(`📁 Candidates file: ${csvPath}`);
    
    return csvPath;
    
  } catch (error) {
    console.error(`❌ Recruitment search failed: ${error.message}`);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const approach = process.argv[2] || 'broad';
  
  if (!['broad', 'position', 'test'].includes(approach)) {
    console.log('Usage: node salesforce-architect-recruiter.cjs [broad|position|test]');
    console.log('  broad    - Search for any Salesforce-related professionals');
    console.log('  position - Search using position field filtering');
    console.log('  test     - Basic test filter to verify API works');
    process.exit(1);
  }
  
  findSalesforceArchitects(approach)
    .then(path => {
      console.log(`✅ Success! Recruitment CSV saved to: ${path}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { findSalesforceArchitects }; 