#!/usr/bin/env node

/**
 * 🤖 AI-POWERED BUYER GROUP DISCOVERY
 * 
 * Uses LLM and Perplexity to dynamically determine buyer groups for any company:
 * - Analyzes company context (industry, products, size, deal type)
 * - Determines relevant buyer group roles using AI
 * - Adapts to different business models and sales scenarios
 * - Out-of-the-box ready for any customer/company
 * 
 * Buyer Group Model:
 * - Decision Makers (budget authority)
 * - Champions (internal advocates) 
 * - Influencers (provide input and recommendations)
 * - Financial Stakeholders (budget holders)
 * - Procurement Stakeholders (vendor management)
 * - Blockers (can delay decisions)
 * - Introducers (provide access)
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class BuyerGroupAI {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
            MAX_RETRIES: 3,
            RATE_LIMIT_DELAY: 2000,
            ...config
        };
        
        this.stats = {
            companiesAnalyzed: 0,
            buyerGroupsGenerated: 0,
            rolesIdentified: 0,
            aiCallsMade: 0,
            errors: 0
        };
    }

    /**
     * 🎯 DETERMINE BUYER GROUP FOR ANY COMPANY
     * 
     * Main function that analyzes company context and determines optimal buyer group
     */
    async determineBuyerGroup(companyContext) {
        console.log(`🤖 AI Buyer Group Analysis: ${companyContext.companyName}`);
        
        try {
            // STEP 1: Analyze company and product context using AI
            const contextAnalysis = await this.analyzeCompanyContext(companyContext);
            
            // STEP 2: Determine buyer group roles using Perplexity
            const buyerGroupRoles = await this.determineBuyerGroupRoles(contextAnalysis);
            
            // STEP 3: Generate role-specific search criteria
            const searchCriteria = await this.generateRoleSearchCriteria(buyerGroupRoles, contextAnalysis);
            
            // STEP 4: Validate and refine buyer group
            const validatedBuyerGroup = await this.validateBuyerGroup(buyerGroupRoles, contextAnalysis);
            
            this.stats.companiesAnalyzed++;
            this.stats.buyerGroupsGenerated++;
            this.stats.rolesIdentified += Object.keys(validatedBuyerGroup.roles).length;
            
            return {
                companyName: companyContext.companyName,
                context: contextAnalysis,
                buyerGroup: validatedBuyerGroup,
                searchCriteria: searchCriteria,
                confidence: validatedBuyerGroup.confidence,
                reasoning: validatedBuyerGroup.reasoning
            };
            
        } catch (error) {
            console.error(`❌ AI analysis failed for ${companyContext.companyName}:`, error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * 🧠 ANALYZE COMPANY CONTEXT USING AI
     */
    async analyzeCompanyContext(companyContext) {
        console.log('   🧠 Analyzing company context with AI...');
        
        const prompt = `Analyze this company for buyer group intelligence:

Company: ${companyContext.companyName}
Industry: ${companyContext.industry || 'Unknown'}
Vertical: ${companyContext.vertical || 'Unknown'}
Website: ${companyContext.website || 'Unknown'}
Size: ${companyContext.size || 'Unknown'}
Products/Services: ${companyContext.products || 'Unknown'}

Please analyze:
1. What type of business is this?
2. What products/services do they likely buy?
3. What would be the typical deal size range?
4. What departments would be involved in purchasing decisions?
5. Is this more of a technical purchase, operational purchase, or strategic purchase?
6. What would be the decision-making process complexity?

Respond in JSON format with your analysis.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const analysis = this.parseAIResponse(response);
            
            console.log(`      ✅ Company context analyzed: ${analysis.businessType || 'Unknown type'}`);
            
            return {
                ...companyContext,
                aiAnalysis: analysis,
                businessType: analysis.businessType,
                purchaseType: analysis.purchaseType,
                dealSizeRange: analysis.dealSizeRange,
                decisionComplexity: analysis.decisionComplexity,
                relevantDepartments: analysis.relevantDepartments || []
            };
            
        } catch (error) {
            console.log('      ⚠️ AI context analysis failed, using defaults');
            return {
                ...companyContext,
                businessType: 'Unknown',
                purchaseType: 'operational',
                dealSizeRange: 'medium',
                decisionComplexity: 'medium',
                relevantDepartments: []
            };
        }
    }

    /**
     * 🎯 DETERMINE BUYER GROUP ROLES USING PERPLEXITY
     */
    async determineBuyerGroupRoles(contextAnalysis) {
        console.log('   🎯 Determining buyer group roles with AI...');
        
        const prompt = `Based on this company analysis, determine the optimal buyer group for a B2B sales process with PRECISE role hierarchy determination:

Company: ${contextAnalysis.companyName}
Business Type: ${contextAnalysis.businessType}
Industry: ${contextAnalysis.industry}
Purchase Type: ${contextAnalysis.purchaseType}
Deal Size: ${contextAnalysis.dealSizeRange}
Decision Complexity: ${contextAnalysis.decisionComplexity}

CRITICAL REQUIREMENTS FOR ROLE PRECISION:
1. Determine the EXACT seniority level for each role (EVP > CRO > VP > Director > Manager)
2. Consider company size: ${this.determineCompanySize(contextAnalysis)} companies have specific hierarchies
3. Distinguish between similar roles (EVP Sales vs CRO vs VP Sales vs Sales Director)
4. Identify the MOST SENIOR person who would make the final decision
5. Validate that returned roles match the company's expected hierarchy

For this company, identify the key buyer group roles needed:

1. DECISION MAKERS: Who has budget authority and final approval?
2. CHAMPIONS: Who would internally advocate for a solution?
3. INFLUENCERS: Who provides input and influences specifications?
4. FINANCIAL STAKEHOLDERS: Who controls the budget and approvals?
5. PROCUREMENT STAKEHOLDERS: Who manages vendors and contracts?
6. BLOCKERS: Who could prevent or delay the decision?
7. INTRODUCERS: Who could provide access to the buyer group?

For each role, specify:
- EXACT job title with seniority level (EVP Sales, not just "Sales Leader")
- Departments they work in
- Why they're relevant to this purchase
- How many of each role typically needed
- Role hierarchy validation (confirm this is the most senior relevant role)

Respond in JSON format with specific, actionable buyer group roles and role precision scores.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const buyerGroupRoles = this.parseAIResponse(response);
            
            console.log(`      ✅ Buyer group roles determined: ${Object.keys(buyerGroupRoles.roles || {}).length} role types`);
            
            return buyerGroupRoles;
            
        } catch (error) {
            console.log('      ⚠️ AI role determination failed, using default model');
            return this.getDefaultBuyerGroupModel(contextAnalysis);
        }
    }

    /**
     * 🔍 GENERATE ROLE SEARCH CRITERIA
     */
    async generateRoleSearchCriteria(buyerGroupRoles, contextAnalysis) {
        console.log('   🔍 Generating role-specific search criteria...');
        
        const searchCriteria = {};
        
        if (buyerGroupRoles.roles) {
            Object.entries(buyerGroupRoles.roles).forEach(([roleType, roleConfig]) => {
                searchCriteria[roleType] = {
                    titles: roleConfig.titles || [],
                    departments: roleConfig.departments || [],
                    keywords: this.generateSearchKeywords(roleType, roleConfig, contextAnalysis),
                    priority: roleConfig.priority || 'medium',
                    targetCount: roleConfig.targetCount || 2
                };
            });
        }
        
        console.log(`      ✅ Search criteria generated for ${Object.keys(searchCriteria).length} roles`);
        
        return searchCriteria;
    }

    /**
     * 🔍 GENERATE SEARCH KEYWORDS
     */
    generateSearchKeywords(roleType, roleConfig, contextAnalysis) {
        const baseKeywords = roleConfig.titles || [];
        const contextKeywords = [];
        
        // Add industry-specific variations
        if (contextAnalysis.industry) {
            baseKeywords.forEach(title => {
                contextKeywords.push(`${title} ${contextAnalysis.industry}`);
                contextKeywords.push(`${title} retail`);
            });
        }
        
        // Add company-specific variations
        baseKeywords.forEach(title => {
            contextKeywords.push(`${title} ${contextAnalysis.companyName}`);
        });
        
        return [...baseKeywords, ...contextKeywords];
    }

    /**
     * 🎯 DETERMINE COMPANY SIZE FOR ROLE HIERARCHY
     */
    determineCompanySize(contextAnalysis) {
        // Use deal size as proxy for company size
        if (contextAnalysis.dealSizeRange) {
            const dealSize = contextAnalysis.dealSizeRange;
            if (dealSize.includes('1M+') || dealSize.includes('500K+')) return 'enterprise';
            if (dealSize.includes('100K+') || dealSize.includes('50K+')) return 'mid-market';
            return 'small';
        }
        
        // Fallback based on business type
        if (contextAnalysis.businessType?.toLowerCase().includes('enterprise')) return 'enterprise';
        if (contextAnalysis.businessType?.toLowerCase().includes('sme') || contextAnalysis.businessType?.toLowerCase().includes('small')) return 'small';
        
        return 'mid-market';
    }

    /**
     * ✅ VALIDATE BUYER GROUP USING AI
     */
    async validateBuyerGroup(buyerGroupRoles, contextAnalysis) {
        console.log('   ✅ Validating buyer group with AI...');
        
        const prompt = `Validate this buyer group for the company context:

Company: ${contextAnalysis.companyName}
Industry: ${contextAnalysis.industry}
Business Type: ${contextAnalysis.businessType}

Proposed Buyer Group:
${JSON.stringify(buyerGroupRoles, null, 2)}

Please validate:
1. Are these the right roles for this type of company and purchase?
2. Are we missing any critical roles?
3. Are there any roles that aren't relevant?
4. What's the confidence level of this buyer group (0-100)?
5. What's the reasoning for this buyer group composition?

Respond in JSON format with validation results and confidence score.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const validation = this.parseAIResponse(response);
            
            console.log(`      ✅ Buyer group validated: ${validation.confidence || 75}% confidence`);
            
            return {
                roles: buyerGroupRoles.roles,
                confidence: validation.confidence || 75,
                reasoning: validation.reasoning || 'AI-generated buyer group based on company context',
                recommendations: validation.recommendations || [],
                missingRoles: validation.missingRoles || [],
                irrelevantRoles: validation.irrelevantRoles || []
            };
            
        } catch (error) {
            console.log('      ⚠️ AI validation failed, using default confidence');
            return {
                roles: buyerGroupRoles.roles,
                confidence: 70,
                reasoning: 'Default buyer group model applied',
                recommendations: [],
                missingRoles: [],
                irrelevantRoles: []
            };
        }
    }

    /**
     * 🤖 CALL PERPLEXITY AI
     */
    async callPerplexityAI(prompt) {
        if (!this.config.PERPLEXITY_API_KEY) {
            throw new Error('Perplexity API key not configured');
        }
        
        this.stats.aiCallsMade++;
        
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-sonar-large-128k-online',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a B2B sales expert specializing in buyer group analysis. Provide detailed, actionable insights in JSON format.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            throw new Error(`Perplexity API failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '';
    }

    /**
     * 📊 PARSE AI RESPONSE
     */
    parseAIResponse(response) {
        try {
            // Try to extract JSON from response
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1] || jsonMatch[0]);
            }
            
            // Fallback: try to parse entire response as JSON
            return JSON.parse(response);
            
        } catch (error) {
            console.log('      ⚠️ Failed to parse AI response as JSON, using text analysis');
            return this.extractStructuredDataFromText(response);
        }
    }

    /**
     * 📝 EXTRACT STRUCTURED DATA FROM TEXT
     */
    extractStructuredDataFromText(text) {
        const analysis = {
            businessType: 'Unknown',
            purchaseType: 'operational',
            dealSizeRange: 'medium',
            decisionComplexity: 'medium',
            roles: {}
        };

        // Extract business type
        if (text.toLowerCase().includes('retail') || text.toLowerCase().includes('store')) {
            analysis.businessType = 'Retail';
        } else if (text.toLowerCase().includes('technology') || text.toLowerCase().includes('software')) {
            analysis.businessType = 'Technology';
        } else if (text.toLowerCase().includes('manufacturing')) {
            analysis.businessType = 'Manufacturing';
        }

        // Extract purchase type
        if (text.toLowerCase().includes('technical') || text.toLowerCase().includes('software')) {
            analysis.purchaseType = 'technical';
        } else if (text.toLowerCase().includes('strategic') || text.toLowerCase().includes('enterprise')) {
            analysis.purchaseType = 'strategic';
        }

        return analysis;
    }

    /**
     * 🎯 GET DEFAULT BUYER GROUP MODEL
     */
    getDefaultBuyerGroupModel(contextAnalysis) {
        return {
            roles: {
                decisionMakers: {
                    titles: ['president', 'ceo', 'vice president', 'vp', 'general manager'],
                    departments: ['executive', 'leadership'],
                    priority: 'high',
                    targetCount: 2,
                    reasoning: 'Budget authority for business decisions'
                },
                champions: {
                    titles: ['director', 'manager', 'head of'],
                    departments: ['operations', 'business'],
                    priority: 'high',
                    targetCount: 3,
                    reasoning: 'Internal advocates who drive purchases'
                },
                influencers: {
                    titles: ['senior manager', 'specialist', 'analyst', 'coordinator'],
                    departments: ['relevant to product/service'],
                    priority: 'medium',
                    targetCount: 3,
                    reasoning: 'Provide input and influence specifications'
                },
                financialStakeholders: {
                    titles: ['cfo', 'finance director', 'controller'],
                    departments: ['finance', 'accounting'],
                    priority: 'medium',
                    targetCount: 1,
                    reasoning: 'Budget approval and financial oversight'
                },
                procurementStakeholders: {
                    titles: ['procurement manager', 'purchasing manager', 'buyer'],
                    departments: ['procurement', 'purchasing'],
                    priority: 'medium',
                    targetCount: 1,
                    reasoning: 'Vendor selection and contract management'
                }
            },
            confidence: 60,
            reasoning: 'Default buyer group model applied due to limited context'
        };
    }

    /**
     * 🔍 DISCOVER BUYER GROUP FOR COMPANY
     * 
     * Complete buyer group discovery process for a single company
     */
    async discoverBuyerGroupForCompany(companyData, options = {}) {
        console.log(`\n🎯 Discovering buyer group: ${companyData.name}`);
        
        try {
            // Prepare company context
            const companyContext = {
                companyName: companyData.name,
                industry: companyData.industry,
                vertical: companyData.vertical,
                website: companyData.website,
                size: companyData.size,
                products: options.products || 'Unknown',
                dealSize: options.dealSize || 'Unknown'
            };

            // Get AI-determined buyer group
            const buyerGroupAnalysis = await this.determineBuyerGroup(companyContext);
            
            if (!buyerGroupAnalysis) {
                console.log('   ❌ Failed to generate buyer group');
                return null;
            }

            console.log(`   ✅ Buyer group generated: ${buyerGroupAnalysis.confidence}% confidence`);
            console.log(`      Roles: ${Object.keys(buyerGroupAnalysis.buyerGroup.roles).join(', ')}`);
            
            return buyerGroupAnalysis;
            
        } catch (error) {
            console.error(`   ❌ Buyer group discovery failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 📊 BATCH PROCESS COMPANIES
     */
    async batchProcessCompanies(companies, options = {}) {
        console.log(`🚀 BATCH BUYER GROUP DISCOVERY: ${companies.length} companies`);
        console.log('================================================');
        
        const results = [];
        const maxCompanies = options.maxCompanies || companies.length;
        
        for (let i = 0; i < Math.min(companies.length, maxCompanies); i++) {
            const company = companies[i];
            
            console.log(`\n--- ${i+1}/${maxCompanies} ---`);
            
            const result = await this.discoverBuyerGroupForCompany(company, options);
            if (result) {
                results.push(result);
            }
            
            // Rate limiting between companies
            if (i < maxCompanies - 1) {
                console.log('   ⏱️ Rate limiting: 3s delay...');
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
            }
        }
        
        console.log(`\n✅ Batch processing complete: ${results.length} buyer groups generated`);
        
        return results;
    }

    /**
     * 💾 SAVE BUYER GROUP RESULTS
     */
    async saveBuyerGroupResults(results, filename) {
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                companiesProcessed: results.length,
                avgConfidence: Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length),
                totalRoles: results.reduce((sum, r) => sum + Object.keys(r.buyerGroup.roles).length, 0)
            },
            stats: this.stats,
            results: results
        };

        const reportFile = path.join(outputDir, filename || `universal-buyer-groups-${new Date().toISOString().split('T')[0]}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`💾 Results saved to: ${reportFile}`);
        
        return reportFile;
    }

    /**
     * 📊 PRINT STATISTICS
     */
    printStats() {
        console.log('\n📊 AI BUYER GROUP DISCOVERY STATS');
        console.log('=================================');
        console.log(`🏢 Companies Analyzed: ${this.stats.companiesAnalyzed}`);
        console.log(`🎯 Buyer Groups Generated: ${this.stats.buyerGroupsGenerated}`);
        console.log(`🏷️ Roles Identified: ${this.stats.rolesIdentified}`);
        console.log(`🤖 AI Calls Made: ${this.stats.aiCallsMade}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        const successRate = Math.round((this.stats.buyerGroupsGenerated / this.stats.companiesAnalyzed) * 100);
        console.log(`📈 Success Rate: ${successRate}%`);
    }
}

/**
 * 🚀 MAIN EXECUTION
 */
async function main() {
    const buyerGroupAI = new BuyerGroupAI();
    
    const args = process.argv.slice(2);
    
    // Example usage
    if (args.includes('--example')) {
        console.log('🧪 Running example buyer group analysis...');
        
        const exampleCompanies = [
            {
                name: 'Kwik Trip, Inc.',
                industry: 'Retail',
                vertical: 'C Stores',
                website: 'https://kwiktrip.com',
                size: '1000+ employees'
            },
            {
                name: 'Salesforce',
                industry: 'Technology',
                vertical: 'Software',
                website: 'https://salesforce.com',
                size: '50000+ employees'
            }
        ];
        
        const results = await buyerGroupAI.batchProcessCompanies(exampleCompanies, {
            products: 'Store fixtures and equipment',
            dealSize: '$100K-$1M'
        });
        
        await buyerGroupAI.saveBuyerGroupResults(results, 'example-buyer-groups.json');
        buyerGroupAI.printStats();
    } else {
        console.log('Usage: node universal-buyer-group-ai.js --example');
        console.log('');
        console.log('This module provides AI-powered buyer group discovery for any company.');
        console.log('Import and use the UniversalBuyerGroupAI class in your applications.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { BuyerGroupAI };
