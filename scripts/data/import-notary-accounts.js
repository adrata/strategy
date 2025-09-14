#!/usr/bin/env node

/**
 * Import Notary Accounts to Database
 * 
 * Imports the ranked Florida/Arizona companies into the Notary Everyday workspace
 * Top 150 assigned to Dano, rest unassigned
 * 
 * Usage: node scripts/data/import-notary-accounts.js
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import csv from 'csv-parser';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Dano's user ID from the system
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

/**
 * Find or create the Notary Everyday workspace
 */
async function getNotaryWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  let workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { name: 'Notary Everyday' },
        { slug: 'ne' },
        { slug: 'notary-everyday' }
      ]
    }
  });
  
  if (!workspace) {
    console.log('🏗️ Creating Notary Everyday workspace...');
    workspace = await prisma.workspace.create({
      data: {
        id: `ne_${Date.now()}`,
        name: 'Notary Everyday',
        slug: 'notary-everyday',
        description: 'Notary Everyday title company accounts',
        currency: 'USD',
        timezone: 'America/New_York'
      }
    });
    console.log(`✅ Created workspace: ${workspace.id}`);
  } else {
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
  }
  
  return workspace;
}

/**
 * Verify Dano user exists
 */
async function verifyDanoUser() {
  console.log('👤 Verifying Dano user...');
  
  const user = await prisma.user.findUnique({
    where: { id: DANO_USER_ID }
  });
  
  if (!user) {
    throw new Error(`User not found: ${DANO_USER_ID}`);
  }
  
  console.log(`✅ Found user: ${user.name || user.email} (${user.id})`);
  return user;
}

/**
 * Map CSV rank to system priority
 */
function mapRankToPriority(rank) {
  if (!rank || rank === '') return 'medium';
  
  const rankNum = parseInt(rank);
  if (rankNum <= 10) return 'urgent';
  if (rankNum <= 30) return 'high';
  if (rankNum <= 75) return 'medium';
  return 'low';
}

/**
 * Map CSV rank to system status
 */
function mapRankToStatus(rank) {
  if (!rank || rank === '') return 'new';
  
  const rankNum = parseInt(rank);
  if (rankNum <= 50) return 'speedrun'; // Top 50 get immediate attention
  return 'new';
}

/**
 * Import companies as accounts
 */
async function importNotaryAccounts() {
  console.log('🚀 Starting Notary Accounts import...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Get workspace and verify user
    const workspace = await getNotaryWorkspace();
    const user = await verifyDanoUser();
    
    // Load the notary accounts CSV
    const companies = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream('notary_accounts.csv')
        .pipe(csv())
        .on('data', (row) => {
          companies.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Loaded ${companies.length} companies from CSV\n`);
    
    // Separate assigned vs unassigned
    const assignedCompanies = companies.filter(c => c.Assigned_User === 'dano');
    const unassignedCompanies = companies.filter(c => c.Assigned_User !== 'dano');
    
    console.log(`🎯 Companies to assign to Dano: ${assignedCompanies.length}`);
    console.log(`📋 Companies to leave unassigned: ${unassignedCompanies.length}\n`);
    
    let importedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Import assigned companies (top 150)
    console.log('📥 Importing assigned companies...');
    for (const company of assignedCompanies) {
      try {
        const account = await prisma.account.create({
          data: {
            id: uuidv4(),
            name: company.Account || 'Unknown Company',
            industry: 'Title Insurance',
            size: company.Size || 'Unknown',
            
            // Location data
            city: company.City || null,
            state: company.State_Full || null,
            country: 'United States',
            
            // Contact information
            website: company.Domain || null,
            
            // Assignment
            assignedUserId: DANO_USER_ID,
            
            // Metadata
            source: 'Notary Accounts Import',
            notes: `${company.Selection_Reason || 'Selected for notary outreach'}. Size: ${company.Size_Category}. Original rank: ${company.Rank}`,
            
            // System fields
            workspaceId: workspace.id,
            createdBy: DANO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        importedCount++;
        
        if (importedCount % 25 === 0) {
          console.log(`   ✅ Imported ${importedCount}/${assignedCompanies.length} assigned companies`);
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          company: company.Account,
          error: error.message
        });
        console.error(`   ❌ Error importing ${company.Account}: ${error.message}`);
      }
    }
    
    // Import unassigned companies
    console.log('\n📥 Importing unassigned companies...');
    for (const company of unassignedCompanies) {
      try {
        const account = await prisma.account.create({
          data: {
            id: uuidv4(),
            name: company.Account || 'Unknown Company',
            industry: 'Title Insurance',
            size: company.Size || 'Unknown',
            
            // Location data
            city: company.City || null,
            state: company.State_Full || null,
            country: 'United States',
            location: company.Normalized_Location || company.Location || null,
            
            // Contact information
            website: company.Domain || null,
            linkedinUrl: company.LinkedIn || null,
            
            // No assignment for unassigned companies
            assignedUserId: null,
            priority: 'low',
            status: 'new',
            
            // Metadata
            source: 'Notary Accounts Import - Unassigned',
            notes: `${company.Selection_Reason || 'Not selected for initial outreach'}. Size: ${company.Size_Category}.`,
            
            // System fields
            workspaceId: workspace.id,
            createdBy: DANO_USER_ID,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        importedCount++;
        
        if ((importedCount - assignedCompanies.length) % 50 === 0) {
          console.log(`   ✅ Imported ${importedCount - assignedCompanies.length}/${unassignedCompanies.length} unassigned companies`);
        }
        
      } catch (error) {
        errorCount++;
        errors.push({
          company: company.Account,
          error: error.message
        });
        console.error(`   ❌ Error importing ${company.Account}: ${error.message}`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT COMPLETE');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${importedCount} companies`);
    console.log(`❌ Errors: ${errorCount} companies`);
    console.log(`🎯 Assigned to Dano: ${assignedCompanies.length} companies`);
    console.log(`📋 Unassigned: ${unassignedCompanies.length} companies`);
    console.log(`🏢 Workspace: ${workspace.name} (${workspace.id})`);
    
    if (errors.length > 0) {
      console.log(`\n❌ Import Errors:`);
      errors.slice(0, 10).forEach(error => {
        console.log(`   - ${error.company}: ${error.error}`);
      });
      if (errors.length > 10) {
        console.log(`   ... and ${errors.length - 10} more errors`);
      }
    }
    
    // Generate summary report
    const report = {
      timestamp: new Date().toISOString(),
      workspace: {
        id: workspace.id,
        name: workspace.name
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      import: {
        total: companies.length,
        imported: importedCount,
        errors: errorCount,
        assigned: assignedCompanies.length,
        unassigned: unassignedCompanies.length
      },
      ranking: {
        speedrunRanks: assignedCompanies.filter(c => parseInt(c.Rank) <= 50).length,
        highPriorityRanks: assignedCompanies.filter(c => parseInt(c.Rank) <= 100).length,
        totalRanked: assignedCompanies.length
      },
      errors: errors
    };
    
    fs.writeFileSync(
      'scripts/reports/notary-accounts-import-report.json',
      JSON.stringify(report, null, 2)
    );
    
    console.log(`\n📋 Import report saved to: scripts/reports/notary-accounts-import-report.json`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Verify the import results
 */
async function verifyImport(workspaceId) {
  console.log('\n🔍 Verifying import results...');
  
  try {
    await prisma.$connect();
    
    // Count accounts by assignment
    const assignedCount = await prisma.account.count({
      where: {
        workspaceId: workspaceId,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const unassignedCount = await prisma.account.count({
      where: {
        workspaceId: workspaceId,
        assignedUserId: null
      }
    });
    
    const totalCount = await prisma.account.count({
      where: { workspaceId: workspaceId }
    });
    
    console.log(`📊 Verification Results:`);
    console.log(`   Total accounts in workspace: ${totalCount}`);
    console.log(`   Assigned to Dano: ${assignedCount}`);
    console.log(`   Unassigned: ${unassignedCount}`);
    
    // Check ranking distribution
            const speedrunCount = await prisma.account.count({
      where: {
        workspaceId: workspaceId,
        assignedUserId: DANO_USER_ID,
        priority: 'urgent'
      }
    });
    
    console.log(`   Speedrun priority (urgent): ${speedrunCount}`);
    
    // Show sample accounts
    const sampleAccounts = await prisma.account.findMany({
      where: {
        workspaceId: workspaceId,
        assignedUserId: DANO_USER_ID
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: {
        name: true,
        priority: true,
        status: true,
        city: true,
        state: true
      }
    });
    
    console.log(`\n🏆 Top 10 Assigned Accounts:`);
    sampleAccounts.forEach((account, index) => {
      console.log(`   ${index + 1}. ${account.name} (${account.city}, ${account.state}) - ${account.priority}`);
    });
    
    return { assignedCount, unassignedCount, totalCount, speedrunCount };
    
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--verify-only')) {
    // Just verify existing import
    const workspaceId = args[args.indexOf('--workspace-id') + 1];
    if (!workspaceId) {
      console.error('❌ Please provide --workspace-id for verification');
      process.exit(1);
    }
    await verifyImport(workspaceId);
    return;
  }
  
  try {
    // Check if CSV file exists
    if (!fs.existsSync('notary_accounts.csv')) {
      console.error('❌ notary_accounts.csv not found');
      console.log('Please run the create-notary-accounts.js script first');
      process.exit(1);
    }
    
    console.log('🎯 IMPORTING NOTARY ACCOUNTS TO DATABASE');
    console.log('=========================================\n');
    
    const report = await importNotaryAccounts();
    
    // Verify the import
    await verifyImport(report.workspace.id);
    
    console.log('\n🎉 IMPORT SUCCESSFUL!');
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Switch to Notary Everyday workspace in the app`);
    console.log(`   2. View Dano's assigned accounts (${report.import.assigned} companies)`);
    console.log(`   3. Start outreach to top-ranked companies`);
    console.log(`   4. Review unassigned companies for future assignment`);
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { importNotaryAccounts, verifyImport };
