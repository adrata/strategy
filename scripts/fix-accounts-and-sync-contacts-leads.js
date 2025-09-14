const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixAccountsAndSyncContactsLeads() {
  try {
    console.log('🔧 Fixing accounts to 150 total and syncing contacts/leads 1:1...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // 1. Fix accounts to exactly 150 (75 Arizona + 75 Florida)
    console.log('📊 Fixing accounts to exactly 150 total...');
    
    const currentAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    });
    
    const floridaAccounts = currentAccounts.filter(a => a.state === 'Florida');
    const arizonaAccounts = currentAccounts.filter(a => a.state === 'Arizona');
    
    console.log(`Current: ${currentAccounts.length} total (${floridaAccounts.length} Florida, ${arizonaAccounts.length} Arizona)`);
    
    // Unassign excess accounts to get to exactly 150
    const targetTotal = 150;
    const targetPerState = 75;
    
    if (currentAccounts.length > targetTotal) {
      const excessCount = currentAccounts.length - targetTotal;
      console.log(`Need to unassign ${excessCount} accounts to reach 150 total`);
      
      // Unassign excess Florida accounts first (since we have more Florida)
      if (floridaAccounts.length > targetPerState) {
        const excessFlorida = floridaAccounts.slice(targetPerState);
        await prisma.accounts.updateMany({
          where: {
            id: { in: excessFlorida.map(a => a.id) }
          },
          data: {
            assignedUserId: null
          }
        });
        console.log(`✅ Unassigned ${excessFlorida.length} excess Florida accounts`);
      }
      
      // Unassign excess Arizona accounts if needed
      if (arizonaAccounts.length > targetPerState) {
        const excessArizona = arizonaAccounts.slice(targetPerState);
        await prisma.accounts.updateMany({
          where: {
            id: { in: excessArizona.map(a => a.id) }
          },
          data: {
            assignedUserId: null
          }
        });
        console.log(`✅ Unassigned ${excessArizona.length} excess Arizona accounts`);
      }
    }
    
    // 2. Sync contacts and leads to be 1:1 (same people)
    console.log('\n🔄 Syncing contacts and leads to be 1:1...');
    
    // Get current contacts and leads
    const contacts = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        state: true,
        accountId: true
      }
    });
    
    const leads = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        state: true,
        accountId: true
      }
    });
    
    console.log(`Current: ${contacts.length} contacts, ${leads.length} leads`);
    
    // Create a map of contacts by email for matching
    const contactMap = new Map();
    contacts.forEach(contact => {
      if (contact.email) {
        contactMap.set(contact.email.toLowerCase(), contact);
      }
    });
    
    // Find leads that don't have corresponding contacts
    const leadsWithoutContacts = leads.filter(lead => {
      if (!lead.email) return true;
      return !contactMap.has(lead.email.toLowerCase());
    });
    
    console.log(`Found ${leadsWithoutContacts.length} leads without corresponding contacts`);
    
    // Create contacts for leads that don't have them
    let contactsCreated = 0;
    for (const lead of leadsWithoutContacts) {
      try {
        await prisma.contacts.create({
          data: {
            workspaceId: workspaceId,
            assignedUserId: userId,
            fullName: lead.fullName,
            email: lead.email,
            state: lead.state,
            accountId: lead.accountId,
            // Add other required fields with defaults
            firstName: lead.fullName?.split(' ')[0] || 'Unknown',
            lastName: lead.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        contactsCreated++;
        console.log(`   Created contact for lead: ${lead.fullName}`);
      } catch (error) {
        console.log(`   Failed to create contact for lead: ${lead.fullName} - ${error.message}`);
      }
    }
    
    // Find contacts that don't have corresponding leads
    const leadMap = new Map();
    leads.forEach(lead => {
      if (lead.email) {
        leadMap.set(lead.email.toLowerCase(), lead);
      }
    });
    
    const contactsWithoutLeads = contacts.filter(contact => {
      if (!contact.email) return true;
      return !leadMap.has(contact.email.toLowerCase());
    });
    
    console.log(`Found ${contactsWithoutLeads.length} contacts without corresponding leads`);
    
    // Create leads for contacts that don't have them
    let leadsCreated = 0;
    for (const contact of contactsWithoutLeads) {
      try {
        await prisma.leads.create({
          data: {
            workspaceId: workspaceId,
            assignedUserId: userId,
            fullName: contact.fullName,
            email: contact.email,
            state: contact.state,
            accountId: contact.accountId,
            // Add other required fields with defaults
            firstName: contact.fullName?.split(' ')[0] || 'Unknown',
            lastName: contact.fullName?.split(' ').slice(1).join(' ') || 'Unknown',
            status: 'active',
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        leadsCreated++;
        console.log(`   Created lead for contact: ${contact.fullName}`);
      } catch (error) {
        console.log(`   Failed to create lead for contact: ${contact.fullName} - ${error.message}`);
      }
    }
    
    // 3. Final verification
    console.log('\n🎯 FINAL VERIFICATION...');
    
    const finalAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        state: true
      }
    });
    
    const finalContacts = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        state: true
      }
    });
    
    const finalLeads = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        state: true
      }
    });
    
    const finalFloridaAccounts = finalAccounts.filter(a => a.state === 'Florida').length;
    const finalArizonaAccounts = finalAccounts.filter(a => a.state === 'Arizona').length;
    const finalFloridaContacts = finalContacts.filter(c => c.state === 'Florida').length;
    const finalArizonaContacts = finalContacts.filter(c => c.state === 'Arizona').length;
    const finalFloridaLeads = finalLeads.filter(l => l.state === 'Florida').length;
    const finalArizonaLeads = finalLeads.filter(l => l.state === 'Arizona').length;
    
    console.log('Final distribution:');
    console.log(`   Accounts: ${finalAccounts.length} total (${finalFloridaAccounts} Florida, ${finalArizonaAccounts} Arizona)`);
    console.log(`   Contacts: ${finalContacts.length} total (${finalFloridaContacts} Florida, ${finalArizonaContacts} Arizona)`);
    console.log(`   Leads: ${finalLeads.length} total (${finalFloridaLeads} Florida, ${finalArizonaLeads} Arizona)`);
    
    // Check if contacts and leads are now 1:1
    const contactEmails = new Set(finalContacts.map(c => c.email?.toLowerCase()).filter(Boolean));
    const leadEmails = new Set(finalLeads.map(l => l.email?.toLowerCase()).filter(Boolean));
    
    const finalContactsWithoutLeads = [...contactEmails].filter(email => !leadEmails.has(email));
    const finalLeadsWithoutContacts = [...leadEmails].filter(email => !contactEmails.has(email));
    
    console.log(`\n1:1 Sync Status:`);
    console.log(`   Contacts without leads: ${finalContactsWithoutLeads.length}`);
    console.log(`   Leads without contacts: ${finalLeadsWithoutContacts.length}`);
    
    if (finalContactsWithoutLeads.length === 0 && finalLeadsWithoutContacts.length === 0) {
      console.log('✅ Perfect 1:1 sync achieved!');
    } else {
      console.log('⚠️ Some contacts/leads still not synced');
    }
    
    console.log(`\n📊 Summary of changes:`);
    console.log(`   - Accounts: Fixed to ${finalAccounts.length} total`);
    console.log(`   - Contacts created: ${contactsCreated}`);
    console.log(`   - Leads created: ${leadsCreated}`);
    
  } catch (error) {
    console.error('❌ Error fixing accounts and syncing contacts/leads:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAccountsAndSyncContactsLeads();
