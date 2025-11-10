#!/usr/bin/env node

/**
 * Export TOP workspace companies to CSV
 * Exports: Company Name, Website, LinkedIn URL
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const TOP_TEMP_WORKSPACE_ID = '01K9QAP09FHT6EAP1B4G2KP3D2';

async function exportTopCompanies() {
  try {
    console.log('📊 Exporting TOP-TEMP workspace companies...\n');

    // Fetch all companies from TOP-TEMP workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: TOP_TEMP_WORKSPACE_ID,
        deletedAt: null
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

    console.log(`✅ Found ${companies.length} companies\n`);

    // Create CSV content
    const csvRows = [];
    
    // Header row
    csvRows.push('Company Name,Website,LinkedIn URL');

    // Data rows
    for (const company of companies) {
      const name = (company.name || '').replace(/"/g, '""'); // Escape quotes
      const website = (company.website || '').replace(/"/g, '""');
      const linkedin = (company.linkedinUrl || '').replace(/"/g, '""');
      
      csvRows.push(`"${name}","${website}","${linkedin}"`);
    }

    // Write to file
    const csvContent = csvRows.join('\n');
    const outputPath = path.join(process.cwd(), 'top-temp-companies-export.csv');
    
    fs.writeFileSync(outputPath, csvContent, 'utf8');

    console.log(`✅ Exported ${companies.length} companies to: ${outputPath}`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Total companies: ${companies.length}`);
    console.log(`   - With website: ${companies.filter(c => c.website).length}`);
    console.log(`   - With LinkedIn: ${companies.filter(c => c.linkedinUrl).length}`);
    console.log(`   - Without LinkedIn: ${companies.filter(c => !c.linkedinUrl).length}`);

  } catch (error) {
    console.error('❌ Error exporting companies:', error.message);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  exportTopCompanies();
}

