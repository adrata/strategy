#!/usr/bin/env node

/**
 * Set Victoria as Main Seller for TOP Workspace
 * Updates all people and companies in the TOP Engineering Plus workspace
 * to have Victoria (vleland@topengineersplus.com) as their main seller
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class SetVictoriaMainSeller {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async setVictoriaAsMainSeller() {
    console.log('🔧 SETTING VICTORIA AS MAIN SELLER FOR TOP WORKSPACE');
    console.log('===================================================');
    console.log('');

    try {
      // Test database connection
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
      console.log('');

      // Step 1: Find the TOP Engineering Plus workspace
      console.log('🔍 Finding TOP Engineering Plus workspace...');
      const workspace = await this.prisma.workspaces.findFirst({
        where: {
          OR: [
            { slug: 'top-engineers-plus' },
            { name: { contains: 'TOP', mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true
        }
      });

      if (!workspace) {
        console.log('❌ TOP Engineering Plus workspace not found');
        return;
      }

      console.log('✅ Workspace found:');
      console.log(`   ID: ${workspace.id}`);
      console.log(`   Name: ${workspace.name}`);
      console.log(`   Slug: ${workspace.slug}`);
      console.log('');

      // Step 2: Find Victoria's user record
      console.log('🔍 Finding Victoria user...');
      const victoria = await this.prisma.users.findFirst({
        where: {
          email: 'vleland@topengineersplus.com'
        },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      if (!victoria) {
        console.log('❌ Victoria user not found');
        return;
      }

      console.log('✅ Victoria found:');
      console.log(`   ID: ${victoria.id}`);
      console.log(`   Name: ${victoria.name}`);
      console.log(`   Email: ${victoria.email}`);
      console.log('');

      // Step 3: Get current counts
      console.log('📊 Getting current record counts...');
      const peopleCount = await this.prisma.people.count({
        where: { workspaceId: workspace.id }
      });

      const companiesCount = await this.prisma.companies.count({
        where: { workspaceId: workspace.id }
      });

      console.log(`   People in workspace: ${peopleCount}`);
      console.log(`   Companies in workspace: ${companiesCount}`);
      console.log('');

      // Step 4: Update people records
      console.log('👥 Updating people records...');
      const peopleUpdateResult = await this.prisma.people.updateMany({
        where: { 
          workspaceId: workspace.id,
          OR: [
            { mainSellerId: null },
            { mainSellerId: { not: victoria.id } }
          ]
        },
        data: { 
          mainSellerId: victoria.id,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated ${peopleUpdateResult.count} people records`);
      console.log('');

      // Step 5: Update companies records
      console.log('🏢 Updating companies records...');
      const companiesUpdateResult = await this.prisma.companies.updateMany({
        where: { 
          workspaceId: workspace.id,
          OR: [
            { mainSellerId: null },
            { mainSellerId: { not: victoria.id } }
          ]
        },
        data: { 
          mainSellerId: victoria.id,
          updatedAt: new Date()
        }
      });

      console.log(`✅ Updated ${companiesUpdateResult.count} companies records`);
      console.log('');

      // Step 6: Verification - Get updated counts
      console.log('🔍 Verifying updates...');
      const peopleWithVictoria = await this.prisma.people.count({
        where: { 
          workspaceId: workspace.id,
          mainSellerId: victoria.id
        }
      });

      const companiesWithVictoria = await this.prisma.companies.count({
        where: { 
          workspaceId: workspace.id,
          mainSellerId: victoria.id
        }
      });

      console.log(`✅ People with Victoria as main seller: ${peopleWithVictoria}/${peopleCount}`);
      console.log(`✅ Companies with Victoria as main seller: ${companiesWithVictoria}/${companiesCount}`);
      console.log('');

      // Step 7: Show sample records
      console.log('📝 Sample updated records:');
      console.log('');

      // Sample people
      const samplePeople = await this.prisma.people.findMany({
        where: { 
          workspaceId: workspace.id,
          mainSellerId: victoria.id
        },
        select: {
          id: true,
          fullName: true,
          status: true,
          company: {
            select: { name: true }
          }
        },
        take: 3
      });

      console.log('👥 Sample People:');
      samplePeople.forEach((person, index) => {
        console.log(`   ${index + 1}. ${person.fullName}`);
        console.log(`      Status: ${person.status}`);
        console.log(`      Company: ${person.company?.name || 'None'}`);
        console.log('');
      });

      // Sample companies
      const sampleCompanies = await this.prisma.companies.findMany({
        where: { 
          workspaceId: workspace.id,
          mainSellerId: victoria.id
        },
        select: {
          id: true,
          name: true,
          status: true
        },
        take: 3
      });

      console.log('🏢 Sample Companies:');
      sampleCompanies.forEach((company, index) => {
        console.log(`   ${index + 1}. ${company.name}`);
        console.log(`      Status: ${company.status}`);
        console.log('');
      });

      // Final summary
      console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY');
      console.log('===================================');
      console.log(`✅ Updated ${peopleUpdateResult.count} people records`);
      console.log(`✅ Updated ${companiesUpdateResult.count} companies records`);
      console.log(`✅ Total people with Victoria as main seller: ${peopleWithVictoria}`);
      console.log(`✅ Total companies with Victoria as main seller: ${companiesWithVictoria}`);
      console.log('');

    } catch (error) {
      console.error('❌ Error during migration:', error);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }
}

// Run the migration
async function main() {
  const migrator = new SetVictoriaMainSeller();
  await migrator.setVictoriaAsMainSeller();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SetVictoriaMainSeller;
