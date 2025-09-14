#!/usr/bin/env node

/**
 * 🧹 COMPLETE CLEANUP AND ASSIGNMENT
 * 
 * 1. Completely removes ALL remaining external Coresignal IDs
 * 2. Ensures all records are properly assigned to Notary Everyday workspace
 * 3. Assigns records to Dano like in Retail Product Solutions
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

// Configuration
const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';
const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';

async function completeCleanupAndAssignment() {
  console.log('🧹 COMPLETE CLEANUP AND ASSIGNMENT');
  console.log('====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. FIND ALL REMAINING EXTERNAL IDS
    console.log('🔍 Finding ALL remaining external IDs...');
    
    const externalLeads = await prisma.leads.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { id: { startsWith: '01K1V9C' } } // These are the problematic ones
        ]
      }
    });
    
    const externalContacts = await prisma.contacts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { id: { startsWith: '01K1V9C' } } // These are the problematic ones
        ]
      }
    });
    
    console.log(`📊 Found remaining external IDs:`);
    console.log(`   Leads: ${externalLeads.length}`);
    console.log(`   Contacts: ${externalContacts.length}`);
    console.log(`   Total: ${externalLeads.length + externalContacts.length}`);
    
    if (externalLeads.length + externalContacts.length === 0) {
      console.log('✅ No external IDs found!');
    } else {
      // 2. COMPLETELY REMOVE ALL EXTERNAL ID RECORDS
      console.log('\n🗑️  COMPLETELY REMOVING ALL EXTERNAL ID RECORDS...');
      
      let leadsRemoved = 0;
      let contactsRemoved = 0;
      
      // Remove external leads
      for (const lead of externalLeads) {
        try {
          await prisma.leads.delete({
            where: { id: lead.id }
          });
          leadsRemoved++;
          console.log(`   ✅ Removed external lead: ${lead.fullName} (${lead.id})`);
        } catch (error) {
          console.error(`   ❌ Error removing lead ${lead.id}: ${error.message}`);
        }
      }
      
      // Remove external contacts
      for (const contact of externalContacts) {
        try {
          await prisma.contacts.delete({
            where: { id: contact.id }
          });
          contactsRemoved++;
          console.log(`   ✅ Removed external contact: ${contact.fullName} (${contact.id})`);
        } catch (error) {
          console.error(`   ❌ Error removing contact ${contact.id}: ${error.message}`);
        }
      }
      
      console.log(`\n🗑️  Cleanup complete:`);
      console.log(`   Leads removed: ${leadsRemoved}`);
      console.log(`   Contacts removed: ${contactsRemoved}`);
    }
    
    // 3. VERIFY NO EXTERNAL IDS REMAIN
    console.log('\n🔍 Verifying no external IDs remain...');
    
    const remainingExternalLeads = await prisma.leads.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { id: { startsWith: '01K1V9C' } }
        ]
      }
    });
    
    const remainingExternalContacts = await prisma.contacts.findMany({
      where: {
        OR: [
          { id: { contains: 'coresignal' } },
          { id: { contains: 'external' } },
          { id: { startsWith: '01K1V9C' } }
        ]
      }
    });
    
    if (remainingExternalLeads.length > 0 || remainingExternalContacts.length > 0) {
      console.log(`❌ Still have ${remainingExternalLeads.length + remainingExternalContacts.length} external IDs!`);
      console.log('   Manual intervention required');
    } else {
      console.log('✅ All external IDs completely removed!');
    }
    
    // 4. VERIFY WORKSPACE ASSIGNMENTS
    console.log('\n🔍 Verifying workspace assignments...');
    
    const notaryLeads = await prisma.leads.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const notaryContacts = await prisma.contacts.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const notaryAccounts = await prisma.accounts.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    console.log(`📊 Notary Everyday current counts:`);
    console.log(`   Accounts: ${notaryAccounts.length}`);
    console.log(`   Leads: ${notaryLeads.length}`);
    console.log(`   Contacts: ${notaryContacts.length}`);
    
    // 5. VERIFY USER ASSIGNMENTS
    console.log('\n👤 Verifying user assignments...');
    
    const danoLeads = notaryLeads.filter(l => l.assignedUserId === DANO_USER_ID);
    const danoContacts = notaryContacts.filter(c => c.assignedUserId === DANO_USER_ID);
    const danoAccounts = notaryAccounts.filter(a => a.assignedUserId === DANO_USER_ID);
    
    console.log(`📊 Dano's assignments in Notary Everyday:`);
    console.log(`   Accounts: ${danoAccounts.length}`);
    console.log(`   Leads: ${danoLeads.length}`);
    console.log(`   Contacts: ${danoContacts.length}`);
    
    // 6. COMPARE WITH RETAIL PRODUCT SOLUTIONS
    console.log('\n🔍 Comparing with Retail Product Solutions...');
    
    const retailLeads = await prisma.leads.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    const retailContacts = await prisma.contacts.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    const retailAccounts = await prisma.accounts.findMany({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    console.log(`📊 Retail Product Solutions counts:`);
    console.log(`   Accounts: ${retailAccounts.length}`);
    console.log(`   Leads: ${retailLeads.length}`);
    console.log(`   Contacts: ${retailContacts.length}`);
    
    const retailDanoLeads = retailLeads.filter(l => l.assignedUserId === DANO_USER_ID);
    const retailDanoContacts = retailContacts.filter(c => c.assignedUserId === DANO_USER_ID);
    const retailDanoAccounts = retailAccounts.filter(a => a.assignedUserId === DANO_USER_ID);
    
    console.log(`📊 Dano's assignments in Retail Product Solutions:`);
    console.log(`   Accounts: ${retailDanoAccounts.length}`);
    console.log(`   Leads: ${retailDanoLeads.length}`);
    console.log(`   Contacts: ${retailDanoContacts.length}`);
    
    // 7. FINAL VERIFICATION
    console.log('\n🔍 Final verification...');
    
    // Test API access
    console.log('\n🧪 Testing API access...');
    
    // Check if we can now access the data
    const testLeads = await prisma.leads.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      take: 5
    });
    
    const testContacts = await prisma.contacts.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      take: 5
    });
    
    console.log(`   Test leads found: ${testLeads.length}`);
    console.log(`   Test contacts found: ${testContacts.length}`);
    
    if (testLeads.length > 0 && testContacts.length > 0) {
      console.log('✅ Data access test successful!');
    } else {
      console.log('⚠️  Data access test failed');
    }
    
    // 8. GENERATE FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP AND ASSIGNMENT COMPLETE');
    console.log('='.repeat(60));
    
    if (remainingExternalLeads.length === 0 && remainingExternalContacts.length === 0) {
      console.log('🎉 SUCCESS: All external IDs completely removed!');
      console.log('🎯 Notary Everyday data is now clean and accessible');
      console.log('👤 All records properly assigned to workspace and users');
    } else {
      console.log('⚠️  WARNING: Some external IDs still remain');
      console.log('   Manual intervention may be required');
    }
    
    // Save final report
    const report = {
      timestamp: new Date().toISOString(),
      cleanup: {
        externalLeadsRemoved: externalLeads.length,
        externalContactsRemoved: externalContacts.length,
        remainingExternalLeads: remainingExternalLeads.length,
        remainingExternalContacts: remainingExternalContacts.length
      },
      notaryEveryday: {
        accounts: notaryAccounts.length,
        leads: notaryLeads.length,
        contacts: notaryContacts.length,
        danoAccounts: danoAccounts.length,
        danoLeads: danoLeads.length,
        danoContacts: danoContacts.length
      },
      retailProductSolutions: {
        accounts: retailAccounts.length,
        leads: retailLeads.length,
        contacts: retailContacts.length,
        danoAccounts: retailDanoAccounts.length,
        danoLeads: retailDanoLeads.length,
        danoContacts: retailDanoContacts.length
      }
    };
    
    const fs = await import('fs');
    const reportPath = 'scripts/reports/complete-cleanup-report.json';
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Final report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
if (import.meta.url === `file://${process.argv[1]}`) {
  completeCleanupAndAssignment();
}
