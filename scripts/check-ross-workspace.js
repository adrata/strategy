#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

class CheckRossWorkspace {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkRossWorkspace() {
    try {
      console.log('🔍 CHECKING ROSS ACTIVE WORKSPACE');
      console.log('=================================');
      console.log('');

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
      console.log(`   Active Workspace ID: ${rossUser.activeWorkspaceId || 'NOT SET'}`);
      console.log('');

      if (rossUser.activeWorkspaceId) {
        const workspace = await this.prisma.workspaces.findUnique({
          where: { id: rossUser.activeWorkspaceId },
          select: {
            id: true,
            name: true,
            slug: true
          }
        });

        if (workspace) {
          console.log('🏢 ACTIVE WORKSPACE:');
          console.log('====================');
          console.log(`   ID: ${workspace.id}`);
          console.log(`   Name: ${workspace.name}`);
          console.log(`   Slug: ${workspace.slug}`);
        } else {
          console.log('❌ Active workspace not found in database');
        }
      }

    } catch (error) {
      console.error('❌ ERROR:', error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const checker = new CheckRossWorkspace();
checker.checkRossWorkspace().catch(console.error);
