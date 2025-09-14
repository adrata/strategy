#!/usr/bin/env node

/**
 * 🌐 DOMAIN ANALYSIS MODULE
 * 
 * Determines the correct email domain for executives:
 * 1. Detects product subdomains vs corporate domains
 * 2. Analyzes domain patterns for acquired companies
 * 3. Generates email patterns based on domain analysis
 * 4. Handles complex corporate structures
 */

const fetch = require('node-fetch');

class DomainAnalysis {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.domainCache = new Map();
        this.subdomainPatterns = [
            'pos', 'app', 'portal', 'platform', 'api', 'admin', 'dashboard',
            'shop', 'store', 'buy', 'order', 'checkout', 'pay', 'billing',
            'support', 'help', 'docs', 'blog', 'news', 'careers', 'jobs'
        ];
    }

    /**
     * 🎯 INTELLIGENT DOMAIN ANALYSIS
     * 
     * Determines the correct email domain for executives
     */
    async analyzeEmailDomain(companyData) {
        console.log(`\n🎯 SMART DOMAIN ANALYSIS: ${companyData.name}`);
        console.log(`📍 Website: ${companyData.website}`);

        const analysis = {
            inputDomain: this.extractDomain(companyData.website),
            corporateDomain: null,
            executiveEmailDomain: null,
            isProductSubdomain: false,
            domainStrategy: 'unknown',
            confidence: 0,
            alternativeDomains: [],
            reasoning: []
        };

        try {
            // STEP 1: Detect if input is a product subdomain
            const subdomainAnalysis = this.analyzeSubdomain(analysis.inputDomain);
            analysis.isProductSubdomain = subdomainAnalysis.isProductSubdomain;
            analysis.reasoning.push(...subdomainAnalysis.reasoning);

            // STEP 2: If subdomain detected, find main corporate domain
            if (analysis.isProductSubdomain) {
                console.log(`   🔍 Product subdomain detected: ${analysis.inputDomain}`);
                const corporateAnalysis = await this.findCorporateDomain(companyData, analysis.inputDomain);
                analysis.corporateDomain = corporateAnalysis.corporateDomain;
                analysis.executiveEmailDomain = corporateAnalysis.executiveEmailDomain;
                analysis.confidence = corporateAnalysis.confidence;
                analysis.reasoning.push(...corporateAnalysis.reasoning);
            } else {
                // Use input domain as corporate domain
                analysis.corporateDomain = analysis.inputDomain;
                analysis.executiveEmailDomain = analysis.inputDomain;
                analysis.confidence = 85;
                analysis.reasoning.push('Input domain appears to be main corporate domain');
            }

            // STEP 3: Generate alternative domains
            analysis.alternativeDomains = this.generateAlternativeDomains(analysis);

            // STEP 4: Determine domain strategy
            analysis.domainStrategy = this.determineDomainStrategy(analysis);

            console.log(`   ✅ Analysis complete:`);
            console.log(`   📧 Executive email domain: ${analysis.executiveEmailDomain}`);
            console.log(`   🏢 Corporate domain: ${analysis.corporateDomain}`);
            console.log(`   📊 Confidence: ${analysis.confidence}%`);
            console.log(`   🎯 Strategy: ${analysis.domainStrategy}`);

            return analysis;

        } catch (error) {
            console.error(`   ❌ Domain analysis error: ${error.message}`);
            analysis.error = error.message;
            return analysis;
        }
    }

    /**
     * 🔍 ANALYZE SUBDOMAIN PATTERNS
     */
    analyzeSubdomain(domain) {
        const parts = domain.split('.');
        const subdomain = parts[0];
        
        const analysis = {
            isProductSubdomain: false,
            reasoning: []
        };

        // Check against known product subdomain patterns
        if (parts.length > 2 && this.subdomainPatterns.includes(subdomain.toLowerCase())) {
            analysis.isProductSubdomain = true;
            analysis.reasoning.push(`Subdomain '${subdomain}' matches product pattern`);
        }

        // Special cases
        const productIndicators = ['pos', 'app', 'portal', 'platform', 'shop', 'store'];
        if (productIndicators.includes(subdomain.toLowerCase())) {
            analysis.isProductSubdomain = true;
            analysis.reasoning.push(`Subdomain '${subdomain}' indicates product/service interface`);
        }

        // Length-based heuristic (product subdomains often short)
        if (parts.length > 2 && subdomain.length <= 4) {
            analysis.isProductSubdomain = true;
            analysis.reasoning.push(`Short subdomain '${subdomain}' likely indicates product`);
        }

        return analysis;
    }

    /**
     * 🏢 FIND CORPORATE DOMAIN
     * 
     * Uses AI to research the actual corporate email domain
     */
    async findCorporateDomain(companyData, subdomainInput) {
        const analysis = {
            corporateDomain: null,
            executiveEmailDomain: null,
            confidence: 0,
            reasoning: []
        };

        try {
            // Extract base domain from subdomain
            const domainParts = subdomainInput.split('.');
            const baseDomain = domainParts.slice(1).join('.');
            
            // Use AI to determine corporate domain for any subdomain
            const aiDomainAnalysis = await this.researchCorporateDomain(companyData, subdomainInput);
            if (aiDomainAnalysis.executiveEmailDomain) {
                analysis.corporateDomain = aiDomainAnalysis.corporateDomain;
                analysis.executiveEmailDomain = aiDomainAnalysis.executiveEmailDomain;
                analysis.confidence = aiDomainAnalysis.confidence;
                analysis.reasoning.push(aiDomainAnalysis.reasoning);
                return analysis;
            }

            // General case: try base domain
            analysis.corporateDomain = baseDomain;
            analysis.executiveEmailDomain = baseDomain;
            analysis.confidence = 80;
            analysis.reasoning.push(`Extracted base domain '${baseDomain}' from subdomain '${subdomainInput}'`);

            // Use AI to validate domain strategy
            const prompt = `Research the email domain strategy for ${companyData.name}.

Company context:
- Website: ${companyData.website}
- Detected subdomain: ${subdomainInput}
- Suspected main domain: ${baseDomain}

Research:
1. What email domain do executives actually use?
2. Is ${subdomainInput} a product subdomain while executives use ${baseDomain}?
3. Are there any other email domains this company uses?

Provide ONLY a JSON response:
{
    "executiveEmailDomain": "domain used by executives",
    "isSubdomainProduct": true/false,
    "mainCorporateDomain": "main corporate domain",
    "confidence": 0.90
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 500
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const aiResult = JSON.parse(jsonMatch[0]);
                        analysis.executiveEmailDomain = aiResult.executiveEmailDomain || baseDomain;
                        analysis.corporateDomain = aiResult.mainCorporateDomain || baseDomain;
                        analysis.confidence = (aiResult.confidence * 100) || 80;
                        analysis.reasoning.push('AI-validated domain strategy');
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ AI response parsing failed, using heuristic`);
                }
            }

        } catch (error) {
            console.log(`   ⚠️ Corporate domain research error: ${error.message}`);
            // Fallback to heuristic
            const domainParts = subdomainInput.split('.');
            analysis.corporateDomain = domainParts.slice(1).join('.');
            analysis.executiveEmailDomain = analysis.corporateDomain;
            analysis.confidence = 60;
            analysis.reasoning.push('Fallback heuristic: removed subdomain');
        }

        return analysis;
    }

    /**
     * 📧 GENERATE SMART EMAIL PATTERNS
     * 
     * Uses domain intelligence to generate accurate email patterns
     */
    generateSmartEmailPatterns(executiveName, domainAnalysis) {
        const patterns = [];
        const nameParts = executiveName.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';

        // Primary domain patterns (highest priority)
        if (domainAnalysis.executiveEmailDomain) {
            const domain = domainAnalysis.executiveEmailDomain;
            patterns.push(
                { email: `${firstName}.${lastName}@${domain}`, confidence: 90, reasoning: 'Primary corporate domain, standard pattern' },
                { email: `${firstName}${lastName}@${domain}`, confidence: 85, reasoning: 'Primary corporate domain, no separator' },
                { email: `${firstName}_${lastName}@${domain}`, confidence: 80, reasoning: 'Primary corporate domain, underscore separator' },
                { email: `${firstName[0]}${lastName}@${domain}`, confidence: 75, reasoning: 'Primary corporate domain, first initial + last' }
            );
        }

        // Alternative domain patterns (lower priority)
        domainAnalysis.alternativeDomains.forEach(altDomain => {
            patterns.push(
                { email: `${firstName}.${lastName}@${altDomain}`, confidence: 60, reasoning: `Alternative domain: ${altDomain}` },
                { email: `${firstName}${lastName}@${altDomain}`, confidence: 55, reasoning: `Alternative domain: ${altDomain}` }
            );
        });

        // Sort by confidence
        patterns.sort((a, b) => b.confidence - a.confidence);

        return patterns;
    }

    /**
     * 🔧 UTILITY METHODS
     */
    extractDomain(website) {
        try {
            return website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        } catch (error) {
            return website;
        }
    }

    generateAlternativeDomains(analysis) {
        const alternatives = [];
        
        // If we have both corporate and input domains, add both
        if (analysis.corporateDomain !== analysis.inputDomain) {
            alternatives.push(analysis.inputDomain);
        }

        // Common alternative patterns
        const baseName = analysis.corporateDomain.split('.')[0];
        alternatives.push(
            `${baseName}.com`,
            `${baseName}.co`,
            `www.${analysis.corporateDomain}`
        );

        // Remove duplicates and the main domain
        return [...new Set(alternatives)].filter(domain => 
            domain !== analysis.executiveEmailDomain && domain !== analysis.corporateDomain
        );
    }

    determineDomainStrategy(analysis) {
        if (analysis.isProductSubdomain) {
            return 'executives_use_main_domain';
        } else if (analysis.alternativeDomains.length > 0) {
            return 'multiple_domain_strategy';
        } else {
            return 'single_domain_strategy';
        }
    }

    /**
     * 🎯 RESEARCH CORPORATE DOMAIN (AI-DRIVEN)
     * 
     * Uses AI to research the actual corporate email domain for any company
     */
    async researchCorporateDomain(companyData, subdomainInput) {
        try {
            const domainParts = subdomainInput.split('.');
            const baseDomain = domainParts.slice(1).join('.');
            
            const prompt = `Research the email domain strategy for ${companyData.name} (${companyData.website}).

Analyze:
1. Is ${subdomainInput} a product/service subdomain while executives use ${baseDomain}?
2. What email domain do executives at ${companyData.name} actually use?
3. Are there any domain changes due to acquisitions or rebranding?

Provide ONLY a JSON response:
{
    "isProductSubdomain": true/false,
    "corporateDomain": "main corporate domain",
    "executiveEmailDomain": "domain executives use for email",
    "reasoning": "explanation of domain strategy",
    "confidence": 0.90
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 400
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        return {
                            corporateDomain: result.corporateDomain || baseDomain,
                            executiveEmailDomain: result.executiveEmailDomain || baseDomain,
                            confidence: Math.round((result.confidence || 0.8) * 100),
                            reasoning: result.reasoning || 'AI-researched domain strategy'
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Corporate domain research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Corporate domain research failed: ${error.message}`);
        }

        return null;
    }
}

module.exports = { DomainAnalysis };
