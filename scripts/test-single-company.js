#!/usr/bin/env node

/**
 * Test Single Company - Debug Buyer Group Pipeline
 * 
 * Run buyer group discovery for just 1 company with detailed error output
 */

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

// Test with Precisely (first company)
const TEST_COMPANY = {
  id: '01K8R6BCRESC33Z52V1QMN3BST',
  name: 'Precisely',
  website: 'https://www.precisely.com/',
  industry: 'Software'
};

async function testSingleCompany() {
  console.log('🧪 TESTING SINGLE COMPANY');
  console.log('========================');
  console.log(`Company: ${TEST_COMPANY.name}`);
  console.log(`Website: ${TEST_COMPANY.website}`);
  console.log('');

  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Initialize pipeline
    console.log('🚀 Initializing pipeline...');
    const pipeline = new SmartBuyerGroupPipeline({
      prisma: prisma,
      targetCompany: TEST_COMPANY.website,
      dealSize: 150000,
      productCategory: 'sales',
      workspaceId: '01K7464TNANHQXPCZT1FYX205V'
    });

    console.log('✅ Pipeline initialized');

    // Run pipeline with detailed error handling
    console.log('🚀 Starting pipeline execution...');
    console.log('');

    const result = await pipeline.run();

    console.log('');
    console.log('✅ PIPELINE COMPLETED SUCCESSFULLY!');
    console.log('==================================');
    console.log(`Buyer Group Size: ${result.buyerGroup?.length || 0} members`);
    console.log(`Total Cost: $${result.costs?.total || 0}`);
    console.log(`Processing Time: ${result.processingTime || 0}ms`);
    
    if (result.buyerGroup && result.buyerGroup.length > 0) {
      console.log('');
      console.log('👥 BUYER GROUP MEMBERS:');
      result.buyerGroup.forEach((member, index) => {
        console.log(`   ${index + 1}. ${member.name} (${member.title}) - ${member.buyerGroupRole}`);
      });
    }

  } catch (error) {
    console.error('');
    console.error('❌ PIPELINE FAILED');
    console.error('==================');
    console.error('Error:', error.message);
    console.error('');
    console.error('Stack Trace:');
    console.error(error.stack);
    
    // Check if it's a Prisma error
    if (error.message.includes('cached plan must not change result type')) {
      console.error('');
      console.error('🔧 PRISMA CACHE ERROR DETECTED');
      console.error('This is a PostgreSQL prepared statement cache issue.');
      console.error('Solution: Restart the database connection or use raw SQL.');
    }
    
    // Check if it's an AI error
    if (error.message.includes('Claude API error')) {
      console.error('');
      console.error('🤖 CLAUDE API ERROR DETECTED');
      console.error('Check your ANTHROPIC_API_KEY and model name.');
    }
    
  } finally {
    await prisma.$disconnect();
    console.log('');
    console.log('🔌 Database disconnected');
  }
}

// Run the test
testSingleCompany().catch(console.error);
