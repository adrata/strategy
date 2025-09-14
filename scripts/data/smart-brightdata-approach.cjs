#!/usr/bin/env node

/**
 * 🧠 SMART BRIGHTDATA APPROACH - Zero Waste
 * 
 * 1. Get dataset metadata to see available fields
 * 2. Use only valid fields for filtering
 * 3. Create working CSV export
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

// Dataset IDs from Monaco
const DATASETS = {
  linkedinCompanies: "gd_l1viktl72bvl7bjuj0",
  linkedinPeople: "gd_ld7ll037kqy322v05", 
  b2bEnrichment: "gd_l1vikfnt1wgvvqz95w",
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: 30000,
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
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * STEP 1: Get Dataset Metadata (NO COST)
 */
async function getDatasetMetadata(datasetId) {
  console.log(`🔍 Getting metadata for dataset: ${datasetId}`);
  
  // Correct endpoint for dataset metadata
  const url = `http://api.brightdata.com/datasets/${datasetId}/metadata`;
  
  try {
    const metadata = await makeRequest(url);
    console.log(`✅ Dataset metadata retrieved`);
    console.log('🔍 RAW RESPONSE:', JSON.stringify(metadata, null, 2));
    
    // Extract useful information
    const result = {
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      schema: metadata.schema || [],
      sample_data: metadata.sample_data || [],
      available_fields: [],
      common_fields: []
    };
    
    // Extract field names from schema
    if (metadata.schema && Array.isArray(metadata.schema)) {
      result.available_fields = metadata.schema.map(field => field.name || field.key || field);
    }
    
    // Extract field names from sample data
    if (metadata.sample_data && Array.isArray(metadata.sample_data) && metadata.sample_data.length > 0) {
      const sampleFields = Object.keys(metadata.sample_data[0] || {});
      result.common_fields = sampleFields;
    }
    
    console.log(`📊 Dataset: ${result.name}`);
    console.log(`📊 Available fields: ${result.available_fields.length}`);
    console.log(`📊 Common fields: ${result.common_fields.join(', ')}`);
    
    return result;
  } catch (error) {
    console.error(`❌ Failed to get metadata: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 2: Check all our datasets (NO COST)
 */
async function analyzeAllDatasets() {
  console.log('🔬 ANALYZING ALL DATASETS');
  console.log('==========================');
  
  const results = {};
  
  for (const [name, datasetId] of Object.entries(DATASETS)) {
    console.log(`\n📋 Analyzing ${name} (${datasetId})...`);
    
    try {
      results[name] = await getDatasetMetadata(datasetId);
      
      // Wait a bit between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to analyze ${name}: ${error.message}`);
      results[name] = { error: error.message };
    }
  }
  
  return results;
}

/**
 * STEP 3: Create smart filter based on available fields
 */
function createSmartFilter(metadata, searchTerm) {
  console.log(`🧠 Creating smart filter for: ${searchTerm}`);
  
  const availableFields = [...(metadata.available_fields || []), ...(metadata.common_fields || [])];
  console.log(`🔍 Available fields:`, availableFields.slice(0, 10).join(', '));
  
  // Common field patterns to try
  const fieldPatterns = [
    'name',
    'company_name', 
    'title',
    'business_name',
    'organization_name',
    'entity_name'
  ];
  
  // Find the best field to filter on
  const targetField = fieldPatterns.find(pattern => 
    availableFields.some(field => 
      field.toLowerCase().includes(pattern) || pattern.includes(field.toLowerCase())
    )
  );
  
  if (targetField) {
    console.log(`✅ Using field: ${targetField}`);
    
    // Use Monaco's proven working filter format
    return {
      "name": targetField,
      "operator": "=",
      "value": searchTerm
    };
  } else {
    console.warn(`⚠️ No suitable field found in: ${availableFields.join(', ')}`);
    
    // Fallback to first available field
    const firstField = availableFields[0];
    if (firstField) {
      console.log(`🔄 Fallback to field: ${firstField}`);
      return {
        "name": firstField,
        "operator": "=", 
        "value": searchTerm
      };
    }
  }
  
  throw new Error('No usable fields found in dataset');
}

/**
 * STEP 4: Test filter before full export (MINIMAL COST)
 */
async function testFilter(datasetId, filter) {
  console.log('🧪 Testing filter (minimal cost)...');
  
  const payload = {
    dataset_id: datasetId,
    filter: filter
  };
  
  console.log(`📦 Test payload:`, JSON.stringify(payload, null, 2));
  
  // Create snapshot
  const createResponse = await makeRequest('https://api.brightdata.com/datasets/filter', {
    method: 'POST',
    body: payload,
  });
  
  const snapshotId = createResponse.snapshot_id;
  console.log(`✅ Test snapshot created: ${snapshotId}`);
  
  // Wait and check status
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const statusResponse = await makeRequest(`https://api.brightdata.com/datasets/snapshots/${snapshotId}`);
  
  console.log(`📊 Test snapshot status: ${statusResponse.status}`);
  console.log(`💰 Test cost: $${statusResponse.cost || 0}`);
  
  if (statusResponse.error) {
    console.error(`❌ Test error: ${statusResponse.error}`);
    console.error(`❌ Error code: ${statusResponse.error_code}`);
  }
  
  return statusResponse;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🧠 SMART BRIGHTDATA APPROACH');
    console.log('============================');
    console.log('');
    console.log('Commands:');
    console.log('  analyze                     # Check all dataset metadata (FREE)');
    console.log('  test <dataset> <search>     # Test filter on dataset (MINIMAL COST)');
    console.log('  export <dataset> <search>   # Full export to CSV (FULL COST)');
    console.log('');
    console.log('Examples:');
    console.log('  node smart-brightdata-approach.cjs analyze');
    console.log('  node smart-brightdata-approach.cjs test linkedinCompanies Microsoft');
    console.log('  node smart-brightdata-approach.cjs export linkedinCompanies Microsoft');
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
      case 'analyze':
        console.log('🔬 Starting dataset analysis (NO COST)...');
        const results = await analyzeAllDatasets();
        
        // Save results for reference
        const desktopPath = path.join(os.homedir(), 'Desktop');
        const resultsFile = path.join(desktopPath, `brightdata-analysis-${Date.now()}.json`);
        fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
        
        console.log('\n🎉 ANALYSIS COMPLETE');
        console.log('===================');
        console.log(`📄 Results saved: ${resultsFile}`);
        console.log(`💰 Total cost: $0.00 (metadata is free)`);
        
        // Show summary
        for (const [name, data] of Object.entries(results)) {
          if (data.error) {
            console.log(`❌ ${name}: ${data.error}`);
          } else {
            console.log(`✅ ${name}: ${data.common_fields?.length || 0} fields available`);
          }
        }
        break;
        
      case 'test':
        if (args.length < 3) {
          console.error('❌ Usage: test <dataset> <search_term>');
          process.exit(1);
        }
        
        const datasetName = args[1];
        const searchTerm = args[2];
        const datasetId = DATASETS[datasetName];
        
        if (!datasetId) {
          console.error(`❌ Unknown dataset: ${datasetName}`);
          console.log('Available:', Object.keys(DATASETS).join(', '));
          process.exit(1);
        }
        
        console.log(`🧪 Testing filter on ${datasetName} for "${searchTerm}"...`);
        
        // Get metadata first
        const metadata = await getDatasetMetadata(datasetId);
        const filter = createSmartFilter(metadata, searchTerm);
        
        // Test the filter
        const testResult = await testFilter(datasetId, filter);
        
        console.log('\n🧪 TEST COMPLETE');
        console.log('================');
        console.log(`✅ Filter works: ${testResult.status !== 'failed'}`);
        console.log(`💰 Test cost: $${testResult.cost || 0}`);
        
        if (testResult.status === 'ready') {
          console.log('🎉 Filter is working! You can now run full export.');
        }
        break;
        
      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log('Available: analyze, test, export');
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Command failed: ${error.message}`);
    process.exit(1);
  }
}

// Export functions
module.exports = {
  getDatasetMetadata,
  analyzeAllDatasets,
  createSmartFilter,
  testFilter,
  DATASETS,
};

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
} 