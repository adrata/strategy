const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTopsOnlyData() {
  try {
    console.log('🔍 CHECKING TOPS WORKSPACE DATA ONLY\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72';
    
    // Check what's actually in TOPS workspace
    console.log('📊 TOPS WORKSPACE DATA BREAKDOWN:\n');
    
    // Contacts
    const contacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('👥 CONTACTS:');
    console.log(`   • Total: ${contacts.length}`);
    
    // Group by source
    const contactSources = {};
    contacts.forEach(c => {
      const source = c.source || 'Unknown';
      contactSources[source] = (contactSources[source] || 0) + 1;
    });
    
    Object.entries(contactSources).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    console.log('');
    
    // Leads
    const leads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('🎯 LEADS:');
    console.log(`   • Total: ${leads.length}`);
    
    // Group by source
    const leadSources = {};
    leads.forEach(l => {
      const source = l.source || 'Unknown';
      leadSources[source] = (leadSources[source] || 0) + 1;
    });
    
    Object.entries(leadSources).forEach(([source, count]) => {
      console.log(`   • ${source}: ${count}`);
    });
    console.log('');
    
    // Activities
    const activities = await prisma.activities.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('📅 ACTIVITIES:');
    console.log(`   • Total: ${activities.length}`);
    
    // Group by type
    const activityTypes = {};
    activities.forEach(a => {
      const type = a.type || 'Unknown';
      activityTypes[type] = (activityTypes[type] || 0) + 1;
    });
    
    Object.entries(activityTypes).forEach(([type, count]) => {
      console.log(`   • ${type}: ${count}`);
    });
    console.log('');
    
    // Check for data that shouldn't be in TOPS
    console.log('🚨 POTENTIAL DATA CONTAMINATION:');
    
    const retailLeads = leads.filter(l => l.source === 'retail_account_expansion');
    const migrationLeads = leads.filter(l => l.source === 'contact_migration');
    
    if (retailLeads.length > 0) {
      console.log(`   ❌ Found ${retailLeads.length} leads from 'retail_account_expansion' (should not be in TOPS)`);
    }
    
    if (migrationLeads.length > 0) {
      console.log(`   ❌ Found ${migrationLeads.length} leads from 'contact_migration' (should not be in TOPS)`);
    }
    
    if (retailLeads.length === 0 && migrationLeads.length === 0) {
      console.log('   ✅ No contaminated data found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkTopsOnlyData();
}

module.exports = { checkTopsOnlyData };
