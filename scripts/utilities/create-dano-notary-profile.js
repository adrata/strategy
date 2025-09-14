#!/usr/bin/env node

/**
 * 👤 CREATE DANO'S NOTARY EVERYDAY PROFILE
 * 
 * Based on notaryeveryday.com - they sell notary automation software to title companies
 */

const { PrismaClient } = require('@prisma/client');

const NOTARY_WORKSPACE_ID = 'cmezxb1ez0001pc94yry3ntjk';

async function createDanoProfile() {
  console.log('👤 CREATING DANO\'S NOTARY EVERYDAY PROFILE');
  console.log('==========================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // STEP 1: Create Dano's User Profile
    console.log('1️⃣ CREATING DANO\'S USER PROFILE:');
    console.log('----------------------------------');
    
    const existingProfile = await prisma.userProfile.findFirst({
      where: {
        userId: 'dano',
        workspaceId: NOTARY_WORKSPACE_ID
      }
    });
    
    if (!existingProfile) {
      const danoProfile = await prisma.userProfile.create({
        data: {
          id: `dano-notary-profile-${Date.now()}`,
          userId: 'dano',
          workspaceId: NOTARY_WORKSPACE_ID,
          title: 'Senior Account Executive',
          department: 'Sales',
          seniorityLevel: 'Senior',
          territory: 'Title Agencies - Florida & Arizona',
          quota: 300000, // $300k annual quota
          avgDealSize: 25000, // $25k average deal size
          winRate: 0.32, // 32% win rate
          salesVelocity: 45, // 45 day average sales cycle
          currentQuotaAttainment: 0.68, // 68% of quota achieved
          ytdRevenue: 204000, // $204k YTD revenue
          managerId: 'ryan', // Reports to Ryan
          phoneNumber: '+1-555-0123',
          workLocation: 'Remote',
          timeZone: 'America/Phoenix',
          communicationStyle: 'consultative',
          preferredDetailLevel: 'detailed',
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Dano\'s user profile');
      console.log(`   Title: ${danoProfile.title}`);
      console.log(`   Territory: ${danoProfile.territory}`);
      console.log(`   Quota: $${danoProfile.quota?.toLocaleString()}`);
      console.log(`   Avg Deal Size: $${danoProfile.avgDealSize?.toLocaleString()}`);
      console.log(`   Win Rate: ${(Number(danoProfile.winRate) * 100)}%`);
    } else {
      console.log('✅ Dano already has user profile');
    }
    
    // STEP 2: Create Notary Automation Software Portfolio
    console.log('\n2️⃣ CREATING NOTARY AUTOMATION SOFTWARE PORTFOLIO:');
    console.log('---------------------------------------------------');
    
    const existingProduct = await prisma.sellerProductPortfolio.findFirst({
      where: {
        sellerId: 'dano',
        workspaceId: NOTARY_WORKSPACE_ID,
        productName: 'Notary Everyday Platform'
      }
    });
    
    if (!existingProduct) {
      const notaryProduct = await prisma.sellerProductPortfolio.create({
        data: {
          id: `dano-notary-platform-${Date.now()}`,
          sellerId: 'dano',
          workspaceId: NOTARY_WORKSPACE_ID,
          productName: 'Notary Everyday Platform',
          productCategory: 'SaaS - Legal Technology',
          description: 'State-of-the-art notary automation software that streamlines the notarization process for title companies, signing services, and real estate professionals',
          targetIndustries: [
            'Title Insurance', 
            'Real Estate Services', 
            'Legal Services', 
            'Financial Services',
            'Mortgage & Lending'
          ],
          targetCompanySize: [
            '11-50 employees',
            '51-200 employees', 
            '201-500 employees',
            '501-1000 employees'
          ],
          primaryUseCases: [
            'Remote Online Notarization (RON)',
            'Document workflow automation',
            'Compliance management',
            'Digital signature processing',
            'Mobile notary coordination',
            'Audit trail management'
          ],
          startingPrice: 299, // $299/month starting price
          averageDealSize: 25000, // $25k annual contract
          maxDealSize: 150000, // $150k enterprise contract
          typicalSalesCycle: 45, // 45 days
          keyValueProps: [
            'Reduce closing time by 60%',
            'Eliminate compliance risks',
            'Cut notary costs by 40%',
            'Streamline document workflow',
            'RON capability built-in',
            'Real-time audit trails',
            'Mobile-first design'
          ],
          commonObjections: [
            'Cost of implementation',
            'Technology adoption concerns', 
            'Integration complexity',
            'Staff training requirements',
            'Regulatory compliance questions',
            'Existing vendor relationships'
          ],
          competitorLandscape: [
            'Traditional in-house notaries',
            'Local mobile notary services',
            'DocuSign (partial overlap)',
            'NotaryCam',
            'Pavaso',
            'Manual paper processes'
          ],
          idealCustomerProfile: 'Title agencies with 25-500 employees, processing 100+ closings per month, looking to modernize operations and reduce costs',
          buyingCommitteeRoles: [
            'CEO',
            'COO', 
            'Operations Manager',
            'Compliance Officer',
            'CFO',
            'IT Director',
            'VP Operations'
          ],
          successMetrics: [
            'Reduced closing time',
            'Lower cost per closing',
            'Improved compliance scores',
            'Higher customer satisfaction',
            'Reduced operational overhead',
            'Faster document processing'
          ],
          winRateByIndustry: {
            'Title Insurance': 0.35,
            'Real Estate Services': 0.28,
            'Legal Services': 0.42,
            'Financial Services': 0.25
          },
          winRateByCompanySize: {
            '11-50 employees': 0.45,
            '51-200 employees': 0.35,
            '201-500 employees': 0.28,
            '501-1000 employees': 0.22
          },
          isActive: true,
          lastUpdated: new Date(),
          updatedAt: new Date()
        }
      });
      console.log('✅ Created Notary Everyday Platform portfolio');
      console.log(`   Product: ${notaryProduct.productName}`);
      console.log(`   Category: ${notaryProduct.productCategory}`);
      console.log(`   Target Industries: ${notaryProduct.targetIndustries.join(', ')}`);
      console.log(`   Buying Committee Roles: ${notaryProduct.buyingCommitteeRoles.join(', ')}`);
      console.log(`   Average Deal Size: $${notaryProduct.averageDealSize?.toLocaleString()}`);
      console.log(`   Sales Cycle: ${notaryProduct.typicalSalesCycle} days`);
    } else {
      console.log('✅ Dano already has Notary Everyday Platform portfolio');
    }
    
    // STEP 3: Verify the setup
    console.log('\n3️⃣ VERIFYING SETUP:');
    console.log('--------------------');
    
    const profile = await prisma.userProfile.findFirst({
      where: { userId: 'dano', workspaceId: NOTARY_WORKSPACE_ID }
    });
    
    const products = await prisma.sellerProductPortfolio.findMany({
      where: { 
        sellerId: 'dano', 
        workspaceId: NOTARY_WORKSPACE_ID,
        isActive: true
      }
    });
    
    const accounts = await prisma.accounts.count({
      where: {
        workspaceId: NOTARY_WORKSPACE_ID,
        assignedUserId: 'dano'
      }
    });
    
    console.log(`Dano's Profile: ${profile ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`Dano's Products: ${products.length} (${products.length > 0 ? '✅ EXISTS' : '❌ MISSING'})`);
    console.log(`Dano's Accounts: ${accounts} title agencies`);
    
    if (profile && products.length > 0) {
      console.log('\n🎯 READY FOR BUYER GROUP TESTING!');
      console.log('Context completeness should now be 100%');
      
      // Show sample accounts for testing
      const sampleAccounts = await prisma.accounts.findMany({
        where: {
          workspaceId: NOTARY_WORKSPACE_ID,
          assignedUserId: 'dano'
        },
        take: 5
      });
      
      console.log('\n📋 SAMPLE ACCOUNTS FOR TESTING:');
      sampleAccounts.forEach((account, i) => {
        console.log(`   ${i + 1}. ${account.name} (${account.city}, ${account.state})`);
      });
    }
    
    await prisma.$disconnect();
    console.log('\n🚀 DANO\'S NOTARY EVERYDAY SETUP COMPLETE!');
    
    return {
      hasProfile: !!profile,
      productCount: products.length,
      accountCount: accounts
    };
    
  } catch (error) {
    console.error('❌ Error creating Dano\'s profile:', error.message);
    console.error('Stack:', error.stack);
  }
}

createDanoProfile();
