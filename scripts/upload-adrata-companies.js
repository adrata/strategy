#!/usr/bin/env node

/**
 * UPLOAD COMPANIES TO ADRATA WORKSPACE
 * 
 * Uploads 21 companies to the adrata workspace for user dan
 * using direct Prisma database insertion for speed and simplicity.
 */

const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

// Workspace and user IDs
const WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP'; // adrata
const USER_ID = '01K1VBYZMWTCT09FWEKBDMCXZM'; // dan

// Company list to upload
const COMPANIES = [
  'Everee',
  'Openprise', 
  'Arcoro',
  'Coro Cybersecurity',
  'Booksy',
  'Applied Software, GRAITEC Group',
  'Plixer',
  'XMPro',
  'Wynne Systems',
  'Rev.io',
  'Scivantage',
  'ProMiles Software Development',
  'Concord Technologies',
  'Metafile Information Systems',
  'Librestream',
  'SketchUp',
  'Optitex',
  'Ocient',
  'FPX from Revalize',
  'Lavastorm, an Infogix Company',
  'DealCloud, by Intapp'
];

async function uploadCompanies() {
  console.log('🚀 Starting company upload to adrata workspace...');
  console.log(`📊 Uploading ${COMPANIES.length} companies`);
  console.log(`🏢 Workspace: ${WORKSPACE_ID}`);
  console.log(`👤 User: ${USER_ID}`);
  console.log('');

  try {
    // Verify workspace and user exist
    const [workspace, user] = await Promise.all([
      prisma.workspaces.findUnique({ where: { id: WORKSPACE_ID } }),
      prisma.users.findUnique({ where: { id: USER_ID } })
    ]);

    if (!workspace) {
      throw new Error(`Workspace ${WORKSPACE_ID} not found`);
    }
    if (!user) {
      throw new Error(`User ${USER_ID} not found`);
    }

    console.log(`✅ Verified workspace: ${workspace.name}`);
    console.log(`✅ Verified user: ${user.name || user.email}`);
    console.log('');

    // Prepare company data
    const now = new Date();
    const companyData = COMPANIES.map(companyName => ({
      id: ulid(),
      workspaceId: WORKSPACE_ID,
      name: companyName,
      mainSellerId: USER_ID,
      status: 'PROSPECT',
      sources: ['Manual Entry'],
      createdAt: now,
      updatedAt: now
    }));

    console.log('📝 Company data prepared:');
    companyData.forEach((company, index) => {
      console.log(`  ${index + 1}. ${company.name} (${company.id})`);
    });
    console.log('');

    // Insert companies in a single transaction
    console.log('💾 Inserting companies into database...');
    const result = await prisma.$transaction(async (tx) => {
      const createdCompanies = [];
      
      for (const company of companyData) {
        try {
          const created = await tx.companies.create({
            data: company
          });
          createdCompanies.push(created);
          console.log(`  ✅ ${company.name}`);
        } catch (error) {
          console.log(`  ❌ ${company.name} - Error: ${error.message}`);
          throw error; // Re-throw to rollback transaction
        }
      }
      
      return createdCompanies;
    });

    console.log('');
    console.log('🎉 SUCCESS! All companies uploaded successfully');
    console.log(`📊 Total companies created: ${result.length}`);
    console.log('');

    // Verify the upload
    const count = await prisma.companies.count({
      where: {
        workspaceId: WORKSPACE_ID,
        mainSellerId: USER_ID,
        name: { in: COMPANIES }
      }
    });

    console.log(`🔍 Verification: Found ${count} companies in database`);
    
    if (count === COMPANIES.length) {
      console.log('✅ All companies successfully uploaded and verified!');
    } else {
      console.log(`⚠️  Expected ${COMPANIES.length} companies, found ${count}`);
    }

  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the upload
if (require.main === module) {
  uploadCompanies()
    .then(() => {
      console.log('🏁 Upload script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Upload script failed:', error);
      process.exit(1);
    });
}

module.exports = { uploadCompanies };
