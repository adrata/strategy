#!/usr/bin/env node

/**
 * 🧠 INTELLIGENCE GATHERING MODULE
 * 
 * Intelligence gathering with:
 * 1. Press release monitoring for executive appointments
 * 2. Job posting alerts for executive departures  
 * 3. News monitoring for leadership changes
 * 4. Multi-source validation and cross-referencing
 * 
 * All data gathered from real sources
 */

const fetch = require('node-fetch');

class IntelligenceGathering {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            NEWS_API_KEY: config.NEWS_API_KEY || process.env.NEWS_API_KEY,
            GOOGLE_SEARCH_API_KEY: config.GOOGLE_SEARCH_API_KEY || process.env.GOOGLE_SEARCH_API_KEY,
            GOOGLE_SEARCH_ENGINE_ID: config.GOOGLE_SEARCH_ENGINE_ID || process.env.GOOGLE_SEARCH_ENGINE_ID,
            ...config
        };
        
        this.intelligenceCache = new Map();
    }

    /**
     * 🧠 COMPREHENSIVE EXECUTIVE INTELLIGENCE
     */
    async gatherExecutiveIntelligence(companyName, website) {
        console.log(`\n🧠 GATHERING SMART INTELLIGENCE: ${companyName}`);
        console.log('=' .repeat(60));
        
        const intelligence = {
            companyName,
            website,
            executiveData: {
                ceo: null,
                cfo: null
            },
            intelligence: {
                pressReleases: [],
                jobPostings: [],
                newsUpdates: [],
                leadershipChanges: []
            },
            validation: {
                crossReferences: [],
                confidence: 0,
                lastVerified: new Date().toISOString()
            },
            sources: [],
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 1: Current Executive Research
            console.log('👔 STEP 1: Current Executive Research');
            const currentExecs = await this.researchCurrentExecutives(companyName, website);
            intelligence.executiveData = currentExecs;
            
            // STEP 2: Press Release Monitoring
            console.log('\n📰 STEP 2: Press Release Monitoring');
            const pressReleases = await this.monitorPressReleases(companyName);
            intelligence.intelligence.pressReleases = pressReleases;
            
            // STEP 3: Job Posting Analysis
            console.log('\n💼 STEP 3: Job Posting Analysis');
            const jobPostings = await this.analyzeJobPostings(companyName);
            intelligence.intelligence.jobPostings = jobPostings;
            
            // STEP 4: News Monitoring
            console.log('\n📊 STEP 4: News Monitoring');
            const newsUpdates = await this.monitorLeadershipNews(companyName);
            intelligence.intelligence.newsUpdates = newsUpdates;
            
            // STEP 5: Multi-Source Validation
            console.log('\n🔍 STEP 5: Multi-Source Validation');
            const validation = await this.validateWithMultipleSources(intelligence);
            intelligence.validation = validation;
            
            console.log(`✅ Smart intelligence complete: ${intelligence.validation.confidence}% confidence`);
            return intelligence;
            
        } catch (error) {
            console.error(`❌ Intelligence gathering failed: ${error.message}`);
            intelligence.validation.confidence = 0;
            intelligence.validation.error = error.message;
            return intelligence;
        }
    }

    /**
     * 👔 RESEARCH CURRENT EXECUTIVES (REAL API CALLS)
     */
    async researchCurrentExecutives(companyName, website) {
        try {
            const prompt = `Research the current CEO and CFO of ${companyName} (${website}) as of 2025.

Use only the most recent and reliable sources:
1. Latest SEC filings (if public company)
2. Recent press releases from company website
3. Recent news articles about leadership
4. Company website leadership pages
5. Recent corporate announcements

Provide ONLY a JSON response:
{
    "ceo": {
        "name": "Full Name or null",
        "title": "Exact Title",
        "appointmentDate": "YYYY-MM-DD if known",
        "source": "SEC filing/press release/company website/news",
        "confidence": 0.95,
        "lastVerified": "2025-01-17"
    },
    "cfo": {
        "name": "Full Name or null",
        "title": "Exact Title",
        "appointmentDate": "YYYY-MM-DD if known", 
        "source": "SEC filing/press release/company website/news",
        "confidence": 0.90,
        "lastVerified": "2025-01-17"
    },
    "companyInfo": {
        "officialName": "Official Company Name",
        "isPublic": true/false,
        "ticker": "SYMBOL or null",
        "lastUpdate": "2025-01-17"
    },
    "sources": ["source1", "source2", "source3"]
}

Only return executives you can verify from reliable sources. If not found, return null.`;

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
                    max_tokens: 1000
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                console.log(`   📄 Research response: ${content.substring(0, 100)}...`);
                console.log(`   📚 Citations: ${data.citations?.length || 0} sources`);
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const execData = JSON.parse(jsonMatch[0]);
                        
                        console.log(`   ✅ Found: CEO=${execData.ceo?.name || 'None'}, CFO=${execData.cfo?.name || 'None'}`);
                        console.log(`   📊 Sources: ${execData.sources?.join(', ') || 'Unknown'}`);
                        
                        return {
                            ceo: execData.ceo,
                            cfo: execData.cfo,
                            companyInfo: execData.companyInfo,
                            sources: execData.sources || [],
                            citations: data.citations || [],
                            rawResponse: content
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ JSON parsing failed: ${parseError.message}`);
                }
            } else {
                console.log(`   ❌ API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            console.log(`   ❌ Research error: ${error.message}`);
        }
        
        return { ceo: null, cfo: null, sources: [], error: 'Research failed' };
    }

    /**
     * 📰 MONITOR PRESS RELEASES FOR EXECUTIVE APPOINTMENTS
     */
    async monitorPressReleases(companyName) {
        try {
            console.log(`   📰 Monitoring press releases for ${companyName}...`);
            
            const prompt = `Find recent press releases from ${companyName} about executive appointments, promotions, or departures in 2024-2025.

Look for:
1. CEO appointments or changes
2. CFO appointments or changes  
3. Executive promotions
4. Leadership departures or retirements
5. Interim executive appointments

Provide ONLY a JSON response:
{
    "pressReleases": [
        {
            "date": "YYYY-MM-DD",
            "title": "Press release title",
            "executiveChange": {
                "type": "appointment/promotion/departure/retirement",
                "role": "CEO/CFO/other",
                "executiveName": "Full Name",
                "effectiveDate": "YYYY-MM-DD if mentioned"
            },
            "source": "company website/news site",
            "url": "URL if available",
            "confidence": 0.90
        }
    ],
    "summary": "Brief summary of recent executive changes",
    "lastUpdate": "2025-01-17"
}

If no recent executive press releases found, return empty array.`;

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
                    max_tokens: 1200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const prData = JSON.parse(jsonMatch[0]);
                        console.log(`   ✅ Found ${prData.pressReleases?.length || 0} relevant press releases`);
                        return prData.pressReleases || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Press release parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Press release monitoring error: ${error.message}`);
        }
        
        return [];
    }

    /**
     * 💼 ANALYZE JOB POSTINGS FOR EXECUTIVE DEPARTURES
     */
    async analyzeJobPostings(companyName) {
        try {
            console.log(`   💼 Analyzing job postings for ${companyName}...`);
            
            const prompt = `Search for current CEO or CFO job openings at ${companyName} or related to ${companyName}.

Look for:
1. CEO position openings
2. CFO position openings
3. Interim executive roles
4. "Chief Executive Officer" job postings
5. "Chief Financial Officer" job postings

This could indicate current executives are leaving.

Provide ONLY a JSON response:
{
    "jobPostings": [
        {
            "role": "CEO/CFO",
            "title": "Exact job title",
            "company": "Posting company name",
            "postedDate": "YYYY-MM-DD if available",
            "source": "indeed/linkedin/company website",
            "url": "Job posting URL if available",
            "isExecutiveLevel": true/false,
            "signal": "current_executive_leaving/expansion/replacement"
        }
    ],
    "signals": {
        "ceoOpening": true/false,
        "cfoOpening": true/false,
        "executiveTurnover": true/false
    },
    "lastUpdate": "2025-01-17"
}

If no executive job postings found, return empty array.`;

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
                    max_tokens: 1000
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const jobData = JSON.parse(jsonMatch[0]);
                        console.log(`   ✅ Found ${jobData.jobPostings?.length || 0} executive job postings`);
                        if (jobData.signals?.ceoOpening || jobData.signals?.cfoOpening) {
                            console.log(`   🚨 ALERT: Executive position open - possible departure`);
                        }
                        return jobData.jobPostings || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Job posting parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Job posting analysis error: ${error.message}`);
        }
        
        return [];
    }

    /**
     * 📊 MONITOR LEADERSHIP NEWS AND CHANGES
     */
    async monitorLeadershipNews(companyName) {
        try {
            console.log(`   📊 Monitoring leadership news for ${companyName}...`);
            
            const prompt = `Find recent news (2024-2025) about leadership changes at ${companyName}.

Search for:
1. Executive appointments or departures
2. CEO or CFO changes
3. Leadership transitions
4. Executive promotions
5. Board changes affecting executives

Provide ONLY a JSON response:
{
    "newsUpdates": [
        {
            "date": "YYYY-MM-DD",
            "headline": "News headline",
            "summary": "Brief summary of leadership change",
            "executiveImpact": {
                "role": "CEO/CFO/other",
                "executiveName": "Name if mentioned",
                "changeType": "appointment/departure/promotion/transition",
                "effectiveDate": "YYYY-MM-DD if mentioned"
            },
            "source": "news outlet name",
            "url": "article URL if available",
            "reliability": 0.85
        }
    ],
    "leadershipStability": {
        "recentChanges": true/false,
        "executiveTurnover": "low/medium/high",
        "lastMajorChange": "YYYY-MM-DD or null"
    },
    "lastUpdate": "2025-01-17"
}

Focus on credible news sources. If no recent leadership news, return empty array.`;

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
                    max_tokens: 1200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const newsData = JSON.parse(jsonMatch[0]);
                        console.log(`   ✅ Found ${newsData.newsUpdates?.length || 0} leadership news items`);
                        if (newsData.leadershipStability?.recentChanges) {
                            console.log(`   🚨 ALERT: Recent leadership changes detected`);
                        }
                        return newsData.newsUpdates || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ News parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ News monitoring error: ${error.message}`);
        }
        
        return [];
    }

    /**
     * 🔍 MULTI-SOURCE VALIDATION AND CROSS-REFERENCING
     */
    async validateWithMultipleSources(intelligence) {
        try {
            console.log(`   🔍 Cross-validating executive data...`);
            
            const ceoName = intelligence.executiveData.ceo?.name;
            const cfoName = intelligence.executiveData.cfo?.name;
            
            if (!ceoName && !cfoName) {
                return {
                    confidence: 0,
                    crossReferences: [],
                    validated: false,
                    notes: 'No executives found to validate'
                };
            }

            const prompt = `Validate the following executive information for ${intelligence.companyName}:

${ceoName ? `CEO: ${ceoName} - ${intelligence.executiveData.ceo.title}` : 'CEO: Not found'}
${cfoName ? `CFO: ${cfoName} - ${intelligence.executiveData.cfo.title}` : 'CFO: Not found'}

Cross-reference with:
1. Company website leadership pages
2. Recent SEC filings (if public)
3. Press releases and news articles
4. Professional network profiles (not LinkedIn)
5. Industry publications

Provide ONLY a JSON response:
{
    "validation": {
        "ceo": {
            "validated": true/false,
            "confidence": 0.95,
            "crossReferences": ["source1", "source2"],
            "lastSeen": "YYYY-MM-DD",
            "notes": "Validation details"
        },
        "cfo": {
            "validated": true/false,
            "confidence": 0.90,
            "crossReferences": ["source1", "source2"],
            "lastSeen": "YYYY-MM-DD",
            "notes": "Validation details"
        }
    },
    "overallConfidence": 0.92,
    "riskFactors": ["risk1", "risk2"],
    "recommendations": ["rec1", "rec2"],
    "lastValidated": "2025-01-17"
}

Be thorough in validation - only mark as validated if you can confirm from multiple sources.`;

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
                    max_tokens: 1200
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const validationData = JSON.parse(jsonMatch[0]);
                        
                        console.log(`   ✅ Validation complete: ${validationData.overallConfidence * 100}% confidence`);
                        if (validationData.riskFactors?.length > 0) {
                            console.log(`   ⚠️ Risk factors: ${validationData.riskFactors.length}`);
                        }
                        
                        return {
                            confidence: Math.round(validationData.overallConfidence * 100),
                            crossReferences: [
                                ...(validationData.validation?.ceo?.crossReferences || []),
                                ...(validationData.validation?.cfo?.crossReferences || [])
                            ],
                            validated: validationData.validation?.ceo?.validated || validationData.validation?.cfo?.validated,
                            riskFactors: validationData.riskFactors || [],
                            recommendations: validationData.recommendations || [],
                            rawResponse: content,
                            citations: data.citations || []
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Validation parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Validation error: ${error.message}`);
        }
        
        return { confidence: 30, crossReferences: [], validated: false };
    }

    /**
     * 🎯 CALCULATE INTELLIGENCE CONFIDENCE SCORE
     */
    calculateIntelligenceConfidence(intelligence) {
        let confidence = 0;
        let factors = 0;

        // Executive data confidence
        if (intelligence.executiveData.ceo) {
            confidence += intelligence.executiveData.ceo.confidence * 100;
            factors++;
        }
        if (intelligence.executiveData.cfo) {
            confidence += intelligence.executiveData.cfo.confidence * 100;
            factors++;
        }

        // Intelligence signals boost confidence
        if (intelligence.intelligence.pressReleases.length > 0) {
            confidence += 10; // Recent press releases boost confidence
        }
        if (intelligence.intelligence.jobPostings.length === 0) {
            confidence += 5; // No job postings = likely stable
        }
        if (intelligence.intelligence.newsUpdates.length > 0) {
            confidence += 5; // Recent news coverage
        }

        // Validation boost
        if (intelligence.validation.validated) {
            confidence += 15;
        }

        // Cross-reference boost
        const crossRefCount = intelligence.validation.crossReferences.length;
        confidence += Math.min(crossRefCount * 3, 15); // Up to 15 points for cross-references

        return factors > 0 ? Math.min(100, Math.round(confidence / factors)) : 30;
    }

    /**
     * 🔧 UTILITY: DELAY FOR RATE LIMITING
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = { IntelligenceGathering };
