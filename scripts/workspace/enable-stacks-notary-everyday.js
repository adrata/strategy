#!/usr/bin/env node

/**
 * Enable Stacks for Notary Everyday Workspace
 * 
 * This script finds the Notary Everyday workspace and enables Stacks access
 * for it by adding 'STACKS' to the enabledFeatures array.
 * 
 * Usage: node scripts/workspace/enable-stacks-notary-everyday.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

async function enableStacksForNotaryEveryday() {
  try {
    console.log('🔍 Finding Notary Everyday workspace...');
    
    // Find the Notary Everyday workspace by various possible identifiers
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } },
          { slug: { contains: 'ne', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found. Available workspaces:');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true, enabledFeatures: true }
      });
      console.table(allWorkspaces);
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})`);
    console.log(`📋 Current enabled features: ${workspace.enabledFeatures?.join(', ') || 'None'}`);

    // Check if Stacks is already enabled
    if (workspace.enabledFeatures?.includes('STACKS')) {
      console.log('✅ Stacks is already enabled for this workspace');
      return;
    }

    // Add STACKS to enabledFeatures array
    const updatedFeatures = [...(workspace.enabledFeatures || []), 'STACKS'];
    
    const updatedWorkspace = await prisma.workspaces.update({
      where: { id: workspace.id },
      data: { 
        enabledFeatures: updatedFeatures,
        updatedAt: new Date()
      }
    });

    console.log('✅ Successfully enabled Stacks for Notary Everyday workspace!');
    console.log(`📋 Updated enabled features: ${updatedWorkspace.enabledFeatures.join(', ')}`);

    // Check if we need to assign permissions to users
    console.log('\n🔍 Checking user permissions...');
    
    // Find users in this workspace
    const workspaceUsers = await prisma.user_roles.findMany({
      where: {
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        user: {
          select: { id: true, email: true, name: true }
        },
        role: {
          select: { id: true, name: true }
        }
      }
    });

    console.log(`👥 Found ${workspaceUsers.length} active users in workspace`);

    // Get the STACKS_ACCESS permission
    const stacksPermission = await prisma.permissions.findFirst({
      where: { name: 'STACKS_ACCESS' }
    });

    if (!stacksPermission) {
      console.log('⚠️  STACKS_ACCESS permission not found. Creating it...');
      
      const newPermission = await prisma.permissions.create({
        data: {
          name: 'STACKS_ACCESS',
          description: 'Access to Stacks project management',
          resource: 'stacks',
          action: 'access',
          isActive: true
        }
      });
      
      console.log(`✅ Created STACKS_ACCESS permission: ${newPermission.id}`);
    }

    // Check if any roles have the STACKS_ACCESS permission
    const rolesWithStacksAccess = await prisma.role_permissions.findMany({
      where: {
        permission: { name: 'STACKS_ACCESS' }
      },
      include: {
        role: { select: { id: true, name: true } }
      }
    });

    console.log(`🔐 Roles with STACKS_ACCESS: ${rolesWithStacksAccess.map(r => r.role.name).join(', ')}`);

    if (rolesWithStacksAccess.length === 0) {
      console.log('⚠️  No roles have STACKS_ACCESS permission. Users may not be able to access Stacks.');
      console.log('💡 Consider assigning STACKS_ACCESS permission to appropriate roles.');
    }

    // Show summary
    console.log('\n📊 Summary:');
    console.log(`   Workspace: ${updatedWorkspace.name}`);
    console.log(`   Features: ${updatedWorkspace.enabledFeatures.join(', ')}`);
    console.log(`   Users: ${workspaceUsers.length}`);
    console.log(`   Roles with access: ${rolesWithStacksAccess.length}`);

  } catch (error) {
    console.error('❌ Error enabling Stacks for Notary Everyday:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enableStacksForNotaryEveryday();
