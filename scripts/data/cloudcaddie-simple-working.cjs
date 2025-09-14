#!/usr/bin/env node

/**
 * 🎯 CLOUDCADDIE SIMPLE WORKING RECRUITMENT
 * 
 * SIMPLIFIED APPROACH TO AVOID TIMEOUTS:
 * - Single keyword searches rather than complex nested filters
 * - Smaller record limits
 * - Longer wait times with better error handling
 * - Focus on work experience for nonprofit
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
        ...options.headers,
      },
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          console.log(`📡 API Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            console.log(`❌ API Error: ${data}`);
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
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
 * SIMPLIFIED SEARCHES - One filter at a time to avoid complexity timeouts
 */

// SEARCH 1: Simple Salesforce search
function createSalesforceFilter() {
  return {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "value": "salesforce",
        "operator": "includes"
      }
    ]
  };
}

// SEARCH 2: Simple nonprofit experience search 
function createNonprofitExperienceFilter() {
  return {
    "operator": "and",
    "filters": [
      {
        "name": "experience",
        "value": "nonprofit",
        "operator": "includes"
      }
    ]
  };
}

// SEARCH 3: Solution architect search
function createSolutionArchitectFilter() {
  return {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "value": "solution architect",
        "operator": "includes"
      }
    ]
  };
}

/**
 * Create snapshot with minimal complexity
 */
async function createSnapshot(filter, description, limit = 25) {
  console.log(`\n🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${LINKEDIN_PEOPLE_DATASET} (115M LinkedIn people)`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": filter,
    "records_limit": limit
  };

  try {
    const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
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
 * Enhanced wait with much longer timeout and better error handling
 */
async function waitForSnapshot(snapshotId, maxAttempts = 40) {
  console.log(`⏳ Waiting for snapshot completion: ${snapshotId}`);
  console.log(`⌛ Max wait time: ${(maxAttempts * 5) / 60} minutes`);
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
      
      console.log(`📊 Attempt ${i + 1}/${maxAttempts} - Status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot ready!');
        return status;
      } else if (status.status === 'failed') {
        const warning = status.warning || 'Unknown error';
        throw new Error(`Snapshot failed: ${warning}`);
      }
      
      // Progressive backoff - wait longer as time goes on
      const waitTime = Math.min(5000 + (i * 500), 10000);
      console.log(`⏳ Waiting ${waitTime/1000}s before next check...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error(`Snapshot timeout after ${(maxAttempts * 5) / 60} minutes`);
}

/**
 * Download and save results
 */
async function downloadAndSave(snapshotId, filename) {
  console.log(`⬇️ Downloading: ${snapshotId}`);
  
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  try {
    const data = await makeRequest(url);
    
    if (!data || !Array.isArray(data)) {
      console.log('⚠️ No data received or invalid format');
      return null;
    }

    console.log(`📊 Found ${data.length} results`);
    
    if (data.length === 0) {
      console.log('ℹ️ No results for this search');
      return 0;
    }
    
    // Save to desktop
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filepath = path.join(desktopPath, filename);
    
    // Convert to CSV
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape CSV values
          return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    fs.writeFileSync(filepath, csvContent);
    console.log(`💾 Saved: ${filepath}`);
    
    // Show sample results
    console.log('\n🎯 SAMPLE RESULTS:');
    data.slice(0, 3).forEach((candidate, i) => {
      console.log(`\n${i + 1}. ${candidate.name || 'N/A'}`);
      console.log(`   Position: ${candidate.position || 'N/A'}`);
      console.log(`   Company: ${candidate.current_company_name || 'N/A'}`);
      console.log(`   Experience: ${(candidate.experience || '').substring(0, 100)}...`);
      console.log(`   LinkedIn: ${candidate.linkedin_profile_url || 'N/A'}`);
    });
    
    return data.length;
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * MAIN EXECUTION - Simple sequential searches
 */
async function main() {
  console.log('\n🚀 CLOUDCADDIE SIMPLE RECRUITMENT');
  console.log('================================');
  console.log('Strategy: Simple searches to avoid timeouts');
  console.log('Target: Build candidate list for manual filtering\n');

  const timestamp = new Date().toISOString().slice(0,16).replace(/:/g,'-');
  
  try {
    // Simple Search 1: Salesforce professionals
    console.log('\n1️⃣ SEARCH: Salesforce Professionals');
    const salesforceFilter = createSalesforceFilter();
    const snapshot1 = await createSnapshot(salesforceFilter, 'Salesforce Professionals', 50);
    await waitForSnapshot(snapshot1);
    const count1 = await downloadAndSave(snapshot1, `salesforce-professionals-${timestamp}.csv`);
    
    // Simple Search 2: Nonprofit experience
    console.log('\n2️⃣ SEARCH: Nonprofit Work Experience');
    const nonprofitFilter = createNonprofitExperienceFilter();
    const snapshot2 = await createSnapshot(nonprofitFilter, 'Nonprofit Experience', 50);
    await waitForSnapshot(snapshot2);
    const count2 = await downloadAndSave(snapshot2, `nonprofit-experience-${timestamp}.csv`);
    
    // Simple Search 3: Solution Architects  
    console.log('\n3️⃣ SEARCH: Solution Architects');
    const architectFilter = createSolutionArchitectFilter();
    const snapshot3 = await createSnapshot(architectFilter, 'Solution Architects', 50);
    await waitForSnapshot(snapshot3);
    const count3 = await downloadAndSave(snapshot3, `solution-architects-${timestamp}.csv`);
    
    console.log('\n🎉 RECRUITMENT SEARCHES COMPLETE!');
    console.log('==============================');
    console.log(`📊 Salesforce professionals: ${count1 || 0} candidates`);
    console.log(`📊 Nonprofit experience: ${count2 || 0} candidates`);
    console.log(`📊 Solution architects: ${count3 || 0} candidates`);
    console.log('\n📁 Results saved to Desktop');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Review the CSV files');
    console.log('2. Cross-reference candidates who appear in multiple lists');
    console.log('3. Manually filter for US/Canada locations');
    console.log('4. Look for nonprofit + salesforce + architecture combinations');
    console.log('5. Prioritize candidates with relevant work experience');
    
  } catch (error) {
    console.error(`❌ Recruitment failed: ${error.message}`);
    console.log('\n🔧 TROUBLESHOOTING TIPS:');
    console.log('1. Check your internet connection');
    console.log('2. Verify API key is valid');
    console.log('3. Try with smaller record limits');
    console.log('4. Check Brightdata service status');
    process.exit(1);
  }
}

main(); 