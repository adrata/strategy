#!/usr/bin/env node

/**
 * Process Dan's Accounts CSV and Sync with Database
 * Cleans up the data and checks/adds missing accounts
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean company names function
function cleanCompanyName(name) {
  return name
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\.$/, '') // Remove trailing period
    .replace(/^The\s+/i, '') // Remove "The" prefix
    .replace(/\([^)]*\)/g, '') // Remove parenthetical content
    .replace(/\s+Inc\.?$/i, '') // Remove "Inc." suffix
    .replace(/\s+Corp\.?$/i, '') // Remove "Corp." suffix
    .replace(/\s+LLC\.?$/i, '') // Remove "LLC" suffix
    .replace(/\s+Ltd\.?$/i, '') // Remove "Ltd." suffix
    .replace(/\s+plc$/i, '') // Remove "plc" suffix
    .replace(/\s+NV$/i, '') // Remove "NV" suffix
    .replace(/\s+SE$/i, '') // Remove "SE" suffix
    .replace(/\s+AG$/i, '') // Remove "AG" suffix
    .replace(/\s+Co\.?$/i, '') // Remove "Co." suffix
    .trim();
}

// Normalize company names for comparison
function normalizeCompanyName(name) {
  return cleanCompanyName(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove all non-alphanumeric characters
    .replace(/\s+/g, ''); // Remove all spaces
}

async function processDanAccounts() {
  try {
    console.log('🔍 Processing Dan\'s Accounts CSV...\n');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '..', 'dan_accounts.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    // Parse CSV (simple parsing for this format)
    const lines = csvContent.split('\n').filter(line => line.trim());
    const accounts = lines.slice(1); // Skip header "Accounts"
    
    console.log(`📊 Found ${accounts.length} accounts in CSV\n`);
    
    // Clean and normalize company names
    const cleanedAccounts = accounts.map(name => ({
      original: name.trim(),
      cleaned: cleanCompanyName(name),
      normalized: normalizeCompanyName(name)
    }));
    
    // Remove duplicates based on normalized names
    const uniqueAccounts = [];
    const seen = new Set();
    
    for (const account of cleanedAccounts) {
      if (!seen.has(account.normalized)) {
        seen.add(account.normalized);
        uniqueAccounts.push(account);
      }
    }
    
    console.log(`🧹 Cleaned and deduplicated: ${uniqueAccounts.length} unique accounts\n`);
    
    // Check which accounts exist in dan's database
    console.log('🔍 Checking existing accounts in database...\n');
    
    const existingAccounts = [];
    const missingAccounts = [];
    
    for (const account of uniqueAccounts) {
      try {
        // Search for account by name (case-insensitive)
        const existing = await prisma.accounts.findFirst({
          where: {
            name: {
              contains: account.cleaned,
              mode: 'insensitive'
            },
            assignedUserId: 'dano' // Dan's user ID
          }
        });
        
        if (existing) {
          existingAccounts.push({
            csv: account.cleaned,
            database: existing.name,
            id: existing.id
          });
        } else {
          missingAccounts.push(account);
        }
      } catch (error) {
        console.log(`❌ Error checking account "${account.cleaned}":`, error.message);
        missingAccounts.push(account);
      }
    }
    
    console.log(`✅ Found ${existingAccounts.length} existing accounts`);
    console.log(`❌ Found ${missingAccounts.length} missing accounts\n`);
    
    // Show existing accounts
    if (existingAccounts.length > 0) {
      console.log('📋 Existing Accounts:');
      existingAccounts.slice(0, 10).forEach(acc => {
        console.log(`   ✅ ${acc.csv} → ${acc.database} (ID: ${acc.id})`);
      });
      if (existingAccounts.length > 10) {
        console.log(`   ... and ${existingAccounts.length - 10} more`);
      }
      console.log('');
    }
    
    // Show missing accounts
    if (missingAccounts.length > 0) {
      console.log('📋 Missing Accounts (first 20):');
      missingAccounts.slice(0, 20).forEach(acc => {
        console.log(`   ❌ ${acc.cleaned} (original: ${acc.original})`);
      });
      if (missingAccounts.length > 20) {
        console.log(`   ... and ${missingAccounts.length - 20} more`);
      }
      console.log('');
    }
    
    // Ask if user wants to add missing accounts
    if (missingAccounts.length > 0) {
      console.log(`🎯 Would you like to add ${missingAccounts.length} missing accounts to the database?`);
      console.log('   This will create new account records for Dan.');
      console.log('');
      
      // For now, just show the count. In a real scenario, you'd prompt for confirmation
      console.log(`💡 To add missing accounts, you can run:`);
      console.log(`   node scripts/add-missing-accounts.js`);
    }
    
    // Save cleaned data
    const cleanedCsvPath = path.join(__dirname, '..', 'dan_accounts_cleaned.csv');
    const cleanedCsvContent = ['Company Name,Original Name,Status'].concat(
      uniqueAccounts.map(acc => {
        const status = existingAccounts.some(existing => 
          existing.csv === acc.cleaned
        ) ? 'EXISTS' : 'MISSING';
        return `"${acc.cleaned}","${acc.original}","${status}"`;
      })
    ).join('\n');
    
    fs.writeFileSync(cleanedCsvPath, cleanedCsvContent);
    console.log(`💾 Saved cleaned data to: dan_accounts_cleaned.csv`);
    
    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`   📁 Total accounts in CSV: ${accounts.length}`);
    console.log(`   🧹 Unique accounts after cleaning: ${uniqueAccounts.length}`);
    console.log(`   ✅ Already in database: ${existingAccounts.length}`);
    console.log(`   ❌ Missing from database: ${missingAccounts.length}`);
    console.log(`   💾 Cleaned CSV saved: dan_accounts_cleaned.csv`);
    
  } catch (error) {
    console.error('❌ Error processing accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the processor
if (require.main === module) {
  processDanAccounts();
}

module.exports = { processDanAccounts, cleanCompanyName, normalizeCompanyName };
