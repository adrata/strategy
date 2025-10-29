const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restoreWinningVariantPeople() {
  try {
    console.log('🔧 Restoring people assigned to Winning Variant...');
    
    // Find the Adrata workspace
    const workspace = await prisma.workspaces.findFirst({
      where: { slug: 'adrata' },
      select: { id: true, name: true, slug: true }
    });
    
    if (!workspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }
    
    console.log('📋 Workspace:', workspace);
    
    // Find Dan Mirolli
    const dan = await prisma.users.findFirst({
      where: { 
        OR: [
          { name: { contains: 'mirolli', mode: 'insensitive' } },
          { email: { contains: 'mirolli', mode: 'insensitive' } }
        ]
      },
      select: { id: true, name: true, email: true }
    });
    
    if (!dan) {
      console.log('❌ Dan Mirolli not found');
      return;
    }
    
    console.log('👤 Dan Mirolli:', dan);
    
    // Find Winning Variant company
    const winningVariant = await prisma.companies.findFirst({
      where: { 
        name: { contains: 'winning variant', mode: 'insensitive' },
        workspaceId: workspace.id
      },
      select: { id: true, name: true, workspaceId: true, deletedAt: true }
    });
    
    if (!winningVariant) {
      console.log('❌ Winning Variant company not found');
      return;
    }
    
    console.log('🏢 Winning Variant:', winningVariant);
    
    // Find soft-deleted people assigned to Winning Variant
    const softDeletedPeople = await prisma.people.findMany({
      where: {
        companyId: winningVariant.id,
        workspaceId: workspace.id,
        deletedAt: { not: null }
      },
      select: {
        id: true,
        fullName: true,
        firstName: true,
        lastName: true,
        email: true,
        deletedAt: true,
        mainSellerId: true
      }
    });
    
    console.log(`\n🗑️ Found ${softDeletedPeople.length} soft-deleted people to restore:`);
    softDeletedPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email}) - deletedAt: ${person.deletedAt}`);
    });
    
    if (softDeletedPeople.length === 0) {
      console.log('✅ No soft-deleted people found to restore');
      return;
    }
    
    // Restore each person
    for (const person of softDeletedPeople) {
      try {
        const updatedPerson = await prisma.people.update({
          where: { id: person.id },
          data: {
            deletedAt: null, // Restore the person
            mainSellerId: dan.id, // Assign to Dan Mirolli
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Restored: ${updatedPerson.fullName} (${updatedPerson.email}) - assigned to Dan Mirolli`);
      } catch (error) {
        console.error(`❌ Failed to restore ${person.fullName}:`, error.message);
      }
    }
    
    // Verify the restoration
    console.log('\n🔍 Verification - checking restored people:');
    const restoredPeople = await prisma.people.findMany({
      where: {
        companyId: winningVariant.id,
        workspaceId: workspace.id,
        deletedAt: null // Only active people
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        mainSellerId: true,
        deletedAt: true
      }
    });
    
    console.log(`📊 Total active people at Winning Variant: ${restoredPeople.length}`);
    restoredPeople.forEach((person, index) => {
      console.log(`${index + 1}. ${person.fullName} (${person.email}) - mainSellerId: ${person.mainSellerId}`);
    });
    
    console.log('\n✅ Restoration complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreWinningVariantPeople();
