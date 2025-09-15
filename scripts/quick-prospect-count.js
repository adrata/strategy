#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function quickProspectCount() {
  try {
    console.log('🔍 Quick Prospect Count Check\n');
    
    // Two possible Notary Everyday workspace IDs
    const workspaceIds = [
      '01K1VBYmf75hgmvmz06psnc9ug', // From some scripts
      'cmezxb1ez0001pc94yry3ntjk'   // From other scripts
    ];
    
    for (const workspaceId of workspaceIds) {
      console.log(`Checking workspace: ${workspaceId}`);
      
      // Get workspace info
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true, slug: true }
      });
      
      if (workspace) {
        console.log(`  Workspace: ${workspace.name} (${workspace.slug})`);
        
        // Count prospects
        const prospectCount = await prisma.prospect.count({
          where: { workspaceId, deletedAt: null }
        });
        
        console.log(`  Prospects: ${prospectCount}`);
        
        if (workspace.name?.includes('Notary')) {
          console.log(`  🎯 This is the Notary Everyday workspace!`);
          console.log(`  Expected: 394, Actual: ${prospectCount}`);
          console.log(`  Difference: ${prospectCount - 394}`);
        }
      } else {
        console.log(`  ❌ Workspace not found`);
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

quickProspectCount();
