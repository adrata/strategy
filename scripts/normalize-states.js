const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// State abbreviation to full name mapping
const stateMapping = {
  'AL': 'Alabama',
  'AK': 'Alaska', 
  'AZ': 'Arizona',
  'AR': 'Arkansas',
  'CA': 'California',
  'CO': 'Colorado',
  'CT': 'Connecticut',
  'DE': 'Delaware',
  'FL': 'Florida',
  'GA': 'Georgia',
  'HI': 'Hawaii',
  'ID': 'Idaho',
  'IL': 'Illinois',
  'IN': 'Indiana',
  'IA': 'Iowa',
  'KS': 'Kansas',
  'KY': 'Kentucky',
  'LA': 'Louisiana',
  'ME': 'Maine',
  'MD': 'Maryland',
  'MA': 'Massachusetts',
  'MI': 'Michigan',
  'MN': 'Minnesota',
  'MS': 'Mississippi',
  'MO': 'Missouri',
  'MT': 'Montana',
  'NE': 'Nebraska',
  'NV': 'Nevada',
  'NH': 'New Hampshire',
  'NJ': 'New Jersey',
  'NM': 'New Mexico',
  'NY': 'New York',
  'NC': 'North Carolina',
  'ND': 'North Dakota',
  'OH': 'Ohio',
  'OK': 'Oklahoma',
  'OR': 'Oregon',
  'PA': 'Pennsylvania',
  'RI': 'Rhode Island',
  'SC': 'South Carolina',
  'SD': 'South Dakota',
  'TN': 'Tennessee',
  'TX': 'Texas',
  'UT': 'Utah',
  'VT': 'Vermont',
  'VA': 'Virginia',
  'WA': 'Washington',
  'WV': 'West Virginia',
  'WI': 'Wisconsin',
  'WY': 'Wyoming',
  'DC': 'District of Columbia'
};

async function normalizeStates() {
  try {
    console.log('🔧 Normalizing state data across all tables...\n');
    
    const workspaceId = 'cmezxb1ez0001pc94yry3ntjk';
    
    // 1. Normalize account states
    console.log('📊 Normalizing ACCOUNT states...');
    const accountStates = await prisma.accounts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        state: { in: Object.keys(stateMapping) }
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    });
    
    console.log(`Found ${accountStates.length} accounts with abbreviated states`);
    
    for (const account of accountStates) {
      const fullStateName = stateMapping[account.state];
      if (fullStateName) {
        await prisma.accounts.update({
          where: { id: account.id },
          data: { state: fullStateName }
        });
        console.log(`   Updated ${account.name}: "${account.state}" → "${fullStateName}"`);
      }
    }
    
    // 2. Normalize lead states
    console.log('\n📊 Normalizing LEAD states...');
    const leadStates = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        state: { in: Object.keys(stateMapping) }
      },
      select: {
        id: true,
        fullName: true,
        state: true
      }
    });
    
    console.log(`Found ${leadStates.length} leads with abbreviated states`);
    
    for (const lead of leadStates) {
      const fullStateName = stateMapping[lead.state];
      if (fullStateName) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { state: fullStateName }
        });
        console.log(`   Updated ${lead.fullName}: "${lead.state}" → "${fullStateName}"`);
      }
    }
    
    // 3. Normalize contact states
    console.log('\n📊 Normalizing CONTACT states...');
    const contactStates = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        state: { in: Object.keys(stateMapping) }
      },
      select: {
        id: true,
        fullName: true,
        state: true
      }
    });
    
    console.log(`Found ${contactStates.length} contacts with abbreviated states`);
    
    for (const contact of contactStates) {
      const fullStateName = stateMapping[contact.state];
      if (fullStateName) {
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { state: fullStateName }
        });
        console.log(`   Updated ${contact.fullName}: "${contact.state}" → "${fullStateName}"`);
      }
    }
    
    // 4. Populate contact states from their accounts (where contact state is null)
    console.log('\n📊 Populating CONTACT states from associated accounts...');
    const contactsWithNullStates = await prisma.contacts.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        state: null,
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
      }
    });
    
    console.log(`Found ${contactsWithNullStates.length} contacts with null states that have associated accounts`);
    
    let updatedContacts = 0;
    for (const contact of contactsWithNullStates) {
      if (contact.accounts?.state) {
        await prisma.contacts.update({
          where: { id: contact.id },
          data: { state: contact.accounts.state }
        });
        console.log(`   Updated ${contact.fullName}: null → "${contact.accounts.state}" (from ${contact.accounts.name})`);
        updatedContacts++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedContacts} contacts with account states`);
    
    // 5. Populate lead states from their accounts (where lead state is null)
    console.log('\n📊 Populating LEAD states from associated accounts...');
    const leadsWithNullStates = await prisma.leads.findMany({
      where: {
        workspaceId: workspaceId,
        deletedAt: null,
        state: null,
        accountId: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        state: true,
        accountId: true
      }
    });
    
    console.log(`Found ${leadsWithNullStates.length} leads with null states that have associated accounts`);
    
    // Get account data for these leads
    const leadAccountIds = leadsWithNullStates.map(lead => lead.accountId).filter(Boolean);
    const leadAccounts = await prisma.accounts.findMany({
      where: {
        id: { in: leadAccountIds },
        workspaceId: workspaceId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        state: true
      }
    });
    
    const leadAccountMap = new Map(leadAccounts.map(account => [account.id, account]));
    
    let updatedLeads = 0;
    for (const lead of leadsWithNullStates) {
      const account = leadAccountMap.get(lead.accountId);
      if (account?.state) {
        await prisma.leads.update({
          where: { id: lead.id },
          data: { state: account.state }
        });
        console.log(`   Updated ${lead.fullName}: null → "${account.state}" (from ${account.name})`);
        updatedLeads++;
      }
    }
    
    console.log(`\n✅ Updated ${updatedLeads} leads with account states`);
    
    // 6. Final summary
    console.log('\n🎯 NORMALIZATION COMPLETE!');
    console.log('Summary of changes:');
    console.log(`   - Normalized ${accountStates.length} account states`);
    console.log(`   - Normalized ${leadStates.length} lead states`);
    console.log(`   - Normalized ${contactStates.length} contact states`);
    console.log(`   - Populated ${updatedContacts} contact states from accounts`);
    console.log(`   - Populated ${updatedLeads} lead states from accounts`);
    
  } catch (error) {
    console.error('❌ Error normalizing states:', error);
  } finally {
    await prisma.$disconnect();
  }
}

normalizeStates();
