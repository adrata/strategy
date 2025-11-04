#!/usr/bin/env node

/**
 * Import Title Data NE 2025 - Sheet1 (1).csv
 * 
 * This script imports companies and people from the CSV file
 * into the Notary Everyday workspace, assigns Ryan as the main seller,
 * and updates all existing companies to have state = Arizona.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Normalize email for comparison (lowercase, trim)
function normalizeEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

// Normalize name for comparison (lowercase, trim, remove extra spaces)
function normalizeName(name) {
  if (!name) return null;
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
}

// Normalize phone for comparison (remove formatting)
function normalizePhone(phone) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

// Extract domain from email
function getDomain(email) {
  if (!email) return null;
  const normalized = normalizeEmail(email);
  const parts = normalized.split('@');
  return parts.length === 2 ? parts[1] : null;
}

// Parse address to extract city, state, postal code
function parseAddress(addressStr) {
  if (!addressStr) {
    return {
      address: null,
      city: null,
      state: 'Arizona',
      postalCode: null,
      country: 'United States'
    };
  }

  const address = addressStr.trim();
  
  // Default values
  let city = null;
  let state = 'Arizona';
  let postalCode = null;
  const country = 'United States';

  // Try to extract state and postal code
  // Pattern: "City, ST ZIP" or "City, ST ZIP ZIP" or "City, ST"
  const stateZipPattern = /,\s*([A-Z]{2})\s+(\d{5}(?:-\d{4})?)/;
  const statePattern = /,\s*([A-Z]{2})(?:\s|$)/;
  
  const stateZipMatch = address.match(stateZipPattern);
  if (stateZipMatch) {
    state = stateZipMatch[1];
    postalCode = stateZipMatch[2];
    
    // Extract city (everything before the comma)
    const cityMatch = address.match(/^(.+?),/);
    if (cityMatch) {
      city = cityMatch[1].trim();
    }
  } else {
    const stateMatch = address.match(statePattern);
    if (stateMatch) {
      state = stateMatch[1];
      
      // Extract city (everything before the comma)
      const cityMatch = address.match(/^(.+?),/);
      if (cityMatch) {
        city = cityMatch[1].trim();
      }
    }
  }

  // Normalize state abbreviations
  if (state === 'AZ') {
    state = 'Arizona';
  }

  return {
    address,
    city,
    state,
    postalCode,
    country
  };
}

// Parse CSV file
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const data = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted fields)
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim()); // Add last value

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    data.push(row);
  }

  return data;
}

// Find or create company
async function findOrCreateCompany(csvCompany, csvEmail, csvPhone, csvAddress, workspaceId, ryanId) {
  if (!csvCompany) return null;

  const normalizedCsvCompany = normalizeName(csvCompany);
  const normalizedCsvEmail = normalizeEmail(csvEmail);
  const normalizedCsvPhone = normalizePhone(csvPhone);
  const csvDomain = getDomain(csvEmail);

  // Try to find existing company
  const existingCompany = await prisma.companies.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { name: { equals: csvCompany, mode: 'insensitive' } },
        ...(normalizedCsvEmail ? [{ email: { equals: normalizedCsvEmail, mode: 'insensitive' } }] : []),
        ...(normalizedCsvPhone ? [{ phone: { equals: normalizedCsvPhone } }] : []),
        ...(csvDomain ? [{ domain: { equals: csvDomain } }] : [])
      ]
    }
  });

  if (existingCompany) {
    // Update existing company if needed
    const updateData = {};
    
    // Update state if missing
    if (!existingCompany.state) {
      const parsedAddr = parseAddress(csvAddress);
      updateData.state = parsedAddr.state;
    }
    
    // Update mainSellerId if not set to Ryan
    if (existingCompany.mainSellerId !== ryanId) {
      updateData.mainSellerId = ryanId;
    }

    // Update email if missing
    if (!existingCompany.email && normalizedCsvEmail) {
      updateData.email = normalizedCsvEmail;
      updateData.domain = csvDomain;
    }

    // Update phone if missing
    if (!existingCompany.phone && normalizedCsvPhone) {
      updateData.phone = csvPhone; // Keep original format
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.companies.update({
        where: { id: existingCompany.id },
        data: updateData
      });
    }

    return existingCompany;
  }

  // Create new company
  const parsedAddr = parseAddress(csvAddress);
  
  const newCompany = await prisma.companies.create({
    data: {
      workspaceId,
      name: csvCompany,
      email: normalizedCsvEmail,
      phone: csvPhone,
      address: parsedAddr.address,
      city: parsedAddr.city,
      state: parsedAddr.state,
      postalCode: parsedAddr.postalCode,
      country: parsedAddr.country,
      domain: csvDomain,
      mainSellerId: ryanId,
      status: 'ACTIVE',
      priority: 'MEDIUM'
    }
  });

  return newCompany;
}

// Find or create person
async function findOrCreatePerson(csvName, csvEmail, csvPhone, companyId, workspaceId, ryanId) {
  if (!csvName) return null;

  // Parse name
  const nameParts = csvName.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const fullName = csvName.trim();

  const normalizedCsvEmail = normalizeEmail(csvEmail);
  const normalizedCsvPhone = normalizePhone(csvPhone);

  // Try to find existing person
  const existingPerson = await prisma.people.findFirst({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { fullName: { equals: fullName, mode: 'insensitive' } },
        ...(normalizedCsvEmail ? [
          { email: { equals: normalizedCsvEmail, mode: 'insensitive' } },
          { workEmail: { equals: normalizedCsvEmail, mode: 'insensitive' } },
          { personalEmail: { equals: normalizedCsvEmail, mode: 'insensitive' } }
        ] : []),
        ...(normalizedCsvPhone ? [
          { phone: { equals: normalizedCsvPhone } },
          { mobilePhone: { equals: normalizedCsvPhone } },
          { workPhone: { equals: normalizedCsvPhone } }
        ] : [])
      ]
    }
  });

  if (existingPerson) {
    // Update existing person if needed
    const updateData = {};
    
    // Update mainSellerId if not set to Ryan
    if (existingPerson.mainSellerId !== ryanId) {
      updateData.mainSellerId = ryanId;
    }

    // Update companyId if different
    if (existingPerson.companyId !== companyId && companyId) {
      updateData.companyId = companyId;
    }

    // Update email if missing
    if (!existingPerson.email && normalizedCsvEmail) {
      updateData.email = normalizedCsvEmail;
    }

    // Update phone if missing
    if (!existingPerson.phone && normalizedCsvPhone) {
      updateData.phone = csvPhone; // Keep original format
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.people.update({
        where: { id: existingPerson.id },
        data: updateData
      });
    }

    return existingPerson;
  }

  // Create new person
  const newPerson = await prisma.people.create({
    data: {
      workspaceId,
      companyId,
      firstName,
      lastName,
      fullName,
      email: normalizedCsvEmail,
      phone: csvPhone,
      mainSellerId: ryanId,
      status: 'LEAD',
      priority: 'MEDIUM'
    }
  });

  return newPerson;
}

// Update all existing companies to have state = Arizona
async function updateAllCompaniesState(workspaceId) {
  console.log('\n📊 Updating all existing companies to have state = Arizona...');
  
  const result = await prisma.companies.updateMany({
    where: {
      workspaceId,
      deletedAt: null,
      OR: [
        { state: null },
        { state: '' }
      ]
    },
    data: {
      state: 'Arizona'
    }
  });

  console.log(`✅ Updated ${result.count} companies with state = Arizona`);
  return result.count;
}

async function findNotaryEverydayWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  const workspace = await prisma.workspaces.findFirst({
    where: {
      OR: [
        { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
        { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
        { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
        { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
      ]
    }
  });
  
  if (!workspace) {
    throw new Error('Notary Everyday workspace not found!');
  }

  console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  return workspace;
}

async function findRyanUser() {
  console.log('🔍 Finding Ryan user...');
  
  const ryan = await prisma.users.findFirst({
    where: {
      email: 'ryan@notaryeveryday.com'
    }
  });
  
  if (!ryan) {
    throw new Error('Ryan user not found! Expected email: ryan@notaryeveryday.com');
  }

  console.log(`✅ Found user: ${ryan.name || ryan.email} (${ryan.id})`);
  return ryan;
}

async function main() {
  try {
    console.log('📋 Importing Title Data NE 2025 - Sheet1 (1).csv into Notary Everyday workspace\n');

    // Find workspace and user
    const workspace = await findNotaryEverydayWorkspace();
    const ryan = await findRyanUser();

    // Parse CSV
    const csvPath = path.join(process.cwd(), 'Title Data NE 2025 - Sheet1 (1).csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log('\n📄 Parsing CSV file...');
    const csvData = parseCSV(csvPath);
    console.log(`✅ Parsed ${csvData.length} rows from CSV\n`);

    // Statistics
    const stats = {
      companiesCreated: 0,
      companiesUpdated: 0,
      peopleCreated: 0,
      peopleUpdated: 0,
      skipped: 0,
      errors: []
    };

    // Process each CSV row
    console.log('🔄 Processing CSV rows...\n');
    
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      const csvCompany = row.Company?.trim();
      const csvName = row.Name?.trim();
      const csvEmail = row.Email?.trim();
      const csvPhone = row.Phone?.trim();
      const csvAddress = row.Address?.trim();

      try {
        // Process company
        let company = null;
        if (csvCompany) {
          const existingBefore = await prisma.companies.findFirst({
            where: {
              workspaceId: workspace.id,
              name: { equals: csvCompany, mode: 'insensitive' },
              deletedAt: null
            }
          });

          company = await findOrCreateCompany(
            csvCompany,
            csvEmail,
            csvPhone,
            csvAddress,
            workspace.id,
            ryan.id
          );

          if (existingBefore) {
            stats.companiesUpdated++;
          } else {
            stats.companiesCreated++;
          }
        }

        // Process person
        if (csvName) {
          const existingBefore = await prisma.people.findFirst({
            where: {
              workspaceId: workspace.id,
              fullName: { equals: csvName.trim(), mode: 'insensitive' },
              deletedAt: null
            }
          });

          await findOrCreatePerson(
            csvName,
            csvEmail,
            csvPhone,
            company?.id || null,
            workspace.id,
            ryan.id
          );

          if (existingBefore) {
            stats.peopleUpdated++;
          } else {
            stats.peopleCreated++;
          }
        }

        if (i % 10 === 0) {
          process.stdout.write(`\r   Processed ${i + 1}/${csvData.length} rows...`);
        }
      } catch (error) {
        stats.errors.push({
          row: i + 1,
          company: csvCompany,
          person: csvName,
          error: error.message
        });
        console.error(`\n❌ Error processing row ${i + 1}: ${error.message}`);
      }
    }

    console.log(`\n✅ Processed all ${csvData.length} rows\n`);

    // Update all existing companies to have state = Arizona
    const updatedCount = await updateAllCompaniesState(workspace.id);

    // Print summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🏢 COMPANIES:`);
    console.log(`   ✅ Created: ${stats.companiesCreated}`);
    console.log(`   🔄 Updated: ${stats.companiesUpdated}`);
    console.log(`   📍 State updated: ${updatedCount} companies set to Arizona`);
    
    console.log(`\n👥 PEOPLE:`);
    console.log(`   ✅ Created: ${stats.peopleCreated}`);
    console.log(`   🔄 Updated: ${stats.peopleUpdated}`);
    
    console.log(`\n⚠️  ERRORS:`);
    if (stats.errors.length === 0) {
      console.log(`   ✅ No errors`);
    } else {
      console.log(`   ❌ ${stats.errors.length} errors occurred`);
      stats.errors.slice(0, 5).forEach(err => {
        console.log(`      - Row ${err.row}: ${err.error}`);
      });
      if (stats.errors.length > 5) {
        console.log(`      ... and ${stats.errors.length - 5} more`);
      }
    }

    console.log(`\n👤 MAIN SELLER:`);
    console.log(`   ✅ All imported records assigned to: ${ryan.name || ryan.email}`);

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

