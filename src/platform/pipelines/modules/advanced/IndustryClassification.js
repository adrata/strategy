/**
 * INDUSTRY CLASSIFICATION MODULE
 * 
 * Provides industry classification and vertical analysis using:
 * - NAICS codes (North American Industry Classification System)
 * - SIC codes (Standard Industrial Classification)
 * - Intelligent sector and vertical mapping
 * - Competitive landscape analysis
 */

const fetch = require('node-fetch');

class IndustryClassification {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            WORKING_MODEL: 'sonar-pro',
            MAX_RETRIES: 2,
            RATE_LIMIT_DELAY: 2000,
            ...config
        };
    }

    /**
     * Analyze industry classification and competitive landscape
     */
    async analyzeIndustryAndCompetitors(companyResult) {
        console.log(`   Analyzing industry classification for ${companyResult.companyName}`);

        try {
            // Get industry classification
            const industryAnalysis = await this.classifyIndustry(companyResult);
            
            // Get competitor analysis
            const competitorAnalysis = await this.identifyCompetitors(companyResult, industryAnalysis);

            return {
                industryClassification: industryAnalysis,
                competitorIntelligence: competitorAnalysis,
                strategicContext: this.generateStrategicContext(industryAnalysis, competitorAnalysis)
            };

        } catch (error) {
            console.error(`   Industry analysis failed: ${error.message}`);
            return this.createEmptyAnalysis();
        }
    }

    /**
     * Classify industry using intelligent research
     */
    async classifyIndustry(companyResult) {
        const prompt = `Analyze the industry classification for ${companyResult.companyName} (${companyResult.website}).

Research and provide:
1. Primary NAICS code and description
2. Primary SIC code and description  
3. Industry sector (Technology, Healthcare, Financial Services, etc.)
4. Business vertical (SaaS, Manufacturing, Consulting, etc.)
5. Market segment (Enterprise, SMB, Consumer, etc.)
6. Industry trends and growth outlook

Please provide ONLY a JSON response:
{
    "naicsCode": "Primary NAICS code",
    "naicsDescription": "NAICS code description",
    "sicCode": "Primary SIC code", 
    "sicDescription": "SIC code description",
    "primarySector": "Technology/Healthcare/Financial Services/etc",
    "businessVertical": "SaaS/Manufacturing/Consulting/etc",
    "marketSegment": "Enterprise/SMB/Consumer/etc",
    "industryTrends": ["trend1", "trend2", "trend3"],
    "growthOutlook": "Growing/Stable/Declining",
    "marketSize": "Large/Medium/Small/Niche"
}`;

        const analysis = await this.callPerplexityAPI(prompt, 'industry_classification');
        return analysis;
    }

    /**
     * Identify competitors using intelligent research
     */
    async identifyCompetitors(companyResult, industryAnalysis) {
        const prompt = `Identify the top competitors for ${companyResult.companyName} (${companyResult.website}).

Consider:
1. Direct competitors (same products/services)
2. Indirect competitors (alternative solutions)
3. Market leaders in their space
4. Emerging competitors
5. Company size and market position

Please provide ONLY a JSON response:
{
    "directCompetitors": ["Company 1", "Company 2", "Company 3"],
    "indirectCompetitors": ["Company A", "Company B"],
    "marketLeaders": ["Leader 1", "Leader 2"],
    "emergingCompetitors": ["Startup 1", "Startup 2"],
    "competitivePosition": "Market Leader/Strong Player/Challenger/Niche Player",
    "competitiveDifferentiators": ["differentiator1", "differentiator2"],
    "marketShare": "Large/Medium/Small/Unknown",
    "competitiveThreat": "High/Medium/Low"
}`;

        const analysis = await this.callPerplexityAPI(prompt, 'competitor_analysis');
        return analysis;
    }

    /**
     * Generate strategic context combining industry and competitive intelligence
     */
    generateStrategicContext(industryAnalysis, competitorAnalysis) {
        const context = [];
        
        if (industryAnalysis.growthOutlook === 'Growing') {
            context.push('Growing industry - expansion opportunities');
        }
        
        if (competitorAnalysis.competitivePosition === 'Market Leader') {
            context.push('Market leader - enterprise-ready solutions needed');
        } else if (competitorAnalysis.competitivePosition === 'Challenger') {
            context.push('Challenger position - differentiation focus needed');
        }
        
        if (industryAnalysis.primarySector === 'Technology') {
            context.push('Technology sector - innovation and scalability focus');
        }
        
        if (competitorAnalysis.competitiveThreat === 'High') {
            context.push('High competitive pressure - efficiency solutions priority');
        }
        
        return context.join(' | ');
    }

    /**
     * Call Perplexity API for research
     */
    async callPerplexityAPI(prompt, requestType) {
        for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
            try {
                console.log(`   Researching ${requestType} (attempt ${attempt})`);

                const response = await fetch('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.config.WORKING_MODEL,
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        max_tokens: 1000
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices[0].message.content;
                    
                    try {
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const result = JSON.parse(jsonMatch[0]);
                            console.log(`   Research ${requestType} successful`);
                            
                            if (attempt < this.config.MAX_RETRIES) {
                                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
                            }
                            
                            return result;
                        }
                    } catch (parseError) {
                        console.log(`   JSON parsing failed: ${parseError.message}`);
                    }
                } else {
                    console.log(`   API error: ${response.status}`);
                }

            } catch (error) {
                console.log(`   Request error: ${error.message}`);
            }

            if (attempt < this.config.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
            }
        }

        return {};
    }

    createEmptyAnalysis() {
        return {
            industryClassification: {
                naicsCode: null,
                naicsDescription: null,
                sicCode: null,
                sicDescription: null,
                primarySector: null,
                businessVertical: null,
                marketSegment: null
            },
            competitorIntelligence: {
                directCompetitors: [],
                indirectCompetitors: [],
                marketLeaders: [],
                competitivePosition: null
            },
            strategicContext: null
        };
    }
}

module.exports = { IndustryClassification };
