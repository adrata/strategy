#!/usr/bin/env node

/**
 * 🎯 PERSONALIZED 1:1 BUYER GROUP AI
 * 
 * Creates completely personalized buyer groups for each individual seller:
 * - Analyzes SELLER context (product, deal size, selling style, experience)
 * - Analyzes TARGET COMPANY context (industry, size, culture, procurement maturity)
 * - Analyzes PRODUCT/SERVICE context (technical vs operational, deal complexity)
 * - Generates 1:1 personalized buyer groups using AI
 * 
 * Examples:
 * - Dano selling $500K fixtures to Kwik Trip → Operations-focused buyer group
 * - Sarah selling $50K software to startup → Technical-focused buyer group  
 * - Mike selling $2M manufacturing to Fortune 500 → Executive-focused buyer group
 */

const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

class PersonalizedBuyerGroupAI {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: config.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
            MAX_RETRIES: 3,
            RATE_LIMIT_DELAY: 2000,
            ...config
        };
        
        this.stats = {
            personalizedAnalyses: 0,
            buyerGroupsGenerated: 0,
            aiCallsMade: 0,
            errors: 0
        };
    }

    /**
     * 🎯 GENERATE PERSONALIZED BUYER GROUP
     * 
     * Main function that creates 1:1 personalized buyer group based on:
     * - Seller profile and context
     * - Target company analysis  
     * - Product/service being sold
     * - Deal size and complexity
     */
    async generatePersonalizedBuyerGroup(sellerContext, targetCompany, productContext) {
        console.log(`🎯 Personalized Buyer Group: ${sellerContext.name} → ${targetCompany.name}`);
        console.log(`   Product: ${productContext.name} (${productContext.dealSize})`);
        
        try {
            // STEP 1: Analyze seller's unique context
            const sellerAnalysis = await this.analyzeSellerContext(sellerContext);
            
            // STEP 2: Analyze target company's specific context
            const companyAnalysis = await this.analyzeTargetCompanyContext(targetCompany);
            
            // STEP 3: Analyze product/service context
            const productAnalysis = await this.analyzeProductContext(productContext);
            
            // STEP 4: Generate personalized buyer group using AI
            const personalizedBuyerGroup = await this.generateAIPersonalizedBuyerGroup(
                sellerAnalysis, 
                companyAnalysis, 
                productAnalysis
            );
            
            // STEP 5: Validate and refine for this specific scenario
            const validatedBuyerGroup = await this.validatePersonalizedBuyerGroup(
                personalizedBuyerGroup,
                sellerAnalysis,
                companyAnalysis,
                productAnalysis
            );
            
            this.stats.personalizedAnalyses++;
            this.stats.buyerGroupsGenerated++;
            
            return {
                seller: sellerContext,
                targetCompany: targetCompany,
                product: productContext,
                sellerAnalysis: sellerAnalysis,
                companyAnalysis: companyAnalysis,
                productAnalysis: productAnalysis,
                personalizedBuyerGroup: validatedBuyerGroup,
                confidence: validatedBuyerGroup.confidence,
                personalizationFactors: validatedBuyerGroup.personalizationFactors
            };
            
        } catch (error) {
            console.error(`❌ Personalized analysis failed:`, error);
            this.stats.errors++;
            return null;
        }
    }

    /**
     * 👤 ANALYZE SELLER CONTEXT
     */
    async analyzeSellerContext(sellerContext) {
        console.log('   👤 Analyzing seller context...');
        
        const prompt = `Analyze this seller's unique context for personalized buyer group discovery:

SELLER PROFILE:
Name: ${sellerContext.name}
Title: ${sellerContext.title || 'Unknown'}
Company: ${sellerContext.company || 'Unknown'}
Industry Experience: ${sellerContext.industryExperience || 'Unknown'}
Selling Experience: ${sellerContext.sellingExperience || 'Unknown'}
Territory: ${sellerContext.territory || 'Unknown'}
Previous Success: ${sellerContext.previousSuccess || 'Unknown'}

SELLING CONTEXT:
Products/Services: ${sellerContext.products || 'Unknown'}
Typical Deal Size: ${sellerContext.typicalDealSize || 'Unknown'}
Sales Cycle Length: ${sellerContext.salesCycleLength || 'Unknown'}
Selling Style: ${sellerContext.sellingStyle || 'Unknown'}
Key Strengths: ${sellerContext.keyStrengths || 'Unknown'}
Common Objections: ${sellerContext.commonObjections || 'Unknown'}

Based on this seller profile, determine:
1. What type of buyer group would this seller be most successful with?
2. Which roles should they prioritize based on their strengths?
3. What's their optimal buyer group size based on their experience?
4. Which roles might be challenging for them to engage?
5. What's their best approach strategy?

Respond in JSON format with personalized seller insights.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const analysis = this.parseAIResponse(response);
            
            console.log(`      ✅ Seller analysis complete: ${analysis.sellerType || 'Unknown type'}`);
            
            return {
                ...sellerContext,
                aiAnalysis: analysis,
                sellerType: analysis.sellerType,
                optimalBuyerGroupSize: analysis.optimalBuyerGroupSize,
                priorityRoles: analysis.priorityRoles || [],
                challengingRoles: analysis.challengingRoles || [],
                approachStrategy: analysis.approachStrategy,
                personalizedFactors: analysis.personalizedFactors || []
            };
            
        } catch (error) {
            console.log('      ⚠️ Seller analysis failed, using defaults');
            return {
                ...sellerContext,
                sellerType: 'Generalist',
                optimalBuyerGroupSize: 'medium',
                priorityRoles: ['champions', 'decisionMakers'],
                challengingRoles: [],
                approachStrategy: 'relationship-building'
            };
        }
    }

    /**
     * 🏢 ANALYZE TARGET COMPANY CONTEXT
     */
    async analyzeTargetCompanyContext(targetCompany) {
        console.log(`   🏢 Analyzing target company: ${targetCompany.name}...`);
        
        const prompt = `Analyze this target company for personalized buyer group discovery:

TARGET COMPANY:
Name: ${targetCompany.name}
Industry: ${targetCompany.industry || 'Unknown'}
Vertical: ${targetCompany.vertical || 'Unknown'}
Size: ${targetCompany.size || 'Unknown'}
Revenue: ${targetCompany.revenue || 'Unknown'}
Location: ${targetCompany.location || 'Unknown'}
Website: ${targetCompany.website || 'Unknown'}
Public/Private: ${targetCompany.publicPrivate || 'Unknown'}

COMPANY CHARACTERISTICS:
Culture: ${targetCompany.culture || 'Unknown'}
Decision Style: ${targetCompany.decisionStyle || 'Unknown'}
Procurement Maturity: ${targetCompany.procurementMaturity || 'Unknown'}
Innovation Level: ${targetCompany.innovationLevel || 'Unknown'}
Risk Tolerance: ${targetCompany.riskTolerance || 'Unknown'}

Based on this company profile, determine:
1. What's their typical decision-making process?
2. How centralized vs decentralized are their decisions?
3. What's their procurement maturity level?
4. Who typically has budget authority at this company size?
5. What departments would be most influential?
6. What's their typical vendor evaluation process?
7. What are potential blockers or approval gates?

Respond in JSON format with company-specific buyer group insights.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const analysis = this.parseAIResponse(response);
            
            console.log(`      ✅ Company analysis complete: ${analysis.decisionStyle || 'Unknown style'}`);
            
            return {
                ...targetCompany,
                aiAnalysis: analysis,
                decisionStyle: analysis.decisionStyle,
                procurementMaturity: analysis.procurementMaturity,
                budgetAuthority: analysis.budgetAuthority,
                influentialDepartments: analysis.influentialDepartments || [],
                approvalGates: analysis.approvalGates || [],
                vendorEvaluationProcess: analysis.vendorEvaluationProcess
            };
            
        } catch (error) {
            console.log('      ⚠️ Company analysis failed, using defaults');
            return {
                ...targetCompany,
                decisionStyle: 'committee',
                procurementMaturity: 'medium',
                budgetAuthority: 'distributed',
                influentialDepartments: [],
                approvalGates: []
            };
        }
    }

    /**
     * 📦 ANALYZE PRODUCT CONTEXT
     */
    async analyzeProductContext(productContext) {
        console.log(`   📦 Analyzing product: ${productContext.name}...`);
        
        const prompt = `Analyze this product/service for personalized buyer group discovery:

PRODUCT/SERVICE:
Name: ${productContext.name}
Category: ${productContext.category || 'Unknown'}
Deal Size: ${productContext.dealSize || 'Unknown'}
Implementation Complexity: ${productContext.complexity || 'Unknown'}
Technical Requirements: ${productContext.technicalRequirements || 'Unknown'}
Business Impact: ${productContext.businessImpact || 'Unknown'}

PURCHASE CHARACTERISTICS:
Purchase Type: ${productContext.purchaseType || 'Unknown'} (one-time, recurring, subscription)
Decision Urgency: ${productContext.urgency || 'Unknown'}
Risk Level: ${productContext.riskLevel || 'Unknown'}
Compliance Requirements: ${productContext.compliance || 'Unknown'}
Integration Complexity: ${productContext.integration || 'Unknown'}

Based on this product profile, determine:
1. What type of purchase decision is this? (technical, operational, strategic)
2. What departments would be most affected by this product?
3. What level of authority is needed for this deal size?
4. What are the key evaluation criteria?
5. Who would be the primary beneficiaries?
6. What are potential concerns or objections?
7. What approval processes would be required?

Respond in JSON format with product-specific buyer group requirements.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const analysis = this.parseAIResponse(response);
            
            console.log(`      ✅ Product analysis complete: ${analysis.purchaseType || 'Unknown type'}`);
            
            return {
                ...productContext,
                aiAnalysis: analysis,
                purchaseType: analysis.purchaseType,
                affectedDepartments: analysis.affectedDepartments || [],
                requiredAuthority: analysis.requiredAuthority,
                evaluationCriteria: analysis.evaluationCriteria || [],
                primaryBeneficiaries: analysis.primaryBeneficiaries || [],
                potentialConcerns: analysis.potentialConcerns || [],
                approvalProcesses: analysis.approvalProcesses || []
            };
            
        } catch (error) {
            console.log('      ⚠️ Product analysis failed, using defaults');
            return {
                ...productContext,
                purchaseType: 'operational',
                affectedDepartments: [],
                requiredAuthority: 'medium',
                evaluationCriteria: [],
                primaryBeneficiaries: []
            };
        }
    }

    /**
     * 🤖 GENERATE AI PERSONALIZED BUYER GROUP
     */
    async generateAIPersonalizedBuyerGroup(sellerAnalysis, companyAnalysis, productAnalysis) {
        console.log('   🤖 Generating personalized buyer group with AI...');
        
        const prompt = `Create a personalized buyer group for this specific selling scenario:

SELLER CONTEXT:
${JSON.stringify(sellerAnalysis, null, 2)}

TARGET COMPANY:
${JSON.stringify(companyAnalysis, null, 2)}

PRODUCT/SERVICE:
${JSON.stringify(productAnalysis, null, 2)}

Based on this COMPLETE context, create a personalized buyer group that considers:

1. SELLER OPTIMIZATION: What buyer group would this specific seller be most successful with?
2. COMPANY ADAPTATION: How does this company's culture and decision style affect the buyer group?
3. PRODUCT ALIGNMENT: What roles are most relevant for this specific product/service?
4. DEAL SIZE MATCHING: What authority levels are needed for this deal size?
5. PERSONALIZATION: How should this be customized for this seller's strengths?

Generate a buyer group with these roles:
- Decision Makers (budget authority)
- Champions (internal advocates)
- Influencers (provide input and recommendations) 
- Financial Stakeholders (budget holders)
- Procurement Stakeholders (vendor management)
- Blockers (can delay decisions)
- Introducers (provide access)

For EACH role, provide:
- Specific job titles to target
- Departments to search in
- Why they're relevant to THIS specific scenario
- How many of each role for THIS situation
- Personalized approach strategy for THIS seller
- Confidence level for THIS role in THIS context

Respond in JSON format with complete personalized buyer group.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const buyerGroup = this.parseAIResponse(response);
            
            console.log(`      ✅ Personalized buyer group generated`);
            
            return buyerGroup;
            
        } catch (error) {
            console.log('      ⚠️ AI generation failed, using adaptive defaults');
            return this.generateAdaptiveBuyerGroup(sellerAnalysis, companyAnalysis, productAnalysis);
        }
    }

    /**
     * 🎯 GENERATE ADAPTIVE BUYER GROUP (FALLBACK)
     */
    generateAdaptiveBuyerGroup(sellerAnalysis, companyAnalysis, productAnalysis) {
        const buyerGroup = {
            roles: {},
            confidence: 65,
            reasoning: 'Adaptive buyer group based on context analysis',
            personalizationFactors: []
        };

        // Adapt based on deal size
        const dealSize = this.parseDealSize(productAnalysis.dealSize);
        
        if (dealSize >= 1000000) { // $1M+
            buyerGroup.roles.decisionMakers = {
                titles: ['ceo', 'president', 'executive vice president'],
                count: 1,
                reasoning: 'Large deal requires C-level approval'
            };
        } else if (dealSize >= 100000) { // $100K+
            buyerGroup.roles.decisionMakers = {
                titles: ['vice president', 'vp', 'director'],
                count: 2,
                reasoning: 'Mid-size deal requires VP-level approval'
            };
        } else { // <$100K
            buyerGroup.roles.decisionMakers = {
                titles: ['director', 'manager', 'head of'],
                count: 1,
                reasoning: 'Smaller deal can be approved at director level'
            };
        }

        // Adapt based on product type
        if (productAnalysis.purchaseType === 'technical') {
            buyerGroup.roles.influencers = {
                titles: ['technical director', 'it manager', 'systems manager'],
                count: 2,
                reasoning: 'Technical product requires technical evaluation'
            };
        } else if (productAnalysis.purchaseType === 'operational') {
            buyerGroup.roles.influencers = {
                titles: ['operations manager', 'process manager', 'workflow manager'],
                count: 2,
                reasoning: 'Operational product requires operations input'
            };
        }

        // Always include financial for significant deals
        if (dealSize >= 50000) {
            buyerGroup.roles.financialStakeholders = {
                titles: ['cfo', 'finance director', 'controller'],
                count: 1,
                reasoning: 'Financial approval needed for significant investment'
            };
        }

        return buyerGroup;
    }

    /**
     * 💰 PARSE DEAL SIZE
     */
    parseDealSize(dealSizeString) {
        if (!dealSizeString) return 50000; // Default
        
        const matches = dealSizeString.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)[KkMm]?/);
        if (!matches) return 50000;
        
        let amount = parseFloat(matches[1].replace(/,/g, ''));
        
        if (dealSizeString.toLowerCase().includes('k')) {
            amount *= 1000;
        } else if (dealSizeString.toLowerCase().includes('m')) {
            amount *= 1000000;
        }
        
        return amount;
    }

    /**
     * ✅ VALIDATE PERSONALIZED BUYER GROUP
     */
    async validatePersonalizedBuyerGroup(buyerGroup, sellerAnalysis, companyAnalysis, productAnalysis) {
        console.log('   ✅ Validating personalized buyer group...');
        
        const prompt = `Validate this personalized buyer group for the specific scenario:

SELLER: ${sellerAnalysis.name} (${sellerAnalysis.sellerType})
COMPANY: ${companyAnalysis.name} (${companyAnalysis.size}, ${companyAnalysis.decisionStyle})
PRODUCT: ${productAnalysis.name} (${productAnalysis.dealSize}, ${productAnalysis.purchaseType})

PROPOSED BUYER GROUP:
${JSON.stringify(buyerGroup, null, 2)}

Validate this buyer group considering:
1. Is this optimal for THIS specific seller's strengths and experience?
2. Does this match THIS company's decision-making culture?
3. Are these the right roles for THIS specific product/service?
4. Is the buyer group size appropriate for THIS deal complexity?
5. Are we missing any critical roles for THIS scenario?
6. Are there any roles that aren't relevant for THIS situation?

Provide:
- Confidence score (0-100) for this personalized buyer group
- Specific personalization factors that make this unique
- Recommendations for this seller's approach
- Any adjustments needed for this scenario

Respond in JSON format with validation and personalization insights.`;

        try {
            const response = await this.callPerplexityAI(prompt);
            const validation = this.parseAIResponse(response);
            
            console.log(`      ✅ Validation complete: ${validation.confidence || 75}% confidence`);
            
            return {
                ...buyerGroup,
                confidence: validation.confidence || 75,
                personalizationFactors: validation.personalizationFactors || [],
                sellerRecommendations: validation.sellerRecommendations || [],
                scenarioAdjustments: validation.scenarioAdjustments || [],
                uniqueFactors: validation.uniqueFactors || []
            };
            
        } catch (error) {
            console.log('      ⚠️ Validation failed, using default confidence');
            return {
                ...buyerGroup,
                confidence: 70,
                personalizationFactors: ['Default personalization applied'],
                sellerRecommendations: [],
                scenarioAdjustments: []
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
                        content: 'You are an expert B2B sales strategist specializing in personalized buyer group optimization. Consider the unique combination of seller, company, and product context to create highly personalized recommendations.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.4, // Slightly higher for personalization creativity
                max_tokens: 3000
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
            console.log('      ⚠️ Failed to parse AI response as JSON');
            return { error: 'Failed to parse response', rawResponse: response };
        }
    }

    /**
     * 🎯 BATCH PERSONALIZED ANALYSIS
     */
    async batchPersonalizedAnalysis(scenarios, options = {}) {
        console.log(`🎯 BATCH PERSONALIZED BUYER GROUP ANALYSIS`);
        console.log('==========================================');
        console.log(`Processing ${scenarios.length} personalized scenarios\n`);
        
        const results = [];
        
        for (let i = 0; i < scenarios.length; i++) {
            const scenario = scenarios[i];
            
            console.log(`--- Scenario ${i+1}/${scenarios.length} ---`);
            
            const result = await this.generatePersonalizedBuyerGroup(
                scenario.seller,
                scenario.targetCompany,
                scenario.product
            );
            
            if (result) {
                results.push(result);
            }
            
            // Rate limiting
            if (i < scenarios.length - 1) {
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
            }
        }
        
        console.log(`\n✅ Batch analysis complete: ${results.length} personalized buyer groups`);
        
        return results;
    }

    /**
     * 📊 PRINT STATISTICS
     */
    printStats() {
        console.log('\n📊 PERSONALIZED BUYER GROUP AI STATS');
        console.log('====================================');
        console.log(`🎯 Personalized Analyses: ${this.stats.personalizedAnalyses}`);
        console.log(`🏢 Buyer Groups Generated: ${this.stats.buyerGroupsGenerated}`);
        console.log(`🤖 AI Calls Made: ${this.stats.aiCallsMade}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        
        const successRate = Math.round((this.stats.buyerGroupsGenerated / this.stats.personalizedAnalyses) * 100);
        console.log(`📈 Success Rate: ${successRate}%`);
        
        console.log('\n🎯 PERSONALIZATION BENEFITS:');
        console.log('   ✅ 1:1 customized for each seller');
        console.log('   ✅ Adapts to company culture and size');
        console.log('   ✅ Optimized for specific product/service');
        console.log('   ✅ Considers deal size and complexity');
        console.log('   ✅ Matches seller strengths and experience');
    }
}

/**
 * 🚀 MAIN EXECUTION
 */
async function main() {
    const personalizedAI = new PersonalizedBuyerGroupAI();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--example')) {
        console.log('🧪 Running personalized buyer group examples...');
        
        const exampleScenarios = [
            {
                seller: {
                    name: 'Dan Mirolli',
                    company: 'Retail Product Solutions',
                    products: 'Store fixtures, millwork, coolers',
                    typicalDealSize: '$100K-$1M',
                    industryExperience: '15+ years retail',
                    sellingStyle: 'Relationship-building',
                    territory: 'Midwest US'
                },
                targetCompany: {
                    name: 'Kwik Trip, Inc.',
                    industry: 'Retail',
                    vertical: 'C Stores',
                    size: '1000+ employees',
                    location: 'Wisconsin'
                },
                product: {
                    name: 'Store Fixtures & Millwork',
                    category: 'Capital Equipment',
                    dealSize: '$500K',
                    purchaseType: 'operational',
                    complexity: 'medium'
                }
            },
            {
                seller: {
                    name: 'Sarah Johnson',
                    company: 'TechSoft Solutions',
                    products: 'CRM Software',
                    typicalDealSize: '$50K-$200K',
                    industryExperience: '8 years SaaS',
                    sellingStyle: 'Consultative',
                    territory: 'West Coast'
                },
                targetCompany: {
                    name: 'Mid-Size Manufacturing',
                    industry: 'Manufacturing',
                    size: '500 employees',
                    location: 'California'
                },
                product: {
                    name: 'CRM Software Platform',
                    category: 'Software',
                    dealSize: '$75K',
                    purchaseType: 'technical',
                    complexity: 'high'
                }
            }
        ];
        
        const results = await personalizedAI.batchPersonalizedAnalysis(exampleScenarios);
        
        // Save results
        const outputDir = path.join(__dirname, '../outputs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const reportFile = path.join(outputDir, 'personalized-buyer-groups-examples.json');
        fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
        
        console.log(`💾 Example results saved to: ${reportFile}`);
        personalizedAI.printStats();
        
    } else {
        console.log('🎯 PERSONALIZED BUYER GROUP AI');
        console.log('==============================');
        console.log('Usage: node personalized-buyer-group-ai.js --example');
        console.log('');
        console.log('This system creates 1:1 personalized buyer groups considering:');
        console.log('• Seller profile and experience');
        console.log('• Target company culture and size');
        console.log('• Product/service being sold');
        console.log('• Deal size and complexity');
        console.log('• Industry and market context');
        console.log('');
        console.log('Import and use PersonalizedBuyerGroupAI class for custom scenarios.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { PersonalizedBuyerGroupAI };
