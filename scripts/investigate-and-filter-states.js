const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function investigateAndFilterStates() {
  try {
    console.log('🔍 Investigating contact vs lead state discrepancies...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // 1. Check if contacts and leads are the same people
    console.log('📊 Checking if contacts and leads are the same people...');
    
    // Get contacts with their account info
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
        accountId: true,
        accounts: {
          select: {
            name: true,
            state: true
          }
        }
      },
      take: 10
    });
    
    // Get leads with their account info
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
      },
      take: 10
    });
    
    console.log('\n📋 Sample contacts:');
    contacts.forEach((contact, index) => {
      console.log(`${index + 1}. ${contact.fullName} - State: "${contact.state}" - Account: "${contact.accounts?.name}" (${contact.accounts?.state})`);
    });
    
    console.log('\n📋 Sample leads:');
    leads.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.fullName} - State: "${lead.state}" - AccountId: ${lead.accountId}`);
    });
    
    // 2. Check for duplicate names between contacts and leads
    console.log('\n🔍 Checking for duplicate names between contacts and leads...');
    const contactNames = new Set(contacts.map(c => c.fullName?.toLowerCase()));
    const leadNames = new Set(leads.map(l => l.fullName?.toLowerCase()));
    const duplicates = [...contactNames].filter(name => leadNames.has(name));
    
    console.log(`Found ${duplicates.length} duplicate names between contacts and leads:`);
    duplicates.slice(0, 5).forEach(name => {
      console.log(`   - ${name}`);
    });
    
    // 3. Get current state distribution
    console.log('\n📊 Current state distribution:');
    
    const contactStates = await prisma.contacts.groupBy({
      by: ['state'],
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      _count: { state: true },
      orderBy: { _count: { state: 'desc' } }
    });
    
    const leadStates = await prisma.leads.groupBy({
      by: ['state'],
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      _count: { state: true },
      orderBy: { _count: { state: 'desc' } }
    });
    
    console.log('Contacts by state:');
    contactStates.forEach(state => {
      console.log(`   "${state.state}": ${state._count.state}`);
    });
    
    console.log('\nLeads by state:');
    leadStates.forEach(state => {
      console.log(`   "${state.state}": ${state._count.state}`);
    });
    
    // 4. Filter out non-Arizona/Florida records
    console.log('\n🗑️ Filtering out non-Arizona/Florida records...');
    
    // Unassign contacts not in Arizona or Florida
    const contactsToUnassign = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        state: { notIn: ['Arizona', 'Florida'] }
      },
      select: {
        id: true,
        fullName: true,
        state: true
      }
    });
    
    console.log(`Found ${contactsToUnassign.length} contacts to unassign (not Arizona/Florida)`);
    
    if (contactsToUnassign.length > 0) {
      await prisma.contacts.updateMany({
        where: {
          id: { in: contactsToUnassign.map(c => c.id) }
        },
        data: {
          assignedUserId: null
        }
      });
      
      console.log(`✅ Unassigned ${contactsToUnassign.length} contacts from dano`);
      contactsToUnassign.slice(0, 5).forEach(contact => {
        console.log(`   - ${contact.fullName} (${contact.state})`);
      });
    }
    
    // Unassign leads not in Arizona or Florida
    const leadsToUnassign = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        state: { notIn: ['Arizona', 'Florida'] }
      },
      select: {
        id: true,
        fullName: true,
        state: true
      }
    });
    
    console.log(`Found ${leadsToUnassign.length} leads to unassign (not Arizona/Florida)`);
    
    if (leadsToUnassign.length > 0) {
      await prisma.leads.updateMany({
        where: {
          id: { in: leadsToUnassign.map(l => l.id) }
        },
        data: {
          assignedUserId: null
        }
      });
      
      console.log(`✅ Unassigned ${leadsToUnassign.length} leads from dano`);
      leadsToUnassign.slice(0, 5).forEach(lead => {
        console.log(`   - ${lead.fullName} (${lead.state})`);
      });
    }
    
    // 5. Rebalance accounts to maintain 150 with equal Arizona/Florida distribution
    console.log('\n⚖️ Rebalancing accounts to maintain 150 with equal Arizona/Florida distribution...');
    
    // Get current account distribution
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
    
    console.log(`Current accounts: ${currentAccounts.length} total`);
    console.log(`   Florida: ${floridaAccounts.length}`);
    console.log(`   Arizona: ${arizonaAccounts.length}`);
    
    // Get available unassigned accounts in workspace
    const availableAccounts = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: null,
        state: { in: ['Arizona', 'Florida'] }
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    });
    
    const availableFlorida = availableAccounts.filter(a => a.state === 'Florida');
    const availableArizona = availableAccounts.filter(a => a.state === 'Arizona');
    
    console.log(`Available unassigned accounts: ${availableAccounts.length} total`);
    console.log(`   Florida: ${availableFlorida.length}`);
    console.log(`   Arizona: ${availableArizona.length}`);
    
    // Calculate how many more accounts we need
    const targetTotal = 150;
    const targetPerState = 75; // 75 Arizona + 75 Florida = 150 total
    
    const floridaNeeded = Math.max(0, targetPerState - floridaAccounts.length);
    const arizonaNeeded = Math.max(0, targetPerState - arizonaAccounts.length);
    
    console.log(`\nTarget: 150 total (75 Arizona + 75 Florida)`);
    console.log(`Need to add: ${floridaNeeded} Florida + ${arizonaNeeded} Arizona`);
    
    // Assign additional Florida accounts
    if (floridaNeeded > 0 && availableFlorida.length > 0) {
      const accountsToAssign = availableFlorida.slice(0, floridaNeeded);
      await prisma.accounts.updateMany({
        where: {
          id: { in: accountsToAssign.map(a => a.id) }
        },
        data: {
          assignedUserId: userId
        }
      });
      
      console.log(`✅ Assigned ${accountsToAssign.length} additional Florida accounts to dano`);
      accountsToAssign.slice(0, 3).forEach(account => {
        console.log(`   - ${account.name}`);
      });
    }
    
    // Assign additional Arizona accounts
    if (arizonaNeeded > 0 && availableArizona.length > 0) {
      const accountsToAssign = availableArizona.slice(0, arizonaNeeded);
      await prisma.accounts.updateMany({
        where: {
          id: { in: accountsToAssign.map(a => a.id) }
        },
        data: {
          assignedUserId: userId
        }
      });
      
      console.log(`✅ Assigned ${accountsToAssign.length} additional Arizona accounts to dano`);
      accountsToAssign.slice(0, 3).forEach(account => {
        console.log(`   - ${account.name}`);
      });
    }
    
    // 6. Final summary
    console.log('\n🎯 FILTERING AND REBALANCING COMPLETE!');
    
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
    
  } catch (error) {
    console.error('❌ Error investigating and filtering states:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateAndFilterStates();
