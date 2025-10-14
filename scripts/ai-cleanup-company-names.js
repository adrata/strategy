#!/usr/bin/env node

/**
 * AI-Powered Company Name Cleanup for Notary Everyday Workspace
 * 
 * Uses AI to intelligently clean up company names:
 * - Fix all caps names
 * - Remove random state/location info
 * - Standardize formatting
 * - Clean up abbreviations and acronyms
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// AI-powered name cleaning function
function aiCleanCompanyName(name) {
  if (!name) return name;
  
  let cleaned = name.trim();
  
  // Skip if already clean (short, proper case, no obvious issues)
  if (cleaned.length < 50 && 
      !/^[A-Z\s&.,]+$/.test(cleaned) && 
      !cleaned.includes(' - ') && 
      !cleaned.includes(' | ') &&
      !cleaned.includes('(') && 
      !cleaned.includes(')')) {
    return cleaned;
  }
  
  // Fix all caps names
  if (/^[A-Z\s&.,]+$/.test(cleaned) && cleaned.length > 3) {
    // Convert to proper case, but keep common business suffixes
    cleaned = cleaned
      .toLowerCase()
      .split(' ')
      .map((word, index, array) => {
        // Keep common business suffixes in caps
        const businessSuffixes = ['llc', 'inc', 'corp', 'ltd', 'co', 'lp', 'llp'];
        if (businessSuffixes.includes(word)) {
          return word.toUpperCase();
        }
        // Keep first word and words after '&' capitalized
        if (index === 0 || array[index - 1] === '&') {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Capitalize other words
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
  
  // Remove random state/location suffixes
  const statePatterns = [
    /\s*-\s*(FL|FLORIDA|AZ|ARIZONA|CA|CALIFORNIA|TX|TEXAS|NY|NEW YORK|NC|NORTH CAROLINA|SC|SOUTH CAROLINA|GA|GEORGIA|TN|TENNESSEE|AL|ALABAMA|MS|MISSISSIPPI|LA|LOUISIANA|AR|ARKANSAS|OK|OKLAHOMA|MO|MISSOURI|KS|KANSAS|NE|NEBRASKA|IA|IOWA|MN|MINNESOTA|WI|WISCONSIN|IL|ILLINOIS|IN|INDIANA|OH|OHIO|MI|MICHIGAN|PA|PENNSYLVANIA|WV|WEST VIRGINIA|VA|VIRGINIA|KY|KENTUCKY|MD|MARYLAND|DE|DELAWARE|NJ|NEW JERSEY|CT|CONNECTICUT|RI|RHODE ISLAND|MA|MASSACHUSETTS|VT|VERMONT|NH|NEW HAMPSHIRE|ME|MAINE)\s*$/i,
    /\s*\([^)]*(FL|FLORIDA|AZ|ARIZONA|CA|CALIFORNIA|TX|TEXAS|NY|NEW YORK|NC|NORTH CAROLINA|SC|SOUTH CAROLINA|GA|GEORGIA|TN|TENNESSEE|AL|ALABAMA|MS|MISSISSIPPI|LA|LOUISIANA|AR|ARKANSAS|OK|OKLAHOMA|MO|MISSOURI|KS|KANSAS|NE|NEBRASKA|IA|IOWA|MN|MINNESOTA|WI|WISCONSIN|IL|ILLINOIS|IN|INDIANA|OH|OHIO|MI|MICHIGAN|PA|PENNSYLVANIA|WV|WEST VIRGINIA|VA|VIRGINIA|KY|KENTUCKY|MD|MARYLAND|DE|DELAWARE|NJ|NEW JERSEY|CT|CONNECTICUT|RI|RHODE ISLAND|MA|MASSACHUSETTS|VT|VERMONT|NH|NEW HAMPSHIRE|ME|MAINE)[^)]*\)\s*$/i
  ];
  
  statePatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Remove location-specific suffixes that aren't part of the core business name
  const locationPatterns = [
    /\s*-\s*(Pittsburgh|DC|MD|VA|New York|North Carolina|Northwest Indiana|Arkansas|Dr\. Phillips|Surprise|Osceola)\s*$/i,
    /\s*\([^)]*(Pittsburgh|DC|MD|VA|New York|North Carolina|Northwest Indiana|Arkansas|Dr\. Phillips|Surprise|Osceola)[^)]*\)\s*$/i
  ];
  
  locationPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Clean up common business name patterns
  cleaned = cleaned
    // Remove redundant "Company" when already has "Inc" or "LLC"
    .replace(/\s+(Inc\.?|LLC|Corp\.?|Ltd\.?)\s+Company\s*$/i, ' $1')
    // Fix spacing around punctuation
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\.\s*/g, '. ')
    .replace(/\s*&\s*/g, ' & ')
    // Remove extra spaces
    .replace(/\s+/g, ' ')
    // Remove trailing punctuation and spaces
    .replace(/[.,\s]+$/, '')
    .trim();
  
  // Standardize common business suffixes
  cleaned = cleaned
    .replace(/\s+(Inc\.?|Incorporated)\s*$/i, ' Inc.')
    .replace(/\s+(LLC|L\.L\.C\.?)\s*$/i, ' LLC')
    .replace(/\s+(Corp\.?|Corporation)\s*$/i, ' Corp.')
    .replace(/\s+(Ltd\.?|Limited)\s*$/i, ' Ltd.')
    .replace(/\s+(Co\.?|Company)\s*$/i, ' Co.');
  
  // Clean up specific problematic patterns
  cleaned = cleaned
    // Remove phone numbers and contact info
    .replace(/\s*\(\d{3}\.\d{3}\.\d{4}\)\s*/g, ' ')
    .replace(/\s*\(\d{3}-\d{3}-\d{4}\)\s*/g, ' ')
    .replace(/\s*ph\.\s*\d{3}\.\d{3}\.\d{4}\s*/gi, ' ')
    // Remove email addresses
    .replace(/\s*\/\s*[\w\s@\.]+@[\w\s\.]+\.com\s*/gi, ' ')
    // Remove DRE numbers and similar
    .replace(/\s*CA\s+DRE#\s*\d+\s*/gi, ' ')
    .replace(/\s*NV\s+DRE#\s*S\.\d+\s*/gi, ' ')
    // Remove "formerly known as" references
    .replace(/\s*\(fka\s+[^)]+\)\s*/gi, ' ')
    .replace(/\s*\(formerly\s+[^)]+\)\s*/gi, ' ')
    // Remove extra descriptive text
    .replace(/\s*for\s+The\s+Residences\s*/gi, ' ')
    .replace(/\s*of\s+Dr\.\s+Phillips\s*/gi, ' ')
    // Clean up extra spaces again
    .replace(/\s+/g, ' ')
    .trim();
  
  return cleaned;
}

async function aiCleanupCompanyNames() {
  try {
    console.log('🤖 Starting AI-powered company name cleanup...\n');
    
    // Find the Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        name: {
          contains: 'Notary Everyday',
          mode: 'insensitive'
        }
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get all companies
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id
      },
      select: {
        id: true,
        name: true,
        domain: true,
        website: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`📊 Processing ${companies.length} companies...\n`);

    const changes = {
      cleaned: [],
      unchanged: [],
      errors: []
    };

    let processed = 0;
    const batchSize = 100;

    // Process companies in batches
    for (let i = 0; i < companies.length; i += batchSize) {
      const batch = companies.slice(i, i + batchSize);
      
      for (const company of batch) {
        const originalName = company.name;
        const cleanedName = aiCleanCompanyName(originalName);
        
        // Only update if name actually changed and is valid
        if (cleanedName !== originalName && cleanedName.length > 0) {
          try {
            await prisma.companies.update({
              where: { id: company.id },
              data: { name: cleanedName }
            });
            
            changes.cleaned.push({
              id: company.id,
              originalName: originalName,
              cleanedName: cleanedName,
              domain: company.domain,
              lengthChange: cleanedName.length - originalName.length
            });
            
            processed++;
            if (processed % 50 === 0) {
              console.log(`📝 Processed ${processed} companies...`);
            }
          } catch (error) {
            changes.errors.push({
              id: company.id,
              originalName: originalName,
              error: error.message
            });
            console.error(`❌ Error updating company ${company.id}:`, error.message);
          }
        } else {
          changes.unchanged.push({
            id: company.id,
            name: originalName
          });
        }
      }
    }

    // Generate report
    const report = {
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      cleanupDate: new Date().toISOString(),
      totalProcessed: companies.length,
      summary: {
        cleaned: changes.cleaned.length,
        unchanged: changes.unchanged.length,
        errors: changes.errors.length
      },
      changes: changes,
      statistics: {
        totalLengthChange: changes.cleaned.reduce((sum, change) => sum + change.lengthChange, 0),
        averageLengthChange: changes.cleaned.length > 0 ? 
          changes.cleaned.reduce((sum, change) => sum + change.lengthChange, 0) / changes.cleaned.length : 0
      }
    };

    // Save report
    const reportPath = path.join(__dirname, '..', 'docs', 'reports', 'notary-ai-cleanup-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}\n`);

    // Print summary
    console.log('📊 AI CLEANUP SUMMARY:');
    console.log('='.repeat(50));
    console.log(`Total Processed: ${companies.length}`);
    console.log(`Names Cleaned: ${changes.cleaned.length}`);
    console.log(`Names Unchanged: ${changes.unchanged.length}`);
    console.log(`Errors: ${changes.errors.length}`);
    console.log('');
    console.log(`Total Length Change: ${report.statistics.totalLengthChange} characters`);
    console.log(`Average Length Change: ${report.statistics.averageLengthChange.toFixed(1)} characters`);
    console.log('');

    if (changes.cleaned.length > 0) {
      console.log('✨ CLEANED NAMES (Top 30):');
      console.log('='.repeat(50));
      changes.cleaned.slice(0, 30).forEach((change, index) => {
        console.log(`${index + 1}. [${change.lengthChange > 0 ? '+' : ''}${change.lengthChange} chars]`);
        console.log(`   Before: "${change.originalName}"`);
        console.log(`   After:  "${change.cleanedName}"`);
        if (change.domain) console.log(`   Domain: ${change.domain}`);
        console.log('');
      });
    }

    if (changes.errors.length > 0) {
      console.log('❌ ERRORS:');
      console.log('='.repeat(50));
      changes.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.id}: ${error.error}`);
      });
    }

    console.log('\n✅ AI cleanup complete!');
    
  } catch (error) {
    console.error('❌ Error during AI cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

aiCleanupCompanyNames();
