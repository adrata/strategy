#!/usr/bin/env node

/**
 * Export companies without LinkedIn URLs from Top-Temp workspace to CSV
 * Exports: Company Name, Website
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
const OUTPUT_FILE = 'top-temp-companies-without-linkedin.csv';

async function exportCompaniesWithoutLinkedIn() {
  try {
    console.log('📄 Exporting companies without LinkedIn URLs from Top-Temp workspace...\n');
    console.log('='.repeat(60));

    // Fetch companies without LinkedIn URLs
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null,
        OR: [
          { linkedinUrl: null },
          { linkedinUrl: '' }
        ]
      },
      select: {
        name: true,
        website: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    console.log(`✅ Found ${companies.length} companies without LinkedIn URLs\n`);

    // Create CSV content
    const csvRows = [];
    
    // Header row
    csvRows.push('Company Name,Website');

    // Data rows
    for (const company of companies) {
      const name = (company.name || '').replace(/"/g, '""'); // Escape quotes
      const website = (company.website || '').replace(/"/g, '""');
      
      csvRows.push(`"${name}","${website}"`);
    }

    // Write to file (root folder)
    const csvContent = csvRows.join('\n');
    const outputPath = path.resolve(OUTPUT_FILE); // Save to root folder
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log('='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Output file: ${outputPath}`);
    console.log(`Total companies exported: ${companies.length}`);
    console.log(`Companies with website: ${companies.filter(c => c.website).length}`);
    console.log(`Companies without website: ${companies.filter(c => !c.website).length}`);
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
  exportCompaniesWithoutLinkedIn()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = exportCompaniesWithoutLinkedIn;
