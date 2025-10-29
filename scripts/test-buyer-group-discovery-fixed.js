/**
 * Test Buyer Group Discovery System - Fixed Version
 * 
 * Tests the buyer group discovery pipeline with a real company
 * Saves results to file instead of database to avoid schema issues
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Import the buyer group discovery modules
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index');

class BuyerGroupDiscoveryTester {
  constructor() {
    this.resultsDir = path.join(__dirname, 'buyer-group-results');
    this.ensureResultsDir();
  }

  ensureResultsDir() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  async testWithCompany(companyName, website, dealSize = 150000) {
    console.log('🚀 Testing Buyer Group Discovery System');
    console.log(`📊 Company: ${companyName}`);
    console.log(`🌐 Website: ${website}`);
    console.log(`💰 Deal Size: $${dealSize.toLocaleString()}`);
    console.log('─'.repeat(60));

    try {
      // Initialize the pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        targetCompany: website, // Use website as identifier
        dealSize: dealSize,
        productCategory: 'sales', // Buyer group intelligence is sales software
        workspaceId: '01K7464TNANHQXPCZT1FYX205V' // Adrata workspace ID
      });

      // Validate configuration
      const validation = pipeline.validateConfiguration();
      if (!validation.isValid) {
        console.error('❌ Configuration validation failed:');
        validation.issues.forEach(issue => console.error(`   - ${issue}`));
        return null;
      }

      console.log('✅ Configuration valid, starting pipeline...\n');

      // Run the pipeline but skip database persistence
      const result = await this.runPipelineWithoutDatabase(pipeline);

      if (!result) {
        console.log('❌ Pipeline failed to produce results');
        return null;
      }

      // Save results to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `buyer-group-${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.json`;
      const filepath = path.join(this.resultsDir, filename);

      const output = {
        metadata: {
          companyName,
          website,
          dealSize,
          timestamp: new Date().toISOString(),
          pipelineVersion: '2.0.0'
        },
        result
      };

      fs.writeFileSync(filepath, JSON.stringify(output, null, 2));
      console.log(`\n💾 Results saved to: ${filepath}`);

      // Display summary
      this.displaySummary(result, companyName);

      return result;

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error(error.stack);
      throw error;
    }
  }

  async runPipelineWithoutDatabase(pipeline) {
    console.log('🚀 Smart Buyer Group Discovery Pipeline Starting...');
    console.log(`📊 Target: ${pipeline.targetCompany} | Deal Size: $${pipeline.dealSize.toLocaleString()}`);
    
    try {
      // Stage 1: Company Intelligence
      const intelligence = await pipeline.executeStage('company-intelligence', async () => {
        return await pipeline.companyIntel.research(pipeline.targetCompany);
      });
      
      const params = pipeline.companyIntel.calculateOptimalParameters(intelligence, pipeline.dealSize);
      
      // Stage 2: Wide Preview Search (cheap)
      const previewEmployees = await pipeline.executeStage('preview-search', async () => {
        return await pipeline.previewSearch.discoverAllStakeholders(
          {
            linkedinUrl: intelligence.linkedinUrl,
            website: intelligence.website,
            companyName: intelligence.companyName
          },
          params.maxPreviewPages
        );
      });
      
      pipeline.pipelineState.totalEmployees = previewEmployees.length;
      pipeline.pipelineState.costs.preview = previewEmployees.length * 0.1; // $0.10 per preview
      
      // Stage 3: Smart Scoring & Filtering (free)
      const scoredEmployees = await pipeline.executeStage('smart-scoring', async () => {
        const scoring = new (require('../_future_now/find-buyer-group/smart-scoring').SmartScoring)(intelligence, pipeline.dealSize, pipeline.productCategory);
        return scoring.scoreEmployees(previewEmployees);
      });
      
      // Lower the threshold to get more candidates
      const relevantEmployees = scoredEmployees.filter(emp => 
        emp.relevance > 0.05 && emp.scores.influence > 1 // Lowered thresholds
      );
      
      console.log(`🎯 Filtered to ${relevantEmployees.length} relevant candidates`);
      
      // Stage 4: Role Assignment (free)
      const employeesWithRoles = await pipeline.executeStage('role-assignment', async () => {
        const roleAssignment = new (require('../_future_now/find-buyer-group/role-assignment').RoleAssignment)(
          pipeline.dealSize, 
          intelligence?.revenue || 0, 
          intelligence?.employees || 0
        );
        return roleAssignment.assignRoles(relevantEmployees);
      });
      
      // Stage 5: Select Optimal Group (free)
      const initialBuyerGroup = await pipeline.executeStage('group-selection', async () => {
        const roleAssignment = new (require('../_future_now/find-buyer-group/role-assignment').RoleAssignment)(
          pipeline.dealSize, 
          intelligence?.revenue || 0, 
          intelligence?.employees || 0
        );
        return roleAssignment.selectOptimalBuyerGroup(employeesWithRoles, params.buyerGroupSize);
      });
      
      // Stage 6: Cross-Functional Coverage (free)
      const { enhanced: crossFunctionalGroup, coverage } = await pipeline.executeStage('cross-functional', async () => {
        const crossFunctional = new (require('../_future_now/find-buyer-group/cross-functional').CrossFunctionalCoverage)(pipeline.dealSize);
        return crossFunctional.validate(initialBuyerGroup, relevantEmployees);
      });
      
      // Stage 7: Collect Full Profiles (expensive - only for final group)
      const enrichedBuyerGroup = await pipeline.executeStage('profile-collection', async () => {
        console.log(`🔍 Debug: crossFunctionalGroup =`, crossFunctionalGroup ? crossFunctionalGroup.length : 'undefined');
        console.log(`🔍 Debug: initialBuyerGroup =`, initialBuyerGroup ? initialBuyerGroup.length : 'undefined');
        const groupToEnrich = crossFunctionalGroup || initialBuyerGroup || [];
        console.log(`🔍 Debug: groupToEnrich =`, groupToEnrich.length);
        return await pipeline.collectFullProfiles(groupToEnrich);
      });
      
      pipeline.pipelineState.costs.collect = enrichedBuyerGroup.length * 1.0; // $1.00 per collect
      pipeline.pipelineState.costs.total = pipeline.pipelineState.costs.preview + pipeline.pipelineState.costs.collect;
      
      // Stage 8: Cohesion Validation (free)
      const cohesion = await pipeline.executeStage('cohesion-validation', async () => {
        return pipeline.cohesionValidator.validate(enrichedBuyerGroup || []);
      });
      
      // Stage 9: Generate Research Report (free)
      const report = await pipeline.executeStage('report-generation', async () => {
        console.log(`🔍 Debug: enrichedBuyerGroup =`, enrichedBuyerGroup ? enrichedBuyerGroup.length : 'undefined');
        console.log(`🔍 Debug: enrichedBuyerGroup type =`, typeof enrichedBuyerGroup);
        console.log(`🔍 Debug: enrichedBuyerGroup || [] =`, (enrichedBuyerGroup || []).length);
        
        try {
          return pipeline.reportGenerator.generate({
            intelligence,
            previewEmployees,
            buyerGroup: enrichedBuyerGroup || [],
            coverage,
            cohesion,
            costs: pipeline.pipelineState.costs,
            dealSize: pipeline.dealSize,
            companyName: intelligence.companyName || require('../_future_now/find-buyer-group/utils').extractDomain(pipeline.targetCompany),
            searchParameters: params
          });
        } catch (error) {
          console.error(`❌ Report generation error:`, error.message);
          console.error(`❌ Error stack:`, error.stack);
          throw error;
        }
      });
      
      // Skip database persistence - just return results
      pipeline.pipelineState.finalBuyerGroup = enrichedBuyerGroup;
      pipeline.pipelineState.stage = 'completed';
      
      const processingTime = Date.now() - pipeline.pipelineState.startTime;
      
      console.log('✅ Pipeline completed successfully!');
      console.log(`⏱️ Processing time: ${processingTime}ms`);
      console.log(`💰 Total cost: $${pipeline.pipelineState.costs.total.toFixed(2)}`);
      console.log(`👥 Final buyer group: ${enrichedBuyerGroup.length} members`);
      console.log(`📊 Cohesion score: ${cohesion.score}%`);
      
      return {
        buyerGroup: enrichedBuyerGroup,
        report,
        cohesion,
        coverage,
        intelligence,
        costs: pipeline.pipelineState.costs,
        processingTime,
        pipelineState: pipeline.pipelineState,
        previewEmployees,
        scoredEmployees,
        relevantEmployees
      };
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error.message);
      pipeline.pipelineState.stage = 'failed';
      pipeline.pipelineState.error = error.message;
      throw error;
    }
  }

  displaySummary(result, companyName) {
    console.log('\n📊 Buyer Group Discovery Results:');
    console.log('─'.repeat(50));
    
    if (result.intelligence) {
      console.log(`🏢 Company: ${result.intelligence.companyName || companyName}`);
      console.log(`👥 Employees: ${result.intelligence.employeeCount || 'Unknown'}`);
      console.log(`💰 Revenue: $${(result.intelligence.revenue || 0).toLocaleString()}`);
      console.log(`🏷️  Tier: ${result.intelligence.tier || 'Unknown'}`);
    }
    
    console.log(`📋 Total Employees Found: ${result.previewEmployees?.length || 0}`);
    console.log(`🎯 Scored Employees: ${result.scoredEmployees?.length || 0}`);
    console.log(`🎯 Relevant Employees: ${result.relevantEmployees?.length || 0}`);
    console.log(`🎯 Buyer Group Size: ${result.buyerGroup?.length || 0}`);
    console.log(`💵 Total Cost: $${(result.costs?.total || 0).toFixed(2)}`);
    console.log(`⏱️  Processing Time: ${result.processingTime || 0}ms`);
    
    if (result.buyerGroup && result.buyerGroup.length > 0) {
      console.log('\n🎯 Buyer Group Members:');
      console.log('─'.repeat(50));
      
      const roleEmojis = {
        decision: '🏛️',
        champion: '🚀', 
        stakeholder: '📊',
        blocker: '🚫',
        introducer: '🤝'
      };
      
      result.buyerGroup.forEach((member, index) => {
        const roleEmoji = roleEmojis[member.buyerGroupRole] || '👤';
        const confidence = member.roleConfidence || 0;
        console.log(`${index + 1}. ${roleEmoji} ${member.name} - ${member.title}`);
        console.log(`   ${member.department} | ${member.buyerGroupRole.replace('_', ' ')} (${confidence}%)`);
        if (member.roleReasoning) {
          console.log(`   💭 ${member.roleReasoning}`);
        }
        console.log('');
      });
    } else {
      console.log('\n⚠️  No buyer group members found. This could be due to:');
      console.log('   - Very strict scoring thresholds');
      console.log('   - Limited employee data in Coresignal');
      console.log('   - Company size too small');
      console.log('   - Industry mismatch');
    }
    
    if (result.cohesion) {
      console.log(`📊 Cohesion Score: ${result.cohesion.score}%`);
    }
    
    if (result.coverage) {
      console.log(`📈 Coverage Analysis: ${JSON.stringify(result.coverage, null, 2)}`);
    }
  }
}

// Test function
async function runTest() {
  const tester = new BuyerGroupDiscoveryTester();
  
  // Test with Openprise (revenue operations company - perfect for buyer group intelligence)
  const testCompany = {
    name: 'Openprise',
    website: 'https://www.openprisetech.com/',
    dealSize: 150000 // $150K deal for buyer group intelligence software
  };

  try {
    await tester.testWithCompany(
      testCompany.name,
      testCompany.website,
      testCompany.dealSize
    );
    
    console.log('\n✅ Test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runTest();
}

module.exports = { BuyerGroupDiscoveryTester };
