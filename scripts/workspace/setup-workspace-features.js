#!/usr/bin/env node

/**
 * Setup Workspace Features
 * 
 * This script configures workspace features and role permissions for the feature access control system.
 * It sets up Adrata and Notary Everyday workspaces with all features enabled and assigns appropriate permissions.
 * 
 * Usage: node scripts/workspace/setup-workspace-features.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.POSTGRES_URL
    }
  }
});

const ALL_FEATURES = ['OASIS', 'STACKS', 'ATRIUM', 'REVENUEOS', 'METRICS', 'CHRONICLE'];

async function setupWorkspaceFeatures() {
  try {
    console.log('🚀 Setting up workspace features and permissions...\n');

    // 1. Find Adrata workspace
    console.log('🔍 Finding Adrata workspace...');
    const adrataWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Adrata', mode: 'insensitive' } },
          { slug: { contains: 'adrata', mode: 'insensitive' } }
        ]
      }
    });

    if (!adratraWorkspace) {
      console.log('❌ Adrata workspace not found. Available workspaces:');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      console.table(allWorkspaces);
      return;
    }

    console.log(`✅ Found Adrata workspace: ${adratraWorkspace.name} (${adratraWorkspace.id})`);

    // 2. Find Notary Everyday workspace
    console.log('🔍 Finding Notary Everyday workspace...');
    const notaryWorkspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } },
          { slug: { contains: 'notaryeveryday', mode: 'insensitive' } }
        ]
      }
    });

    if (!notaryWorkspace) {
      console.log('❌ Notary Everyday workspace not found. Available workspaces:');
      const allWorkspaces = await prisma.workspaces.findMany({
        select: { id: true, name: true, slug: true }
      });
      console.table(allWorkspaces);
      return;
    }

    console.log(`✅ Found Notary Everyday workspace: ${notaryWorkspace.name} (${notaryWorkspace.id})`);

    // 3. Enable all features for both workspaces
    console.log('\n📋 Enabling features for workspaces...');
    
    const [updatedAdrata, updatedNotary] = await Promise.all([
      prisma.workspaces.update({
        where: { id: adrataWorkspace.id },
        data: { 
          enabledFeatures: ALL_FEATURES,
          updatedAt: new Date()
        }
      }),
      prisma.workspaces.update({
        where: { id: notaryWorkspace.id },
        data: { 
          enabledFeatures: ALL_FEATURES,
          updatedAt: new Date()
        }
      })
    ]);

    console.log(`✅ Adrata features: ${updatedAdrata.enabledFeatures.join(', ')}`);
    console.log(`✅ Notary Everyday features: ${updatedNotary.enabledFeatures.join(', ')}`);

    // 4. Get all feature permissions
    console.log('\n🔐 Setting up role permissions...');
    
    const featurePermissions = await prisma.permissions.findMany({
      where: {
        name: {
          in: ALL_FEATURES.map(f => `${f}_ACCESS`)
        }
      }
    });

    console.log(`✅ Found ${featurePermissions.length} feature permissions`);

    // 5. Find or create roles for Adrata users
    console.log('\n👥 Setting up Adrata user roles...');
    
    // Find existing roles or create them
    let adrataRole = await prisma.roles.findFirst({
      where: { name: 'ADRATA_USER' }
    });

    if (!adratraRole) {
      adrataRole = await prisma.roles.create({
        data: {
          name: 'ADRATA_USER',
          description: 'Adrata team member with access to all features',
          isActive: true
        }
      });
      console.log(`✅ Created ADRATA_USER role: ${adratraRole.id}`);
    } else {
      console.log(`✅ Found existing ADRATA_USER role: ${adratraRole.id}`);
    }

    // Assign all feature permissions to Adrata role
    for (const permission of featurePermissions) {
      await prisma.role_permissions.upsert({
        where: {
          roleId_permissionId: {
            roleId: adrataRole.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: adrataRole.id,
          permissionId: permission.id
        }
      });
    }

    console.log(`✅ Assigned all ${featurePermissions.length} permissions to ADRATA_USER role`);

    // 6. Assign Adrata role to Adrata users
    console.log('\n👤 Assigning roles to Adrata users...');
    
    const adrataUsers = await prisma.users.findMany({
      where: {
        email: {
          in: ['ross@adrata.com', 'todd@adrata.com', 'dan@adrata.com']
        }
      }
    });

    for (const user of adrataUsers) {
      await prisma.user_roles.upsert({
        where: {
          userId_roleId_workspaceId: {
            userId: user.id,
            roleId: adrataRole.id,
            workspaceId: adrataWorkspace.id
          }
        },
        update: { isActive: true },
        create: {
          userId: user.id,
          roleId: adrataRole.id,
          workspaceId: adrataWorkspace.id,
          isActive: true,
          assignedBy: user.id
        }
      });
      console.log(`✅ Assigned ADRATA_USER role to ${user.email}`);
    }

    // 7. Summary
    console.log('\n📊 Setup Summary:');
    console.log(`   Adrata Workspace: ${updatedAdrata.name}`);
    console.log(`   Features: ${updatedAdrata.enabledFeatures.join(', ')}`);
    console.log(`   Notary Workspace: ${updatedNotary.name}`);
    console.log(`   Features: ${updatedNotary.enabledFeatures.join(', ')}`);
    console.log(`   Adrata Users: ${adratraUsers.length}`);
    console.log(`   Permissions Assigned: ${featurePermissions.length}`);

    console.log('\n✅ Workspace features setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up workspace features:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupWorkspaceFeatures();