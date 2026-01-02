#!/usr/bin/env node
/**
 * Import Paradise Valley leads into Josh's workspace
 * Reads from CSV and imports to database
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Rune Gate workspace
const WORKSPACE_ID = '01KBDP8ZXDTAHJNT14S3WB1DTA';
const USER_ID = '01KBDP90BC19AEE6ACM86T7QK4'; // Joshua

async function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const record = {};
    headers.forEach((header, idx) => {
      record[header] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

function parseOwnerName(fullName) {
  if (!fullName) return { firstName: 'Unknown', lastName: 'Homeowner' };
  
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Homeowner' };
  }
  
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT LEADS - Paradise Valley to Josh\'s Workspace');
  console.log('============================================================\n');

  // Read both CSV files
  const csvDir = path.join(__dirname);
  const csv1Path = path.join(csvDir, 'paradise-valley-leads-with-phones.csv');
  const csv2Path = path.join(csvDir, 'paradise-valley-leads-2025-12-02.csv');
  
  let allRecords = [];
  
  if (fs.existsSync(csv1Path)) {
    const records1 = await parseCSV(csv1Path);
    console.log(`   Loaded ${records1.length} records from first CSV`);
    allRecords = allRecords.concat(records1);
  }
  
  if (fs.existsSync(csv2Path)) {
    const records2 = await parseCSV(csv2Path);
    console.log(`   Loaded ${records2.length} records from second CSV`);
    allRecords = allRecords.concat(records2);
  }
  
  // Filter to only those with phone numbers
  const withPhones = allRecords.filter(r => r.Phone && r.Phone.trim() !== '');
  console.log(`\n   Total records with phones: ${withPhones.length}`);
  
  // Dedupe by address
  const uniqueByAddress = new Map();
  for (const record of withPhones) {
    const key = record.Address?.toLowerCase();
    if (key && !uniqueByAddress.has(key)) {
      uniqueByAddress.set(key, record);
    }
  }
  
  const uniqueRecords = Array.from(uniqueByAddress.values());
  console.log(`   Unique addresses: ${uniqueRecords.length}`);
  
  // Connect to database
  await prisma.$connect();
  console.log('\n   Connected to database');
  
  // Check workspace exists
  const workspace = await prisma.workspaces.findUnique({
    where: { id: WORKSPACE_ID }
  });
  
  if (!workspace) {
    console.error('   ERROR: Workspace not found!');
    process.exit(1);
  }
  console.log(`   Workspace: ${workspace.name}`);
  
  // Import leads
  console.log('\n   Importing leads...\n');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const record of uniqueRecords) {
    try {
      // Check for existing
      const existing = await prisma.people.findFirst({
        where: {
          workspaceId: WORKSPACE_ID,
          address: record.Address,
          deletedAt: null
        }
      });
      
      if (existing) {
        skipped++;
        continue;
      }
      
      const nameParts = parseOwnerName(record.Name);
      
      // Create with minimal fields to avoid serialization issues
      await prisma.people.create({
        data: {
          workspaceId: WORKSPACE_ID,
          firstName: String(nameParts.firstName || 'Unknown').substring(0, 100),
          lastName: String(nameParts.lastName || 'Homeowner').substring(0, 100),
          fullName: String(record.Name || 'Unknown Homeowner').substring(0, 200),
          phone: record.Phone ? String(record.Phone).substring(0, 50) : null,
          address: record.Address ? String(record.Address).substring(0, 500) : null,
          city: record.City ? String(record.City).substring(0, 100) : null,
          state: record.State ? String(record.State).substring(0, 100) : null,
          postalCode: record.Zip ? String(record.Zip).substring(0, 50) : null,
          country: 'US',
          source: 'BatchData - Paradise Valley',
          mainSellerId: USER_ID,
          notes: `Paradise Valley gate prospect\nAddress: ${record.Address}\nPhone: ${record.Phone}`
        }
      });
      
      imported++;
      process.stdout.write(`\r   Progress: ${imported} imported, ${skipped} skipped, ${errors} errors`);
      
    } catch (err) {
      errors++;
      if (errors <= 3) {
        console.error(`\n   Error importing ${record.Name}: ${err.message}`);
      }
    }
  }
  
  console.log('\n\n============================================================');
  console.log('   IMPORT COMPLETE');
  console.log('============================================================');
  console.log(`   Total records: ${uniqueRecords.length}`);
  console.log(`   Imported: ${imported}`);
  console.log(`   Skipped (duplicates): ${skipped}`);
  console.log(`   Errors: ${errors}`);
  console.log('============================================================\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);

