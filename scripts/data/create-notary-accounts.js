#!/usr/bin/env node

/**
 * Create Notary Accounts List
 * 
 * Selects the best 150 Florida and Arizona companies based on:
 * 1. Priority: Companies with "Connection w/ Notary Everyday" = TRUE
 * 2. Size preference: Medium-sized companies (with some large and small)
 * 3. Adds ranking (1-150) and assigns "dano" as user
 * 
 * Output: notary_accounts.csv
 * 
 * Usage: node scripts/data/create-notary-accounts.js
 */

import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Score companies based on criteria
 */
function scoreCompany(company) {
  let score = 0;
  
  // Priority 1: Connection with Notary Everyday (highest weight)
  if (company['Connection w/ Notary Everyday'] === 'TRUE') {
    score += 1000; // Very high priority
  }
  
  // Priority 2: Company size preference
  const size = company.Size || '';
  
  // Medium-sized companies (preferred)
  if (size.includes('51-200') || size.includes('201-500')) {
    score += 100;
  }
  // Large companies (some wanted)
  else if (size.includes('501-1,000') || size.includes('1,001-5,000')) {
    score += 80;
  }
  // Very large companies (fewer wanted)
  else if (size.includes('5,001-10,000') || size.includes('10,001+')) {
    score += 60;
  }
  // Small companies (some wanted)
  else if (size.includes('11-50') || size.includes('2-10')) {
    score += 70;
  }
  // Self-employed/unknown (lower priority)
  else {
    score += 40;
  }
  
  // Priority 3: Company type preference
  const type = company.Type || '';
  if (type.includes('Privately Held')) {
    score += 20;
  } else if (type.includes('Public Company')) {
    score += 15;
  } else if (type.includes('Partnership')) {
    score += 10;
  }
  
  // Priority 4: Has domain (indicates established business)
  if (company.Domain && company.Domain.trim() !== '') {
    score += 10;
  }
  
  // Priority 5: Has LinkedIn (indicates professional presence)
  if (company.LinkedIn && company.LinkedIn.trim() !== '') {
    score += 5;
  }
  
  return score;
}

/**
 * Get size category for analysis
 */
function getSizeCategory(size) {
  if (!size) return 'Unknown';
  if (size.includes('2-10') || size.includes('Self-employed')) return 'Small';
  if (size.includes('11-50')) return 'Small-Medium';
  if (size.includes('51-200')) return 'Medium';
  if (size.includes('201-500')) return 'Medium-Large';
  if (size.includes('501-1,000')) return 'Large';
  if (size.includes('1,001-5,000')) return 'Very Large';
  if (size.includes('5,001-10,000') || size.includes('10,001+')) return 'Enterprise';
  return 'Unknown';
}

/**
 * Select and rank the best 150 companies
 */
async function createNotaryAccountsList() {
  console.log('🎯 Creating Notary Accounts List - Best 150 Florida & Arizona Companies\n');
  
  const companies = [];
  
  // Load the final normalized data
  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - Final Normalized.csv')
      .pipe(csv())
      .on('data', (row) => {
        companies.push(row);
      })
      .on('end', async () => {
        console.log(`📊 Loaded ${companies.length} total companies`);
        
        // Filter for Florida and Arizona companies only
        const targetCompanies = companies.filter(row => 
          row.State_Full === 'Florida' || row.State_Full === 'Arizona'
        );
        
        console.log(`🎯 Found ${targetCompanies.length} Florida & Arizona companies:`);
        
        const floridaCount = targetCompanies.filter(row => row.State_Full === 'Florida').length;
        const arizonaCount = targetCompanies.filter(row => row.State_Full === 'Arizona').length;
        
        console.log(`   🏖️ Florida: ${floridaCount} companies`);
        console.log(`   🌵 Arizona: ${arizonaCount} companies`);
        
        // Analyze connection status
        const withConnection = targetCompanies.filter(row => 
          row['Connection w/ Notary Everyday'] === 'TRUE'
        ).length;
        
        console.log(`   ✅ With Notary Connection: ${withConnection} companies`);
        console.log(`   📋 Without Connection: ${targetCompanies.length - withConnection} companies`);
        
        // Score and rank all target companies
        const scoredCompanies = targetCompanies.map(company => ({
          ...company,
          score: scoreCompany(company),
          sizeCategory: getSizeCategory(company.Size)
        }));
        
        // Sort by score (highest first)
        scoredCompanies.sort((a, b) => b.score - a.score);
        
        // Select top 150
        const top150 = scoredCompanies.slice(0, 150);
        
        console.log(`\n📊 SELECTION ANALYSIS:`);
        
        // Analyze by state
        const top150Florida = top150.filter(c => c.State_Full === 'Florida').length;
        const top150Arizona = top150.filter(c => c.State_Full === 'Arizona').length;
        console.log(`   🏖️ Florida companies selected: ${top150Florida}`);
        console.log(`   🌵 Arizona companies selected: ${top150Arizona}`);
        
        // Analyze by connection status
        const top150WithConnection = top150.filter(c => c['Connection w/ Notary Everyday'] === 'TRUE').length;
        console.log(`   ✅ With Notary Connection: ${top150WithConnection}`);
        console.log(`   📋 Without Connection: ${150 - top150WithConnection}`);
        
        // Analyze by size category
        const sizeDistribution = {};
        top150.forEach(company => {
          const category = company.sizeCategory;
          sizeDistribution[category] = (sizeDistribution[category] || 0) + 1;
        });
        
        console.log(`\n📏 SIZE DISTRIBUTION:`);
        Object.entries(sizeDistribution)
          .sort(([,a], [,b]) => b - a)
          .forEach(([category, count]) => {
            console.log(`   ${category}: ${count} companies`);
          });
        
        // Create the final dataset with rankings and assignments
        const notaryAccounts = top150.map((company, index) => ({
          Rank: index + 1,
          Account: company.Account,
          Size: company.Size,
          Type: company.Type,
          City: company.City,
          State_Full: company.State_Full,
          State_Abbr: company.State_Abbr,
          Location: company.Location,
          Normalized_Location: company.Normalized_Location,
          Country: company.Country,
          Domain: company.Domain,
          LinkedIn: company.LinkedIn,
          'Connection w/ Notary Everyday': company['Connection w/ Notary Everyday'],
          Assigned_User: 'dano', // Assign all top 150 to dano
          Score: company.score,
          Size_Category: company.sizeCategory,
          Selection_Reason: company['Connection w/ Notary Everyday'] === 'TRUE' ? 
            'Has Notary Connection' : 
            `${company.sizeCategory} size company`
        }));
        
        // Add remaining companies as unassigned
        const remaining = scoredCompanies.slice(150).map((company, index) => ({
          Rank: '', // No rank for unselected
          Account: company.Account,
          Size: company.Size,
          Type: company.Type,
          City: company.City,
          State_Full: company.State_Full,
          State_Abbr: company.State_Abbr,
          Location: company.Location,
          Normalized_Location: company.Normalized_Location,
          Country: company.Country,
          Domain: company.Domain,
          LinkedIn: company.LinkedIn,
          'Connection w/ Notary Everyday': company['Connection w/ Notary Everyday'],
          Assigned_User: '', // Unassigned
          Score: company.score,
          Size_Category: company.sizeCategory,
          Selection_Reason: 'Not selected - lower priority'
        }));
        
        // Combine top 150 + remaining
        const allRecords = [...notaryAccounts, ...remaining];
        
        // Write to CSV
        const headers = Object.keys(allRecords[0]).map(key => ({ id: key, title: key }));
        
        const csvWriter = createObjectCsvWriter({
          path: 'notary_accounts.csv',
          header: headers
        });

        await csvWriter.writeRecords(allRecords);
        
        console.log(`\n✅ Created notary_accounts.csv with ${allRecords.length} total companies`);
        console.log(`🎯 Top 150 ranked and assigned to 'dano'`);
        console.log(`📋 Remaining ${allRecords.length - 150} companies unassigned`);
        
        // Show sample of top selections
        console.log(`\n🏆 TOP 10 SELECTED COMPANIES:`);
        top150.slice(0, 10).forEach((company, index) => {
          const connection = company['Connection w/ Notary Everyday'] === 'TRUE' ? '✅' : '  ';
          console.log(`   ${index + 1}. ${connection} ${company.Account}`);
          console.log(`      📍 ${company.Normalized_Location}`);
          console.log(`      📏 ${company.sizeCategory} (${company.Size})`);
          console.log(`      🎯 Score: ${company.score}`);
          console.log('');
        });
        
        console.log(`🎉 Notary accounts list created successfully!`);
        console.log(`📁 File: notary_accounts.csv`);
        console.log(`👤 Assigned User: dano (for top 150)`);
        
        resolve({
          total: allRecords.length,
          selected: 150,
          florida: top150Florida,
          arizona: top150Arizona,
          withConnection: top150WithConnection
        });
      })
      .on('error', reject);
  });
}

// Main execution
async function main() {
  try {
    // Check if input file exists
    const inputFile = 'United States Title Agency Data - Final Normalized.csv';
    if (!fs.existsSync(inputFile)) {
      console.error(`❌ Input file not found: ${inputFile}`);
      console.log(`Please run the normalization script first.`);
      process.exit(1);
    }

    const results = await createNotaryAccountsList();
    
    console.log(`\n📊 FINAL SUMMARY:`);
    console.log(`   ✅ Selected: ${results.selected} companies`);
    console.log(`   🏖️ Florida: ${results.florida} companies`);
    console.log(`   🌵 Arizona: ${results.arizona} companies`);
    console.log(`   ✅ With Notary Connection: ${results.withConnection} companies`);
    console.log(`   👤 All assigned to: dano`);
    
  } catch (error) {
    console.error('❌ Error creating notary accounts list:', error);
    process.exit(1);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { scoreCompany, getSizeCategory };
