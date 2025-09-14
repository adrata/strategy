#!/usr/bin/env node

/**
 * Add Missing Accounts to Dan's Database
 * Creates new account records for companies in dan_accounts.csv
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Clean company names function (same as process script)
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

async function addMissingAccounts() {
  try {
    console.log('🚀 Adding Missing Accounts to Dan\'s Database...\n');
    
    // Read the cleaned CSV file
    const csvPath = path.join(__dirname, '..', 'dan_accounts_cleaned.csv');
    if (!fs.existsSync(csvPath)) {
      console.log('❌ Cleaned CSV file not found. Please run process-dan-accounts.js first.');
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const accounts = lines.slice(1); // Skip header
    
    // Parse accounts and filter for missing ones
    const missingAccounts = [];
    for (const line of accounts) {
      const [companyName, originalName, status] = line.split(',').map(field => 
        field.replace(/^"/, '').replace(/"$/, '') // Remove quotes
      );
      
      if (status === 'MISSING') {
        missingAccounts.push({
          name: companyName,
          original: originalName
        });
      }
    }
    
    console.log(`📊 Found ${missingAccounts.length} missing accounts to add\n`);
    
    if (missingAccounts.length === 0) {
      console.log('✅ No missing accounts to add!');
      return;
    }
    
    // Get Dan's workspace ID
    console.log('🔍 Getting Dan\'s workspace information...');
    const danUser = await prisma.users.findFirst({
      where: { id: '01K1VBYZMWTCT09FWEKBDMCXZM' }
    });
    
    if (!danUser) {
      console.log('❌ Dan Mirolli not found in database');
      return;
    }
    
    console.log(`✅ Found Dan Mirolli: ${danUser.name || danUser.id}`);
    
    // Get workspace ID (assuming Dan has a default workspace)
    const workspace = await prisma.workspaces.findFirst({
      where: { 
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'Retail Product Solutions', mode: 'insensitive' } },
          { name: { contains: 'Adrata', mode: 'insensitive' } }
        ]
      }
    });
    
    if (!workspace) {
      console.log('❌ No suitable workspace found for Dan');
      return;
    }
    
    console.log(`✅ Using workspace: ${workspace.name} (ID: ${workspace.id})\n`);
    
    // Add accounts in batches
    const batchSize = 50;
    let addedCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < missingAccounts.length; i += batchSize) {
      const batch = missingAccounts.slice(i, i + batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingAccounts.length / batchSize)} (${batch.length} accounts)`);
      
      for (const account of batch) {
        try {
          // Create new account
          const newAccount = await prisma.accounts.create({
            data: {
              id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              workspaceId: workspace.id,
              assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM',
              name: account.name,
              industry: 'Technology', // Default industry
              accountType: 'Prospect',
              tier: 'Tier 2',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          
          addedCount++;
          if (addedCount % 10 === 0) {
            console.log(`   ✅ Added ${addedCount} accounts so far...`);
          }
          
        } catch (error) {
          errorCount++;
          console.log(`   ❌ Error adding "${account.name}": ${error.message}`);
        }
      }
      
      // Small delay between batches to avoid overwhelming the database
      if (i + batchSize < missingAccounts.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('\n🎉 ACCOUNT ADDITION COMPLETE!');
    console.log(`   ✅ Successfully added: ${addedCount} accounts`);
    console.log(`   ❌ Errors: ${errorCount} accounts`);
    console.log(`   📊 Total processed: ${missingAccounts.length} accounts`);
    
    if (addedCount > 0) {
      console.log(`\n💡 Dan Mirolli now has ${addedCount} new accounts in his database!`);
      console.log('   These accounts are ready for lead generation and sales activities.');
    }
    
  } catch (error) {
    console.error('❌ Error adding accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the adder
if (require.main === module) {
  addMissingAccounts();
}

module.exports = { addMissingAccounts };
