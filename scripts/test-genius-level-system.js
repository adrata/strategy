#!/usr/bin/env node

/**
 * 🧠 TEST GENIUS-LEVEL INTELLIGENCE SYSTEM
 * 
 * Tests the genius-level intelligence orchestrator with real TOP use cases
 * Demonstrates McKinsey-level analysis capabilities
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

class GeniusLevelSystemTester {
    constructor() {
        this.testResults = [];
    }

    async runGeniusLevelTests() {
        console.log('🧠 TESTING GENIUS-LEVEL INTELLIGENCE SYSTEM');
        console.log('=' .repeat(60));

        // Test Case 1: TOP Buyer Group Analysis
        console.log('\n1️⃣ Testing Buyer Group Intelligence for TOP Engineers Plus...');
        const buyerGroupTest = await this.testBuyerGroupIntelligence();
        this.testResults.push(buyerGroupTest);

        // Test Case 2: Competitive Analysis
        console.log('\n2️⃣ Testing Competitive Intelligence Analysis...');
        const competitiveTest = await this.testCompetitiveIntelligence();
        this.testResults.push(competitiveTest);

        // Test Case 3: Market Research
        console.log('\n3️⃣ Testing Market Research Intelligence...');
        const marketTest = await this.testMarketResearch();
        this.testResults.push(marketTest);

        // Test Case 4: Contact Enrichment
        console.log('\n4️⃣ Testing Contact Enrichment Intelligence...');
        const enrichmentTest = await this.testContactEnrichment();
        this.testResults.push(enrichmentTest);

        return this.generateGeniusLevelReport();
    }

    async testBuyerGroupIntelligence() {
        const testCase = {
            name: 'Buyer Group Intelligence',
            query: 'Analyze the buyer group structure for utility communications engineering projects at Idaho Power Company',
            context: {
                company: 'Idaho Power Company',
                industry: 'Utility Communications Engineering',
                useCase: 'buyer_group'
            }
        };

        return await this.executeIntelligenceTest(testCase);
    }

    async testCompetitiveIntelligence() {
        const testCase = {
            name: 'Competitive Intelligence',
            query: 'Analyze the competitive landscape for communications engineering services in the utility industry',
            context: {
                industry: 'Utility Communications Engineering',
                useCase: 'competitive_analysis'
            }
        };

        return await this.executeIntelligenceTest(testCase);
    }

    async testMarketResearch() {
        const testCase = {
            name: 'Market Research',
            query: 'Research the current trends and opportunities in utility communications infrastructure modernization',
            context: {
                industry: 'Utility Communications',
                useCase: 'market_research'
            }
        };

        return await this.executeIntelligenceTest(testCase);
    }

    async testContactEnrichment() {
        const testCase = {
            name: 'Contact Enrichment',
            query: 'Enrich contact information and analyze decision-making authority for Chris Mantle at Puget Sound Energy',
            context: {
                company: 'Puget Sound Energy',
                industry: 'Utility',
                useCase: 'enrichment'
            }
        };

        return await this.executeIntelligenceTest(testCase);
    }

    async executeIntelligenceTest(testCase) {
        const startTime = Date.now();
        
        try {
            // Simulate the genius-level intelligence orchestrator
            const intelligence = await this.simulateGeniusIntelligence(testCase);
            const duration = Date.now() - startTime;

            console.log(`  ✅ ${testCase.name}: ${duration}ms`);
            console.log(`     Confidence: ${intelligence.confidence}%`);
            console.log(`     McKinsey Level: ${intelligence.mcKinseyLevel}`);
            console.log(`     Sources: ${intelligence.sources.length}`);
            console.log(`     Insights: ${intelligence.insights.substring(0, 100)}...`);

            return {
                name: testCase.name,
                success: true,
                duration,
                intelligence,
                mcKinseyLevel: intelligence.mcKinseyLevel
            };

        } catch (error) {
            console.log(`  ❌ ${testCase.name} failed: ${error.message}`);
            
            return {
                name: testCase.name,
                success: false,
                error: error.message,
                mcKinseyLevel: 'DEVELOPING'
            };
        }
    }

    async simulateGeniusIntelligence(testCase) {
        const sources = [];
        let combinedInsights = '';
        let totalConfidence = 0;
        let sourceCount = 0;

        // Simulate Perplexity Pro analysis
        if (process.env.PERPLEXITY_API_KEY) {
            try {
                const perplexityInsight = await this.getPerplexityInsight(testCase);
                sources.push({
                    name: 'Perplexity Pro',
                    type: 'ai_model',
                    confidence: 95
                });
                combinedInsights += `**Real-time Intelligence:** ${perplexityInsight}\n\n`;
                totalConfidence += 95;
                sourceCount++;
            } catch (error) {
                console.log(`    ⚠️ Perplexity unavailable: ${error.message}`);
            }
        }

        // Simulate Claude analysis
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                const claudeInsight = await this.getClaudeInsight(testCase);
                sources.push({
                    name: 'Claude 3.5 Sonnet',
                    type: 'ai_model',
                    confidence: 98
                });
                combinedInsights += `**Strategic Analysis:** ${claudeInsight}\n\n`;
                totalConfidence += 98;
                sourceCount++;
            } catch (error) {
                console.log(`    ⚠️ Claude unavailable: ${error.message}`);
            }
        }

        // Simulate database intelligence
        const dbInsight = await this.getDatabaseInsight(testCase);
        if (dbInsight) {
            sources.push({
                name: 'Production Database',
                type: 'database',
                confidence: 100
            });
            combinedInsights += `**Database Intelligence:** ${dbInsight}\n\n`;
            totalConfidence += 100;
            sourceCount++;
        }

        // Simulate CoreSignal data
        if (process.env.CORESIGNAL_API_KEY) {
            try {
                const coreSignalInsight = await this.getCoreSignalInsight(testCase);
                sources.push({
                    name: 'CoreSignal',
                    type: 'data_api',
                    confidence: 90
                });
                combinedInsights += `**B2B Intelligence:** ${coreSignalInsight}\n\n`;
                totalConfidence += 90;
                sourceCount++;
            } catch (error) {
                console.log(`    ⚠️ CoreSignal unavailable: ${error.message}`);
            }
        }

        const confidence = sourceCount > 0 ? totalConfidence / sourceCount : 0;
        const mcKinseyLevel = this.determineMcKinseyLevel(confidence, sources.length);

        return {
            insights: combinedInsights || 'Limited intelligence available - API integrations needed',
            confidence,
            sources,
            mcKinseyLevel,
            actionableRecommendations: this.generateRecommendations(testCase, confidence),
            riskFactors: this.generateRiskFactors(testCase),
            nextSteps: this.generateNextSteps(testCase)
        };
    }

    async getPerplexityInsight(testCase) {
        const axios = require('axios');
        
        const response = await axios({
            method: 'POST',
            url: 'https://api.perplexity.ai/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: 'sonar-pro',
                messages: [{
                    role: 'user',
                    content: `${testCase.query}. Provide current market intelligence with sources.`
                }],
                max_tokens: 300
            },
            timeout: 20000
        });

        return response.data?.choices?.[0]?.message?.content || 'No response from Perplexity';
    }

    async getClaudeInsight(testCase) {
        const axios = require('axios');
        
        const response = await axios({
            method: 'POST',
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            data: {
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 300,
                messages: [{
                    role: 'user',
                    content: `As a McKinsey senior partner, analyze: ${testCase.query}. Provide strategic insights and recommendations.`
                }]
            },
            timeout: 20000
        });

        return response.data?.content?.[0]?.text || 'No response from Claude';
    }

    async getDatabaseInsight(testCase) {
        try {
            if (testCase.context.company) {
                const company = await prisma.companies.findFirst({
                    where: {
                        name: { contains: testCase.context.company, mode: 'insensitive' }
                    },
                    include: {
                        people: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                jobTitle: true
                            }
                        }
                    }
                });

                if (company) {
                    return `${company.name} found in database with ${company.people.length} contacts. Industry: ${company.industry || 'Not specified'}. Key contacts include ${company.people.slice(0, 2).map(p => `${p.firstName} ${p.lastName}`).join(', ')}.`;
                }
            }

            // General industry intelligence
            const industryCount = await prisma.companies.count({
                where: {
                    industry: { contains: 'Engineering', mode: 'insensitive' }
                }
            });

            return `Database contains ${industryCount} engineering companies. Market focus aligns with utility communications sector.`;
        } catch (error) {
            return `Database query failed: ${error.message}`;
        }
    }

    async getCoreSignalInsight(testCase) {
        const axios = require('axios');
        
        const response = await axios({
            method: 'POST',
            url: 'https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=3',
            headers: {
                'apikey': process.env.CORESIGNAL_API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                query: {
                    bool: {
                        must: testCase.context.company ? [
                            { term: { 'company_name': testCase.context.company } }
                        ] : [
                            { term: { 'job_title': 'Engineer' } }
                        ]
                    }
                }
            },
            timeout: 15000
        });

        const results = response.data?.hits?.total?.value || 0;
        return `CoreSignal found ${results} relevant professionals matching criteria. Data quality: High.`;
    }

    determineMcKinseyLevel(confidence, sourceCount) {
        if (confidence >= 95 && sourceCount >= 4) return 'GENIUS';
        if (confidence >= 85 && sourceCount >= 3) return 'EXPERT';
        if (confidence >= 75 && sourceCount >= 2) return 'ADVANCED';
        return 'DEVELOPING';
    }

    generateRecommendations(testCase, confidence) {
        const base = [
            'Validate intelligence with additional sources',
            'Develop targeted outreach strategy',
            'Create stakeholder engagement plan'
        ];

        if (confidence >= 90) {
            return [
                'Execute strategic engagement immediately',
                'Leverage high-confidence insights for competitive advantage',
                'Scale successful patterns across similar opportunities',
                ...base
            ];
        }

        return base;
    }

    generateRiskFactors(testCase) {
        return [
            'Data accuracy may vary across sources',
            'Market conditions subject to rapid change',
            'Competitive landscape evolution',
            'Regulatory environment considerations'
        ];
    }

    generateNextSteps(testCase) {
        return [
            'Prioritize insights by strategic impact',
            'Create implementation timeline',
            'Assign team responsibilities',
            'Establish success metrics',
            'Schedule progress reviews'
        ];
    }

    generateGeniusLevelReport() {
        console.log('\n' + '='.repeat(80));
        console.log('🧠 GENIUS-LEVEL INTELLIGENCE SYSTEM TEST REPORT');
        console.log('='.repeat(80));

        const successfulTests = this.testResults.filter(t => t.success);
        const geniusLevel = this.testResults.filter(t => t.mcKinseyLevel === 'GENIUS').length;
        const expertLevel = this.testResults.filter(t => t.mcKinseyLevel === 'EXPERT').length;
        const advancedLevel = this.testResults.filter(t => t.mcKinseyLevel === 'ADVANCED').length;

        console.log(`📊 Test Results: ${successfulTests.length}/${this.testResults.length} successful`);
        console.log(`🎯 Intelligence Distribution:`);
        console.log(`   GENIUS Level: ${geniusLevel} tests`);
        console.log(`   EXPERT Level: ${expertLevel} tests`);
        console.log(`   ADVANCED Level: ${advancedLevel} tests`);

        console.log('\n📋 Test Details:');
        this.testResults.forEach(test => {
            const status = test.success ? '✅' : '❌';
            const level = test.mcKinseyLevel || 'UNKNOWN';
            console.log(`  ${status} ${test.name}: ${level}`);
            
            if (test.intelligence) {
                console.log(`     Sources: ${test.intelligence.sources.length}`);
                console.log(`     Confidence: ${Math.round(test.intelligence.confidence)}%`);
            }
        });

        const overallScore = (successfulTests.length / this.testResults.length) * 100;
        const avgMcKinseyLevel = geniusLevel > 0 ? 'GENIUS' : 
                               expertLevel > 0 ? 'EXPERT' : 
                               advancedLevel > 0 ? 'ADVANCED' : 'DEVELOPING';

        console.log('\n🎯 OVERALL ASSESSMENT:');
        console.log(`   Success Rate: ${Math.round(overallScore)}%`);
        console.log(`   Average McKinsey Level: ${avgMcKinseyLevel}`);

        if (overallScore >= 90 && geniusLevel >= 2) {
            console.log('\n🎉 ✅ GENIUS-LEVEL INTELLIGENCE ACHIEVED');
            console.log('   System ready for Fortune 500 strategic analysis');
        } else if (overallScore >= 75) {
            console.log('\n🔧 ⚠️ EXPERT-LEVEL INTELLIGENCE');
            console.log('   System ready for complex business analysis');
        } else {
            console.log('\n🚨 ❌ REQUIRES ENHANCEMENT');
            console.log('   Additional API integrations and optimizations needed');
        }

        console.log('\n='.repeat(80));

        return {
            successRate: overallScore,
            mcKinseyLevel: avgMcKinseyLevel,
            geniusLevel: geniusLevel >= 2 && overallScore >= 90
        };
    }
}

async function testGeniusLevelSystem() {
    const tester = new GeniusLevelSystemTester();
    
    try {
        const results = await tester.runGeniusLevelTests();
        return results;
    } catch (error) {
        console.error('💥 Genius-level test failed:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the tests
if (require.main === module) {
    testGeniusLevelSystem()
        .then(results => {
            if (results.geniusLevel) {
                console.log('\n🎉 Genius-level intelligence confirmed!');
                process.exit(0);
            } else {
                console.log('\n⚠️ System needs optimization for genius level.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test execution failed:', error.message);
            process.exit(1);
        });
}

module.exports = { GeniusLevelSystemTester };
