/**
 * Export companies without LinkedIn URLs to CSV
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const WORKSPACE_SLUG = 'top-temp';
const OUTPUT_FILE = 'companies-without-linkedin-top-temp.csv';

async function exportCompaniesWithoutLinkedIn() {
  try {
    console.log('📄 Exporting companies without LinkedIn URLs...\n');
    console.log('='.repeat(60));

    // Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Get companies without LinkedIn URLs
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        OR: [
          { linkedinUrl: null },
          { linkedinUrl: '' }
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

    console.log(`✅ Found ${companies.length} companies without LinkedIn URLs\n`);

    // Create CSV content
    const csvLines = ['Company Name,Website,LinkedIn URL'];
    
    companies.forEach(company => {
      const name = (company.name || '').replace(/"/g, '""');
      const website = (company.website || '').replace(/"/g, '""');
      const linkedin = (company.linkedinUrl || '').replace(/"/g, '""');
      csvLines.push(`"${name}","${website}","${linkedin}"`);
    });

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, csvLines.join('\n'), 'utf-8');

    console.log('='.repeat(60));
    console.log('📊 EXPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Output file: ${OUTPUT_FILE}`);
    console.log(`Total companies exported: ${companies.length}`);
    console.log('='.repeat(60));
    console.log('✅ Export complete!\n');

    // Show first 10 companies
    console.log('📋 First 10 companies without LinkedIn URLs:');
    companies.slice(0, 10).forEach((company, idx) => {
      console.log(`  ${idx + 1}. ${company.name}`);
      console.log(`     Website: ${company.website || '(empty)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
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
