#!/usr/bin/env node

/**
 * Fix Demo Workspace Access Script
 * Ensures Ross has proper access to the demo workspace
 */

const { PrismaClient } = require('@prisma/client');

class DemoWorkspaceAccessFixer {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async fixDemoWorkspaceAccess() {
    try {
      console.log('🔧 Fixing demo workspace access for Ross...');

      // Find the Ross user
      const rossUser = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: 'ross@adrata.com' },
            { username: 'ross' },
            { name: { contains: 'Ross', mode: 'insensitive' } }
          ]
        }
      });

      if (!rossUser) {
        throw new Error('Ross user not found');
      }

      console.log(`✅ Found Ross user: ${rossUser.name} (${rossUser.email})`);

      // Find the demo workspace
      const demoWorkspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'demo' },
            { name: { contains: 'demo', mode: 'insensitive' } }
          ]
        }
      });

      if (!demoWorkspace) {
        throw new Error('Demo workspace not found');
      }

      console.log(`✅ Found demo workspace: ${demoWorkspace.name} (${demoWorkspace.slug})`);

      // Check if Ross is in the demo workspace
      const existingMembership = await this.prisma.workspace_users.findFirst({
        where: {
          workspaceId: demoWorkspace.id,
          userId: rossUser.id,
          isActive: true
        }
      });

      if (existingMembership) {
        console.log(`✅ Ross is already in demo workspace with role: ${existingMembership.role}`);
        
        // Update to SUPER_ADMIN if not already
        if (existingMembership.role !== 'SUPER_ADMIN') {
          await this.prisma.workspace_users.update({
            where: { id: existingMembership.id },
            data: {
              role: 'SUPER_ADMIN',
              updatedAt: new Date()
            }
          });
          console.log(`✅ Updated Ross to SUPER_ADMIN in demo workspace`);
        }
      } else {
        // Add Ross to demo workspace
        await this.prisma.workspace_users.create({
          data: {
            workspaceId: demoWorkspace.id,
            userId: rossUser.id,
            role: 'SUPER_ADMIN',
            isActive: true,
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        });
        console.log(`✅ Added Ross as SUPER_ADMIN to demo workspace`);
      }

      // Update Ross's global role to SUPER_ADMIN via user_roles table
      // First, find or create a SUPER_ADMIN role
      let superAdminRole = await this.prisma.roles.findFirst({
        where: { name: 'SUPER_ADMIN' }
      });

      if (!superAdminRole) {
        superAdminRole = await this.prisma.roles.create({
          data: {
            name: 'SUPER_ADMIN',
            description: 'Super Administrator with full system access',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        console.log(`✅ Created SUPER_ADMIN role`);
      }

      // Check if Ross already has SUPER_ADMIN role
      const existingUserRole = await this.prisma.user_roles.findFirst({
        where: {
          userId: rossUser.id,
          roleId: superAdminRole.id,
          isActive: true
        }
      });

      if (!existingUserRole) {
        await this.prisma.user_roles.create({
          data: {
            userId: rossUser.id,
            roleId: superAdminRole.id,
            isActive: true,
            assignedAt: new Date()
          }
        });
        console.log(`✅ Added SUPER_ADMIN role to Ross`);
      } else {
        console.log(`✅ Ross already has SUPER_ADMIN role`);
      }

      // Also update Ross's activeWorkspaceId to demo workspace
      await this.prisma.users.update({
        where: { id: rossUser.id },
        data: {
          activeWorkspaceId: demoWorkspace.id,
          updatedAt: new Date()
        }
      });
      console.log(`✅ Set Ross's active workspace to demo workspace`);

      // Get final status
      const finalUser = await this.prisma.users.findUnique({
        where: { id: rossUser.id },
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

      console.log('\n📊 Final Status:');
      console.log(`   Ross Active Workspace: ${finalUser.activeWorkspaceId}`);
      console.log('   Ross Global Roles:');
      finalUser.user_roles.forEach(userRole => {
        console.log(`     - ${userRole.role.name}`);
      });
      console.log('   Workspace Memberships:');
      finalUser.workspace_users.forEach(membership => {
        console.log(`     - ${membership.workspace.name} (${membership.workspace.slug}): ${membership.role}`);
      });

      return finalUser;

    } catch (error) {
      console.error('❌ Error fixing demo workspace access:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const fixer = new DemoWorkspaceAccessFixer();
  
  try {
    await fixer.fixDemoWorkspaceAccess();
    console.log('\n🎉 Demo workspace access fixed!');
  } catch (error) {
    console.error('❌ Failed to fix demo workspace access:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { DemoWorkspaceAccessFixer };
