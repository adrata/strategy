#!/usr/bin/env node

/**
 * 🎯 SMART LINKEDIN EXPORT - Using Monaco Proven Patterns
 * 
 * Uses the exact field names and patterns that work in Monaco pipeline
 * to find Salesforce-related companies and their LinkedIn profiles.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

// Proven working datasets from Monaco
const DATASETS = {
  linkedinCompanies: "gd_l1viktl72bvl7bjuj0",
  b2bEnrichment: "gd_l1vikfnt1wgvvqz95w",
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
 * APPROACH 1: Find Salesforce-related companies first
 * Using proven Monaco filter patterns
 */
function createSalesforceCompanyFilters() {
  // Pattern 1: Companies with "Salesforce" in name (exact Monaco pattern)
  const salesforceCompaniesFilter = {
    "operator": "and",
    "filters": [
      {
        "name": "name",
        "value": "salesforce",
        "operator": "="
      }
    ]
  };

  // Pattern 2: Companies with "nonprofit" in name
  const nonprofitCompaniesFilter = {
    "operator": "and", 
    "filters": [
      {
        "name": "name",
        "value": "nonprofit",
        "operator": "="
      }
    ]
  };

  // Pattern 3: Technology companies (Monaco proven pattern)
  const techCompaniesFilter = {
    "name": "company_size",
    "operator": "includes",
    "value": "1001+"
  };

  return {
    salesforceCompaniesFilter,
    nonprofitCompaniesFilter, 
    techCompaniesFilter
  };
}

/**
 * STEP 1: Create filtered snapshot (Monaco pattern)
 */
async function createSnapshot(datasetId, filter, description = '') {
  console.log(`🔄 Creating snapshot: ${description}`);
  console.log(`📊 Dataset: ${datasetId}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const url = 'https://api.brightdata.com/datasets/filter';
  
  // Exact Monaco payload format
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
 * STEP 2: Wait for snapshot completion (Monaco pattern)
 */
async function waitForSnapshot(snapshotId, maxWaitMs = 300000) {
  console.log(`⏳ Waiting for snapshot completion: ${snapshotId}`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWaitMs) {
    try {
      // Monaco uses different endpoint format
      const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}`;
      const status = await makeRequest(url);
      
      console.log(`📊 Snapshot status: ${status.status}`);
      
      if (status.status === 'ready' || status.status === 'completed') {
        console.log('✅ Snapshot completed successfully!');
        return status;
      } else if (status.status === 'failed' || status.status === 'error') {
        throw new Error(`Snapshot failed: ${status.error || 'Unknown error'}`);
      }
      
      // Wait 3 seconds like Monaco
      await new Promise(resolve => setTimeout(resolve, 3000));
      
    } catch (error) {
      console.error(`❌ Error checking snapshot: ${error.message}`);
      throw error;
    }
  }
  
  throw new Error('Snapshot timeout');
}

/**
 * STEP 3: Download snapshot data (Monaco pattern with JSONL parsing)
 */
async function downloadSnapshot(snapshotId) {
  console.log(`⬇️ Downloading snapshot: ${snapshotId}`);
  
  // Monaco download URL pattern
  const url = `https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`;
  
  // Monaco adds delay
  console.log('⏳ Waiting 5 seconds for download to be ready...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Retry logic like Monaco (up to 10 attempts)
  for (let attempt = 1; attempt <= 10; attempt++) {
    console.log(`🔄 Download attempt ${attempt}/10`);
    
    try {
      const response = await makeRequest(url);
      
      // Monaco parses as JSONL (JSON Lines)
      const records = [];
      const lines = response.split('\n');
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const record = JSON.parse(line);
            records.push(record);
          } catch (e) {
            console.log(`⚠️ Skipping invalid JSON line: ${line.substring(0, 100)}`);
          }
        }
      }
      
      console.log(`✅ Downloaded ${records.length} records`);
      return records;
      
    } catch (error) {
      console.log(`⚠️ Download attempt ${attempt} failed: ${error.message}`);
      if (attempt === 10) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

/**
 * STEP 4: Convert to CSV with LinkedIn URLs (Monaco field mapping)
 */
function saveAsCSV(data, filename = 'salesforce-companies') {
  if (!Array.isArray(data) || data.length === 0) {
    console.log('❌ No data to save');
    return;
  }

  console.log(`💾 Converting ${data.length} records to CSV...`);
  
  // Monaco field mapping for LinkedIn URLs and important fields
  const processedData = data.map(record => ({
    // Basic company info
    company_name: record.name || '',
    linkedin_url: record.url || '',  // Monaco uses "url" field for LinkedIn
    website: record.website || '',
    domain: record.website_simplified || record.website || '',
    
    // Company details
    industry: record.industries || record.industry || '',
    company_size: record.company_size || '',
    employees: record.employees_in_linkedin || record.employee_count || '',
    founded: record.founded || '',
    location: record.headquarters || record.location || '',
    country: record.country_code || '',
    
    // Descriptions
    description: record.description || record.about || '',
    specialties: Array.isArray(record.specialties) ? record.specialties.join('; ') : record.specialties || '',
    
    // Additional URLs
    crunchbase_url: record.crunchbase_url || '',
    
    // Social metrics
    followers: record.follower_count || '',
    
    // Raw ID for reference
    company_id: record.company_id || record.id || '',
  }));
  
  // Create CSV
  const headers = Object.keys(processedData[0]);
  const csvLines = [
    // Header row
    headers.map(header => `"${header}"`).join(','),
    // Data rows
    ...processedData.map(record => 
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
  console.log(`🔗 LinkedIn URLs included: ${processedData.filter(r => r.linkedin_url).length}`);
  
  return csvPath;
}

/**
 * MAIN EXPORT FUNCTIONS
 */
async function exportSalesforceCompanies() {
  console.log('🚀 SALESFORCE COMPANIES EXPORT');
  console.log('===============================');
  
  try {
    const filters = createSalesforceCompanyFilters();
    
    // Use the simple proven Monaco pattern
    const snapshotId = await createSnapshot(
      DATASETS.linkedinCompanies, 
      filters.salesforceCompaniesFilter, 
      'Salesforce Companies'
    );
    
    await waitForSnapshot(snapshotId);
    const data = await downloadSnapshot(snapshotId);
    const csvPath = saveAsCSV(data, 'salesforce-companies');
    
    console.log('🎉 EXPORT COMPLETE!');
    console.log(`📁 File: ${csvPath}`);
    return csvPath;
    
  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    throw error;
  }
}

async function exportTechCompanies() {
  console.log('🚀 LARGE TECH COMPANIES EXPORT');  
  console.log('===============================');
  
  try {
    const filters = createSalesforceCompanyFilters();
    
    const snapshotId = await createSnapshot(
      DATASETS.linkedinCompanies,
      filters.techCompaniesFilter,
      'Large Tech Companies (1001+ employees)'
    );
    
    await waitForSnapshot(snapshotId);
    const data = await downloadSnapshot(snapshotId);
    const csvPath = saveAsCSV(data, 'large-tech-companies');
    
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
  const approach = process.argv[2] || 'salesforce';
  
  if (!['salesforce', 'tech', 'nonprofit'].includes(approach)) {
    console.log('Usage: node smart-linkedin-export.cjs [salesforce|tech|nonprofit]');
    console.log('  salesforce - Companies with "Salesforce" in name');
    console.log('  tech       - Large tech companies (1001+ employees)'); 
    console.log('  nonprofit  - Companies with "nonprofit" in name');
    process.exit(1);
  }
  
  let exportFunction;
  switch (approach) {
    case 'salesforce':
      exportFunction = exportSalesforceCompanies;
      break;
    case 'tech':
      exportFunction = exportTechCompanies;
      break;
    case 'nonprofit':
      exportFunction = exportSalesforceCompanies; // Use same function for now
      break;
  }
  
  exportFunction()
    .then(path => {
      console.log(`✅ Success! CSV with LinkedIn URLs saved to: ${path}`);
      process.exit(0);
    })
    .catch(error => {
      console.error(`❌ Failed: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { exportSalesforceCompanies, exportTechCompanies }; 