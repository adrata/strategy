#!/usr/bin/env node

/**
 * 🏢 COMPANY SIZE DETECTOR MODULE
 * 
 * Detects company size and applies size-specific discovery strategies:
 * - Startup (1-50 employees): Leadership page scraping + LinkedIn research
 * - Small (51-200 employees): CoreSignal + Executive research
 * - Medium (201-1000 employees): CoreSignal + Key executives
 * - Large (1000+ employees): CoreSignal + Multi-source discovery
 */

class CompanySizeDetector {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };
        
        this.sizeCategories = {
            STARTUP: { min: 1, max: 50, name: 'startup' },
            SMALL: { min: 51, max: 200, name: 'small' },
            MEDIUM: { min: 201, max: 1000, name: 'medium' },
            LARGE: { min: 1001, max: Infinity, name: 'large' }
        };
    }

    /**
     * 🎯 DETECT COMPANY SIZE
     * 
     * Uses multiple signals to determine company size:
     * 1. CoreSignal employee count (if available)
     * 2. Perplexity AI research
     * 3. Domain analysis
     * 4. Company name patterns
     */
    async detectCompanySize(companyName, domain, companyId = null) {
        console.log(`🏢 Detecting company size for: ${companyName}`);
        
        const signals = {
            employeeCount: null,
            domainAnalysis: null,
            nameAnalysis: null,
            aiResearch: null
        };

        // Signal 1: CoreSignal employee count
        if (companyId && this.config.CORESIGNAL_API_KEY) {
            signals.employeeCount = await this.getEmployeeCountFromCoreSignal(companyId);
        }

        // Signal 2: Domain analysis
        signals.domainAnalysis = this.analyzeDomain(domain);

        // Signal 3: Company name analysis
        signals.nameAnalysis = this.analyzeCompanyName(companyName);

        // Signal 4: AI research (if other signals are inconclusive)
        if (!signals.employeeCount && this.config.PERPLEXITY_API_KEY) {
            signals.aiResearch = await this.researchCompanySizeWithAI(companyName, domain);
        }

        // Determine final size category
        const sizeCategory = this.determineSizeCategory(signals);
        
        console.log(`   📊 Company size detected: ${sizeCategory.name.toUpperCase()} (${sizeCategory.employeeRange})`);
        console.log(`   🎯 Strategy: ${sizeCategory.strategy}`);
        
        return {
            category: sizeCategory.name,
            employeeRange: sizeCategory.employeeRange,
            confidence: sizeCategory.confidence,
            strategy: sizeCategory.strategy,
            signals: signals,
            recommendations: sizeCategory.recommendations
        };
    }

    /**
     * 📊 GET EMPLOYEE COUNT FROM CORESIGNAL
     */
    async getEmployeeCountFromCoreSignal(companyId) {
        try {
            console.log(`   🔍 CoreSignal: Getting employee count for company ${companyId}...`);
            
            const response = await fetch(`https://api.coresignal.com/cdapi/v2/company_multi_source/collect/${companyId}`, {
                method: 'GET',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Accept': 'application/json'
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                const employeeCount = data.employee_count || data.employees || data.size;
                
                if (employeeCount) {
                    console.log(`   ✅ CoreSignal: Found ${employeeCount} employees`);
                    return {
                        count: employeeCount,
                        source: 'coresignal',
                        confidence: 90
                    };
                }
            }
        } catch (error) {
            console.log(`   ⚠️ CoreSignal employee count failed: ${error.message}`);
        }
        
        return null;
    }

    /**
     * 🌐 ANALYZE DOMAIN FOR SIZE SIGNALS
     */
    analyzeDomain(domain) {
        const signals = {
            tld: null,
            subdomain: null,
            length: null,
            patterns: []
        };

        if (!domain) return signals;

        // TLD analysis
        const tld = domain.split('.').pop();
        signals.tld = tld;

        // Subdomain analysis
        const parts = domain.split('.');
        if (parts.length > 2) {
            signals.subdomain = parts[0];
        }

        // Domain length
        signals.length = domain.length;

        // Pattern analysis
        if (domain.includes('startup') || domain.includes('labs') || domain.includes('tech')) {
            signals.patterns.push('startup_indicators');
        }
        
        if (domain.includes('corp') || domain.includes('inc') || domain.includes('llc')) {
            signals.patterns.push('corporate_indicators');
        }

        // Size estimation based on domain
        let estimatedSize = 'unknown';
        let confidence = 30;

        if (signals.patterns.includes('startup_indicators')) {
            estimatedSize = 'startup';
            confidence = 60;
        } else if (signals.patterns.includes('corporate_indicators')) {
            estimatedSize = 'medium';
            confidence = 50;
        }

        return {
            ...signals,
            estimatedSize,
            confidence
        };
    }

    /**
     * 📝 ANALYZE COMPANY NAME FOR SIZE SIGNALS
     */
    analyzeCompanyName(companyName) {
        const signals = {
            length: companyName.length,
            words: companyName.split(' ').length,
            patterns: []
        };

        // Pattern detection
        if (companyName.toLowerCase().includes('startup') || 
            companyName.toLowerCase().includes('labs') ||
            companyName.toLowerCase().includes('tech')) {
            signals.patterns.push('startup_indicators');
        }

        if (companyName.toLowerCase().includes('corp') ||
            companyName.toLowerCase().includes('inc') ||
            companyName.toLowerCase().includes('llc') ||
            companyName.toLowerCase().includes('ltd')) {
            signals.patterns.push('corporate_indicators');
        }

        // Size estimation
        let estimatedSize = 'unknown';
        let confidence = 20;

        if (signals.patterns.includes('startup_indicators')) {
            estimatedSize = 'startup';
            confidence = 50;
        } else if (signals.patterns.includes('corporate_indicators')) {
            estimatedSize = 'medium';
            confidence = 40;
        }

        return {
            ...signals,
            estimatedSize,
            confidence
        };
    }

    /**
     * 🤖 RESEARCH COMPANY SIZE WITH AI
     */
    async researchCompanySizeWithAI(companyName, domain) {
        try {
            console.log(`   🤖 Perplexity: Researching company size for ${companyName}...`);
            
            const prompt = `What is the approximate company size (number of employees) for ${companyName} (${domain})? 
            
            Respond in this exact format:
            SIZE: [1-50|51-200|201-1000|1000+]
            CONFIDENCE: [0-100]
            SOURCE: [Brief explanation of source]`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 150
                }),
                timeout: 15000
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0]?.message?.content || '';
                
                // Parse response
                const sizeMatch = content.match(/SIZE:\s*([^\\n]+)/);
                const confidenceMatch = content.match(/CONFIDENCE:\s*(\d+)/);
                const sourceMatch = content.match(/SOURCE:\s*([^\\n]+)/);

                if (sizeMatch) {
                    const sizeRange = sizeMatch[1].trim();
                    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
                    const source = sourceMatch ? sourceMatch[1].trim() : 'AI research';

                    console.log(`   ✅ Perplexity: Estimated size ${sizeRange} (${confidence}% confidence)`);

                    return {
                        sizeRange,
                        confidence,
                        source,
                        rawResponse: content
                    };
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Perplexity company size research failed: ${error.message}`);
        }

        return null;
    }

    /**
     * 🎯 DETERMINE FINAL SIZE CATEGORY
     */
    determineSizeCategory(signals) {
        const candidates = [];

        // CoreSignal employee count (highest priority)
        if (signals.employeeCount) {
            const count = signals.employeeCount.count;
            let category = 'large';
            
            if (count <= 50) category = 'startup';
            else if (count <= 200) category = 'small';
            else if (count <= 1000) category = 'medium';
            
            candidates.push({
                category,
                confidence: signals.employeeCount.confidence,
                source: 'coresignal',
                employeeRange: `${count} employees`
            });
        }

        // AI research
        if (signals.aiResearch) {
            const sizeRange = signals.aiResearch.sizeRange;
            let category = 'large';
            
            if (sizeRange === '1-50') category = 'startup';
            else if (sizeRange === '51-200') category = 'small';
            else if (sizeRange === '201-1000') category = 'medium';
            
            candidates.push({
                category,
                confidence: signals.aiResearch.confidence,
                source: 'ai_research',
                employeeRange: sizeRange
            });
        }

        // Domain analysis
        if (signals.domainAnalysis && signals.domainAnalysis.estimatedSize !== 'unknown') {
            candidates.push({
                category: signals.domainAnalysis.estimatedSize,
                confidence: signals.domainAnalysis.confidence,
                source: 'domain_analysis',
                employeeRange: 'estimated'
            });
        }

        // Name analysis
        if (signals.nameAnalysis && signals.nameAnalysis.estimatedSize !== 'unknown') {
            candidates.push({
                category: signals.nameAnalysis.estimatedSize,
                confidence: signals.nameAnalysis.confidence,
                source: 'name_analysis',
                employeeRange: 'estimated'
            });
        }

        // Select best candidate
        if (candidates.length === 0) {
            // Default to medium if no signals
            return this.getSizeCategoryConfig('medium', 'unknown', 20);
        }

        // Sort by confidence and select highest
        candidates.sort((a, b) => b.confidence - a.confidence);
        const bestCandidate = candidates[0];

        return this.getSizeCategoryConfig(bestCandidate.category, bestCandidate.employeeRange, bestCandidate.confidence);
    }

    /**
     * 📋 GET SIZE CATEGORY CONFIGURATION
     */
    getSizeCategoryConfig(category, employeeRange, confidence) {
        const configs = {
            startup: {
                name: 'startup',
                employeeRange,
                confidence,
                strategy: 'leadership_scraping_first',
                recommendations: [
                    'Use leadership page scraping as primary method',
                    'Fall back to LinkedIn research',
                    'Skip CoreSignal key executives (may not have formal structure)',
                    'Focus on founder/CEO as potential CFO/CRO'
                ]
            },
            small: {
                name: 'small',
                employeeRange,
                confidence,
                strategy: 'coresignal_with_research',
                recommendations: [
                    'Use CoreSignal multi-source discovery',
                    'Fall back to executive research',
                    'Use leadership page scraping for missing executives',
                    'Consider founder/CEO roles for finance/revenue'
                ]
            },
            medium: {
                name: 'medium',
                employeeRange,
                confidence,
                strategy: 'coresignal_key_executives',
                recommendations: [
                    'Use CoreSignal key executives first',
                    'Fall back to multi-source discovery',
                    'Use comprehensive role definitions',
                    'Apply waterfall logic for role selection'
                ]
            },
            large: {
                name: 'large',
                employeeRange,
                confidence,
                strategy: 'coresignal_comprehensive',
                recommendations: [
                    'Use CoreSignal comprehensive discovery',
                    'Apply all role variations',
                    'Use multi-strategy approach with fallbacks',
                    'Focus on C-level and VP-level executives'
                ]
            }
        };

        return configs[category] || configs.medium;
    }

    /**
     * 🎯 GET DISCOVERY STRATEGY FOR SIZE
     */
    getDiscoveryStrategy(sizeCategory) {
        const strategies = {
            startup: {
                primary: 'leadership_scraping',
                secondary: 'linkedin_research',
                tertiary: 'ai_research',
                skipCoreSignal: false,
                roleExpansion: true
            },
            small: {
                primary: 'coresignal_multisource',
                secondary: 'executive_research',
                tertiary: 'leadership_scraping',
                skipCoreSignal: false,
                roleExpansion: true
            },
            medium: {
                primary: 'coresignal_key_executives',
                secondary: 'coresignal_multisource',
                tertiary: 'executive_research',
                skipCoreSignal: false,
                roleExpansion: false
            },
            large: {
                primary: 'coresignal_comprehensive',
                secondary: 'coresignal_key_executives',
                tertiary: 'coresignal_multisource',
                skipCoreSignal: false,
                roleExpansion: false
            }
        };

        return strategies[sizeCategory] || strategies.medium;
    }
}

module.exports = { CompanySizeDetector };
