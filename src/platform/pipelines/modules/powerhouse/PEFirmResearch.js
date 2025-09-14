#!/usr/bin/env node

/**
 * 🏦 PE FIRM RESEARCH MODULE
 * 
 * Researches PE firm executives and leadership:
 * 1. Managing Partners and Senior Partners
 * 2. CEOs and Operating Partners
 * 3. CFOs and Finance Leaders
 * 4. Investment Committee Members
 * 5. Sector Specialists and Deal Teams
 * 
 * All data from real sources
 */

const fetch = require('node-fetch');

class PEFirmResearch {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.peFirmCache = new Map();
        this.majorPEFirms = this.initializeMajorPEFirms();
    }

    /**
     * 🏦 COMPREHENSIVE PE FIRM RESEARCH
     * 
     * Researches PE firm leadership and key contacts
     */
    async researchPEFirmExecutives(peFirmName) {
        console.log(`🏦 Researching PE firm executives: ${peFirmName}`);

        const cacheKey = `pe_firm_${peFirmName.toLowerCase().replace(/\s+/g, '_')}`;
        if (this.peFirmCache.has(cacheKey)) {
            return this.peFirmCache.get(cacheKey);
        }

        const research = {
            firmName: peFirmName,
            firmType: this.classifyPEFirm(peFirmName),
            
            // LEADERSHIP STRUCTURE
            managingPartners: [],
            seniorPartners: [],
            ceo: null,
            cfo: null,
            operatingPartners: [],
            
            // INVESTMENT TEAM
            investmentCommittee: [],
            sectorSpecialists: [],
            dealTeam: [],
            
            // FIRM INTELLIGENCE
            headquarters: null,
            aum: null,
            founded: null,
            portfolioSize: null,
            investmentFocus: [],
            
            // CONTACT STRATEGY
            primaryContacts: [],
            decisionMakers: [],
            keyStakeholders: [],
            
            researchDate: new Date().toISOString(),
            confidence: 0
        };

        try {
            // Step 1: Research firm structure and leadership
            const firmStructure = await this.researchFirmStructure(peFirmName);
            Object.assign(research, firmStructure);

            // Step 2: Research key executives
            const executives = await this.researchKeyExecutives(peFirmName);
            research.managingPartners = executives.managingPartners;
            research.seniorPartners = executives.seniorPartners;
            research.ceo = executives.ceo;
            research.cfo = executives.cfo;
            research.operatingPartners = executives.operatingPartners;

            // Step 3: Research investment team
            const investmentTeam = await this.researchInvestmentTeam(peFirmName);
            research.investmentCommittee = investmentTeam.committee;
            research.sectorSpecialists = investmentTeam.specialists;
            research.dealTeam = investmentTeam.dealTeam;

            // Step 4: Identify primary contacts
            research.primaryContacts = this.identifyPrimaryContacts(research);
            research.decisionMakers = this.identifyDecisionMakers(research);
            research.keyStakeholders = this.identifyKeyStakeholders(research);

            // Step 5: Calculate confidence
            research.confidence = this.calculateResearchConfidence(research);

            this.peFirmCache.set(cacheKey, research);
            return research;

        } catch (error) {
            console.error(`❌ PE firm research error for ${peFirmName}:`, error.message);
            return this.generateFallbackPEResearch(peFirmName);
        }
    }

    /**
     * 🏢 RESEARCH FIRM STRUCTURE
     */
    async researchFirmStructure(peFirmName) {
        const query = `What is the corporate structure, headquarters location, AUM (assets under management), founding date, and investment focus of ${peFirmName}? Include key firm statistics.`;
        
        const response = await this.makePerplexityRequest(query);
        if (!response.success) {
            return this.getFallbackFirmStructure(peFirmName);
        }

        return this.parseFirmStructure(response.content, peFirmName);
    }

    /**
     * 👔 RESEARCH KEY EXECUTIVES
     */
    async researchKeyExecutives(peFirmName) {
        const query = `Who are the current Managing Partners, Senior Partners, CEO, CFO, and Operating Partners at ${peFirmName}? Include their names, titles, and backgrounds. Focus on current leadership as of 2024-2025.`;
        
        const response = await this.makePerplexityRequest(query);
        if (!response.success) {
            return this.getFallbackExecutives();
        }

        return this.parseExecutives(response.content);
    }

    /**
     * 💼 RESEARCH INVESTMENT TEAM
     */
    async researchInvestmentTeam(peFirmName) {
        const query = `Who are the Investment Committee members, sector specialists, and key deal team members at ${peFirmName}? Include their areas of expertise and investment focus.`;
        
        const response = await this.makePerplexityRequest(query);
        if (!response.success) {
            return this.getFallbackInvestmentTeam();
        }

        return this.parseInvestmentTeam(response.content);
    }

    /**
     * 🤖 PERPLEXITY API REQUEST
     */
    async makePerplexityRequest(query) {
        if (!this.config.PERPLEXITY_API_KEY) {
            return { success: false, error: 'No Perplexity API key' };
        }

        try {
            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: query }],
                    temperature: 0.1
                })
            });

            if (!response.ok) {
                return { success: false, error: `API error: ${response.status}` };
            }

            const data = await response.json();
            return {
                success: true,
                content: data.choices[0].message.content
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * 🔍 PARSING METHODS
     */
    parseFirmStructure(content, firmName) {
        const lines = content.split('\n');
        const structure = {
            headquarters: 'Unknown',
            aum: 'Unknown',
            founded: 'Unknown',
            portfolioSize: 'Unknown',
            investmentFocus: []
        };

        for (const line of lines) {
            const lower = line.toLowerCase();
            
            if (lower.includes('headquarters') || lower.includes('based in')) {
                structure.headquarters = this.extractLocationFromLine(line);
            } else if (lower.includes('aum') || lower.includes('assets under management')) {
                structure.aum = this.extractAUMFromLine(line);
            } else if (lower.includes('founded') || lower.includes('established')) {
                structure.founded = this.extractYearFromLine(line);
            } else if (lower.includes('portfolio') && lower.includes('companies')) {
                structure.portfolioSize = this.extractNumberFromLine(line);
            } else if (lower.includes('focus') || lower.includes('invests in')) {
                const focus = this.extractInvestmentFocus(line);
                if (focus.length > 0) {
                    structure.investmentFocus = structure.investmentFocus.concat(focus);
                }
            }
        }

        return structure;
    }

    parseExecutives(content) {
        const executives = {
            managingPartners: [],
            seniorPartners: [],
            ceo: null,
            cfo: null,
            operatingPartners: []
        };

        const lines = content.split('\n');
        let currentSection = '';

        for (const line of lines) {
            const lower = line.toLowerCase();
            
            if (lower.includes('managing partner')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    executives.managingPartners.push({
                        name,
                        title: 'Managing Partner',
                        role: 'Senior Leadership'
                    });
                }
            } else if (lower.includes('senior partner')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    executives.seniorPartners.push({
                        name,
                        title: 'Senior Partner',
                        role: 'Senior Leadership'
                    });
                }
            } else if (lower.includes('ceo') || lower.includes('chief executive')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    executives.ceo = {
                        name,
                        title: 'Chief Executive Officer',
                        role: 'Executive Leadership'
                    };
                }
            } else if (lower.includes('cfo') || lower.includes('chief financial')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    executives.cfo = {
                        name,
                        title: 'Chief Financial Officer',
                        role: 'Financial Leadership'
                    };
                }
            } else if (lower.includes('operating partner')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    executives.operatingPartners.push({
                        name,
                        title: 'Operating Partner',
                        role: 'Operational Leadership'
                    });
                }
            }
        }

        return executives;
    }

    parseInvestmentTeam(content) {
        const team = {
            committee: [],
            specialists: [],
            dealTeam: []
        };

        const lines = content.split('\n');

        for (const line of lines) {
            const lower = line.toLowerCase();
            
            if (lower.includes('investment committee') || lower.includes('ic member')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    team.committee.push({
                        name,
                        title: 'Investment Committee Member',
                        role: 'Investment Decision'
                    });
                }
            } else if (lower.includes('sector') && (lower.includes('specialist') || lower.includes('expert'))) {
                const name = this.extractNameFromLine(line);
                const sector = this.extractSectorFromLine(line);
                if (name) {
                    team.specialists.push({
                        name,
                        title: 'Sector Specialist',
                        sector: sector || 'Unknown',
                        role: 'Sector Expertise'
                    });
                }
            } else if (lower.includes('principal') || lower.includes('vice president') || lower.includes('director')) {
                const name = this.extractNameFromLine(line);
                if (name) {
                    team.dealTeam.push({
                        name,
                        title: this.extractTitleFromLine(line),
                        role: 'Deal Execution'
                    });
                }
            }
        }

        return team;
    }

    /**
     * 🎯 CONTACT IDENTIFICATION
     */
    identifyPrimaryContacts(research) {
        const contacts = [];

        // Managing Partners are primary contacts
        research.managingPartners.forEach(mp => {
            contacts.push({
                ...mp,
                priority: 'Highest',
                contactReason: 'Senior decision maker with portfolio oversight'
            });
        });

        // CEO if different from Managing Partners
        if (research.ceo && !research.managingPartners.find(mp => mp.name === research.ceo.name)) {
            contacts.push({
                ...research.ceo,
                priority: 'Highest',
                contactReason: 'Executive leadership and firm strategy'
            });
        }

        // Senior Partners
        research.seniorPartners.slice(0, 3).forEach(sp => { // Top 3 only
            contacts.push({
                ...sp,
                priority: 'High',
                contactReason: 'Senior partnership with investment authority'
            });
        });

        return contacts.slice(0, 5); // Top 5 contacts
    }

    identifyDecisionMakers(research) {
        const decisionMakers = [];

        // Investment Committee members
        research.investmentCommittee.forEach(ic => {
            decisionMakers.push({
                ...ic,
                decisionType: 'Investment Approval',
                authority: 'High'
            });
        });

        // Managing Partners
        research.managingPartners.forEach(mp => {
            decisionMakers.push({
                ...mp,
                decisionType: 'Strategic Decisions',
                authority: 'Ultimate'
            });
        });

        return decisionMakers;
    }

    identifyKeyStakeholders(research) {
        const stakeholders = [];

        // All primary contacts
        stakeholders.push(...research.primaryContacts);

        // Operating Partners (value creation)
        research.operatingPartners.slice(0, 2).forEach(op => {
            stakeholders.push({
                ...op,
                stakeholderType: 'Value Creation',
                relevance: 'High for portfolio company improvements'
            });
        });

        // Sector Specialists
        research.sectorSpecialists.slice(0, 3).forEach(ss => {
            stakeholders.push({
                ...ss,
                stakeholderType: 'Sector Expert',
                relevance: 'High for sector-specific opportunities'
            });
        });

        return stakeholders;
    }

    /**
     * 🛠️ UTILITY METHODS
     */
    initializeMajorPEFirms() {
        return [
            'KKR', 'Blackstone', 'Apollo', 'Carlyle', 'TPG', 'Warburg Pincus',
            'Permira', 'Investcorp', 'Bain Capital', 'CVC Capital Partners',
            'EQT Partners', 'Advent International', 'General Atlantic'
        ];
    }

    classifyPEFirm(firmName) {
        const name = firmName.toLowerCase();
        
        if (name.includes('kkr') || name.includes('blackstone')) {
            return 'Mega-Fund PE';
        } else if (name.includes('apollo') || name.includes('carlyle')) {
            return 'Large-Cap PE';
        } else if (name.includes('permira') || name.includes('investcorp')) {
            return 'Mid-Market PE';
        } else {
            return 'Private Equity Firm';
        }
    }

    calculateResearchConfidence(research) {
        let confidence = 0;
        
        // Leadership data
        if (research.managingPartners.length > 0) confidence += 25;
        if (research.ceo) confidence += 15;
        if (research.cfo) confidence += 10;
        if (research.seniorPartners.length > 0) confidence += 15;
        
        // Firm data
        if (research.headquarters !== 'Unknown') confidence += 10;
        if (research.aum !== 'Unknown') confidence += 10;
        if (research.investmentFocus.length > 0) confidence += 10;
        
        // Team data
        if (research.investmentCommittee.length > 0) confidence += 5;
        
        return Math.min(100, confidence);
    }

    // Text extraction utility methods
    extractNameFromLine(line) {
        // Simple name extraction - would be enhanced with NLP
        const patterns = [
            /([A-Z][a-z]+ [A-Z][a-z]+)/g,
            /([A-Z]\. [A-Z][a-z]+)/g
        ];
        
        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) return match[0];
        }
        
        return null;
    }

    extractLocationFromLine(line) {
        // Extract location information
        const locationPatterns = [
            /in ([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/,
            /based in ([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/,
            /headquarters in ([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*)/
        ];
        
        for (const pattern of locationPatterns) {
            const match = line.match(pattern);
            if (match) return match[1];
        }
        
        return 'Unknown';
    }

    extractAUMFromLine(line) {
        const aumPattern = /\$(\d+(?:\.\d+)?)\s*(billion|trillion|B|T)/i;
        const match = line.match(aumPattern);
        return match ? `$${match[1]}${match[2].charAt(0).toUpperCase()}` : 'Unknown';
    }

    extractYearFromLine(line) {
        const yearPattern = /(19|20)\d{2}/;
        const match = line.match(yearPattern);
        return match ? match[0] : 'Unknown';
    }

    extractNumberFromLine(line) {
        const numberPattern = /(\d+)\+?/;
        const match = line.match(numberPattern);
        return match ? `${match[1]}+` : 'Unknown';
    }

    extractInvestmentFocus(line) {
        const focusKeywords = [
            'technology', 'healthcare', 'financial services', 'consumer',
            'industrial', 'energy', 'real estate', 'infrastructure'
        ];
        
        const found = [];
        const lower = line.toLowerCase();
        
        focusKeywords.forEach(keyword => {
            if (lower.includes(keyword)) {
                found.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
        });
        
        return found;
    }

    extractTitleFromLine(line) {
        const titlePatterns = [
            /Managing Director/i,
            /Principal/i,
            /Vice President/i,
            /Director/i,
            /Partner/i
        ];
        
        for (const pattern of titlePatterns) {
            const match = line.match(pattern);
            if (match) return match[0];
        }
        
        return 'Team Member';
    }

    extractSectorFromLine(line) {
        const sectors = [
            'Technology', 'Healthcare', 'Financial Services', 'Consumer',
            'Industrial', 'Energy', 'Real Estate', 'Infrastructure'
        ];
        
        for (const sector of sectors) {
            if (line.toLowerCase().includes(sector.toLowerCase())) {
                return sector;
            }
        }
        
        return 'Unknown';
    }

    /**
     * 🔄 FALLBACK METHODS
     */
    getFallbackFirmStructure(firmName) {
        return {
            headquarters: 'Research Required',
            aum: 'Research Required',
            founded: 'Research Required',
            portfolioSize: 'Research Required',
            investmentFocus: ['Research Required']
        };
    }

    getFallbackExecutives() {
        return {
            managingPartners: [],
            seniorPartners: [],
            ceo: null,
            cfo: null,
            operatingPartners: []
        };
    }

    getFallbackInvestmentTeam() {
        return {
            committee: [],
            specialists: [],
            dealTeam: []
        };
    }

    generateFallbackPEResearch(firmName) {
        return {
            firmName,
            firmType: 'Private Equity Firm',
            managingPartners: [],
            seniorPartners: [],
            ceo: null,
            cfo: null,
            operatingPartners: [],
            investmentCommittee: [],
            sectorSpecialists: [],
            dealTeam: [],
            headquarters: 'Research Required',
            aum: 'Research Required',
            founded: 'Research Required',
            portfolioSize: 'Research Required',
            investmentFocus: ['Research Required'],
            primaryContacts: [],
            decisionMakers: [],
            keyStakeholders: [],
            researchDate: new Date().toISOString(),
            confidence: 0
        };
    }
}

module.exports = { PEFirmResearch };
