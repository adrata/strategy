#!/usr/bin/env node

/**
 * 🚀 FAST SALESFORCE NONPROFIT RECRUITMENT
 * 
 * SIMPLIFIED & FOCUSED:
 * - "Salesforce Solution Architect" with nonprofit work experience
 * - Geographic focus: US/Canada only
 * - Fast, direct search with minimal complexity
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
          console.log(`📡 Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            console.log(`❌ Error Response: ${data}`);
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
 * SIMPLIFIED FILTER: Core requirements only
 */
function createSimplifiedFilter() {
  // APPROACH 1: Salesforce + Nonprofit (simplified)
  const salesforceNonprofitFilter = {
    "operator": "and",
    "filters": [
      // Salesforce experience
      {
        "name": "position",
        "value": "salesforce",
        "operator": "includes"
      },
      // Nonprofit work experience
      {
        "name": "experience",
        "value": "nonprofit",
        "operator": "includes"
      },
      // Geographic focus: US/Canada
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "value": "US",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "CA",
            "operator": "includes"
          }
        ]
      }
    ]
  };

  // APPROACH 2: Solution Architect + Nonprofit (simplified)
  const architectNonprofitFilter = {
    "operator": "and",
    "filters": [
      // Solution Architect in position
      {
        "name": "position",
        "value": "solution architect",
        "operator": "includes"
      },
      // Nonprofit work experience
      {
        "name": "experience",
        "value": "nonprofit",
        "operator": "includes"
      },
      // Geographic focus: US/Canada
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "value": "US",
            "operator": "includes"
          },
          {
            "name": "about",
            "value": "CA",
            "operator": "includes"
          }
        ]
      }
    ]
  };

  return { salesforceNonprofitFilter, architectNonprofitFilter };
}

/**
 * Create snapshot with timeout handling
 */
async function createSnapshot(filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const payload = {
    "dataset_id": LINKEDIN_PEOPLE_DATASET,
    "filter": filter,
    "records_limit": 50  // Smaller sample for faster processing
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
 * Wait for snapshot with shorter timeout
 */
async function waitForSnapshot(snapshotId) {
  console.log(`⏳ Waiting for snapshot completion: ${snapshotId}`);
  
  for (let i = 0; i < 30; i++) { // Reduced from 60 to 30 attempts
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
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Faster polling
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Snapshot timeout after 1 minute');
}

/**
 * Download and process results
 */
async function downloadAndSave(snapshotId, filename) {
  console.log(`⬇️ Downloading: ${snapshotId}`);
  
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  try {
    const data = await makeRequest(url);
    
    if (!data || !Array.isArray(data)) {
      console.log('❌ No valid data received');
      return null;
    }

    console.log(`📊 Found ${data.length} candidates`);
    
    // Save to desktop
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filepath = path.join(desktopPath, filename);
    
    // Convert to CSV
    if (data.length > 0) {
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
        console.log(`   LinkedIn: ${candidate.linkedin_profile_url || 'N/A'}`);
      });
      
      return data.length;
    }
    
    return 0;
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * MAIN EXECUTION
 */
async function main() {
  console.log('\n🚀 FAST SALESFORCE NONPROFIT RECRUITMENT');
  console.log('========================================');
  console.log('Target: Salesforce professionals with nonprofit work experience');
  console.log('Geographic: US/Canada only');
  console.log('Approach: Simplified, fast search\n');

  const { salesforceNonprofitFilter, architectNonprofitFilter } = createSimplifiedFilter();
  
  try {
    // Try approach 1: Salesforce + Nonprofit
    console.log('\n1️⃣ SEARCHING: Salesforce + Nonprofit Experience');
    const snapshot1 = await createSnapshot(salesforceNonprofitFilter, 'Salesforce + Nonprofit');
    await waitForSnapshot(snapshot1);
    const count1 = await downloadAndSave(snapshot1, 'salesforce-nonprofit-candidates.csv');
    
    // Try approach 2: Solution Architect + Nonprofit  
    console.log('\n2️⃣ SEARCHING: Solution Architect + Nonprofit Experience');
    const snapshot2 = await createSnapshot(architectNonprofitFilter, 'Solution Architect + Nonprofit');
    await waitForSnapshot(snapshot2);
    const count2 = await downloadAndSave(snapshot2, 'solution-architect-nonprofit-candidates.csv');
    
    console.log('\n🎉 RECRUITMENT COMPLETE!');
    console.log(`📊 Salesforce + Nonprofit: ${count1} candidates`);
    console.log(`📊 Solution Architect + Nonprofit: ${count2} candidates`);
    console.log('📁 Results saved to Desktop');
    
  } catch (error) {
    console.error(`❌ Recruitment failed: ${error.message}`);
    process.exit(1);
  }
}

main(); 