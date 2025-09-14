#!/usr/bin/env node

/**
 * Verify Companies with Brightdata API - Real Employee Data
 * Uses curl to query Brightdata for USA HQ companies with verified employee counts
 */

const { exec } = require('child_process');
const fs = require('fs');

// Brightdata API Configuration
const API_KEY = "7b01d6f148d5f428222d8c59c03b55a62205ed435b4a32ee64c6e0c28b2c9f8e";
const DATASET_ID = "gd_l1viktl72bvl7bjuj0"; // LinkedIn companies dataset
const BASE_URL = "https://api.brightdata.com/datasets/v3";

// Size category mappings
const sizeCategories = {
  L1: { min: 20000, max: null, description: "20,000+ employees" },
  L2: { min: 5000, max: 19999, description: "5,000-19,999 employees" },
  L3: { min: 1000, max: 4999, description: "1,000-4,999 employees" },
  M3: { min: 500, max: 999, description: "500-999 employees" },
  M2: { min: 200, max: 499, description: "200-499 employees" },
  M1: { min: 100, max: 199, description: "100-199 employees" }
};

// Industry keywords for tech/software focus
const techIndustries = [
  "Software", "Technology", "Information Technology", "Computer Software", 
  "Internet", "Telecommunications", "Computer Hardware", "Semiconductors",
  "Artificial Intelligence", "Machine Learning", "Cloud Computing", "SaaS",
  "Cybersecurity", "Data Analytics", "Enterprise Software", "Fintech"
];

async function makeAPIRequest(filter, description) {
  return new Promise((resolve, reject) => {
    const endpoint = '/datasets/create_snapshot';
    const url = `${BASE_URL}${endpoint}`;
    
    const requestBody = {
      dataset_id: DATASET_ID,
      filter: filter,
      format: "json",
      limit: 100,
      discover_params: {
        country: "US",
        hq_country: "US"
      }
    };

    const curlCommand = `curl -X POST "${url}" \\
      -H "Authorization: Bearer ${API_KEY}" \\
      -H "Content-Type: application/json" \\
      -H "User-Agent: Adrata-Company-Research/1.0" \\
      -d '${JSON.stringify(requestBody)}'`;

    console.log(`\n🔍 ${description}`);
    console.log(`📊 Filter: ${JSON.stringify(filter, null, 2)}`);
    console.log(`🌐 Endpoint: ${url}`);
    
    exec(curlCommand, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ cURL error: ${error.message}`);
        reject(error);
        return;
      }

      if (stderr) {
        console.warn(`⚠️  cURL stderr: ${stderr}`);
      }

      try {
        const response = JSON.parse(stdout);
        console.log(`✅ Response received`);
        resolve({
          description,
          filter,
          data: response,
          rawResponse: stdout
        });
      } catch (parseError) {
        console.log(`📄 Raw response (first 500 chars): ${stdout.substring(0, 500)}`);
        resolve({
          description,
          filter,
          data: null,
          rawResponse: stdout,
          parseError: parseError.message
        });
      }
    });
  });
}

function createCompanyFilter(sizeCategory, industries) {
  const sizeConfig = sizeCategories[sizeCategory];
  
  let employeeFilter = {};
  if (sizeConfig.min && sizeConfig.max) {
    employeeFilter = {
      "current_company_size": {
        "$gte": sizeConfig.min,
        "$lte": sizeConfig.max
      }
    };
  } else if (sizeConfig.min) {
    employeeFilter = {
      "current_company_size": {
        "$gte": sizeConfig.min
      }
    };
  }

  return {
    "$and": [
      {
        "country_code": "US"
      },
      employeeFilter,
      {
        "$or": industries.map(industry => ({
          "experience": {
            "$regex": `(?i)${industry}`
          }
        }))
      }
    ]
  };
}

async function searchCompaniesBySize() {
  console.log("🚀 Starting Brightdata API Company Research");
  console.log(`📊 Dataset: ${DATASET_ID} (LinkedIn profiles)`);
  console.log("🎯 Target: USA HQ Tech Companies with verified employee counts");
  console.log("📍 Focus: Technology/Software companies only\n");

  const results = [];

  // Test each size category
  for (const [category, config] of Object.entries(sizeCategories)) {
    console.log(`\n🎯 === SEARCHING ${category} COMPANIES (${config.description}) ===`);
    
    try {
      const filter = createCompanyFilter(category, techIndustries);
      const result = await makeAPIRequest(
        filter, 
        `${category} Tech Companies (${config.description})`
      );
      
      results.push({
        category,
        ...result
      });

      // Add delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to search ${category} companies:`, error.message);
      results.push({
        category,
        description: `${category} Tech Companies`,
        error: error.message
      });
    }
  }

  return results;
}

async function parseCompanyData(results) {
  console.log("\n📊 === PARSING COMPANY DATA ===");
  
  const companiesBySize = {};
  let totalCompaniesFound = 0;

  for (const result of results) {
    console.log(`\n📋 Processing ${result.category} results...`);
    
    if (result.error) {
      console.log(`❌ Error: ${result.error}`);
      continue;
    }

    if (!result.data) {
      console.log(`⚠️  No data received`);
      continue;
    }

    // Try to extract companies from various possible response formats
    let companies = [];
    
    if (result.data.snapshot_id) {
      console.log(`✅ Snapshot created: ${result.data.snapshot_id}`);
      console.log(`📝 Note: Use snapshot ID to retrieve actual data`);
    }
    
    if (result.data.records) {
      companies = result.data.records;
    } else if (result.data.data) {
      companies = result.data.data;
    } else if (Array.isArray(result.data)) {
      companies = result.data;
    }

    console.log(`📊 Found ${companies.length} companies for ${result.category}`);
    
    companiesBySize[result.category] = {
      count: companies.length,
      companies: companies.slice(0, 10), // Show first 10
      snapshotId: result.data.snapshot_id,
      rawData: result.rawResponse?.substring(0, 1000) // First 1000 chars for analysis
    };

    totalCompaniesFound += companies.length;
  }

  return { companiesBySize, totalCompaniesFound };
}

async function exportResults(companiesBySize, totalCompaniesFound) {
  console.log("\n📁 === EXPORTING RESULTS ===");

  const exportData = {
    timestamp: new Date().toISOString(),
    source: "Brightdata API via cURL",
    dataset: DATASET_ID,
    totalCompaniesFound,
    searchCriteria: {
      country: "US",
      industries: techIndustries,
      sizeCategories: sizeCategories
    },
    results: companiesBySize,
    instructions: {
      nextSteps: [
        "Use snapshot IDs to retrieve full company data",
        "Filter out companies already in Dan's portfolio", 
        "Verify employee counts and headquarters location",
        "Add to target companies CSV file"
      ]
    }
  };

  const filename = `brightdata-company-research-${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));
  
  console.log(`✅ Results exported to: ${filename}`);
  console.log(`📊 Total companies found: ${totalCompaniesFound}`);

  // Also create a summary CSV for quick review
  const csvLines = ["Company Size,Company Count,Snapshot ID,Sample Data Available"];
  
  for (const [category, data] of Object.entries(companiesBySize)) {
    csvLines.push(`${category},${data.count},${data.snapshotId || 'N/A'},${data.companies?.length > 0 ? 'Yes' : 'No'}`);
  }
  
  const csvFilename = `brightdata-company-summary-${Date.now()}.csv`;
  fs.writeFileSync(csvFilename, csvLines.join('\n'));
  
  console.log(`📋 Summary exported to: ${csvFilename}`);
  
  return { exportData, filename, csvFilename };
}

async function main() {
  try {
    console.log("🎯 BRIGHTDATA COMPANY RESEARCH - USA HQ TECH COMPANIES");
    console.log("=" .repeat(60));

    // Search companies by size
    const results = await searchCompaniesBySize();
    
    // Parse and analyze results
    const { companiesBySize, totalCompaniesFound } = await parseCompanyData(results);
    
    // Export results
    const { exportData, filename, csvFilename } = await exportResults(companiesBySize, totalCompaniesFound);

    console.log("\n🎉 === RESEARCH COMPLETE ===");
    console.log(`📊 Total API calls made: ${results.length}`);
    console.log(`🏢 Total companies discovered: ${totalCompaniesFound}`);
    console.log(`📁 Detailed results: ${filename}`);
    console.log(`📋 Quick summary: ${csvFilename}`);
    
    if (totalCompaniesFound > 0) {
      console.log("\n💡 NEXT STEPS:");
      console.log("1. Review snapshot IDs and retrieve full company data");
      console.log("2. Cross-reference with Dan's existing portfolio");
      console.log("3. Verify employee counts and HQ locations");
      console.log("4. Add verified companies to target list");
    } else {
      console.log("\n🔧 TROUBLESHOOTING:");
      console.log("1. Check API endpoint and authentication");
      console.log("2. Verify dataset access permissions");
      console.log("3. Review filter criteria");
      console.log("4. Check Brightdata documentation for updates");
    }

  } catch (error) {
    console.error("\n❌ RESEARCH FAILED:", error.message);
    process.exit(1);
  }
}

// Run the research
main(); 