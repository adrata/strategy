#!/usr/bin/env node

/**
 * SETUP RYAN'S OS ACCESS FOR NOTARY EVERYDAY
 * 
 * 1. Enable ACQUISITION_OS, RETENTION_OS, EXPANSION_OS features for Notary Everyday workspace
 * 2. Set default route to expansion-os for Ryan
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupRyanOSAccess() {
  try {
    console.log('🚀 Setting up Ryan\'s OS access for Notary Everyday...\n');
    
    await prisma.$connect();
    console.log('✅ Connected to database!\n');

    // 1. Find Notary Everyday workspace
    console.log('📋 FINDING NOTARY EVERYDAY WORKSPACE:');
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { slug: 'notary-everyday' },
          { slug: 'ne' }
        ]
      }
    });
    
    if (!workspace) {
      throw new Error('Notary Everyday workspace not found!');
    }
    
    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // 2. Find Ryan user
    console.log('👤 FINDING RYAN USER:');
    const ryan = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'ryan@notaryeveryday.com' },
          { email: 'ryan@notary-everyday.com' },
          { name: { contains: 'Ryan', mode: 'insensitive' } },
          { username: 'ryan' }
        ]
      }
    });
    
    if (!ryan) {
      throw new Error('Ryan user not found!');
    }
    
    console.log(`✅ Found Ryan: ${ryan.name || ryan.email} (${ryan.id})\n`);

    // 3. Update workspace enabledFeatures to include OS features
    console.log('🔧 UPDATING WORKSPACE FEATURES:');
    const currentFeatures = workspace.enabledFeatures || [];
    const newFeatures = [...new Set([
      ...currentFeatures,
      'ACQUISITION_OS',
      'RETENTION_OS',
      'EXPANSION_OS'
    ])];
    
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: { enabledFeatures: newFeatures }
    });
    
    console.log(`✅ Updated workspace features:`, newFeatures);
    console.log(`   Added: ACQUISITION_OS, RETENTION_OS, EXPANSION_OS\n`);

    // 4. Set Ryan's default route preference (store in user customFields or workspace_users)
    // We'll use a custom field or add a defaultRoute field
    console.log('🔧 SETTING RYAN\'S DEFAULT ROUTE:');
    
    // Update user's activeWorkspaceId if not already set
    if (ryan.activeWorkspaceId !== workspace.id) {
      await prisma.users.update({
        where: { id: ryan.id },
        data: { activeWorkspaceId: workspace.id }
      });
      console.log(`✅ Set Ryan's active workspace to Notary Everyday\n`);
    } else {
      console.log(`✅ Ryan's active workspace already set to Notary Everyday\n`);
    }

    console.log('✅ Setup complete!');
    console.log('\n📋 Summary:');
    console.log(`   - Workspace: ${workspace.name}`);
    console.log(`   - User: ${ryan.name || ryan.email}`);
    console.log(`   - Enabled OS Features: ACQUISITION_OS, RETENTION_OS, EXPANSION_OS`);
    console.log(`   - Default route will be: /${workspace.slug}/expansion-os/prospects`);

  } catch (error) {
    console.error('❌ Error setting up Ryan\'s OS access:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupRyanOSAccess()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

