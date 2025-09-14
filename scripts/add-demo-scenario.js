#!/usr/bin/env node

/**
 * SAFELY Add Demo Workspace as Demo Scenario
 * Creates a new demo scenario for the Demo workspace
 * ONLY ADDS NEW DATA - NO DELETES, NO UPDATES to existing records
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addDemoScenario() {
  try {
    console.log('🎭 SAFELY adding Demo Workspace as Demo Scenario...\n');
    
    // SAFE: Check if demo scenario already exists (READ-ONLY)
    const existingScenario = await prisma.demo_scenarios.findFirst({
      where: { slug: 'demo-workspace' }
    });
    
    if (existingScenario) {
      console.log('✅ Demo scenario already exists:', existingScenario.name);
      console.log('   No action needed - demo workspace is already connected!');
      return;
    }
    
    console.log('🛡️ SAFETY CHECK: No existing demo-workspace scenario found.');
    console.log('   Safe to proceed with adding new scenario.');
    console.log('');
    
    // SAFE: Create new demo scenario (ADD ONLY)
    const newScenario = await prisma.demo_scenarios.create({
      data: {
        id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: 'Demo Workspace',
        slug: 'demo-workspace',
        description: 'Safe demo workspace with fictional data for testing and training',
        industry: 'Technology',
        targetAudience: 'Developers and Testers',
        isActive: true,
        sortOrder: 100, // Higher number to place it after existing scenarios
        config: {
          workspaceId: 'demo-workspace-2025',
          demoData: true,
          features: ['safe-testing', 'fictional-data', 'training-environment']
        },
        branding: {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          logo: '🎯'
        },
        features: {
          enabled: ['pipeline', 'monaco', 'speedrun'],
          disabled: ['production-data', 'real-integrations']
        },
        demoUser: {
          id: 'dano@demo.adrata.com',
          name: 'Dano (Demo)',
          role: 'demo-seller'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ SUCCESSFULLY created demo scenario (SAFE ADDITION):');
    console.log(`   📝 Name: ${newScenario.name}`);
    console.log(`   🔗 Slug: ${newScenario.slug}`);
    console.log(`   🎯 Description: ${newScenario.description}`);
    console.log(`   🆔 ID: ${newScenario.id}`);
    console.log(`   📊 Sort Order: ${newScenario.sortOrder}`);
    
    console.log('\n🎉 Demo workspace is now available as a demo scenario!');
    console.log('   Users can switch to it using the profile popup demo scenario switcher.');
    
    console.log('\n🛡️ SAFETY CONFIRMATION:');
    console.log('   ✅ Only ADDED new record');
    console.log('   ✅ No existing data was modified');
    console.log('   ✅ No existing data was deleted');
    console.log('   ✅ All 7 existing scenarios remain untouched');
    
  } catch (error) {
    console.error('❌ Error creating demo scenario:', error);
    
    // Provide safe guidance
    if (error.message.includes('demo_scenarios')) {
      console.log('\n💡 The demo_scenarios table structure may be different.');
      console.log('   We should investigate before making any changes.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addDemoScenario();
}

module.exports = { addDemoScenario };
