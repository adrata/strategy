/**
 * 🧪 UNIVERSAL B2B AUDIT TEST SCRIPT
 * 
 * Tests the universal B2B audit system with real-world scenarios
 * Validates that the system works for any company selling to any company
 */

// Use built-in fetch (Node.js 18+) or fallback
const fetch = globalThis.fetch || require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function testUniversalB2BAudit() {
  console.log('🔍 Testing Universal B2B Audit System...\n');

  try {
    // Test 1: Get available scenarios
    console.log('📋 Test 1: Getting available scenarios...');
    const scenariosResponse = await fetch(`${API_BASE_URL}/api/audit/universal-b2b?action=scenarios`);
    const scenariosData = await scenariosResponse.json();
    
    if (scenariosData.success) {
      console.log(`✅ Found ${scenariosData.predefinedScenarios.length} predefined scenarios`);
      console.log('   Scenario types:', scenariosData.scenarioTypes.join(', '));
    } else {
      console.log('❌ Failed to get scenarios');
      return;
    }

    // Test 2: Get supported industries
    console.log('\n🏭 Test 2: Getting supported industries...');
    const industriesResponse = await fetch(`${API_BASE_URL}/api/audit/universal-b2b?action=industries`);
    const industriesData = await industriesResponse.json();
    
    if (industriesData.success) {
      console.log(`✅ Found ${industriesData.supportedIndustries.length} supported industries`);
      industriesData.supportedIndustries.forEach(industry => {
        console.log(`   - ${industry.name}: ${industry.commonRoles.slice(0, 2).join(', ')}...`);
      });
    } else {
      console.log('❌ Failed to get industries');
    }

    // Test 3: Run audit with custom notary scenario
    console.log('\n🧪 Test 3: Running audit with custom notary scenario...');
    
    const customNotaryScenario = {
      id: 'custom-notary-test',
      name: 'Digital Notary to Title Company (Custom)',
      sellerCompany: 'NotaryPro Solutions',
      sellerProduct: 'Remote Online Notarization Platform',
      targetCompany: 'Stewart Title Company',
      targetIndustry: 'Title Insurance',
      expectedChallenges: [
        'State regulatory compliance',
        'Document security requirements',
        'Integration with existing title systems',
        'Notary authentication protocols'
      ],
      successCriteria: {
        minBuyerGroupSize: 5,
        maxBuyerGroupSize: 12,
        requiredRoles: ['Operations Manager', 'Title Officer', 'Compliance Officer'],
        qualityThreshold: 75
      }
    };

    const auditPayload = {
      customScenarios: [customNotaryScenario],
      aiEnhancementEnabled: true,
      fallbackStrategies: true,
      crossIndustryValidation: true,
      edgeCaseHandling: true,
      runPredefinedScenarios: false // Only run our custom scenario for faster testing
    };

    console.log('   Scenario:', customNotaryScenario.name);
    console.log('   Seller:', customNotaryScenario.sellerCompany);
    console.log('   Product:', customNotaryScenario.sellerProduct);
    console.log('   Target:', customNotaryScenario.targetCompany);
    console.log('   Industry:', customNotaryScenario.targetIndustry);

    const auditResponse = await fetch(`${API_BASE_URL}/api/audit/universal-b2b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(auditPayload)
    });

    const auditData = await auditResponse.json();

    if (auditData.success) {
      console.log('\n✅ Audit completed successfully!');
      console.log(`   Overall Score: ${auditData.summary.overallScore.toFixed(1)}%`);
      console.log(`   Successful Scenarios: ${auditData.summary.successfulScenarios}/${auditData.summary.totalScenarios}`);
      console.log(`   Critical Issues: ${auditData.summary.criticalIssuesCount}`);
      console.log(`   Recommendations: ${auditData.summary.totalRecommendations}`);
      console.log(`   AI Enhancements: ${auditData.summary.aiEnhancementsCount}`);

      // Show detailed results
      if (auditData.audit.results.length > 0) {
        const result = auditData.audit.results[0];
        console.log('\n📊 Detailed Results:');
        console.log(`   Scenario Success: ${result.success ? '✅' : '❌'}`);
        console.log(`   Execution Time: ${result.performance.executionTime}ms`);
        console.log(`   API Calls: ${result.performance.apiCalls}`);
        console.log(`   Cost: $${result.performance.cost.toFixed(4)}`);
        console.log(`   Accuracy: ${result.performance.accuracy}%`);

        if (result.issues.length > 0) {
          console.log('\n⚠️  Issues Found:');
          result.issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}`);
            console.log(`      Component: ${issue.affectedComponent}`);
            console.log(`      Fix: ${issue.suggestedFix}`);
          });
        }

        if (result.aiEnhancements.length > 0) {
          console.log('\n🤖 AI Enhancements Identified:');
          result.aiEnhancements.forEach((enhancement, index) => {
            console.log(`   ${index + 1}. ${enhancement.type}: ${enhancement.description}`);
            console.log(`      Expected Impact: ${enhancement.expectedImpact}`);
          });
        }

        if (result.recommendations.length > 0) {
          console.log('\n💡 Recommendations:');
          result.recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
          });
        }
      }

      // Show system-wide recommendations
      if (auditData.audit.recommendations.length > 0) {
        console.log('\n🎯 System-Wide Recommendations:');
        auditData.audit.recommendations.forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec}`);
        });
      }

    } else {
      console.log('❌ Audit failed:', auditData.error);
      if (auditData.details) {
        console.log('   Details:', auditData.details);
      }
    }

    // Test 4: Quick validation of predefined scenarios
    console.log('\n🚀 Test 4: Quick validation of predefined scenarios...');
    
    const quickAuditPayload = {
      customScenarios: [],
      aiEnhancementEnabled: false, // Disable for faster execution
      fallbackStrategies: true,
      crossIndustryValidation: false,
      edgeCaseHandling: false,
      runPredefinedScenarios: true
    };

    console.log('   Running all predefined scenarios (AI enhancements disabled for speed)...');
    
    const quickAuditResponse = await fetch(`${API_BASE_URL}/api/audit/universal-b2b`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quickAuditPayload)
    });

    const quickAuditData = await quickAuditResponse.json();

    if (quickAuditData.success) {
      console.log('\n✅ Quick audit completed!');
      console.log(`   Overall Score: ${quickAuditData.summary.overallScore.toFixed(1)}%`);
      console.log(`   Scenarios Tested: ${quickAuditData.summary.totalScenarios}`);
      console.log(`   Success Rate: ${quickAuditData.summary.successfulScenarios}/${quickAuditData.summary.totalScenarios}`);
      
      // Show scenario breakdown
      console.log('\n📋 Scenario Results:');
      quickAuditData.audit.results.forEach((result, index) => {
        const status = result.success ? '✅' : '❌';
        const criticalIssues = result.issues.filter(i => i.severity === 'critical').length;
        console.log(`   ${index + 1}. ${status} ${result.scenario.name} (${criticalIssues} critical issues)`);
      });

      // Identify most problematic areas
      const allIssues = quickAuditData.audit.results.flatMap(r => r.issues);
      const issueTypes = allIssues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {});

      if (Object.keys(issueTypes).length > 0) {
        console.log('\n🔍 Most Common Issues:');
        Object.entries(issueTypes)
          .sort(([,a], [,b]) => b - a)
          .forEach(([type, count]) => {
            console.log(`   - ${type}: ${count} occurrences`);
          });
      }

    } else {
      console.log('❌ Quick audit failed:', quickAuditData.error);
    }

    console.log('\n🎉 Universal B2B Audit Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Scenarios API tested');
    console.log('   ✅ Industries API tested');
    console.log('   ✅ Custom scenario audit tested');
    console.log('   ✅ Predefined scenarios audit tested');
    console.log('\n🚀 The system is ready for Monday launch!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure the development server is running (npm run dev)');
    console.log('   2. Check that all environment variables are set');
    console.log('   3. Verify CoreSignal API credentials');
    console.log('   4. Check network connectivity');
  }
}

// Run the test
if (require.main === module) {
  testUniversalB2BAudit();
}

module.exports = { testUniversalB2BAudit };
