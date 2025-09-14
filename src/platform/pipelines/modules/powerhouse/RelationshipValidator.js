/**
 * 🔍 RELATIONSHIP VALIDATOR MODULE
 * 
 * Uses Perplexity AI to validate and strengthen relationship intelligence:
 * 1. Cross-validates corporate structures with multiple sources
 * 2. Verifies executive connections and reporting relationships
 * 3. Analyzes PE firm to portfolio company executive connections
 * 4. Provides detailed source attribution and confidence scoring
 * 5. Maps organizational structures (divisions, departments, subsidiaries)
 */

const fetch = require('node-fetch');

class RelationshipValidator {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            WORKING_MODEL: 'sonar-pro',
            MAX_RETRIES: 3,
            RATE_LIMIT_DELAY: 3000,
            ...config
        };
        
        this.validationCache = new Map();
        this.sourceTracker = new Map();
    }

    /**
     * 🎯 COMPREHENSIVE RELATIONSHIP VALIDATION
     * 
     * Validates all relationship claims with detailed source attribution
     */
    async validateRelationships(companyData, relationships) {
        console.log(`\n🔍 RELATIONSHIP VALIDATION: ${companyData.companyName}`);
        console.log('=' .repeat(60));

        const validation = {
            company: companyData.companyName,
            validatedRelationships: {},
            sourceValidation: {},
            confidenceScores: {},
            organizationalStructure: {},
            executiveConnections: {},
            discrepancies: [],
            overallConfidence: 0,
            validationSources: [],
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 1: Validate Corporate Structure
            console.log('🏢 STEP 1: Corporate Structure Validation');
            const structureValidation = await this.validateCorporateStructure(companyData, relationships.corporateHierarchy);
            validation.validatedRelationships.corporateStructure = structureValidation;

            // STEP 2: Validate Executive Network
            console.log('👔 STEP 2: Executive Network Validation');
            const executiveValidation = await this.validateExecutiveNetwork(companyData, relationships.executiveNetwork);
            validation.validatedRelationships.executiveNetwork = executiveValidation;

            // STEP 3: Validate PE Connections
            console.log('🏦 STEP 3: PE Connection Validation');
            const peValidation = await this.validatePEConnections(companyData, relationships);
            validation.validatedRelationships.peConnections = peValidation;

            // STEP 4: Analyze Organizational Structure
            console.log('🏗️ STEP 4: Organizational Structure Analysis');
            const orgStructure = await this.analyzeOrganizationalStructure(companyData, validation.validatedRelationships);
            validation.organizationalStructure = orgStructure;

            // STEP 5: Map Executive Connections
            console.log('🔗 STEP 5: Executive Connection Mapping');
            const execConnections = await this.mapExecutiveConnections(companyData, validation.validatedRelationships);
            validation.executiveConnections = execConnections;

            // STEP 6: Calculate Overall Confidence
            validation.overallConfidence = this.calculateOverallConfidence(validation);
            validation.validationSources = this.getValidationSources(validation);

            console.log(`✅ VALIDATION COMPLETE: ${validation.overallConfidence}% confidence`);
            console.log(`   Sources: ${validation.validationSources.length} validated`);
            console.log(`   Discrepancies: ${validation.discrepancies.length} found`);

            return validation;

        } catch (error) {
            console.error(`❌ Validation failed: ${error.message}`);
            validation.error = error.message;
            return validation;
        }
    }

    /**
     * 🏢 VALIDATE CORPORATE STRUCTURE
     * 
     * Cross-validates parent companies, acquisitions, and ownership structures
     */
    async validateCorporateStructure(companyData, corporateHierarchy) {
        const prompt = `Validate the corporate structure and ownership information for ${companyData.companyName} (${companyData.website}).

Please research and verify:

1. PARENT COMPANY INFORMATION:
   - Current parent company or owner
   - Ownership percentage if available
   - Type of ownership (wholly owned subsidiary, majority stake, etc.)

2. ORGANIZATIONAL STRUCTURE:
   - Is this a subsidiary, division, or independent entity?
   - What is the exact reporting relationship?
   - Are there intermediate holding companies?

3. ACQUISITION HISTORY:
   - When was the company acquired (if applicable)?
   - What was the acquisition price and structure?
   - Has the company made any acquisitions?

4. LEGAL STRUCTURE:
   - Legal entity name vs. operating name
   - Corporate headquarters location
   - Public/private status

Please provide ONLY a JSON response with detailed source attribution:
{
    "parentCompany": {
        "name": "Exact parent company name",
        "ownershipType": "wholly owned subsidiary/majority stake/etc",
        "ownershipPercentage": "100%/specific percentage",
        "relationshipType": "subsidiary/division/operating unit",
        "source": "specific source URL or publication",
        "lastVerified": "2025-01-17",
        "confidence": 0.95
    },
    "organizationalStructure": {
        "entityType": "subsidiary/division/independent/holding company",
        "reportingStructure": "direct subsidiary/operating division/etc",
        "intermediateEntities": ["list of any holding companies between parent and this entity"],
        "operationalAutonomy": "high/medium/low",
        "source": "specific source",
        "confidence": 0.90
    },
    "acquisitionHistory": {
        "wasAcquired": true/false,
        "acquisitionDate": "YYYY-MM-DD",
        "acquirer": "acquiring company name",
        "acquisitionPrice": "amount and currency",
        "acquisitionType": "asset purchase/stock purchase/merger",
        "source": "specific source",
        "confidence": 0.85
    },
    "legalStructure": {
        "legalName": "exact legal entity name",
        "operatingName": "doing business as name",
        "headquarters": "city, state/country",
        "incorporationLocation": "state/country of incorporation",
        "publicPrivateStatus": "public/private",
        "stockTicker": "if public",
        "source": "specific source",
        "confidence": 0.90
    },
    "validationNotes": "Any discrepancies or important clarifications",
    "sourcesUsed": ["list of all sources consulted"],
    "overallConfidence": 0.88
}

Focus on recent, authoritative sources like SEC filings, company press releases, and financial news.`;

        return await this.callPerplexityAPI(prompt, 'corporate_structure_validation');
    }

    /**
     * 👔 VALIDATE EXECUTIVE NETWORK
     * 
     * Validates executive positions and connections
     */
    async validateExecutiveNetwork(companyData, executiveNetwork) {
        const prompt = `Validate the executive team and leadership connections for ${companyData.companyName} (${companyData.website}).

Please research and verify:

1. CURRENT EXECUTIVE TEAM:
   - CEO: Full name, exact title, start date, previous role
   - CFO: Full name, exact title, start date, previous role
   - Other C-level executives and their roles

2. RECENT EXECUTIVE CHANGES:
   - Any recent arrivals (last 12 months)
   - Any recent departures (last 12 months)
   - Interim or acting positions

3. EXECUTIVE BACKGROUNDS:
   - Previous companies where current executives worked
   - Shared career paths between current executives
   - Notable board positions or external roles

4. REPORTING RELATIONSHIPS:
   - Who reports to whom in the C-suite
   - Any dual reporting relationships
   - Board composition if available

Please provide ONLY a JSON response:
{
    "currentExecutives": [
        {
            "name": "Full Name",
            "title": "Exact Title",
            "startDate": "YYYY-MM-DD or approximate",
            "previousRole": "previous position and company",
            "backgroundSummary": "brief career summary",
            "source": "specific source",
            "confidence": 0.95
        }
    ],
    "recentChanges": [
        {
            "name": "Executive Name",
            "changeType": "arrival/departure",
            "date": "YYYY-MM-DD",
            "fromTo": "previous or next company",
            "reason": "if publicly disclosed",
            "source": "specific source",
            "confidence": 0.90
        }
    ],
    "executiveConnections": [
        {
            "executive1": "Name 1",
            "executive2": "Name 2", 
            "connectionType": "worked together at/both from/board connection",
            "sharedExperience": "company or organization",
            "source": "specific source",
            "confidence": 0.80
        }
    ],
    "reportingStructure": {
        "ceoReports": "Board of Directors/Parent Company CEO/etc",
        "cLevelReporting": "description of C-suite reporting relationships",
        "source": "specific source",
        "confidence": 0.75
    },
    "validationNotes": "Any important clarifications",
    "sourcesUsed": ["list of sources"],
    "overallConfidence": 0.85
}

Prioritize recent, authoritative sources like company websites, press releases, and LinkedIn profiles.`;

        return await this.callPerplexityAPI(prompt, 'executive_network_validation');
    }

    /**
     * 🏦 VALIDATE PE CONNECTIONS
     * 
     * Validates PE firm connections and executive relationships
     */
    async validatePEConnections(companyData, relationships) {
        const prompt = `Research and validate private equity connections for ${companyData.companyName} (${companyData.website}).

Please investigate:

1. PE OWNERSHIP:
   - Is the company owned by a private equity firm?
   - Which PE firm and what percentage ownership?
   - When did the PE acquisition occur?

2. PE FIRM DETAILS:
   - PE firm's official name and website
   - Assets under management (AUM)
   - Key partners and investment professionals

3. PE-PORTFOLIO COMPANY EXECUTIVE CONNECTIONS:
   - Does the PE firm have representatives on the company's board?
   - Are there any PE firm partners who work closely with this portfolio company?
   - Have any executives moved between the PE firm and portfolio company?

4. PORTFOLIO COMPANY RELATIONSHIPS:
   - Other companies in the PE firm's portfolio
   - Any shared executives across portfolio companies
   - Cross-portfolio synergies or connections

Please provide ONLY a JSON response:
{
    "peOwnership": {
        "isPEOwned": true/false,
        "peFirm": "exact PE firm name",
        "ownershipPercentage": "percentage if known",
        "acquisitionDate": "YYYY-MM-DD",
        "acquisitionPrice": "amount if disclosed",
        "source": "specific source",
        "confidence": 0.95
    },
    "peFirmDetails": {
        "officialName": "full legal name",
        "website": "PE firm website",
        "aum": "assets under management",
        "foundingYear": "year established",
        "keyPartners": ["list of managing partners"],
        "source": "specific source",
        "confidence": 0.90
    },
    "boardConnections": [
        {
            "peRepresentative": "name of PE firm representative",
            "title": "Managing Partner/Principal/etc",
            "boardRole": "Chairman/Director/Observer",
            "appointmentDate": "when appointed to board",
            "source": "specific source",
            "confidence": 0.85
        }
    ],
    "executiveConnections": [
        {
            "executiveName": "portfolio company executive",
            "peConnection": "PE firm person they work with",
            "relationshipType": "reports to/works with/previously at",
            "connectionDetails": "nature of relationship",
            "source": "specific source",
            "confidence": 0.80
        }
    ],
    "portfolioSynergies": [
        {
            "portfolioCompany": "other company in portfolio",
            "connectionType": "shared executive/board member/business relationship",
            "details": "specific connection details",
            "source": "specific source",
            "confidence": 0.75
        }
    ],
    "validationNotes": "Important clarifications",
    "sourcesUsed": ["list of sources"],
    "overallConfidence": 0.82
}

Focus on authoritative sources like PE firm websites, portfolio pages, and business publications.`;

        return await this.callPerplexityAPI(prompt, 'pe_connections_validation');
    }

    /**
     * 🏗️ ANALYZE ORGANIZATIONAL STRUCTURE
     * 
     * Determines if entity is subsidiary, division, department, etc.
     */
    async analyzeOrganizationalStructure(companyData, validatedRelationships) {
        const corporateStructure = validatedRelationships.corporateStructure;
        
        if (!corporateStructure || !corporateStructure.parentCompany) {
            return {
                structureType: 'independent',
                autonomyLevel: 'full',
                reportingRelationship: 'none',
                confidence: 0.95
            };
        }

        const prompt = `Analyze the organizational structure and reporting relationships for ${companyData.companyName}.

Based on the corporate structure information, determine:

1. ORGANIZATIONAL CLASSIFICATION:
   - Is this a wholly-owned subsidiary, division, business unit, or department?
   - What level of operational autonomy does it have?
   - How does it fit into the parent company's organizational chart?

2. REPORTING STRUCTURE:
   - Who does the CEO/head of this entity report to in the parent organization?
   - Is there a direct reporting line or are there intermediate layers?
   - What is the governance structure (local board vs parent company control)?

3. OPERATIONAL CHARACTERISTICS:
   - Does it operate under its own brand or the parent's brand?
   - Does it have its own P&L responsibility?
   - What functions are centralized vs. decentralized?

Please provide ONLY a JSON response:
{
    "structureType": "subsidiary/division/business_unit/department/independent",
    "autonomyLevel": "full/high/medium/low/minimal",
    "reportingRelationship": {
        "reportsTo": "title of person this entity's head reports to",
        "reportingLayers": "number of layers between this entity and parent CEO",
        "governanceStructure": "local board/parent board/direct management",
        "source": "specific source",
        "confidence": 0.85
    },
    "operationalCharacteristics": {
        "brandIndependence": "operates under own brand/parent brand/hybrid",
        "plResponsibility": "full/shared/none",
        "centralizedFunctions": ["list of functions managed by parent"],
        "decentralizedFunctions": ["list of functions managed locally"],
        "source": "specific source",
        "confidence": 0.80
    },
    "organizationalPosition": {
        "parentOrgChart": "where this fits in parent's structure",
        "siblingEntities": ["other similar entities under same parent"],
        "strategicImportance": "core/growth/legacy/divesting",
        "source": "specific source",
        "confidence": 0.75
    },
    "overallConfidence": 0.80
}`;

        return await this.callPerplexityAPI(prompt, 'organizational_structure_analysis');
    }

    /**
     * 🔗 MAP EXECUTIVE CONNECTIONS
     * 
     * Maps specific executive-to-executive relationships
     */
    async mapExecutiveConnections(companyData, validatedRelationships) {
        const executiveNetwork = validatedRelationships.executiveNetwork;
        const peConnections = validatedRelationships.peConnections;
        
        if (!executiveNetwork?.currentExecutives) {
            return { connections: [], confidence: 0 };
        }

        const prompt = `Map the specific executive connections and relationships for ${companyData.companyName}.

Based on the executive team, research specific person-to-person connections:

1. INTERNAL EXECUTIVE RELATIONSHIPS:
   - How do the current executives know each other?
   - Did they work together previously?
   - Any mentor-mentee relationships?

2. EXTERNAL EXECUTIVE CONNECTIONS:
   - Connections to executives at parent company
   - Connections to PE firm partners (if PE-owned)
   - Board relationships and external connections

3. PROFESSIONAL NETWORK ANALYSIS:
   - Shared educational backgrounds
   - Industry association memberships
   - Previous company overlaps

Please provide ONLY a JSON response:
{
    "internalConnections": [
        {
            "executive1": "Name and title",
            "executive2": "Name and title", 
            "connectionType": "worked together at/mentorship/educational/industry",
            "sharedExperience": "specific company or context",
            "timeframe": "when they worked together",
            "relationshipStrength": "strong/medium/weak",
            "source": "specific source",
            "confidence": 0.85
        }
    ],
    "externalConnections": [
        {
            "companyExecutive": "Name and title",
            "externalContact": "Name, title, and company",
            "connectionType": "reports to/works with/board relationship/previous colleague",
            "relationshipContext": "how they're connected",
            "influenceLevel": "high/medium/low",
            "source": "specific source",
            "confidence": 0.80
        }
    ],
    "networkAnalysis": {
        "networkStrength": "strong/medium/weak",
        "keyInfluencers": ["executives with strongest external networks"],
        "vulnerabilityPoints": ["potential risks from executive departures"],
        "opportunityConnections": ["relationships that could benefit the company"],
        "confidence": 0.75
    },
    "overallConfidence": 0.80
}`;

        return await this.callPerplexityAPI(prompt, 'executive_connections_mapping');
    }

    /**
     * 📊 CALCULATE OVERALL CONFIDENCE
     */
    calculateOverallConfidence(validation) {
        const confidenceScores = [];
        
        // Extract confidence scores from each validation section
        if (validation.validatedRelationships.corporateStructure?.overallConfidence) {
            confidenceScores.push(validation.validatedRelationships.corporateStructure.overallConfidence);
        }
        
        if (validation.validatedRelationships.executiveNetwork?.overallConfidence) {
            confidenceScores.push(validation.validatedRelationships.executiveNetwork.overallConfidence);
        }
        
        if (validation.validatedRelationships.peConnections?.overallConfidence) {
            confidenceScores.push(validation.validatedRelationships.peConnections.overallConfidence);
        }
        
        if (validation.organizationalStructure?.overallConfidence) {
            confidenceScores.push(validation.organizationalStructure.overallConfidence);
        }
        
        if (validation.executiveConnections?.overallConfidence) {
            confidenceScores.push(validation.executiveConnections.overallConfidence);
        }

        // Calculate weighted average
        const avgConfidence = confidenceScores.length > 0 
            ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length 
            : 0;

        return Math.round(avgConfidence * 100);
    }

    /**
     * 📋 GET VALIDATION SOURCES
     */
    getValidationSources(validation) {
        const allSources = new Set();
        
        // Collect sources from all validation sections
        const sections = [
            validation.validatedRelationships.corporateStructure,
            validation.validatedRelationships.executiveNetwork,
            validation.validatedRelationships.peConnections,
            validation.organizationalStructure,
            validation.executiveConnections
        ];

        sections.forEach(section => {
            if (section?.sourcesUsed) {
                section.sourcesUsed.forEach(source => allSources.add(source));
            }
        });

        return Array.from(allSources);
    }

    /**
     * 🔧 PERPLEXITY API CALL
     */
    async callPerplexityAPI(prompt, requestType) {
        const maxRetries = this.config.MAX_RETRIES;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
                        messages: [
                            {
                                role: 'system',
                                content: 'You are a business intelligence researcher. Provide accurate, well-sourced information with specific source attribution. Always return valid JSON responses.'
                            },
                            {
                                role: 'user', 
                                content: prompt
                            }
                        ],
                        temperature: 0.1,
                        max_tokens: 2000
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const content = data.choices[0].message.content;
                
                // Parse JSON response
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log(`   ✅ ${requestType} successful`);
                        return result;
                    } else {
                        throw new Error('No JSON found in response');
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ JSON parse failed, returning text response`);
                    return {
                        rawResponse: content,
                        parseError: parseError.message,
                        confidence: 0.5
                    };
                }

            } catch (error) {
                lastError = error;
                console.log(`   ❌ ${requestType} failed (attempt ${attempt}): ${error.message}`);
                
                if (attempt < maxRetries) {
                    const delay = this.config.RATE_LIMIT_DELAY * attempt;
                    console.log(`   ⏳ Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        console.log(`   💥 ${requestType} failed after ${maxRetries} attempts`);
        throw lastError;
    }
}

module.exports = { RelationshipValidator };
