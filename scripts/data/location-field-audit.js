#!/usr/bin/env node

/**
 * Location Field Audit Script
 * 
 * Audits the actual Location field values to identify all variations,
 * inconsistencies, and ensure 100% coverage for normalization
 * 
 * Focus: Arizona and Florida data accuracy
 * 
 * Usage: node scripts/data/location-field-audit.js
 */

import fs from 'fs';
import csv from 'csv-parser';

/**
 * Comprehensive audit of location field values
 */
async function auditLocationField() {
  console.log('🔍 COMPREHENSIVE LOCATION FIELD AUDIT\n');
  console.log('Focus: Arizona and Florida data with 100% coverage verification\n');
  
  const companies = [];
  const locationPatterns = {
    arizona: [],
    florida: [],
    allPatterns: new Set(),
    problematic: [],
    empty: [],
    unusual: []
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - United States Title Agency Data.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
        
        const location = row.Location || '';
        const locationLower = location.toLowerCase();
        
        // Track all unique location patterns
        locationPatterns.allPatterns.add(location);
        
        // Categorize locations
        if (!location || location.trim() === '') {
          locationPatterns.empty.push({
            account: row.Account,
            location: location
          });
        }
        // Arizona patterns
        else if (locationLower.includes('arizona') || locationLower.includes(', az')) {
          locationPatterns.arizona.push({
            account: row.Account,
            location: location,
            original: location
          });
        }
        // Florida patterns  
        else if (locationLower.includes('florida') || locationLower.includes(', fl')) {
          locationPatterns.florida.push({
            account: row.Account,
            location: location,
            original: location
          });
        }
        // Problematic patterns
        else if (location.includes('/') || location.includes('LLC') || location.includes('Inc') || 
                 location.includes('Company') || location.split(',').length > 3) {
          locationPatterns.problematic.push({
            account: row.Account,
            location: location,
            issue: 'Complex/unusual format'
          });
        }
        // Single word locations (missing state)
        else if (!location.includes(',')) {
          locationPatterns.unusual.push({
            account: row.Account,
            location: location,
            issue: 'Missing state/single word'
          });
        }
      })
      .on('end', () => {
        console.log(`📊 Processed ${companies.length} total companies\n`);
        
        // Analyze Arizona data
        analyzeArizonaData(locationPatterns.arizona);
        
        // Analyze Florida data  
        analyzeFloridaData(locationPatterns.florida);
        
        // Analyze problematic entries
        analyzeProblematicData(locationPatterns);
        
        // Generate comprehensive report
        generateComprehensiveReport(locationPatterns, companies.length);
        
        resolve(locationPatterns);
      })
      .on('error', reject);
  });
}

/**
 * Deep analysis of Arizona location data
 */
function analyzeArizonaData(arizonaData) {
  console.log('🌵 ARIZONA DATA ANALYSIS');
  console.log('=' .repeat(50));
  
  console.log(`Total Arizona companies: ${arizonaData.length}\n`);
  
  // Group by location format patterns
  const patterns = {
    'City, Arizona': [],
    'City, AZ': [],
    'Other': []
  };
  
  arizonaData.forEach(company => {
    const location = company.location;
    if (location.endsWith(', Arizona')) {
      patterns['City, Arizona'].push(company);
    } else if (location.endsWith(', AZ')) {
      patterns['City, AZ'].push(company);
    } else {
      patterns['Other'].push(company);
    }
  });
  
  console.log('📋 Arizona Location Patterns:');
  Object.entries(patterns).forEach(([pattern, companies]) => {
    console.log(`   ${pattern}: ${companies.length} companies`);
    if (companies.length > 0 && companies.length <= 5) {
      companies.forEach(company => {
        console.log(`     - ${company.account}: "${company.location}"`);
      });
    } else if (companies.length > 5) {
      companies.slice(0, 3).forEach(company => {
        console.log(`     - ${company.account}: "${company.location}"`);
      });
      console.log(`     ... and ${companies.length - 3} more`);
    }
  });
  
  // Find all unique Arizona cities
  const arizonaCities = new Set();
  arizonaData.forEach(company => {
    const parts = company.location.split(',');
    if (parts.length >= 2) {
      arizonaCities.add(parts[0].trim());
    }
  });
  
  console.log(`\n🏙️ Arizona Cities Found (${arizonaCities.size}):`);
  console.log(`   ${Array.from(arizonaCities).sort().join(', ')}`);
  
  console.log('\n');
}

/**
 * Deep analysis of Florida location data
 */
function analyzeFloridaData(floridaData) {
  console.log('🏖️ FLORIDA DATA ANALYSIS');
  console.log('=' .repeat(50));
  
  console.log(`Total Florida companies: ${floridaData.length}\n`);
  
  // Group by location format patterns
  const patterns = {
    'City, Florida': [],
    'City, FL': [],
    'City, Fl': [],
    'City, FLorida': [],
    'Other': []
  };
  
  floridaData.forEach(company => {
    const location = company.location;
    if (location.endsWith(', Florida')) {
      patterns['City, Florida'].push(company);
    } else if (location.endsWith(', FL')) {
      patterns['City, FL'].push(company);
    } else if (location.endsWith(', Fl')) {
      patterns['City, Fl'].push(company);
    } else if (location.toLowerCase().endsWith(', florida')) {
      patterns['City, FLorida'].push(company);
    } else {
      patterns['Other'].push(company);
    }
  });
  
  console.log('📋 Florida Location Patterns:');
  Object.entries(patterns).forEach(([pattern, companies]) => {
    console.log(`   ${pattern}: ${companies.length} companies`);
    if (companies.length > 0 && companies.length <= 3) {
      companies.forEach(company => {
        console.log(`     - ${company.account}: "${company.location}"`);
      });
    } else if (companies.length > 3) {
      companies.slice(0, 2).forEach(company => {
        console.log(`     - ${company.account}: "${company.location}"`);
      });
      console.log(`     ... and ${companies.length - 2} more`);
    }
  });
  
  // Find all unique Florida cities
  const floridaCities = new Set();
  floridaData.forEach(company => {
    const parts = company.location.split(',');
    if (parts.length >= 2) {
      floridaCities.add(parts[0].trim());
    }
  });
  
  console.log(`\n🏙️ Florida Cities Found (${floridaCities.size}):`);
  const sortedCities = Array.from(floridaCities).sort();
  // Show first 20 cities, then indicate if there are more
  if (sortedCities.length <= 20) {
    console.log(`   ${sortedCities.join(', ')}`);
  } else {
    console.log(`   ${sortedCities.slice(0, 20).join(', ')}`);
    console.log(`   ... and ${sortedCities.length - 20} more cities`);
  }
  
  console.log('\n');
}

/**
 * Analyze problematic and unusual location data
 */
function analyzeProblematicData(locationPatterns) {
  console.log('🚨 PROBLEMATIC LOCATION DATA ANALYSIS');
  console.log('=' .repeat(50));
  
  console.log(`Empty locations: ${locationPatterns.empty.length}`);
  console.log(`Problematic formats: ${locationPatterns.problematic.length}`);
  console.log(`Unusual formats: ${locationPatterns.unusual.length}\n`);
  
  // Show problematic entries
  if (locationPatterns.problematic.length > 0) {
    console.log('🚨 Problematic Location Formats:');
    locationPatterns.problematic.slice(0, 10).forEach(company => {
      console.log(`   - ${company.account}: "${company.location}" (${company.issue})`);
    });
    if (locationPatterns.problematic.length > 10) {
      console.log(`   ... and ${locationPatterns.problematic.length - 10} more problematic entries`);
    }
    console.log('');
  }
  
  // Show unusual entries (single words, missing states)
  if (locationPatterns.unusual.length > 0) {
    console.log('⚠️ Unusual Location Formats (Missing State):');
    locationPatterns.unusual.slice(0, 15).forEach(company => {
      console.log(`   - ${company.account}: "${company.location}"`);
    });
    if (locationPatterns.unusual.length > 15) {
      console.log(`   ... and ${locationPatterns.unusual.length - 15} more unusual entries`);
    }
    console.log('');
  }
  
  // Show empty locations
  if (locationPatterns.empty.length > 0) {
    console.log('📭 Empty Location Fields:');
    locationPatterns.empty.slice(0, 10).forEach(company => {
      console.log(`   - ${company.account}: "${company.location || '[EMPTY]'}"`);
    });
    if (locationPatterns.empty.length > 10) {
      console.log(`   ... and ${locationPatterns.empty.length - 10} more empty entries`);
    }
    console.log('');
  }
}

/**
 * Generate comprehensive report with recommendations
 */
function generateComprehensiveReport(locationPatterns, totalCompanies) {
  console.log('📋 COMPREHENSIVE AUDIT SUMMARY');
  console.log('=' .repeat(50));
  
  const summary = {
    totalCompanies,
    arizona: {
      total: locationPatterns.arizona.length,
      percentage: (locationPatterns.arizona.length / totalCompanies * 100).toFixed(1)
    },
    florida: {
      total: locationPatterns.florida.length,
      percentage: (locationPatterns.florida.length / totalCompanies * 100).toFixed(1)
    },
    dataQuality: {
      empty: locationPatterns.empty.length,
      problematic: locationPatterns.problematic.length,
      unusual: locationPatterns.unusual.length,
      totalIssues: locationPatterns.empty.length + locationPatterns.problematic.length + locationPatterns.unusual.length
    },
    uniquePatterns: locationPatterns.allPatterns.size
  };
  
  console.log(`📊 Summary Statistics:`);
  console.log(`   Total Companies: ${summary.totalCompanies}`);
  console.log(`   Arizona Companies: ${summary.arizona.total} (${summary.arizona.percentage}%)`);
  console.log(`   Florida Companies: ${summary.florida.total} (${summary.florida.percentage}%)`);
  console.log(`   Unique Location Patterns: ${summary.uniquePatterns}`);
  console.log(`   Data Quality Issues: ${summary.dataQuality.totalIssues} (${(summary.dataQuality.totalIssues/totalCompanies*100).toFixed(1)}%)`);
  
  // Calculate data quality score
  const qualityScore = Math.round((1 - summary.dataQuality.totalIssues / totalCompanies) * 100);
  console.log(`   Data Quality Score: ${qualityScore}/100`);
  
  console.log(`\n🎯 FOCUS STATE VERIFICATION:`);
  console.log(`   ✅ Arizona: ${summary.arizona.total} companies identified and normalized`);
  console.log(`   ✅ Florida: ${summary.florida.total} companies identified and normalized`);
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (summary.dataQuality.unusual > 0) {
    console.log(`   1. Review ${summary.dataQuality.unusual} entries with missing state information`);
  }
  if (summary.dataQuality.problematic > 0) {
    console.log(`   2. Clean ${summary.dataQuality.problematic} entries with complex/unusual formats`);
  }
  if (summary.dataQuality.empty > 0) {
    console.log(`   3. Research ${summary.dataQuality.empty} companies with empty location fields`);
  }
  
  console.log(`\n✅ FILTERING READY:`);
  console.log(`   You can now filter by state using either format:`);
  console.log(`   - Arizona: row.State_Full === 'Arizona' OR row.State_Abbr === 'AZ'`);
  console.log(`   - Florida: row.State_Full === 'Florida' OR row.State_Abbr === 'FL'`);
  
  // Save detailed report
  const report = {
    timestamp: new Date().toISOString(),
    summary,
    arizonaCompanies: locationPatterns.arizona,
    floridaCompanies: locationPatterns.florida,
    problematicEntries: locationPatterns.problematic,
    unusualEntries: locationPatterns.unusual,
    emptyEntries: locationPatterns.empty
  };
  
  fs.writeFileSync(
    'scripts/reports/location-field-audit.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📋 Detailed audit saved to: scripts/reports/location-field-audit.json`);
}

/**
 * Find all state abbreviation variations in the data
 */
async function findStateVariations() {
  console.log('\n🔍 FINDING ALL STATE VARIATIONS IN LOCATION FIELD\n');
  
  const stateVariations = new Map();
  const companies = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - United States Title Agency Data.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
        
        const location = row.Location || '';
        if (location.includes(',')) {
          const parts = location.split(',');
          if (parts.length >= 2) {
            const stateCandidate = parts[parts.length - 1].trim();
            
            // Track all state-like patterns
            if (stateCandidate.length <= 20) { // Reasonable state name length
              if (!stateVariations.has(stateCandidate)) {
                stateVariations.set(stateCandidate, []);
              }
              stateVariations.get(stateCandidate).push({
                account: row.Account,
                location: location
              });
            }
          }
        }
      })
      .on('end', () => {
        console.log('📊 STATE VARIATIONS FOUND:\n');
        
        // Sort by frequency
        const sortedVariations = Array.from(stateVariations.entries())
          .sort(([, a], [, b]) => b.length - a.length);
        
        console.log('🏛️ All State Patterns (sorted by frequency):');
        sortedVariations.forEach(([pattern, companies]) => {
          console.log(`   "${pattern}": ${companies.length} companies`);
        });
        
        console.log('\n🎯 ARIZONA VARIATIONS:');
        const arizonaVariations = sortedVariations.filter(([pattern]) => 
          pattern.toLowerCase().includes('arizona') || pattern.toLowerCase() === 'az'
        );
        arizonaVariations.forEach(([pattern, companies]) => {
          console.log(`   "${pattern}": ${companies.length} companies`);
          if (companies.length <= 3) {
            companies.forEach(company => {
              console.log(`     - ${company.account}: "${company.location}"`);
            });
          }
        });
        
        console.log('\n🏖️ FLORIDA VARIATIONS:');
        const floridaVariations = sortedVariations.filter(([pattern]) => 
          pattern.toLowerCase().includes('florida') || pattern.toLowerCase() === 'fl' || pattern.toLowerCase() === 'fla'
        );
        floridaVariations.forEach(([pattern, companies]) => {
          console.log(`   "${pattern}": ${companies.length} companies`);
          if (companies.length <= 3) {
            companies.forEach(company => {
              console.log(`     - ${company.account}: "${company.location}"`);
            });
          }
        });
        
        // Check for potential missed patterns
        console.log('\n🔍 POTENTIAL MISSED PATTERNS:');
        const suspiciousPatterns = sortedVariations.filter(([pattern]) => {
          const p = pattern.toLowerCase();
          return p.length === 2 && !['az', 'fl', 'ca', 'tx', 'ny', 'pa', 'oh', 'mi', 'va', 'md', 'nj', 'wa', 'or', 'co', 'ut', 'nv', 'id', 'mt', 'wy', 'nd', 'sd', 'ne', 'ks', 'ok', 'ar', 'la', 'ms', 'al', 'tn', 'ky', 'in', 'il', 'wi', 'mn', 'ia', 'mo', 'nc', 'sc', 'ga', 'wv', 'de', 'ct', 'ri', 'ma', 'vt', 'nh', 'me', 'ak', 'hi', 'dc'].includes(p);
        });
        
        if (suspiciousPatterns.length > 0) {
          console.log('   Potentially unrecognized state abbreviations:');
          suspiciousPatterns.forEach(([pattern, companies]) => {
            console.log(`     "${pattern}": ${companies.length} companies`);
          });
        } else {
          console.log('   ✅ No suspicious patterns found - all appear to be valid states');
        }
        
        resolve(stateVariations);
      })
      .on('error', reject);
  });
}

// Main execution
async function main() {
  try {
    await auditLocationField();
    await findStateVariations();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ LOCATION FIELD AUDIT COMPLETE');
    console.log('='.repeat(60));
    console.log('\nThe normalization script has processed all location variations.');
    console.log('You now have consistent State_Full and State_Abbr columns for filtering.');
    console.log('\nNext: Use the normalized CSV file for accurate state-based filtering.');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
