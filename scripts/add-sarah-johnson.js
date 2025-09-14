const { PrismaClient } = require('@prisma/client');
const { ulid } = require('ulid');

const prisma = new PrismaClient();

async function addSarahJohnson() {
  try {
    console.log('🔍 Adding Sarah Johnson with proper ULID...');
    
    // Generate a proper ULID
    const sarahJohnsonId = '01K4VM894JE1BWD2TA3FZCNKCK'; // Use the generated ULID
    
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
        title: 'VP of Human Resources',
        company: 'ADP',
        companyName: 'ADP',
        department: 'Human Resources',
        workspaceId: 'zeropoint-demo-2025',
        demoScenarioId: 'zeropoint-vp-sales-2025',
        isDemoData: true,
        zohoId: 'zoho_contact_sarah_johnson_adp_2025',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Successfully created Sarah Johnson:', {
      id: newPerson.id,
      fullName: newPerson.fullName,
      email: newPerson.workEmail,
      title: newPerson.title
    });
    
    console.log('🔗 URL: http://localhost:3000/demo/zeropoint/pipeline/people/sarah-johnson-' + sarahJohnsonId);
    
  } catch (error) {
    console.error('❌ Error adding Sarah Johnson:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSarahJohnson();
