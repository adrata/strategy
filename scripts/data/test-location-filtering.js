#!/usr/bin/env node

/**
 * Test Location Filtering Script
 * 
 * Demonstrates how to use the normalized location data for filtering
 * 
 * Usage: node scripts/data/test-location-filtering.js
 */

import fs from 'fs';
import csv from 'csv-parser';
import { filterByState, filterByCity, getUniqueStates, getUniqueCities, filterByRegion } from './state-filter-helpers.js';

/**
 * Load the normalized CSV data
 */
async function loadNormalizedData() {
  const companies = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - Normalized.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
      })
      .on('end', () => {
        console.log(`📊 Loaded ${companies.length} companies from normalized data`);
        resolve(companies);
      })
      .on('error', reject);
  });
}

/**
 * Test various filtering scenarios
 */
async function testFiltering() {
  console.log('🧪 Testing location filtering with normalized data...\n');
  
  try {
    const companies = await loadNormalizedData();
    
    // Test 1: Filter by Texas (full name)
    console.log('🔍 Test 1: Companies in Texas');
    const texasCompanies = filterByState(companies, 'Texas');
    console.log(`   Found ${texasCompanies.length} companies in Texas`);
    console.log(`   Sample: ${texasCompanies.slice(0, 3).map(c => c.Account).join(', ')}`);
    
    // Test 2: Filter by TX (abbreviation)
    console.log('\n🔍 Test 2: Companies in TX (abbreviation)');
    const txCompanies = filterByState(companies, 'TX');
    console.log(`   Found ${txCompanies.length} companies in TX`);
    console.log(`   Matches Texas filter: ${texasCompanies.length === txCompanies.length ? '✅' : '❌'}`);
    
    // Test 3: Filter by California
    console.log('\n🔍 Test 3: Companies in California');
    const caCompanies = filterByState(companies, 'California');
    console.log(`   Found ${caCompanies.length} companies in California`);
    console.log(`   Sample: ${caCompanies.slice(0, 3).map(c => c.Account).join(', ')}`);
    
    // Test 4: Filter by specific city
    console.log('\n🔍 Test 4: Companies in Austin');
    const austinCompanies = filterByCity(companies, 'Austin');
    console.log(`   Found ${austinCompanies.length} companies in Austin`);
    austinCompanies.forEach(company => {
      console.log(`   - ${company.Account} (${company.Normalized_Location})`);
    });
    
    // Test 5: Filter by Phoenix
    console.log('\n🔍 Test 5: Companies in Phoenix');
    const phoenixCompanies = filterByCity(companies, 'Phoenix');
    console.log(`   Found ${phoenixCompanies.length} companies in Phoenix`);
    phoenixCompanies.slice(0, 5).forEach(company => {
      console.log(`   - ${company.Account} (${company.Normalized_Location})`);
    });
    
    // Test 6: Get unique states
    console.log('\n🔍 Test 6: All unique states in dataset');
    const uniqueStates = getUniqueStates(companies);
    console.log(`   Found ${uniqueStates.length} unique states:`);
    console.log(`   ${uniqueStates.join(', ')}`);
    
    // Test 7: Regional filtering
    console.log('\n🔍 Test 7: Companies in the West region');
    const westCompanies = filterByRegion(companies, 'West');
    console.log(`   Found ${westCompanies.length} companies in Western states`);
    
    // Count by state in West region
    const westByState = {};
    westCompanies.forEach(company => {
      const state = company.State_Full;
      westByState[state] = (westByState[state] || 0) + 1;
    });
    console.log('   Distribution:');
    Object.entries(westByState)
      .sort(([,a], [,b]) => b - a)
      .forEach(([state, count]) => {
        console.log(`     ${state}: ${count} companies`);
      });
    
    // Test 8: Companies with invalid locations
    console.log('\n🔍 Test 8: Companies with invalid locations');
    const invalidCompanies = companies.filter(c => c.Location_Valid === 'NO');
    console.log(`   Found ${invalidCompanies.length} companies with invalid locations`);
    invalidCompanies.slice(0, 10).forEach(company => {
      console.log(`   - ${company.Account}: "${company.Location}" (${company.Location_Parse_Error})`);
    });
    
    // Test 9: Size distribution by state
    console.log('\n🔍 Test 9: Company size distribution in top 3 states');
    const topStates = ['Florida', 'California', 'Texas'];
    
    topStates.forEach(state => {
      const stateCompanies = filterByState(companies, state);
      const sizeDistribution = {};
      
      stateCompanies.forEach(company => {
        const size = company.Size || 'Unknown';
        sizeDistribution[size] = (sizeDistribution[size] || 0) + 1;
      });
      
      console.log(`\n   ${state} (${stateCompanies.length} companies):`);
      Object.entries(sizeDistribution)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([size, count]) => {
          console.log(`     ${size}: ${count} companies`);
        });
    });
    
    console.log('\n✅ All filtering tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
    throw error;
  }
}

/**
 * Generate summary statistics
 */
async function generateSummary() {
  const companies = await loadNormalizedData();
  
  const summary = {
    totalCompanies: companies.length,
    validLocations: companies.filter(c => c.Location_Valid === 'YES').length,
    invalidLocations: companies.filter(c => c.Location_Valid === 'NO').length,
    emptyLocations: companies.filter(c => !c.Location || c.Location.trim() === '').length,
    
    stateDistribution: {},
    cityDistribution: {},
    sizeDistribution: {},
    typeDistribution: {}
  };
  
  // Calculate distributions
  companies.forEach(company => {
    // State distribution
    if (company.State_Full) {
      summary.stateDistribution[company.State_Full] = 
        (summary.stateDistribution[company.State_Full] || 0) + 1;
    }
    
    // City distribution
    if (company.City) {
      summary.cityDistribution[company.City] = 
        (summary.cityDistribution[company.City] || 0) + 1;
    }
    
    // Size distribution
    const size = company.Size || 'Unknown';
    summary.sizeDistribution[size] = (summary.sizeDistribution[size] || 0) + 1;
    
    // Type distribution
    const type = company.Type || 'Unknown';
    summary.typeDistribution[type] = (summary.typeDistribution[type] || 0) + 1;
  });
  
  // Write summary to file
  fs.writeFileSync(
    'scripts/reports/location-summary.json', 
    JSON.stringify(summary, null, 2)
  );
  
  console.log('📊 Summary statistics saved to scripts/reports/location-summary.json');
  return summary;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--summary')) {
    await generateSummary();
    return;
  }
  
  await testFiltering();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
