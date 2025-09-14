const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldTopsWorkspace() {
  try {
    console.log('🗑️ DELETING OLD TOPS WORKSPACE...\n');
    
    const oldTopsWorkspaceId = '01K1VBYV8ETM2RCQA4GNN9EG72'; // Currently shared with Dano
    
    console.log('📋 WORKSPACE IDENTIFICATION:');
    console.log(`   Old TOPS (shared): ${oldTopsWorkspaceId}`);
    console.log(`   New TOPS (isolated): 01K1VBYV8ETM2RCQA4GNN9EG75`);
    console.log(`   Dano (should keep): ${oldTopsWorkspaceId}\n`);
    
    // First, let's check what's in the old workspace
    const oldWorkspace = await prisma.workspaces.findUnique({
      where: { id: oldTopsWorkspaceId }
    });
    
    if (!oldWorkspace) {
      console.log('   ❌ Old workspace not found');
      return;
    }
    
    console.log(`   📝 Found workspace: ${oldWorkspace.name}`);
    
    // Check if this is actually Dano's workspace (not TOPS)
    if (oldWorkspace.name.includes('Retail') || oldWorkspace.name.includes('Dano')) {
      console.log('   ✅ This is Dano\'s Retail workspace - we should NOT delete it');
      console.log('   💡 Instead, we need to clean up any TOPS data that might be mixed in');
      
      // Let's check what TOPS-related data might be in Dano's workspace
      const topsContactsInDano = await prisma.contacts.findMany({
        where: {
          workspaceId: oldTopsWorkspaceId,
          OR: [
            { source: { contains: 'TOPS' } },
            { source: { contains: 'Capsule' } },
            { source: { contains: 'Conference' } },
            { source: { contains: 'Mailer' } }
          ]
        }
      });
      
      console.log(`   📋 Found ${topsContactsInDano.length} TOPS contacts in Dano's workspace`);
      
      if (topsContactsInDano.length > 0) {
        console.log('   🚨 These should be moved to the new TOPS workspace or deleted');
        console.log('   💡 Since we\'re importing fresh CSV data, we can delete these');
        
        // Delete TOPS contacts from Dano's workspace
        for (const contact of topsContactsInDano) {
          await prisma.contacts.delete({
            where: { id: contact.id }
          });
        }
        console.log(`   ✅ Deleted ${topsContactsInDano.length} TOPS contacts from Dano's workspace`);
      }
      
      console.log('\n🎉 Cleanup completed! Dano\'s workspace is now clean of TOPS data.');
      
    } else {
      console.log('   ❓ This workspace name doesn\'t match expected patterns');
      console.log('   💡 Proceeding with caution...');
    }
    
  } catch (error) {
    console.error('❌ Error cleaning up old workspace:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldTopsWorkspace();
