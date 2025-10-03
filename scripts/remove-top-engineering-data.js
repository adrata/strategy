#!/usr/bin/env node

/**
 * 🧹 CLEANUP SCRIPT: Remove TOP Engineering Plus Company and People Data
 * 
 * This script removes only the company and people records from TOP Engineering Plus
 * WITHOUT touching workspace or user records.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Company name patterns to match and remove
const COMPANY_PATTERNS = [
  'TOP Engineering Plus',
  'TOP Engineers Plus',
  'TOP Engineering',
  'TOP Engineers',
  'TOP Engineers Plus, PLLC',
  'TOP Engineers Plus PLLC'
];

async function findTopEngineeringCompanies() {
  console.log('🔍 [CLEANUP] Finding TOP Engineering Plus companies...');
  
  const companies = await prisma.companies.findMany({
    where: {
      OR: COMPANY_PATTERNS.map(pattern => ({
        name: {
          contains: pattern,
          mode: 'insensitive'
        }
      }))
    },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      _count: {
        select: {
          people: true,
          actions: true,
          buyerGroups: true
        }
      }
    }
  });
  
  console.log(`📊 [CLEANUP] Found ${companies.length} TOP Engineering Plus companies:`);
  companies.forEach(company => {
    console.log(`  - ${company.name} (ID: ${company.id})`);
    console.log(`    Workspace: ${company.workspaceId}`);
    console.log(`    People: ${company._count.people}`);
    console.log(`    Actions: ${company._count.actions}`);
    console.log(`    Buyer Groups: ${company._count.buyerGroups}`);
  });
  
  return companies;
}

async function findTopEngineeringPeople() {
  console.log('🔍 [CLEANUP] Finding people from TOP Engineering Plus companies...');
  
  const people = await prisma.people.findMany({
    where: {
      company: {
        OR: COMPANY_PATTERNS.map(pattern => ({
          name: {
            contains: pattern,
            mode: 'insensitive'
          }
        }))
      }
    },
    select: {
      id: true,
      fullName: true,
      company: {
        select: {
          name: true
        }
      }
    }
  });
  
  console.log(`📊 [CLEANUP] Found ${people.length} people from TOP Engineering Plus companies:`);
  people.slice(0, 10).forEach(person => {
    console.log(`  - ${person.fullName} (${person.company?.name})`);
  });
  if (people.length > 10) {
    console.log(`  ... and ${people.length - 10} more`);
  }
  
  return people;
}

async function dryRunCleanup() {
  console.log('🧪 [DRY RUN] Simulating cleanup without making changes...');
  
  const companies = await findTopEngineeringCompanies();
  const people = await findTopEngineeringPeople();
  
  let totalRecords = 0;
  
  for (const company of companies) {
    totalRecords += company._count.people;
    totalRecords += company._count.actions;
    totalRecords += company._count.buyerGroups;
    totalRecords += 1; // The company itself
  }
  
  console.log(`📊 [DRY RUN] Would delete:`);
  console.log(`  - ${companies.length} companies`);
  console.log(`  - ${people.length} people`);
  console.log(`  - ${totalRecords} total records`);
  console.log(`  - KEEPING: Workspace and user records (not touched)`);
  
  return { companies, people, totalRecords };
}

async function performCleanup(companies, people) {
  console.log('🗑️ [CLEANUP] Starting actual deletion...');
  
  let deletedCount = 0;
  
  try {
    // Delete people first (to avoid foreign key constraints)
    console.log('🗑️ [CLEANUP] Deleting people from TOP Engineering Plus companies...');
    for (const person of people) {
      await prisma.people.delete({
        where: { id: person.id }
      });
      deletedCount++;
      if (deletedCount % 100 === 0) {
        console.log(`  Deleted ${deletedCount} people...`);
      }
    }
    
    // Delete companies
    console.log('🗑️ [CLEANUP] Deleting TOP Engineering Plus companies...');
    for (const company of companies) {
      await prisma.companies.delete({
        where: { id: company.id }
      });
      deletedCount++;
    }
    
    console.log(`✅ [CLEANUP] Successfully deleted ${deletedCount} records`);
    console.log('✅ [CLEANUP] Workspace and user records preserved');
    
  } catch (error) {
    console.error('❌ [CLEANUP] Error during deletion:', error);
    throw error;
  }
}

async function main() {
  console.log('🧹 [CLEANUP] TOP Engineering Plus Data Removal Script');
  console.log('=====================================================');
  console.log('⚠️  This will remove company and people records only');
  console.log('✅  Workspace and user records will be preserved');
  console.log('');
  
  try {
    // Step 1: Dry run to see what would be deleted
    const { companies, people, totalRecords } = await dryRunCleanup();
    
    if (companies.length === 0) {
      console.log('✅ [CLEANUP] No TOP Engineering Plus companies found. Nothing to delete.');
      return;
    }
    
    console.log('\n⚠️ [CLEANUP] WARNING: This will permanently delete the above records!');
    console.log('This action cannot be undone.');
    console.log('✅ [CLEANUP] Workspace and user records will NOT be affected.');
    
    // Step 2: Confirmation prompt
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\nDo you want to proceed with deletion? (yes/no): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ [CLEANUP] Deletion cancelled by user.');
      return;
    }
    
    // Step 3: Perform actual cleanup
    await performCleanup(companies, people);
    
    console.log('✅ [CLEANUP] Cleanup completed successfully!');
    console.log('✅ [CLEANUP] Workspace and user records preserved');
    console.log('🚀 [CLEANUP] Speedrun should now show people from other companies only');
    
  } catch (error) {
    console.error('❌ [CLEANUP] Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
