const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignCompaniesToDano() {
  try {
    console.log('🔍 Finding and assigning companies to Dano...\n');
    
    const NOTARY_WORKSPACE_ID = '01K1VBYXHD0J895XAN0HGFBKJP';
    const DANO_USER_ID = '01K1VBYYV7TRPY04NW4TW4XWRB';
    
    // First, let's find companies that match the names you mentioned
    const companyNames = [
      'Coastal Living Title, LLC',
      'Richr',
      'Berkshire Hathaway HomeServices Florida Realty',
      'SignatureRealEstateCompanies',
      'RE/MAX Services Boca Raton',
      'Hillsborough Title',
      'Zing Title Agency',
      'Brightline Title',
      'BHHS Florida Realty',
      'BrokerNation Real Estate',
      'Propy Inc.',
      'Title Partners of South Florida, Inc.',
      'TitleWave Real Estate Solutions',
      'Professional Title Agency',
      'WORLD PROPERTY VENTURES',
      'Fidelity National Title Agency, Arizona',
      'reQuire Real Estate Solutions, LLC',
      'Grand Canyon Title Agency',
      'Robert Slack LLC',
      'Sun National Title Company'
    ];
    
    console.log(`🔍 Looking for companies in Notary Everyday workspace...`);
    
    // Find companies that match these names in the Notary Everyday workspace
    const foundCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        name: {
          in: companyNames
        }
      },
      select: {
        id: true,
        name: true,
        assignedUserId: true
      }
    });
    
    console.log(`📊 Found ${foundCompanies.length} companies matching the names:`);
    foundCompanies.forEach(company => {
      console.log(`   ${company.name} - Currently assigned to: ${company.assignedUserId || 'UNASSIGNED'}`);
    });
    
    // Also check for companies that might be unassigned or assigned to other users
    const unassignedCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        deletedAt: null,
        assignedUserId: null
      },
      select: {
        id: true,
        name: true
      },
      take: 50 // Get first 50 unassigned companies
    });
    
    console.log(`\n📋 Found ${unassignedCompanies.length} unassigned companies in Notary Everyday workspace:`);
    unassignedCompanies.forEach(company => {
      console.log(`   ${company.name}`);
    });
    
    // Let's also check what companies are currently assigned to the user with 378 companies
    const topUserCompanies = await prisma.companies.findMany({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: '01K1VBYZMWTCT09FWEKBDMCXZM', // The user with 378 companies
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      },
      take: 20
    });
    
    console.log(`\n👤 Sample companies assigned to user 01K1VBYZMWTCT09FWEKBDMCXZM (378 total):`);
    topUserCompanies.forEach(company => {
      console.log(`   ${company.name}`);
    });
    
    // Ask if we should reassign some companies to Dano
    console.log(`\n🤔 Should we reassign some of these companies to Dano?`);
    console.log(`   - Found ${foundCompanies.length} companies matching your list`);
    console.log(`   - Found ${unassignedCompanies.length} unassigned companies`);
    console.log(`   - User 01K1VBYZMWTCT09FWEKBDMCXZM has 378 companies`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignCompaniesToDano();
