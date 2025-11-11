#!/usr/bin/env node

/**
 * Update LinkedIn URLs for TOP-temp companies from CSV file
 * Reads top-li-2.csv and updates matching companies in the database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const CSV_FILE = path.join(process.cwd(), 'top-li-2.csv');

/**
 * Normalize company name for matching
 */
function normalizeCompanyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[.,\-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b(inc|llc|ltd|corp|corporation|co|company)\b/gi, '')
    .trim();
}

/**
 * Parse CSV file manually (more reliable for Windows)
 */
function parseCSV(filePath) {
  console.log(`  Reading file: ${filePath}`);
  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`  File size: ${content.length} characters`);
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  console.log(`  Total lines: ${lines.length}`);
  
  // Skip header
  const dataLines = lines.slice(1);
  console.log(`  Data lines: ${dataLines.length}`);
  const companies = [];
  
  for (let idx = 0; idx < dataLines.length; idx++) {
    const line = dataLines[idx];
    if (!line.trim()) continue;
    
    // Parse CSV line manually
    const fields = [];
    let currentField = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentField += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        fields.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    fields.push(currentField);
    
    if (fields.length >= 3) {
      const name = fields[0].trim();
      const website = fields[1].trim();
      const linkedin = fields[2].trim();
      
      if (idx < 5) {
        console.log(`  Row ${idx + 1}: name="${name}", linkedin="${linkedin}", hasLinkedIn=${linkedin !== ''}`);
      }
      
      // Only process rows with LinkedIn URLs
      if (name && linkedin && linkedin !== '') {
        companies.push({
          name,
          website,
          linkedinUrl: linkedin
        });
      }
    }
  }
  
  console.log(`  Companies with LinkedIn: ${companies.length}`);
  return companies;
}

/**
 * Find company in database by name (with fuzzy matching)
 */
async function findCompanyByName(companyName, workspaceId) {
  // First try exact match (case-insensitive)
  let company = await prisma.companies.findFirst({
    where: {
      workspaceId,
      name: {
        equals: companyName,
        mode: 'insensitive'
      },
      deletedAt: null
    }
  });
  
  if (company) return company;
  
  // Try normalized match
  const normalizedName = normalizeCompanyName(companyName);
  
  // Get all companies in workspace for fuzzy matching
  const allCompanies = await prisma.companies.findMany({
    where: {
      workspaceId,
      deletedAt: null
    },
    select: {
      id: true,
      name: true
    }
  });
  
  // Find best match
  for (const dbCompany of allCompanies) {
    const dbNormalized = normalizeCompanyName(dbCompany.name);
    
    // Exact normalized match
    if (dbNormalized === normalizedName) {
      return dbCompany;
    }
    
    // Check if one contains the other (for variations like "Company Inc" vs "Company")
    if (normalizedName.includes(dbNormalized) || dbNormalized.includes(normalizedName)) {
      // Additional check: ensure they're similar enough (not just partial matches)
      const similarity = calculateSimilarity(normalizedName, dbNormalized);
      if (similarity > 0.85) {
        return dbCompany;
      }
    }
  }
  
  return null;
}

/**
 * Calculate string similarity (simple Jaccard-like)
 */
function calculateSimilarity(str1, str2) {
  const words1 = new Set(str1.split(' ').filter(w => w.length > 2));
  const words2 = new Set(str2.split(' ').filter(w => w.length > 2));
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Update LinkedIn URLs for companies
 */
async function updateLinkedInUrls() {
  try {
    console.log('📊 Updating LinkedIn URLs for TOP-temp companies...\n');
    
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
      console.error(`❌ CSV file not found: ${CSV_FILE}`);
      return;
    }
    
    // Parse CSV
    console.log('📖 Reading CSV file...');
    const csvCompanies = parseCSV(CSV_FILE);
    console.log(`✅ Found ${csvCompanies.length} companies with LinkedIn URLs in CSV\n`);
    
    // Get all companies in workspace for reference
    const dbCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        linkedinUrl: true
      }
    });
    
    console.log(`📋 Found ${dbCompanies.length} companies in TOP-temp workspace\n`);
    
    const stats = {
      updated: 0,
      notFound: 0,
      alreadyHasLinkedIn: 0,
      skipped: 0
    };
    
    const notFound = [];
    const alreadyUpdated = [];
    
    // Process each company from CSV
    for (let i = 0; i < csvCompanies.length; i++) {
      const csvCompany = csvCompanies[i];
      const progress = `[${i + 1}/${csvCompanies.length}]`;
      
      console.log(`${progress} Processing: ${csvCompany.name}`);
      
      // Find matching company in database
      const dbCompany = await findCompanyByName(csvCompany.name, TOP_TEMP_WORKSPACE_ID);
      
      if (!dbCompany) {
        console.log(`   ⚠️  Not found in database`);
        stats.notFound++;
        notFound.push(csvCompany.name);
        continue;
      }
      
      // Check if already has LinkedIn URL
      if (dbCompany.linkedinUrl && dbCompany.linkedinUrl.trim() !== '') {
        if (dbCompany.linkedinUrl === csvCompany.linkedinUrl) {
          console.log(`   ✓ Already has same LinkedIn URL`);
          stats.alreadyHasLinkedIn++;
          alreadyUpdated.push({ name: dbCompany.name, linkedin: dbCompany.linkedinUrl });
        } else {
          console.log(`   🔄 Updating LinkedIn URL`);
          console.log(`      Old: ${dbCompany.linkedinUrl}`);
          console.log(`      New: ${csvCompany.linkedinUrl}`);
        }
      } else {
        console.log(`   ➕ Adding LinkedIn URL: ${csvCompany.linkedinUrl}`);
      }
      
      // Update company
      try {
        await prisma.companies.update({
          where: { id: dbCompany.id },
          data: {
            linkedinUrl: csvCompany.linkedinUrl,
            updatedAt: new Date()
          }
        });
        
        stats.updated++;
        console.log(`   ✅ Updated successfully\n`);
      } catch (error) {
        console.error(`   ❌ Error updating: ${error.message}\n`);
        stats.skipped++;
      }
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Updated: ${stats.updated}`);
    console.log(`✓ Already had LinkedIn: ${stats.alreadyHasLinkedIn}`);
    console.log(`⚠️  Not found: ${stats.notFound}`);
    console.log(`❌ Skipped (errors): ${stats.skipped}`);
    console.log(`📋 Total processed: ${csvCompanies.length}`);
    
    if (notFound.length > 0) {
      console.log('\n⚠️  Companies not found in database:');
      notFound.forEach(name => console.log(`   - ${name}`));
    }
    
    if (alreadyUpdated.length > 0 && alreadyUpdated.length <= 10) {
      console.log('\n✓ Companies that already had LinkedIn URLs:');
      alreadyUpdated.forEach(({ name, linkedin }) => {
        console.log(`   - ${name}: ${linkedin}`);
      });
    }
    
    // Final stats
    const finalStats = await prisma.companies.count({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        linkedinUrl: {
          not: null
        }
      }
    });
    
    console.log(`\n📈 Final stats: ${finalStats} companies now have LinkedIn URLs in TOP-temp workspace`);
    
  } catch (error) {
    console.error('❌ Error updating LinkedIn URLs:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  updateLinkedInUrls();
}

module.exports = { updateLinkedInUrls };

