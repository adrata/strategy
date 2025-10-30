#!/usr/bin/env node

/**
 * Update Ross from SUPER_ADMIN to WORKSPACE_ADMIN
 * 
 * This script will:
 * 1. Find Ross user by email (ross@adrata.com)
 * 2. Update his workspace_users role from SUPER_ADMIN to WORKSPACE_ADMIN
 * 3. Remove his SUPER_ADMIN role from user_roles table
 * 4. Verify the changes
 */

const { PrismaClient } = require('@prisma/client');

class UpdateRossToWorkspaceAdmin {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateRossRole() {
    try {
      console.log('🔧 UPDATING ROSS FROM SUPER_ADMIN TO WORKSPACE_ADMIN');
      console.log('====================================================');
      console.log('');

      // Find Ross user
      const rossUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        include: {
          workspace_users: {
            where: { isActive: true },
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          user_roles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      if (!rossUser) {
        console.log('❌ Ross user not found');
        return;
      }

      console.log('👤 ROSS USER FOUND:');
      console.log('===================');
      console.log(`   ID: ${rossUser.id}`);
      console.log(`   Name: ${rossUser.name}`);
      console.log(`   Email: ${rossUser.email}`);
      console.log('');

      // Show current workspace roles
      console.log('📋 CURRENT WORKSPACE ROLES:');
      console.log('===========================');
      if (rossUser.workspace_users.length > 0) {
        rossUser.workspace_users.forEach(membership => {
          console.log(`   ${membership.workspace.name} (${membership.workspace.slug}): ${membership.role}`);
        });
      } else {
        console.log('   No workspace memberships found');
      }
      console.log('');

      // Show current global roles
      console.log('🌐 CURRENT GLOBAL ROLES:');
      console.log('========================');
      if (rossUser.user_roles.length > 0) {
        rossUser.user_roles.forEach(userRole => {
          console.log(`   ${userRole.role.name}`);
        });
      } else {
        console.log('   No global roles found');
      }
      console.log('');

      // Update workspace roles from SUPER_ADMIN to WORKSPACE_ADMIN
      console.log('⬇️  UPDATING WORKSPACE ROLES:');
      console.log('=============================');
      
      for (const membership of rossUser.workspace_users) {
        if (membership.role === 'SUPER_ADMIN') {
          await this.prisma.workspace_users.update({
            where: { id: membership.id },
            data: {
              role: 'WORKSPACE_ADMIN',
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Updated ${membership.workspace.name}: SUPER_ADMIN → WORKSPACE_ADMIN`);
        } else {
          console.log(`   ⏭️  Skipped ${membership.workspace.name}: ${membership.role} (not SUPER_ADMIN)`);
        }
      }
      console.log('');

      // Remove SUPER_ADMIN role from user_roles
      console.log('🗑️  REMOVING SUPER_ADMIN GLOBAL ROLE:');
      console.log('=====================================');
      
      const superAdminRole = await this.prisma.roles.findFirst({
        where: { name: 'SUPER_ADMIN' }
      });

      if (superAdminRole) {
        const existingUserRole = await this.prisma.user_roles.findFirst({
          where: {
            userId: rossUser.id,
            roleId: superAdminRole.id,
            isActive: true
          }
        });

        if (existingUserRole) {
          await this.prisma.user_roles.update({
            where: { id: existingUserRole.id },
            data: {
              isActive: false
            }
          });
          console.log('   ✅ Deactivated SUPER_ADMIN global role');
        } else {
          console.log('   ⏭️  No SUPER_ADMIN global role found');
        }
      } else {
        console.log('   ⏭️  SUPER_ADMIN role not found in roles table');
      }
      console.log('');

      // Final verification
      console.log('🔍 FINAL VERIFICATION:');
      console.log('======================');
      
      const finalUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        include: {
          workspace_users: {
            where: { isActive: true },
            include: {
              workspace: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              }
            }
          },
          user_roles: {
            where: { isActive: true },
            include: {
              role: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      });

      console.log('📋 UPDATED WORKSPACE ROLES:');
      console.log('===========================');
      if (finalUser.workspace_users.length > 0) {
        finalUser.workspace_users.forEach(membership => {
          console.log(`   ${membership.workspace.name} (${membership.workspace.slug}): ${membership.role}`);
        });
      } else {
        console.log('   No workspace memberships found');
      }
      console.log('');

      console.log('🌐 UPDATED GLOBAL ROLES:');
      console.log('========================');
      if (finalUser.user_roles.length > 0) {
        finalUser.user_roles.forEach(userRole => {
          console.log(`   ${userRole.role.name}`);
        });
      } else {
        console.log('   No global roles found');
      }
      console.log('');

      console.log('✅ ROSS ROLE UPDATE COMPLETE!');
      console.log('=============================');
      console.log('Ross is now a WORKSPACE_ADMIN like Dan, with:');
      console.log('• Full workspace access');
      console.log('• Admin privileges within workspaces');
      console.log('• No longer has SUPER_ADMIN privileges');
      console.log('');

    } catch (error) {
      console.error('❌ ERROR UPDATING ROSS ROLE:');
      console.error('============================');
      console.error(error.message);
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the script
const updater = new UpdateRossToWorkspaceAdmin();
updater.updateRossRole().catch(console.error);
