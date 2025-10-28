#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupFeatures() {
  try {
    console.log('🚀 Setting up workspace features...\n');

    // Find workspaces
    const workspaces = await prisma.workspaces.findMany({
      select: { id: true, name: true, slug: true, enabledFeatures: true }
    });

    console.log('Found workspaces:');
    workspaces.forEach(w => {
      console.log(`  - ${w.name} (${w.slug}): ${w.enabledFeatures?.join(', ') || 'none'}`);
    });

    // Find Adrata workspace
    const adrataWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('adrata') || w.slug.toLowerCase().includes('adrata')
    );

    if (!adratraWorkspace) {
      console.log('❌ Adrata workspace not found');
      return;
    }

    console.log(`\n✅ Found Adrata workspace: ${adratraWorkspace.name}`);

    // Enable all features for Adrata
    const allFeatures = ['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE'];
    
    const updated = await prisma.workspaces.update({
      where: { id: adrataWorkspace.id },
      data: { 
        enabledFeatures: allFeatures,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Updated Adrata features: ${updated.enabledFeatures.join(', ')}`);

    // Find Notary Everyday workspace
    const notaryWorkspace = workspaces.find(w => 
      w.name.toLowerCase().includes('notary') || w.slug.toLowerCase().includes('notary')
    );

    if (notaryWorkspace) {
      const updatedNotary = await prisma.workspaces.update({
        where: { id: notaryWorkspace.id },
        data: { 
          enabledFeatures: allFeatures,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Updated Notary features: ${updatedNotary.enabledFeatures.join(', ')}`);
    }

    console.log('\n✅ Setup completed!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupFeatures();
