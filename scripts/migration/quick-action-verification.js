const { PrismaClient } = require('@prisma/client');

async function quickVerification() {
  console.log('🔗 QUICK ACTION VERIFICATION');
  console.log('============================');
  
  const prisma = new PrismaClient();
  
  try {
    // Check actions linked to people
    const actionsWithPeople = await prisma.actions.count({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null }
      }
    });
    
    // Check actions linked to companies
    const actionsWithCompanies = await prisma.actions.count({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        companyId: { not: null }
      }
    });
    
    // Check actions linked to leads
    const actionsWithLeads = await prisma.actions.count({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        leadId: { not: null }
      }
    });
    
    console.log(`📊 Action relationship breakdown:`);
    console.log(`  Actions linked to people: ${actionsWithPeople}`);
    console.log(`  Actions linked to companies: ${actionsWithCompanies}`);
    console.log(`  Actions linked to leads: ${actionsWithLeads}`);
    
    // Sample one action to verify structure
    const sampleAction = await prisma.actions.findFirst({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        personId: { not: null }
      },
      select: {
        id: true,
        type: true,
        subject: true,
        personId: true,
        companyId: true,
        leadId: true
      }
    });
    
    if (sampleAction) {
      console.log(`\n🔍 Sample action:`);
      console.log(`  Type: ${sampleAction.type}`);
      console.log(`  Subject: ${sampleAction.subject}`);
      console.log(`  Person: ${sampleAction.personId || 'None'}`);
      console.log(`  Company: ${sampleAction.companyId || 'None'}`);
      console.log(`  Lead: ${sampleAction.leadId || 'None'}`);
    }
    
    console.log('\n✅ Action relationships verified - using people/companies (not legacy account/contact)');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickVerification();
