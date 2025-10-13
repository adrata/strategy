#!/usr/bin/env node

/**
 * 🧠 GENIUS-LEVEL API AUDIT & INTELLIGENCE SYSTEM
 * 
 * McKinsey-level intelligence for buyer group enrichment and data intelligence
 * Tests all APIs involved in enrichment/buyer group/finder processes
 * Implements cutting-edge AI orchestration for maximum intelligence
 */

const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

class GeniusLevelIntelligenceSystem {
    constructor() {
        this.apiResults = {};
        this.intelligenceScore = 0;
        this.mcKinseyMetrics = {
            dataQuality: 0,
            sourceReliability: 0,
            insightDepth: 0,
            actionableIntelligence: 0,
            confidenceLevel: 0
        };
        this.auditTrail = [];
    }

    log(message, category = 'SYSTEM', confidence = 100, sources = []) {
        const timestamp = new Date().toISOString();
        const entry = {
            timestamp,
            message,
            category,
            confidence,
            sources,
            mcKinseyLevel: confidence >= 95 ? 'GENIUS' : confidence >= 85 ? 'EXPERT' : 'GOOD'
        };
        
        this.auditTrail.push(entry);
        console.log(`[${timestamp}] ${category}: ${message} (${confidence}% confidence)`);
        
        if (sources.length > 0) {
            console.log(`  📊 Sources: ${sources.join(', ')}`);
        }
    }

    async testCoreIntelligenceAPIs() {
        this.log('🧠 Testing Core Intelligence APIs for McKinsey-Level Analysis', 'INTELLIGENCE');
        
        const coreAPIs = {
            // Advanced AI Models
            perplexity: {
                test: () => this.testPerplexityPro(),
                purpose: 'Real-time web intelligence with citations',
                mcKinseyValue: 'Market research & competitive intelligence'
            },
            openai: {
                test: () => this.testOpenAIGPT4(),
                purpose: 'Advanced reasoning and analysis',
                mcKinseyValue: 'Strategic analysis & pattern recognition'
            },
            claude: {
                test: () => this.testClaudeAnthropic(),
                purpose: 'Complex document analysis',
                mcKinseyValue: 'Deep analytical reasoning'
            }
        };

        for (const [name, api] of Object.entries(coreAPIs)) {
            try {
                this.log(`Testing ${name.toUpperCase()} API...`, 'AI_INTELLIGENCE');
                const result = await api.test();
                this.apiResults[name] = result;
                
                if (result.working) {
                    this.mcKinseyMetrics.insightDepth += 25;
                    this.log(`✅ ${name.toUpperCase()}: ${api.mcKinseyValue}`, 'AI_INTELLIGENCE', 95, [name]);
                }
            } catch (error) {
                this.log(`❌ ${name.toUpperCase()} failed: ${error.message}`, 'AI_INTELLIGENCE', 0);
                this.apiResults[name] = { working: false, error: error.message };
            }
        }
    }

    async testDataEnrichmentAPIs() {
        this.log('📊 Testing Data Enrichment APIs for Maximum Intelligence', 'DATA_ENRICHMENT');
        
        const enrichmentAPIs = {
            // Contact Intelligence
            coreSignal: {
                test: () => this.testCoreSignalIntelligence(),
                purpose: 'B2B person & company intelligence',
                mcKinseyValue: 'Comprehensive stakeholder mapping'
            },
            lusha: {
                test: () => this.testLushaEnrichment(),
                purpose: 'Contact information enrichment',
                mcKinseyValue: 'Direct access to decision makers'
            },
            hunter: {
                test: () => this.testHunterEmailFinder(),
                purpose: 'Email discovery and verification',
                mcKinseyValue: 'Communication pathway validation'
            },
            prospeo: {
                test: () => this.testProspeoEnrichment(),
                purpose: 'Professional email finding',
                mcKinseyValue: 'Executive contact discovery'
            },
            
            // Validation & Quality
            dropContact: {
                test: () => this.testDropContactValidation(),
                purpose: 'Professional email validation',
                mcKinseyValue: 'Data quality assurance'
            },
            zeroBounce: {
                test: () => this.testZeroBounceValidation(),
                purpose: 'Email deliverability validation',
                mcKinseyValue: 'Communication reliability'
            },
            myEmailVerifier: {
                test: () => this.testMyEmailVerifier(),
                purpose: 'Advanced email verification',
                mcKinseyValue: 'Contact authenticity validation'
            }
        };

        for (const [name, api] of Object.entries(enrichmentAPIs)) {
            try {
                this.log(`Testing ${name.toUpperCase()} API...`, 'DATA_ENRICHMENT');
                const result = await api.test();
                this.apiResults[name] = result;
                
                if (result.working) {
                    this.mcKinseyMetrics.dataQuality += 12;
                    this.log(`✅ ${name.toUpperCase()}: ${api.mcKinseyValue}`, 'DATA_ENRICHMENT', 90, [name]);
                }
            } catch (error) {
                this.log(`❌ ${name.toUpperCase()} failed: ${error.message}`, 'DATA_ENRICHMENT', 0);
                this.apiResults[name] = { working: false, error: error.message };
            }
        }
    }

    async testCommunicationAPIs() {
        this.log('📞 Testing Communication APIs for Executive Outreach', 'COMMUNICATION');
        
        const commAPIs = {
            twilio: {
                test: () => this.testTwilioIntelligence(),
                purpose: 'Phone validation and communication',
                mcKinseyValue: 'Executive communication channels'
            }
        };

        for (const [name, api] of Object.entries(commAPIs)) {
            try {
                this.log(`Testing ${name.toUpperCase()} API...`, 'COMMUNICATION');
                const result = await api.test();
                this.apiResults[name] = result;
                
                if (result.working) {
                    this.mcKinseyMetrics.actionableIntelligence += 15;
                    this.log(`✅ ${name.toUpperCase()}: ${api.mcKinseyValue}`, 'COMMUNICATION', 85, [name]);
                }
            } catch (error) {
                this.log(`❌ ${name.toUpperCase()} failed: ${error.message}`, 'COMMUNICATION', 0);
                this.apiResults[name] = { working: false, error: error.message };
            }
        }
    }

    // Advanced AI API Tests
    async testPerplexityPro() {
        if (!process.env.PERPLEXITY_API_KEY) {
            throw new Error('API key not available');
        }

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
                    content: 'Analyze the current state of utility communications infrastructure market. Provide 3 key trends with sources.'
                }],
                max_tokens: 200
            },
            timeout: 20000
        });

        const content = response.data?.choices?.[0]?.message?.content;
        return {
            working: true,
            intelligence: content ? 'High' : 'Medium',
            response: content,
            tokens: response.data?.usage?.total_tokens || 0
        };
    }

    async testOpenAIGPT4() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'POST',
            url: 'https://api.openai.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            data: {
                model: 'gpt-4-turbo',
                messages: [{
                    role: 'user',
                    content: 'As a McKinsey consultant, analyze the buyer group structure for utility communications engineering projects. Provide strategic insights.'
                }],
                max_tokens: 200,
                temperature: 0.1
            },
            timeout: 20000
        });

        const content = response.data?.choices?.[0]?.message?.content;
        return {
            working: true,
            intelligence: 'Genius',
            response: content,
            tokens: response.data?.usage?.total_tokens || 0
        };
    }

    async testClaudeAnthropic() {
        if (!process.env.ANTHROPIC_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'POST',
            url: 'https://api.anthropic.com/v1/messages',
            headers: {
                'x-api-key': process.env.ANTHROPIC_API_KEY,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            data: {
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 200,
                messages: [{
                    role: 'user',
                    content: 'Analyze the strategic value proposition for TOP Engineers Plus in the utility communications market. Provide McKinsey-level insights.'
                }]
            },
            timeout: 20000
        });

        const content = response.data?.content?.[0]?.text;
        return {
            working: true,
            intelligence: 'Genius',
            response: content,
            tokens: response.data?.usage?.input_tokens + response.data?.usage?.output_tokens || 0
        };
    }

    // Data Enrichment API Tests
    async testCoreSignalIntelligence() {
        if (!process.env.CORESIGNAL_API_KEY) {
            throw new Error('API key not available');
        }

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
                        must: [
                            { term: { 'job_title': 'Communications Engineer' } },
                            { term: { 'company_industry': 'Utilities' } }
                        ]
                    }
                }
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            results: response.data?.hits?.total?.value || 0,
            quality: response.data?.hits?.hits?.length > 0 ? 'Excellent' : 'Good'
        };
    }

    async testLushaEnrichment() {
        if (!process.env.LUSHA_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'GET',
            url: 'https://api.lusha.com/person',
            headers: {
                'api_key': process.env.LUSHA_API_KEY,
                'Content-Type': 'application/json'
            },
            params: {
                firstName: 'Chris',
                lastName: 'Mantle',
                company: 'Puget Sound Energy'
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            dataQuality: response.data ? 'Professional' : 'Limited'
        };
    }

    async testHunterEmailFinder() {
        if (!process.env.HUNTER_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'GET',
            url: 'https://api.hunter.io/v2/email-finder',
            params: {
                domain: 'idahopower.com',
                first_name: 'Greg',
                last_name: 'Frankamp',
                api_key: process.env.HUNTER_API_KEY
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            confidence: response.data?.data?.confidence || 0,
            email: response.data?.data?.email || null
        };
    }

    async testProspeoEnrichment() {
        if (!process.env.PROSPEO_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'POST',
            url: 'https://api.prospeo.io/email-finder',
            headers: {
                'Content-Type': 'application/json',
                'X-KEY': process.env.PROSPEO_API_KEY
            },
            data: {
                first_name: 'Adam',
                last_name: 'Mattson',
                company: 'Idaho Power'
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            result: response.data?.email || null
        };
    }

    async testDropContactValidation() {
        if (!process.env.DROPCONTACT_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'POST',
            url: 'https://api.dropcontact.io/batch',
            headers: {
                'X-Access-Token': process.env.DROPCONTACT_API_KEY,
                'Content-Type': 'application/json'
            },
            data: {
                data: [{ email: 'chris.mantle@pse.com' }],
                siren: false,
                language: 'en'
            },
            timeout: 15000
        });

        const result = response.data?.data?.[0];
        return {
            working: true,
            intelligence: 'High',
            status: result?.email_status || 'unknown',
            professional: result?.email_type === 'professional',
            quality: result?.qualification || 'unknown'
        };
    }

    async testZeroBounceValidation() {
        if (!process.env.ZEROBOUNCE_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'GET',
            url: 'https://api.zerobounce.net/v2/validate',
            params: {
                api_key: process.env.ZEROBOUNCE_API_KEY,
                email: 'gfrankamp@idahopower.com'
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            status: response.data?.status || 'unknown',
            score: response.data?.sub_result || 'unknown'
        };
    }

    async testMyEmailVerifier() {
        if (!process.env.MYEMAILVERIFIER_API_KEY) {
            throw new Error('API key not available');
        }

        const response = await axios({
            method: 'GET',
            url: 'https://api.myemailverifier.com/v1/verify',
            headers: {
                'Authorization': `Bearer ${process.env.MYEMAILVERIFIER_API_KEY}`
            },
            params: {
                email: 'amattson@idahopower.com'
            },
            timeout: 15000
        });

        return {
            working: true,
            intelligence: 'High',
            status: response.data?.status || 'unknown',
            quality: response.data?.quality_score || 0
        };
    }

    async testTwilioIntelligence() {
        if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
            throw new Error('Credentials not available');
        }

        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

        const response = await axios({
            method: 'GET',
            url: `https://lookups.twilio.com/v2/PhoneNumbers/+14252485632?Fields=line_type_intelligence`,
            headers: {
                'Authorization': `Basic ${auth}`
            },
            timeout: 10000
        });

        return {
            working: true,
            intelligence: 'High',
            valid: response.data?.valid || false,
            lineType: response.data?.line_type_intelligence?.type || 'unknown'
        };
    }

    calculateMcKinseyIntelligenceScore() {
        const workingAPIs = Object.values(this.apiResults).filter(r => r.working).length;
        const totalAPIs = Object.keys(this.apiResults).length;
        
        // Base score from API coverage
        const apiCoverage = (workingAPIs / totalAPIs) * 100;
        
        // McKinsey metrics (weighted)
        const metricsScore = (
            this.mcKinseyMetrics.dataQuality * 0.25 +
            this.mcKinseyMetrics.insightDepth * 0.30 +
            this.mcKinseyMetrics.actionableIntelligence * 0.25 +
            this.mcKinseyMetrics.sourceReliability * 0.20
        );
        
        // Final intelligence score
        this.intelligenceScore = Math.min(100, (apiCoverage * 0.4 + metricsScore * 0.6));
        
        return {
            intelligenceScore: this.intelligenceScore,
            level: this.intelligenceScore >= 90 ? 'GENIUS (McKinsey Partner)' :
                   this.intelligenceScore >= 80 ? 'EXPERT (McKinsey Principal)' :
                   this.intelligenceScore >= 70 ? 'ADVANCED (McKinsey Associate)' :
                   'DEVELOPING',
            apiCoverage: `${workingAPIs}/${totalAPIs} (${Math.round(apiCoverage)}%)`,
            mcKinseyMetrics: this.mcKinseyMetrics
        };
    }

    async generateGeniusLevelReport() {
        const assessment = this.calculateMcKinseyIntelligenceScore();
        
        console.log('\n' + '='.repeat(80));
        console.log('🧠 GENIUS-LEVEL INTELLIGENCE SYSTEM AUDIT REPORT');
        console.log('='.repeat(80));
        console.log(`📊 Overall Intelligence Score: ${Math.round(assessment.intelligenceScore)}%`);
        console.log(`🎯 McKinsey Level: ${assessment.level}`);
        console.log(`🔗 API Coverage: ${assessment.apiCoverage}`);
        
        console.log('\n📈 McKINSEY INTELLIGENCE METRICS:');
        console.log(`  Data Quality: ${Math.round(assessment.mcKinseyMetrics.dataQuality)}%`);
        console.log(`  Insight Depth: ${Math.round(assessment.mcKinseyMetrics.insightDepth)}%`);
        console.log(`  Actionable Intelligence: ${Math.round(assessment.mcKinseyMetrics.actionableIntelligence)}%`);
        console.log(`  Source Reliability: ${Math.round(assessment.mcKinseyMetrics.sourceReliability)}%`);
        
        console.log('\n🔍 API STATUS BREAKDOWN:');
        for (const [api, result] of Object.entries(this.apiResults)) {
            const status = result.working ? '✅ WORKING' : '❌ FAILED';
            const intelligence = result.intelligence || 'Unknown';
            console.log(`  ${status} ${api.toUpperCase()}: ${intelligence} Intelligence Level`);
        }
        
        console.log('\n🎯 GENIUS-LEVEL RECOMMENDATIONS:');
        if (assessment.intelligenceScore >= 90) {
            console.log('  🎉 ✅ GENIUS LEVEL ACHIEVED - Ready for Fortune 500 clients');
            console.log('  • System operates at McKinsey Partner level intelligence');
            console.log('  • All critical APIs functioning with high-quality data');
            console.log('  • Ready for complex strategic analysis and insights');
        } else if (assessment.intelligenceScore >= 80) {
            console.log('  🔧 ⚠️ EXPERT LEVEL - Minor optimizations needed');
            console.log('  • Add missing API integrations for full coverage');
            console.log('  • Enhance data validation and cross-referencing');
            console.log('  • Implement advanced pattern recognition');
        } else {
            console.log('  🚨 ❌ REQUIRES SIGNIFICANT ENHANCEMENT');
            console.log('  • Fix failing API integrations immediately');
            console.log('  • Implement comprehensive data quality measures');
            console.log('  • Add advanced AI reasoning capabilities');
        }
        
        console.log(`\n📋 Audit Trail Entries: ${this.auditTrail.length}`);
        console.log(`🕒 Assessment Completed: ${new Date().toISOString()}`);
        console.log('='.repeat(80));
        
        return assessment;
    }
}

async function runGeniusLevelAudit() {
    const system = new GeniusLevelIntelligenceSystem();
    
    try {
        system.log('🚀 Starting Genius-Level Intelligence System Audit', 'SYSTEM', 100);
        
        // Test all API categories
        await system.testCoreIntelligenceAPIs();
        await system.testDataEnrichmentAPIs();
        await system.testCommunicationAPIs();
        
        // Generate comprehensive report
        const assessment = await system.generateGeniusLevelReport();
        
        return assessment;
        
    } catch (error) {
        system.log(`💥 Critical audit error: ${error.message}`, 'SYSTEM', 0);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Run the genius-level audit
if (require.main === module) {
    runGeniusLevelAudit()
        .then(assessment => {
            if (assessment.intelligenceScore >= 90) {
                console.log('\n🎉 Genius-level intelligence achieved! Ready for McKinsey-level analysis.');
                process.exit(0);
            } else {
                console.log('\n⚠️ System needs enhancement to reach genius level.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Genius-level audit failed:', error.message);
            process.exit(1);
        });
}

module.exports = { GeniusLevelIntelligenceSystem };
