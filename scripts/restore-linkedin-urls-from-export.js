/**
 * Restore LinkedIn URLs from export file to Top-Temp workspace
 * This will restore any LinkedIn URLs that were lost
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

const EXPORT_FILE = 'top-temp-companies-export.csv';
const WORKSPACE_SLUG = 'top-temp';

function parseCSVLine(line) {
  const regex = /"([^"]*)"/g;
  const matches = [];
  let match;
  
  while ((match = regex.exec(line)) !== null) {
    matches.push(match[1]);
  }
  
  return matches;
}

async function restoreLinkedInUrls() {
  try {
    console.log('🔄 Restoring LinkedIn URLs from export file\n');
    console.log('='.repeat(60));

    // Step 1: Get workspace
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Step 2: Read export file
    console.log('📄 Reading export file...');
    if (!fs.existsSync(EXPORT_FILE)) {
      throw new Error(`Export file not found: ${EXPORT_FILE}`);
    }

    const content = fs.readFileSync(EXPORT_FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    // Skip header row
    const dataRows = lines.slice(1);
    console.log(`✅ Found ${dataRows.length} companies in export file\n`);

    // Step 3: Process companies
    console.log('🔄 Restoring LinkedIn URLs...\n');
    
    let restored = 0;
    let alreadyHad = 0;
    let notFound = 0;
    let errors = 0;
    const restoredCompanies = [];

    for (let i = 0; i < dataRows.length; i++) {
      try {
        const row = parseCSVLine(dataRows[i]);
        
        if (row.length < 3) {
          continue;
        }

        const companyName = row[0].trim();
        const linkedinUrl = row[2].trim();

        // Skip invalid entries
        if (!companyName || companyName === '0' || companyName === 'NONE' || companyName === 'Bottom -') {
          continue;
        }

        // Only process if there's a LinkedIn URL in the export file
        if (!linkedinUrl || linkedinUrl === '' || !linkedinUrl.includes('linkedin.com')) {
          continue;
        }

        // Find company in database
        const company = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        if (!company) {
          notFound++;
          continue;
        }

        // Check if LinkedIn URL is missing or different
        if (!company.linkedinUrl || company.linkedinUrl === '') {
          // Restore the LinkedIn URL
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              linkedinUrl: linkedinUrl,
              updatedAt: new Date()
            }
          });
          restored++;
          restoredCompanies.push(companyName);
          if (restored <= 20) {
            console.log(`   ✅ Restored: ${companyName}`);
            console.log(`      ${linkedinUrl}`);
          }
        } else if (company.linkedinUrl !== linkedinUrl) {
          // Update if different (use the export file version)
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              linkedinUrl: linkedinUrl,
              updatedAt: new Date()
            }
          });
          restored++;
          restoredCompanies.push(companyName);
          if (restored <= 20) {
            console.log(`   🔄 Updated: ${companyName} (was: ${company.linkedinUrl})`);
            console.log(`      Now: ${linkedinUrl}`);
          }
        } else {
          alreadyHad++;
        }

      } catch (error) {
        console.error(`   ❌ Error processing row ${i + 1}:`, error.message);
        errors++;
      }
    }

    if (restored > 20) {
      console.log(`   ... and ${restored - 20} more restored`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`LinkedIn URLs restored: ${restored}`);
    console.log(`Already had LinkedIn URLs: ${alreadyHad}`);
    console.log(`Companies not found: ${notFound}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));

    // Final count
    const finalCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        linkedinUrl: {
          not: null
        }
      }
    });

    const totalCount = await prisma.companies.count({
      where: {
        workspaceId: workspace.id,
        deletedAt: null
      }
    });

    console.log(`\n📊 FINAL STATE:`);
    console.log(`   Total companies: ${totalCount}`);
    console.log(`   Companies with LinkedIn URLs: ${finalCount} (${((finalCount / totalCount) * 100).toFixed(1)}%)`);
    console.log(`   Companies without LinkedIn URLs: ${totalCount - finalCount} (${(((totalCount - finalCount) / totalCount) * 100).toFixed(1)}%)`);
    console.log('='.repeat(60));
    console.log('✅ Restoration complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  restoreLinkedInUrls()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = restoreLinkedInUrls;

