const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkWorkspaceIds() {
  try {
    console.log('🏢 CURRENT WORKSPACE IDs AND FORMAT:\n');
    
    const workspaces = await prisma.workspaces.findMany();
    
    workspaces.forEach(workspace => {
      console.log(`   • ID: ${workspace.id} (${workspace.id.length} chars)`);
      console.log(`     Name: ${workspace.name}`);
      console.log(`     Slug: ${workspace.slug}`);
      console.log(`     Created: ${workspace.createdAt}`);
      console.log('');
    });
    
    // Check for Demo workspace
    const demoWorkspace = workspaces.find(w => w.name.toLowerCase().includes('demo'));
    if (demoWorkspace) {
      console.log('🎯 DEMO WORKSPACE FOUND:');
      console.log(`   • ID: ${demoWorkspace.id}`);
      console.log(`   • Name: ${demoWorkspace.name}`);
      console.log(`   • Slug: ${demoWorkspace.slug}`);
    } else {
      console.log('❌ NO DEMO WORKSPACE FOUND');
    }
    
    console.log('');
    console.log('📋 WORKSPACE ID PATTERN ANALYSIS:');
    console.log(`   • Total workspaces: ${workspaces.length}`);
    console.log(`   • ID length range: ${Math.min(...workspaces.map(w => w.id.length))} - ${Math.max(...workspaces.map(w => w.id.length))} characters`);
    
    // Check for duplicate IDs or similar patterns
    const idPatterns = workspaces.map(w => w.id.substring(0, 4));
    const uniquePatterns = new Set(idPatterns);
    console.log(`   • ID prefix patterns: ${Array.from(uniquePatterns).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkWorkspaceIds();
}

module.exports = { checkWorkspaceIds };
