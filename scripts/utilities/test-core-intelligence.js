#!/usr/bin/env node

/**
 * 🧪 TEST CORE INTELLIGENCE API
 * 
 * Simple test to confirm our Core buyer group analysis works
 */

const testCoreIntelligence = async () => {
  console.log('🧪 Testing Core Intelligence API...\n');
  
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${baseUrl}/api/intelligence`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'operational') {
      console.log('✅ Health Check: PASSED');
      console.log(`   Version: ${healthData.version}`);
      console.log(`   Capabilities: ${healthData.capabilities.length}`);
    } else {
      console.log('❌ Health Check: FAILED');
      console.log('   Response:', healthData);
    }
    
    console.log('\n');
    
    // Test 2: Context Loading (without target company)
    console.log('2️⃣ Testing Context Loading...');
    const contextResponse = await fetch(`${baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'dan',
        workspaceId: 'adrata'
      })
    });
    
    const contextData = await contextResponse.json();
    
    if (contextData.success) {
      console.log('✅ Context Loading: PASSED');
      console.log(`   Seller Profile: ${contextData.context.seller.hasProfile ? 'Found' : 'Missing'}`);
      console.log(`   Product Portfolio: ${contextData.context.seller.hasProducts ? contextData.context.seller.productCount + ' products' : 'Missing'}`);
      console.log(`   Context Completeness: ${contextData.context.seller.completeness}%`);
      console.log(`   Analysis Type: ${contextData.analysis.type}`);
    } else {
      console.log('❌ Context Loading: FAILED');
      console.log('   Error:', contextData.error);
    }
    
    console.log('\n');
    
    // Test 3: Buyer Group Analysis
    console.log('3️⃣ Testing Buyer Group Analysis...');
    const buyerGroupResponse = await fetch(`${baseUrl}/api/intelligence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'dan',
        workspaceId: 'adrata',
        targetCompany: 'Dell'
      })
    });
    
    const buyerGroupData = await buyerGroupResponse.json();
    
    if (buyerGroupData.success && buyerGroupData.buyerGroup) {
      console.log('✅ Buyer Group Analysis: PASSED');
      console.log(`   Company: ${buyerGroupData.buyerGroup.companyName}`);
      console.log(`   Product Context: ${buyerGroupData.buyerGroup.productContext}`);
      console.log(`   Primary Contact: ${buyerGroupData.buyerGroup.primaryContact}`);
      console.log(`   Confidence: ${buyerGroupData.buyerGroup.confidence}%`);
      console.log(`   Roles Identified: ${buyerGroupData.buyerGroup.roles.length}`);
      console.log(`   Strategy: ${buyerGroupData.buyerGroup.strategy}`);
      console.log('\n   🎯 Buyer Group Roles:');
      buyerGroupData.buyerGroup.roles.forEach(role => {
        console.log(`      • ${role.role} (${role.importance}) - ${role.reasoning}`);
      });
    } else if (buyerGroupData.success && !buyerGroupData.buyerGroup) {
      console.log('⚠️ Buyer Group Analysis: SKIPPED');
      console.log(`   Reason: ${buyerGroupData.analysis.nextSteps.join(', ')}`);
      console.log(`   Missing: ${buyerGroupData.context.validation.missing.join(', ')}`);
    } else {
      console.log('❌ Buyer Group Analysis: FAILED');
      console.log('   Error:', buyerGroupData.error);
    }
    
    console.log('\n');
    
    // Test 4: Performance Check
    console.log('4️⃣ Performance Summary:');
    if (buyerGroupData.metadata) {
      console.log(`   Total Processing Time: ${buyerGroupData.metadata.processingTimeMs}ms`);
      if (buyerGroupData.buyerGroup) {
        console.log(`   Buyer Analysis Time: ${buyerGroupData.buyerGroup.analysisTimeMs}ms`);
      }
      console.log(`   Performance: ${buyerGroupData.metadata.processingTimeMs < 1000 ? '🚀 Fast' : buyerGroupData.metadata.processingTimeMs < 2000 ? '⚡ Good' : '🐌 Slow'}`);
    }
    
  } catch (error) {
    console.error('❌ Test Failed:', error.message);
    console.error('   Make sure the development server is running: npm run dev');
  }
  
  console.log('\n🏁 Core Intelligence API Test Complete!');
};

// Run the test
testCoreIntelligence();
