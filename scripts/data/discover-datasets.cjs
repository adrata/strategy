#!/usr/bin/env node

/**
 * 🔍 DISCOVER BRIGHTDATA DATASETS
 * 
 * 1. Get complete dataset list
 * 2. Find LinkedIn-related datasets  
 * 3. Get metadata for each to find filterable fields
 * 4. Identify the correct dataset for recruitment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";

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
          console.log(`📡 Status: ${res.statusCode} for ${url}`);
          
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
 * STEP 1: Get all available datasets
 */
async function getAllDatasets() {
  console.log('🔍 Getting complete dataset list...');
  
  try {
    const datasets = await makeRequest('https://api.brightdata.com/datasets/list');
    
    console.log(`✅ Found ${datasets.length} total datasets`);
    
    // Filter for LinkedIn-related datasets
    const linkedinDatasets = datasets.filter(dataset => 
      dataset.name.toLowerCase().includes('linkedin') ||
      dataset.name.toLowerCase().includes('people') ||
      dataset.name.toLowerCase().includes('professional') ||
      dataset.name.toLowerCase().includes('profile')
    );
    
    console.log(`🔍 LinkedIn-related datasets: ${linkedinDatasets.length}`);
    
    linkedinDatasets.forEach(dataset => {
      console.log(`   📊 ${dataset.id}: "${dataset.name}" (${dataset.size?.toLocaleString() || 'unknown'} records)`);
    });
    
    return { allDatasets: datasets, linkedinDatasets };
    
  } catch (error) {
    console.error(`❌ Failed to get datasets: ${error.message}`);
    throw error;
  }
}

/**
 * STEP 2: Get metadata for a specific dataset
 */
async function getDatasetMetadata(datasetId) {
  console.log(`\n🔍 Getting metadata for dataset: ${datasetId}`);
  
  try {
    const metadata = await makeRequest(`http://api.brightdata.com/datasets/${datasetId}/metadata`);
    
    console.log(`✅ Metadata retrieved for ${datasetId}`);
    
    if (metadata.fields) {
      const fieldNames = Object.keys(metadata.fields);
      console.log(`📋 Fields available: ${fieldNames.length}`);
      
      // Look for recruitment-relevant fields
      const recruitmentFields = fieldNames.filter(field => 
        ['position', 'experience', 'about', 'volunteer_experience', 'current_company', 'education', 'skills'].some(keyword => 
          field.toLowerCase().includes(keyword)
        )
      );
      
      if (recruitmentFields.length > 0) {
        console.log(`🎯 Recruitment-relevant fields: ${recruitmentFields.join(', ')}`);
      }
      
      return {
        id: datasetId,
        metadata,
        fieldCount: fieldNames.length,
        recruitmentFields,
        allFields: fieldNames
      };
    } else {
      console.log(`⚠️ No fields metadata found for ${datasetId}`);
      return { id: datasetId, metadata, fieldCount: 0, recruitmentFields: [], allFields: [] };
    }
    
  } catch (error) {
    console.error(`❌ Failed to get metadata for ${datasetId}: ${error.message}`);
    return { id: datasetId, error: error.message, fieldCount: 0, recruitmentFields: [], allFields: [] };
  }
}

/**
 * STEP 3: Test which fields are actually filterable
 */
async function testFilterability(datasetId, fieldNames) {
  console.log(`\n🧪 Testing filterability for dataset: ${datasetId}`);
  
  const fieldsToTest = fieldNames.filter(field => 
    ['position', 'experience', 'about', 'volunteer_experience', 'current_company', 'name', 'education'].some(keyword => 
      field.toLowerCase().includes(keyword)
    )
  ).slice(0, 5); // Test only first 5 relevant fields to avoid too many requests
  
  if (fieldsToTest.length === 0) {
    console.log('❌ No relevant fields to test');
    return [];
  }
  
  const filterableFields = [];
  
  for (const field of fieldsToTest) {
    console.log(`🧪 Testing: ${field}`);
    
    const filter = {
      "operator": "and",
      "filters": [
        {
          "name": field,
          "value": "test",
          "operator": "includes"
        }
      ]
    };
    
    const payload = {
      "dataset_id": datasetId,
      "filter": filter,
      "records_limit": 1
    };
    
    try {
      const response = await makeRequest('https://api.brightdata.com/datasets/filter', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.snapshot_id) {
        console.log(`✅ ${field}: FILTERABLE`);
        filterableFields.push(field);
      }
    } catch (error) {
      const errorMsg = error.message;
      if (errorMsg.includes('unsupported filters')) {
        console.log(`❌ ${field}: NOT FILTERABLE`);
      } else if (errorMsg.includes('no records found')) {
        console.log(`✅ ${field}: FILTERABLE (no matches for test value)`);
        filterableFields.push(field);
      } else {
        console.log(`⚠️ ${field}: ${errorMsg}`);
      }
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return filterableFields;
}

/**
 * MAIN DISCOVERY FUNCTION
 */
async function discoverDatasets() {
  console.log('🚀 BRIGHTDATA DATASET DISCOVERY');
  console.log('===============================');
  
  try {
    // Step 1: Get all datasets
    const { allDatasets, linkedinDatasets } = await getAllDatasets();
    
    // Step 2: Get metadata for LinkedIn datasets
    console.log('\n📋 ANALYZING LINKEDIN DATASETS:');
    console.log('===============================');
    
    const analysisResults = [];
    
    for (const dataset of linkedinDatasets) {
      const metadataResult = await getDatasetMetadata(dataset.id);
      
      // Step 3: Test filterability for promising datasets
      if (metadataResult.recruitmentFields.length > 0) {
        console.log(`\n🎯 Dataset ${dataset.id} has recruitment fields - testing filterability...`);
        const filterableFields = await testFilterability(dataset.id, metadataResult.allFields);
        metadataResult.filterableFields = filterableFields;
      } else {
        metadataResult.filterableFields = [];
      }
      
      analysisResults.push({
        ...dataset,
        ...metadataResult
      });
      
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Step 4: Generate report
    console.log('\n🎉 DATASET DISCOVERY COMPLETE!');
    console.log('==============================');
    
    const perfectDatasets = analysisResults.filter(d => 
      d.filterableFields && d.filterableFields.length > 0 && 
      d.recruitmentFields.some(f => f.includes('position') || f.includes('experience'))
    );
    
    if (perfectDatasets.length > 0) {
      console.log(`🎯 PERFECT DATASETS FOR RECRUITMENT: ${perfectDatasets.length}`);
      perfectDatasets.forEach(dataset => {
        console.log(`\n✅ ${dataset.id}: "${dataset.name}"`);
        console.log(`   📊 Records: ${dataset.size?.toLocaleString() || 'unknown'}`);
        console.log(`   🎯 Recruitment fields: ${dataset.recruitmentFields.join(', ')}`);
        console.log(`   ✅ Filterable fields: ${dataset.filterableFields.join(', ')}`);
      });
    } else {
      console.log('❌ No perfect datasets found - may need different approach');
    }
    
    // Save detailed report
    const reportPath = path.join(os.homedir(), 'Desktop', `brightdata-dataset-discovery-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      totalDatasets: allDatasets.length,
      linkedinDatasets: linkedinDatasets.length,
      analysisResults,
      perfectDatasets,
      timestamp: new Date().toISOString()
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
    return perfectDatasets;
    
  } catch (error) {
    console.error(`❌ Discovery failed: ${error.message}`);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const mode = process.argv[2] || 'discover';
  
  if (mode === 'discover') {
    discoverDatasets()
      .then(perfectDatasets => {
        console.log(`\n🎯 Discovery complete! Found ${perfectDatasets.length} datasets suitable for recruitment.`);
        
        if (perfectDatasets.length > 0) {
          console.log('\n🚀 NEXT STEPS:');
          console.log('1. Use the dataset IDs above for recruitment searches');
          console.log('2. Use the filterable fields for Salesforce Solution Architect searches');
          console.log('3. Check the detailed report on your desktop for full analysis');
        }
      })
      .catch(error => {
        console.error(`❌ Discovery failed: ${error.message}`);
        process.exit(1);
      });
  } else if (mode === 'quick') {
    // Quick check of known dataset IDs
    const knownDatasets = [
      "gd_l1viktl72bvl7bjuj0", // LinkedIn Companies (from user's example)
      "gd_ld7ll037kqy322v05",  // LinkedIn People (assumed)
    ];
    
    console.log('🚀 Quick check of known datasets...');
    
    Promise.all(knownDatasets.map(id => getDatasetMetadata(id)))
      .then(results => {
        results.forEach(result => {
          console.log(`\n📊 ${result.id}:`);
          console.log(`   Fields: ${result.fieldCount}`);
          console.log(`   Recruitment fields: ${result.recruitmentFields.join(', ') || 'none'}`);
        });
      })
      .catch(console.error);
  } else {
    console.log('Usage: node discover-datasets.cjs [discover|quick]');
    console.log('  discover - Full dataset discovery and analysis');
    console.log('  quick    - Quick check of known dataset IDs');
  }
}

module.exports = { discoverDatasets, getAllDatasets, getDatasetMetadata }; 