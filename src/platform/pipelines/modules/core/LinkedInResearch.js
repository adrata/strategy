#!/usr/bin/env node

/**
 * 🔗 EXECUTIVE RESEARCH MODULE (NO LINKEDIN SCRAPING)
 * 
 * Uses AI research as a final fallback for executive discovery when other methods fail.
 * This is particularly useful for startups and smaller companies that may not be
 * well-represented in CoreSignal or other data sources.
 * 
 * NOTE: This module does NOT scrape LinkedIn. It uses AI to research publicly available information.
 */

const fetch = require('node-fetch');

class LinkedInResearch {
    constructor(config = {}) {
        this.config = {
            ANTHROPIC_API_KEY: config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY,
            ...config
        };
        
        this.searchPatterns = {
            cfo: [
                'CFO', 'Chief Financial Officer', 'Finance Director', 'VP Finance',
                'Head of Finance', 'Financial Controller', 'Treasurer'
            ],
            cro: [
                'CRO', 'Chief Revenue Officer', 'Sales Director', 'VP Sales',
                'Head of Sales', 'Revenue Director', 'VP Revenue', 'Head of Revenue'
            ]
        };
    }

    /**
     * 🔍 RESEARCH EXECUTIVES VIA AI
     * 
     * Uses AI to research publicly available information about CFO/CRO executives
     */
    async researchExecutivesViaLinkedIn(companyName, domain, roleType = 'both') {
        console.log(`🔗 AI Executive Research: Searching for executives at ${companyName}...`);
        
        const results = {
            cfo: null,
            cro: null,
            method: 'ai_research',
            confidence: 0,
            sources: []
        };

        try {
            // Research CFO if requested
            if (roleType === 'both' || roleType === 'cfo') {
                results.cfo = await this.researchRoleViaAI(companyName, domain, 'cfo');
            }

            // Research CRO if requested
            if (roleType === 'both' || roleType === 'cro') {
                results.cro = await this.researchRoleViaAI(companyName, domain, 'cro');
            }

            // Calculate overall confidence
            const foundRoles = [results.cfo, results.cro].filter(role => role !== null);
            results.confidence = foundRoles.length > 0 ? 
                Math.round(foundRoles.reduce((sum, role) => sum + role.confidence, 0) / foundRoles.length) : 0;

            console.log(`   ✅ AI Executive Research complete: CFO ${results.cfo ? '✅' : '❌'}, CRO ${results.cro ? '✅' : '❌'}`);
            
            return results;

        } catch (error) {
            console.log(`   ❌ AI Executive Research failed: ${error.message}`);
            return results;
        }
    }

    /**
     * 🎯 RESEARCH SPECIFIC ROLE VIA AI
     */
    async researchRoleViaAI(companyName, domain, roleType) {
        console.log(`   🔍 Researching ${roleType.toUpperCase()} via AI...`);

        try {
            // Use Claude AI for executive research (no LinkedIn scraping)
            const prompt = this.buildAIResearchPrompt(companyName, domain, roleType);
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': this.config.ANTHROPIC_API_KEY,
                    'Content-Type': 'application/json',
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 500,
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                throw new Error(`Claude AI error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const content = data.content[0]?.text;

            if (!content) {
                console.log(`   ⚠️ No content returned for ${roleType.toUpperCase()}`);
                return null;
            }

            // Parse the response to extract executive information
            const executive = this.parseAIResponse(content, roleType, companyName);
            
            if (executive) {
                console.log(`   ✅ Found ${roleType.toUpperCase()}: ${executive.name} (${executive.title})`);
                return executive;
            } else {
                console.log(`   ❌ No ${roleType.toUpperCase()} found in response`);
                return null;
            }

        } catch (error) {
            console.log(`   ❌ ${roleType.toUpperCase()} research failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 📝 BUILD AI RESEARCH PROMPT
     */
    buildAIResearchPrompt(companyName, domain, roleType) {
        const roleTitle = roleType === 'cfo' ? 'Chief Financial Officer (CFO)' : 'Chief Revenue Officer (CRO)';
        
        return `Find the current ${roleTitle} of ${companyName} (${domain}) using publicly available information.

        Search for:
        - Current ${roleTitle} at ${companyName}
        - Full name and exact title
        - Company website: ${domain}

        Return in this exact format:
        Name: [Full Name]
        Title: [Current Title]
        Confidence: [1-100]

        If not found, return: "Not Found"

        Note: Use only publicly available business information from company websites, press releases, and business directories.`;
    }

    /**
     * 📊 PARSE AI RESPONSE
     */
    parseAIResponse(content, roleType, companyName) {
        if (!content || content.includes('Not Found')) {
            return null;
        }

        // Parse the response
        const lines = content.split('\n');
        const result = {};

        for (const line of lines) {
            if (line.startsWith('Name:')) {
                result.name = line.replace('Name:', '').trim();
            } else if (line.startsWith('Title:')) {
                result.title = line.replace('Title:', '').trim();
            } else if (line.startsWith('Confidence:')) {
                result.confidence = parseInt(line.replace('Confidence:', '').trim()) || 50;
            }
        }

        // Validate required fields
        if (!result.name || !result.title) {
            return null;
        }

        // Add metadata
        result.source = 'ai_research';
        result.method = 'claude_ai';
        result.companyName = companyName;
        result.roleType = roleType;

        return result;
    }

    /**
     * 🔧 GET CONFIGURATION STATUS
     */
    getConfigurationStatus() {
        return {
            anthropicConfigured: !!this.config.ANTHROPIC_API_KEY,
            method: 'ai_research',
            scrapingEnabled: false,
            linkedinScraping: false
        };
    }
}

module.exports = { LinkedInResearch };