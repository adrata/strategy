#!/usr/bin/env node

/**
 * Make Ross Super Admin Script
 * Makes Ross user a super admin in both workspaces
 */

const { PrismaClient } = require('@prisma/client');

class RossSuperAdminUpdater {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async makeRossSuperAdmin() {
    try {
      console.log('🔧 Making Ross a super admin in all workspaces...');

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
        throw new Error('Ross user not found. Please ensure the user exists in the database.');
      }

      console.log(`✅ Found Ross user: ${rossUser.name} (${rossUser.email})`);

      // Get all workspaces
      const workspaces = await this.prisma.workspaces.findMany({
        where: { isActive: true }
      });

      console.log(`📋 Found ${workspaces.length} active workspaces`);

      for (const workspace of workspaces) {
        console.log(`\n🔧 Processing workspace: ${workspace.name} (${workspace.slug})`);

        // Check if Ross is already in this workspace
        const existingMembership = await this.prisma.workspace_users.findFirst({
          where: {
            workspaceId: workspace.id,
            userId: rossUser.id,
            isActive: true
          }
        });

        if (existingMembership) {
          // Update existing membership to SUPER_ADMIN
          await this.prisma.workspace_users.update({
            where: { id: existingMembership.id },
            data: {
              role: 'SUPER_ADMIN',
              updatedAt: new Date()
            }
          });
          console.log(`   ✅ Updated Ross to SUPER_ADMIN in ${workspace.name}`);
        } else {
          // Add Ross to workspace as SUPER_ADMIN
          await this.prisma.workspace_users.create({
            data: {
              workspaceId: workspace.id,
              userId: rossUser.id,
              role: 'SUPER_ADMIN',
              isActive: true,
              joinedAt: new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
            }
          });
          console.log(`   ✅ Added Ross as SUPER_ADMIN to ${workspace.name}`);
        }
      }

      // Also update Ross's user record to have SUPER_ADMIN role globally
      await this.prisma.users.update({
        where: { id: rossUser.id },
        data: {
          role: 'SUPER_ADMIN',
          updatedAt: new Date()
        }
      });
      console.log(`\n✅ Updated Ross's global role to SUPER_ADMIN`);

      // Get final status
      const finalWorkspaces = await this.prisma.workspaces.findMany({
        where: { isActive: true },
        include: {
          workspace_users: {
            where: { 
              userId: rossUser.id,
              isActive: true 
            },
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      console.log('\n📊 Final Status:');
      console.log(`   Ross Global Role: ${rossUser.role}`);
      console.log('   Workspace Memberships:');
      finalWorkspaces.forEach(workspace => {
        const membership = workspace.workspace_users[0];
        if (membership) {
          console.log(`     - ${workspace.name}: ${membership.role}`);
        } else {
          console.log(`     - ${workspace.name}: NOT A MEMBER`);
        }
      });

      return finalWorkspaces;

    } catch (error) {
      console.error('❌ Error making Ross super admin:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Main execution
async function main() {
  const updater = new RossSuperAdminUpdater();
  
  try {
    await updater.makeRossSuperAdmin();
    console.log('\n🎉 Ross is now a super admin in all workspaces!');
  } catch (error) {
    console.error('❌ Failed to make Ross super admin:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { RossSuperAdminUpdater };
