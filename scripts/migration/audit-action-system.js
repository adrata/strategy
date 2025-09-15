const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function auditActionSystem() {
  console.log('🔍 AUDITING ACTION SYSTEM...');
  console.log('============================');
  
  try {
    // 1. Check existing actions
    const totalActions = await prisma.actions.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    console.log(`📊 Total actions in Dano's workspace: ${totalActions}`);
    
    // 2. Check action types
    const actionTypes = await prisma.actions.groupBy({
      by: ['type'],
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      _count: { type: true }
    });
    console.log('\n📋 Action types breakdown:');
    actionTypes.forEach(type => {
      console.log(`  ${type.type}: ${type._count.type}`);
    });
    
    // 3. Check record counts
    const leadsCount = await prisma.leads.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    const prospectsCount = await prisma.prospects.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    const companiesCount = await prisma.companies.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    const peopleCount = await prisma.people.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    
    console.log('\n📊 Record counts:');
    console.log(`  Leads: ${leadsCount}`);
    console.log(`  Prospects: ${prospectsCount}`);
    console.log(`  Companies: ${companiesCount}`);
    console.log(`  People: ${peopleCount}`);
    
    // 4. Check if any record creation actions exist
    const recordCreationActions = await prisma.actions.count({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        type: { contains: 'created' }
      }
    });
    console.log(`\n🏗️ Record creation actions: ${recordCreationActions}`);
    
    // 5. Test creating a single action
    console.log('\n🧪 Testing action creation...');
    const testActionId = `test_action_${Date.now()}`;
    
    try {
      const testAction = await prisma.actions.create({
        data: {
          id: testActionId,
          type: 'test_action',
          subject: 'Test Action',
          description: 'Testing action creation',
          status: 'completed',
          priority: 'normal',
          workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
          completedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          metadata: { test: true }
        }
      });
      console.log('✅ Test action created successfully');
      
      // Clean up test action
      await prisma.actions.delete({ where: { id: testActionId } });
      console.log('🧹 Test action cleaned up');
      
    } catch (error) {
      console.log('❌ Test action creation failed:', error.message);
      console.log('Error code:', error.code);
      if (error.code === 'P2002') {
        console.log('💡 This is a duplicate key error - actions might already exist');
      }
    }
    
    // 6. Check for existing lead creation actions
    const existingLeadActions = await prisma.actions.findMany({
      where: { 
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        type: { contains: 'lead' }
      },
      take: 5,
      select: { id: true, type: true, subject: true, createdAt: true }
    });
    
    console.log('\n🔍 Sample existing lead actions:');
    existingLeadActions.forEach(action => {
      console.log(`  ${action.id}: ${action.type} - ${action.subject}`);
    });
    
    // 7. Check if the issue is duplicate IDs
    console.log('\n🔍 Checking for potential duplicate ID conflicts...');
    const sampleLead = await prisma.leads.findFirst({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, fullName: true }
    });
    
    if (sampleLead) {
      const potentialActionId = `lead_created_${sampleLead.id}`;
      const existingAction = await prisma.actions.findUnique({
        where: { id: potentialActionId }
      });
      
      if (existingAction) {
        console.log(`⚠️ Action ID conflict found: ${potentialActionId} already exists`);
        console.log(`   Lead: ${sampleLead.fullName} (${sampleLead.id})`);
        console.log(`   Existing action: ${existingAction.type} - ${existingAction.subject}`);
      } else {
        console.log(`✅ No ID conflict for lead: ${sampleLead.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Audit failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditActionSystem();
