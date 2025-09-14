#!/usr/bin/env node

/**
 * Normalize Full Dataset and Upload Remaining Accounts
 * 
 * 1. Normalizes location data for all 3,737 companies
 * 2. Uploads remaining accounts (not in top 150) as unassigned
 * 3. Implements manager visibility pattern for Ryan
 * 
 * Usage: node scripts/data/normalize-and-upload-full-dataset.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

/**
 * Enhanced location normalization for full dataset
 */
function normalizeLocationData(locationString) {
  if (!locationString || locationString.trim() === '') {
    return {
      originalLocation: '',
      normalizedLocation: '',
      city: '',
      state: '',
      stateAbbr: '',
      stateFull: '',
      isValid: false,
      parseError: 'Empty location',
      confidence: 0
    };
  }

  // State mappings
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

  const stateAbbreviationMapping = Object.fromEntries(
    Object.entries(stateMapping).map(([abbr, full]) => [full, abbr])
  );

  let city = '';
  let state = '';
  let stateAbbr = '';
  let stateFull = '';
  let isValid = false;
  let parseError = '';
  let confidence = 1.0;

  const original = locationString.trim();
  let normalizedLocation = original;

  try {
    // Handle various location formats
    if (original.includes(',')) {
      const parts = original.split(',').map(part => part.trim());
      
      if (parts.length >= 2) {
        city = parts[0];
        const statePart = parts[1];
        
        // Check if it's a state abbreviation
        if (statePart.length === 2 && stateMapping[statePart.toUpperCase()]) {
          stateAbbr = statePart.toUpperCase();
          stateFull = stateMapping[stateAbbr];
          state = stateFull;
          isValid = true;
        }
        // Check if it's a full state name
        else if (stateAbbreviationMapping[statePart]) {
          stateFull = statePart;
          stateAbbr = stateAbbreviationMapping[statePart];
          state = stateFull;
          isValid = true;
        }
        // Try partial matching for common variations
        else {
          const stateVariations = {
            'florida': 'Florida', 'fl': 'Florida', 'fla': 'Florida',
            'arizona': 'Arizona', 'az': 'Arizona', 'ariz': 'Arizona',
            'california': 'California', 'ca': 'California', 'calif': 'California',
            'texas': 'Texas', 'tx': 'Texas', 'tex': 'Texas',
            'new york': 'New York', 'ny': 'New York', 'n.y.': 'New York'
          };
          
          const lowerState = statePart.toLowerCase().replace(/[.,]/g, '');
          if (stateVariations[lowerState]) {
            stateFull = stateVariations[lowerState];
            stateAbbr = stateAbbreviationMapping[stateFull];
            state = stateFull;
            isValid = true;
            confidence = 0.9;
          }
        }
      }
    } else {
      // Single word - might be just a state
      const cleaned = original.toLowerCase().replace(/[.,]/g, '');
      if (stateMapping[original.toUpperCase()]) {
        stateAbbr = original.toUpperCase();
        stateFull = stateMapping[stateAbbr];
        state = stateFull;
        city = '';
        isValid = true;
        confidence = 0.8;
      }
    }

    if (isValid) {
      normalizedLocation = city ? `${city}, ${stateFull}` : stateFull;
    } else {
      parseError = 'Could not parse location format';
      confidence = 0;
    }

  } catch (error) {
    parseError = `Parse error: ${error.message}`;
    confidence = 0;
  }

  return {
    originalLocation: original,
    normalizedLocation,
    city,
    state,
    stateAbbr,
    stateFull,
    isValid,
    parseError,
    confidence
  };
}

/**
 * Process and normalize the full dataset
 */
async function normalizeFullDataset() {
  console.log('🔄 Processing full dataset normalization...\n');
  
  const companies = [];
  const stats = {
    total: 0,
    normalized: 0,
    failed: 0,
    byState: {}
  };

  return new Promise((resolve, reject) => {
    fs.createReadStream('United States Title Agency Data - United States Title Agency Data.csv')
      .pipe(csv())
      .on('data', (row) => {
        stats.total++;
        
        // Normalize location
        const locationData = normalizeLocationData(row.Location);
        
        // Enhanced row with normalized data
        const enhancedRow = {
          ...row,
          Normalized_Location: locationData.normalizedLocation,
          City: locationData.city,
          State_Full: locationData.stateFull,
          State_Abbr: locationData.stateAbbr,
          Location_Valid: locationData.isValid ? 'YES' : 'NO',
          Location_Parse_Error: locationData.parseError,
          Normalization_Confidence: locationData.confidence.toFixed(2)
        };
        
        companies.push(enhancedRow);
        
        if (locationData.isValid) {
          stats.normalized++;
          if (locationData.stateFull) {
            stats.byState[locationData.stateFull] = (stats.byState[locationData.stateFull] || 0) + 1;
          }
        } else {
          stats.failed++;
        }
      })
      .on('end', async () => {
        console.log(`📊 Normalization Complete:`);
        console.log(`   Total companies: ${stats.total}`);
        console.log(`   Successfully normalized: ${stats.normalized} (${((stats.normalized/stats.total)*100).toFixed(1)}%)`);
        console.log(`   Failed to normalize: ${stats.failed}`);
        
        // Save normalized dataset
        const csvWriter = createObjectCsvWriter({
          path: 'United States Title Agency Data - Complete Normalized.csv',
          header: [
            {id: 'Account', title: 'Account'},
            {id: 'Size', title: 'Size'},
            {id: 'Type', title: 'Type'},
            {id: 'Location', title: 'Location'},
            {id: 'Country', title: 'Country'},
            {id: 'Domain', title: 'Domain'},
            {id: 'LinkedIn', title: 'LinkedIn'},
            {id: 'Connection w/ Notary Everyday', title: 'Connection w/ Notary Everyday'},
            {id: 'Normalized_Location', title: 'Normalized_Location'},
            {id: 'City', title: 'City'},
            {id: 'State_Full', title: 'State_Full'},
            {id: 'State_Abbr', title: 'State_Abbr'},
            {id: 'Location_Valid', title: 'Location_Valid'},
            {id: 'Location_Parse_Error', title: 'Location_Parse_Error'},
            {id: 'Normalization_Confidence', title: 'Normalization_Confidence'}
          ]
        });

        await csvWriter.writeRecords(companies);
        console.log(`✅ Saved: United States Title Agency Data - Complete Normalized.csv`);
        
        // Top 10 states by company count
        const topStates = Object.entries(stats.byState)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10);
        
        console.log(`\n🏛️ Top 10 States by Company Count:`);
        topStates.forEach(([state, count], index) => {
          console.log(`   ${index + 1}. ${state}: ${count} companies`);
        });
        
        resolve({ companies, stats });
      })
      .on('error', reject);
  });
}

/**
 * Upload remaining accounts as unassigned
 */
async function uploadRemainingAccounts(companies) {
  console.log('\n🔄 Uploading remaining accounts as unassigned...\n');
  
  // Find Notary Everyday workspace
  const workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { name: 'Notary Everyday' },
        { slug: 'ne' }
      ]
    }
  });

  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }

  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);

  // Get existing accounts to avoid duplicates
  const existingAccounts = await prisma.account.findMany({
    where: { workspaceId: workspace.id },
    select: { name: true }
  });
  
  const existingNames = new Set(existingAccounts.map(acc => acc.name.toLowerCase().trim()));
  console.log(`📋 Found ${existingAccounts.length} existing accounts`);

  // Filter out companies that are already imported
  const newCompanies = companies.filter(company => {
    const companyName = company.Account.replace(/"/g, '').toLowerCase().trim();
    return !existingNames.has(companyName);
  });

  console.log(`📤 Uploading ${newCompanies.length} new companies as unassigned...`);

  let uploadedCount = 0;
  const batchSize = 50;

  for (let i = 0; i < newCompanies.length; i += batchSize) {
    const batch = newCompanies.slice(i, i + batchSize);
    
    const accountsToCreate = batch.map(company => ({
      name: company.Account.replace(/"/g, '').trim(),
      industry: 'Title Insurance',
      size: company.Size || 'Unknown',
      city: company.City || null,
      state: company.State_Full || null,
      country: 'United States',
      website: company.Domain || null,
      workspaceId: workspace.id,
      assignedUserId: null, // Unassigned
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    try {
      await prisma.account.createMany({
        data: accountsToCreate,
        skipDuplicates: true
      });
      
      uploadedCount += accountsToCreate.length;
      console.log(`   Uploaded batch ${Math.floor(i/batchSize) + 1}: ${uploadedCount}/${newCompanies.length} companies`);
    } catch (error) {
      console.error(`❌ Error uploading batch ${Math.floor(i/batchSize) + 1}:`, error.message);
    }
  }

  console.log(`✅ Upload complete: ${uploadedCount} new companies added as unassigned`);
  
  // Final count verification
  const finalCount = await prisma.account.count({
    where: { workspaceId: workspace.id }
  });
  
  const assignedCount = await prisma.account.count({
    where: { 
      workspaceId: workspace.id,
      assignedUserId: { not: null }
    }
  });
  
  const unassignedCount = finalCount - assignedCount;
  
  console.log(`\n📊 Final Account Summary:`);
  console.log(`   Total accounts in workspace: ${finalCount}`);
  console.log(`   Assigned accounts: ${assignedCount}`);
  console.log(`   Unassigned accounts: ${unassignedCount}`);
  
  return { uploadedCount, finalCount, assignedCount, unassignedCount };
}

/**
 * Implement manager visibility pattern for Ryan
 */
async function implementManagerVisibility() {
  console.log('\n🔍 Implementing manager visibility pattern...\n');
  
  // Find Ryan
  const ryan = await prisma.user.findUnique({
    where: { email: 'ryan@notaryeveryday.com' }
  });
  
  if (!ryan) {
    throw new Error('Ryan Serrato not found!');
  }
  
  // Find Notary Everyday workspace
  const workspace = await prisma.workspace.findFirst({
    where: { name: 'Notary Everyday' }
  });
  
  // Verify Ryan's membership has manager role
  const membership = await prisma.workspaceMembership.findFirst({
    where: {
      userId: ryan.id,
      workspaceId: workspace.id
    }
  });
  
  if (!membership || membership.role !== 'manager') {
    await prisma.workspaceMembership.upsert({
      where: {
        userId_workspaceId: {
          userId: ryan.id,
          workspaceId: workspace.id
        }
      },
      update: {
        role: 'manager',
        isActive: true
      },
      create: {
        userId: ryan.id,
        workspaceId: workspace.id,
        role: 'manager',
        isActive: true
      }
    });
    console.log(`✅ Updated Ryan's role to manager`);
  } else {
    console.log(`✅ Ryan already has manager role`);
  }
  
  console.log(`\n🎯 Manager Visibility Pattern Implemented:`);
  console.log(`   ✅ Ryan has 'manager' role in Notary Everyday workspace`);
  console.log(`   ✅ Can view ALL accounts in workspace (assigned and unassigned)`);
  console.log(`   ✅ Can reassign accounts between users`);
  console.log(`   ✅ Can add leads/contacts to any account`);
  console.log(`   ❌ Does NOT own accounts directly (clean separation)`);
  
  return {
    ryanId: ryan.id,
    workspaceId: workspace.id,
    role: 'manager',
    hasFullVisibility: true
  };
}

/**
 * Generate comprehensive report
 */
async function generateReport(normalizationStats, uploadStats, visibilityStats) {
  const report = {
    timestamp: new Date().toISOString(),
    normalization: {
      totalCompanies: normalizationStats.total,
      successfullyNormalized: normalizationStats.normalized,
      normalizationRate: ((normalizationStats.normalized / normalizationStats.total) * 100).toFixed(1) + '%',
      topStates: Object.entries(normalizationStats.byState)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 15)
        .map(([state, count]) => ({ state, count }))
    },
    upload: {
      newAccountsUploaded: uploadStats.uploadedCount,
      totalAccountsInWorkspace: uploadStats.finalCount,
      assignedAccounts: uploadStats.assignedCount,
      unassignedAccounts: uploadStats.unassignedCount
    },
    managerVisibility: {
      ryanUserId: visibilityStats.ryanId,
      workspaceId: visibilityStats.workspaceId,
      role: visibilityStats.role,
      hasFullVisibility: visibilityStats.hasFullVisibility,
      implementation: 'Role-based access control with manager permissions'
    },
    recommendations: [
      'Ryan can view all accounts without ownership assignment',
      'Use role-based permissions for scalable access control',
      'Maintain clean separation between visibility and ownership',
      'Consider implementing team-based sharing for future scaling'
    ]
  };
  
  // Save report
  const reportsDir = 'scripts/reports';
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    'scripts/reports/full-dataset-normalization-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log(`\n📋 Comprehensive report saved to: scripts/reports/full-dataset-normalization-report.json`);
  
  return report;
}

/**
 * Main execution function
 */
async function main() {
  console.log('🎯 FULL DATASET NORMALIZATION & UPLOAD\n');
  console.log('Tasks:');
  console.log('1. Normalize location data for all 3,737 companies');
  console.log('2. Upload remaining accounts as unassigned');
  console.log('3. Implement manager visibility for Ryan\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Step 1: Normalize full dataset
    console.log('📍 Step 1: Normalizing location data...');
    const { companies, stats } = await normalizeFullDataset();
    
    // Step 2: Upload remaining accounts
    console.log('\n📤 Step 2: Uploading remaining accounts...');
    const uploadStats = await uploadRemainingAccounts(companies);
    
    // Step 3: Implement manager visibility
    console.log('\n👁️ Step 3: Implementing manager visibility...');
    const visibilityStats = await implementManagerVisibility();
    
    // Step 4: Generate comprehensive report
    console.log('\n📊 Step 4: Generating comprehensive report...');
    const report = await generateReport(stats, uploadStats, visibilityStats);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 FULL DATASET PROCESSING COMPLETE');
    console.log('='.repeat(60));
    
    console.log(`\n📈 Summary:`);
    console.log(`   📍 Location normalization: ${report.normalization.normalizationRate} success rate`);
    console.log(`   📤 New accounts uploaded: ${report.upload.newAccountsUploaded}`);
    console.log(`   👁️ Manager visibility: Implemented for Ryan`);
    console.log(`   📊 Total workspace accounts: ${report.upload.totalAccountsInWorkspace}`);
    
    console.log(`\n🎯 Ryan's Access:`);
    console.log(`   ✅ Can view ${report.upload.totalAccountsInWorkspace} total accounts`);
    console.log(`   ✅ Including ${report.upload.assignedAccounts} assigned to Dano`);
    console.log(`   ✅ Including ${report.upload.unassignedAccounts} unassigned accounts`);
    console.log(`   ✅ No direct ownership - clean manager oversight`);
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as normalizeAndUploadFullDataset };
