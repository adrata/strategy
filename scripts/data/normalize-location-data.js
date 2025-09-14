#!/usr/bin/env node

/**
 * Location Data Normalization Script
 * 
 * This script normalizes location data in the United States Title Agency CSV file
 * to ensure consistent state formatting for filtering and analysis.
 * 
 * Features:
 * - Converts state abbreviations to full names and vice versa
 * - Handles various location formats (City, State vs City, ST)
 * - Adds separate city and state columns for easier filtering
 * - Preserves original data while adding normalized columns
 * 
 * Usage: node scripts/data/normalize-location-data.js
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

// State abbreviation to full name mapping
const stateMapping = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California',
  'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia',
  'HI': 'Hawaii', 'ID': 'Idaho', 'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa',
  'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi', 'MO': 'Missouri',
  'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio',
  'OK': 'Oklahoma', 'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont',
  'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

// Reverse mapping for full name to abbreviation
const stateAbbreviationMapping = Object.fromEntries(
  Object.entries(stateMapping).map(([abbr, full]) => [full, abbr])
);

/**
 * Parse and normalize location string
 * Handles various formats:
 * - "Austin, Texas"
 * - "Plano, TX" 
 * - "Austin, TX"
 * - "Phoenix, AZ"
 * - "" (empty)
 * - "New York, NY" vs "New York, New York"
 */
function normalizeLocation(locationString) {
  if (!locationString || locationString.trim() === '') {
    return {
      originalLocation: locationString || '',
      normalizedLocation: '',
      city: '',
      state: '',
      stateAbbr: '',
      stateFull: '',
      isValid: false,
      parseError: 'Empty location'
    };
  }

  const original = locationString.trim();
  let city = '';
  let state = '';
  let stateAbbr = '';
  let stateFull = '';
  let isValid = false;
  let parseError = '';

  try {
    // Split by comma and clean up parts
    const parts = original.split(',').map(part => part.trim());
    
    if (parts.length >= 2) {
      city = parts[0];
      const stateCandidate = parts[1];
      
      // Clean up the state candidate (remove periods, normalize case)
      const cleanedCandidate = stateCandidate.replace(/\.$/, '').trim();
      const lowerCandidate = cleanedCandidate.toLowerCase();
      
      // Check if it's a state abbreviation (2 letters)
      if (cleanedCandidate.length === 2 && stateMapping[cleanedCandidate.toUpperCase()]) {
        stateAbbr = cleanedCandidate.toUpperCase();
        stateFull = stateMapping[stateAbbr];
        state = stateFull;
        isValid = true;
      }
      // Check if it's a full state name (exact match)
      else if (stateAbbreviationMapping[cleanedCandidate]) {
        stateFull = cleanedCandidate;
        stateAbbr = stateAbbreviationMapping[cleanedCandidate];
        state = stateFull;
        isValid = true;
      }
      // Handle special cases and variations
      else if (lowerCandidate.includes('district of columbia') || lowerCandidate === 'dc') {
        stateAbbr = 'DC';
        stateFull = 'District of Columbia';
        state = stateFull;
        isValid = true;
      }
      // Handle Florida variations
      else if (lowerCandidate === 'fl' || lowerCandidate === 'fla' || 
               lowerCandidate === 'florida' || lowerCandidate === 'fl florida' ||
               lowerCandidate.includes('florida')) {
        stateAbbr = 'FL';
        stateFull = 'Florida';
        state = stateFull;
        isValid = true;
      }
      // Handle Arizona variations  
      else if (lowerCandidate === 'az' || lowerCandidate === 'arizona') {
        stateAbbr = 'AZ';
        stateFull = 'Arizona';
        state = stateFull;
        isValid = true;
      }
      // Handle Texas variations
      else if (lowerCandidate === 'tx' || lowerCandidate === 'texas' || lowerCandidate === 'texass') {
        stateAbbr = 'TX';
        stateFull = 'Texas';
        state = stateFull;
        isValid = true;
      }
      // Handle California variations
      else if (lowerCandidate === 'ca' || lowerCandidate === 'california' || 
               lowerCandidate === 'ca - california') {
        stateAbbr = 'CA';
        stateFull = 'California';
        state = stateFull;
        isValid = true;
      }
      // Handle New Mexico (NM was flagged as potentially missed)
      else if (lowerCandidate === 'nm' || lowerCandidate === 'new mexico') {
        stateAbbr = 'NM';
        stateFull = 'New Mexico';
        state = stateFull;
        isValid = true;
      }
      // Handle other common variations
      else if (lowerCandidate === 'ny' || lowerCandidate === 'new york') {
        stateAbbr = 'NY';
        stateFull = 'New York';
        state = stateFull;
        isValid = true;
      }
      else if (lowerCandidate === 'pa' || lowerCandidate === 'pennsylvania') {
        stateAbbr = 'PA';
        stateFull = 'Pennsylvania';
        state = stateFull;
        isValid = true;
      }
      // Try case-insensitive matching for all states
      else {
        // First try exact case-insensitive match for full names
        const exactMatch = Object.entries(stateAbbreviationMapping).find(([fullName]) => 
          fullName.toLowerCase() === lowerCandidate
        );
        
        if (exactMatch) {
          stateFull = exactMatch[0];
          stateAbbr = exactMatch[1];
          state = stateFull;
          isValid = true;
        }
        // Then try case-insensitive match for abbreviations
        else {
          const abbrMatch = Object.entries(stateMapping).find(([abbr]) => 
            abbr.toLowerCase() === lowerCandidate
          );
          
          if (abbrMatch) {
            stateAbbr = abbrMatch[0];
            stateFull = abbrMatch[1];
            state = stateFull;
            isValid = true;
          }
          // Finally try partial matching for misspellings
          else {
            const partialMatch = Object.values(stateMapping).find(fullName => 
              fullName.toLowerCase().includes(lowerCandidate) || 
              lowerCandidate.includes(fullName.toLowerCase())
            );
            
            if (partialMatch) {
              stateFull = partialMatch;
              stateAbbr = stateAbbreviationMapping[partialMatch];
              state = stateFull;
              isValid = true;
            } else {
              parseError = `Unrecognized state: ${stateCandidate}`;
            }
          }
        }
      }
    } else if (parts.length === 1) {
      // Handle cases where only state is provided
      const singlePart = parts[0];
      if (singlePart.length === 2 && stateMapping[singlePart.toUpperCase()]) {
        stateAbbr = singlePart.toUpperCase();
        stateFull = stateMapping[stateAbbr];
        state = stateFull;
        city = '';
        isValid = true;
      } else if (stateAbbreviationMapping[singlePart]) {
        stateFull = singlePart;
        stateAbbr = stateAbbreviationMapping[singlePart];
        state = stateFull;
        city = '';
        isValid = true;
      } else {
        parseError = 'Could not parse single location part';
      }
    } else {
      parseError = 'Invalid location format';
    }

  } catch (error) {
    parseError = `Parse error: ${error.message}`;
  }

  // Create normalized location string
  let normalizedLocation = '';
  if (isValid) {
    if (city && state) {
      normalizedLocation = `${city}, ${stateFull}`;
    } else if (state) {
      normalizedLocation = stateFull;
    }
  }

  return {
    originalLocation: original,
    normalizedLocation,
    city: city || '',
    state: state || '',
    stateAbbr: stateAbbr || '',
    stateFull: stateFull || '',
    isValid,
    parseError: parseError || ''
  };
}

/**
 * Process the CSV file and add normalized location columns
 */
async function processLocationData() {
  const inputFile = 'United States Title Agency Data - United States Title Agency Data.csv';
  const outputFile = 'United States Title Agency Data - Normalized.csv';
  const reportFile = 'scripts/reports/location-normalization-report.json';
  
  console.log('🚀 Starting location data normalization...');
  console.log(`📂 Input file: ${inputFile}`);
  console.log(`📂 Output file: ${outputFile}`);

  const results = [];
  const stats = {
    total: 0,
    valid: 0,
    invalid: 0,
    empty: 0,
    errors: [],
    stateDistribution: {},
    cityDistribution: {}
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream(inputFile)
      .pipe(csv())
      .on('data', (row) => {
        stats.total++;
        
        // Normalize the location
        const locationData = normalizeLocation(row.Location);
        
        // Update statistics
        if (!row.Location || row.Location.trim() === '') {
          stats.empty++;
        } else if (locationData.isValid) {
          stats.valid++;
          
          // Track state distribution
          if (locationData.stateFull) {
            stats.stateDistribution[locationData.stateFull] = 
              (stats.stateDistribution[locationData.stateFull] || 0) + 1;
          }
          
          // Track city distribution
          if (locationData.city) {
            stats.cityDistribution[locationData.city] = 
              (stats.cityDistribution[locationData.city] || 0) + 1;
          }
        } else {
          stats.invalid++;
          if (locationData.parseError) {
            stats.errors.push({
              row: stats.total,
              originalLocation: row.Location,
              error: locationData.parseError
            });
          }
        }

        // Create enhanced row with normalized data
        const enhancedRow = {
          ...row,
          // Add normalized location columns
          'Normalized_Location': locationData.normalizedLocation,
          'City': locationData.city,
          'State_Full': locationData.stateFull,
          'State_Abbr': locationData.stateAbbr,
          'Location_Valid': locationData.isValid ? 'YES' : 'NO',
          'Location_Parse_Error': locationData.parseError
        };

        results.push(enhancedRow);
      })
      .on('end', async () => {
        try {
          console.log(`\n📊 Processing complete! Statistics:`);
          console.log(`   Total records: ${stats.total}`);
          console.log(`   Valid locations: ${stats.valid} (${(stats.valid/stats.total*100).toFixed(1)}%)`);
          console.log(`   Invalid locations: ${stats.invalid} (${(stats.invalid/stats.total*100).toFixed(1)}%)`);
          console.log(`   Empty locations: ${stats.empty} (${(stats.empty/stats.total*100).toFixed(1)}%)`);

          // Show top states
          const topStates = Object.entries(stats.stateDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
          
          console.log(`\n🏛️ Top 10 States by Company Count:`);
          topStates.forEach(([state, count], index) => {
            console.log(`   ${index + 1}. ${state}: ${count} companies`);
          });

          // Show errors if any
          if (stats.errors.length > 0) {
            console.log(`\n❌ Parse Errors (${stats.errors.length}):`);
            stats.errors.slice(0, 10).forEach(error => {
              console.log(`   Row ${error.row}: "${error.originalLocation}" - ${error.error}`);
            });
            if (stats.errors.length > 10) {
              console.log(`   ... and ${stats.errors.length - 10} more errors`);
            }
          }

          // Write normalized CSV file
          if (results.length > 0) {
            const headers = Object.keys(results[0]).map(key => ({ id: key, title: key }));
            
            const csvWriter = createObjectCsvWriter({
              path: outputFile,
              header: headers
            });

            await csvWriter.writeRecords(results);
            console.log(`\n✅ Normalized data written to: ${outputFile}`);
          }

          // Write detailed report
          const report = {
            timestamp: new Date().toISOString(),
            inputFile,
            outputFile,
            statistics: stats,
            sampleNormalizations: results.slice(0, 10).map(row => ({
              account: row.Account,
              originalLocation: row.Location,
              normalizedLocation: row.Normalized_Location,
              city: row.City,
              stateFull: row.State_Full,
              stateAbbr: row.State_Abbr,
              isValid: row.Location_Valid
            }))
          };

          // Ensure reports directory exists
          const reportsDir = path.dirname(reportFile);
          if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
          }

          fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
          console.log(`📋 Detailed report written to: ${reportFile}`);

          // Generate filtering examples
          console.log(`\n🔍 Example filtering queries after normalization:`);
          console.log(`   // Filter by Texas companies:`);
          console.log(`   companies.filter(row => row.State_Full === 'Texas')`);
          console.log(`   companies.filter(row => row.State_Abbr === 'TX')`);
          console.log(`\n   // Filter by California companies:`);
          console.log(`   companies.filter(row => row.State_Full === 'California')`);
          console.log(`   companies.filter(row => row.State_Abbr === 'CA')`);
          console.log(`\n   // Filter by specific cities:`);
          console.log(`   companies.filter(row => row.City === 'Austin')`);
          console.log(`   companies.filter(row => row.City === 'Phoenix')`);

          resolve(stats);
        } catch (error) {
          console.error('❌ Error writing output:', error);
          reject(error);
        }
      })
      .on('error', (error) => {
        console.error('❌ Error reading CSV:', error);
        reject(error);
      });
  });
}

/**
 * Test the normalization function with sample data
 */
function testNormalization() {
  console.log('🧪 Testing location normalization...\n');
  
  const testCases = [
    "Austin, Texas",
    "Plano, TX", 
    "Phoenix, AZ",
    "New York, NY",
    "New York, New York",
    "Washington, District of Columbia",
    "Las Vegas, Nevada",
    "",
    "InvalidCity, XX",
    "Chicago, IL",
    "Los Angeles, CA",
    "Miami, FL"
  ];

  testCases.forEach(testCase => {
    const result = normalizeLocation(testCase);
    console.log(`Input: "${testCase}"`);
    console.log(`  → City: "${result.city}"`);
    console.log(`  → State Full: "${result.stateFull}"`);
    console.log(`  → State Abbr: "${result.stateAbbr}"`);
    console.log(`  → Normalized: "${result.normalizedLocation}"`);
    console.log(`  → Valid: ${result.isValid}`);
    if (result.parseError) {
      console.log(`  → Error: ${result.parseError}`);
    }
    console.log('');
  });
}

/**
 * Generate state filtering helper functions
 */
function generateStateFilterHelpers() {
  const helpersFile = 'scripts/data/state-filter-helpers.js';
  
  const helpers = `/**
 * State Filtering Helper Functions
 * Generated by normalize-location-data.js
 */

// All US states for reference
export const US_STATES = ${JSON.stringify(Object.values(stateMapping), null, 2)};

export const US_STATE_ABBREVIATIONS = ${JSON.stringify(Object.keys(stateMapping), null, 2)};

export const STATE_MAPPING = ${JSON.stringify(stateMapping, null, 2)};

export const STATE_ABBREVIATION_MAPPING = ${JSON.stringify(stateAbbreviationMapping, null, 2)};

/**
 * Filter companies by state (accepts full name or abbreviation)
 */
export function filterByState(companies, stateQuery) {
  const query = stateQuery.trim();
  
  return companies.filter(company => {
    return company.State_Full === query || 
           company.State_Abbr === query.toUpperCase() ||
           company.State_Full?.toLowerCase() === query.toLowerCase();
  });
}

/**
 * Filter companies by city
 */
export function filterByCity(companies, cityQuery) {
  const query = cityQuery.trim().toLowerCase();
  
  return companies.filter(company => {
    return company.City?.toLowerCase() === query;
  });
}

/**
 * Get unique states from dataset
 */
export function getUniqueStates(companies) {
  const states = new Set();
  companies.forEach(company => {
    if (company.State_Full) {
      states.add(company.State_Full);
    }
  });
  return Array.from(states).sort();
}

/**
 * Get unique cities from dataset
 */
export function getUniqueCities(companies) {
  const cities = new Set();
  companies.forEach(company => {
    if (company.City) {
      cities.add(company.City);
    }
  });
  return Array.from(cities).sort();
}

/**
 * Get companies by region (groups of states)
 */
export function filterByRegion(companies, region) {
  const regions = {
    'West': ['California', 'Oregon', 'Washington', 'Nevada', 'Arizona', 'Utah', 'Colorado', 'Idaho', 'Montana', 'Wyoming'],
    'Southwest': ['Arizona', 'New Mexico', 'Texas', 'Oklahoma'],
    'South': ['Florida', 'Georgia', 'Alabama', 'Mississippi', 'Louisiana', 'Arkansas', 'Tennessee', 'Kentucky', 'North Carolina', 'South Carolina', 'Virginia', 'West Virginia'],
    'Northeast': ['Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New York', 'New Jersey', 'Pennsylvania'],
    'Midwest': ['Ohio', 'Michigan', 'Indiana', 'Illinois', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri', 'North Dakota', 'South Dakota', 'Nebraska', 'Kansas']
  };
  
  const regionStates = regions[region];
  if (!regionStates) {
    throw new Error(\`Unknown region: \${region}. Available regions: \${Object.keys(regions).join(', ')}\`);
  }
  
  return companies.filter(company => 
    regionStates.includes(company.State_Full)
  );
}
`;

  fs.writeFileSync(helpersFile, helpers);
  console.log(`🔧 State filtering helpers written to: ${helpersFile}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    testNormalization();
    return;
  }
  
  if (args.includes('--helpers-only')) {
    generateStateFilterHelpers();
    return;
  }

  try {
    // Check if input file exists
    const inputFile = 'United States Title Agency Data - United States Title Agency Data.csv';
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      console.log(`Please ensure the CSV file is in the project root directory.`);
      process.exit(1);
    }

    // Process the data
    const stats = await processLocationData();
    
    // Generate helper functions
    generateStateFilterHelpers();
    
    console.log(`\n🎉 Location normalization complete!`);
    console.log(`\nNext steps:`);
    console.log(`1. Review the normalized data in the output CSV file`);
    console.log(`2. Use the State_Full or State_Abbr columns for filtering`);
    console.log(`3. Import the helper functions for programmatic filtering`);
    
  } catch (error) {
    console.error('❌ Error during processing:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  normalizeLocation,
  stateMapping,
  stateAbbreviationMapping
};
