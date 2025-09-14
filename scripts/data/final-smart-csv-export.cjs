#!/usr/bin/env node

/**
 * 🎯 FINAL SMART CSV EXPORT - Using Validated Fields
 * 
 * Based on actual dataset metadata, creates working filters
 * and exports to CSV without wasting money on failed attempts.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

// Dataset IDs (validated working)
const DATASETS = {
  linkedinCompanies: "gd_l1viktl72bvl7bjuj0",
  linkedinPeople: "gd_ld7ll037kqy322v05", 
  b2bEnrichment: "gd_l1vikfnt1wgvvqz95w",
};

// Validated field names from metadata
const VALIDATED_FIELDS = {
  linkedinPeople: ['id', 'name', 'city', 'country_code', 'position', 'about', 'posts'],
  linkedinCompanies: ['name', 'about', 'company_size', 'country_code', 'industry', 'description'],
};

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
            reject(new Error(`API error: ${res.statusCode} - ${data}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

/**
 * SMART SALESFORCE SOLUTION ARCHITECT SEARCH
 * Using validated field names to avoid failed snapshots
 */
function createSalesforceArchitectFilter() {
  console.log('🎯 Creating Salesforce Solution Architect filter...');
  
  // Approach 1: Exact phrase matching (more precise, less results)
  const exactPhraseFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "operator": "includes", 
        "value": "salesforce solution architect"
      },
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "operator": "includes",
            "value": "nonprofit"
          },
          {
            "name": "position", 
            "operator": "includes",
            "value": "nonprofit"
          }
        ]
      },
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "operator": "includes", 
            "value": "fundraising"
          },
          {
            "name": "position",
            "operator": "includes",
            "value": "fundraising"
          }
        ]
      }
    ]
  };

  // Approach 2: Individual keywords (more flexible, more results)
  const keywordFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "position",
        "operator": "includes",
        "value": "salesforce"
      },
      {
        "name": "position", 
        "operator": "includes",
        "value": "solution"
      },
      {
        "name": "position",
        "operator": "includes",
        "value": "architect"
      },
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "operator": "includes",
            "value": "nonprofit"
          },
          {
            "name": "about",
            "operator": "includes",
            "value": "fundraising"
          }
        ]
      }
    ]
  };

  return { exactPhraseFilter, keywordFilter };
}

/**
 * STEP 1: Create filtered snapshot
 */
async function createSnapshot(datasetId, filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${datasetId}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const url = 'https://api.brightdata.com/datasets/filter';
  
  const payload = {
    dataset_id: datasetId,
    filter: filter,
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
      const url = `https://api.brightdata.com/datasets/snapshot/${snapshotId}`;
      const status = await makeRequest(url);
      
      console.log(`📊 Snapshot status: ${status.status}`);
      
      if (status.status === 'completed') {
        console.log('✅ Snapshot completed successfully!');
        return status;
      } else if (status.status === 'failed') {
        throw new Error(`Snapshot failed: ${status.error || 'Unknown error'}`);
      }
      
      // Wait 10 seconds before checking again
      await new Promise(resolve => setTimeout(resolve, 10000));
      
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
  
  const url = `https://api.brightdata.com/datasets/download/${snapshotId}`;
  
  try {
    const data = await makeRequest(url);
    console.log(`✅ Downloaded ${Array.isArray(data) ? data.length : 'unknown'} records`);
    return data;
  } catch (error) {
    console.error(`❌ Download failed: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 4: Convert to CSV and save to desktop
 */
function saveAsCSV(data, filename = 'salesforce-architects') {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('❌ No data to save');
    return;
  }

  console.log(`💾 Converting ${data.length} records to CSV...`);
  
  // Get all unique keys from all objects
  const allKeys = new Set();
  data.forEach(record => {
    Object.keys(record).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys);
  
  // Create CSV content
  const csvLines = [
    // Header row
    headers.map(header => `"${header}"`).join(','),
    // Data rows
    ...data.map(record => 
      headers.map(header => {
        const value = record[header];
        if (value === null || value === undefined) return '""';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    )
  ];
  
  const csvContent = csvLines.join('\n');
  
  // Save to desktop with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const csvFilename = `${filename}-${timestamp}.csv`;
  const csvPath = path.join(os.homedir(), 'Desktop', csvFilename);
  
  fs.writeFileSync(csvPath, csvContent, 'utf8');
  
  console.log(`✅ CSV saved: ${csvPath}`);
  console.log(`📊 Records: ${data.length}`);
  console.log(`📋 Fields: ${headers.length}`);
  
  return csvPath;
}

/**
 * MAIN EXPORT FUNCTION
 */
async function exportSalesforceArchitects(approach = 'exact') {
  console.log('🚀 SALESFORCE SOLUTION ARCHITECT EXPORT');
  console.log('========================================');
  
  try {
    const filters = createSalesforceArchitectFilter();
    const filter = approach === 'exact' ? filters.exactPhraseFilter : filters.keywordFilter;
    const description = approach === 'exact' ? 'Exact Phrase Search' : 'Keyword Search';
    
    // Step 1: Create snapshot
    const snapshotId = await createSnapshot(
      DATASETS.linkedinPeople, 
      filter, 
      description
    );
    
    // Step 2: Wait for completion
    await waitForSnapshot(snapshotId);
    
    // Step 3: Download data
    const data = await downloadSnapshot(snapshotId);
    
    // Step 4: Save as CSV
    const csvPath = saveAsCSV(data, `salesforce-architects-${approach}`);
    
    console.log('🎉 EXPORT COMPLETE!');
    console.log(`📁 File: ${csvPath}`);
    
    return csvPath;
    
  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const approach = process.argv[2] || 'exact';
  
  if (!['exact', 'keyword'].includes(approach)) {
    console.log('Usage: node final-smart-csv-export.cjs [exact|keyword]');
    console.log('  exact    - "salesforce solution architect" + nonprofit + fundraising');
    console.log('  keyword  - salesforce + solution + architect + (nonprofit OR fundraising)');
    process.exit(1);
  }
  
  exportSalesforceArchitects(approach)
    .then(path => {
      console.log(`✅ Success! CSV saved to: ${path}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { exportSalesforceArchitects }; 