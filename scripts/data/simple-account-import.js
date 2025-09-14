#!/usr/bin/env node

/**
 * Simple Account Import for Notary Companies
 * 
 * Imports only valid Account schema fields to avoid Prisma errors
 * 
 * Usage: node scripts/data/simple-account-import.js
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

// Dano's user ID
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

/**
 * Find or create Notary Everyday workspace
 */
async function getNotaryWorkspace() {
  console.log('🔍 Finding Notary Everyday workspace...');
  
  let workspace = await prisma.workspace.findFirst({
    where: {
      OR: [
        { name: 'Notary Everyday' },
        { slug: 'ne' }
      ]
    }
  });
  
  if (!workspace) {
    console.log('🏗️ Creating Notary Everyday workspace...');
    workspace = await prisma.workspace.create({
      data: {
        name: 'Notary Everyday',
        slug: 'notary-everyday',
        description: 'Notary Everyday title company accounts'
      }
    });
  }
  
  console.log(`✅ Using workspace: ${workspace.name} (${workspace.id})`);
  return workspace;
}

/**
 * Import accounts with only valid schema fields
 */
async function importSimpleAccounts() {
  console.log('🚀 Starting simple account import...\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    const workspace = await getNotaryWorkspace();
    
    // Load CSV data
    const companies = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('notary_accounts.csv')
        .pipe(csv())
        .on('data', (row) => companies.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`📊 Loaded ${companies.length} companies\n`);
    
    // Separate assigned vs unassigned
    const assignedCompanies = companies.filter(c => c.Assigned_User === 'dano');
    const unassignedCompanies = companies.filter(c => c.Assigned_User !== 'dano');
    
    console.log(`🎯 Assigned to Dano: ${assignedCompanies.length}`);
    console.log(`📋 Unassigned: ${unassignedCompanies.length}\n`);
    
    let importedCount = 0;
    let errorCount = 0;
    
    // Import assigned companies
    console.log('📥 Importing assigned companies...');
    for (const company of assignedCompanies) {
      try {
        await prisma.account.create({
          data: {
            name: company.Account || 'Unknown Company',
            industry: 'Title Insurance',
            size: company.Size || null,
            city: company.City || null,
            state: company.State_Full || null,
            country: 'United States',
            website: company.Domain || null,
            assignedUserId: DANO_USER_ID,
            notes: `Rank ${company.Rank}: ${company.Selection_Reason || 'Notary outreach candidate'}. Size: ${company.Size_Category}`,
            workspaceId: workspace.id
          }
        });
        
        importedCount++;
        if (importedCount % 25 === 0) {
          console.log(`   ✅ Imported ${importedCount}/${assignedCompanies.length} assigned companies`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`   ❌ Error importing ${company.Account}: ${error.message}`);
      }
    }
    
    // Import unassigned companies
    console.log('\n📥 Importing unassigned companies...');
    for (const company of unassignedCompanies) {
      try {
        await prisma.account.create({
          data: {
            name: company.Account || 'Unknown Company',
            industry: 'Title Insurance',
            size: company.Size || null,
            city: company.City || null,
            state: company.State_Full || null,
            country: 'United States',
            website: company.Domain || null,
            assignedUserId: null,
            notes: `${company.Selection_Reason || 'Unassigned'}. Size: ${company.Size_Category}`,
            workspaceId: workspace.id
          }
        });
        
        importedCount++;
        if ((importedCount - assignedCompanies.length) % 50 === 0) {
          console.log(`   ✅ Imported ${importedCount - assignedCompanies.length}/${unassignedCompanies.length} unassigned companies`);
        }
        
      } catch (error) {
        errorCount++;
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
    console.log(`🏢 Workspace: ${workspace.name}`);
    
    // Verify results
    const assignedCount = await prisma.account.count({
      where: {
        workspaceId: workspace.id,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const unassignedCount = await prisma.account.count({
      where: {
        workspaceId: workspace.id,
        assignedUserId: null
      }
    });
    
    console.log(`\n🔍 Verification:`);
    console.log(`   Accounts assigned to Dano: ${assignedCount}`);
    console.log(`   Unassigned accounts: ${unassignedCount}`);
    console.log(`   Total in workspace: ${assignedCount + unassignedCount}`);
    
    // Show sample assigned accounts
    const sampleAccounts = await prisma.account.findMany({
      where: {
        workspaceId: workspace.id,
        assignedUserId: DANO_USER_ID
      },
      orderBy: { createdAt: 'asc' },
      take: 10,
      select: {
        name: true,
        city: true,
        state: true,
        notes: true
      }
    });
    
    console.log(`\n🏆 Top 10 Companies Assigned to Dano:`);
    sampleAccounts.forEach((account, index) => {
      const rankMatch = account.notes?.match(/Rank (\d+):/);
      const rank = rankMatch ? rankMatch[1] : index + 1;
      console.log(`   ${rank}. ${account.name} (${account.city}, ${account.state})`);
    });
    
    console.log(`\n🎉 Import successful!`);
    console.log(`💡 Next: Add individual contacts/leads for these accounts`);
    
    return {
      imported: importedCount,
      assigned: assignedCount,
      unassigned: unassignedCount,
      workspace: workspace.id
    };
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importSimpleAccounts().catch(console.error);
}
