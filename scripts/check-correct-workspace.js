const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCorrectWorkspace() {
  try {
    console.log('🔍 CHECKING CORRECT WORKSPACE');
    console.log('============================');

    // Check the workspace that the working script uses
    const correctWorkspace = '01K5D01YCQJ9TJ7CT4DZDE79T1';
    
    const total = await prisma.companies.count({
      where: { workspaceId: correctWorkspace }
    });

    const enriched = await prisma.companies.count({
      where: { 
        workspaceId: correctWorkspace,
        customFields: { not: null }
      }
    });

    const coresignal = await prisma.companies.count({
      where: {
        workspaceId: correctWorkspace,
        customFields: {
          path: ['coresignalData'],
          not: null
        }
      }
    });

    console.log('📊 CORRECT WORKSPACE PROGRESS:');
    console.log('=============================');
    console.log(`Workspace ID: ${correctWorkspace}`);
    console.log(`Total companies: ${total}`);
    console.log(`Enriched companies: ${enriched}`);
    console.log(`CoreSignal data: ${coresignal}`);
    console.log(`Remaining: ${total - enriched}`);
    console.log(`Progress: ${Math.round((enriched/total)*100)}%`);
    
    // Calculate batches run
    const batchesRun = Math.ceil(enriched / 50);
    console.log(`\n🔄 BATCHES RUN: ${batchesRun}`);
    
    if (enriched < total) {
      const remainingBatches = Math.ceil((total - enriched) / 50);
      console.log(`\n🚀 STATUS: Still processing...`);
      console.log(`⏳ ${remainingBatches} batches remaining (${total - enriched} companies)`);
    } else {
      console.log(`\n🎉 COMPLETE: All companies enriched!`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCorrectWorkspace();
