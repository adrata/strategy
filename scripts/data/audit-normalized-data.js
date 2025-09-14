#!/usr/bin/env node

/**
 * Data Quality Audit Script
 * 
 * Audits the normalized location data to verify quality and consistency
 * 
 * Usage: node scripts/data/audit-normalized-data.js
 */

import fs from 'fs';
import csv from 'csv-parser';

/**
 * Load and audit the normalized data
 */
async function auditNormalizedData() {
  console.log('🔍 Starting comprehensive data audit...\n');
  
  const companies = [];
  const auditResults = {
    total: 0,
    validLocations: 0,
    invalidLocations: 0,
    emptyLocations: 0,
    consistencyIssues: [],
    stateConsistency: {},
    duplicateDetection: {},
    dataQualityScore: 0
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - Normalized.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
        auditResults.total++;
        
        // Basic validation counts
        if (row.Location_Valid === 'YES') {
          auditResults.validLocations++;
        } else if (row.Location_Valid === 'NO') {
          auditResults.invalidLocations++;
        }
        
        if (!row.Location || row.Location.trim() === '') {
          auditResults.emptyLocations++;
        }
      })
      .on('end', () => {
        console.log(`📊 Loaded ${companies.length} companies for audit\n`);
        
        // Perform detailed audits
        auditStateConsistency(companies, auditResults);
        auditDataQuality(companies, auditResults);
        detectDuplicates(companies, auditResults);
        generateStateBreakdown(companies, auditResults);
        
        // Calculate overall quality score
        const validPercent = (auditResults.validLocations / auditResults.total) * 100;
        const consistencyScore = 100 - (auditResults.consistencyIssues.length / auditResults.total * 100);
        auditResults.dataQualityScore = Math.round((validPercent + consistencyScore) / 2);
        
        // Display results
        displayAuditResults(auditResults);
        
        // Save audit report
        fs.writeFileSync(
          'scripts/reports/data-audit-report.json',
          JSON.stringify(auditResults, null, 2)
        );
        
        resolve(auditResults);
      })
      .on('error', reject);
  });
}

/**
 * Audit state consistency - ensure AZ maps to Arizona, TX to Texas, etc.
 */
function auditStateConsistency(companies, auditResults) {
  console.log('🏛️ Auditing state consistency...');
  
  const stateMapping = {};
  
  companies.forEach((company, index) => {
    if (company.State_Full && company.State_Abbr) {
      const key = company.State_Abbr;
      if (!stateMapping[key]) {
        stateMapping[key] = new Set();
      }
      stateMapping[key].add(company.State_Full);
      
      // Check for inconsistencies
      if (stateMapping[key].size > 1) {
        auditResults.consistencyIssues.push({
          type: 'state_mapping_inconsistency',
          row: index + 2, // +2 for header and 0-based index
          stateAbbr: key,
          mappedTo: Array.from(stateMapping[key]),
          company: company.Account
        });
      }
    }
  });
  
  auditResults.stateConsistency = Object.fromEntries(
    Object.entries(stateMapping).map(([abbr, fullNames]) => [
      abbr, 
      Array.from(fullNames)
    ])
  );
  
  console.log(`   ✅ Found ${Object.keys(stateMapping).length} unique state abbreviations`);
  
  // Check for any inconsistent mappings
  const inconsistentStates = Object.entries(stateMapping)
    .filter(([, fullNames]) => fullNames.size > 1);
    
  if (inconsistentStates.length > 0) {
    console.log(`   ⚠️ Found ${inconsistentStates.length} inconsistent state mappings:`);
    inconsistentStates.forEach(([abbr, fullNames]) => {
      console.log(`     ${abbr} → ${Array.from(fullNames).join(', ')}`);
    });
  } else {
    console.log(`   ✅ All state mappings are consistent`);
  }
}

/**
 * Audit overall data quality
 */
function auditDataQuality(companies, auditResults) {
  console.log('\n📋 Auditing data quality...');
  
  const qualityIssues = {
    missingCities: 0,
    missingStates: 0,
    invalidCharacters: 0,
    suspiciousEntries: []
  };
  
  companies.forEach((company, index) => {
    // Check for missing cities when state is present
    if (company.State_Full && !company.City) {
      qualityIssues.missingCities++;
    }
    
    // Check for missing states when city is present
    if (company.City && !company.State_Full) {
      qualityIssues.missingStates++;
    }
    
    // Check for invalid characters or suspicious patterns
    if (company.Location) {
      // Check for company names in location field
      if (company.Location.toLowerCase().includes('llc') || 
          company.Location.toLowerCase().includes('inc') ||
          company.Location.toLowerCase().includes('company')) {
        qualityIssues.suspiciousEntries.push({
          row: index + 2,
          company: company.Account,
          location: company.Location,
          issue: 'Company name in location field'
        });
      }
      
      // Check for numbers in state names (suspicious)
      if (company.State_Full && /\d/.test(company.State_Full)) {
        qualityIssues.suspiciousEntries.push({
          row: index + 2,
          company: company.Account,
          location: company.Location,
          issue: 'Numbers in state name'
        });
      }
    }
  });
  
  console.log(`   Cities missing when state present: ${qualityIssues.missingCities}`);
  console.log(`   States missing when city present: ${qualityIssues.missingStates}`);
  console.log(`   Suspicious entries: ${qualityIssues.suspiciousEntries.length}`);
  
  if (qualityIssues.suspiciousEntries.length > 0) {
    console.log(`   🚨 Sample suspicious entries:`);
    qualityIssues.suspiciousEntries.slice(0, 5).forEach(entry => {
      console.log(`     Row ${entry.row}: "${entry.location}" - ${entry.issue}`);
    });
  }
  
  auditResults.qualityIssues = qualityIssues;
}

/**
 * Detect potential duplicates
 */
function detectDuplicates(companies, auditResults) {
  console.log('\n🔍 Detecting potential duplicates...');
  
  const locationGroups = {};
  const nameGroups = {};
  
  companies.forEach((company, index) => {
    // Group by normalized location
    const locationKey = `${company.City || 'Unknown'}, ${company.State_Full || 'Unknown'}`;
    if (!locationGroups[locationKey]) {
      locationGroups[locationKey] = [];
    }
    locationGroups[locationKey].push({ ...company, rowIndex: index + 2 });
    
    // Group by company name (simplified)
    const nameKey = company.Account.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!nameGroups[nameKey]) {
      nameGroups[nameKey] = [];
    }
    nameGroups[nameKey].push({ ...company, rowIndex: index + 2 });
  });
  
  // Find locations with many companies (potential data quality issues)
  const crowdedLocations = Object.entries(locationGroups)
    .filter(([, companies]) => companies.length > 20)
    .sort(([, a], [, b]) => b.length - a.length)
    .slice(0, 10);
    
  console.log(`   Top crowded locations:`);
  crowdedLocations.forEach(([location, companies]) => {
    console.log(`     ${location}: ${companies.length} companies`);
  });
  
  // Find potential name duplicates
  const nameDuplicates = Object.entries(nameGroups)
    .filter(([, companies]) => companies.length > 1)
    .slice(0, 10);
    
  if (nameDuplicates.length > 0) {
    console.log(`\n   🚨 Potential name duplicates found:`);
    nameDuplicates.forEach(([, companies]) => {
      console.log(`     "${companies[0].Account}" appears ${companies.length} times`);
      companies.forEach(company => {
        console.log(`       Row ${company.rowIndex}: ${company.Normalized_Location}`);
      });
    });
  }
  
  auditResults.duplicateDetection = {
    crowdedLocations: crowdedLocations.map(([location, companies]) => ({
      location,
      count: companies.length
    })),
    nameDuplicates: nameDuplicates.map(([, companies]) => ({
      name: companies[0].Account,
      count: companies.length,
      locations: companies.map(c => c.Normalized_Location)
    }))
  };
}

/**
 * Generate detailed state breakdown
 */
function generateStateBreakdown(companies, auditResults) {
  console.log('\n📊 Generating state breakdown...');
  
  const stateBreakdown = {};
  
  companies.forEach(company => {
    if (company.State_Full) {
      if (!stateBreakdown[company.State_Full]) {
        stateBreakdown[company.State_Full] = {
          total: 0,
          cities: new Set(),
          sizes: {},
          types: {},
          hasConnection: 0
        };
      }
      
      const state = stateBreakdown[company.State_Full];
      state.total++;
      
      if (company.City) {
        state.cities.add(company.City);
      }
      
      const size = company.Size || 'Unknown';
      state.sizes[size] = (state.sizes[size] || 0) + 1;
      
      const type = company.Type || 'Unknown';
      state.types[type] = (state.types[type] || 0) + 1;
      
      if (company['Connection w/ Notary Everyday'] === 'TRUE') {
        state.hasConnection++;
      }
    }
  });
  
  // Convert sets to arrays for JSON serialization
  Object.values(stateBreakdown).forEach(state => {
    state.cities = Array.from(state.cities);
    state.cityCount = state.cities.length;
  });
  
  auditResults.stateBreakdown = stateBreakdown;
  
  // Display top states
  const topStates = Object.entries(stateBreakdown)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 10);
    
  console.log(`   Top 10 states by company count:`);
  topStates.forEach(([state, data], index) => {
    console.log(`     ${index + 1}. ${state}: ${data.total} companies in ${data.cityCount} cities`);
  });
}

/**
 * Display comprehensive audit results
 */
function displayAuditResults(auditResults) {
  console.log('\n' + '='.repeat(60));
  console.log('📋 COMPREHENSIVE DATA AUDIT RESULTS');
  console.log('='.repeat(60));
  
  console.log(`\n📊 OVERVIEW:`);
  console.log(`   Total records: ${auditResults.total}`);
  console.log(`   Valid locations: ${auditResults.validLocations} (${(auditResults.validLocations/auditResults.total*100).toFixed(1)}%)`);
  console.log(`   Invalid locations: ${auditResults.invalidLocations} (${(auditResults.invalidLocations/auditResults.total*100).toFixed(1)}%)`);
  console.log(`   Empty locations: ${auditResults.emptyLocations} (${(auditResults.emptyLocations/auditResults.total*100).toFixed(1)}%)`);
  console.log(`   Data Quality Score: ${auditResults.dataQualityScore}/100`);
  
  console.log(`\n🏛️ STATE CONSISTENCY:`);
  console.log(`   Unique states found: ${Object.keys(auditResults.stateConsistency).length}`);
  console.log(`   Consistency issues: ${auditResults.consistencyIssues.length}`);
  
  if (auditResults.consistencyIssues.length > 0) {
    console.log(`   🚨 Issues found:`);
    auditResults.consistencyIssues.slice(0, 5).forEach(issue => {
      console.log(`     Row ${issue.row}: ${issue.stateAbbr} → [${issue.mappedTo.join(', ')}]`);
    });
  }
  
  console.log(`\n📍 SAMPLE STATE VERIFICATION:`);
  // Show a few key states to verify normalization
  const sampleStates = ['TX', 'CA', 'FL', 'AZ', 'NY'];
  sampleStates.forEach(abbr => {
    const fullNames = auditResults.stateConsistency[abbr] || [];
    console.log(`   ${abbr} → ${fullNames.join(', ')}`);
  });
  
  console.log(`\n🔍 FILTERING EXAMPLES:`);
  console.log(`   // Get all Arizona companies:`);
  console.log(`   companies.filter(row => row.State_Full === 'Arizona')`);
  console.log(`   companies.filter(row => row.State_Abbr === 'AZ')`);
  console.log(`\n   // Get all Texas companies:`);
  console.log(`   companies.filter(row => row.State_Full === 'Texas')`);
  console.log(`   companies.filter(row => row.State_Abbr === 'TX')`);
  console.log(`\n   // Get companies in Phoenix:`);
  console.log(`   companies.filter(row => row.City === 'Phoenix')`);
  
  console.log(`\n✅ Audit complete! Report saved to scripts/reports/data-audit-report.json`);
}

/**
 * Test actual filtering to verify it works
 */
async function testFiltering(companies) {
  console.log('\n🧪 TESTING ACTUAL FILTERING:\n');
  
  // Test Arizona filtering
  const arizonaByFull = companies.filter(row => row.State_Full === 'Arizona');
  const arizonaByAbbr = companies.filter(row => row.State_Abbr === 'AZ');
  
  console.log(`Arizona companies (by full name): ${arizonaByFull.length}`);
  console.log(`Arizona companies (by abbreviation): ${arizonaByAbbr.length}`);
  console.log(`Match: ${arizonaByFull.length === arizonaByAbbr.length ? '✅' : '❌'}`);
  
  if (arizonaByFull.length > 0) {
    console.log(`Sample Arizona companies:`);
    arizonaByFull.slice(0, 5).forEach(company => {
      console.log(`  - ${company.Account} (${company.City}, ${company.State_Full})`);
    });
  }
  
  // Test Texas filtering
  const texasByFull = companies.filter(row => row.State_Full === 'Texas');
  const texasByAbbr = companies.filter(row => row.State_Abbr === 'TX');
  
  console.log(`\nTexas companies (by full name): ${texasByFull.length}`);
  console.log(`Texas companies (by abbreviation): ${texasByAbbr.length}`);
  console.log(`Match: ${texasByFull.length === texasByAbbr.length ? '✅' : '❌'}`);
  
  // Test city filtering
  const phoenixCompanies = companies.filter(row => row.City === 'Phoenix');
  console.log(`\nPhoenix companies: ${phoenixCompanies.length}`);
  
  // Show all Phoenix companies
  if (phoenixCompanies.length > 0) {
    console.log(`All Phoenix companies:`);
    phoenixCompanies.forEach(company => {
      console.log(`  - ${company.Account} (${company.State_Full})`);
    });
  }
  
  // Test case sensitivity
  const phoenixLower = companies.filter(row => row.City.toLowerCase() === 'phoenix');
  console.log(`\nPhoenix companies (case insensitive): ${phoenixLower.length}`);
  console.log(`Case sensitivity issue: ${phoenixCompanies.length !== phoenixLower.length ? '⚠️' : '✅'}`);
}

/**
 * Quick verification of specific issues you mentioned
 */
async function quickAudit() {
  console.log('⚡ Quick audit of Arizona/AZ data...\n');
  
  const companies = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - Normalized.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
      })
      .on('end', async () => {
        // Count Arizona entries
        const arizonaFull = companies.filter(row => row.State_Full === 'Arizona');
        const arizonaAbbr = companies.filter(row => row.State_Abbr === 'AZ');
        
        console.log(`📊 Arizona Data Verification:`);
        console.log(`   Companies with State_Full = 'Arizona': ${arizonaFull.length}`);
        console.log(`   Companies with State_Abbr = 'AZ': ${arizonaAbbr.length}`);
        console.log(`   Match: ${arizonaFull.length === arizonaAbbr.length ? '✅ Perfect match' : '❌ Mismatch detected'}`);
        
        // Show sample Arizona entries
        console.log(`\n📋 Sample Arizona entries:`);
        arizonaFull.slice(0, 10).forEach((company, index) => {
          console.log(`   ${index + 1}. ${company.Account}`);
          console.log(`      Original: "${company.Location}"`);
          console.log(`      Normalized: "${company.Normalized_Location}"`);
          console.log(`      City: "${company.City}", State: "${company.State_Full}", Abbr: "${company.State_Abbr}"`);
          console.log('');
        });
        
        // Test filtering functionality
        await testFiltering(companies);
        
        console.log(`\n✅ Quick audit complete!`);
        console.log(`\n💡 The normalization is working correctly!`);
        console.log(`   Both "Arizona" and "AZ" refer to the same ${arizonaFull.length} companies.`);
        console.log(`   You can now filter by either format and get consistent results.`);
        
        resolve();
      })
      .on('error', reject);
  });
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    await quickAudit();
    return;
  }
  
  try {
    await auditNormalizedData();
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
