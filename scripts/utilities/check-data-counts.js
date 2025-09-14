const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDataCounts() {
  try {
    const workspace = await prisma.workspace.findUnique({
      where: { slug: 'retail-product-solutions' },
      select: { id: true, name: true }
    });
    
    if (!workspace) {
      console.log('❌ Workspace not found');
      return;
    }
    
    console.log('📊 Data summary for workspace:', workspace.name);
    
    const leads = await prisma.lead.count({ where: { workspaceId: workspace.id } });
    const contacts = await prisma.contact.count({ where: { workspaceId: workspace.id } });
    const opportunities = await prisma.opportunity.count({ where: { workspaceId: workspace.id } });
    const accounts = await prisma.account.count({ where: { workspaceId: workspace.id } });
    
    console.log(`👥 Leads: ${leads}`);
    console.log(`👤 Contacts: ${contacts}`);
    console.log(`💼 Opportunities: ${opportunities}`);
    console.log(`🏢 Accounts: ${accounts}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDataCounts(); 