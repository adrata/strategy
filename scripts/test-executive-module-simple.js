#!/usr/bin/env node

/**
 * 🧪 SIMPLE EXECUTIVE MODULE TEST
 * 
 * Direct test of ExecutiveResearchEnhanced to isolate the issue
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testExecutiveModuleSimple() {
  console.log('🧪 SIMPLE EXECUTIVE MODULE TEST');
  console.log('=' .repeat(50));
  
  try {
    console.log('📦 Step 1: Import modules...');
    
    // Test if we can import the modules
    const { ExecutiveResearchEnhanced } = require('../src/platform/intelligence/modules/ExecutiveResearchEnhanced.ts');
    console.log('✅ ExecutiveResearchEnhanced imported');
    
    const { RoleDetectionEngine } = require('../src/platform/intelligence/modules/RoleDetectionEngine.ts');
    console.log('✅ RoleDetectionEngine imported');
    
    console.log('');
    console.log('🏗️ Step 2: Create instances...');
    
    const config = {
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY?.replace(/\\n/g, '').trim(),
      RATE_LIMITS: { perplexity: 60 }
    };
    
    const researcher = new ExecutiveResearchEnhanced(config);
    console.log('✅ ExecutiveResearchEnhanced instance created');
    
    console.log('');
    console.log('🎯 Step 3: Test research method...');
    
    const result = await researcher.researchExecutives(
      'Stewart Title',
      'stewart.com', 
      ['CEO', 'CFO', 'COO', 'General_Counsel', 'President'],
      'test_session',
      {
        productCategory: 'Legal Technology',
        averageDealSize: 75000
      }
    );
    
    console.log('');
    console.log('📊 RESULT ANALYSIS:');
    console.log(`Type: ${typeof result}`);
    console.log(`Keys: ${Object.keys(result).join(', ')}`);
    console.log(`Executives array exists: ${!!result.executives}`);
    console.log(`Executives count: ${result.executives?.length || 0}`);
    console.log(`AllExecutives count: ${result.allExecutives?.length || 0}`);
    console.log(`Confidence: ${result.confidence}`);
    
    if (result.executives && result.executives.length > 0) {
      console.log('');
      console.log('🎉 SUCCESS! Executives found:');
      result.executives.forEach((exec, index) => {
        console.log(`${index + 1}. ${exec.name} (${exec.role})`);
        console.log(`   Title: ${exec.title}`);
        console.log(`   Confidence: ${exec.confidence}%`);
      });
    } else {
      console.log('❌ No executives in result');
      
      if (result.auditReport) {
        console.log('');
        console.log('📋 AUDIT REPORT:');
        console.log(result.auditReport);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack.substring(0, 1000));
    }
  }
}

// Run the test
if (require.main === module) {
  testExecutiveModuleSimple().catch(console.error);
}

module.exports = { testExecutiveModuleSimple };
