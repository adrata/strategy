const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCallImport() {
  console.log('🧪 TESTING CALL IMPORT');
  console.log('=====================');
  
  try {
    // Test creating a person
    const testPerson = await prisma.people.create({
      data: {
        id: 'test_person_123',
        firstName: 'Test',
        lastName: 'Person',
        fullName: 'Test Person',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Person created:', testPerson.fullName);
    
    // Test creating an action
    const testAction = await prisma.actions.create({
      data: {
        id: 'test_action_123',
        type: 'call',
        subject: 'Test Call',
        description: 'Test call description',
        status: 'completed',
        dueDate: new Date(),
        completedAt: new Date(),
        personId: testPerson.id,
        userId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        workspaceId: '01K1VBYV8ETM2RCQA4GNN9EG72',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log('✅ Action created:', testAction.subject);
    
    // Clean up test data
    await prisma.actions.delete({ where: { id: 'test_action_123' } });
    await prisma.people.delete({ where: { id: 'test_person_123' } });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testCallImport();
