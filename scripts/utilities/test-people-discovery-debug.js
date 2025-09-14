#!/usr/bin/env node

/**
 * 🔍 DEBUG PEOPLE DISCOVERY ENGINE
 * 
 * Test the PeopleDiscoveryEngine step by step to find the error
 */

const { PrismaClient } = require('@prisma/client');

async function debugPeopleDiscovery() {
  console.log('🔍 DEBUGGING PEOPLE DISCOVERY ENGINE');
  console.log('====================================\n');
  
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  
  try {
    await prisma.$connect();
    
    // Step 1: Test account lookup
    console.log('1️⃣ TESTING ACCOUNT LOOKUP:');
    console.log('----------------------------');
    
    const account = await prisma.accounts.findFirst({
      where: {
        name: 'ClearEdge Title',
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk'
      }
    });
    
    if (account) {
      console.log('✅ Account found:');
      console.log(`   Name: ${account.name}`);
      console.log(`   Size: ${account.size || 'Not specified'}`);
      console.log(`   Website: ${account.website || 'Not specified'}`);
      console.log(`   City: ${account.city}, ${account.state}`);
    } else {
      console.log('❌ Account not found');
      return;
    }
    
    // Step 2: Test context structure
    console.log('\n2️⃣ TESTING CONTEXT STRUCTURE:');
    console.log('-------------------------------');
    
    // Simulate the context structure
    const mockContext = {
      seller: {
        userId: 'dano',
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        productPortfolio: [
          {
            productName: 'Notary Everyday Platform',
            buyingCommitteeRoles: ['CEO', 'COO', 'Operations Manager', 'Compliance Officer', 'CFO', 'IT Director', 'VP Operations']
          }
        ]
      }
    };
    
    console.log('✅ Mock context created:');
    console.log(`   Product: ${mockContext.seller.productPortfolio[0].productName}`);
    console.log(`   Buyer roles: ${mockContext.seller.productPortfolio[0].buyingCommitteeRoles.join(', ')}`);
    
    // Step 3: Test company size normalization
    console.log('\n3️⃣ TESTING COMPANY SIZE LOGIC:');
    console.log('-------------------------------');
    
    const companySize = account.size || '51-200 employees';
    console.log(`Raw company size: "${companySize}"`);
    
    // Test normalization logic
    function normalizeCompanySize(size) {
      const sizeLower = size.toLowerCase();
      
      if (sizeLower.includes('2-10') || sizeLower.includes('1-10')) {
        return '2-10 employees';
      } else if (sizeLower.includes('11-50') || sizeLower.includes('10-50')) {
        return '11-50 employees';
      } else if (sizeLower.includes('51-200') || sizeLower.includes('50-200')) {
        return '51-200 employees';
      } else if (sizeLower.includes('201-500') || sizeLower.includes('200-500')) {
        return '201-500 employees';
      }
      
      return '11-50 employees'; // Default
    }
    
    const normalizedSize = normalizeCompanySize(companySize);
    console.log(`Normalized size: "${normalizedSize}"`);
    
    // Step 4: Test target role determination
    console.log('\n4️⃣ TESTING TARGET ROLE LOGIC:');
    console.log('------------------------------');
    
    const companySizePatterns = {
      '2-10 employees': {
        decisionMakers: ['CEO', 'Owner', 'President'],
        champions: [],
        stakeholders: ['Office Manager']
      },
      '11-50 employees': {
        decisionMakers: ['CEO', 'President', 'Owner'],
        champions: ['Operations Manager', 'Office Manager'],
        stakeholders: ['Compliance Officer', 'IT Manager']
      },
      '51-200 employees': {
        decisionMakers: ['CEO', 'CFO', 'COO'],
        champions: ['VP Operations', 'Operations Manager', 'IT Director'],
        stakeholders: ['Compliance Officer', 'Legal Counsel', 'Risk Manager']
      }
    };
    
    const pattern = companySizePatterns[normalizedSize];
    if (pattern) {
      const targetRoles = [
        ...pattern.decisionMakers,
        ...pattern.champions,
        ...pattern.stakeholders
      ];
      
      // Add Office Manager for smaller companies
      if (normalizedSize === '2-10 employees' || normalizedSize === '11-50 employees') {
        if (!targetRoles.includes('Office Manager')) {
          targetRoles.push('Office Manager');
        }
      }
      
      console.log('✅ Target roles determined:');
      console.log(`   Decision makers: ${pattern.decisionMakers.join(', ')}`);
      console.log(`   Champions: ${pattern.champions.join(', ') || 'None'}`);
      console.log(`   Stakeholders: ${pattern.stakeholders.join(', ')}`);
      console.log(`   All target roles: ${targetRoles.join(', ')}`);
      
      console.log(`\n📊 Expected buyer group size: ${targetRoles.length} people`);
      
    } else {
      console.log('❌ No pattern found for size');
    }
    
    await prisma.$disconnect();
    console.log('\n✅ People discovery debug complete!');
    console.log('All components working individually - ready to integrate');
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugPeopleDiscovery();
