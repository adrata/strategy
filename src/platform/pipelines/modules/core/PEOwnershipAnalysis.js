/**
 * 🏦 PE OWNERSHIP ANALYSIS MODULE
 * 
 * Identifies PE ownership and provides strategic analysis for sales approach.
 * Integrated into main executive pipeline - does NOT find PE firm executives.
 * Uses research to identify PE ownership patterns.
 */

const fetch = require('node-fetch');

class PEOwnershipAnalysis {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            WORKING_MODEL: 'sonar-pro',
            MAX_RETRIES: 2,
            RATE_LIMIT_DELAY: 2000,
            ...config
        };
        // Keep a small reference database for known patterns, but rely on research for details
        this.knownPEPatterns = this.initializePEPatterns();
    }

    initializePEPatterns() {
        return {
            // Known PE firm name patterns for quick identification
            peNames: ['KKR', 'Permira', 'Investcorp', 'Blackstone', 'Apollo', 'Carlyle', 'TPG', 'Warburg Pincus', 
                     'Bain Capital', 'Vista Equity', 'Silver Lake', 'Thoma Bravo', 'General Atlantic'],
            pePatterns: [
                'Capital Partners', 'Equity Partners', 'Investment Partners', 'Private Equity',
                'Capital Management', 'Investment Management', 'Partners LP', 'Capital LP',
                'Holdings Limited', 'Investment Group', 'Capital Group'
            ]
        };
    }

    /**
     * Analyze PE ownership for a company using intelligent research
     */
    async analyzePEOwnership(corporateStructure) {
        const parentCompany = corporateStructure?.parentCompany || '';
        const isPublic = corporateStructure?.isPublic || false;
        
        if (!parentCompany || parentCompany === '') {
            return this.createNonPEResult();
        }

        // Quick pattern check for known PE firms
        const knownPE = this.identifyKnownPEFirm(parentCompany);
        if (knownPE) {
            console.log(`   🏦 Identified known PE firm: ${knownPE}`);
            return await this.researchPEFirm(knownPE, parentCompany, corporateStructure);
        }

        // Check for PE patterns in parent company name
        const hasPattern = this.knownPEPatterns.pePatterns.some(pattern => 
            parentCompany.includes(pattern)
        );

        if (hasPattern && !isPublic) {
            console.log(`   🔍 PE pattern detected in: ${parentCompany}`);
            return await this.researchPotentialPEFirm(parentCompany, corporateStructure);
        }

        // For other parent companies, do a quick PE ownership check
        if (parentCompany !== 'None') {
            console.log(`   🔍 Checking PE ownership for parent: ${parentCompany}`);
            return await this.researchParentCompanyPEOwnership(parentCompany, corporateStructure);
        }

        return this.createNonPEResult();
    }

    /**
     * Identify known PE firms from parent company name
     */
    identifyKnownPEFirm(parentCompany) {
        return this.knownPEPatterns.peNames.find(peName => 
            parentCompany.includes(peName)
        );
    }

    /**
     * Research details about a known PE firm
     */
    async researchPEFirm(peFirm, parentCompany, corporateStructure) {
        const prompt = `Research the private equity firm "${peFirm}" (parent company: "${parentCompany}").

Provide current information about:
1. Full official name
2. Assets under management (AUM)
3. Investment focus areas
4. Typical holding period for portfolio companies
5. Exit strategy preferences
6. Investment thesis and approach
7. Strategic implications for portfolio companies

Please provide ONLY a JSON response:
{
    "peOwner": "${peFirm}",
    "peOwnerFullName": "Full official name",
    "peOwnerType": "Type of PE firm",
    "peOwnerAUM": "Current AUM",
    "peFocus": "Investment focus areas",
    "peHoldingPeriod": "X-Y years",
    "peExitStrategy": "Preferred exit strategies",
    "peInvestmentThesis": "Investment approach",
    "peSalesImplications": "Strategic implications for sales approach"
}`;

        const research = await this.callPerplexityAPI(prompt, 'pe_firm_research');
        
        if (research.peOwner) {
            return {
                isPEOwned: true,
                ...research,
                peStrategicNotes: this.generateIntelligentPEStrategicNotes(research, corporateStructure)
            };
        }

        return this.createNonPEResult();
    }

    /**
     * Research potential PE firm based on patterns
     */
    async researchPotentialPEFirm(parentCompany, corporateStructure) {
        const prompt = `Analyze if "${parentCompany}" is a private equity firm or investment management company.

Research:
1. Is this actually a private equity firm?
2. If yes, provide basic details (AUM, focus, typical holding period)
3. If no, explain what type of company it is

Please provide ONLY a JSON response:
{
    "isPEFirm": true/false,
    "peOwner": "Company name if PE firm",
    "peOwnerFullName": "Full name if PE firm",
    "peOwnerType": "Type if PE firm",
    "peOwnerAUM": "AUM if known",
    "peFocus": "Focus areas if PE firm",
    "peHoldingPeriod": "Typical holding period if PE firm",
    "explanation": "Brief explanation of findings"
}`;

        const research = await this.callPerplexityAPI(prompt, 'pe_pattern_research');
        
        if (research.isPEFirm) {
            return {
                isPEOwned: true,
                peOwner: research.peOwner || parentCompany,
                peOwnerFullName: research.peOwnerFullName || parentCompany,
                peOwnerType: research.peOwnerType || 'Private Equity Firm',
                peOwnerAUM: research.peOwnerAUM || 'Research Required',
                peFocus: research.peFocus || 'Analysis Needed',
                peHoldingPeriod: research.peHoldingPeriod || '3-7 years (typical)',
                peExitStrategy: 'Strategic sale or IPO',
                peInvestmentThesis: 'Value creation focus',
                peSalesImplications: 'Efficiency and growth focus',
                peStrategicNotes: `PE-owned by ${research.peOwner || parentCompany} | ${research.explanation || 'Standard PE approach'}`
            };
        }

        return this.createNonPEResult();
    }

    /**
     * Research if parent company is PE-owned
     */
    async researchParentCompanyPEOwnership(parentCompany, corporateStructure) {
        const prompt = `Research the ownership structure of "${parentCompany}".

Determine:
1. Is this company owned by a private equity firm?
2. If yes, which PE firm owns it?
3. When was it acquired?
4. Any other relevant ownership details

Please provide ONLY a JSON response:
{
    "isPEOwned": true/false,
    "peOwner": "PE firm name if applicable",
    "peOwnerFullName": "Full PE firm name if applicable",
    "acquisitionDate": "YYYY-MM-DD if known",
    "explanation": "Brief explanation of ownership structure"
}`;

        const research = await this.callPerplexityAPI(prompt, 'parent_pe_research');
        
        if (research.isPEOwned && research.peOwner) {
            // Research the PE firm details
            const peDetails = await this.researchPEFirm(research.peOwner, parentCompany, corporateStructure);
            if (peDetails.isPEOwned) {
                return {
                    ...peDetails,
                    peOwnerType: (peDetails.peOwnerType || 'PE Firm') + ' (Indirect)',
                    peSalesImplications: (peDetails.peSalesImplications || 'Standard PE approach') + ' (via parent company)',
                    peStrategicNotes: `Indirect PE ownership: ${research.explanation || ''} | ${peDetails.peStrategicNotes || ''}`
                };
            }
        }

        return this.createNonPEResult();
    }

    /**
     * Create result for non-PE owned companies
     */
    createNonPEResult() {
        return {
            isPEOwned: false,
            peOwner: 'None',
            peOwnerFullName: 'N/A',
            peOwnerType: 'Not PE-owned',
            peOwnerAUM: 'N/A',
            peFocus: 'N/A',
            peHoldingPeriod: 'N/A',
            peExitStrategy: 'N/A',
            peInvestmentThesis: 'N/A',
            peSalesImplications: 'Standard corporate approach',
            peStrategicNotes: 'Independent company - standard corporate approach'
        };
    }

    /**
     * Calculate PE exit timeline based on acquisition date
     */
    calculatePEExitTimeline(changeDate, peHoldingPeriod) {
        if (!changeDate) return 'Timeline Unknown';

        const acquisitionDate = new Date(changeDate);
        const currentDate = new Date('2025-01-01');
        const yearsHeld = (currentDate - acquisitionDate) / (1000 * 60 * 60 * 24 * 365);
        
        const maxYears = parseInt(peHoldingPeriod.match(/(\d+)-(\d+)/)?.[2] || '7');
        
        if (yearsHeld >= maxYears) {
            return 'Exit Window Active (Likely seeking exit)';
        } else if (yearsHeld >= (maxYears * 0.7)) {
            return 'Pre-Exit Phase (1-2 years to exit)';
        } else if (yearsHeld >= (maxYears * 0.4)) {
            return 'Value Creation Phase (2-4 years to exit)';
        } else {
            return 'Early Hold Period (4+ years to exit)';
        }
    }

    /**
     * Generate intelligent strategic notes for PE-owned companies
     */
    generateIntelligentPEStrategicNotes(peDetails, corporateStructure) {
        const notes = [];
        
        notes.push(`PE-owned by ${peDetails.peOwnerFullName || peDetails.peOwner} (${peDetails.peOwnerAUM || 'AUM research required'})`);
        
        if (peDetails.peFocus) {
            notes.push(`Focus: ${peDetails.peFocus}`);
        }
        
        if (corporateStructure?.changeDate && peDetails.peHoldingPeriod) {
            const exitTimeline = this.calculatePEExitTimeline(corporateStructure.changeDate, peDetails.peHoldingPeriod);
            if (exitTimeline.includes('Exit Window')) {
                notes.push('🚨 URGENT: Exit window active - decision makers focused on exit preparation');
            } else if (exitTimeline.includes('Pre-Exit')) {
                notes.push('⚠️ PRIORITY: Pre-exit phase - emphasize value creation for exit');
            } else if (exitTimeline.includes('Value Creation')) {
                notes.push('📈 STRATEGIC: Value creation phase - focus on operational improvements');
            } else {
                notes.push('🔧 FOUNDATIONAL: Early hold period - build relationships and establish value');
            }
        }
        
        if (peDetails.peSalesImplications) {
            notes.push(`Key approach: ${peDetails.peSalesImplications}`);
        }
        
        return notes.join(' | ');
    }

    /**
     * Call Perplexity API for PE research
     */
    async callPerplexityAPI(prompt, requestType) {
        for (let attempt = 1; attempt <= this.config.MAX_RETRIES; attempt++) {
            try {
                console.log(`   🤖 ${requestType} (attempt ${attempt})`);

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
                            console.log(`   ✅ ${requestType} successful`);
                            
                            // Rate limiting
                            if (attempt < this.config.MAX_RETRIES) {
                                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
                            }
                            
                            return result;
                        }
                    } catch (parseError) {
                        console.log(`   ⚠️ JSON parsing failed: ${parseError.message}`);
                    }
                } else {
                    console.log(`   ❌ API error: ${response.status}`);
                }

            } catch (error) {
                console.log(`   ❌ Request error: ${error.message}`);
            }

            if (attempt < this.config.MAX_RETRIES) {
                await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
            }
        }

        return {};
    }
}

module.exports = { PEOwnershipAnalysis };
