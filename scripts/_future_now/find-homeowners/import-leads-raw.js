#!/usr/bin/env node
/**
 * Import Paradise Valley leads using raw SQL
 */

require('dotenv/config');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { ulid } = require('ulid');

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

function escapeSQL(str) {
  if (!str) return null;
  return str.replace(/'/g, "''");
}

async function main() {
  console.log('\n============================================================');
  console.log('   IMPORT LEADS - Paradise Valley (Raw SQL)');
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
  
  // Import leads using raw SQL
  console.log('\n   Importing leads with raw SQL...\n');
  
  let imported = 0;
  let skipped = 0;
  let errors = 0;
  
  for (const record of uniqueRecords) {
    try {
      // Check for existing
      const existing = await prisma.$queryRaw`
        SELECT id FROM people 
        WHERE "workspaceId" = ${WORKSPACE_ID} 
        AND address = ${record.Address}
        AND "deletedAt" IS NULL
        LIMIT 1
      `;
      
      if (existing && existing.length > 0) {
        skipped++;
        continue;
      }
      
      const nameParts = parseOwnerName(record.Name);
      const id = ulid();
      const now = new Date();
      
      await prisma.$executeRaw`
        INSERT INTO people (
          id, "workspaceId", "firstName", "lastName", "fullName",
          phone, address, city, state, "postalCode", country,
          source, "mainSellerId", notes, "createdAt", "updatedAt"
        ) VALUES (
          ${id},
          ${WORKSPACE_ID},
          ${nameParts.firstName.substring(0, 100)},
          ${nameParts.lastName.substring(0, 100)},
          ${(record.Name || 'Unknown').substring(0, 200)},
          ${record.Phone ? record.Phone.substring(0, 50) : null},
          ${record.Address ? record.Address.substring(0, 500) : null},
          ${record.City ? record.City.substring(0, 100) : null},
          ${record.State ? record.State.substring(0, 100) : null},
          ${record.Zip ? record.Zip.substring(0, 50) : null},
          ${'US'},
          ${'BatchData - Paradise Valley'},
          ${USER_ID},
          ${`Paradise Valley gate prospect\nPhone: ${record.Phone}`},
          ${now},
          ${now}
        )
      `;
      
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

