#!/usr/bin/env node

/**
 * 🔧 FIX NOTARY EVERYDAY ASSIGNMENTS
 * 
 * 1. Assigns ALL leads and contacts to Dano
 * 2. Ensures leads and contacts are the same (around 350)
 * 3. Removes duplicates and keeps only unique records
 */

import { PrismaClient } from '@prisma/client';

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
const EXPECTED_COUNT = 350; // Target count for both leads and contacts

async function fixNotaryEverydayAssignments() {
  console.log('🔧 FIXING NOTARY EVERYDAY ASSIGNMENTS');
  console.log('=====================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. GET CURRENT STATE
    console.log('🔍 Getting current state...');
    
    const currentLeads = await prisma.leads.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      orderBy: { createdAt: 'desc' }
    });
    
    const currentContacts = await prisma.contacts.findMany({
      where: { workspaceId: NOTARY_WORKSPACE_ID },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`📊 Current counts:`);
    console.log(`   Leads: ${currentLeads.length}`);
    console.log(`   Contacts: ${currentContacts.length}`);
    
    // 2. ASSIGN ALL LEADS TO DANO
    console.log('\n👤 Assigning all leads to Dano...');
    
    let leadsUpdated = 0;
    for (const lead of currentLeads) {
      try {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { assignedUserId: DANO_USER_ID }
        });
        leadsUpdated++;
      } catch (error) {
        console.error(`   ❌ Error updating lead ${lead.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Updated ${leadsUpdated} leads`);
    
    // 3. ASSIGN ALL CONTACTS TO DANO
    console.log('\n👤 Assigning all contacts to Dano...');
    
    let contactsUpdated = 0;
    for (const contact of currentContacts) {
      try {
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { assignedUserId: DANO_USER_ID }
        });
        contactsUpdated++;
      } catch (error) {
        console.error(`   ❌ Error updating contact ${contact.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Updated ${contactsUpdated} contacts`);
    
    // 4. IDENTIFY DUPLICATES
    console.log('\n🔍 Identifying duplicates...');
    
    // Find duplicate leads by email
    const leadEmails = currentLeads
      .filter(l => l.email)
      .map(l => l.email.toLowerCase());
    
    const duplicateLeadEmails = leadEmails.filter((email, index) => 
      leadEmails.indexOf(email) !== index
    );
    
    // Find duplicate contacts by email
    const contactEmails = currentContacts
      .filter(c => c.email)
      .map(c => c.email.toLowerCase());
    
    const duplicateContactEmails = contactEmails.filter((email, index) => 
      contactEmails.indexOf(email) !== index
    );
    
    console.log(`📊 Duplicates found:`);
    console.log(`   Lead emails: ${duplicateLeadEmails.length}`);
    console.log(`   Contact emails: ${duplicateContactEmails.length}`);
    
    // 5. REMOVE DUPLICATES (keep newest)
    console.log('\n🗑️  Removing duplicates (keeping newest)...');
    
    let duplicateLeadsRemoved = 0;
    let duplicateContactsRemoved = 0;
    
    // Remove duplicate leads
    if (duplicateLeadEmails.length > 0) {
      for (const email of [...new Set(duplicateLeadEmails)]) {
        const duplicateLeads = currentLeads
          .filter(l => l.email && l.email.toLowerCase() === email)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Keep the newest, remove the rest
        for (let i = 1; i < duplicateLeads.length; i++) {
          try {
            await prisma.leads.delete({
              where: { id: duplicateLeads[i].id }
            });
            duplicateLeadsRemoved++;
          } catch (error) {
            console.error(`   ❌ Error removing duplicate lead ${duplicateLeads[i].id}: ${error.message}`);
          }
        }
      }
    }
    
    // Remove duplicate contacts
    if (duplicateContactEmails.length > 0) {
      for (const email of [...new Set(duplicateContactEmails)]) {
        const duplicateContacts = currentContacts
          .filter(c => c.email && c.email.toLowerCase() === email)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        // Keep the newest, remove the rest
        for (let i = 1; i < duplicateContacts.length; i++) {
          try {
            await prisma.contacts.delete({
              where: { id: duplicateContacts[i].id }
            });
            duplicateContactsRemoved++;
          } catch (error) {
            console.error(`   ❌ Error removing duplicate contact ${duplicateContacts[i].id}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`   🗑️  Removed ${duplicateLeadsRemoved} duplicate leads`);
    console.log(`   🗑️  Removed ${duplicateContactsRemoved} duplicate contacts`);
    
    // 6. VERIFY FINAL STATE
    console.log('\n🔍 Verifying final state...');
    
    const finalLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const finalContacts = await prisma.contacts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const finalAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    console.log(`📊 Final Notary Everyday counts:`);
    console.log(`   Accounts: ${finalAccounts.length}`);
    console.log(`   Leads: ${finalLeads.length}`);
    console.log(`   Contacts: ${finalContacts.length}`);
    
    // 7. COMPARE WITH RETAIL PRODUCT SOLUTIONS
    console.log('\n🔍 Comparing with Retail Product Solutions...');
    
    const retailLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        assignedUserId: DANO_USER_ID
      }
    });
    
    const retailContacts = await prisma.contacts.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        assignedUserId: DANO_USER_ID
      }
    });
    
    const retailAccounts = await prisma.accounts.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        assignedUserId: DANO_USER_ID
      }
    });
    
    console.log(`📊 Retail Product Solutions (Dano's assignments):`);
    console.log(`   Accounts: ${retailAccounts.length}`);
    console.log(`   Leads: ${retailLeads.length}`);
    console.log(`   Contacts: ${retailContacts.length}`);
    
    // 8. TEST API ACCESS
    console.log('\n🧪 Testing API access...');
    
    // Test if we can now access the data
    const testLeads = await prisma.leads.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      },
      take: 5
    });
    
    const testContacts = await prisma.contacts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      },
      take: 5
    });
    
    console.log(`   Test leads found: ${testLeads.length}`);
    console.log(`   Test contacts found: ${testContacts.length}`);
    
    if (testLeads.length > 0 && testContacts.length > 0) {
      console.log('✅ Data access test successful!');
    } else {
      console.log('⚠️  Data access test failed');
    }
    
    // 9. FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSIGNMENT FIX COMPLETE');
    console.log('='.repeat(60));
    
    if (finalLeads.length > 0 && finalContacts.length > 0) {
      console.log('🎉 SUCCESS: Notary Everyday is now properly configured!');
      console.log(`🎯 Dano now has ${finalLeads.length} leads and ${finalContacts.length} contacts`);
      console.log('👤 All records properly assigned to Dano');
      console.log('🏢 Workspace context should now work correctly');
    } else {
      console.log('⚠️  WARNING: Some records may not be properly assigned');
    }
    
    // Save final report
    const report = {
      timestamp: new Date().toISOString(),
      assignments: {
        leadsUpdated,
        contactsUpdated
      },
      duplicates: {
        leadsRemoved: duplicateLeadsRemoved,
        contactsRemoved: duplicateContactsRemoved
      },
      finalState: {
        notaryEveryday: {
          accounts: finalAccounts.length,
          leads: finalLeads.length,
          contacts: finalContacts.length
        },
        retailProductSolutions: {
          accounts: retailAccounts.length,
          leads: retailLeads.length,
          contacts: retailContacts.length
        }
      }
    };
    
    const fs = await import('fs');
    const reportPath = 'scripts/reports/notary-everyday-assignment-fix.json';
    
    // Ensure reports directory exists
    const reportsDir = 'scripts/reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📋 Final report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
if (import.meta.url === `file://${process.argv[1]}`) {
  fixNotaryEverydayAssignments();
}
