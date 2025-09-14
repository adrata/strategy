const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditStates() {
  try {
    console.log('🔍 Auditing state data across contacts and accounts...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    const userId = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // Check unique states in accounts
    console.log('📊 ACCOUNTS - Unique states:');
    const accountStates = await prisma.accounts.groupBy({
      by: ['state'],
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      _count: {
        state: true
      },
      orderBy: {
        _count: {
          state: 'desc'
        }
      }
    });
    
    accountStates.forEach(state => {
      console.log(`   "${state.state}": ${state._count.state} accounts`);
    });
    
    // Check unique states in contacts
    console.log('\n📊 CONTACTS - Unique states:');
    const contactStates = await prisma.contacts.groupBy({
      by: ['state'],
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      _count: {
        state: true
      },
      orderBy: {
        _count: {
          state: 'desc'
        }
      }
    });
    
    contactStates.forEach(state => {
      console.log(`   "${state.state}": ${state._count.state} contacts`);
    });
    
    // Check unique states in leads
    console.log('\n📊 LEADS - Unique states:');
    const leadStates = await prisma.leads.groupBy({
      by: ['state'],
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId
      },
      _count: {
        state: true
      },
      orderBy: {
        _count: {
          state: 'desc'
        }
      }
    });
    
    leadStates.forEach(state => {
      console.log(`   "${state.state}": ${state._count.state} leads`);
    });
    
    // Check for data inconsistencies - contacts with accountId but different states
    console.log('\n🔍 DATA INCONSISTENCIES - Contacts vs their Accounts:');
    const contactsWithAccounts = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        accountId: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        state: true,
        accountId: true,
        accounts: {
          select: {
            name: true,
            state: true
          }
        }
      },
      take: 20
    });
    
    console.log('Sample contacts with their account states:');
    contactsWithAccounts.forEach((contact, index) => {
      const contactState = contact.state || 'null';
      const accountState = contact.accounts?.state || 'null';
      const mismatch = contactState !== accountState ? '❌ MISMATCH' : '✅ MATCH';
      
      console.log(`${index + 1}. ${contact.fullName}`);
      console.log(`   Contact State: "${contactState}"`);
      console.log(`   Account State: "${accountState}"`);
      console.log(`   Status: ${mismatch}`);
      console.log('');
    });
    
    // Check for null states
    console.log('\n📊 NULL STATE ANALYSIS:');
    const nullAccountStates = await prisma.accounts.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        state: null
      }
    });
    
    const nullContactStates = await prisma.contacts.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        state: null
      }
    });
    
    const nullLeadStates = await prisma.leads.count({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        assignedUserId: userId,
        state: null
      }
    });
    
    console.log(`   Accounts with null state: ${nullAccountStates}`);
    console.log(`   Contacts with null state: ${nullContactStates}`);
    console.log(`   Leads with null state: ${nullLeadStates}`);
    
    // Check for non-standard state formats
    console.log('\n🔍 NON-STANDARD STATE FORMATS:');
    const allStates = [...new Set([
      ...accountStates.map(s => s.state),
      ...contactStates.map(s => s.state),
      ...leadStates.map(s => s.state)
    ])].filter(Boolean);
    
    console.log('All unique state values found:');
    allStates.forEach(state => {
      console.log(`   "${state}"`);
    });
    
  } catch (error) {
    console.error('❌ Error auditing states:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditStates();
