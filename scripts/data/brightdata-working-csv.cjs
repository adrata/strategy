#!/usr/bin/env node

/**
 * 🎯 WORKING BRIGHTDATA TO CSV EXPORTER
 * 
 * Proven working version using JSON API format
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

// Dataset IDs (from Monaco pipeline)
const DATASETS = {
  linkedinCompanies: "gd_l1viktl72bvl7bjuj0",
  linkedinPeople: "gd_ld7ll037kqy322v05", 
  b2bEnrichment: "gd_l1vikfnt1wgvvqz95w",
};

async function exportToCSV(datasetId, filter, filename = 'brightdata-export') {
  console.log('🚀 BRIGHTDATA CSV EXPORT');
  console.log('=========================');
  console.log(`📊 Dataset: ${datasetId}`);
  console.log(`🔍 Filter: ${JSON.stringify(filter, null, 2)}`);
  
  const startTime = Date.now();
  
  try {
    // Step 1: Create snapshot (PROVEN WORKING FORMAT)
    const payload = {
      dataset_id: datasetId,
      filter: filter
    };
    
    console.log('\n🔄 Step 1: Creating snapshot...');
    const createResponse = await makeRequest('https://api.brightdata.com/datasets/filter', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const snapshotId = createResponse.snapshot_id;
    console.log(`✅ Snapshot created: ${snapshotId}`);
    
    // Step 2: Wait for completion (extended timeout)
    console.log('\n🔄 Step 2: Waiting for completion...');
    let attempts = 0;
    const maxAttempts = 15; // 2.5 minutes max
    
    while (attempts < maxAttempts) {
      attempts++;
      console.log(`🔍 Check ${attempts}/${maxAttempts}...`);
      
      const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`, {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
      });
      
      console.log(`📊 Status: ${statusResponse.status || 'unknown'}`);
      
      if (statusResponse.status === 'ready') {
        console.log('✅ Snapshot ready!');
        break;
      } else if (statusResponse.status === 'failed') {
        throw new Error(`Snapshot failed: ${statusResponse.error || 'Unknown error'}`);
      }
      
      // Wait 10 seconds between checks
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    if (attempts >= maxAttempts) {
      throw new Error('Snapshot timeout - still processing after 2.5 minutes');
    }
    
    // Step 3: Download data
    console.log('\n🔄 Step 3: Downloading data...');
    
    // Wait a bit more for download to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const downloadResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}/download`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    console.log('✅ Download successful!');
    
    // Step 4: Parse and convert to CSV
    console.log('\n🔄 Step 4: Converting to CSV...');
    
    let records = [];
    
    if (typeof downloadResponse === 'string') {
      // Parse JSONL format (JSON Lines)
      const lines = downloadResponse.split('\n').filter(line => line.trim());
      records = lines.map(line => {
        try {
          return JSON.parse(line);
        } catch (e) {
          console.warn('⚠️ Failed to parse line:', line.substring(0, 100));
          return null;
        }
      }).filter(Boolean);
    } else if (Array.isArray(downloadResponse)) {
      records = downloadResponse;
    } else if (downloadResponse.records) {
      records = downloadResponse.records;
    } else {
      records = [downloadResponse];
    }
    
    console.log(`📊 Found ${records.length} records`);
    
    if (records.length === 0) {
      throw new Error('No data records found');
    }
    
    // Get all unique field names
    const allFields = new Set();
    records.forEach(record => {
      if (typeof record === 'object' && record !== null) {
        Object.keys(record).forEach(key => allFields.add(key));
      }
    });
    
    const headers = Array.from(allFields);
    console.log(`📊 CSV fields (${headers.length}):`, headers.slice(0, 10).join(', ') + (headers.length > 10 ? '...' : ''));
    
    // Create CSV content
    const csvLines = [];
    
    // Header row
    csvLines.push(headers.map(h => `"${h}"`).join(','));
    
    // Data rows
    records.forEach(record => {
      const row = headers.map(header => {
        const value = record[header];
        if (value === null || value === undefined) {
          return '""';
        } else if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        } else {
          return `"${String(value).replace(/"/g, '""')}"`;
        }
      });
      csvLines.push(row.join(','));
    });
    
    const csvContent = csvLines.join('\n');
    
    // Step 5: Save to desktop
    console.log('\n🔄 Step 5: Saving to desktop...');
    
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `${filename}-${timestamp}.csv`;
    const filePath = path.join(desktopPath, fileName);
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const fileSize = (fs.statSync(filePath).size / 1024).toFixed(2);
    
    console.log('\n🎉 EXPORT COMPLETED!');
    console.log('===================');
    console.log(`✅ File: ${filePath}`);
    console.log(`✅ Records: ${records.length}`);
    console.log(`✅ File size: ${fileSize} KB`);
    console.log(`✅ Duration: ${duration} seconds`);
    console.log(`✅ Snapshot ID: ${snapshotId}`);
    
    return {
      success: true,
      filePath,
      recordCount: records.length,
      snapshotId,
      duration: parseFloat(duration)
    };
    
  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error('\n❌ EXPORT FAILED');
    console.error('================');
    console.error(`❌ Error: ${error.message}`);
    console.error(`❌ Duration: ${duration} seconds`);
    throw error;
  }
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 60000,
    };
    
    console.log(`🌐 ${options.method || 'GET'} ${url}`);
    
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
              resolve(data); // Return raw text if not JSON
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

// Example searches
async function searchBitstamp() {
  const filter = {
    "name": "name",
    "operator": "=",
    "value": "Bitstamp"
  };
  
  return await exportToCSV(DATASETS.linkedinCompanies, filter, 'bitstamp-company');
}

async function searchTechCompanies() {
  const filter = {
    "name": "name", 
    "operator": "includes",
    "value": "Tech"
  };
  
  return await exportToCSV(DATASETS.linkedinCompanies, filter, 'tech-companies');
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🎯 BRIGHTDATA CSV EXPORTER');
    console.log('==========================');
    console.log('');
    console.log('Usage:');
    console.log('  node brightdata-working-csv.cjs bitstamp    # Search for Bitstamp');
    console.log('  node brightdata-working-csv.cjs tech        # Search tech companies');
    console.log('');
    console.log('Available datasets:');
    Object.entries(DATASETS).forEach(([name, id]) => {
      console.log(`  ${name.padEnd(20)} ${id}`);
    });
    return;
  }
  
  const command = args[0].toLowerCase();
  
  try {
    switch (command) {
      case 'bitstamp':
      case 'b':
        await searchBitstamp();
        break;
        
      case 'tech':
      case 't':
        await searchTechCompanies();
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Available: bitstamp, tech');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Export failed: ${error.message}`);
    process.exit(1);
  }
}

// Export functions
module.exports = {
  exportToCSV,
  searchBitstamp,
  searchTechCompanies,
  DATASETS,
};

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
} 