#!/usr/bin/env node

/**
 * 🗑️ DELETE TEST COMPANIES FROM NOTARY EVERYDAY
 * 
 * This script removes test/invalid company records from the Notary Everyday workspace
 * along with their associated people and actions using soft delete.
 * 
 * Usage:
 *   node scripts/delete-test-companies-notary.js [--dry-run] [--verbose]
 * 
 * Options:
 *   --dry-run    Preview what would be deleted without making changes
 *   --verbose    Show detailed logging
 */

const { PrismaClient } = require('@prisma/client');

// Configuration
const NOTARY_WORKSPACE_ID = '01K7DNYR5VZ7JY36KGKKN76XZ1';
const TEST_COMPANY_NAMES = [
  'New Company',
  'Driggdd', 
  'Drigg',
  'Ross',
  'Adrata',
  'test company inc',
  'ASDF',
  'asdfsad'
];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isVerbose = args.includes('--verbose');

// Initialize Prisma client
const prisma = new PrismaClient();

// Logging utilities
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = isDryRun ? '[DRY-RUN]' : '[DELETE]';
  console.log(`${timestamp} ${prefix} [${level.toUpperCase()}] ${message}`);
}

function logVerbose(message) {
  if (isVerbose) {
    log(message, 'verbose');
  }
}

// Main deletion function
async function deleteTestCompanies() {
  const startTime = Date.now();
  const deletionReport = {
    workspaceId: NOTARY_WORKSPACE_ID,
    isDryRun,
    startTime: new Date().toISOString(),
    companies: [],
    summary: {
      companiesFound: 0,
      companiesDeleted: 0,
      peopleDeleted: 0,
      actionsDeleted: 0,
      errors: []
    }
  };

  try {
    log(`Starting ${isDryRun ? 'dry-run preview' : 'deletion'} of test companies from Notary Everyday workspace`);
    log(`Workspace ID: ${NOTARY_WORKSPACE_ID}`);
    log(`Companies to ${isDryRun ? 'preview for deletion' : 'delete'}: ${TEST_COMPANY_NAMES.join(', ')}`);

    // Find companies by exact name match in the workspace
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        name: {
          in: TEST_COMPANY_NAMES
        },
        deletedAt: null // Only find non-deleted records
      },
      include: {
        _count: {
          select: {
            people: {
              where: {
                deletedAt: null
              }
            },
            actions: {
              where: {
                deletedAt: null
              }
            }
          }
        }
      }
    });

    deletionReport.summary.companiesFound = companies.length;
    log(`Found ${companies.length} companies to ${isDryRun ? 'preview for deletion' : 'delete'}`);

    if (companies.length === 0) {
      log('No test companies found. Nothing to delete.');
      return deletionReport;
    }

    // Process each company
    for (const company of companies) {
      const companyReport = {
        id: company.id,
        name: company.name,
        peopleCount: company._count.people,
        actionsCount: company._count.actions,
        deleted: false,
        errors: []
      };

      log(`Processing company: "${company.name}" (ID: ${company.id})`);
      logVerbose(`  - People: ${company._count.people}`);
      logVerbose(`  - Actions: ${company._count.actions}`);

      try {
        if (!isDryRun) {
          // Soft delete associated people first
          if (company._count.people > 0) {
            const peopleResult = await prisma.people.updateMany({
              where: {
                companyId: company.id,
                deletedAt: null
              },
              data: {
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            logVerbose(`  - Deleted ${peopleResult.count} people records`);
            deletionReport.summary.peopleDeleted += peopleResult.count;
          }

          // Soft delete associated actions
          if (company._count.actions > 0) {
            const actionsResult = await prisma.actions.updateMany({
              where: {
                companyId: company.id,
                deletedAt: null
              },
              data: {
                deletedAt: new Date(),
                updatedAt: new Date()
              }
            });
            
            logVerbose(`  - Deleted ${actionsResult.count} action records`);
            deletionReport.summary.actionsDeleted += actionsResult.count;
          }

          // Soft delete the company itself
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });

          companyReport.deleted = true;
          deletionReport.summary.companiesDeleted++;
          log(`✅ Successfully deleted company: "${company.name}"`);
        } else {
          log(`🔍 [DRY-RUN] Would delete company: "${company.name}"`);
          companyReport.deleted = true; // Mark as would-be-deleted for reporting
          deletionReport.summary.companiesDeleted++;
        }

      } catch (error) {
        const errorMsg = `Failed to delete company "${company.name}": ${error.message}`;
        log(errorMsg, 'error');
        companyReport.errors.push(errorMsg);
        deletionReport.summary.errors.push(errorMsg);
      }

      deletionReport.companies.push(companyReport);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    deletionReport.endTime = new Date().toISOString();
    deletionReport.duration = duration;

    // Final summary
    log('\n' + '='.repeat(60));
    log(`${isDryRun ? 'DRY-RUN PREVIEW' : 'DELETION'} COMPLETE`);
    log('='.repeat(60));
    log(`Companies found: ${deletionReport.summary.companiesFound}`);
    log(`Companies ${isDryRun ? 'would be deleted' : 'deleted'}: ${deletionReport.summary.companiesDeleted}`);
    log(`People ${isDryRun ? 'would be deleted' : 'deleted'}: ${deletionReport.summary.peopleDeleted}`);
    log(`Actions ${isDryRun ? 'would be deleted' : 'deleted'}: ${deletionReport.summary.actionsDeleted}`);
    log(`Errors: ${deletionReport.summary.errors.length}`);
    log(`Duration: ${duration}ms`);
    
    if (deletionReport.summary.errors.length > 0) {
      log('\nErrors encountered:');
      deletionReport.summary.errors.forEach((error, index) => {
        log(`  ${index + 1}. ${error}`, 'error');
      });
    }

    if (isDryRun) {
      log('\n💡 This was a dry run. To actually delete the companies, run without --dry-run flag.');
    }

    return deletionReport;

  } catch (error) {
    log(`Fatal error: ${error.message}`, 'error');
    deletionReport.summary.errors.push(`Fatal error: ${error.message}`);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const report = await deleteTestCompanies();
    
    // Save report to file
    const reportFilename = `docs/reports/notary-test-companies-deletion-${new Date().toISOString().split('T')[0]}.json`;
    const fs = require('fs');
    const path = require('path');
    
    // Ensure reports directory exists
    const reportsDir = path.dirname(reportFilename);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportFilename, JSON.stringify(report, null, 2));
    log(`\n📄 Detailed report saved to: ${reportFilename}`);
    
  } catch (error) {
    log(`Script failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { deleteTestCompanies, TEST_COMPANY_NAMES, NOTARY_WORKSPACE_ID };
