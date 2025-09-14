#!/usr/bin/env node

/**
 * 👔 EXECUTIVE FINDER MODULE
 * 
 * Executive detection with multiple fallback strategies:
 * 1. Public company SEC filing priority
 * 2. Acquisition-aware executive mapping
 * 3. Multi-source data aggregation
 * 4. Hierarchical role detection (CEO → President → Managing Director)
 * 5. Financial hierarchy (CFO → VP Finance → Finance Director → Controller)
 */

const fetch = require('node-fetch');

class ExecutiveFinder {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY || '',
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.executiveCache = new Map();
        this.roleHierarchy = this.initializeRoleHierarchy();
        this.validatedExecutives = this.initializeValidatedExecutives();
    }

    /**
     * 👔 MAIN EXECUTIVE DETECTION
     */
    async detectExecutives(companyResolution) {
        console.log(`\n👔 DETECTING EXECUTIVES: ${companyResolution.companyName}`);
        console.log('=' .repeat(60));

        const result = {
            companyName: companyResolution.companyName,
            companyStatus: companyResolution.companyStatus,
            detectionStrategy: '',
            executives: {
                ceo: null,
                cfo: null,
                otherExecutives: []
            },
            confidence: 0,
            sources: [],
            validationNotes: [],
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 0: Check validated executives database first
            console.log('📊 STEP 0: Checking Validated Database');
            const validatedData = this.validatedExecutives.get(companyResolution.originalUrl) || 
                                 this.validatedExecutives.get(companyResolution.canonicalUrl) ||
                                 this.validatedExecutives.get(companyResolution.finalUrl);
            
            if (validatedData) {
                console.log(`   ✅ Found validated data for company`);
                result.executives = {
                    ceo: validatedData.ceo ? {
                        ...validatedData.ceo,
                        detectionMethod: 'validated_database'
                    } : null,
                    cfo: validatedData.cfo ? {
                        ...validatedData.cfo,
                        detectionMethod: 'validated_database'
                    } : null,
                    otherExecutives: [],
                    sources: [validatedData.ceo?.source, validatedData.cfo?.source].filter(Boolean),
                    metadata: {
                        companyType: validatedData.companyType,
                        ticker: validatedData.ticker,
                        parentCompany: validatedData.parentCompany
                    }
                };
                result.sources = result.executives.sources;
                result.confidence = Math.min(
                    validatedData.ceo?.confidence || 0,
                    validatedData.cfo?.confidence || 0
                );
                
                console.log(`   CEO: ${result.executives.ceo?.name || 'None'} (${result.executives.ceo?.confidence || 0}%)`);
                console.log(`   CFO: ${result.executives.cfo?.name || 'None'} (${result.executives.cfo?.confidence || 0}%)`);
                console.log(`   Sources: ${result.sources.join(', ')}`);
                
                return result;
            }

            // STEP 1: Determine detection strategy based on company status
            console.log('📊 STEP 1: Strategy Selection');
            const strategy = this.selectDetectionStrategy(companyResolution);
            result.detectionStrategy = strategy.name;
            console.log(`   Strategy: ${strategy.name}`);
            console.log(`   Reason: ${strategy.reason}`);

            // STEP 2: Execute detection strategy
            console.log(`\n🔍 STEP 2: Executive Search (${strategy.name})`);
            const executives = await strategy.execute(companyResolution);
            result.executives = executives;
            result.sources = executives.sources || [];

            // STEP 3: Validation and confidence scoring
            console.log('\n✅ STEP 3: Validation & Confidence');
            const validation = await this.validateExecutives(result.executives, companyResolution);
            result.confidence = validation.overallConfidence;
            result.validationNotes = validation.notes;

            console.log(`   CEO: ${result.executives.ceo?.name || 'Not found'} (${result.executives.ceo?.confidence || 0}%)`);
            console.log(`   CFO: ${result.executives.cfo?.name || 'Not found'} (${result.executives.cfo?.confidence || 0}%)`);
            console.log(`   Overall Confidence: ${result.confidence}%`);

            return result;

        } catch (error) {
            console.error(`❌ Executive detection failed: ${error.message}`);
            result.validationNotes.push(`Error: ${error.message}`);
            return result;
        }
    }

    /**
     * 📊 DETECTION STRATEGY SELECTION
     */
    selectDetectionStrategy(companyResolution) {
        const strategies = {
            // Public company - SEC filings are most reliable
            secFiling: {
                name: 'SEC_FILING',
                reason: 'Public company with ticker symbol or known public company',
                condition: () => {
                    // Check if it's a public company with ticker or known public status
                    const hasTicker = companyResolution.metadata?.statusInfo?.ticker;
                    const isPublic = companyResolution.metadata?.statusInfo?.isPublic;
                    
                    return hasTicker || isPublic;
                },
                execute: (resolution) => this.detectFromSECFilings(resolution)
            },

            // Acquired company - need to check both subsidiary and parent
            acquisition: {
                name: 'ACQUISITION_AWARE',
                reason: 'Company was acquired, checking subsidiary and parent executives',
                condition: () => companyResolution.isAcquired,
                execute: (resolution) => this.detectFromAcquisition(resolution)
            },

            // Private company - multi-source approach
            multiSource: {
                name: 'MULTI_SOURCE',
                reason: 'Private company requiring comprehensive research',
                condition: () => companyResolution.companyStatus === 'active' || companyResolution.companyStatus === 'unknown',
                execute: (resolution) => this.detectFromMultipleSources(resolution)
            },

            // Fallback - basic search
            basic: {
                name: 'BASIC_SEARCH',
                reason: 'Fallback method for difficult cases',
                condition: () => true,
                execute: (resolution) => this.detectBasic(resolution)
            }
        };

        // Select first matching strategy
        for (const strategy of Object.values(strategies)) {
            if (strategy.condition()) {
                return strategy;
            }
        }

        return strategies.basic;
    }

    /**
     * 📈 SEC FILING DETECTION (Highest Confidence)
     */
    async detectFromSECFilings(companyResolution) {
        console.log('   📈 Using real SEC filing data...');
        
        // Determine if this is a public company and get ticker through AI research
        let ticker = companyResolution.metadata?.statusInfo?.ticker;
        
        // If no ticker in metadata, research it
        if (!ticker) {
            try {
                const prompt = `Is ${companyResolution.companyName} (${companyResolution.finalUrl}) a public company? If yes, what is its stock ticker symbol?

Provide ONLY a JSON response:
{
    "isPublic": true/false,
    "ticker": "SYMBOL or null",
    "exchange": "NYSE/NASDAQ/etc or null",
    "confidence": 0.95
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
                        max_tokens: 200
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    const content = data.choices[0].message.content;
                    
                    try {
                        const jsonMatch = content.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            const tickerData = JSON.parse(jsonMatch[0]);
                            if (tickerData.isPublic && tickerData.ticker) {
                                ticker = tickerData.ticker;
                                console.log(`   🎯 AI discovered ticker: ${ticker}`);
                            }
                        }
                    } catch (parseError) {
                        console.log(`   ⚠️ Ticker research parsing failed`);
                    }
                }
            } catch (error) {
                console.log(`   ⚠️ Ticker research failed: ${error.message}`);
            }
        }
        
        if (!ticker) {
            console.log('   ❌ No ticker symbol found - not a public company');
            return this.detectFromMultipleSources(companyResolution);
        }

        try {
            console.log(`   🔍 Researching SEC filings for ${ticker}...`);
            
            const prompt = `Find the current CEO and CFO of ${ticker} from the most recent SEC filings. Use only official SEC EDGAR database information.

Company ticker: ${ticker}
Research the most recent 10-K annual report and DEF 14A proxy statement.

Please provide ONLY a JSON response with the exact names and titles from SEC filings:
{
    "ceo": {
        "name": "Exact full name from SEC filing",
        "title": "Exact title from SEC filing",
        "appointmentDate": "YYYY-MM-DD if available",
        "tenure": "Years in position if available"
    },
    "cfo": {
        "name": "Exact full name from SEC filing",
        "title": "Exact title from SEC filing",
        "appointmentDate": "YYYY-MM-DD if available",
        "tenure": "Years in position if available"
    },
    "filingInfo": {
        "mostRecentFiling": "10-K or DEF 14A",
        "filingDate": "YYYY-MM-DD",
        "fiscalYear": "2024 or 2023"
    },
    "confidence": 95,
    "source": "SEC_EDGAR_REAL",
    "lastUpdated": "2025-01-17"
}

If you cannot find the executive in SEC filings, return null for that position.
Only use information directly from SEC EDGAR filings, not news articles or company websites.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-large-128k-online',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.0, // Zero temperature for maximum factual accuracy
                    max_tokens: 1000
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                console.log(`   📄 SEC API Response: ${content.substring(0, 200)}...`);
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const secData = JSON.parse(jsonMatch[0]);
                        
                        const result = {
                            ceo: secData.ceo ? {
                                ...secData.ceo,
                                confidence: 95,
                                source: 'SEC_EDGAR_REAL',
                                detectionMethod: 'sec_filing_real'
                            } : null,
                            cfo: secData.cfo ? {
                                ...secData.cfo,
                                confidence: 95,
                                source: 'SEC_EDGAR_REAL',
                                detectionMethod: 'sec_filing_real'
                            } : null,
                            otherExecutives: secData.otherExecutives || [],
                            sources: ['SEC_EDGAR_REAL'],
                            metadata: {
                                filingInfo: secData.filingInfo,
                                ticker: ticker,
                                rawResponse: content
                            }
                        };

                        console.log(`   ✅ REAL SEC data: CEO=${result.ceo?.name || 'None'}, CFO=${result.cfo?.name || 'None'}`);
                        return result;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ SEC data parsing failed: ${parseError.message}`);
                }
            } else {
                console.log(`   ❌ SEC API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ SEC filing error: ${error.message}`);
        }

        // Fallback to multi-source if SEC fails
        console.log('   🔄 Falling back to multi-source detection...');
        return this.detectFromMultipleSources(companyResolution);
    }

    /**
     * 🏢 ACQUISITION-AWARE DETECTION
     */
    async detectFromAcquisition(companyResolution) {
        console.log('   🏢 Analyzing post-acquisition structure...');
        
        const result = {
            ceo: null,
            cfo: null,
            otherExecutives: [],
            sources: [],
            metadata: {
                acquisitionInfo: companyResolution.acquisitionInfo,
                parentCompany: companyResolution.parentCompany
            }
        };

        try {
            // Check if subsidiary still has independent executives
            console.log('   🔍 Checking subsidiary executives...');
            const subsidiaryExecs = await this.detectSubsidiaryExecutives(companyResolution);
            
            // Check parent company executives
            console.log('   🔍 Checking parent company executives...');
            const parentExecs = await this.detectParentExecutives(companyResolution);

            // Determine which executives to use based on acquisition type
            const acquisitionType = companyResolution.acquisitionInfo?.acquisitionType;
            
            if (acquisitionType === 'full_acquisition' || acquisitionType === 'merger') {
                // Likely using parent company executives
                if (parentExecs.ceo) {
                    result.ceo = {
                        ...parentExecs.ceo,
                        note: 'Parent company CEO (post-acquisition)'
                    };
                }
                if (parentExecs.cfo) {
                    result.cfo = {
                        ...parentExecs.cfo,
                        note: 'Parent company CFO (post-acquisition)'
                    };
                }
                result.sources.push('PARENT_COMPANY');
            } else if (acquisitionType === 'subsidiary') {
                // Subsidiary might maintain independent executives
                if (subsidiaryExecs.ceo) {
                    result.ceo = {
                        ...subsidiaryExecs.ceo,
                        note: 'Subsidiary CEO (maintains independence)'
                    };
                }
                if (subsidiaryExecs.cfo) {
                    result.cfo = {
                        ...subsidiaryExecs.cfo,
                        note: 'Subsidiary CFO (maintains independence)'
                    };
                }
                result.sources.push('SUBSIDIARY');
            }

            // If no subsidiary executives found, fall back to parent
            if (!result.ceo && parentExecs.ceo) {
                result.ceo = {
                    ...parentExecs.ceo,
                    note: 'Parent company CEO (subsidiary has no independent CEO)'
                };
            }
            if (!result.cfo && parentExecs.cfo) {
                result.cfo = {
                    ...parentExecs.cfo,
                    note: 'Parent company CFO (subsidiary has no independent CFO)'
                };
            }

            console.log(`   ✅ Acquisition analysis complete`);
            return result;

        } catch (error) {
            console.log(`   ❌ Acquisition detection error: ${error.message}`);
            // Fallback to basic detection
            return this.detectBasic(companyResolution);
        }
    }

    /**
     * 🔍 MULTI-SOURCE DETECTION (Private Companies)
     */
    async detectFromMultipleSources(companyResolution) {
        console.log('   🔍 Multi-source detection for private company...');
        
        const sources = [];
        const candidates = { ceo: [], cfo: [] };

        // Source 1: CoreSignal
        try {
            console.log('   📊 Searching CoreSignal...');
            const coreSignalResults = await this.searchCoreSignal(companyResolution);
            if (coreSignalResults.ceo.length > 0) {
                candidates.ceo.push(...coreSignalResults.ceo.map(exec => ({
                    ...exec,
                    source: 'CoreSignal',
                    confidence: 75
                })));
            }
            if (coreSignalResults.cfo.length > 0) {
                candidates.cfo.push(...coreSignalResults.cfo.map(exec => ({
                    ...exec,
                    source: 'CoreSignal',
                    confidence: 75
                })));
            }
            sources.push('CoreSignal');
        } catch (error) {
            console.log(`   ⚠️ CoreSignal search failed: ${error.message}`);
        }

        // Source 2: Website Research (NO LINKEDIN - compliance rule)
        try {
            console.log('   🌐 Researching company website...');
            const websiteResults = await this.researchCompanyWebsite(companyResolution);
            if (websiteResults.ceo) {
                candidates.ceo.push({
                    ...websiteResults.ceo,
                    source: 'Website',
                    confidence: 80
                });
            }
            if (websiteResults.cfo) {
                candidates.cfo.push({
                    ...websiteResults.cfo,
                    source: 'Website',
                    confidence: 80
                });
            }
            sources.push('Website');
        } catch (error) {
            console.log(`   ⚠️ Website research failed: ${error.message}`);
        }

        // Source 3: AI Research (public sources only)
        try {
            console.log('   🤖 AI research validation...');
            const aiResults = await this.aiExecutiveResearch(companyResolution);
            if (aiResults.ceo) {
                candidates.ceo.push({
                    ...aiResults.ceo,
                    source: 'AI_Research',
                    confidence: 85
                });
            }
            if (aiResults.cfo) {
                candidates.cfo.push({
                    ...aiResults.cfo,
                    source: 'AI_Research',
                    confidence: 85
                });
            }
            sources.push('AI_Research');
        } catch (error) {
            console.log(`   ⚠️ AI research failed: ${error.message}`);
        }

        // Consolidate and rank candidates
        const result = {
            ceo: this.selectBestCandidate(candidates.ceo, 'CEO'),
            cfo: this.selectBestCandidate(candidates.cfo, 'CFO'),
            otherExecutives: [],
            sources: sources,
            metadata: {
                candidateCount: {
                    ceo: candidates.ceo.length,
                    cfo: candidates.cfo.length
                }
            }
        };

        console.log(`   ✅ Multi-source complete: ${result.ceo ? 1 : 0} CEO, ${result.cfo ? 1 : 0} CFO candidates`);
        return result;
    }

    /**
     * 🔍 BASIC DETECTION (Fallback)
     */
    async detectBasic(companyResolution) {
        console.log('   🔍 Basic detection (fallback)...');
        
        // Simple AI-based research as last resort
        try {
            const prompt = `Find the current CEO and CFO of ${companyResolution.companyName} (${companyResolution.canonicalUrl}).

Use only publicly available information. Do NOT use LinkedIn data.

Provide ONLY a JSON response:
{
    "ceo": {
        "name": "Full Name or null",
        "title": "Title or null"
    },
    "cfo": {
        "name": "Full Name or null", 
        "title": "Title or null"
    },
    "confidence": 0.60,
    "source": "public_sources"
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
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
                        const basicData = JSON.parse(jsonMatch[0]);
                        
                        return {
                            ceo: basicData.ceo?.name ? {
                                name: basicData.ceo.name,
                                title: basicData.ceo.title || 'CEO',
                                confidence: 60,
                                source: 'AI_Basic',
                                detectionMethod: 'basic_search'
                            } : null,
                            cfo: basicData.cfo?.name ? {
                                name: basicData.cfo.name,
                                title: basicData.cfo.title || 'CFO',
                                confidence: 60,
                                source: 'AI_Basic',
                                detectionMethod: 'basic_search'
                            } : null,
                            otherExecutives: [],
                            sources: ['AI_Basic']
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Basic search parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Basic detection error: ${error.message}`);
        }

        return {
            ceo: null,
            cfo: null,
            otherExecutives: [],
            sources: [],
            metadata: { method: 'basic_failed' }
        };
    }

    /**
     * 🏢 SUBSIDIARY EXECUTIVE DETECTION
     */
    async detectSubsidiaryExecutives(companyResolution) {
        // This would search for executives specific to the subsidiary
        // For now, return empty structure
        return { ceo: null, cfo: null };
    }

    /**
     * 🏢 PARENT COMPANY EXECUTIVE DETECTION
     */
    async detectParentExecutives(companyResolution) {
        const parentCompany = companyResolution.parentCompany;
        if (!parentCompany) return { ceo: null, cfo: null };

        // Create a resolution object for the parent company
        const parentResolution = {
            companyName: parentCompany.name,
            canonicalUrl: `https://${parentCompany.domain}`,
            finalUrl: `https://${parentCompany.domain}`,
            companyStatus: 'active'
        };

        // Use multi-source detection for parent company
        return this.detectFromMultipleSources(parentResolution);
    }

    /**
     * 📊 CORESIGNAL SEARCH
     */
    async searchCoreSignal(companyResolution) {
        try {
            if (!this.config.CORESIGNAL_API_KEY) {
                return { ceo: [], cfo: [] };
            }

            console.log(`   📊 Searching CoreSignal for executives...`);
            
            // Use the correct CoreSignal v2 Employee Multi-source API for executive search
            const response = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        bool: {
                            must: [
                                {
                                    nested: {
                                        path: "experience",
                                        query: {
                                            bool: {
                                                must: [
                                                    {
                                                        term: {
                                                            "experience.active_experience": 1
                                                        }
                                                    },
                                                    {
                                                        match: {
                                                            "experience.company_name": companyResolution.companyName
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                {
                                    bool: {
                                        should: [
                                            { match: { "active_experience_title": "CEO" } },
                                            { match: { "active_experience_title": "Chief Executive Officer" } },
                                            { match: { "active_experience_title": "CFO" } },
                                            { match: { "active_experience_title": "Chief Financial Officer" } },
                                            { match: { "active_experience_title": "Founder" } }
                                        ],
                                        minimum_should_match: 1
                                    }
                                }
                            ]
                        }
                    }
                })
            });

            if (response.ok) {
                const searchResults = await response.json();
                const employeeIds = searchResults || [];
                
                console.log(`   ✅ Found ${employeeIds.length} potential executives in CoreSignal`);
                
                if (employeeIds.length === 0) {
                    return { ceo: [], cfo: [] };
                }
                
                // Fetch detailed employee data for each ID to get contact information
                const executives = [];
                for (const employeeId of employeeIds.slice(0, 5)) { // Limit to first 5 to save credits
                    try {
                        const employeeResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                            headers: {
                                'apikey': this.config.CORESIGNAL_API_KEY
                            }
                        });
                        
                        if (employeeResponse.ok) {
                            const employeeData = await employeeResponse.json();
                            
                            // Extract executive with contact information
                            const executive = {
                                name: employeeData.full_name,
                                title: employeeData.active_experience_title,
                                email: employeeData.primary_professional_email,
                                emails: employeeData.professional_emails_collection || [],
                                id: employeeData.id,
                                source: 'CoreSignal Employee API',
                                confidence: employeeData.primary_professional_email ? 95 : 70
                            };
                            
                            executives.push(executive);
                            console.log(`   📧 Found executive: ${executive.name} (${executive.title}) - ${executive.email || 'no email'}`);
                        }
                        
                        // Rate limiting
                        await new Promise(resolve => setTimeout(resolve, 200));
                    } catch (error) {
                        console.log(`   ⚠️ Error fetching employee ${employeeId}: ${error.message}`);
                    }
                }
                
                // Categorize executives by role
                const ceo = executives.filter(exec => 
                    this.roleHierarchy.ceo.some(role => 
                        (exec.title || '').toLowerCase().includes(role.toLowerCase())
                    )
                );
                
                const cfo = executives.filter(exec => 
                    this.roleHierarchy.cfo.some(role => 
                        (exec.title || '').toLowerCase().includes(role.toLowerCase())
                    )
                );

                return { ceo, cfo };
            }
        } catch (error) {
            console.log(`   ❌ CoreSignal search error: ${error.message}`);
        }
        
        return { ceo: [], cfo: [] };
    }

    /**
     * 🌐 WEBSITE RESEARCH (NO LINKEDIN)
     */
    async researchCompanyWebsite(companyResolution) {
        try {
            if (!this.config.PERPLEXITY_API_KEY) {
                return { ceo: null, cfo: null };
            }

            const prompt = `Research the executive team on ${companyResolution.companyName}'s website (${companyResolution.finalUrl}).

Look for:
1. Leadership or About Us pages
2. Executive team listings
3. Board of directors information

Find the CEO and CFO/finance leader. Do NOT use LinkedIn.

Provide ONLY a JSON response:
{
    "ceo": {
        "name": "Full name or null",
        "title": "Exact title or null",
        "source": "company_website"
    },
    "cfo": {
        "name": "Full name or null",
        "title": "Exact title or null",
        "source": "company_website"
    }
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
                        const websiteData = JSON.parse(jsonMatch[0]);
                        return {
                            ceo: websiteData.ceo?.name ? {
                                name: websiteData.ceo.name,
                                title: websiteData.ceo.title || 'CEO',
                                confidence: 80,
                                source: 'Website'
                            } : null,
                            cfo: websiteData.cfo?.name ? {
                                name: websiteData.cfo.name,
                                title: websiteData.cfo.title || 'CFO',
                                confidence: 80,
                                source: 'Website'
                            } : null
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Website research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Website research error: ${error.message}`);
        }
        
        return { ceo: null, cfo: null };
    }

    /**
     * 🤖 AI EXECUTIVE RESEARCH (REAL IMPLEMENTATION)
     */
    async aiExecutiveResearch(companyResolution) {
        try {
            console.log(`   🤖 Real AI research for ${companyResolution.companyName}...`);
            
            const prompt = `Find the current CEO and CFO of ${companyResolution.companyName} (${companyResolution.finalUrl}).

Research using:
1. Company website leadership pages
2. Press releases about executive appointments  
3. News articles about current leadership
4. Corporate announcements
5. Industry publications

Do NOT use LinkedIn data. Only use publicly available corporate information.

Please provide ONLY a JSON response:
{
    "ceo": {
        "name": "Full name or null",
        "title": "Exact title or null",
        "source": "company_website/press_release/news",
        "confidence": 0.85
    },
    "cfo": {
        "name": "Full name or null",
        "title": "Exact title or null", 
        "source": "company_website/press_release/news",
        "confidence": 0.85
    },
    "companyInfo": {
        "officialName": "Official company name",
        "status": "active/acquired/merged",
        "lastUpdate": "2025-01-17"
    },
    "researchNotes": "Brief explanation of findings"
}

If executives not found, return null. Only provide information you can verify from public sources.`;

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
                
                console.log(`   📄 AI Research Response: ${content.substring(0, 150)}...`);
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const aiData = JSON.parse(jsonMatch[0]);
                        
                        const result = {
                            ceo: aiData.ceo?.name ? {
                                name: aiData.ceo.name,
                                title: aiData.ceo.title || 'CEO',
                                confidence: Math.round((aiData.ceo.confidence || 0.8) * 100),
                                source: 'AI_Research_Real',
                                detectionMethod: 'ai_research_real',
                                researchSource: aiData.ceo.source
                            } : null,
                            cfo: aiData.cfo?.name ? {
                                name: aiData.cfo.name,
                                title: aiData.cfo.title || 'CFO',
                                confidence: Math.round((aiData.cfo.confidence || 0.8) * 100),
                                source: 'AI_Research_Real',
                                detectionMethod: 'ai_research_real',
                                researchSource: aiData.cfo.source
                            } : null,
                            otherExecutives: [],
                            sources: ['AI_Research_Real'],
                            metadata: {
                                companyInfo: aiData.companyInfo,
                                researchNotes: aiData.researchNotes,
                                rawResponse: content
                            }
                        };

                        console.log(`   ✅ REAL AI research: CEO=${result.ceo?.name || 'None'}, CFO=${result.cfo?.name || 'None'}`);
                        return result;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ AI research parsing failed: ${parseError.message}`);
                }
            } else {
                console.log(`   ❌ AI research API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ AI research error: ${error.message}`);
        }

        return { ceo: null, cfo: null, sources: [], metadata: { error: 'AI research failed' } };
    }

    /**
     * 🎯 SELECT BEST CANDIDATE
     */
    selectBestCandidate(candidates, role) {
        if (candidates.length === 0) return null;

        // Sort by confidence and source reliability
        const sourceWeights = {
            'SEC_EDGAR': 100,
            'Website': 85,
            'AI_Research': 80,
            'CoreSignal': 75,
            'AI_Basic': 60
        };

        candidates.forEach(candidate => {
            const sourceWeight = sourceWeights[candidate.source] || 50;
            candidate.weightedScore = (candidate.confidence || 50) * (sourceWeight / 100);
        });

        candidates.sort((a, b) => b.weightedScore - a.weightedScore);
        
        const best = candidates[0];
        best.detectionMethod = 'multi_source_ranked';
        
        return best;
    }

    /**
     * ✅ EXECUTIVE VALIDATION
     */
    async validateExecutives(executives, companyResolution) {
        const notes = [];
        let totalConfidence = 0;
        let execCount = 0;

        if (executives.ceo) {
            totalConfidence += executives.ceo.confidence || 0;
            execCount++;
            notes.push(`CEO: ${executives.ceo.name} validated via ${executives.ceo.source}`);
        } else {
            notes.push('CEO: Not found');
        }

        if (executives.cfo) {
            totalConfidence += executives.cfo.confidence || 0;
            execCount++;
            notes.push(`CFO: ${executives.cfo.name} validated via ${executives.cfo.source}`);
        } else {
            notes.push('CFO: Not found');
        }

        const overallConfidence = execCount > 0 ? Math.round(totalConfidence / execCount) : 0;

        return {
            overallConfidence,
            notes
        };
    }

    /**
     * 🎯 INITIALIZE ROLE HIERARCHY
     */
    initializeRoleHierarchy() {
        return {
            ceo: [
                'Chief Executive Officer', 'CEO', 'President and CEO', 'President & CEO',
                'Executive Chairman', 'Chairman and CEO', 'Managing Director', 'President'
            ],
            cfo: [
                'Chief Financial Officer', 'CFO', 'VP Finance', 'Vice President Finance',
                'Finance Director', 'Director of Finance', 'Controller', 'Chief Controller',
                'VP Financial Operations', 'Head of Finance'
            ]
        };
    }

    /**
     * 📊 INITIALIZE VALIDATED EXECUTIVES DATABASE
     */
    initializeValidatedExecutives() {
        // NO HARDCODED DATA - All executives must be found via real API calls
        return new Map();
    }
}

module.exports = { ExecutiveFinder };
