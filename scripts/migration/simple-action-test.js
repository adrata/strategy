const { PrismaClient } = require('@prisma/client');

async function simpleActionTest() {
  console.log('🧪 SIMPLE ACTION TEST');
  console.log('====================');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check current state
    console.log('1. Checking current state...');
    const totalActions = await prisma.actions.count({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' }
    });
    console.log(`   Total actions: ${totalActions}`);
    
    // 2. Check if we can create a simple action
    console.log('2. Testing action creation...');
    const testId = `test_${Date.now()}`;
    
    const testAction = await prisma.actions.create({
      data: {
        id: testId,
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
    
    console.log(`   ✅ Created test action: ${testAction.id}`);
    
    // 3. Clean up test action
    await prisma.actions.delete({ where: { id: testId } });
    console.log('   🧹 Cleaned up test action');
    
    // 4. Try creating one real action for a person
    console.log('3. Creating one real person action...');
    const firstPerson = await prisma.people.findFirst({
      where: { workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72' },
      select: { id: true, fullName: true, createdAt: true }
    });
    
    if (firstPerson) {
      const personActionId = `person_created_${firstPerson.id}`;
      
      try {
        const personAction = await prisma.actions.create({
          data: {
            id: personActionId,
            type: 'person_created',
            subject: `New person added: ${firstPerson.fullName || 'Unknown'}`,
            description: `System created new person record`,
            status: 'completed',
            priority: 'normal',
            personId: firstPerson.id,
            workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
            completedAt: firstPerson.createdAt,
            createdAt: firstPerson.createdAt,
            updatedAt: firstPerson.createdAt,
            metadata: {
              actionSource: 'system',
              recordType: 'people',
              recordId: firstPerson.id,
              systemAction: true
            }
          }
        });
        
        console.log(`   ✅ Created person action: ${personAction.id}`);
        console.log(`   📋 Person: ${firstPerson.fullName} (${firstPerson.id})`);
        
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`   ⚠️ Person action already exists: ${personActionId}`);
        } else {
          console.log(`   ❌ Error creating person action: ${error.message}`);
        }
      }
    } else {
      console.log('   ❌ No people found in workspace');
    }
    
    console.log('\n✅ Simple action test completed successfully!');
    
  } catch (error) {
    console.error('❌ Simple action test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleActionTest();
