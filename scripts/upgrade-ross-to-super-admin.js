#!/usr/bin/env node

/**
 * 🔧 UPGRADE ROSS TO SUPER_ADMIN
 * 
 * Upgrades Ross Sylvester from WORKSPACE_ADMIN to SUPER_ADMIN role
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class UpgradeRossToSuperAdmin {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async upgradeRoss() {
    console.log('🔧 UPGRADING ROSS TO SUPER_ADMIN');
    console.log('=================================');
    console.log('');

    try {
      // Test database connection first
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');

      // Find Ross Sylvester user
      const rossUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        include: {
          workspace_users: {
            include: {
              workspace: true
            }
          }
        }
      });

      if (!rossUser) {
        console.log('❌ Ross Sylvester user not found');
        return;
      }

      console.log('👤 ROSS SYLVESTER USER FOUND:');
      console.log('==============================');
      console.log(`   ID: ${rossUser.id}`);
      console.log(`   Email: ${rossUser.email}`);
      console.log(`   Username: ${rossUser.username}`);
      console.log(`   Name: ${rossUser.name}`);
      console.log('');

      // Check current workspace role
      if (rossUser.workspace_users.length > 0) {
        const currentRole = rossUser.workspace_users[0].role;
        console.log('📋 CURRENT WORKSPACE ROLE:');
        console.log('==========================');
        console.log(`   Role: ${currentRole}`);
        console.log(`   Workspace: ${rossUser.workspace_users[0].workspace.name}`);
        console.log('');

        // Update to SUPER_ADMIN
        if (currentRole !== 'SUPER_ADMIN') {
          console.log('⬆️  UPGRADING TO SUPER_ADMIN:');
          console.log('=============================');

          const updatedWorkspaceUser = await this.prisma.workspace_users.update({
            where: { id: rossUser.workspace_users[0].id },
            data: {
              role: 'SUPER_ADMIN',
              updatedAt: new Date()
            }
          });

          console.log('✅ SUCCESSFULLY UPGRADED TO SUPER_ADMIN:');
          console.log('=======================================');
          console.log(`   New Role: ${updatedWorkspaceUser.role}`);
          console.log(`   Updated: ${updatedWorkspaceUser.updatedAt.toISOString().split('T')[0]}`);
          console.log('');
        } else {
          console.log('✅ Ross is already SUPER_ADMIN');
          console.log('');
        }
      } else {
        console.log('❌ Ross is not linked to any workspace');
        return;
      }

      // Final verification
      console.log('🔍 FINAL VERIFICATION:');
      console.log('======================');
      
      const finalUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        include: {
          workspace_users: {
            include: {
              workspace: true
            }
          }
        }
      });

      if (finalUser && finalUser.workspace_users.length > 0) {
        console.log('✅ UPGRADE COMPLETE:');
        console.log('===================');
        console.log(`   User: ${finalUser.name} (@${finalUser.username})`);
        console.log(`   Email: ${finalUser.email}`);
        console.log(`   Role: ${finalUser.workspace_users[0].role}`);
        console.log(`   Workspace: ${finalUser.workspace_users[0].workspace.name}`);
        console.log('');
        console.log('🎉 Ross Sylvester is now SUPER_ADMIN!');
      }

    } catch (error) {
      console.log(`❌ ERROR: ${error.message}`);
      console.log('');
      if (error.code) {
        console.log(`   Error Code: ${error.code}`);
      }
    }

    await this.prisma.$disconnect();
  }
}

// Run the upgrade
async function main() {
  const upgrade = new UpgradeRossToSuperAdmin();
  await upgrade.upgradeRoss();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = UpgradeRossToSuperAdmin;
