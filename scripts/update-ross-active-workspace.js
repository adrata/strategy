#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

class UpdateRossActiveWorkspace {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async updateRossActiveWorkspace() {
    try {
      console.log('🔧 UPDATING ROSS ACTIVE WORKSPACE TO ADRATA');
      console.log('============================================');
      console.log('');

      // Find Ross user
      const rossUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        select: {
          id: true,
          name: true,
          email: true,
          activeWorkspaceId: true
        }
      });

      if (!rossUser) {
        console.log('❌ Ross user not found');
        return;
      }

      console.log('👤 ROSS USER INFO:');
      console.log('==================');
      console.log(`   ID: ${rossUser.id}`);
      console.log(`   Name: ${rossUser.name}`);
      console.log(`   Email: ${rossUser.email}`);
      console.log(`   Current Active Workspace ID: ${rossUser.activeWorkspaceId || 'NOT SET'}`);
      console.log('');

      // Find Adrata workspace
      const adrataWorkspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { name: 'Adrata' },
            { slug: 'adrata' }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true
        }
      });

      if (!adrataWorkspace) {
        console.log('❌ Adrata workspace not found');
        return;
      }

      console.log('🏢 ADRATA WORKSPACE:');
      console.log('====================');
      console.log(`   ID: ${adrataWorkspace.id}`);
      console.log(`   Name: ${adrataWorkspace.name}`);
      console.log(`   Slug: ${adrataWorkspace.slug}`);
      console.log('');

      // Verify Ross has access to Adrata workspace
      const rossAdrataMembership = await this.prisma.workspace_users.findFirst({
        where: {
          userId: rossUser.id,
          workspaceId: adrataWorkspace.id,
          isActive: true
        }
      });

      if (!rossAdrataMembership) {
        console.log('❌ Ross does not have access to Adrata workspace');
        return;
      }

      console.log('✅ Ross has access to Adrata workspace');
      console.log(`   Role: ${rossAdrataMembership.role}`);
      console.log('');

      // Update Ross's activeWorkspaceId to Adrata
      await this.prisma.users.update({
        where: { id: rossUser.id },
        data: {
          activeWorkspaceId: adrataWorkspace.id,
          updatedAt: new Date()
        }
      });

      console.log('✅ UPDATED ROSS ACTIVE WORKSPACE:');
      console.log('=================================');
      console.log(`   From: ${rossUser.activeWorkspaceId || 'NOT SET'}`);
      console.log(`   To: ${adrataWorkspace.id} (${adrataWorkspace.name})`);
      console.log('');

      // Final verification
      const updatedRoss = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        select: {
          id: true,
          name: true,
          email: true,
          activeWorkspaceId: true
        }
      });

      console.log('🔍 FINAL VERIFICATION:');
      console.log('======================');
      console.log(`   Ross Active Workspace ID: ${updatedRoss.activeWorkspaceId}`);
      console.log('');

      if (updatedRoss.activeWorkspaceId === adrataWorkspace.id) {
        console.log('✅ SUCCESS! Ross will now log into Adrata workspace by default');
      } else {
        console.log('❌ Update failed - activeWorkspaceId not updated correctly');
      }

    } catch (error) {
      console.error('❌ ERROR UPDATING ROSS ACTIVE WORKSPACE:');
      console.error('========================================');
      console.error(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const updater = new UpdateRossActiveWorkspace();
updater.updateRossActiveWorkspace().catch(console.error);
