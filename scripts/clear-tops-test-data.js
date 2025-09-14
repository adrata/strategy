const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearTopsTestData() {
  try {
    console.log('🧹 CLEARING TOPS TEST DATA...\n');
    
    const topsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG75';
    
    console.log('📋 WORKSPACE IDENTIFICATION:');
    console.log(`   TOPS Workspace: ${topsWorkspaceId}\n`);
    
    // Clear test contacts
    const testContacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log(`📋 Found ${testContacts.length} test contacts to remove`);
    
    for (const contact of testContacts) {
      await prisma.contacts.delete({
        where: { id: contact.id }
      });
    }
    console.log(`   ✅ Removed ${testContacts.length} test contacts`);
    
    // Clear test leads
    const testLeads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log(`📋 Found ${testLeads.length} test leads to remove`);
    
    for (const lead of testLeads) {
      await prisma.leads.delete({
        where: { id: lead.id }
      });
    }
    console.log(`   ✅ Removed ${testLeads.length} test leads`);
    
    // Clear test activities
    const testActivities = await prisma.activities.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log(`📋 Found ${testActivities.length} test activities to remove`);
    
    for (const activity of testActivities) {
      await prisma.activities.delete({
        where: { id: activity.id }
      });
    }
    console.log(`   ✅ Removed ${testActivities.length} test activities`);
    
    // Verify workspace is clean
    const remainingContacts = await prisma.contacts.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const remainingLeads = await prisma.leads.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    const remainingActivities = await prisma.activities.findMany({
      where: { workspaceId: topsWorkspaceId }
    });
    
    console.log('\n🔍 VERIFICATION:');
    console.log(`   📋 Contacts: ${remainingContacts.length}`);
    console.log(`   🎯 Leads: ${remainingLeads.length}`);
    console.log(`   📅 Activities: ${remainingActivities.length}`);
    
    console.log('\n🎉 TOPS workspace cleared and ready for real CSV data import!');
    
  } catch (error) {
    console.error('❌ Error clearing TOPS test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTopsTestData();
