#!/usr/bin/env node

/**
 * Clean and normalize website URLs for pipeline compatibility
 * 
 * Requirements based on pipeline analysis:
 * 1. Coresignal API expects domain matching (handles variations automatically)
 * 2. Pipeline's extractDomain handles https:// and www variations
 * 3. Best practice: lowercase, https:// protocol, no trailing slashes
 * 
 * This script:
 * - Normalizes URLs to https://domain.com format
 * - Converts to lowercase
 * - Removes trailing slashes and paths
 * - Validates basic URL structure
 * - Updates the CSV with cleaned URLs
 */

const fs = require('fs');
const path = require('path');

/**
 * Clean and normalize a website URL
 * @param {string} url - Raw URL string
 * @returns {string} Cleaned and normalized URL
 */
function cleanWebsiteUrl(url) {
  if (!url || url.trim() === '') {
    return '';
  }

  let cleaned = url.trim();

  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();

  // Remove trailing slashes and paths
  cleaned = cleaned.replace(/\/+$/, ''); // Remove trailing slashes
  cleaned = cleaned.split('/').slice(0, 3).join('/'); // Keep only protocol + domain

  // Add protocol if missing
  if (!cleaned.match(/^https?:\/\//i)) {
    // Check if it looks like a domain (has a dot)
    if (cleaned.includes('.')) {
      cleaned = `https://${cleaned}`;
    } else {
      // Not a valid URL
      return '';
    }
  }

  // Normalize protocol to https
  cleaned = cleaned.replace(/^http:\/\//i, 'https://');

  // Extract domain (remove www. for consistency, pipeline handles both)
  const domainMatch = cleaned.match(/^https?:\/\/(?:www\.)?([^\/]+)/i);
  if (!domainMatch) {
    return '';
  }

  const domain = domainMatch[1].toLowerCase();

  // Basic validation: domain should have at least one dot
  if (!domain.includes('.')) {
    return '';
  }

  // Reconstruct as https://domain.com (without www for consistency)
  return `https://${domain}`;
}

/**
 * Process CSV file and clean website URLs
 */
function processCSV(inputPath, outputPath) {
  console.log('🧹 Cleaning and normalizing website URLs...\n');

  // Read CSV file
  const csvContent = fs.readFileSync(inputPath, 'utf8');
  const lines = csvContent.split('\n');

  if (lines.length === 0) {
    console.error('❌ CSV file is empty');
    return;
  }

  // Process header
  const header = lines[0];
  const outputLines = [header];

  // Find website column index
  const headers = header.split(',').map(h => h.replace(/"/g, ''));
  const websiteIndex = headers.findIndex(h => h.toLowerCase() === 'website');

  if (websiteIndex === -1) {
    console.error('❌ Website column not found in CSV');
    return;
  }

  let cleanedCount = 0;
  let emptyCount = 0;
  let invalidCount = 0;
  const changes = [];

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      outputLines.push('');
      continue;
    }

    // Parse CSV row (handling quoted fields)
    const row = [];
    let currentField = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (inQuotes && line[j + 1] === '"') {
          // Escaped quote
          currentField += '"';
          j++;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentField);
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField); // Add last field

    // Extract company name and website
    const companyName = row[0] || '';
    const originalWebsite = row[websiteIndex] || '';

    // Clean the website URL
    const cleanedWebsite = cleanWebsiteUrl(originalWebsite);

    // Track changes
    if (originalWebsite !== cleanedWebsite) {
      if (originalWebsite && cleanedWebsite) {
        changes.push({
          company: companyName,
          original: originalWebsite,
          cleaned: cleanedWebsite
        });
        cleanedCount++;
      } else if (originalWebsite && !cleanedWebsite) {
        invalidCount++;
      }
    }

    if (!cleanedWebsite) {
      emptyCount++;
    }

    // Update the website field
    row[websiteIndex] = cleanedWebsite;

    // Reconstruct CSV row with proper quoting
    const quotedRow = row.map(field => {
      const escaped = field.replace(/"/g, '""');
      return `"${escaped}"`;
    });

    outputLines.push(quotedRow.join(','));
  }

  // Write cleaned CSV
  fs.writeFileSync(outputPath, outputLines.join('\n'), 'utf8');

  // Print summary
  console.log('✅ Website URLs cleaned and normalized!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Total companies: ${lines.length - 1}`);
  console.log(`   - URLs cleaned: ${cleanedCount}`);
  console.log(`   - Empty/invalid URLs: ${emptyCount + invalidCount}`);
  console.log(`   - Valid URLs: ${lines.length - 1 - emptyCount - invalidCount}\n`);

  if (changes.length > 0) {
    console.log('📝 Sample changes (first 10):');
    changes.slice(0, 10).forEach((change, i) => {
      console.log(`   ${i + 1}. ${change.company}`);
      console.log(`      Before: ${change.original}`);
      console.log(`      After:  ${change.cleaned}\n`);
    });
  }

  console.log(`\n✅ Cleaned CSV saved to: ${outputPath}`);
}

// Main execution
if (require.main === module) {
  const inputPath = path.join(process.cwd(), 'top-temp-companies-export.csv');
  const outputPath = path.join(process.cwd(), 'top-temp-companies-cleaned.csv');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    process.exit(1);
  }

  processCSV(inputPath, outputPath);
}

module.exports = { cleanWebsiteUrl };






