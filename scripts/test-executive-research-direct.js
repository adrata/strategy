#!/usr/bin/env node

/**
 * 🎯 DIRECT EXECUTIVE RESEARCH TEST
 * 
 * Tests ExecutiveResearchEnhanced module directly to isolate the issue
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testExecutiveResearchDirect() {
  console.log('🎯 DIRECT EXECUTIVE RESEARCH TEST');
  console.log('=' .repeat(60));
  console.log('Testing ExecutiveResearchEnhanced module directly');
  console.log('');

  try {
    // Import the module (TypeScript)
    const { ExecutiveResearchEnhanced } = await import('../src/platform/intelligence/modules/ExecutiveResearchEnhanced.ts');
    
    console.log('✅ Module imported successfully');
    
    // Create instance
    const researcher = new ExecutiveResearchEnhanced({
      PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY?.replace(/\\n/g, '').trim(),
      RATE_LIMITS: {
        perplexity: 60
      }
    });
    
    console.log('✅ Instance created successfully');
    
    // Test with Stewart Title
    console.log('');
    console.log('🏢 Testing Stewart Title...');
    
    const result = await researcher.researchExecutives(
      'Stewart Title',
      'stewart.com',
      ['CEO', 'CFO', 'COO', 'President', 'General_Counsel'],
      'test_session',
      {
        productCategory: 'Legal Technology',
        averageDealSize: 75000
      }
    );
    
    console.log('');
    console.log('📊 DIRECT TEST RESULTS:');
    console.log(`Type: ${typeof result}`);
    console.log(`Keys: ${Object.keys(result).join(', ')}`);
    
    if (result.executives) {
      console.log(`✅ Executives array found: ${result.executives.length} executives`);
      
      result.executives.forEach((exec, index) => {
        console.log(`${index + 1}. ${exec.name} (${exec.role})`);
        console.log(`   Title: ${exec.title}`);
        console.log(`   Confidence: ${exec.confidence}%`);
        console.log(`   Source: ${exec.source}`);
      });
    } else {
      console.log('❌ No executives array in result');
      console.log('Result structure:', JSON.stringify(result, null, 2));
    }
    
    // Test legacy format check
    if (result.cfo) {
      console.log(`Legacy CFO found: ${result.cfo.name}`);
    }
    
    if (result.cro) {
      console.log(`Legacy CRO found: ${result.cro.name}`);
    }
    
  } catch (error) {
    console.error('❌ Direct test failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack:', error.stack?.substring(0, 500));
  }
}

// Run the test
if (require.main === module) {
  testExecutiveResearchDirect().catch(console.error);
}

module.exports = { testExecutiveResearchDirect };
