#!/usr/bin/env node

/**
 * Enrich Target Companies with Brightdata - Replace Placeholders with Real Data
 * Uses the correct LinkedIn company dataset and API format to get USA HQ tech companies
 */

const https = require('https');
const fs = require('fs');

// Brightdata Configuration - CORRECTED
const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const LINKEDIN_COMPANY_DATASET = "gd_l1vikfnt1wgvvqz95w"; // Correct LinkedIn company dataset
const BASE_URL = "https://api.brightdata.com/datasets";

// Company size mappings
const sizeCategories = {
  L1: { min: 20000, max: null, description: "20,000+ employees" },
  L2: { min: 5000, max: 19999, description: "5,000-19,999 employees" },
  L3: { min: 1000, max: 4999, description: "1,000-4,999 employees" },
  M3: { min: 500, max: 999, description: "500-999 employees" },
  M2: { min: 200, max: 499, description: "200-499 employees" },
  M1: { min: 100, max: 199, description: "100-199 employees" }
};

// Tech industry filters for USA companies
const createTechCompanyFilter = (sizeCategory) => {
  const sizeConfig = sizeCategories[sizeCategory];
  
  return {
    "company_hq_country": "United States",
    "company_industry": {
      "$regex": "(?i)(Software|Technology|Information Technology|Computer|Internet|SaaS|Cloud|Cybersecurity|AI|Data|Analytics|Enterprise)"
    },
    "company_size": {
      "$gte": sizeConfig.min,
      ...(sizeConfig.max ? { "$lte": sizeConfig.max } : {})
    }
  };
};

async function makeAPIRequest(filter, description) {
  return new Promise((resolve, reject) => {
    const payload = {
      dataset_id: LINKEDIN_COMPANY_DATASET,
      filter: filter,
      format: "json",
      limit: 50  // Get 50 companies per size category
    };

    console.log(`\n🔍 ${description}`);
    console.log(`📊 Filter: ${JSON.stringify(filter, null, 2)}`);
    
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'api.brightdata.com',
      port: 443,
      path: '/datasets/filter',  // Correct endpoint
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Adrata-Company-Enrichment/1.0'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const response = JSON.parse(data);
            console.log(`✅ Success: Snapshot created`);
            resolve({
              description,
              filter,
              data: response,
              snapshotId: response.snapshot_id
            });
          } catch (parseError) {
            console.log(`📄 Raw response: ${data.substring(0, 500)}`);
            resolve({
              description,
              filter,
              rawResponse: data,
              parseError: parseError.message
            });
          }
        } else {
          console.log(`❌ Error ${res.statusCode}: ${data}`);
          reject(new Error(`API error: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

async function getSnapshotData(snapshotId, description) {
  return new Promise((resolve, reject) => {
    console.log(`\n📥 Retrieving data for: ${description}`);
    console.log(`🔑 Snapshot ID: ${snapshotId}`);

    const options = {
      hostname: 'api.brightdata.com',
      port: 443,
      path: `/datasets/snapshots/${snapshotId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'Adrata-Company-Enrichment/1.0'
      },
      timeout: 30000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 Status check: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log(`📊 Status: ${response.status}`);
            
            if (response.status === 'ready') {
              // Now download the actual data
              downloadSnapshotData(snapshotId, description)
                .then(resolve)
                .catch(reject);
            } else if (response.status === 'failed') {
              reject(new Error(`Snapshot failed: ${response.error || 'Unknown error'}`));
            } else {
              console.log(`⏳ Status: ${response.status} - will retry`);
              setTimeout(() => {
                getSnapshotData(snapshotId, description)
                  .then(resolve)
                  .catch(reject);
              }, 5000);
            }
          } catch (parseError) {
            reject(new Error(`Parse error: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Status check failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Status check timeout'));
    });

    req.end();
  });
}

async function downloadSnapshotData(snapshotId, description) {
  return new Promise((resolve, reject) => {
    console.log(`📥 Downloading data for: ${description}`);

    const options = {
      hostname: 'api.brightdata.com',
      port: 443,
      path: `/datasets/snapshots/${snapshotId}/download`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'User-Agent': 'Adrata-Company-Enrichment/1.0'
      },
      timeout: 60000
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`📡 Download status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            // Try to parse as JSON (array of companies)
            const companies = JSON.parse(data);
            console.log(`✅ Downloaded ${Array.isArray(companies) ? companies.length : 'unknown'} companies`);
            resolve(companies);
          } catch (parseError) {
            // If not JSON, try to parse as CSV or other format
            console.log(`📄 Raw data format: ${data.substring(0, 200)}...`);
            resolve(data);
          }
        } else {
          reject(new Error(`Download failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });

    req.end();
  });
}

async function enrichCompaniesBySize() {
  console.log("🚀 Starting Company Enrichment Process");
  console.log(`📊 Dataset: ${LINKEDIN_COMPANY_DATASET} (LinkedIn companies)`);
  console.log("🎯 Target: USA HQ Tech Companies with verified data");
  console.log("📍 Replacing placeholder entries with real companies\n");

  const enrichedData = {};

  // Process each size category
  for (const [category, config] of Object.entries(sizeCategories)) {
    console.log(`\n🎯 === ENRICHING ${category} COMPANIES (${config.description}) ===`);
    
    try {
      const filter = createTechCompanyFilter(category);
      
      // Step 1: Create snapshot
      const snapshotResult = await makeAPIRequest(
        filter, 
        `${category} Tech Companies (${config.description})`
      );
      
      if (snapshotResult.snapshotId) {
        // Step 2: Wait for completion and download data
        const companies = await getSnapshotData(
          snapshotResult.snapshotId, 
          `${category} Tech Companies`
        );
        
        enrichedData[category] = {
          companies: companies,
          snapshotId: snapshotResult.snapshotId,
          count: Array.isArray(companies) ? companies.length : 0
        };

        console.log(`✅ Enriched ${enrichedData[category].count} ${category} companies`);
      } else {
        console.log(`❌ No snapshot ID received for ${category}`);
        enrichedData[category] = { companies: [], count: 0 };
      }

      // Be respectful to API
      await new Promise(resolve => setTimeout(resolve, 3000));

    } catch (error) {
      console.error(`❌ Failed to enrich ${category} companies:`, error.message);
      enrichedData[category] = { companies: [], count: 0, error: error.message };
    }
  }

  return enrichedData;
}

async function updateCSVWithEnrichedData(enrichedData) {
  console.log("\n📝 === UPDATING CSV WITH ENRICHED DATA ===");

  // Read existing CSV
  const csvContent = fs.readFileSync('dan-360-target-companies.csv', 'utf8');
  const lines = csvContent.split('\n');
  const header = lines[0];
  
  let updatedLines = [header];
  let replacementCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('[RESEARCH NEEDED]')) {
      // Extract size category from the line
      const sizeMatch = line.match(/,([LM][0-9]),/);
      if (sizeMatch) {
        const sizeCategory = sizeMatch[1];
        const categoryData = enrichedData[sizeCategory];
        
        if (categoryData && categoryData.companies && categoryData.companies.length > 0) {
          // Replace with real company data
          const companyIndex = replacementCount % categoryData.companies.length;
          const company = categoryData.companies[companyIndex];
          
          // Format company data for CSV
          const newLine = formatCompanyForCSV(company, sizeCategory);
          updatedLines.push(newLine);
          replacementCount++;
          
          console.log(`✅ Replaced placeholder with: ${company.name || company.company_name || 'Unknown'}`);
        } else {
          // Keep placeholder if no data available
          updatedLines.push(line);
        }
      } else {
        updatedLines.push(line);
      }
    } else {
      // Keep existing verified companies
      updatedLines.push(line);
    }
  }

  // Write updated CSV
  const updatedCSV = updatedLines.join('\n');
  const backupFilename = `dan-360-target-companies-backup-${Date.now()}.csv`;
  
  fs.writeFileSync(backupFilename, csvContent); // Backup original
  fs.writeFileSync('dan-360-target-companies.csv', updatedCSV); // Update main file

  console.log(`✅ CSV updated successfully`);
  console.log(`📁 Backup saved as: ${backupFilename}`);
  console.log(`🔄 Replaced ${replacementCount} placeholder entries`);

  return { replacementCount, backupFilename };
}

function formatCompanyForCSV(company, sizeCategory) {
  const name = company.name || company.company_name || 'Unknown Company';
  const employees = company.company_size || company.employees || 'TBD';
  const revenue = company.revenue || 'TBD';
  const industry = company.industry || company.company_industry || 'Technology';
  const website = company.website || company.company_website || 'TBD';
  const whyTarget = `USA HQ tech company, ${sizeCategories[sizeCategory].description}, verified via Brightdata`;
  
  return `"${name}",${sizeCategory},${employees},"${revenue}","${industry}",${website},"${whyTarget}",Brightdata Verified`;
}

async function main() {
  try {
    console.log("🎯 BRIGHTDATA COMPANY ENRICHMENT - USA HQ TECH FOCUS");
    console.log("=".repeat(65));

    // Step 1: Enrich companies by size category
    const enrichedData = await enrichCompaniesBySize();
    
    // Step 2: Update CSV with real company data
    const updateResults = await updateCSVWithEnrichedData(enrichedData);

    console.log("\n🎉 === ENRICHMENT COMPLETE ===");
    console.log(`🔄 Placeholder replacements: ${updateResults.replacementCount}`);
    console.log(`📁 Backup file: ${updateResults.backupFilename}`);
    console.log(`📊 Enriched data summary:`);
    
    for (const [category, data] of Object.entries(enrichedData)) {
      console.log(`   ${category}: ${data.count} companies`);
    }

    console.log("\n💡 NEXT STEPS:");
    console.log("1. Review the updated CSV file");
    console.log("2. Cross-reference with Dan's existing portfolio");
    console.log("3. Verify any remaining placeholder entries");
    console.log("4. Continue todo completion process");

  } catch (error) {
    console.error("\n❌ ENRICHMENT FAILED:", error.message);
    process.exit(1);
  }
}

// Run the enrichment
main(); 