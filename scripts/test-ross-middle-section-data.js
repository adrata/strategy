#!/usr/bin/env node

/**
 * TEST ROSS MIDDLE SECTION DATA
 * 
 * This script tests what data Ross sees in the middle section by calling the same APIs
 * that the middle section uses to load data.
 */

const { PrismaClient } = require('@prisma/client');

class TestRossMiddleSectionData {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async testMiddleSectionData() {
    console.log('🧪 TESTING ROSS MIDDLE SECTION DATA...');
    console.log('=====================================');

    try {
      // Get Ross's user info
      const rossUser = await this.prisma.users.findFirst({
        where: { email: 'ross@adrata.com' },
        select: { id: true, name: true, activeWorkspaceId: true }
      });

      if (!rossUser) {
        console.log('❌ Ross user not found');
        return;
      }

      console.log(`👤 Ross User: ${rossUser.name} (${rossUser.id})`);
      console.log(`🏢 Active Workspace: ${rossUser.activeWorkspaceId}`);
      console.log('');

      // Test the APIs that the middle section uses
      console.log('🔍 TESTING MIDDLE SECTION APIs...');
      console.log('==================================');

      // Test 1: People API (for leads, prospects, people sections)
      console.log('1️⃣ Testing People API...');
      const peopleData = await this.prisma.people.findMany({
        where: {
          workspaceId: rossUser.activeWorkspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: rossUser.id },
            { mainSellerId: null }
          ]
        },
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          status: true,
          mainSellerId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log(`   📊 People count: ${peopleData.length}`);
      console.log(`   👥 People data:`);
      peopleData.forEach((person, index) => {
        console.log(`      ${index + 1}. ${person.fullName} (${person.workEmail}) - Status: ${person.status} - Assigned to: ${person.mainSellerId || 'Unassigned'}`);
      });
      console.log('');

      // Test 2: Companies API
      console.log('2️⃣ Testing Companies API...');
      const companiesData = await this.prisma.companies.findMany({
        where: {
          workspaceId: rossUser.activeWorkspaceId,
          deletedAt: null,
          OR: [
            { mainSellerId: rossUser.id },
            { mainSellerId: null }
          ]
        },
        select: {
          id: true,
          name: true,
          status: true,
          mainSellerId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log(`   📊 Companies count: ${companiesData.length}`);
      console.log(`   🏢 Companies data:`);
      companiesData.forEach((company, index) => {
        console.log(`      ${index + 1}. ${company.name} - Status: ${company.status} - Assigned to: ${company.mainSellerId || 'Unassigned'}`);
      });
      console.log('');

      // Test 3: Speedrun API (people with company relationships)
      console.log('3️⃣ Testing Speedrun API...');
      const speedrunData = await this.prisma.people.findMany({
        where: {
          workspaceId: rossUser.activeWorkspaceId,
          deletedAt: null,
          companyId: { not: null },
          OR: [
            { mainSellerId: rossUser.id },
            { mainSellerId: null }
          ]
        },
        select: {
          id: true,
          fullName: true,
          workEmail: true,
          status: true,
          mainSellerId: true,
          companyId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      console.log(`   📊 Speedrun count: ${speedrunData.length}`);
      console.log(`   🏃 Speedrun data:`);
      speedrunData.forEach((person, index) => {
        console.log(`      ${index + 1}. ${person.fullName} (${person.workEmail}) - Status: ${person.status} - Assigned to: ${person.mainSellerId || 'Unassigned'}`);
      });
      console.log('');

      // Test 4: Check what Dan sees for comparison
      console.log('4️⃣ Testing Dan data for comparison...');
      const danUser = await this.prisma.users.findFirst({
        where: { email: 'dan@adrata.com' },
        select: { id: true, name: true, activeWorkspaceId: true }
      });

      if (danUser) {
        const danPeopleData = await this.prisma.people.findMany({
          where: {
            workspaceId: danUser.activeWorkspaceId,
            deletedAt: null,
            OR: [
              { mainSellerId: danUser.id },
              { mainSellerId: null }
            ]
          },
          select: {
            id: true,
            fullName: true,
            workEmail: true,
            status: true,
            mainSellerId: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        });

        console.log(`   👤 Dan User: ${danUser.name} (${danUser.id})`);
        console.log(`   🏢 Dan's Active Workspace: ${danUser.activeWorkspaceId}`);
        console.log(`   📊 Dan's People count: ${danPeopleData.length}`);
        console.log(`   👥 Dan's People data:`);
        danPeopleData.forEach((person, index) => {
          console.log(`      ${index + 1}. ${person.fullName} (${person.workEmail}) - Status: ${person.status} - Assigned to: ${person.mainSellerId || 'Unassigned'}`);
        });
      }
      console.log('');

      // Summary
      console.log('📋 SUMMARY:');
      console.log('===========');
      console.log(`✅ Ross sees ${peopleData.length} people in his workspace`);
      console.log(`✅ Ross sees ${companiesData.length} companies in his workspace`);
      console.log(`✅ Ross sees ${speedrunData.length} speedrun items in his workspace`);
      console.log('');
      console.log('🔍 ANALYSIS:');
      console.log('============');
      if (peopleData.length === 0) {
        console.log('ℹ️  Ross sees 0 people - this is correct if no data is assigned to him');
        console.log('   The middle section should show "No data" or empty state');
      } else {
        console.log('⚠️  Ross sees people data - this might be the issue');
        console.log('   Check if any of these people are assigned to Dan instead of Ross');
      }

    } catch (error) {
      console.error('❌ Error testing middle section data:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the test
const test = new TestRossMiddleSectionData();
test.testMiddleSectionData().catch(console.error);
