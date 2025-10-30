#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

class CheckWorkspaceAssignments {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async checkWorkspaceAssignments() {
    try {
      console.log('🔍 CHECKING WORKSPACE ASSIGNMENTS');
      console.log('==================================');
      console.log('');

      // Find Ross and Dan users
      const [rossUser, danUser] = await Promise.all([
        this.prisma.users.findFirst({
          where: { email: 'ross@adrata.com' },
          select: { id: true, name: true, email: true, activeWorkspaceId: true }
        }),
        this.prisma.users.findFirst({
          where: { email: 'dan@adrata.com' },
          select: { id: true, name: true, email: true, activeWorkspaceId: true }
        })
      ]);

      console.log('👥 USERS:');
      console.log('==========');
      console.log(`   Ross: ${rossUser.name} (${rossUser.id})`);
      console.log(`   Ross Active Workspace: ${rossUser.activeWorkspaceId}`);
      console.log(`   Dan: ${danUser.name} (${danUser.id})`);
      console.log(`   Dan Active Workspace: ${danUser.activeWorkspaceId}`);
      console.log('');

      // Check if they're in the same workspace
      if (rossUser.activeWorkspaceId === danUser.activeWorkspaceId) {
        console.log('⚠️  WARNING: Ross and Dan are in the same workspace!');
        console.log(`   Workspace ID: ${rossUser.activeWorkspaceId}`);
        console.log('');

        // Check workspace details
        const workspace = await this.prisma.workspaces.findUnique({
          where: { id: rossUser.activeWorkspaceId },
          select: { id: true, name: true, slug: true }
        });

        console.log('🏢 WORKSPACE:');
        console.log('==============');
        console.log(`   ID: ${workspace.id}`);
        console.log(`   Name: ${workspace.name}`);
        console.log(`   Slug: ${workspace.slug}`);
        console.log('');

        // Check people assignments in this workspace
        const peopleAssignments = await this.prisma.people.groupBy({
          by: ['mainSellerId'],
          where: {
            workspaceId: rossUser.activeWorkspaceId,
            deletedAt: null
          },
          _count: { id: true }
        });

        console.log('👥 PEOPLE ASSIGNMENTS:');
        console.log('======================');
        peopleAssignments.forEach(assignment => {
          const sellerName = assignment.mainSellerId === rossUser.id ? 'Ross' : 
                           assignment.mainSellerId === danUser.id ? 'Dan' : 
                           assignment.mainSellerId === null ? 'Unassigned' : 
                           'Other';
          console.log(`   ${sellerName} (${assignment.mainSellerId || 'null'}): ${assignment._count.id} people`);
        });
        console.log('');

        // Check companies assignments in this workspace
        const companiesAssignments = await this.prisma.companies.groupBy({
          by: ['mainSellerId'],
          where: {
            workspaceId: rossUser.activeWorkspaceId,
            deletedAt: null
          },
          _count: { id: true }
        });

        console.log('🏢 COMPANIES ASSIGNMENTS:');
        console.log('==========================');
        companiesAssignments.forEach(assignment => {
          const sellerName = assignment.mainSellerId === rossUser.id ? 'Ross' : 
                           assignment.mainSellerId === danUser.id ? 'Dan' : 
                           assignment.mainSellerId === null ? 'Unassigned' : 
                           'Other';
          console.log(`   ${sellerName} (${assignment.mainSellerId || 'null'}): ${assignment._count.id} companies`);
        });

      } else {
        console.log('✅ Ross and Dan are in different workspaces');
      }

    } catch (error) {
      console.error('❌ ERROR:', error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const checker = new CheckWorkspaceAssignments();
checker.checkWorkspaceAssignments().catch(console.error);
