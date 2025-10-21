#!/usr/bin/env node

/**
 * Delete Test Companies Script
 * 
 * This script deletes the specified test companies from the database:
 * - Ross Inc.
 * - The Newest
 * - The New Co.
 * - Testers
 * 
 * Usage:
 *   node scripts/delete-test-companies.js [--hard] [--workspace-id=WORKSPACE_ID]
 * 
 * Options:
 *   --hard          Perform hard delete (permanent removal) instead of soft delete
 *   --workspace-id  Specify workspace ID (defaults to demo workspace)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Test company names to delete
const TEST_COMPANY_NAMES = [
  'Ross Inc.',
  'The Newest', 
  'The New Co.',
  'Testers'
];

// Default workspace IDs
const DEFAULT_WORKSPACES = {
  demo: '01K1VBYX2YERMXBFJ60RC6J194',
  notary: '01K7DNYR5VZ7JY36KGKKN76XZ1'
};

async function deleteTestCompanies() {
  try {
    console.log('🗑️  Starting Test Companies Deletion');
    console.log('=====================================');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const isHardDelete = args.includes('--hard');
    const workspaceArg = args.find(arg => arg.startsWith('--workspace-id='));
    const workspaceId = workspaceArg ? workspaceArg.split('=')[1] : DEFAULT_WORKSPACES.demo;
    
    console.log(`📋 Configuration:`);
    console.log(`   Delete Mode: ${isHardDelete ? 'HARD DELETE (permanent)' : 'SOFT DELETE (recoverable)'}`);
    console.log(`   Workspace ID: ${workspaceId}`);
    console.log(`   Target Companies: ${TEST_COMPANY_NAMES.join(', ')}`);
    console.log('');
    
    // Find companies by name in the specified workspace
    console.log('🔍 Searching for test companies...');
    
    const companies = await prisma.companies.findMany({
      where: {
        name: {
          in: TEST_COMPANY_NAMES
        },
        workspaceId: workspaceId,
        deletedAt: null // Only find non-deleted companies
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
    
    if (companies.length === 0) {
      console.log('✅ No test companies found to delete');
      console.log('   All target companies may already be deleted or don\'t exist in this workspace');
      return;
    }
    
    console.log(`📊 Found ${companies.length} companies to delete:`);
    companies.forEach(company => {
      console.log(`   • ${company.name} (ID: ${company.id})`);
      console.log(`     - People: ${company._count.people}`);
      console.log(`     - Actions: ${company._count.actions}`);
    });
    console.log('');
    
    // Check for hard delete constraints
    if (isHardDelete) {
      const companiesWithRelations = companies.filter(company => 
        company._count.people > 0 || company._count.actions > 0
      );
      
      if (companiesWithRelations.length > 0) {
        console.log('❌ Cannot perform hard delete - some companies have related data:');
        companiesWithRelations.forEach(company => {
          console.log(`   • ${company.name}: ${company._count.people} people, ${company._count.actions} actions`);
        });
        console.log('');
        console.log('💡 Use soft delete instead, or manually remove related data first');
        return;
      }
    }
    
    // Perform deletion
    console.log(`🚀 Starting ${isHardDelete ? 'hard' : 'soft'} deletion...`);
    
    const deletionResults = [];
    
    for (const company of companies) {
      try {
        if (isHardDelete) {
          // Hard delete - permanently remove from database
          await prisma.companies.delete({
            where: { id: company.id }
          });
          deletionResults.push({
            name: company.name,
            id: company.id,
            status: 'hard_deleted',
            message: 'Permanently removed from database'
          });
        } else {
          // Soft delete - set deletedAt timestamp
          await prisma.companies.update({
            where: { id: company.id },
            data: {
              deletedAt: new Date(),
              updatedAt: new Date()
            }
          });
          deletionResults.push({
            name: company.name,
            id: company.id,
            status: 'soft_deleted',
            message: 'Marked as deleted (recoverable)'
          });
        }
        
        console.log(`✅ ${company.name} - ${isHardDelete ? 'Hard deleted' : 'Soft deleted'}`);
        
      } catch (error) {
        console.error(`❌ Failed to delete ${company.name}:`, error.message);
        deletionResults.push({
          name: company.name,
          id: company.id,
          status: 'failed',
          message: error.message
        });
      }
    }
    
    // Summary
    console.log('');
    console.log('📋 Deletion Summary:');
    console.log('===================');
    
    const successful = deletionResults.filter(r => r.status !== 'failed');
    const failed = deletionResults.filter(r => r.status === 'failed');
    
    console.log(`✅ Successfully ${isHardDelete ? 'hard' : 'soft'} deleted: ${successful.length}`);
    successful.forEach(result => {
      console.log(`   • ${result.name}: ${result.message}`);
    });
    
    if (failed.length > 0) {
      console.log(`❌ Failed to delete: ${failed.length}`);
      failed.forEach(result => {
        console.log(`   • ${result.name}: ${result.message}`);
      });
    }
    
    if (!isHardDelete && successful.length > 0) {
      console.log('');
      console.log('💡 Note: Companies were soft deleted and can be recovered');
      console.log('   To permanently remove them, run with --hard flag');
    }
    
    console.log('');
    console.log('🏁 Deletion process completed');
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Delete Test Companies Script');
  console.log('============================');
  console.log('');
  console.log('Usage:');
  console.log('  node scripts/delete-test-companies.js [options]');
  console.log('');
  console.log('Options:');
  console.log('  --hard                    Perform hard delete (permanent removal)');
  console.log('  --workspace-id=ID         Specify workspace ID');
  console.log('  --help, -h                Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/delete-test-companies.js');
  console.log('  node scripts/delete-test-companies.js --hard');
  console.log('  node scripts/delete-test-companies.js --workspace-id=01K7DNYR5VZ7JY36KGKKN76XZ1');
  console.log('');
  console.log('Default workspace: Demo workspace (01K1VBYX2YERMXBFJ60RC6J194)');
  process.exit(0);
}

// Run the script
if (require.main === module) {
  deleteTestCompanies();
}

module.exports = { deleteTestCompanies };
