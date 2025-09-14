const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeContactsVsLeads() {
  try {
    console.log('🔍 ANALYZING CONTACTS VS LEADS MISMATCH\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Get all contacts in TOPS workspace
    const allContacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    // Get all leads in TOPS workspace
    const allLeads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    // Find contacts without leads
    const contactIds = new Set(allContacts.map(c => c.id));
    const leadContactIds = new Set(allLeads.map(l => l.contactId).filter(Boolean));
    
    const contactsWithoutLeads = allContacts.filter(c => !leadContactIds.has(c.id));
    
    console.log('📊 NUMBERS BREAKDOWN:');
    console.log(`   • Total Contacts: ${allContacts.length}`);
    console.log(`   • Total Leads: ${allLeads.length}`);
    console.log(`   • Contacts without leads: ${contactsWithoutLeads.length}`);
    console.log(`   • Difference: ${allContacts.length - allLeads.length}`);
    console.log('');
    
    // Sample of contacts without leads
    console.log('📋 SAMPLE CONTACTS WITHOUT LEADS:');
    contactsWithoutLeads.slice(0, 10).forEach(contact => {
      console.log(`   • ${contact.fullName} - ${contact.jobTitle || 'No title'} - ${contact.source || 'Unknown source'}`);
    });
    
    if (contactsWithoutLeads.length > 10) {
      console.log(`   ... and ${contactsWithoutLeads.length - 10} more`);
    }
    console.log('');
    
    // Check data quality issues
    const noJobTitle = contactsWithoutLeads.filter(c => !c.jobTitle).length;
    const noEmail = contactsWithoutLeads.filter(c => !c.email).length;
    const noCompany = contactsWithoutLeads.filter(c => !c.company).length;
    
    console.log('📊 DATA QUALITY ISSUES:');
    console.log(`   • No job title: ${noJobTitle}`);
    console.log(`   • No email: ${noEmail}`);
    console.log(`   • No company: ${noCompany}`);
    console.log('');
    
    // Check by source
    const sourceBreakdown = {};
    contactsWithoutLeads.forEach(contact => {
      const source = contact.source || 'Unknown';
      sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
    });
    
    console.log('🏷️ BREAKDOWN BY SOURCE:');
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    console.log('');
    
    // Check leads by source
    const leadSourceBreakdown = {};
    allLeads.forEach(lead => {
      const source = lead.source || 'Unknown';
      leadSourceBreakdown[source] = (leadSourceBreakdown[source] || 0) + 1;
    });
    
    console.log('🎯 LEADS BY SOURCE:');
    Object.entries(leadSourceBreakdown).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the analysis
if (require.main === module) {
  analyzeContactsVsLeads();
}

module.exports = { analyzeContactsVsLeads };
