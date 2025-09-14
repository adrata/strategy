const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSarahJohnson() {
  try {
    console.log('🔍 Creating Sarah Johnson with ULID: 01HZ8K9M2N3P4Q5R6S7T8U9V0W...');
    
    // Use the exact ULID from the URL
    const sarahJohnsonId = '01HZ8K9M2N3P4Q5R6S7T8U9V0W';
    
    // Check if person already exists
    const existingPerson = await prisma.people.findFirst({
      where: {
        OR: [
          { id: sarahJohnsonId },
          { fullName: 'Sarah Johnson' },
          { workEmail: 'sarah.johnson@adp.com' }
        ]
      }
    });
    
    if (existingPerson) {
      console.log('⚠️ Sarah Johnson already exists:', existingPerson.id);
      if (existingPerson.id !== sarahJohnsonId) {
        console.log('🔄 Updating existing record to use the correct ULID...');
        // Update the existing record to use the correct ULID
        const updatedPerson = await prisma.people.update({
          where: { id: existingPerson.id },
          data: { id: sarahJohnsonId }
        });
        console.log('✅ Updated Sarah Johnson with new ULID:', updatedPerson.id);
      }
      return;
    }
    
    // Create Sarah Johnson record
    const newPerson = await prisma.people.create({
      data: {
        id: sarahJohnsonId,
        fullName: 'Sarah Johnson',
        firstName: 'Sarah',
        lastName: 'Johnson',
        workEmail: 'sarah.johnson@adp.com',
        jobTitle: 'VP of Human Resources',
        company: 'ADP',
        department: 'Human Resources',
        workspaceId: 'zeropoint-demo-2025',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully created Sarah Johnson:', {
      id: newPerson.id,
      fullName: newPerson.fullName,
      email: newPerson.workEmail,
      title: newPerson.jobTitle
    });
    
    console.log('🔗 URL: http://localhost:3000/demo/zeropoint/pipeline/people/sarah-johnson-' + sarahJohnsonId);
    
  } catch (error) {
    console.error('❌ Error creating Sarah Johnson:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSarahJohnson();
