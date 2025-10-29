/**
 * Test Enhanced Buyer Group Pipeline
 * 
 * Tests the enhanced pipeline with AI integration and database persistence
 * using Openprise as a known good test case.
 */

const { PrismaClient } = require('@prisma/client');
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index');
const fs = require('fs');
const path = require('path');

async function testEnhancedPipeline() {
  console.log('🧪 Testing Enhanced Buyer Group Pipeline with Openprise');
  console.log('='.repeat(60));

  const prisma = new PrismaClient();
  
  try {
    // Test configuration
    const pipeline = new SmartBuyerGroupPipeline({
      prisma: prisma,
      workspaceId: '01K7464TNANHQXPCZT1FYX205V', // Adrata workspace ID
      targetCompany: 'https://www.openprisetech.com/',
      dealSize: 150000,
      productCategory: 'sales'
    });

    // Validate configuration
    const validation = pipeline.validateConfiguration();
    console.log('🔍 Configuration validation:', validation);
    
    if (!validation.isValid) {
      throw new Error(`Configuration invalid: ${validation.issues.join(', ')}`);
    }

    console.log('\n🚀 Starting enhanced pipeline...');
    console.log(`🤖 AI Reasoning: ${process.env.ANTHROPIC_API_KEY ? 'Enabled' : 'Disabled'}`);
    
    const startTime = Date.now();
    const result = await pipeline.run();
    const processingTime = Date.now() - startTime;

    console.log('\n✅ Pipeline completed successfully!');
    console.log('='.repeat(60));
    
    // Display results
    console.log('\n📊 Results Summary:');
    console.log(`   👥 Buyer Group Size: ${result.buyerGroup.length} members`);
    console.log(`   🎯 Decision Makers: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'decision').length}`);
    console.log(`   🏆 Champions: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'champion').length}`);
    console.log(`   👥 Stakeholders: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'stakeholder').length}`);
    console.log(`   🚫 Blockers: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'blocker').length}`);
    console.log(`   🤝 Introducers: ${result.buyerGroup.filter(m => m.buyerGroupRole === 'introducer').length}`);
    
    console.log(`\n📈 Quality Metrics:`);
    console.log(`   📊 Cohesion Score: ${result.cohesion?.score || 0}%`);
    console.log(`   🎯 Overall Confidence: ${result.report?.qualityMetrics?.averageConfidence || 0}%`);
    console.log(`   ⏱️ Processing Time: ${processingTime}ms`);
    console.log(`   💰 Total Cost: $${result.costs?.total?.toFixed(2) || '0.00'}`);

    // Display buyer group members
    console.log('\n👥 Buyer Group Members:');
    result.buyerGroup.forEach((member, index) => {
      console.log(`   ${index + 1}. ${member.name}`);
      console.log(`      Title: ${member.title}`);
      console.log(`      Department: ${member.department}`);
      console.log(`      Role: ${member.buyerGroupRole}`);
      console.log(`      Relevance: ${Math.round((member.relevance || 0) * 100)}%`);
      console.log(`      Influence: ${member.scores?.influence || 0}/10`);
      console.log(`      Department Fit: ${member.scores?.departmentFit || 0}/10`);
      if (member.aiReasoning) {
        console.log(`      🤖 AI Reasoning: ${member.aiReasoning}`);
      }
      if (member.aiRoleReasoning) {
        console.log(`      🤖 AI Role Reasoning: ${member.aiRoleReasoning}`);
      }
      console.log('');
    });

    // Check for Customer Success exclusion
    const customerSuccessMembers = result.buyerGroup.filter(member => 
      member.department?.toLowerCase().includes('customer success') && 
      !member.title?.toLowerCase().includes('sales')
    );

    if (customerSuccessMembers.length === 0) {
      console.log('✅ Customer Success Exclusion: Working correctly - no non-sales Customer Success members found');
    } else {
      console.log(`⚠️ Customer Success Exclusion: Found ${customerSuccessMembers.length} non-sales Customer Success members:`);
      customerSuccessMembers.forEach(member => {
        console.log(`   - ${member.name} (${member.title})`);
      });
    }

    // Database verification
    console.log('\n🗄️ Database Verification:');
    try {
      const recentBuyerGroup = await prisma.buyerGroups.findFirst({
        where: { workspaceId: 'adrata-workspace-id' },
        orderBy: { createdAt: 'desc' }
      });

      if (recentBuyerGroup) {
        console.log(`   ✅ Buyer Group Record: ${recentBuyerGroup.id}`);
        console.log(`      Company: ${recentBuyerGroup.companyName}`);
        console.log(`      Members: ${recentBuyerGroup.totalMembers}`);
        console.log(`      Cohesion: ${recentBuyerGroup.cohesionScore}%`);
        console.log(`      AI Enabled: ${recentBuyerGroup.metadata?.aiEnabled ? 'Yes' : 'No'}`);
      } else {
        console.log('   ⚠️ No buyer group record found in database');
      }

      const peopleRecords = await prisma.people.findMany({
        where: { 
          workspaceId: 'adrata-workspace-id',
          isBuyerGroupMember: true
        },
        take: 5
      });

      console.log(`   ✅ People Records: ${peopleRecords.length} with buyer group flags`);
      peopleRecords.forEach(person => {
        console.log(`      - ${person.fullName}: ${person.buyerGroupRole} (Company: ${person.companyId ? 'Linked' : 'Not Linked'})`);
      });

    } catch (error) {
      console.log(`   ❌ Database verification failed: ${error.message}`);
    }

    // Save detailed results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `enhanced-pipeline-test-${timestamp}.json`;
    const filepath = path.join(__dirname, 'buyer-group-results', filename);
    
    // Ensure directory exists
    const dir = path.dirname(filepath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const resultData = {
      testType: 'enhanced-pipeline',
      timestamp: new Date().toISOString(),
      processingTime,
      aiEnabled: !!process.env.ANTHROPIC_API_KEY,
      ...result
    };
    
    fs.writeFileSync(filepath, JSON.stringify(resultData, null, 2));
    console.log(`\n💾 Detailed results saved to: ${filename}`);

    return result;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testEnhancedPipeline()
    .then(() => {
      console.log('\n✅ Enhanced pipeline test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Enhanced pipeline test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testEnhancedPipeline };
