#!/usr/bin/env node

/**
 * TEST 3 COMPANIES - SIMPLE SCRIPT
 * 
 * Runs the single company buyer group discovery 3 times
 * with 3 different companies from TOP workspace.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test3CompaniesSimple() {
  console.log('🧪 TEST 3 COMPANIES - SIMPLE');
  console.log('============================');
  console.log('Running single company discovery 3 times');
  console.log('');

  try {
    // Get TOP workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { name: 'TOP' }
    });

    if (!workspace) {
      throw new Error('TOP workspace not found');
    }

    // Get 3 companies with CoreSignal IDs for testing
    const testCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: workspace.id,
        deletedAt: null,
        customFields: {
          path: ['coresignalData', 'id'],
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        customFields: true
      },
      take: 3
    });

    if (testCompanies.length === 0) {
      throw new Error('No companies with CoreSignal IDs found in TOP workspace');
    }

    console.log(`✅ Found ${testCompanies.length} test companies:`);
    testCompanies.forEach((company, index) => {
      const coresignalData = company.customFields?.coresignalData;
      console.log(`   ${index + 1}. ${company.name} (${coresignalData?.employees_count || 'Unknown'} employees)`);
    });
    console.log('');

    // Test each company using the main script in single company mode
    for (let i = 0; i < testCompanies.length; i++) {
      const company = testCompanies[i];
      console.log(`\n🏢 TESTING COMPANY ${i + 1}/${testCompanies.length}: ${company.name}`);
      console.log('='.repeat(60));

      try {
        // Run the main script in single company mode
        const { spawn } = require('child_process');
        
        const child = spawn('node', [
          'scripts/optimized-buyer-group-discovery.js',
          `--company="${company.name}"`,
          '--workspace="TOP"'
        ], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              console.log(`✅ Company ${i + 1} completed successfully`);
              resolve();
            } else {
              console.log(`❌ Company ${i + 1} failed with exit code ${code}`);
              reject(new Error(`Process exited with code ${code}`));
            }
          });
        });
        
      } catch (error) {
        console.error(`❌ Company ${i + 1} failed: ${error.message}`);
      }
    }

    console.log('\n✅ ALL 3 COMPANIES TESTED!');
    console.log('If all tests passed, you can now run:');
    console.log('node scripts/optimized-buyer-group-discovery.js --all-companies');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  test3CompaniesSimple()
    .then(() => {
      console.log('\n✅ Test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { test3CompaniesSimple };
