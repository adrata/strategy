#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixFeatures() {
  try {
    console.log('🚀 Adding METRICS and CHRONICLE to workspaces...\n');

    // Get all workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true, enabledFeatures: true }
    });

    console.log('Current workspaces:');
    workspaces.forEach(w => {
      console.log(`  - ${w.name} (${w.slug}): ${w.enabledFeatures?.join(', ') || 'none'}`);
    });

    // Add METRICS and CHRONICLE to all workspaces that have the other features
    const allFeatures = ['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE'];
    
    for (const workspace of workspaces) {
      if (workspace.enabledFeatures && workspace.enabledFeatures.length > 0) {
        const updated = await prisma.workspaces.update({
          where: { id: workspace.id },
          data: { 
            enabledFeatures: allFeatures,
            updatedAt: new Date()
          }
        });
        console.log(`✅ Updated ${workspace.name}: ${updated.enabledFeatures.join(', ')}`);
      }
    }

    console.log('\n✅ All workspaces updated with METRICS and CHRONICLE!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixFeatures();
