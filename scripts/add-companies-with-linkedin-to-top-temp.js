/**
 * Add companies WITH LinkedIn URLs to Top-Temp Workspace
 * Reads from the 4 original CSV files and adds/updates companies with LinkedIn URLs
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
const CSV_FILES = [
  'top-temp-no-linkedin-1.csv',
  'top-temp-no-linkedin-2.csv',
  'top-temp-no-linkedin-3.csv',
  'top-temp-no-linkedin-4.csv'
];
const WORKSPACE_SLUG = 'top-temp';
const placeholders = ['Not found', 'N/A', 'n/a', 'NA', 'na', 'None', 'none', 'NONE'];

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
    console.log('🚀 Adding companies WITH LinkedIn URLs to Top-Temp workspace\n');
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

    // Step 2: Read and extract companies with LinkedIn URLs from all files
    console.log('📄 Reading CSV files and extracting companies with LinkedIn URLs...\n');
    
    const companiesWithLinkedIn = [];
    const seenNames = new Set();

    for (const file of CSV_FILES) {
      if (!fs.existsSync(file)) {
        console.log(`⚠️  File not found: ${file}, skipping...`);
        continue;
      }

      const content = fs.readFileSync(file, 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      
      let fileCount = 0;
      
      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (row.length >= 3) {
          const companyName = row[0].trim();
          const website = row[1].trim() || null;
          const linkedin = row[2].trim();
          
          // Skip invalid entries
          if (!companyName || companyName === '0' || companyName === 'NONE' || companyName === 'Bottom -') {
            continue;
          }
          
          // Check if it's a valid LinkedIn URL (not empty and not a placeholder)
          if (linkedin && 
              linkedin !== '' && 
              !placeholders.includes(linkedin) &&
              linkedin.startsWith('https://www.linkedin.com')) {
            
            // Avoid duplicates (case-insensitive)
            const normalizedName = companyName.toLowerCase();
            if (!seenNames.has(normalizedName)) {
              seenNames.add(normalizedName);
              companiesWithLinkedIn.push({
                name: companyName,
                website: website,
                linkedinUrl: linkedin
              });
              fileCount++;
            }
          }
        }
      }
      
      console.log(`  ${file}: ${fileCount} companies with LinkedIn URLs`);
    }

    console.log(`\n✅ Found ${companiesWithLinkedIn.length} unique companies with LinkedIn URLs\n`);

    // Step 3: Process companies
    console.log('🏢 Processing companies...\n');
    
    let created = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const companyData of companiesWithLinkedIn) {
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
          // Update existing company
          const updateData = {
            updatedAt: new Date()
          };

          if (website && !company.website) {
            updateData.website = website;
          }

          if (linkedinUrl && !company.linkedinUrl) {
            updateData.linkedinUrl = linkedinUrl;
          } else if (linkedinUrl && company.linkedinUrl !== linkedinUrl) {
            // Update even if different (use the new one)
            updateData.linkedinUrl = linkedinUrl;
          }

          // Only update if there's something to update
          if (Object.keys(updateData).length > 1) {
            await prisma.companies.update({
              where: { id: company.id },
              data: updateData
            });
            updated++;
            console.log(`   🔄 Updated: ${companyName} (LinkedIn: ${linkedinUrl})`);
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
              linkedinUrl: linkedinUrl,
              workspaceId: workspace.id,
              status: 'LEAD',
              createdAt: new Date(),
              updatedAt: new Date()
            }
          });
          created++;
          console.log(`   ✅ Created: ${companyName} (LinkedIn: ${linkedinUrl})`);
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
    console.log(`Companies processed: ${companiesWithLinkedIn.length}`);
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

