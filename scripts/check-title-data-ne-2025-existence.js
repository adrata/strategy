#!/usr/bin/env node

/**
 * Check Title Data NE 2025 - Sheet1 (1).csv
 * 
 * This script checks if companies and people from the CSV file
 * exist in the Notary Everyday workspace.
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

async function checkCompaniesAndPeople(csvData, workspaceId) {
  const results = {
    totalRows: csvData.length,
    companies: {
      found: [],
      notFound: [],
      partialMatches: []
    },
    people: {
      found: [],
      notFound: [],
      partialMatches: []
    }
  };

  console.log(`\n📊 Checking ${csvData.length} rows from CSV...\n`);

  // Get all companies and people from the workspace
  const [allCompanies, allPeople] = await Promise.all([
    prisma.companies.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        domain: true
      }
    }),
    prisma.people.findMany({
      where: {
        workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        email: true,
        workEmail: true,
        personalEmail: true,
        phone: true,
        mobilePhone: true,
        workPhone: true,
        currentCompany: true
      }
    })
  ]);

  console.log(`📦 Found ${allCompanies.length} companies and ${allPeople.length} people in workspace\n`);

  // Normalize existing data for matching
  const normalizedCompanies = allCompanies.map(company => ({
    ...company,
    normalizedName: normalizeName(company.name),
    normalizedEmail: normalizeEmail(company.email),
    normalizedPhone: normalizePhone(company.phone),
    domain: company.domain || getDomain(company.email)
  }));

  const normalizedPeople = allPeople.map(person => ({
    ...person,
    normalizedFullName: normalizeName(person.fullName),
    normalizedFirstName: normalizeName(person.firstName),
    normalizedLastName: normalizeName(person.lastName),
    normalizedEmail: normalizeEmail(person.email),
    normalizedWorkEmail: normalizeEmail(person.workEmail),
    normalizedPersonalEmail: normalizeEmail(person.personalEmail),
    normalizedPhone: normalizePhone(person.phone),
    normalizedMobilePhone: normalizePhone(person.mobilePhone),
    normalizedWorkPhone: normalizePhone(person.workPhone),
    normalizedCurrentCompany: normalizeName(person.currentCompany)
  }));

  // Process each CSV row
  for (let i = 0; i < csvData.length; i++) {
    const row = csvData[i];
    const csvCompany = row.Company?.trim();
    const csvName = row.Name?.trim();
    const csvEmail = row.Email?.trim();
    const csvPhone = row.Phone?.trim();

    if (!csvCompany && !csvName) {
      continue; // Skip rows without company or name
    }

    // Check company match
    let companyMatch = null;
    if (csvCompany) {
      const normalizedCsvCompany = normalizeName(csvCompany);
      const normalizedCsvEmail = normalizeEmail(csvEmail);
      const normalizedCsvPhone = normalizePhone(csvPhone);
      const csvDomain = getDomain(csvEmail);

      // Try exact name match
      companyMatch = normalizedCompanies.find(c => 
        c.normalizedName === normalizedCsvCompany
      );

      // Try email match
      if (!companyMatch && normalizedCsvEmail) {
        companyMatch = normalizedCompanies.find(c => 
          c.normalizedEmail === normalizedCsvEmail ||
          c.domain === csvDomain
        );
      }

      // Try phone match
      if (!companyMatch && normalizedCsvPhone) {
        companyMatch = normalizedCompanies.find(c => 
          c.normalizedPhone && c.normalizedPhone === normalizedCsvPhone
        );
      }

      // Try partial name match
      if (!companyMatch) {
        const partialMatch = normalizedCompanies.find(c => 
          c.normalizedName && c.normalizedName.includes(normalizedCsvCompany) ||
          normalizedCsvCompany.includes(c.normalizedName)
        );
        if (partialMatch) {
          results.companies.partialMatches.push({
            csv: csvCompany,
            found: partialMatch.name,
            matchType: 'partial-name'
          });
        }
      }

      if (companyMatch) {
        results.companies.found.push({
          csv: csvCompany,
          found: companyMatch.name,
          matchType: companyMatch.normalizedName === normalizedCsvCompany ? 'exact-name' :
                     companyMatch.normalizedEmail === normalizedCsvEmail ? 'email' : 'phone'
        });
      } else {
        results.companies.notFound.push({
          company: csvCompany,
          email: csvEmail,
          phone: csvPhone
        });
      }
    }

    // Check person match
    let personMatch = null;
    if (csvName) {
      const nameParts = csvName.trim().split(/\s+/);
      const csvFirstName = nameParts[0] || '';
      const csvLastName = nameParts.slice(1).join(' ') || '';
      const normalizedCsvFirstName = normalizeName(csvFirstName);
      const normalizedCsvLastName = normalizeName(csvLastName);
      const normalizedCsvFullName = normalizeName(csvName);
      const normalizedCsvEmail = normalizeEmail(csvEmail);
      const normalizedCsvPhone = normalizePhone(csvPhone);

      // Try exact full name match
      personMatch = normalizedPeople.find(p => 
        p.normalizedFullName === normalizedCsvFullName
      );

      // Try first + last name match
      if (!personMatch) {
        personMatch = normalizedPeople.find(p => 
          p.normalizedFirstName === normalizedCsvFirstName &&
          p.normalizedLastName === normalizedCsvLastName
        );
      }

      // Check person match by email
      if (!personMatch && normalizedCsvEmail) {
        personMatch = normalizedPeople.find(p => 
          p.normalizedEmail === normalizedCsvEmail ||
          p.normalizedWorkEmail === normalizedCsvEmail ||
          p.normalizedPersonalEmail === normalizedCsvEmail
        );
      }

      // Try phone match
      if (!personMatch && normalizedCsvPhone) {
        personMatch = normalizedPeople.find(p => 
          p.normalizedPhone === normalizedCsvPhone ||
          p.normalizedMobilePhone === normalizedCsvPhone ||
          p.normalizedWorkPhone === normalizedCsvPhone
        );
      }

      // Try partial name match
      if (!personMatch) {
        const partialMatch = normalizedPeople.find(p => 
          p.normalizedFullName && p.normalizedFullName.includes(normalizedCsvFullName) ||
          normalizedCsvFullName.includes(p.normalizedFullName) ||
          (p.normalizedFirstName === normalizedCsvFirstName && p.normalizedLastName && normalizedCsvLastName && p.normalizedLastName.includes(normalizedCsvLastName))
        );
        if (partialMatch) {
          results.people.partialMatches.push({
            csv: csvName,
            csvCompany: csvCompany,
            found: partialMatch.fullName,
            matchType: 'partial-name'
          });
        }
      }

      if (personMatch) {
        results.people.found.push({
          csv: csvName,
          csvCompany: csvCompany,
          found: personMatch.fullName,
          matchType: personMatch.normalizedFullName === normalizedCsvFullName ? 'exact-name' :
                     personMatch.normalizedEmail === normalizedCsvEmail || personMatch.normalizedWorkEmail === normalizedCsvEmail ? 'email' : 'phone'
        });
      } else {
        results.people.notFound.push({
          name: csvName,
          company: csvCompany,
          email: csvEmail,
          phone: csvPhone
        });
      }
    }
  }

  return results;
}

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

async function main() {
  try {
    console.log('📋 Checking Title Data NE 2025 - Sheet1 (1).csv against Notary Everyday workspace\n');

    // Find workspace
    const workspace = await findNotaryEverydayWorkspace();

    // Parse CSV
    const csvPath = path.join(process.cwd(), 'Title Data NE 2025 - Sheet1 (1).csv');
    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log('📄 Parsing CSV file...');
    const csvData = parseCSV(csvPath);
    console.log(`✅ Parsed ${csvData.length} rows from CSV\n`);

    // Check companies and people
    const results = await checkCompaniesAndPeople(csvData, workspace.id);

    // Print results
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESULTS SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🏢 COMPANIES:`);
    console.log(`   ✅ Found: ${results.companies.found.length}`);
    console.log(`   ⚠️  Partial matches: ${results.companies.partialMatches.length}`);
    console.log(`   ❌ Not found: ${results.companies.notFound.length}`);

    console.log(`\n👥 PEOPLE:`);
    console.log(`   ✅ Found: ${results.people.found.length}`);
    console.log(`   ⚠️  Partial matches: ${results.people.partialMatches.length}`);
    console.log(`   ❌ Not found: ${results.people.notFound.length}`);

    // Show some examples
    if (results.companies.found.length > 0) {
      console.log(`\n📌 Example companies found:`);
      results.companies.found.slice(0, 5).forEach(match => {
        console.log(`   • "${match.csv}" → "${match.found}" (${match.matchType})`);
      });
    }

    if (results.people.found.length > 0) {
      console.log(`\n📌 Example people found:`);
      results.people.found.slice(0, 5).forEach(match => {
        console.log(`   • "${match.csv}" at "${match.csvCompany}" → "${match.found}" (${match.matchType})`);
      });
    }

    if (results.companies.notFound.length > 0) {
      console.log(`\n📌 Example companies NOT found:`);
      results.companies.notFound.slice(0, 5).forEach(company => {
        console.log(`   • "${company.company}" (${company.email || 'no email'})`);
      });
    }

    if (results.people.notFound.length > 0) {
      console.log(`\n📌 Example people NOT found:`);
      results.people.notFound.slice(0, 5).forEach(person => {
        console.log(`   • "${person.name}" at "${person.company}" (${person.email || 'no email'})`);
      });
    }

    // Save detailed results to file
    const outputPath = path.join(process.cwd(), 'title-data-ne-2025-check-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

