#!/usr/bin/env node

/**
 * Test Dan Buyer Group - Helper Script
 * 
 * This script queries Dan's Adrata workspace to find suitable companies
 * for testing the buyer group discovery functionality.
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

class DanBuyerGroupTester {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    try {
      console.log('🎯 TESTING BUYER GROUP FINDER FOR DAN');
      console.log('=====================================\n');
      
      // Step 1: Find Dan's user account
      console.log('👤 Step 1: Finding Dan\'s user account...');
      const danUser = await this.findDanUser();
      
      // Step 2: Find Adrata workspace
      console.log('\n🏢 Step 2: Finding Adrata workspace...');
      const adrataWorkspace = await this.findAdrataWorkspace();
      
      // Step 3: Find Dan's companies
      console.log('\n📋 Step 3: Finding Dan\'s companies...');
      const companies = await this.findDanCompanies(danUser.id, adrataWorkspace.id);
      
      // Step 4: Select test company
      console.log('\n🎯 Step 4: Selecting test company...');
      const testCompany = this.selectTestCompany(companies);
      
      if (testCompany) {
        console.log(`\n✅ Selected test company: ${testCompany.name}`);
        console.log(`   ID: ${testCompany.id}`);
        console.log(`   Website: ${testCompany.website || 'None'}`);
        console.log(`   LinkedIn: ${testCompany.linkedinUrl || 'None'}`);
        console.log(`   Industry: ${testCompany.industry || 'Unknown'}`);
        console.log(`   Size: ${testCompany.size || 'Unknown'}`);
        
        // Step 5: Generate test command
        console.log('\n🚀 Step 5: Ready to test buyer group finder!');
        console.log('Run this command:');
        console.log(`cd _future_now && node find_buyer_group.js --company-id "${testCompany.id}"`);
        
        if (testCompany.linkedinUrl) {
          console.log(`\nOr with LinkedIn URL:`);
          console.log(`cd _future_now && node find_buyer_group.js --linkedin-url "${testCompany.linkedinUrl}"`);
        }
      } else {
        console.log('\n❌ No suitable test company found');
        console.log('Companies need either a LinkedIn URL or website for buyer group analysis');
      }
      
    } catch (error) {
      console.error('❌ Test setup failed:', error.message);
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  async findDanUser() {
    const danUser = await this.prisma.users.findFirst({
      where: {
        email: 'dan@adrata.com'
      }
    });

    if (!danUser) {
      throw new Error('Dan user not found with email dan@adrata.com');
    }

    console.log(`✅ Found Dan: ${danUser.name} (${danUser.email}) - ID: ${danUser.id}`);
    return danUser;
  }

  async findAdrataWorkspace() {
    const workspace = await this.prisma.workspaces.findFirst({
      where: {
        slug: 'adrata'
      }
    });

    if (!workspace) {
      throw new Error('Adrata workspace not found');
    }

    console.log(`✅ Found workspace: ${workspace.name} (${workspace.slug}) - ID: ${workspace.id}`);
    return workspace;
  }

  async findDanCompanies(userId, workspaceId) {
    // Find companies assigned to Dan in the Adrata workspace
    const companies = await this.prisma.companies.findMany({
      where: {
        workspaceId: workspaceId,
        mainSellerId: userId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        linkedinUrl: true,
        industry: true,
        size: true,
        employeeCount: true,
        description: true,
        customFields: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });

    console.log(`✅ Found ${companies.length} companies assigned to Dan`);
    
    if (companies.length > 0) {
      console.log('\n📋 Sample companies:');
      companies.slice(0, 5).forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        console.log(`   Website: ${company.website || 'None'}`);
        console.log(`   LinkedIn: ${company.linkedinUrl || 'None'}`);
        console.log(`   Industry: ${company.industry || 'Unknown'}`);
        console.log(`   Size: ${company.size || 'Unknown'}`);
        console.log('');
      });
    }

    return companies;
  }

  selectTestCompany(companies) {
    // Prefer companies with LinkedIn URLs first, then websites
    const withLinkedIn = companies.filter(c => c.linkedinUrl);
    const withWebsite = companies.filter(c => c.website && !c.linkedinUrl);
    
    if (withLinkedIn.length > 0) {
      console.log(`📊 Found ${withLinkedIn.length} companies with LinkedIn URLs`);
      return withLinkedIn[0];
    }
    
    if (withWebsite.length > 0) {
      console.log(`📊 Found ${withWebsite.length} companies with websites (no LinkedIn)`);
      return withWebsite[0];
    }
    
    return null;
  }
}

// CLI execution
if (require.main === module) {
  const tester = new DanBuyerGroupTester();
  
  tester.run()
    .then(() => {
      console.log('\n✅ Test setup completed successfully!');
    })
    .catch(error => {
      console.error('❌ Test setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = DanBuyerGroupTester;
