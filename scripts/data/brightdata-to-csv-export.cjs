#!/usr/bin/env node

/**
 * 🌐 BRIGHTDATA FILTER TO CSV EXPORTER
 * 
 * This script uses the Brightdata API to:
 * 1. Create filtered snapshots using complex filter operators
 * 2. Wait for snapshot completion
 * 3. Download the snapshot data
 * 4. Convert to CSV format
 * 5. Save to desktop
 * 
 * Following Monaco pipeline patterns for production reliability.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Brightdata Configuration (from Monaco pipeline)
const BRIGHTDATA_CONFIG = {
  apiKey: process.env.BRIGHTDATA_API_KEY || "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e",
  baseUrl: "https://api.brightdata.com/datasets",
  timeout: 60000, // 60 seconds timeout
};

// Dataset IDs from Monaco pipeline
const DATASET_IDS = {
  linkedinCompanies: "gd_l1viktl72bvl7bjuj0",
  linkedinPeople: "gd_ld7ll037kqy322v05", 
  b2bEnrichment: "gd_l1vikfnt1wgvvqz95w",
  competitorAnalysis: "gd_lgfcz12mk6og7lvhs",
  newsPress: "gd_lnsxoxzi1omrwnka5r",
  marketResearch: "gd_lgfcz12mk6og7lvhs",
  techStack: "gd_l88xvdka1uao86xvlb",
  builtwithData: "gd_ld73zt91j10sphddj",
  g2Reviews: "gd_l88xvdka1uao86xvlb",
};

/**
 * Make HTTPS request to Brightdata API
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${BRIGHTDATA_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Adrata-Brightdata-CSV-Exporter/1.0',
        ...options.headers,
      },
      timeout: BRIGHTDATA_CONFIG.timeout,
    };

    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    
    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          console.log(`📡 Response Status: ${res.statusCode}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Try to parse as JSON, fallback to raw text
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(data);
            }
          } else {
            reject(new Error(`API error: ${res.statusCode} ${res.statusMessage}\n${data}`));
          }
        } catch (error) {
          reject(new Error(`Parse error: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * STEP 1: Create filtered snapshot (following Monaco pipeline pattern)
 */
async function createSnapshot(datasetId, filter) {
  console.log('🔄 Step 1: Creating filtered snapshot...');
  console.log(`📊 Dataset ID: ${datasetId}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const url = `${BRIGHTDATA_CONFIG.baseUrl}/filter`;
  
  // Use JSON payload format like Monaco pipeline
  const payload = {
    dataset_id: datasetId,
    filter: filter
  };
  
  console.log(`📦 Payload: ${JSON.stringify(payload, null, 2)}`);

  try {
    const response = await makeRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });
    
    console.log('✅ Snapshot creation response:', response);
    
    if (response.snapshot_id) {
      console.log(`✅ Snapshot created with ID: ${response.snapshot_id}`);
      return response.snapshot_id;
    } else {
      throw new Error('No snapshot_id in response');
    }
  } catch (error) {
    console.error('❌ Snapshot creation failed:', error.message);
    throw error;
  }
}

/**
 * STEP 2: Wait for snapshot to be ready
 */
async function waitForSnapshot(snapshotId, maxAttempts = 20) {
  console.log('🔄 Step 2: Waiting for snapshot completion...');
  
  const url = `${BRIGHTDATA_CONFIG.baseUrl}/snapshots/${snapshotId}`;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`🔍 Checking snapshot status (attempt ${attempt}/${maxAttempts})`);
    
    try {
      const response = await makeRequest(url);
      
      console.log(`📊 Snapshot status: ${response.status || 'unknown'}`);
      
      if (response.status === 'ready') {
        console.log('✅ Snapshot is ready for download!');
        return response;
      } else if (response.status === 'failed') {
        throw new Error(`Snapshot failed: ${response.error || 'Unknown error'}`);
      }
      
      // Wait 3 seconds before next check
      console.log('⏳ Waiting 3 seconds before next check...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Error checking snapshot (attempt ${attempt}):`, error.message);
      
      if (attempt === maxAttempts) {
        throw new Error(`Snapshot check failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  throw new Error(`Snapshot not ready after ${maxAttempts} attempts`);
}

/**
 * STEP 3: Download snapshot data
 */
async function downloadSnapshot(snapshotId, maxAttempts = 10) {
  console.log('🔄 Step 3: Downloading snapshot data...');
  
  const url = `${BRIGHTDATA_CONFIG.baseUrl}/snapshots/${snapshotId}/download`;
  
  // Wait a bit more for download to be ready
  console.log('⏳ Waiting 5 seconds for download to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`📥 Download attempt ${attempt}/${maxAttempts}`);
    
    try {
      const response = await makeRequest(url);
      
      if (response && (Array.isArray(response) || typeof response === 'object')) {
        console.log('✅ Download successful!');
        console.log(`📊 Data type: ${Array.isArray(response) ? 'Array' : 'Object'}`);
        console.log(`📊 Records count: ${Array.isArray(response) ? response.length : 'N/A'}`);
        return response;
      }
      
      // If we get a 202 response, wait and retry
      console.log('⏳ Download not ready yet, waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Download attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxAttempts) {
        throw new Error(`Download failed after ${maxAttempts} attempts: ${error.message}`);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  throw new Error(`Download failed after ${maxAttempts} attempts`);
}

/**
 * STEP 4: Convert data to CSV
 */
function convertToCSV(data, filename = 'brightdata-export') {
  console.log('🔄 Step 4: Converting to CSV...');
  
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('No data to convert to CSV');
  }
  
  // Get all unique headers from all objects
  const allHeaders = new Set();
  data.forEach(row => {
    if (typeof row === 'object' && row !== null) {
      Object.keys(row).forEach(key => allHeaders.add(key));
    }
  });
  
  const headers = Array.from(allHeaders);
  console.log(`📊 CSV headers (${headers.length}):`, headers.slice(0, 10).join(', ') + (headers.length > 10 ? '...' : ''));
  
  // Create CSV content
  const csvLines = [];
  
  // Add header row
  csvLines.push(headers.map(h => `"${h}"`).join(','));
  
  // Add data rows
  data.forEach((row, index) => {
    if (typeof row === 'object' && row !== null) {
      const csvRow = headers.map(header => {
        const value = row[header];
        
        if (value === null || value === undefined) {
          return '""';
        } else if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
      });
      
      csvLines.push(csvRow.join(','));
    }
  });
  
  console.log(`✅ CSV created with ${csvLines.length - 1} data rows`);
  return csvLines.join('\n');
}

/**
 * STEP 5: Save CSV to desktop
 */
function saveToDesktop(csvContent, filename = 'brightdata-export') {
  console.log('🔄 Step 5: Saving CSV to desktop...');
  
  const desktopPath = path.join(os.homedir(), 'Desktop');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `${filename}-${timestamp}.csv`;
  const filePath = path.join(desktopPath, fileName);
  
  try {
    fs.writeFileSync(filePath, csvContent, 'utf8');
    console.log(`✅ CSV saved to: ${filePath}`);
    console.log(`📊 File size: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB`);
    return filePath;
  } catch (error) {
    console.error('❌ Failed to save CSV:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function exportBrightdataToCSV(datasetId, filter, filename = 'brightdata-export') {
  console.log('🚀 BRIGHTDATA TO CSV EXPORT STARTED');
  console.log('=====================================');
  console.log('');
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create snapshot
    const snapshotId = await createSnapshot(datasetId, filter);
    console.log('');
    
    // Step 2: Wait for completion
    await waitForSnapshot(snapshotId);
    console.log('');
    
    // Step 3: Download data
    const data = await downloadSnapshot(snapshotId);
    console.log('');
    
    // Step 4: Convert to CSV
    const csvContent = convertToCSV(data, filename);
    console.log('');
    
    // Step 5: Save to desktop
    const filePath = saveToDesktop(csvContent, filename);
    console.log('');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log('🎉 EXPORT COMPLETED SUCCESSFULLY!');
    console.log('=================================');
    console.log(`✅ File saved: ${filePath}`);
    console.log(`✅ Records exported: ${Array.isArray(data) ? data.length : 'N/A'}`);
    console.log(`✅ Total time: ${duration} seconds`);
    console.log(`✅ Snapshot ID: ${snapshotId}`);
    
    return {
      success: true,
      filePath,
      snapshotId,
      recordCount: Array.isArray(data) ? data.length : 0,
      duration: parseFloat(duration),
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.error('');
    console.error('❌ EXPORT FAILED');
    console.error('================');
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Duration: ${duration} seconds`);
    
    throw error;
  }
}

/**
 * EXAMPLE USAGE FUNCTIONS
 */

// Example 1: Salesforce Solution Architect with nonprofit and fundraising experience
async function searchSalesforceArchitects() {
  const filter = {
    "operator": "and",
    "filters": [
      {
        "operator": "or",
        "filters": [
          {
            "name": "title",
            "operator": "includes",
            "value": "salesforce solution architect"
          },
          {
            "operator": "and",
            "filters": [
              {
                "name": "title",
                "operator": "includes",
                "value": "salesforce"
              },
              {
                "name": "title",
                "operator": "includes",
                "value": "architect"
              }
            ]
          }
        ]
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
            "name": "experience",
            "operator": "includes",
            "value": "nonprofit"
          },
          {
            "name": "skills",
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
            "name": "experience",
            "operator": "includes",
            "value": "fundraising"
          },
          {
            "name": "skills",
            "operator": "includes",
            "value": "fundraising"
          }
        ]
      }
    ]
  };
  
  return await exportBrightdataToCSV(
    DATASET_IDS.linkedinPeople, 
    filter, 
    'salesforce-solution-architects-nonprofit'
  );
}

// Example 2: Test with simple company name search (verified working)
async function searchTechCompanies() {
  const filter = {
    "name": "name",
    "operator": "=",
    "value": "Microsoft"
  };
  
  return await exportBrightdataToCSV(
    DATASET_IDS.linkedinCompanies, 
    filter, 
    'microsoft-company-data'
  );
}

// Example 3: B2B SaaS companies for competitive analysis
async function searchB2BSaasCompetitors() {
  const filter = {
    "operator": "and",
    "filters": [
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "operator": "includes",
            "value": "B2B"
          },
          {
            "name": "about",
            "operator": "includes",
            "value": "SaaS"
          },
          {
            "name": "about",
            "operator": "includes",
            "value": "software as a service"
          }
        ]
      },
      {
        "operator": "or",
        "filters": [
          {
            "name": "about",
            "operator": "includes",
            "value": "sales"
          },
          {
            "name": "about",
            "operator": "includes",
            "value": "CRM"
          },
          {
            "name": "about",
            "operator": "includes",
            "value": "intelligence"
          }
        ]
      },
      {
        "name": "employees_in_linkedin",
        "operator": ">=",
        "value": "50"
      }
    ]
  };
  
  return await exportBrightdataToCSV(
    DATASET_IDS.linkedinCompanies, 
    filter, 
    'b2b-saas-competitors'
  );
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎯 BRIGHTDATA CSV EXPORTER');
    console.log('==========================');
    console.log('');
    console.log('Usage Examples:');
    console.log('  node brightdata-to-csv-export.js salesforce    # Search Salesforce architects');
    console.log('  node brightdata-to-csv-export.js tech          # Search tech companies');
    console.log('  node brightdata-to-csv-export.js competitors   # Search B2B SaaS competitors');
    console.log('');
    console.log('Available Datasets:');
    Object.entries(DATASET_IDS).forEach(([name, id]) => {
      console.log(`  ${name.padEnd(20)} ${id}`);
    });
    return;
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'salesforce':
      case 'sf':
        await searchSalesforceArchitects();
        break;
        
      case 'tech':
      case 'technology':
        await searchTechCompanies();
        break;
        
      case 'competitors':
      case 'comp':
        await searchB2BSaasCompetitors();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Available commands: salesforce, tech, competitors');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Export functions for use as module
module.exports = {
  exportBrightdataToCSV,
  searchSalesforceArchitects,
  searchTechCompanies,
  searchB2BSaasCompetitors,
  DATASET_IDS,
};

// Run CLI if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
} 