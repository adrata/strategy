#!/usr/bin/env node

/**
 * Export companies without LinkedIn URLs AND without websites from Top-Temp workspace
 * Exports: Company Name
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
const OUTPUT_FILE = 'top-temp-companies-missing-both.csv';

async function exportCompaniesMissingBoth() {
  try {
    console.log('📄 Exporting companies without LinkedIn URLs AND without websites...\n');
    console.log('='.repeat(60));

    // Fetch companies without LinkedIn URLs AND without websites
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        AND: [
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

    // Filter to only those missing BOTH (double-check)
    const companiesMissingBoth = companies.filter(c => {
      const hasLinkedIn = c.linkedinUrl && c.linkedinUrl.trim() !== '';
      const hasWebsite = c.website && c.website.trim() !== '';
      return !hasLinkedIn && !hasWebsite;
    });

    console.log(`✅ Found ${companiesMissingBoth.length} companies missing both LinkedIn and website\n`);

    // Create CSV content
    const csvRows = [];
    
    // Header row
    csvRows.push('Company Name');

    // Data rows
    for (const company of companiesMissingBoth) {
      const name = (company.name || '').replace(/"/g, '""'); // Escape quotes
      csvRows.push(`"${name}"`);
    }

    // Write to file (root folder)
    const csvContent = csvRows.join('\n');
    const outputPath = path.resolve(OUTPUT_FILE);
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log('='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Output file: ${outputPath}`);
    console.log(`Total companies exported: ${companiesMissingBoth.length}`);
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
  exportCompaniesMissingBoth()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = exportCompaniesMissingBoth;

