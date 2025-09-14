#!/usr/bin/env node

/**
 * 🔧 FIX ACCOUNT ASSIGNMENTS AND ALIGN LEADS/CONTACTS
 * 
 * 1. Assigns unassigned accounts to Dano (target: 150 total)
 * 2. Ensures leads and contacts are properly aligned
 * 3. Fixes the count discrepancies
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
const TARGET_ACCOUNT_COUNT = 150;

async function fixAccountAssignments() {
  console.log('🔧 FIXING ACCOUNT ASSIGNMENTS AND ALIGNMENT');
  console.log('============================================\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // 1. GET CURRENT STATE
    console.log('🔍 Getting current state...');
    
    const totalAccounts = await prisma.accounts.count({
      where: { workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const danoAccounts = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const unassignedAccounts = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: null
      }
    });
    
    console.log(`📊 Current account state:`);
    console.log(`   Total accounts: ${totalAccounts}`);
    console.log(`   Dano's accounts: ${danoAccounts}`);
    console.log(`   Unassigned accounts: ${unassignedAccounts}`);
    
    // 2. ASSIGN ACCOUNTS TO DANO (TARGET: 150 TOTAL)
    console.log('\n👤 Assigning accounts to Dano...');
    
    if (danoAccounts < TARGET_ACCOUNT_COUNT) {
      const accountsToAssign = TARGET_ACCOUNT_COUNT - danoAccounts;
      console.log(`   Need to assign ${accountsToAssign} more accounts to reach target of ${TARGET_ACCOUNT_COUNT}`);
      
      // Get unassigned accounts to assign
      const accountsToUpdate = await prisma.accounts.findMany({
        where: { 
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: null
        },
        take: accountsToAssign,
        orderBy: { createdAt: 'desc' }
      });
      
      let accountsAssigned = 0;
      for (const account of accountsToUpdate) {
        try {
          await prisma.accounts.update({
            where: { id: account.id },
            data: { assignedUserId: DANO_USER_ID }
          });
          accountsAssigned++;
        } catch (error) {
          console.error(`   ❌ Error assigning account ${account.id}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ Assigned ${accountsAssigned} accounts to Dano`);
    } else {
      console.log(`   ✅ Dano already has ${danoAccounts} accounts (target: ${TARGET_ACCOUNT_COUNT})`);
    }
    
    // 3. CHECK LEADS VS CONTACTS ALIGNMENT
    console.log('\n🔍 Checking leads vs contacts alignment...');
    
    const leads = await prisma.leads.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      },
      select: { id: true, email: true, fullName: true }
    });
    
    const contacts = await prisma.contacts.findMany({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      },
      select: { id: true, email: true, fullName: true }
    });
    
    console.log(`📊 Current counts:`);
    console.log(`   Leads: ${leads.length}`);
    console.log(`   Contacts: ${contacts.length}`);
    console.log(`   Difference: ${Math.abs(leads.length - contacts.length)}`);
    
    // 4. FIND MISMATCHES
    console.log('\n🔍 Finding mismatches...');
    
    const leadEmails = leads.filter(l => l.email).map(l => l.email.toLowerCase());
    const contactEmails = contacts.filter(c => c.email).map(c => c.email.toLowerCase());
    
    // Find leads without corresponding contacts
    const leadsWithoutContacts = leads.filter(lead => 
      lead.email && !contactEmails.includes(lead.email.toLowerCase())
    );
    
    // Find contacts without corresponding leads
    const contactsWithoutLeads = contacts.filter(contact => 
      contact.email && !leadEmails.includes(contact.email.toLowerCase())
    );
    
    console.log(`📊 Mismatches found:`);
    console.log(`   Leads without contacts: ${leadsWithoutContacts.length}`);
    console.log(`   Contacts without leads: ${contactsWithoutLeads.length}`);
    
    // 5. FIX MISMATCHES
    console.log('\n🔧 Fixing mismatches...');
    
    let leadsCreated = 0;
    let contactsCreated = 0;
    
    // Create missing leads for contacts
    for (const contact of contactsWithoutLeads) {
      try {
        await prisma.leads.create({
          data: {
            id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: NOTARY_WORKSPACE_ID,
            assignedUserId: DANO_USER_ID,
            firstName: contact.fullName.split(' ')[0] || 'Unknown',
            lastName: contact.fullName.split(' ').slice(1).join(' ') || 'Unknown',
            fullName: contact.fullName,
            email: contact.email,
            status: 'new',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        contactsCreated++;
      } catch (error) {
        console.error(`   ❌ Error creating lead for contact ${contact.id}: ${error.message}`);
      }
    }
    
    // Create missing contacts for leads
    for (const lead of leadsWithoutContacts) {
      try {
        await prisma.contacts.create({
          data: {
            id: `contact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            workspaceId: NOTARY_WORKSPACE_ID,
            assignedUserId: DANO_USER_ID,
            firstName: lead.fullName.split(' ')[0] || 'Unknown',
            lastName: lead.fullName.split(' ').slice(1).join(' ') || 'Unknown',
            fullName: lead.fullName,
            email: lead.email,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        leadsCreated++;
      } catch (error) {
        console.error(`   ❌ Error creating contact for lead ${lead.id}: ${error.message}`);
      }
    }
    
    console.log(`   ✅ Created ${leadsCreated} leads for missing contacts`);
    console.log(`   ✅ Created ${contactsCreated} contacts for missing leads`);
    
    // 6. VERIFY FINAL STATE
    console.log('\n🔍 Verifying final state...');
    
    const finalLeads = await prisma.leads.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const finalContacts = await prisma.contacts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    const finalAccounts = await prisma.accounts.count({
      where: { 
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: DANO_USER_ID
      }
    });
    
    console.log(`📊 Final Notary Everyday counts (Dano's assignments):`);
    console.log(`   Accounts: ${finalAccounts}`);
    console.log(`   Leads: ${finalLeads}`);
    console.log(`   Contacts: ${finalContacts}`);
    console.log(`   Leads/Contacts difference: ${Math.abs(finalLeads - finalContacts)}`);
    
    // 7. FINAL REPORT
    console.log('\n' + '='.repeat(60));
    console.log('📊 ACCOUNT ASSIGNMENT FIX COMPLETE');
    console.log('='.repeat(60));
    
    if (finalAccounts === TARGET_ACCOUNT_COUNT && finalLeads === finalContacts) {
      console.log('🎉 SUCCESS: All issues fixed!');
      console.log(`🎯 Dano now has exactly ${finalAccounts} accounts`);
      console.log(`🎯 Leads and contacts are perfectly aligned: ${finalLeads} each`);
      console.log('👤 All records properly assigned to Dano');
      console.log('🏢 Frontend should now show correct counts');
    } else {
      console.log('⚠️  Some issues may remain');
      console.log(`   Target accounts: ${TARGET_ACCOUNT_COUNT}, Actual: ${finalAccounts}`);
      console.log(`   Leads/Contacts aligned: ${finalLeads === finalContacts ? 'Yes' : 'No'}`);
    }
    
    // Save final report
    const report = {
      timestamp: new Date().toISOString(),
      initialState: {
        totalAccounts,
        danoAccounts,
        unassignedAccounts
      },
      fixes: {
        accountsAssigned: Math.max(0, TARGET_ACCOUNT_COUNT - danoAccounts),
        leadsCreated,
        contactsCreated
      },
      finalState: {
        accounts: finalAccounts,
        leads: finalLeads,
        contacts: finalContacts,
        leadsContactsAligned: finalLeads === finalContacts
      }
    };
    
    const fs = await import('fs');
    const reportPath = 'scripts/reports/account-assignment-fix.json';
    
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
  fixAccountAssignments();
}
