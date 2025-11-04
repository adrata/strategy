#!/usr/bin/env node

/**
 * 🔧 REMOVE WORKSPACE_ADMIN ROLE FROM RYAN AND NOEL
 * 
 * Removes WORKSPACE_ADMIN RBAC role from Ryan and Noel, keeping only Seller and Leader roles
 * so they can switch between Seller Mode and Leader Mode.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeWorkspaceAdmin() {
  try {
    console.log('🔧 Removing WORKSPACE_ADMIN role from Ryan and Noel...\n');
    
    // Find Notary Everyday workspace
    const workspace = await prisma.workspaces.findFirst({
      where: {
        OR: [
          { name: { contains: 'Notary Everyday', mode: 'insensitive' } },
          { name: { contains: 'NotaryEveryday', mode: 'insensitive' } },
          { slug: { contains: 'notary-everyday', mode: 'insensitive' } }
        ]
      }
    });

    if (!workspace) {
      console.log('❌ Notary Everyday workspace not found!');
      return;
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.id})\n`);

    // Find Ryan and Noel users
    const ryan = await prisma.users.findFirst({
      where: {
        OR: [
          { email: 'ryan@notaryeveryday.com' },
          { email: 'ryan@notary-everyday.com' }
        ]
      }
    });

    const noel = await prisma.users.findFirst({
      where: {
        email: 'noel@notaryeveryday.com'
      }
    });

    if (!ryan || !noel) {
      console.log('❌ Users not found!');
      return;
    }

    console.log(`✅ Found users:`);
    console.log(`   Ryan: ${ryan.name} (${ryan.id})`);
    console.log(`   Noel: ${noel.name} (${noel.id})\n`);

    // Find WORKSPACE_ADMIN role
    const workspaceAdminRole = await prisma.roles.findFirst({
      where: {
        name: 'WORKSPACE_ADMIN'
      }
    });

    if (!workspaceAdminRole) {
      console.log('❌ WORKSPACE_ADMIN role not found in RBAC system!');
      return;
    }

    console.log(`✅ Found WORKSPACE_ADMIN role (${workspaceAdminRole.id})\n`);

    // Remove WORKSPACE_ADMIN role from Ryan
    console.log('📋 Removing WORKSPACE_ADMIN role from Ryan...');
    const ryanWorkspaceAdmin = await prisma.user_roles.findFirst({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id,
        roleId: workspaceAdminRole.id,
        isActive: true
      }
    });

    if (ryanWorkspaceAdmin) {
      // Deactivate instead of delete to preserve history
      await prisma.user_roles.update({
        where: { id: ryanWorkspaceAdmin.id },
        data: { isActive: false }
      });
      console.log(`   ✅ Deactivated WORKSPACE_ADMIN role for Ryan`);
    } else {
      console.log(`   ℹ️  Ryan doesn't have active WORKSPACE_ADMIN role`);
    }

    // Remove WORKSPACE_ADMIN role from Noel
    console.log('\n📋 Removing WORKSPACE_ADMIN role from Noel...');
    const noelWorkspaceAdmin = await prisma.user_roles.findFirst({
      where: {
        userId: noel.id,
        workspaceId: workspace.id,
        roleId: workspaceAdminRole.id,
        isActive: true
      }
    });

    if (noelWorkspaceAdmin) {
      // Deactivate instead of delete to preserve history
      await prisma.user_roles.update({
        where: { id: noelWorkspaceAdmin.id },
        data: { isActive: false }
      });
      console.log(`   ✅ Deactivated WORKSPACE_ADMIN role for Noel`);
    } else {
      console.log(`   ℹ️  Noel doesn't have active WORKSPACE_ADMIN role`);
    }

    // Verify results
    console.log('\n📋 Verifying results...');
    
    const ryanRoles = await prisma.user_roles.findMany({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        role: true
      }
    });

    const noelRoles = await prisma.user_roles.findMany({
      where: {
        userId: noel.id,
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        role: true
      }
    });

    console.log(`\n   Ryan's active roles: ${ryanRoles.map(ur => ur.role.name).join(', ')}`);
    console.log(`   Noel's active roles: ${noelRoles.map(ur => ur.role.name).join(', ')}`);

    const ryanHasSeller = ryanRoles.some(ur => ur.role.name === 'Seller');
    const ryanHasLeader = ryanRoles.some(ur => ur.role.name === 'Leader');
    const noelHasSeller = noelRoles.some(ur => ur.role.name === 'Seller');
    const noelHasLeader = noelRoles.some(ur => ur.role.name === 'Leader');

    console.log(`\n✅ Removal Complete!`);
    console.log(`   Ryan: ${ryanHasSeller && ryanHasLeader ? '✅ Has Seller & Leader' : '❌ Missing roles'}`);
    console.log(`   Noel: ${noelHasSeller && noelHasLeader ? '✅ Has Seller & Leader' : '❌ Missing roles'}`);

    // Note: They still have WORKSPACE_ADMIN in workspace_users table (workspace-level role)
    // This is separate from RBAC roles and may be needed for workspace management
    console.log(`\nℹ️  Note: Users still have WORKSPACE_ADMIN in workspace_users table`);
    console.log(`   This is a workspace-level role, separate from RBAC roles.`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeWorkspaceAdmin();

