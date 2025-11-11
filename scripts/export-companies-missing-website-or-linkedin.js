#!/usr/bin/env node

/**
 * Export companies without LinkedIn URLs OR without websites from Top-Temp workspace
 * Exports: Company Name, Website, LinkedIn URL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';
const OUTPUT_FILE = 'top-temp-companies-missing-website-or-linkedin.csv';

async function exportCompaniesMissingWebsiteOrLinkedIn() {
  try {
    console.log('📄 Exporting companies without website OR LinkedIn URL...\n');
    console.log('='.repeat(60));

    // Fetch companies without LinkedIn URLs OR without websites
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          {
            OR: [
              { linkedinUrl: null },
              { linkedinUrl: '' }
            ]
          },
          {
            OR: [
              { website: null },
              { website: '' }
            ]
          }
        ]
      },
      select: {
        name: true,
        website: true,
        linkedinUrl: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Filter to only those missing at least one
    const companiesMissingOneOrBoth = companies.filter(c => {
      const hasLinkedIn = c.linkedinUrl && c.linkedinUrl.trim() !== '';
      const hasWebsite = c.website && c.website.trim() !== '';
      return !hasLinkedIn || !hasWebsite;
    });

    console.log(`✅ Found ${companiesMissingOneOrBoth.length} companies missing website OR LinkedIn (or both)\n`);

    // Categorize
    const missingBoth = companiesMissingOneOrBoth.filter(c => {
      const hasLinkedIn = c.linkedinUrl && c.linkedinUrl.trim() !== '';
      const hasWebsite = c.website && c.website.trim() !== '';
      return !hasLinkedIn && !hasWebsite;
    });

    const missingLinkedInOnly = companiesMissingOneOrBoth.filter(c => {
      const hasLinkedIn = c.linkedinUrl && c.linkedinUrl.trim() !== '';
      const hasWebsite = c.website && c.website.trim() !== '';
      return !hasLinkedIn && hasWebsite;
    });

    const missingWebsiteOnly = companiesMissingOneOrBoth.filter(c => {
      const hasLinkedIn = c.linkedinUrl && c.linkedinUrl.trim() !== '';
      const hasWebsite = c.website && c.website.trim() !== '';
      return hasLinkedIn && !hasWebsite;
    });

    // Create CSV content
    const csvRows = [];
    
    // Header row
    csvRows.push('Company Name,Website,LinkedIn URL');

    // Data rows
    for (const company of companiesMissingOneOrBoth) {
      const name = (company.name || '').replace(/"/g, '""'); // Escape quotes
      const website = (company.website || '').replace(/"/g, '""');
      const linkedin = (company.linkedinUrl || '').replace(/"/g, '""');
      
      csvRows.push(`"${name}","${website}","${linkedin}"`);
    }

    // Write to file (root folder)
    const csvContent = csvRows.join('\n');
    const outputPath = path.resolve(OUTPUT_FILE);
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log('='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Output file: ${outputPath}`);
    console.log(`Total companies exported: ${companiesMissingOneOrBoth.length}`);
    console.log(`  - Missing both: ${missingBoth.length}`);
    console.log(`  - Missing LinkedIn only: ${missingLinkedInOnly.length}`);
    console.log(`  - Missing website only: ${missingWebsiteOnly.length}`);
    console.log('='.repeat(60));
    console.log('✅ Export complete!\n');

  } catch (error) {
    console.error('❌ Error exporting companies:', error.message);
    console.error(error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  exportCompaniesMissingWebsiteOrLinkedIn()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = exportCompaniesMissingWebsiteOrLinkedIn;
