#!/usr/bin/env node

/**
 * 🔄 EXECUTIVE TRANSITION DETECTOR MODULE
 * 
 * Advanced system for detecting executive transitions:
 * 1. Retirement announcements and transition periods
 * 2. Succession planning and interim leadership
 * 3. Recent departures and new appointments
 * 4. Executive search and recruitment activity
 * 5. Transition timeline tracking
 */

const fetch = require('node-fetch');

class ExecutiveTransitionDetector {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            TRANSITION_WINDOW_MONTHS: config.TRANSITION_WINDOW_MONTHS || 12, // Look back 12 months
            ...config
        };

        this.transitionKeywords = {
            retirement: [
                'retiring', 'retirement', 'stepping down', 'stepping aside',
                'transition period', 'succession planning', 'end of tenure',
                'concluding service', 'final year', 'departure'
            ],
            interim: [
                'interim', 'acting', 'temporary', 'transitional',
                'placeholder', 'caretaker', 'provisional'
            ],
            search: [
                'executive search', 'recruiting', 'hiring', 'seeking',
                'search firm', 'headhunter', 'talent acquisition',
                'replacement', 'successor'
            ],
            recent: [
                'recently appointed', 'newly hired', 'just joined',
                'started in', 'began role', 'assumed position',
                'took over', 'promoted to'
            ]
        };
    }

    /**
     * 🔍 DETECT EXECUTIVE TRANSITIONS
     */
    async detectTransitions(companyName, executives) {
        console.log(`\n🔄 DETECTING EXECUTIVE TRANSITIONS: ${companyName}`);
        console.log('=' .repeat(60));

        const results = {
            companyName,
            transitionsDetected: [],
            retirementAnnouncements: [],
            interimLeadership: [],
            recentAppointments: [],
            successionPlanning: [],
            overallRisk: 'low',
            recommendations: []
        };

        try {
            // Check each executive for transition indicators
            for (const [role, executive] of Object.entries(executives)) {
                if (executive && executive.name) {
                    console.log(`   🔍 Analyzing ${role.toUpperCase()}: ${executive.name}`);
                    
                    const transitionData = await this.analyzeExecutiveTransition(
                        companyName,
                        executive,
                        role
                    );
                    
                    if (transitionData.hasTransitionIndicators) {
                        results.transitionsDetected.push(transitionData);
                        
                        // Categorize by transition type
                        if (transitionData.isRetiring) {
                            results.retirementAnnouncements.push(transitionData);
                        }
                        if (transitionData.isInterim) {
                            results.interimLeadership.push(transitionData);
                        }
                        if (transitionData.isRecent) {
                            results.recentAppointments.push(transitionData);
                        }
                        if (transitionData.hasSuccessionPlan) {
                            results.successionPlanning.push(transitionData);
                        }
                    }
                }
            }

            // Analyze company-wide succession planning
            const companySuccessionData = await this.analyzeCompanySuccessionPlanning(companyName);
            if (companySuccessionData.hasActiveSuccessionPlanning) {
                results.successionPlanning.push(companySuccessionData);
            }

            // Calculate overall transition risk
            results.overallRisk = this.calculateTransitionRisk(results);
            
            // Generate recommendations
            results.recommendations = this.generateTransitionRecommendations(results);

            console.log(`\n📊 TRANSITION ANALYSIS RESULTS:`);
            console.log(`   Transitions Detected: ${results.transitionsDetected.length}`);
            console.log(`   Retirement Announcements: ${results.retirementAnnouncements.length}`);
            console.log(`   Interim Leadership: ${results.interimLeadership.length}`);
            console.log(`   Recent Appointments: ${results.recentAppointments.length}`);
            console.log(`   Overall Risk: ${results.overallRisk.toUpperCase()}`);

            return results;

        } catch (error) {
            console.error(`❌ Transition detection error: ${error.message}`);
            results.error = error.message;
            return results;
        }
    }

    /**
     * 👤 ANALYZE INDIVIDUAL EXECUTIVE TRANSITION
     */
    async analyzeExecutiveTransition(companyName, executive, role) {
        const result = {
            name: executive.name,
            title: executive.title,
            role: role,
            hasTransitionIndicators: false,
            isRetiring: false,
            isInterim: false,
            isRecent: false,
            hasSuccessionPlan: false,
            transitionTimeline: null,
            confidence: 0,
            indicators: [],
            sources: []
        };

        try {
            // Search for transition-related news and announcements
            const searchQuery = `${executive.name} ${companyName} ${role} retirement succession transition announcement 2024 2025`;
            
            const transitionNews = await this.searchTransitionNews(searchQuery);
            
            if (transitionNews && transitionNews.length > 0) {
                // Analyze each news item for transition indicators
                for (const news of transitionNews) {
                    const indicators = this.extractTransitionIndicators(news.content);
                    
                    if (indicators.length > 0) {
                        result.hasTransitionIndicators = true;
                        result.indicators.push(...indicators);
                        result.sources.push({
                            title: news.title,
                            url: news.url,
                            date: news.date,
                            indicators: indicators
                        });
                        
                        // Check for specific transition types
                        if (this.containsKeywords(news.content, this.transitionKeywords.retirement)) {
                            result.isRetiring = true;
                        }
                        if (this.containsKeywords(news.content, this.transitionKeywords.interim)) {
                            result.isInterim = true;
                        }
                        if (this.containsKeywords(news.content, this.transitionKeywords.recent)) {
                            result.isRecent = true;
                        }
                        if (this.containsKeywords(news.content, this.transitionKeywords.search)) {
                            result.hasSuccessionPlan = true;
                        }
                    }
                }
                
                // Calculate confidence based on number and quality of indicators
                result.confidence = Math.min(result.indicators.length * 20, 100);
                
                // Extract transition timeline if available
                result.transitionTimeline = this.extractTransitionTimeline(transitionNews);
            }

            return result;

        } catch (error) {
            console.error(`   ❌ Error analyzing ${executive.name}: ${error.message}`);
            result.error = error.message;
            return result;
        }
    }

    /**
     * 🔍 SEARCH TRANSITION NEWS
     */
    async searchTransitionNews(query) {
        if (!this.config.PERPLEXITY_API_KEY) {
            console.log(`   ⚠️ Perplexity API key not available - skipping news search`);
            return [];
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{
                        role: 'user',
                        content: `Search for recent news and announcements about executive transitions, retirements, or succession planning related to: ${query}. 
                        
                        Focus on:
                        1. Retirement announcements
                        2. Succession planning news
                        3. Interim leadership appointments
                        4. Executive search activities
                        5. Recent leadership changes
                        
                        Provide specific details about dates, transition timelines, and succession plans if mentioned.`
                    }],
                    max_tokens: 1000,
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                throw new Error(`Perplexity API error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';
            
            // Parse the response to extract news items
            return this.parseNewsResponse(content);

        } catch (error) {
            console.error(`   ❌ News search error: ${error.message}`);
            return [];
        }
    }

    /**
     * 📰 PARSE NEWS RESPONSE
     */
    parseNewsResponse(content) {
        const newsItems = [];
        
        // Simple parsing - in production, this would be more sophisticated
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
        
        sentences.forEach(sentence => {
            if (this.containsTransitionKeywords(sentence)) {
                newsItems.push({
                    title: sentence.substring(0, 100) + '...',
                    content: sentence,
                    date: this.extractDateFromText(sentence),
                    url: null // Would be extracted from actual news sources
                });
            }
        });
        
        return newsItems;
    }

    /**
     * 🔍 EXTRACT TRANSITION INDICATORS
     */
    extractTransitionIndicators(text) {
        const indicators = [];
        const textLower = text.toLowerCase();
        
        // Check for each category of transition keywords
        Object.entries(this.transitionKeywords).forEach(([category, keywords]) => {
            keywords.forEach(keyword => {
                if (textLower.includes(keyword)) {
                    indicators.push({
                        type: category,
                        keyword: keyword,
                        context: this.extractContext(text, keyword)
                    });
                }
            });
        });
        
        return indicators;
    }

    /**
     * 🏢 ANALYZE COMPANY SUCCESSION PLANNING
     */
    async analyzeCompanySuccessionPlanning(companyName) {
        const result = {
            companyName,
            hasActiveSuccessionPlanning: false,
            executiveSearchFirms: [],
            boardChanges: [],
            leadershipDevelopment: [],
            confidence: 0
        };

        try {
            const query = `${companyName} executive succession planning leadership development board changes 2024 2025`;
            const successionNews = await this.searchTransitionNews(query);
            
            if (successionNews && successionNews.length > 0) {
                // Analyze for company-wide succession indicators
                successionNews.forEach(news => {
                    if (this.containsKeywords(news.content, ['succession planning', 'leadership development', 'board of directors'])) {
                        result.hasActiveSuccessionPlanning = true;
                        result.confidence += 25;
                    }
                });
            }

            return result;

        } catch (error) {
            console.error(`   ❌ Company succession analysis error: ${error.message}`);
            return result;
        }
    }

    /**
     * ⚠️ CALCULATE TRANSITION RISK
     */
    calculateTransitionRisk(results) {
        let riskScore = 0;
        
        // High risk factors
        riskScore += results.retirementAnnouncements.length * 30;
        riskScore += results.interimLeadership.length * 25;
        
        // Medium risk factors
        riskScore += results.successionPlanning.length * 15;
        
        // Low risk factors (actually positive)
        riskScore -= results.recentAppointments.length * 10;
        
        if (riskScore >= 50) return 'high';
        if (riskScore >= 25) return 'medium';
        return 'low';
    }

    /**
     * 💡 GENERATE TRANSITION RECOMMENDATIONS
     */
    generateTransitionRecommendations(results) {
        const recommendations = [];
        
        if (results.retirementAnnouncements.length > 0) {
            recommendations.push({
                type: 'retirement_tracking',
                priority: 'high',
                message: `${results.retirementAnnouncements.length} executive(s) have announced retirement`,
                action: 'Monitor succession timeline and identify interim contacts'
            });
        }
        
        if (results.interimLeadership.length > 0) {
            recommendations.push({
                type: 'interim_contact',
                priority: 'high',
                message: `${results.interimLeadership.length} interim executive(s) detected`,
                action: 'Establish relationships with interim leaders and track permanent appointments'
            });
        }
        
        if (results.successionPlanning.length > 0) {
            recommendations.push({
                type: 'succession_monitoring',
                priority: 'medium',
                message: 'Active succession planning detected',
                action: 'Monitor for new executive appointments and leadership changes'
            });
        }
        
        return recommendations;
    }

    // Helper methods
    containsKeywords(text, keywords) {
        const textLower = text.toLowerCase();
        return keywords.some(keyword => textLower.includes(keyword));
    }

    containsTransitionKeywords(text) {
        return Object.values(this.transitionKeywords).some(keywords => 
            this.containsKeywords(text, keywords)
        );
    }

    extractContext(text, keyword, contextLength = 50) {
        const index = text.toLowerCase().indexOf(keyword.toLowerCase());
        if (index === -1) return '';
        
        const start = Math.max(0, index - contextLength);
        const end = Math.min(text.length, index + keyword.length + contextLength);
        
        return text.substring(start, end);
    }

    extractDateFromText(text) {
        // Simple date extraction - would be more sophisticated in production
        const dateRegex = /\b(20\d{2})\b|\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2}\b/i;
        const match = text.match(dateRegex);
        return match ? match[0] : null;
    }

    extractTransitionTimeline(newsItems) {
        // Extract and parse transition timeline from news content
        for (const news of newsItems) {
            const timeline = this.extractDateFromText(news.content);
            if (timeline) {
                return {
                    announcementDate: news.date,
                    transitionDate: timeline,
                    source: news.title
                };
            }
        }
        return null;
    }
}

module.exports = { ExecutiveTransitionDetector };
