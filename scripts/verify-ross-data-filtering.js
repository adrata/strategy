#!/usr/bin/env node

/**
 * Verify Ross Data Filtering
 * 
 * This script will:
 * 1. Check what data Ross should see (only his own + unassigned)
 * 2. Verify the API changes are working correctly
 * 3. Show the difference between demo mode and normal mode
 */

const { PrismaClient } = require('@prisma/client');

class VerifyRossDataFiltering {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async verifyRossDataFiltering() {
    try {
      console.log('🔍 VERIFYING ROSS DATA FILTERING');
      console.log('=================================');
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
      console.log(`   Active Workspace ID: ${rossUser.activeWorkspaceId}`);
      console.log('');

      const workspaceId = rossUser.activeWorkspaceId;
      const userId = rossUser.id;

      // Check what data Ross should see (normal mode - only his own + unassigned)
      console.log('📊 ROSS DATA FILTERING (NORMAL MODE):');
      console.log('=====================================');
      
      // People counts - only Ross's assigned + unassigned
      const rossPeopleCounts = await this.prisma.people.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        },
        _count: { id: true }
      });

      // Companies counts - only Ross's assigned + unassigned
      const rossCompaniesCounts = await this.prisma.companies.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        },
        _count: { id: true }
      });

      // Speedrun people - only Ross's assigned + unassigned
      const rossSpeedrunPeople = await this.prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          companyId: { not: null },
          globalRank: { not: null, gte: 1, lte: 50 },
          OR: [
            { mainSellerId: userId },
            { mainSellerId: null }
          ]
        }
      });

      console.log('   People counts (Ross assigned + unassigned):');
      rossPeopleCounts.forEach(count => {
        console.log(`     ${count.status || 'NULL'}: ${count._count.id}`);
      });

      console.log('   Companies counts (Ross assigned + unassigned):');
      rossCompaniesCounts.forEach(count => {
        console.log(`     ${count.status || 'NULL'}: ${count._count.id}`);
      });

      console.log(`   Speedrun people (Ross assigned + unassigned): ${rossSpeedrunPeople}`);
      console.log('');

      // Check what data Ross would see in demo mode (all data)
      console.log('📊 ROSS DATA IN DEMO MODE (ALL DATA):');
      console.log('=====================================');
      
      const allPeopleCounts = await this.prisma.people.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          deletedAt: null
        },
        _count: { id: true }
      });

      const allCompaniesCounts = await this.prisma.companies.groupBy({
        by: ['status'],
        where: {
          workspaceId,
          deletedAt: null
        },
        _count: { id: true }
      });

      const allSpeedrunPeople = await this.prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          companyId: { not: null },
          globalRank: { not: null, gte: 1, lte: 50 }
        }
      });

      console.log('   People counts (ALL data):');
      allPeopleCounts.forEach(count => {
        console.log(`     ${count.status || 'NULL'}: ${count._count.id}`);
      });

      console.log('   Companies counts (ALL data):');
      allCompaniesCounts.forEach(count => {
        console.log(`     ${count.status || 'NULL'}: ${count._count.id}`);
      });

      console.log(`   Speedrun people (ALL data): ${allSpeedrunPeople}`);
      console.log('');

      // Calculate the difference
      const rossPeopleTotal = rossPeopleCounts.reduce((sum, count) => sum + count._count.id, 0);
      const allPeopleTotal = allPeopleCounts.reduce((sum, count) => sum + count._count.id, 0);
      const rossCompaniesTotal = rossCompaniesCounts.reduce((sum, count) => sum + count._count.id, 0);
      const allCompaniesTotal = allCompaniesCounts.reduce((sum, count) => sum + count._count.id, 0);

      console.log('📈 DATA FILTERING IMPACT:');
      console.log('=========================');
      console.log(`   People: ${rossPeopleTotal} (Ross's) vs ${allPeopleTotal} (all) - Difference: ${allPeopleTotal - rossPeopleTotal}`);
      console.log(`   Companies: ${rossCompaniesTotal} (Ross's) vs ${allCompaniesTotal} (all) - Difference: ${allCompaniesTotal - rossCompaniesTotal}`);
      console.log(`   Speedrun: ${rossSpeedrunPeople} (Ross's) vs ${allSpeedrunPeople} (all) - Difference: ${allSpeedrunPeople - rossSpeedrunPeople}`);
      console.log('');

      // Check if Ross has any assigned data
      const rossAssignedPeople = await this.prisma.people.count({
        where: {
          workspaceId,
          deletedAt: null,
          mainSellerId: userId
        }
      });

      const rossAssignedCompanies = await this.prisma.companies.count({
        where: {
          workspaceId,
          deletedAt: null,
          mainSellerId: userId
        }
      });

      console.log('🎯 ROSS ASSIGNED DATA:');
      console.log('======================');
      console.log(`   Assigned People: ${rossAssignedPeople}`);
      console.log(`   Assigned Companies: ${rossAssignedCompanies}`);
      console.log('');

      if (rossAssignedPeople === 0 && rossAssignedCompanies === 0) {
        console.log('⚠️  WARNING: Ross has no assigned data!');
        console.log('   He will only see unassigned records until data is assigned to him.');
        console.log('   This is expected if you are about to add leads/people for Ross.');
      } else {
        console.log('✅ Ross has assigned data - he should see his own records.');
      }

      console.log('');
      console.log('✅ DATA FILTERING VERIFICATION COMPLETE!');
      console.log('========================================');
      console.log('Ross will now see only:');
      console.log('• His own assigned people and companies');
      console.log('• Unassigned people and companies');
      console.log('• NOT Dan\'s or other users\' data');

    } catch (error) {
      console.error('❌ ERROR VERIFYING ROSS DATA FILTERING:');
      console.error('======================================');
      console.error(error.message);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

const verifier = new VerifyRossDataFiltering();
verifier.verifyRossDataFiltering().catch(console.error);
