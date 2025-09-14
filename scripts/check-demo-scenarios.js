#!/usr/bin/env node

/**
 * SAFE READ-ONLY: Check Demo Scenarios
 * This script only READS data - NO DELETES, NO UPDATES
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDemoScenarios() {
  try {
    console.log('🔍 SAFELY checking demo scenarios (READ-ONLY)...\n');
    
    // SAFE: Only read data, no modifications
    const scenarios = await prisma.demo_scenarios.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    
    console.log(`📊 Found ${scenarios.length} existing demo scenarios:\n`);
    
    if (scenarios.length === 0) {
      console.log('   No demo scenarios found in database.');
      console.log('   This is safe - we can add new ones without affecting existing data.');
    } else {
      scenarios.forEach((scenario, index) => {
        console.log(`${index + 1}. ${scenario.name}`);
        console.log(`   🔗 Slug: ${scenario.slug}`);
        console.log(`   📝 Description: ${scenario.description}`);
        console.log(`   🎯 Industry: ${scenario.industry}`);
        console.log(`   👥 Target: ${scenario.targetAudience}`);
        console.log(`   ✅ Active: ${scenario.isActive}`);
        console.log(`   📊 Sort Order: ${scenario.sortOrder}`);
        console.log(`   🆔 ID: ${scenario.id}`);
        console.log('');
      });
    }
    
    // SAFE: Check if our demo workspace scenario already exists
    const existingDemo = scenarios.find(s => s.slug === 'demo-workspace');
    if (existingDemo) {
      console.log('✅ Demo workspace scenario already exists:');
      console.log(`   📝 Name: ${existingDemo.name}`);
      console.log(`   🔗 Slug: ${existingDemo.slug}`);
      console.log('   No action needed - demo workspace is already connected!');
    } else {
      console.log('❌ Demo workspace scenario NOT found.');
      console.log('   We can safely add it without affecting existing data.');
    }
    
    console.log('\n🛡️ SAFETY CHECK COMPLETE:');
    console.log('   ✅ Only READ operations performed');
    console.log('   ✅ No data was modified or deleted');
    console.log('   ✅ Existing scenarios are safe');
    
  } catch (error) {
    console.error('❌ Error checking demo scenarios:', error);
    console.log('\n💡 This might mean the table structure is different.');
    console.log('   We should investigate before making any changes.');
  } finally {
    await prisma.$disconnect();
  }
}

// Run the safe check
if (require.main === module) {
  checkDemoScenarios();
}

module.exports = { checkDemoScenarios };
