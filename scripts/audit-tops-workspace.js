const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditTopsWorkspace() {
  try {
    console.log('🔍 AUDITING TOPS WORKSPACE - SHOULD ONLY CONTAIN CSV IMPORT DATA\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Get all data in TOPS workspace
    const accounts = await prisma.accounts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const leads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const activities = await prisma.activities.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('📊 CURRENT TOPS WORKSPACE INVENTORY:');
    console.log(`   🏢 Accounts: ${accounts.length}`);
    console.log(`   👥 Contacts: ${contacts.length}`);
    console.log(`   🎯 Leads: ${leads.length}`);
    console.log(`   📅 Activities: ${activities.length}`);
    console.log('');
    
    // Check what sources we have
    console.log('🏷️ CONTACT SOURCES:');
    const contactSources = {};
    contacts.forEach(contact => {
      const source = contact.source || 'Unknown';
      contactSources[source] = (contactSources[source] || 0) + 1;
    });
    Object.entries(contactSources).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    console.log('');
    
    console.log('🎯 LEAD SOURCES:');
    const leadSources = {};
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      leadSources[source] = (leadSources[source] || 0) + 1;
    });
    Object.entries(leadSources).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    console.log('');
    
    // Identify suspicious data that shouldn't be in TOPS
    console.log('🚨 SUSPICIOUS DATA (SHOULD NOT BE IN TOPS):');
    
    const suspiciousLeads = leads.filter(lead => 
      lead.source === 'retail_account_expansion' || 
      lead.source === 'contact_migration' ||
      lead.source === 'Zoho CRM'
    );
    
    if (suspiciousLeads.length > 0) {
      console.log(`   ❌ ${suspiciousLeads.length} leads from wrong sources:`);
      suspiciousLeads.slice(0, 5).forEach(lead => {
        console.log(`      • ${lead.fullName} - ${lead.source}`);
      });
      if (suspiciousLeads.length > 5) {
        console.log(`      ... and ${suspiciousLeads.length - 5} more`);
      }
    }
    
    const suspiciousContacts = contacts.filter(contact => 
      contact.source === 'Unknown' && contact.fullName.includes('Smith') ||
      contact.source === 'Unknown' && contact.fullName.includes('Johnson')
    );
    
    if (suspiciousContacts.length > 0) {
      console.log(`   ❌ ${suspiciousContacts.length} contacts with generic names (likely test data):`);
      suspiciousContacts.slice(0, 5).forEach(contact => {
        console.log(`      • ${contact.fullName} - ${contact.source || 'Unknown'}`);
      });
    }
    
    console.log('');
    
    // What SHOULD be in TOPS
    console.log('✅ WHAT SHOULD BE IN TOPS (FROM OUR CSV IMPORTS):');
    console.log('   • Capsule CRM data (tops.csv)');
    console.log('   • UTC All Regionals conference attendees');
    console.log('   • TOPS Mailer Campaign data');
    console.log('');
    
    // Check if we have the right data
    const expectedSources = ['TOPS Mailer Campaign', 'UTC All Regionals'];
    const hasExpectedData = expectedSources.every(source => 
      Object.keys(contactSources).includes(source)
    );
    
    if (hasExpectedData) {
      console.log('✅ TOPS workspace contains expected CSV import data');
    } else {
      console.log('❌ TOPS workspace missing expected CSV import data');
    }
    
    // Recommendations
    console.log('');
    console.log('🎯 RECOMMENDATIONS:');
    if (suspiciousLeads.length > 0) {
      console.log('   1. Remove leads from wrong sources (retail_account_expansion, contact_migration, Zoho CRM)');
    }
    if (suspiciousContacts.length > 0) {
      console.log('   2. Clean up generic test contact data');
    }
    console.log('   3. Ensure all contacts have corresponding leads (1:1 mapping)');
    console.log('   4. Verify data only comes from the 3 CSV files we imported');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit
if (require.main === module) {
  auditTopsWorkspace();
}

module.exports = { auditTopsWorkspace };
