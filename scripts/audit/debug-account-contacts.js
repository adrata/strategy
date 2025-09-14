const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugAccountContacts() {
  try {
    console.log('🔍 DEBUGGING ACCOUNT CONTACTS API');
    console.log('==================================');
    
    const workspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // First, let's find the "Globalp" account
    console.log('📋 SEARCHING FOR ACCOUNTS:');
    console.log('==========================');
    
    const accounts = await prisma.accounts.findMany({
      where: {
        workspaceId,
        deletedAt: null,
        OR: [
          { name: { contains: 'Global', mode: 'insensitive' } },
          { name: { contains: 'Globalp', mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        industry: true,
        website: true
      }
    });
    
    console.log(`Found ${accounts.length} accounts matching "Global":`);
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name} (ID: ${account.id})`);
      console.log(`   Industry: ${account.industry}`);
      console.log(`   Website: ${account.website}`);
      console.log('');
    });
    
    if (accounts.length === 0) {
      console.log('❌ No accounts found matching "Global"');
      return;
    }
    
    // Test the account contacts API for each account
    for (const account of accounts) {
      console.log(`🔍 TESTING ACCOUNT CONTACTS API FOR: ${account.name}`);
      console.log('==================================================');
      
      // Test the API endpoint
      const apiResponse = await fetch(`http://localhost:3000/api/data/accounts/${account.id}/contacts?workspaceId=${workspaceId}`);
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        console.log('✅ API Response:');
        console.log(`   Success: ${apiData.success}`);
        console.log(`   Contacts found: ${apiData.count}`);
        console.log(`   Account: ${apiData.account?.name}`);
        
        if (apiData.contacts && apiData.contacts.length > 0) {
          console.log('   Contacts:');
          apiData.contacts.forEach((contact, index) => {
            console.log(`   ${index + 1}. ${contact.fullName || `${contact.firstName} ${contact.lastName}`}`);
            console.log(`      Company: ${contact.company}`);
            console.log(`      Job Title: ${contact.jobTitle}`);
            console.log(`      Email: ${contact.email}`);
          });
        } else {
          console.log('   No contacts found via API');
        }
      } else {
        console.log('❌ API Error:', apiResponse.status, await apiResponse.text());
      }
      
      // Also test direct database query
      console.log('\n🔍 DIRECT DATABASE QUERY:');
      console.log('=========================');
      
      const directContacts = await prisma.contacts.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          accountId: account.id
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          email: true,
          workEmail: true,
          jobTitle: true
        }
      });
      
      console.log(`Direct query found ${directContacts.length} contacts:`);
      directContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.fullName || `${contact.firstName} ${contact.lastName}`}`);
        console.log(`   Account ID: ${account.id}`);
        console.log(`   Job Title: ${contact.jobTitle}`);
        console.log(`   Email: ${contact.email || contact.workEmail}`);
      });
      
      // Let's also check what accounts exist for contacts
      console.log('\n🔍 ALL ACCOUNTS FOR CONTACTS:');
      console.log('=============================');
      
      const contactsWithAccounts = await prisma.contacts.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          accountId: {
            not: null
          }
        },
        select: {
          accountId: true,
          accounts: {
            select: {
              name: true
            }
          }
        },
        distinct: ['accountId']
      });
      
      console.log(`Found ${contactsWithAccounts.length} contacts with accounts:`);
      contactsWithAccounts.slice(0, 20).forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.accounts?.name || 'Unknown Account'} (ID: ${contact.accountId})`);
      });
      
      if (contactsWithAccounts.length > 20) {
        console.log(`... and ${contactsWithAccounts.length - 20} more accounts`);
      }
      
      // Check if any contacts are linked to accounts with "Global" in the name
      const globalAccountContacts = await prisma.contacts.findMany({
        where: {
          workspaceId,
          deletedAt: null,
          accounts: {
            name: {
              contains: 'Global',
              mode: 'insensitive'
            }
          }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          fullName: true,
          jobTitle: true,
          accounts: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`\n🔍 CONTACTS LINKED TO ACCOUNTS WITH "GLOBAL" IN NAME:`);
      console.log('==================================================');
      console.log(`Found ${globalAccountContacts.length} contacts:`);
      globalAccountContacts.forEach((contact, index) => {
        console.log(`${index + 1}. ${contact.fullName || `${contact.firstName} ${contact.lastName}`}`);
        console.log(`   Account: ${contact.accounts?.name || 'Unknown'}`);
        console.log(`   Job Title: ${contact.jobTitle}`);
      });
      
      console.log('\n' + '='.repeat(80) + '\n');
    }
    
  } catch (error) {
    console.error('❌ Error debugging account contacts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAccountContacts();
