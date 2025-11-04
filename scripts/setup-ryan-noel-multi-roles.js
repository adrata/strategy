#!/usr/bin/env node

/**
 * 🔧 SETUP RYAN AND NOEL WITH MULTI-ROLE ACCESS
 * 
 * Creates "Seller" and "Leader" roles in the RBAC system and assigns both to Ryan and Noel
 * so they can switch between Seller Mode (assigned data only) and Leader Mode (all data).
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupMultiRoles() {
  try {
    console.log('🔧 Setting up multi-role access for Ryan and Noel...\n');
    
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

    // Step 1: Create or find Seller role
    console.log('📋 Step 1: Creating/finding Seller role...');
    let sellerRole = await prisma.roles.findFirst({
      where: {
        name: 'Seller'
      }
    });

    if (!sellerRole) {
      sellerRole = await prisma.roles.create({
        data: {
          name: 'Seller',
          description: 'Sales representative with access to assigned accounts and leads',
          isActive: true
        }
      });
      console.log(`   ✅ Created Seller role (${sellerRole.id})`);
    } else {
      console.log(`   ✅ Found existing Seller role (${sellerRole.id})`);
    }

    // Step 2: Create or find Leader role
    console.log('\n📋 Step 2: Creating/finding Leader role...');
    let leaderRole = await prisma.roles.findFirst({
      where: {
        name: 'Leader'
      }
    });

    if (!leaderRole) {
      leaderRole = await prisma.roles.create({
        data: {
          name: 'Leader',
          description: 'Leadership role with access to all companies and leads in workspace',
          isActive: true
        }
      });
      console.log(`   ✅ Created Leader role (${leaderRole.id})`);
    } else {
      console.log(`   ✅ Found existing Leader role (${leaderRole.id})`);
    }

    // Step 3: Get all permissions needed
    console.log('\n📋 Step 3: Assigning permissions to roles...');
    
    const allPermissions = await prisma.permissions.findMany({
      where: {
        isActive: true
      }
    });

    // Seller role gets standard feature access permissions
    const sellerPermissions = [
      'COMPANY_VIEW', 'COMPANY_CREATE', 'COMPANY_UPDATE',
      'PERSON_VIEW', 'PERSON_CREATE', 'PERSON_UPDATE',
      'ACTION_VIEW', 'ACTION_CREATE', 'ACTION_UPDATE',
      'OASIS_ACCESS', 'STACKS_ACCESS', 'WORKSHOP_ACCESS', 
      'REVENUEOS_ACCESS', 'METRICS_ACCESS', 'CHRONICLE_ACCESS'
    ];

    // Leader role gets all permissions
    const leaderPermissions = allPermissions.map(p => p.name);

    // Assign permissions to Seller role
    for (const permName of sellerPermissions) {
      const permission = allPermissions.find(p => p.name === permName);
      if (permission) {
        const existing = await prisma.role_permissions.findFirst({
          where: {
            roleId: sellerRole.id,
            permissionId: permission.id
          }
        });
        if (!existing) {
          await prisma.role_permissions.create({
            data: {
              roleId: sellerRole.id,
              permissionId: permission.id
            }
          });
        }
      }
    }
    console.log(`   ✅ Assigned ${sellerPermissions.length} permissions to Seller role`);

    // Assign permissions to Leader role
    for (const permission of allPermissions) {
      const existing = await prisma.role_permissions.findFirst({
        where: {
          roleId: leaderRole.id,
          permissionId: permission.id
        }
      });
      if (!existing) {
        await prisma.role_permissions.create({
          data: {
            roleId: leaderRole.id,
            permissionId: permission.id
          }
        });
      }
    }
    console.log(`   ✅ Assigned ${allPermissions.length} permissions to Leader role`);

    // Step 4: Assign roles to Ryan
    console.log('\n📋 Step 4: Assigning roles to Ryan...');
    
    // Check if Ryan already has Seller role
    let ryanSeller = await prisma.user_roles.findFirst({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id,
        roleId: sellerRole.id,
        isActive: true
      }
    });

    if (!ryanSeller) {
      ryanSeller = await prisma.user_roles.create({
        data: {
          userId: ryan.id,
          workspaceId: workspace.id,
          roleId: sellerRole.id,
          isActive: true
        }
      });
      console.log(`   ✅ Assigned Seller role to Ryan`);
    } else {
      console.log(`   ✅ Ryan already has Seller role`);
    }

    // Check if Ryan already has Leader role
    let ryanLeader = await prisma.user_roles.findFirst({
      where: {
        userId: ryan.id,
        workspaceId: workspace.id,
        roleId: leaderRole.id,
        isActive: true
      }
    });

    if (!ryanLeader) {
      ryanLeader = await prisma.user_roles.create({
        data: {
          userId: ryan.id,
          workspaceId: workspace.id,
          roleId: leaderRole.id,
          isActive: true
        }
      });
      console.log(`   ✅ Assigned Leader role to Ryan`);
    } else {
      console.log(`   ✅ Ryan already has Leader role`);
    }

    // Step 5: Assign roles to Noel
    console.log('\n📋 Step 5: Assigning roles to Noel...');
    
    // Check if Noel already has Seller role
    let noelSeller = await prisma.user_roles.findFirst({
      where: {
        userId: noel.id,
        workspaceId: workspace.id,
        roleId: sellerRole.id,
        isActive: true
      }
    });

    if (!noelSeller) {
      noelSeller = await prisma.user_roles.create({
        data: {
          userId: noel.id,
          workspaceId: workspace.id,
          roleId: sellerRole.id,
          isActive: true
        }
      });
      console.log(`   ✅ Assigned Seller role to Noel`);
    } else {
      console.log(`   ✅ Noel already has Seller role`);
    }

    // Check if Noel already has Leader role
    let noelLeader = await prisma.user_roles.findFirst({
      where: {
        userId: noel.id,
        workspaceId: workspace.id,
        roleId: leaderRole.id,
        isActive: true
      }
    });

    if (!noelLeader) {
      noelLeader = await prisma.user_roles.create({
        data: {
          userId: noel.id,
          workspaceId: workspace.id,
          roleId: leaderRole.id,
          isActive: true
        }
      });
      console.log(`   ✅ Assigned Leader role to Noel`);
    } else {
      console.log(`   ✅ Noel already has Leader role`);
    }

    // Step 6: Verify setup
    console.log('\n📋 Step 6: Verifying setup...');
    
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

    console.log(`\n   Ryan's roles: ${ryanRoles.map(ur => ur.role.name).join(', ')}`);
    console.log(`   Noel's roles: ${noelRoles.map(ur => ur.role.name).join(', ')}`);

    const ryanCanSwitch = ryanRoles.some(ur => ur.role.name === 'Seller') && 
                          ryanRoles.some(ur => ur.role.name === 'Leader');
    const noelCanSwitch = noelRoles.some(ur => ur.role.name === 'Seller') && 
                          noelRoles.some(ur => ur.role.name === 'Leader');

    console.log(`\n✅ Setup Complete!`);
    console.log(`   Ryan can switch roles: ${ryanCanSwitch ? '✅ Yes' : '❌ No'}`);
    console.log(`   Noel can switch roles: ${noelCanSwitch ? '✅ Yes' : '❌ No'}`);

    if (ryanCanSwitch && noelCanSwitch) {
      console.log(`\n🎉 Both users can now switch between Seller Mode and Leader Mode!`);
      console.log(`   - Seller Mode: See only assigned companies/leads`);
      console.log(`   - Leader Mode: See all companies/leads in workspace`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupMultiRoles();

