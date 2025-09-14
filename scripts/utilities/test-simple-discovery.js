#!/usr/bin/env node

/**
 * 🧪 TEST SIMPLE PEOPLE DISCOVERY
 */

const { PrismaClient } = require('@prisma/client');

async function testSimpleDiscovery() {
  console.log('🧪 TESTING SIMPLE PEOPLE DISCOVERY');
  console.log('===================================\n');
  
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    
    // Mock context
    const context = {
      seller: {
        workspaceId: 'cmezxb1ez0001pc94yry3ntjk',
        productPortfolio: [
          {
            buyingCommitteeRoles: ['CEO', 'COO', 'Operations Manager', 'CFO']
          }
        ]
      }
    };
    
    // Test account lookup
    const account = await prisma.accounts.findFirst({
      where: {
        name: 'ClearEdge Title',
        workspaceId: context.seller.workspaceId
      }
    });
    
    console.log('Account found:', !!account);
    if (account) {
      console.log('  Name:', account.name);
      console.log('  Size:', account.size);
    }
    
    // Test role determination
    function getTargetRolesBySize(companySize) {
      const sizeLower = companySize.toLowerCase();
      
      if (sizeLower.includes('51-200')) {
        return ['CEO', 'CFO', 'COO', 'Operations Manager', 'Compliance Officer'];
      }
      
      return ['CEO', 'Operations Manager'];
    }
    
    const targetRoles = getTargetRolesBySize(account?.size || '51-200 employees');
    console.log('Target roles:', targetRoles);
    
    // Test person creation
    function createSimplePerson(role, companyName) {
      return {
        name: `John Smith`,
        title: role,
        email: `john.smith@${companyName.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        buyerGroupRole: role === 'CEO' ? 'decision_maker' : 'champion',
        reasoning: 'Test person',
        confidence: 80
      };
    }
    
    const people = targetRoles.map(role => createSimplePerson(role, 'ClearEdge Title'));
    console.log('People created:', people.length);
    
    people.forEach(person => {
      console.log(`  - ${person.name} (${person.title}) - ${person.buyerGroupRole}`);
    });
    
    await prisma.$disconnect();
    console.log('\n✅ Simple discovery test complete!');
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testSimpleDiscovery();
