/**
 * Add companies without LinkedIn URLs to Top-Temp Workspace
 * Reads from top-temp-no-linkedin-merged.csv and adds/updates companies
 * Only processes companies that don't have LinkedIn URLs
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Configuration
const CSV_FILE = 'top-temp-no-linkedin-merged.csv';
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

async function addCompaniesToWorkspace() {
  try {
    console.log('🚀 Adding companies WITHOUT LinkedIn to Top-Temp workspace\n');
    console.log('='.repeat(60));

    // Step 1: Get workspace
    console.log('\n🏢 Getting workspace...');
    const workspace = await prisma.workspaces.findUnique({
      where: { slug: WORKSPACE_SLUG }
    });

    if (!workspace) {
      throw new Error(`Workspace "${WORKSPACE_SLUG}" not found`);
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Step 2: Read CSV file
    console.log('📄 Reading CSV file...');
    if (!fs.existsSync(CSV_FILE)) {
      throw new Error(`CSV file not found: ${CSV_FILE}`);
    }

    const content = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    
    // Skip header row
    const dataRows = lines.slice(1);
    console.log(`✅ Found ${dataRows.length} total rows in CSV\n`);

    // Step 3: Filter to only companies without LinkedIn URLs
    console.log('🔍 Filtering companies without LinkedIn URLs...\n');
    
    const companiesWithoutLinkedIn = [];
    
    for (let i = 0; i < dataRows.length; i++) {
      const row = parseCSVLine(dataRows[i]);
      
      if (row.length < 3) {
        continue;
      }

      const companyName = row[0].trim();
      const website = row[1].trim() || null;
      const linkedinUrl = row[2].trim() || null;

      // Skip empty company names or invalid entries
      if (!companyName || companyName === '' || companyName === '0' || companyName === 'NONE' || companyName === 'Bottom -') {
        continue;
      }

      // Only include companies WITHOUT LinkedIn URLs
      if (!linkedinUrl || linkedinUrl === '') {
        companiesWithoutLinkedIn.push({
          name: companyName,
          website: website,
          linkedinUrl: null
        });
      }
    }

    console.log(`✅ Found ${companiesWithoutLinkedIn.length} companies WITHOUT LinkedIn URLs\n`);

    // Step 4: Process companies
    console.log('🏢 Processing companies...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const companyData of companiesWithoutLinkedIn) {
      try {
        const { name: companyName, website, linkedinUrl } = companyData;

        // Check if company already exists
        let company = await prisma.companies.findFirst({
          where: {
            workspaceId: workspace.id,
            name: {
              equals: companyName,
              mode: 'insensitive'
            },
            deletedAt: null
          }
        });

        if (company) {
          // Update existing company - only update website if it's not already set
          const updateData = {
            updatedAt: new Date()
          };

          if (website && !company.website) {
            updateData.website = website;
          }

          // Only update if there's something to update
          if (Object.keys(updateData).length > 1) {
            await prisma.companies.update({
              where: { id: company.id },
              data: updateData
            });
            updated++;
            console.log(`   🔄 Updated: ${companyName}`);
          } else {
            skipped++;
          }
        } else {
          // Create new company
          company = await prisma.companies.create({
            data: {
              id: ulid(),
              name: companyName,
              website: website,
              linkedinUrl: linkedinUrl, // Will be null
              workspaceId: workspace.id,
              status: 'LEAD',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          created++;
          console.log(`   ✅ Created: ${companyName}`);
        }

      } catch (error) {
        console.error(`   ❌ Error processing ${companyData.name}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`Workspace: ${workspace.name} (${workspace.slug})`);
    console.log(`Companies processed: ${companiesWithoutLinkedIn.length}`);
    console.log(`Companies created: ${created}`);
    console.log(`Companies updated: ${updated}`);
    console.log(`Companies skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log('='.repeat(60));
    console.log('✅ Process complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addCompaniesToWorkspace()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addCompaniesToWorkspace;
