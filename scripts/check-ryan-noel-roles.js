#!/usr/bin/env node

/**
 * 🔍 CHECK RYAN AND NOEL'S ROLES AND DATA ACCESS
 * 
 * Checks if Ryan and Noel have multiple roles (Seller and Leader) in the RBAC system
 * and what data access they would have with each role.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRyanNoelRoles() {
  try {
    console.log('🔍 Checking Ryan and Noel\'s roles and data access...\n');
    
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

    if (!ryan) {
      console.log('❌ Ryan user not found!');
      return;
    }

    if (!noel) {
      console.log('❌ Noel user not found!');
      return;
    }

    console.log(`✅ Found users:`);
    console.log(`   Ryan: ${ryan.name} (${ryan.email}) - ${ryan.id}`);
    console.log(`   Noel: ${noel.name} (${noel.email}) - ${noel.id}\n`);

    // Check workspace_users roles (workspace-level roles)
    console.log('📋 Workspace-Level Roles (workspace_users table):');
    console.log('='.repeat(60));
    
    const ryanMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id
      }
    });

    const noelMembership = await prisma.workspace_users.findFirst({
      where: {
        userId: noel.id,
        workspaceId: workspace.id
      }
    });

    if (ryanMembership) {
      console.log(`   Ryan: ${ryanMembership.role}`);
    } else {
      console.log(`   Ryan: No workspace membership found`);
    }

    if (noelMembership) {
      console.log(`   Noel: ${noelMembership.role}`);
    } else {
      console.log(`   Noel: No workspace membership found`);
    }

    // Check RBAC roles (user_roles table)
    console.log('\n📋 RBAC Roles (user_roles table):');
    console.log('='.repeat(60));

    const ryanRoles = await prisma.user_roles.findMany({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    const noelRoles = await prisma.user_roles.findMany({
      where: {
        userId: noel.id,
        workspaceId: workspace.id,
        isActive: true
      },
      include: {
        role: {
          include: {
            role_permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    console.log(`\n   Ryan's RBAC Roles (${ryanRoles.length}):`);
    if (ryanRoles.length === 0) {
      console.log('      ❌ No RBAC roles found');
    } else {
      ryanRoles.forEach(ur => {
        console.log(`      ✅ ${ur.role.name} (${ur.role.id})`);
        console.log(`         Permissions: ${ur.role.role_permissions.map(rp => rp.permission.name).join(', ')}`);
      });
    }

    console.log(`\n   Noel's RBAC Roles (${noelRoles.length}):`);
    if (noelRoles.length === 0) {
      console.log('      ❌ No RBAC roles found');
    } else {
      noelRoles.forEach(ur => {
        console.log(`      ✅ ${ur.role.name} (${ur.role.id})`);
        console.log(`         Permissions: ${ur.role.role_permissions.map(rp => rp.permission.name).join(', ')}`);
      });
    }

    // Check if they have Seller and Leader roles
    console.log('\n🔍 Role Switching Analysis:');
    console.log('='.repeat(60));

    const ryanHasSeller = ryanRoles.some(ur => 
      ur.role.name.toLowerCase().includes('seller') || 
      ur.role.name.toLowerCase() === 'seller'
    );
    const ryanHasLeader = ryanRoles.some(ur => 
      ur.role.name.toLowerCase().includes('leader') || 
      ur.role.name.toLowerCase() === 'leader'
    );

    const noelHasSeller = noelRoles.some(ur => 
      ur.role.name.toLowerCase().includes('seller') || 
      ur.role.name.toLowerCase() === 'seller'
    );
    const noelHasLeader = noelRoles.some(ur => 
      ur.role.name.toLowerCase().includes('leader') || 
      ur.role.name.toLowerCase() === 'leader'
    );

    console.log(`\n   Ryan:`);
    console.log(`      Seller Role: ${ryanHasSeller ? '✅ Yes' : '❌ No'}`);
    console.log(`      Leader Role: ${ryanHasLeader ? '✅ Yes' : '❌ No'}`);
    console.log(`      Can Switch Roles: ${ryanHasSeller && ryanHasLeader ? '✅ Yes' : '❌ No'}`);

    console.log(`\n   Noel:`);
    console.log(`      Seller Role: ${noelHasSeller ? '✅ Yes' : '❌ No'}`);
    console.log(`      Leader Role: ${noelHasLeader ? '✅ Yes' : '❌ No'}`);
    console.log(`      Can Switch Roles: ${noelHasSeller && noelHasLeader ? '✅ Yes' : '❌ No'}`);

    // Check what roles exist in the system
    console.log('\n📋 Available Roles in System:');
    console.log('='.repeat(60));
    
    const allRoles = await prisma.roles.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    console.log(`\n   Found ${allRoles.length} active roles:`);
    allRoles.forEach(role => {
      console.log(`      - ${role.name}${role.description ? `: ${role.description}` : ''}`);
    });

    // Check data access for each role
    console.log('\n📊 Data Access Analysis:');
    console.log('='.repeat(60));

    if (ryanHasSeller && ryanHasLeader) {
      console.log(`\n   Ryan would see:`);
      console.log(`      Seller Mode: Only assigned companies/leads`);
      console.log(`      Leader Mode: All companies/leads in workspace`);
    }

    if (noelHasSeller && noelHasLeader) {
      console.log(`\n   Noel would see:`);
      console.log(`      Seller Mode: Only assigned companies/leads`);
      console.log(`      Leader Mode: All companies/leads in workspace`);
    }

    // Summary
    console.log('\n📋 Summary:');
    console.log('='.repeat(60));
    console.log(`   Ryan: ${ryanRoles.length} RBAC role(s), ${ryanHasSeller && ryanHasLeader ? '✅ Can switch roles' : '❌ Cannot switch roles'}`);
    console.log(`   Noel: ${noelRoles.length} RBAC role(s), ${noelHasSeller && noelHasLeader ? '✅ Can switch roles' : '❌ Cannot switch roles'}`);

    if (!ryanHasSeller || !ryanHasLeader || !noelHasSeller || !noelHasLeader) {
      console.log('\n⚠️  Action Required:');
      console.log('   Users need both "Seller" and "Leader" roles in the user_roles table');
      console.log('   to enable role switching functionality.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRyanNoelRoles();

