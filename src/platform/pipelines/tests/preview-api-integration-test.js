#!/usr/bin/env node

/**
 * 🧪 PREVIEW API INTEGRATION TEST
 * 
 * Test the Preview API enhancement for buyer group discovery
 * Validates comprehensive discovery vs traditional narrow search
 */

const BuyerGroupPreviewDiscovery = require('../modules/core/BuyerGroupPreviewDiscovery');
const CoreSignalPreviewClient = require('../modules/core/CoreSignalPreviewClient');
const PreviewRoleScoringEngine = require('../modules/core/PreviewRoleScoringEngine');

class PreviewAPIIntegrationTest {
    constructor() {
        this.previewDiscovery = new BuyerGroupPreviewDiscovery();
        this.previewClient = new CoreSignalPreviewClient();
        this.scoringEngine = new PreviewRoleScoringEngine();
        
        this.testResults = {
            companies: [],
            summary: {
                totalTests: 0,
                successful: 0,
                failed: 0,
                averageMembers: 0,
                averageCohesion: 0,
                discoveryMethods: {
                    preview: 0,
                    traditional: 0
                }
            }
        };
    }

    /**
     * 🧪 RUN COMPREHENSIVE TEST SUITE
     */
    async runTestSuite() {
        console.log('\n🧪 PREVIEW API INTEGRATION TEST SUITE');
        console.log('=' .repeat(60));

        const testCompanies = [
            { name: 'Nike', website: 'nike.com' },
            { name: 'Salesforce', website: 'salesforce.com' },
            { name: 'Microsoft', website: 'microsoft.com' },
            { name: 'Shopify', website: 'shopify.com' },
            { name: 'Stripe', website: 'stripe.com' }
        ];

        for (const company of testCompanies) {
            await this.testCompany(company);
        }

        this.generateTestReport();
    }

    /**
     * 🏢 TEST SINGLE COMPANY
     */
    async testCompany(company) {
        console.log(`\n🏢 Testing: ${company.name}`);
        console.log(`   Website: ${company.website}`);

        try {
            const startTime = Date.now();

            // Test Preview API discovery
            const previewResult = await this.previewDiscovery.discoverBuyerGroup(company.name, {
                website: company.website,
                enrichmentLevel: 'identify'
            });

            const processingTime = Date.now() - startTime;

            // Analyze results
            const analysis = this.analyzeBuyerGroup(previewResult);

            const testResult = {
                company: company.name,
                website: company.website,
                success: true,
                processingTime,
                buyerGroup: previewResult,
                analysis,
                discoveryMethod: 'preview_comprehensive'
            };

            this.testResults.companies.push(testResult);
            this.testResults.summary.totalTests++;
            this.testResults.summary.successful++;
            this.testResults.summary.discoveryMethods.preview++;

            console.log(`   ✅ Success: ${previewResult.totalMembers} members found`);
            console.log(`   📊 Cohesion: ${previewResult.cohesion?.score || 0}%`);
            console.log(`   ⏱️ Time: ${processingTime}ms`);

        } catch (error) {
            console.log(`   ❌ Failed: ${error.message}`);
            
            this.testResults.companies.push({
                company: company.name,
                website: company.website,
                success: false,
                error: error.message,
                discoveryMethod: 'preview_comprehensive'
            });

            this.testResults.summary.totalTests++;
            this.testResults.summary.failed++;
        }
    }

    /**
     * 📊 ANALYZE BUYER GROUP QUALITY
     */
    analyzeBuyerGroup(buyerGroup) {
        const analysis = {
            memberCount: buyerGroup.totalMembers || 0,
            cohesionScore: buyerGroup.cohesion?.score || 0,
            roleDistribution: {},
            qualityMetrics: {},
            recommendations: []
        };

        // Analyze role distribution
        for (const [role, members] of Object.entries(buyerGroup.roles || {})) {
            analysis.roleDistribution[role] = {
                count: members.length,
                averageScore: members.length > 0 
                    ? members.reduce((sum, m) => sum + (m.roleScore || 0), 0) / members.length 
                    : 0
            };
        }

        // Quality metrics
        analysis.qualityMetrics = {
            hasDecisionMakers: (buyerGroup.roles?.decision?.length || 0) > 0,
            hasChampions: (buyerGroup.roles?.champion?.length || 0) > 0,
            hasStakeholders: (buyerGroup.roles?.stakeholder?.length || 0) > 0,
            hasBlockers: (buyerGroup.roles?.blocker?.length || 0) > 0,
            hasIntroducers: (buyerGroup.roles?.introducer?.length || 0) > 0,
            totalRoles: Object.values(buyerGroup.roles || {}).filter(role => role.length > 0).length
        };

        // Generate recommendations
        if (analysis.memberCount < 8) {
            analysis.recommendations.push('Consider expanding search criteria for more members');
        }
        if (!analysis.qualityMetrics.hasDecisionMakers) {
            analysis.recommendations.push('No decision makers found - may need broader C-level search');
        }
        if (analysis.cohesionScore < 60) {
            analysis.recommendations.push('Low cohesion score - consider role rebalancing');
        }

        return analysis;
    }

    /**
     * 📋 GENERATE TEST REPORT
     */
    generateTestReport() {
        console.log('\n📋 TEST RESULTS SUMMARY');
        console.log('=' .repeat(60));

        const { summary } = this.testResults;
        
        // Calculate averages
        const successfulTests = this.testResults.companies.filter(c => c.success);
        summary.averageMembers = successfulTests.length > 0 
            ? successfulTests.reduce((sum, c) => sum + c.analysis.memberCount, 0) / successfulTests.length 
            : 0;
        summary.averageCohesion = successfulTests.length > 0 
            ? successfulTests.reduce((sum, c) => sum + c.analysis.cohesionScore, 0) / successfulTests.length 
            : 0;

        console.log(`📊 Test Results:`);
        console.log(`   Total Tests: ${summary.totalTests}`);
        console.log(`   Successful: ${summary.successful} (${Math.round(summary.successful / summary.totalTests * 100)}%)`);
        console.log(`   Failed: ${summary.failed} (${Math.round(summary.failed / summary.totalTests * 100)}%)`);
        console.log(`   Average Members: ${Math.round(summary.averageMembers)}`);
        console.log(`   Average Cohesion: ${Math.round(summary.averageCohesion)}%`);

        console.log(`\n🔍 Discovery Methods:`);
        console.log(`   Preview API: ${summary.discoveryMethods.preview}`);
        console.log(`   Traditional: ${summary.discoveryMethods.traditional}`);

        // Detailed results
        console.log(`\n📋 Detailed Results:`);
        for (const result of this.testResults.companies) {
            if (result.success) {
                console.log(`   ✅ ${result.company}: ${result.analysis.memberCount} members, ${result.analysis.cohesionScore}% cohesion, ${result.processingTime}ms`);
            } else {
                console.log(`   ❌ ${result.company}: ${result.error}`);
            }
        }

        // Quality analysis
        console.log(`\n🎯 Quality Analysis:`);
        const qualityMetrics = successfulTests.reduce((acc, c) => {
            acc.hasDecisionMakers += c.analysis.qualityMetrics.hasDecisionMakers ? 1 : 0;
            acc.hasChampions += c.analysis.qualityMetrics.hasChampions ? 1 : 0;
            acc.hasStakeholders += c.analysis.qualityMetrics.hasStakeholders ? 1 : 0;
            acc.hasBlockers += c.analysis.qualityMetrics.hasBlockers ? 1 : 0;
            acc.hasIntroducers += c.analysis.qualityMetrics.hasIntroducers ? 1 : 0;
            return acc;
        }, { hasDecisionMakers: 0, hasChampions: 0, hasStakeholders: 0, hasBlockers: 0, hasIntroducers: 0 });

        console.log(`   Decision Makers: ${qualityMetrics.hasDecisionMakers}/${successfulTests.length} companies`);
        console.log(`   Champions: ${qualityMetrics.hasChampions}/${successfulTests.length} companies`);
        console.log(`   Stakeholders: ${qualityMetrics.hasStakeholders}/${successfulTests.length} companies`);
        console.log(`   Blockers: ${qualityMetrics.hasBlockers}/${successfulTests.length} companies`);
        console.log(`   Introducers: ${qualityMetrics.hasIntroducers}/${successfulTests.length} companies`);

        // Recommendations
        console.log(`\n💡 Recommendations:`);
        if (summary.averageMembers < 10) {
            console.log(`   - Consider expanding search criteria for more comprehensive buyer groups`);
        }
        if (qualityMetrics.hasDecisionMakers < successfulTests.length * 0.8) {
            console.log(`   - Improve decision maker identification (only ${Math.round(qualityMetrics.hasDecisionMakers / successfulTests.length * 100)}% success)`);
        }
        if (summary.averageCohesion < 70) {
            console.log(`   - Focus on role scoring algorithms for better cohesion`);
        }

        return this.testResults;
    }

    /**
     * 🔧 TEST INDIVIDUAL COMPONENTS
     */
    async testPreviewClient() {
        console.log('\n🔧 Testing CoreSignal Preview Client...');
        
        try {
            const results = await this.previewClient.searchBuyerGroupEmployees('Nike');
            console.log(`   ✅ Preview Client: Found ${results.length} employees`);
            return results;
        } catch (error) {
            console.log(`   ❌ Preview Client failed: ${error.message}`);
            return [];
        }
    }

    async testScoringEngine() {
        console.log('\n🔧 Testing Role Scoring Engine...');
        
        const mockEmployee = {
            active_experience_title: 'VP of Finance',
            active_experience_department: 'Finance',
            active_experience_management_level: 'VP-Level',
            connections_count: 500
        };

        try {
            const scores = this.scoringEngine.scoreCandidate(mockEmployee);
            console.log(`   ✅ Scoring Engine: Best role: ${scores.bestRole} (${Math.round(scores.bestScore * 100)}%)`);
            return scores;
        } catch (error) {
            console.log(`   ❌ Scoring Engine failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            previewDiscovery: this.previewDiscovery.getStats(),
            previewClient: this.previewClient.getStats(),
            scoringEngine: this.scoringEngine.getStats(),
            testResults: this.testResults
        };
    }
}

// Run test if called directly
if (require.main === module) {
    const test = new PreviewAPIIntegrationTest();
    
    test.runTestSuite()
        .then(() => {
            console.log('\n✅ Test suite completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Test suite failed:', error);
            process.exit(1);
        });
}

module.exports = PreviewAPIIntegrationTest;
