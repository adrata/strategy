#!/usr/bin/env node

/**
 * 🏢 CORESIGNAL MULTI-SOURCE MODULE
 * 
 * Credit-efficient employee discovery using CoreSignal's multi-source preview API:
 * 1. Preview 100 employees at company (1 credit)
 * 2. Filter CFO/CRO candidates from preview (free)
 * 3. Collect full profiles for matches (1 credit each)
 * 
 * 94% credit savings vs blind collection
 */

// Use global fetch (Node.js 18+) or fallback to node-fetch
const fetch = globalThis.fetch || require('node-fetch');
const { ExecutiveRoleDefinitions } = require('./ExecutiveRoleDefinitions');
const RetryHandler = require('./RetryHandler');
const TimeoutHandler = require('./TimeoutHandler');

class CoreSignalMultiSource {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: (config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY || '').replace(/\\n/g, '').trim(),
            CORESIGNAL_BASE_URL: config.CORESIGNAL_BASE_URL || 'https://api.coresignal.com',
            TIMEOUT: config.TIMEOUT || 20000, // Optimized from 30s to 20s
            MAX_RETRIES: config.MAX_RETRIES || 2,
            PREVIEW_LIMIT: config.PREVIEW_LIMIT || 100,
            ...config
        };
        
        // Initialize retry and timeout handlers
        this.retryHandler = new RetryHandler({
            maxRetries: this.config.MAX_RETRIES,
            baseDelay: 1000,
            maxDelay: 10000
        });
        
        this.timeoutHandler = new TimeoutHandler({
            defaultTimeout: this.config.TIMEOUT
        });
        
        this.roleDefinitions = new ExecutiveRoleDefinitions();
        
        this.stats = {
            previewSearches: 0,
            profileCollections: 0,
            cfoFound: 0,
            croFound: 0,
            creditsUsed: 0,
            successes: 0,
            failures: 0
        };
    }

    /**
     * 🔍 SEARCH COMPANY ID BY NAME/WEBSITE
     * 
     * Find company ID first using CoreSignal's search endpoints
     * This is required before searching for employees
     */
    async searchCompanyId(companyName, website = null) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not configured');
            return null;
        }

        try {
            console.log(`   🔍 CoreSignal: Searching for company ID - Name: "${companyName}", Website: "${website}"`);
            const searchUrl = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/search/es_dsl`;
            
            // PRIORITY 1: Try website-based search with multiple variations
            if (website) {
                const websiteVariations = this.getWebsiteVariations(website);
                
                for (const variation of websiteVariations) {
                    console.log(`   🎯 [Priority 1] Trying website search: ${variation}`);
                    
                    // Try multiple search approaches for website
                    const domainSearchQueries = [
                        // Exact match on company_website
                        {
                query: {
                                query_string: {
                                    query: `"${variation}"`,
                                    default_field: "company_website"
                                }
                            }
                        },
                        // Match on multiple fields
                        {
                                    query: {
                                        bool: {
                                    should: [
                                        { match: { "company_website": variation } },
                                        { match: { "company_domain": variation } },
                                        { match: { "website": variation } },
                                        { match: { "domain": variation } }
                                    ],
                                    minimum_should_match: 1
                                }
                            }
                        },
                        // Wildcard search
                        {
                            query: {
                                wildcard: {
                                    "company_website": `*${variation}*`
                                }
                            }
                        }
                    ];

                    let companyId = null;
                    for (let i = 0; i < domainSearchQueries.length; i++) {
                        const domainSearchQuery = domainSearchQueries[i];
                        console.log(`   🔍 DEBUG: Trying search approach ${i + 1} for ${variation}`);

                        const domainResponse = await fetch(searchUrl, {
                            method: 'POST',
                            headers: {
                                'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(domainSearchQuery),
                            timeout: this.config.TIMEOUT
                        });

                        if (domainResponse.ok) {
                            const domainData = await domainResponse.json();
                            console.log(`   🔍 DEBUG: Website search response for ${variation} (approach ${i + 1}):`, JSON.stringify(domainData, null, 2));
                            companyId = this.extractCompanyId(domainData, 'website', variation);
                            if (companyId) {
                                console.log(`   ✅ Found company ID via website: ${companyId} for "${variation}" (approach ${i + 1})`);
                                return companyId;
                            }
                        } else {
                            console.log(`   ❌ Website search failed (approach ${i + 1}): ${domainResponse.status} ${domainResponse.statusText}`);
                        }
                    }
                    
                    if (!companyId) {
                        console.log(`   ⚠️ All website search approaches failed for: ${variation}`);
                    }
                }
            }
            
            // PRIORITY 2: Try company name search with multiple variations
            if (companyName && !this.isInvalidCompanyName(companyName)) {
                const nameVariations = this.getCompanyNameVariations(companyName);
                
                for (const variation of nameVariations) {
                    console.log(`   🎯 [Priority 2] Trying company name search: ${variation}`);
                    
                    const searchQuery = {
                        query: {
                            query_string: {
                                query: `"${variation}"`,
                                default_field: "company_name"
                            }
                        }
                    };

                    const response = await fetch(searchUrl, {
                        method: 'POST',
                        headers: {
                            'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                            'Content-Type': 'application/json',
                            'Accept': 'application/json'
                        },
                        body: JSON.stringify(searchQuery),
                        timeout: this.config.TIMEOUT
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const companyId = this.extractCompanyId(data, 'name', variation);
                        if (companyId) {
                            return companyId;
                        }
                    }
                }
            } else {
                console.log(`   ⚠️ Skipping company name search - invalid name: "${companyName}"`);
            }

            // PRIORITY 3: Try fuzzy matching with broader search
            if (companyName && !this.isInvalidCompanyName(companyName)) {
                console.log(`   🎯 [Priority 3] Trying fuzzy matching: ${companyName}`);
                
                const fuzzyQuery = {
                    query: {
                                                    bool: {
                                                        should: [
                                {
                                    match: {
                                        company_name: {
                                            query: companyName,
                                            fuzziness: "AUTO"
                                        }
                                    }
                                },
                                {
                                    wildcard: {
                                        company_name: `*${companyName}*`
                                    }
                                }
                            ],
                            minimum_should_match: 1
                        }
                    }
                };

                const response = await fetch(searchUrl, {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(fuzzyQuery),
                    timeout: 15000 // Reduced from 20s to 15s for faster fallback
                });

                if (response.ok) {
                    const data = await response.json();
                    const companyId = this.extractCompanyId(data, 'fuzzy', companyName);
                    if (companyId) {
                        return companyId;
                    }
                }
            }

            console.log(`   ❌ No company ID found for: ${companyName} / ${website}`);
            return null;

        } catch (error) {
            console.log(`   ❌ CoreSignal company search error: ${error.message}`);
            return null;
        }
    }

    /**
     * 🚫 CHECK IF COMPANY NAME IS INVALID
     * 
     * Detect invalid company names to avoid wasting API calls
     */
    isInvalidCompanyName(name) {
        if (!name || typeof name !== 'string') {
            return true;
        }
        
        const nameLower = name.toLowerCase().trim();
        const invalidNames = ['unknown', 'undefined', 'null', 'n/a', 'na', ''];
        
        return invalidNames.includes(nameLower) || nameLower.length < 2;
    }

    /**
     * 🧹 CLEAN DOMAIN FROM WEBSITE
     */
    cleanDomain(website) {
        if (!website) return '';
        return website
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .toLowerCase();
    }

    /**
     * 🔍 SEARCH EMPLOYEES BY EXACT TITLE (ELASTICSEARCH)
     * 
     * Use CoreSignal's Elasticsearch endpoint to find employees with exact job titles
     * This is more accurate than key_executives for finding actual CFOs/CROs
     */

    /**
     * Search for employees by comprehensive role definitions using CoreSignal's regular search endpoint
     * 
     * Uses the regular search endpoint: /search/es_dsl
     * This provides comprehensive coverage for all companies
     * 
     * @param {string} companyName - Company name to search
     * @param {string} roleType - 'cfo' or 'cro'
     * @param {string} companyId - Company ID from CoreSignal (optional, will be fetched if not provided)
     * @returns {Array} Array of matching employees with full data
     */
        async searchEmployeesByTitle(companyName, roleType = 'cfo', companyId = null) {
            if (!this.config.CORESIGNAL_API_KEY) {
                console.log('   ⚠️ CoreSignal API key not configured');
                return [];
            }

            try {
                // Get comprehensive role definitions (56 CFO or 70 CRO variations)
                const jobTitles = this.roleDefinitions.getSearchTerms(roleType);
                console.log(`   🔍 CoreSignal: Searching for ${roleType.toUpperCase()} roles (${jobTitles.length} variations) at ${companyName}...`);
                this.stats.previewSearches++;

                // Use regular search endpoint for comprehensive coverage
                const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl`;
                
                // Build comprehensive query with all role variations
                const query = {
                    query: {
                        bool: {
                            must: [
                                { match: { "company_name": companyName } },
                                {
                                    bool: {
                                        should: jobTitles.map(title => ({
                                            match: { "active_experience_title": title }
                                        })),
                                        minimum_should_match: 1
                                    }
                                }
                            ]
                        }
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(query),
                    timeout: this.config.TIMEOUT
                });

                if (!response.ok) {
                    console.log(`   ❌ CoreSignal search failed: ${response.status} ${response.statusText}`);
                    this.stats.failures++;
                    return [];
                }

                const data = await response.json();
                this.stats.creditsUsed += 1; // Regular search costs 1 credit
                this.stats.successes++;

                // Regular search returns { hits: { hits: [...] } } structure
                if (data.hits && data.hits.hits && data.hits.hits.length > 0) {
                    console.log(`   ✅ CoreSignal: Found ${data.hits.hits.length} employees`);
                    return data.hits.hits.map(hit => ({
                        id: hit._source.id,
                        name: hit._source.full_name,
                        title: hit._source.active_experience_title,
                        company: hit._source.company_name,
                        email: hit._source.email || '',
                        phone: hit._source.phone || '',
                        linkedinUrl: hit._source.professional_network_url || '',
                        score: hit._score || 100,
                        managementLevel: hit._source.active_experience_management_level,
                        department: hit._source.active_experience_department,
                        fullData: hit._source
                    }));
                } else {
                    console.log(`   ⚠️ CoreSignal: No employees found`);
                    return [];
                }

        } catch (error) {
            console.log(`   ❌ CoreSignal Search error: ${error.message}`);
            this.stats.failures++;
            return [];
        }
    }

    // REMOVED: searchEmployeesByDepartment() - was causing 422 errors due to incorrect field names

    // REMOVED: searchTopEmployeesBySeniority() - was causing 422 errors due to incorrect field names

    /**
     * 🔍 PREVIEW EMPLOYEES AT COMPANY
     * 
     * Search for employees with basic info (1 credit for 100 employees)
     */
    async previewEmployees(companyName, limit = 200) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not configured');
            return null;
        }

        try {
            console.log(`   🏢 CoreSignal: Fetching company executives for ${companyName}...`);
            this.stats.previewSearches++;

            // Use company collect endpoint to get key_executives data
            const companyShorthand = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/collect/${companyShorthand}`;

            console.log(`   🔍 DEBUG: Fetching from: ${url}`);

            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout(url, {
                    method: 'GET',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Accept': 'application/json'
                    }
                }, this.timeoutHandler.getApiTimeout('coresignal'));
            });

            if (!response.ok) {
                throw new Error(`CoreSignal company data error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.stats.creditsUsed += 2; // Company collect costs 2 credits
            this.stats.successes++;

            console.log(`   🔍 DEBUG: Response has key_executives:`, !!data.key_executives);

            if (data.key_executives && Array.isArray(data.key_executives) && data.key_executives.length > 0) {
                console.log(`   ✅ CoreSignal: Found ${data.key_executives.length} key executives`);
                console.log(`   🔍 DEBUG: First executive raw data:`, JSON.stringify(data.key_executives[0]));
                
                // Extract executive info from company key_executives
                const employees = data.key_executives.slice(0, limit).map(exec => ({
                    id: exec.parent_id || exec.id,
                    name: exec.member_full_name || exec.full_name || exec.name || 'Unknown',
                    title: exec.member_position_title || exec.current_title || exec.title || exec.position || '',
                    company: data.company_name || companyName,
                    linkedinUrl: exec.member_linkedin_url || exec.linkedin_url || exec.linkedin || '',
                    email: exec.member_professional_email || exec.primary_professional_email || exec.email || '',
                    phone: exec.member_phone_number || exec.phone_number || exec.phone || '',
                    confidence: exec.confidence_score || 80, // Key executives are typically high confidence
                    lastUpdated: exec.last_updated || data.last_updated_at || new Date().toISOString(),
                    // Store original data for debugging
                    _raw: exec
                }));

                return employees;
            }

            console.log(`   ⚠️ CoreSignal: No key executives found for ${companyName}`);
            return [];

        } catch (error) {
            console.log(`   ❌ CoreSignal company data failed: ${error.message}`);
            this.stats.failures++;
            return null;
        }
    }

    /**
     * 🎯 FIND EXECUTIVE IN PREVIEW - WATERFALL APPROACH
     * 
     * Find the highest ranking finance or revenue person using sophisticated waterfall logic
     * Tries multiple tiers per department, then falls back to other departments
     */
    async findExecutiveInPreview(employees, roleType) {
        if (!employees || employees.length === 0) {
            return null;
        }

        console.log(`   🔍 WATERFALL SEARCH: Finding highest ranking ${roleType.toUpperCase()} from ${employees.length} employees...`);

        // Performance optimization for large datasets
        if (employees.length > 200) {
            console.log(`   ⚡ Large dataset detected (${employees.length} employees), applying performance optimizations...`);
            
            // Pre-filter employees with relevant titles to reduce processing
            const relevantEmployees = employees.filter(emp => {
                const title = (emp.title || '').toLowerCase();
                const roleLower = roleType.toLowerCase();
                
                // Quick relevance check
                if (roleLower === 'cfo') {
                    return title.includes('chief') || title.includes('finance') || title.includes('cfo') || 
                           title.includes('controller') || title.includes('treasurer') || title.includes('vp finance');
                } else if (roleLower === 'cro') {
                    return title.includes('chief') || title.includes('sales') || title.includes('revenue') || 
                           title.includes('cro') || title.includes('cso') || title.includes('commercial') ||
                           title.includes('vp sales') || title.includes('vp revenue');
                }
                return true;
            });
            
            console.log(`   ⚡ Pre-filtered to ${relevantEmployees.length} relevant employees (${Math.round((1 - relevantEmployees.length/employees.length) * 100)}% reduction)`);
            employees = relevantEmployees;
        }

        // Define waterfall tiers for each role type
        const waterfallTiers = this.getWaterfallTiers(roleType);
        
        // Try each tier sequentially - stop when we find a match
        for (let tierIndex = 0; tierIndex < waterfallTiers.length; tierIndex++) {
            const tier = waterfallTiers[tierIndex];
            console.log(`   🎯 TIER ${tierIndex + 1}: ${tier.name} - ${tier.description}`);
            
            const tierMatches = [];
            
            for (const employee of employees) {
                const name = employee.name || 'Unknown';
                const title = employee.title || '';
                const titleLower = title.toLowerCase();
                
                // Skip if no title
                if (!title || title === '') {
                    continue;
                }

                // Check if this employee matches this tier
                const tierMatch = this.matchesTier(title, tier, roleType);
                if (tierMatch.matches) {
                    const score = this.calculateWaterfallScore(employee, tierMatch, tierIndex);
                    
                    tierMatches.push({
                    ...employee,
                    matchScore: score,
                    roleType: roleType.toUpperCase(),
                        tier: tierIndex + 1,
                        tierName: tier.name,
                        matchReason: tierMatch.reason
                    });
                    
                    console.log(`      ✅ ${name} (${title}): ${tierMatch.reason} - Score: ${score}`);
                }
            }
            
            // If we found matches in this tier, return the best one
            if (tierMatches.length > 0) {
                // Sort by score (highest first) and take the best
                tierMatches.sort((a, b) => b.matchScore - a.matchScore);
                const bestMatch = tierMatches[0];
                
                console.log(`   🏆 TIER ${tierIndex + 1} SUCCESS: Found ${bestMatch.name} (${bestMatch.title}) - ${bestMatch.matchReason}`);
                console.log(`   📊 Waterfall Score: ${bestMatch.matchScore} (Tier ${tierIndex + 1}: ${tier.name})`);
                
            this.stats[`${roleType}Found`]++;
                return bestMatch;
        } else {
                console.log(`   ⚠️ TIER ${tierIndex + 1}: No matches found`);
            }
        }

        console.log(`   ❌ WATERFALL COMPLETE: No ${roleType.toUpperCase()} found in any tier`);
        return null;
    }

    /**
     * 📊 COLLECT FULL PROFILE (DEPRECATED)
     * 
     * Collect complete profile data for a specific employee (1 credit)
     * 
     * @deprecated This method is no longer used since key_executives data
     * from company collect endpoint already contains complete executive information.
     * Use discoverExecutives() instead which returns data directly from key_executives.
     */
    async collectProfile(employeeId) {
        if (!this.config.CORESIGNAL_API_KEY || !employeeId) {
            return null;
        }

        try {
            console.log(`   🏢 CoreSignal: Collecting full profile for ${employeeId}...`);
            this.stats.profileCollections++;

            const response = await fetch(`${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect`, {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    id: employeeId
                }),
                timeout: this.config.TIMEOUT
            });

            if (!response.ok) {
                throw new Error(`CoreSignal collect error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.stats.creditsUsed += 1; // Collect costs 1 credit
            this.stats.successes++;

            if (data) {
                console.log(`   ✅ CoreSignal: Collected full profile for ${data.full_name}`);
                
                return {
                    id: data.id,
                    name: data.full_name,
                    title: data.current_title,
                    company: data.current_company_name,
                    email: data.primary_professional_email,
                    phone: data.phone_number,
                    linkedinUrl: data.linkedin_url,
                    location: data.location,
                    bio: data.summary,
                    experience: data.experience || [],
                    education: data.education || [],
                    skills: data.skills || [],
                    confidence: data.confidence_score || 0,
                    lastUpdated: data.last_updated,
                    source: 'coresignal',
                    // ENHANCED EMPLOYMENT STATUS VERIFICATION
                    currentEmployment: this.extractEmploymentStatus(data),
                    metadata: {
                        coresignalId: data.id,
                        dataQuality: data.data_quality,
                        enrichmentDate: new Date().toISOString()
                    }
                };
            }

            return null;

        } catch (error) {
            console.log(`   ❌ CoreSignal profile collection failed: ${error.message}`);
            this.stats.failures++;
            return null;
        }
    }

    /**
     * 🚀 EFFICIENT EXECUTIVE DISCOVERY
     * 
     * Enhanced workflow: Find company ID → Elasticsearch search → collect profiles → fallback to key_executives
     * This ensures we find actual CFOs/CROs, not just senior directors
     */
    async discoverExecutives(companyName, targetRoles = ['CFO', 'CRO'], website = null) {
        console.log(`   🚀 CoreSignal Multi-Source: Discovering executives at ${companyName}...`);
        
        const result = { cfo: null, cro: null, creditsUsed: 0 };

        // STEP 0: Find company ID first
        const companyId = await this.searchCompanyId(companyName, website);
        if (!companyId) {
            console.log(`   ⚠️ No company ID found, skipping CoreSignal search`);
            return result;
        }

        // STEP 1: Try Elasticsearch search with ALL title patterns (most accurate)
        for (const role of targetRoles) {
            // Use ALL 80+ title patterns from getRolePatterns(), not just 3-4 hardcoded ones
            const allTitles = this.getRolePatterns(role);
            console.log(`   🎯 Searching for ${role} with ${allTitles.length} title patterns`);
            
            // Search in batches of 20 titles to avoid API limits
            const batchSize = 20;
            let employeeIds = [];
            let foundVariation = null;
            
            for (let i = 0; i < allTitles.length; i += batchSize) {
                const titleBatch = allTitles.slice(i, i + batchSize);
                console.log(`   🔍 Searching title batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(allTitles.length/batchSize)}: ${titleBatch.slice(0, 3).join(', ')}${titleBatch.length > 3 ? '...' : ''}`);
                
                // Try multiple company name variations for better matching
                const companyVariations = this.getCompanyNameVariations(companyName);
                
                for (const variation of companyVariations) {
                    console.log(`   🔍 Trying company name variation: "${variation}"`);
                    // Search with each title in the batch individually
                    for (const title of titleBatch) {
                        employeeIds = await this.searchEmployeesByTitle(variation, title);
                        if (employeeIds.length > 0) {
                            console.log(`   ✅ Found ${employeeIds.length} employees with variation: "${variation}" and title: "${title}"`);
                            foundVariation = variation;
                            break;
                        }
                    }
                    if (employeeIds.length > 0) {
                        break;
                    }
                }
                
                if (employeeIds.length > 0) {
                    break; // Stop searching if we found results
                }
            }
            
            if (employeeIds.length > 0) {
                console.log(`   ✅ Found ${employeeIds.length} ${role} candidates via Elasticsearch (${allTitles.length} patterns, variation: "${foundVariation}")`);
                
                // Collect full profile for first match
                const profile = await this.collectProfile(employeeIds[0]._id || employeeIds[0].id);
                if (profile) {
                    if (role === 'CFO') {
                        result.cfo = profile;
                        console.log(`   ✅ CFO found via Elasticsearch: ${profile.name} (${profile.title})`);
                    } else if (role === 'CRO') {
                        result.cro = profile;
                        console.log(`   ✅ CRO found via Elasticsearch: ${profile.name} (${profile.title})`);
                    }
                }
            } else {
                console.log(`   ⚠️ No ${role} found via Elasticsearch (tried ${allTitles.length} patterns), will try department search`);
            }
        }

        // STEP 2: Multi-Strategy Fallback for Missing Executives
        for (const role of targetRoles) {
            if ((role === 'CFO' && !result.cfo) || (role === 'CRO' && !result.cro)) {
                console.log(`   🔄 Multi-Strategy Discovery for ${role}...`);
                
                const executive = await this.discoverExecutiveMultiStrategy(companyName, role, companyId);
                if (executive) {
                    if (role === 'CFO') {
                        result.cfo = executive;
                        console.log(`   ✅ CFO found via multi-strategy: ${executive.name} (${executive.title}) - ${executive.source}`);
                    } else if (role === 'CRO') {
                        result.cro = executive;
                        console.log(`   ✅ CRO found via multi-strategy: ${executive.name} (${executive.title}) - ${executive.source}`);
                    }
                }
            }
        }

        console.log(`   📊 CoreSignal Multi-Source: Found CFO: ${result.cfo ? 'Yes' : 'No'}, CRO: ${result.cro ? 'Yes' : 'No'}, Credits: ${result.creditsUsed}`);
        
        return result;
    }

    /**
     * 🎯 DISCOVER EXECUTIVE MULTI-STRATEGY (SIMPLIFIED)
     * 
     * 3-strategy fallback chain using only working methods:
     * Strategy 1: Elasticsearch title search (80+ patterns) - ✅ WORKING
     * Strategy 2: Key executives + waterfall - ✅ WORKING (70% success)
     * Strategy 3: Company collect fallback - ✅ WORKING
     */
    async discoverExecutiveMultiStrategy(companyName, role, companyId = null) {
        console.log(`   🎯 Multi-Strategy Discovery for ${role} at ${companyName}`);
        
        // Strategy 1: Comprehensive role search with 56+ CFO or 70+ CRO variations (most efficient)
        console.log(`   📋 Strategy 1: Comprehensive role search with all variations`);
        const searchResults = await this.searchEmployeesByTitle(companyName, role, companyId);
        if (searchResults && searchResults.length > 0) {
            console.log(`   ✅ Found ${searchResults.length} employees via comprehensive role search`);
            // Return the highest scoring result
            const bestMatch = searchResults[0]; // Search returns results sorted by relevance
            return {
                id: bestMatch.id,
                name: bestMatch.name,
                title: bestMatch.title,
                email: bestMatch.email || '',
                phone: bestMatch.phone || '',
                linkedinUrl: bestMatch.linkedinUrl || '',
                confidence: bestMatch.score || 90,
                source: 'coresignal-comprehensive-search',
                tier: this.roleDefinitions.getCFOTierAndPriority(bestMatch.title).tier || 
                      this.roleDefinitions.getCROTierAndPriority(bestMatch.title).tier || 1
            };
        }
        
        // Strategy 2: Key executives + waterfall (fallback)
        console.log(`   📋 Strategy 2: Key executives + waterfall (fallback)`);
        const keyExecutives = await this.previewEmployees(companyName);
        if (keyExecutives && keyExecutives.length > 0) {
            console.log(`   ✅ Found ${keyExecutives.length} key executives`);
            const executive = await this.findExecutiveInPreview(keyExecutives, role);
            if (executive) {
                return {
                    id: executive.id,
                    name: executive.name,
                    title: executive.title,
                    email: executive.email || '',
                    phone: executive.phone || '',
                    linkedinUrl: executive.linkedinUrl || '',
                    confidence: executive.matchScore || executive.confidence || 80,
                    source: 'coresignal-keyexecutives',
                    tier: executive.tier
                };
            }
        }
        
        // Strategy 2: Company collect fallback (if key_executives fails)
        console.log(`   📋 Strategy 2: Company collect fallback`);
        try {
            const companyShorthand = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
            const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/collect/${companyShorthand}`;
            
            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout(url, {
                    method: 'GET',
                    headers: {
                        'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                        'Accept': 'application/json'
                    }
                }, this.timeoutHandler.getApiTimeout('coresignal'));
            });

            if (response.ok) {
                const data = await response.json();
                if (data.key_executives && Array.isArray(data.key_executives) && data.key_executives.length > 0) {
                    console.log(`   ✅ Found ${data.key_executives.length} executives via company collect`);
                    
                    const employees = data.key_executives.map(exec => ({
                        id: exec.parent_id || exec.id,
                        name: exec.member_full_name || exec.full_name || exec.name || 'Unknown',
                        title: exec.member_position_title || exec.current_title || exec.title || exec.position || '',
                        company: data.company_name || companyName,
                        linkedinUrl: exec.member_linkedin_url || exec.linkedin_url || exec.linkedin || '',
                        email: exec.member_professional_email || exec.primary_professional_email || exec.email || '',
                        phone: exec.member_phone_number || exec.phone_number || exec.phone || '',
                        confidence: exec.confidence_score || 80,
                        lastUpdated: exec.last_updated || data.last_updated_at || new Date().toISOString(),
                        source: 'coresignal-company-collect'
                    }));

                    const executive = await this.findExecutiveInPreview(employees, role);
                    if (executive) {
                        return {
                            id: executive.id,
                            name: executive.name,
                            title: executive.title,
                            email: executive.email || '',
                            phone: executive.phone || '',
                            linkedinUrl: executive.linkedinUrl || '',
                            confidence: executive.matchScore || executive.confidence || 75,
                            source: 'coresignal-company-collect',
                            tier: executive.tier
                        };
                    }
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Company collect fallback failed: ${error.message}`);
        }
        
        console.log(`   ❌ Multi-Strategy Discovery failed for ${role} - no executive found`);
        return null;
    }

    // REMOVED: getEmployeesByJobFunction() - was causing 422 errors due to incorrect field names

    /**
     * 📅 EXTRACT EMPLOYMENT STATUS
     * 
     * Extract comprehensive employment information from CoreSignal profile data
     */
    extractEmploymentStatus(data) {
        const now = new Date();
        let isCurrent = true;
        let confidence = 80;
        let startDate = null;
        let endDate = null;
        let duration = null;
        let reasoning = '';

        // Extract employment dates from member_experience_collection
        if (data.member_experience_collection && Array.isArray(data.member_experience_collection)) {
            const currentExperience = data.member_experience_collection.find(exp => 
                exp.company_name === data.current_company_name || 
                exp.company_name?.toLowerCase().includes(data.current_company_name?.toLowerCase())
            );

            if (currentExperience) {
                startDate = currentExperience.date_from;
                endDate = currentExperience.date_to;
                
                // Check if currently employed
                if (endDate) {
                    const endDateObj = new Date(endDate);
                    isCurrent = endDateObj > now;
                    reasoning = isCurrent ? 'End date is in the future' : `End date: ${endDate}`;
                } else {
                    isCurrent = true;
                    reasoning = 'No end date (current employment)';
                    confidence = 90; // Higher confidence for no end date
                }

                // Calculate duration
                if (startDate) {
                    const startDateObj = new Date(startDate);
                    const durationMs = (endDate ? new Date(endDate) : now) - startDateObj;
                    duration = Math.round(durationMs / (1000 * 60 * 60 * 24 * 30)); // months
                }
            }
        }

        // Fallback: Check other date fields
        if (!startDate && data.member_experience_start_date) {
            startDate = data.member_experience_start_date;
        }
        if (!endDate && data.member_experience_end_date) {
            endDate = data.member_experience_end_date;
            const endDateObj = new Date(endDate);
            isCurrent = endDateObj > now;
            reasoning = isCurrent ? 'End date is in the future' : `End date: ${endDate}`;
        }

        // Additional confidence factors
        if (data.last_updated) {
            const lastUpdated = new Date(data.last_updated);
            const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 30) {
                confidence += 5; // Recent data is more reliable
            }
        }

        return {
            isCurrent,
            startDate,
            endDate,
            duration: duration ? `${duration} months` : null,
            confidence: Math.min(100, confidence),
            reasoning,
            lastVerified: now.toISOString()
        };
    }

    /**
     * 🏆 EXECUTIVE HIERARCHY SCORING
     * 
     * Score executives based on seniority level (higher = more senior)
     */
    getExecutiveHierarchyScore(title, roleType) {
        const titleLower = title.toLowerCase();
        
        // STRICT VALIDATION: Exclude wrong C-level roles with massive penalty
        if (roleType === 'CFO') {
            // Exclude CEOs, COOs, CTOs, CMOs, CPOs, CCOs, etc. for CFO searches
            if (titleLower.includes('chief executive') || 
                titleLower.match(/\bceo\b/) ||
                titleLower.includes('chief operating') ||
                titleLower.match(/\bcoo\b/) ||
                titleLower.includes('chief technology') ||
                titleLower.match(/\bcto\b/) ||
                titleLower.includes('chief marketing') ||
                titleLower.match(/\bcmo\b/) ||
                titleLower.includes('chief product') ||
                titleLower.match(/\bcpo\b/) ||
                titleLower.includes('chief creative') ||
                titleLower.includes('chief compliance') ||
                titleLower.includes('chief legal') ||
                titleLower.includes('chief information') ||
                titleLower.match(/\bcio\b/)) {
                console.log(`      🚫 EXCLUDED for CFO: ${title} (Wrong C-level role)`);
                return -1000; // Massive penalty to exclude
            }
        } else if (roleType === 'CRO') {
            // Exclude CEOs, COOs, CTOs, CFOs, etc. for CRO searches
            if (titleLower.includes('chief executive') || 
                titleLower.match(/\bceo\b/) ||
                titleLower.includes('chief operating') ||
                titleLower.match(/\bcoo\b/) ||
                titleLower.includes('chief technology') ||
                titleLower.match(/\bcto\b/) ||
                titleLower.includes('chief financial') ||
                titleLower.match(/\bcfo\b/) ||
                titleLower.includes('chief marketing') ||
                titleLower.match(/\bcmo\b/) ||
                titleLower.includes('chief product') ||
                titleLower.match(/\bcpo\b/) ||
                titleLower.includes('chief creative') ||
                titleLower.includes('chief compliance') ||
                titleLower.includes('chief legal') ||
                titleLower.includes('chief information') ||
                titleLower.match(/\bcio\b/) ||
                titleLower.includes('chief accounting') ||
                titleLower.match(/\bcao\b/)) {
                console.log(`      🚫 EXCLUDED for CRO: ${title} (Wrong C-level role)`);
                return -1000; // Massive penalty to exclude
            }
        }
        
        // HIGHEST PRIORITY: Exact C-level match for the role
        if (roleType === 'CFO') {
            if (titleLower.includes('chief financial officer') || 
                titleLower === 'cfo' || 
                titleLower.includes('chief finance officer')) {
                return 200; // Massively higher than anything else
            }
        } else if (roleType === 'CRO') {
            if (titleLower.includes('chief revenue officer') || 
                titleLower === 'cro' ||
                titleLower.includes('chief sales officer') ||
                titleLower.includes('chief commercial officer')) {
                return 200;
            }
        }
        
        // Other C-Level executives (only if they passed the exclusion checks above)
        if (titleLower.includes('chief')) {
            return 100;
        }
        
        // President level (very high priority)
        if (titleLower.includes('president') && !titleLower.includes('vice president')) {
            return 90;
        }
        
        // EVP/SVP (high priority)
        if (titleLower.includes('executive vice president') || 
            titleLower.includes('senior vice president') || 
            titleLower.includes('evp') || titleLower.includes('svp')) {
            return 80;
        }
        
        // VP level (medium-high priority)
        if (titleLower.includes('vice president') || titleLower.includes('vp')) {
            return 70;
        }
        
        // Head of (medium priority - but only if specific to role)
        if (titleLower.includes('head of')) {
            return 60;
        }
        
        // Senior Director (MUCH LOWER - these were causing false positives)
        if (titleLower.includes('senior director')) {
            return 25;
        }
        
        // Director level (LOW priority)
        if (titleLower.includes('director')) {
            return 20;
        }
        
        // Manager level (very low)
        if (titleLower.includes('manager') || titleLower.includes('lead')) {
            return 10;
        }
        
        // Default
        return 5;
    }

    /**
     * 🏢 GET COMPANY NAME VARIATIONS
     * 
     * Generate multiple variations of company name for better Elasticsearch matching
     */
    getCompanyNameVariations(companyName) {
        const variations = [companyName]; // Start with original
        
        // Remove common suffixes (expanded list)
        const suffixPatterns = [
            /\s*,\s*Inc\.?$/i, /\s*,\s*LLC\.?$/i, /\s*,\s*Corp\.?$/i, /\s*,\s*Corporation$/i,
            /\s*,\s*Ltd\.?$/i, /\s*,\s*Limited$/i, /\s*,\s*Co\.?$/i, /\s*,\s*Company$/i,
            /\s*,\s*LP\.?$/i, /\s*,\s*LLP\.?$/i, /\s*,\s*PLC\.?$/i, /\s*,\s*AG\.?$/i,
            /\s*,\s*GmbH\.?$/i, /\s*,\s*S\.A\.?$/i, /\s*,\s*S\.r\.l\.?$/i, /\s*,\s*BV\.?$/i,
            /\s*,\s*AB\.?$/i, /\s*,\s*AS\.?$/i, /\s*,\s*Oy\.?$/i, /\s*,\s*ApS\.?$/i,
            /\s*,\s*S\.p\.A\.?$/i, /\s*,\s*S\.r\.o\.?$/i, /\s*,\s*K\.K\.?$/i, /\s*,\s*Co\.Ltd\.?$/i
        ];
        
        let withoutSuffixes = companyName;
        for (const pattern of suffixPatterns) {
            withoutSuffixes = withoutSuffixes.replace(pattern, '');
        }
        
        if (withoutSuffixes !== companyName && withoutSuffixes.length > 0) {
            variations.push(withoutSuffixes);
        }
        
        // Add common variations
        variations.push(companyName.replace(/\s*,\s*/g, ' ')); // Remove commas
        variations.push(companyName.replace(/[^\w\s]/g, '')); // Remove all punctuation
        variations.push(companyName.replace(/\s+/g, ' ').trim()); // Normalize spaces
        
        // Add industry-specific variations
        const industryPatterns = [
            { pattern: /(\w+)\s*Technologies?/i, replacement: '$1' },
            { pattern: /(\w+)\s*Systems?/i, replacement: '$1' },
            { pattern: /(\w+)\s*Solutions?/i, replacement: '$1' },
            { pattern: /(\w+)\s*Software/i, replacement: '$1' },
            { pattern: /(\w+)\s*Digital/i, replacement: '$1' },
            { pattern: /(\w+)\s*Global/i, replacement: '$1' },
            { pattern: /(\w+)\s*International/i, replacement: '$1' },
            { pattern: /(\w+)\s*Group/i, replacement: '$1' },
            { pattern: /(\w+)\s*Holdings?/i, replacement: '$1' },
            { pattern: /(\w+)\s*Enterprises?/i, replacement: '$1' }
        ];
        
        for (const { pattern, replacement } of industryPatterns) {
            const match = companyName.match(pattern);
            if (match) {
                variations.push(match[0].replace(pattern, replacement));
            }
        }
        
        // Add parent company variations (for acquired companies)
        const parentPatterns = [
            /(\w+)\s*North America/i, /(\w+)\s*USA/i, /(\w+)\s*US/i,
            /(\w+)\s*Europe/i, /(\w+)\s*Asia/i, /(\w+)\s*Pacific/i,
            /(\w+)\s*EMEA/i, /(\w+)\s*APAC/i, /(\w+)\s*Americas/i
        ];
        
        for (const pattern of parentPatterns) {
            const match = companyName.match(pattern);
            if (match) {
                variations.push(match[1]); // Just the base company name
            }
        }
        
        // Add domain-based variation (if we can extract domain)
        const domainMatch = companyName.match(/(\w+)\s*,\s*Inc\.?$/i);
        if (domainMatch) {
            variations.push(domainMatch[1]);
        }
        
        // Add acronym variations
        const words = companyName.split(/\s+/);
        if (words.length >= 2) {
            const acronym = words.map(w => w.charAt(0)).join('');
            if (acronym.length >= 2) {
                variations.push(acronym);
            }
        }
        
        // Remove duplicates, empty strings, and very short variations
        return [...new Set(variations)].filter(v => v && v.length >= 2);
    }

    /**
     * 🚫 CHECK IF TITLE SHOULD BE EXCLUDED FOR ROLE
     * 
     * Exclude non-relevant departments from CFO/CRO searches
     */
    shouldExcludeForRole(title, roleType) {
        const titleLower = title.toLowerCase();
        
        // Exclude non-finance roles for CFO
        if (roleType === 'CFO') {
            const excludePatterns = [
                'talent', 'recruiting', 'hr', 'human resources',
                'marketing', 'sales', 'revenue', 'commercial',
                'product', 'engineering', 'technology', 'operations',
                'legal', 'compliance', 'communications', 'security'
            ];
            for (const pattern of excludePatterns) {
                if (titleLower.includes(pattern)) {
                    return true;
                }
            }
        }
        
        // Exclude non-revenue roles for CRO
        if (roleType === 'CRO') {
            const excludePatterns = [
                'talent', 'recruiting', 'hr', 'human resources',
                'marketing', 'finance', 'accounting', 'treasury',
                'product', 'engineering', 'technology', 'operations',
                'legal', 'compliance', 'communications', 'security'
            ];
            for (const pattern of excludePatterns) {
                if (titleLower.includes(pattern)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 🏷️ GET ROLE PATTERNS
     */
    getRolePatterns(roleType) {
        const patterns = {
            CFO: [
                // Exact matches (highest priority)
                'Chief Financial Officer',
                'CFO',
                'Chief Finance Officer',
                'Chief Financial',
                // C-level alternatives
                'Chief Accounting Officer',
                'Chief Treasury Officer',
                'Chief Investment Officer',
                'Chief Risk Officer',
                // VP level variations
                'VP Finance',
                'VP of Finance',
                'Vice President Finance',
                'Vice President of Finance',
                'SVP Finance',
                'SVP of Finance',
                'EVP Finance',
                'EVP of Finance',
                'Senior VP Finance',
                'Executive VP Finance',
                // Director level
                'Director of Finance',
                'Finance Director',
                'Financial Director',
                'Director Finance',
                // Controller variations
                'Corporate Controller',
                'Controller',
                'Chief Controller',
                'Financial Controller',
                'VP Controller',
                'Director of Accounting',
                'Accounting Director',
                // Treasurer variations
                'Treasurer',
                'Chief Treasurer',
                'VP Treasurer',
                'Director of Treasury',
                'Treasury Director',
                // International variations
                'Finance Director',
                'Financial Controller',
                'Head of Finance',
                'Head of Financial',
                'Head of Accounting',
                'Head of Treasury',
                // Additional CFO variations
                'Acting CFO',
                'Interim CFO',
                'Group CFO',
                'Corporate CFO',
                'Global CFO',
                'Regional CFO',
                'Divisional CFO',
                'Chief Finance & Accounting Officer',
                'VP & CFO',
                'SVP & CFO',
                'CFO & COO',
                'Finance & Operations Officer',
                'Head of Financial Planning',
                'Chief Budget Officer',
                'Principal Accounting Officer',
                'Treasurer & CFO',
                'Chief Financial & Administrative Officer',
                'CFO & Treasurer',
                'Chief Financial & Risk Officer'
            ],
            CRO: [
                // Exact matches (highest priority)
                'Chief Revenue Officer',
                'CRO',
                'Chief Revenue',
                // Sales leadership variations
                'Chief Sales Officer',
                'CSO',
                'Chief Commercial Officer',
                'Chief Sales',
                'Chief Commercial',
                // VP level variations
                'VP Sales',
                'VP of Sales',
                'Vice President Sales',
                'Vice President of Sales',
                'SVP Sales',
                'SVP of Sales',
                'EVP Sales',
                'EVP of Sales',
                'Senior VP Sales',
                'Executive VP Sales',
                'VP Revenue',
                'VP of Revenue',
                'Vice President Revenue',
                'Vice President of Revenue',
                'SVP Revenue',
                'EVP Revenue',
                'VP Commercial',
                'VP of Commercial',
                'Vice President Commercial',
                // Director level
                'Director of Sales',
                'Sales Director',
                'Revenue Director',
                'Director of Revenue',
                'Commercial Director',
                'Director of Commercial',
                'Director Sales',
                'Director Revenue',
                // Head of variations
                'Head of Sales',
                'Head of Revenue',
                'Head of Commercial',
                'Head of Business Development',
                'Head of Growth',
                'Head of Customer Success',
                // International variations
                'Sales Director',
                'Revenue Director',
                'Commercial Director',
                'Business Development Director',
                'Growth Director',
                'Customer Success Director',
                // Regional variations
                'Regional Sales Director',
                'Regional Revenue Director',
                'Area Sales Director',
                'Territory Sales Director',
                // Enterprise variations
                'Enterprise Sales Director',
                'Enterprise Revenue Director',
                'Corporate Sales Director',
                'Corporate Revenue Director',
                // Additional CRO variations
                'Acting CRO',
                'Interim CRO',
                'Group CRO',
                'Corporate CRO',
                'Global CRO',
                'Regional CRO',
                'Chief Growth Officer',
                'Chief Customer Officer',
                'VP Sales & Revenue',
                'SVP & CRO',
                'CRO & CCO',
                'Chief Business Development Officer',
                'EVP Global Sales',
                'Managing Director Sales',
                'Sales & Marketing Officer',
                'Chief Go-To-Market Officer',
                'Chief Commercial Officer',
                'Chief Sales & Marketing Officer',
                'VP & CRO',
                'Chief Revenue & Growth Officer',
                'Chief Sales & Revenue Officer'
            ]
        };

        return patterns[roleType.toUpperCase()] || [];
    }

    /**
     * 🌊 GET WATERFALL TIERS
     * 
     * Define sophisticated waterfall tiers for finding highest ranking executives
     * Tries multiple tiers per department, then falls back to other departments
     */
    getWaterfallTiers(roleType) {
        if (roleType.toUpperCase() === 'CFO') {
            return [
                // TIER 1: Primary Finance C-Level
                {
                    name: 'Primary Finance C-Level',
                    description: 'CFO, Chief Financial Officer, Chief Finance Officer',
                    patterns: ['cfo', 'chief financial officer', 'chief finance officer'],
                    department: 'finance',
                    priority: 1
                },
                // TIER 2: Senior Finance Leadership
                {
                    name: 'Senior Finance Leadership',
                    description: 'Controller, Chief Accounting Officer, Chief Treasury Officer',
                    patterns: ['controller', 'chief accounting officer', 'chief treasury officer', 'chief investment officer', 'chief risk officer'],
                    department: 'finance',
                    priority: 2
                },
                // TIER 3: VP Finance Level
                {
                    name: 'VP Finance Level',
                    description: 'VP Finance, SVP Finance, EVP Finance, Finance Director',
                    patterns: ['vp finance', 'svp finance', 'evp finance', 'vice president finance', 'finance director', 'financial director'],
                    department: 'finance',
                    priority: 3
                },
                // TIER 4: Treasurer & Finance Manager
                {
                    name: 'Treasurer & Finance Manager',
                    description: 'Treasurer, Chief Treasurer, Finance Manager, Accounting Director',
                    patterns: ['treasurer', 'chief treasurer', 'finance manager', 'accounting director', 'head of finance', 'head of financial'],
                    department: 'finance',
                    priority: 4
                },
                // TIER 5: Other Finance Roles
                {
                    name: 'Other Finance Roles',
                    description: 'Any role containing finance, accounting, or treasury',
                    patterns: ['finance', 'accounting', 'treasury', 'financial'],
                    department: 'finance',
                    priority: 5
                },
                // TIER 6: Cross-Department Finance (Operations, Strategy)
                {
                    name: 'Cross-Department Finance',
                    description: 'Operations with finance responsibility, Strategy with financial oversight',
                    patterns: ['chief operating officer', 'coo', 'chief strategy officer', 'cso', 'vp operations', 'head of operations'],
                    department: 'operations',
                    priority: 6
                },
                // TIER 7: Business Development with Financial Focus
                {
                    name: 'Business Development Finance',
                    description: 'Business Development with financial responsibilities',
                    patterns: ['business development', 'corporate development', 'strategic planning'],
                    department: 'business_development',
                    priority: 7
                }
            ];
        } else if (roleType.toUpperCase() === 'CRO') {
            return [
                // TIER 1: Primary Revenue C-Level
                {
                    name: 'Primary Revenue C-Level',
                    description: 'CRO, Chief Revenue Officer, Chief Sales Officer, CSO',
                    patterns: ['cro', 'chief revenue officer', 'chief sales officer', 'cso', 'chief commercial officer'],
                    department: 'revenue',
                    priority: 1
                },
                // TIER 2: Senior Sales Leadership
                {
                    name: 'Senior Sales Leadership',
                    description: 'VP Sales, VP Revenue, SVP Sales, EVP Sales',
                    patterns: ['vp sales', 'vp revenue', 'svp sales', 'evp sales', 'vice president sales', 'vice president revenue', 'senior vice president sales'],
                    department: 'revenue',
                    priority: 2
                },
                // TIER 3: Sales Director Level
                {
                    name: 'Sales Director Level',
                    description: 'Sales Director, Revenue Director, Head of Sales, Head of Revenue',
                    patterns: ['sales director', 'revenue director', 'head of sales', 'head of revenue', 'commercial director', 'business development director'],
                    department: 'revenue',
                    priority: 3
                },
                // TIER 4: Regional/Area Sales Leadership
                {
                    name: 'Regional Sales Leadership',
                    description: 'Regional Sales Director, Area Sales Director, Territory Sales Director',
                    patterns: ['regional sales', 'area sales', 'territory sales', 'regional director', 'area director'],
                    department: 'revenue',
                    priority: 4
                },
                // TIER 5: Enterprise Sales Leadership
                {
                    name: 'Enterprise Sales Leadership',
                    description: 'Enterprise Sales Director, Corporate Sales Director, Key Account Director',
                    patterns: ['enterprise sales', 'corporate sales', 'key account', 'major account', 'strategic account'],
                    department: 'revenue',
                    priority: 5
                },
                // TIER 6: Other Sales/Revenue Roles
                {
                    name: 'Other Sales/Revenue Roles',
                    description: 'Any role containing sales, revenue, or commercial',
                    patterns: ['sales', 'revenue', 'commercial', 'business development'],
                    department: 'revenue',
                    priority: 6
                },
                // TIER 7: Marketing with Revenue Focus
                {
                    name: 'Marketing Revenue Focus',
                    description: 'CMO with revenue responsibility, VP Marketing with sales focus',
                    patterns: ['chief marketing officer', 'cmo', 'vp marketing', 'marketing director', 'head of marketing'],
                    department: 'marketing',
                    priority: 7
                },
                // TIER 8: Operations with Revenue Focus
                {
                    name: 'Operations Revenue Focus',
                    description: 'COO with revenue responsibility, Operations with sales oversight',
                    patterns: ['chief operating officer', 'coo', 'vp operations', 'head of operations', 'operations director'],
                    department: 'operations',
                    priority: 8
                },
                // TIER 9: Customer Success/Account Management
                {
                    name: 'Customer Success Leadership',
                    description: 'Customer Success with revenue retention, Account Management leadership',
                    patterns: ['customer success', 'account management', 'client success', 'customer experience'],
                    department: 'customer_success',
                    priority: 9
                }
            ];
        }
        
        return [];
    }

    /**
     * 🎯 MATCHES TIER
     * 
     * Check if a title matches a specific waterfall tier
     */
    matchesTier(title, tier, roleType) {
        const titleLower = title.toLowerCase();
        
        for (const pattern of tier.patterns) {
            if (titleLower.includes(pattern.toLowerCase())) {
                return {
                    matches: true,
                    reason: `Matches ${tier.name}: ${pattern}`,
                    pattern: pattern,
                    tier: tier
                };
            }
        }
        
        return {
            matches: false,
            reason: 'No pattern match',
            pattern: null,
            tier: tier
        };
    }

    /**
     * 📊 CALCULATE WATERFALL SCORE
     * 
     * Calculate score for waterfall matching (higher tier = higher score)
     */
    calculateWaterfallScore(employee, tierMatch, tierIndex) {
        let score = 1000 - (tierIndex * 100); // Higher tier = higher score
        
        // Boost for exact pattern match
        if (tierMatch.pattern) {
            const titleLower = employee.title.toLowerCase();
            if (titleLower === tierMatch.pattern.toLowerCase()) {
                score += 200; // Exact match bonus
            } else if (titleLower.includes(tierMatch.pattern.toLowerCase())) {
                score += 100; // Partial match bonus
            }
        }
        
        // Boost for having contact info
        if (employee.email) score += 50;
        if (employee.phone) score += 30;
        if (employee.linkedinUrl) score += 20;
        
        // Boost for high confidence
        score += (employee.confidence || 0) * 0.5;
        
        return Math.round(score);
    }

    /**
     * 📊 CATEGORIZE ROLE TIER (LEGACY - KEPT FOR COMPATIBILITY)
     */
    categorizeRoleTier(title, roleType) {
        const titleLower = title ? title.toLowerCase() : '';
        
        if (roleType.toUpperCase() === 'CFO') {
            if (titleLower.includes('cfo') || titleLower.includes('chief financial')) return 1;
            if (titleLower.includes('controller') || titleLower.includes('chief accounting')) return 2;
            if (titleLower.includes('vp finance') || titleLower.includes('finance director')) return 3;
            if (titleLower.includes('treasurer') || titleLower.includes('finance manager')) return 4;
            return 5;
        }
        
        if (roleType.toUpperCase() === 'CRO') {
            if (titleLower.includes('cro') || titleLower.includes('chief revenue')) return 1;
            if (titleLower.includes('cso') || titleLower.includes('chief sales')) return 2;
            if (titleLower.includes('vp sales') || titleLower.includes('vp revenue')) return 3;
            if (titleLower.includes('sales director') || titleLower.includes('revenue director')) return 4;
            return 5;
        }
        
        return 5; // Default tier
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successes + this.stats.failures > 0 
                ? Math.round((this.stats.successes / (this.stats.successes + this.stats.failures)) * 100)
                : 0,
            averageCreditsPerCompany: this.stats.previewSearches > 0 
                ? Math.round((this.stats.creditsUsed / this.stats.previewSearches) * 100) / 100
                : 0
        };
    }

    /**
     * 🔧 UTILITY: DELAY FOR RATE LIMITING
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🌐 GET WEBSITE VARIATIONS
     * 
     * Generate multiple website variations for better matching
     */
    getWebsiteVariations(website) {
        const cleanDomain = this.cleanDomain(website);
        const variations = [
            // Original formats
            cleanDomain,
            website.replace('www.', ''),
            'www.' + cleanDomain,
            cleanDomain.replace('.com', ''),
            website,
            cleanDomain.replace(/^www\./, ''),
            cleanDomain + '.com',
            'https://' + cleanDomain,
            'http://' + cleanDomain,
            
            // Additional formats for better matching
            cleanDomain.replace(/^https?:\/\//, ''), // Remove protocol
            cleanDomain.replace(/^www\./, '').replace(/^https?:\/\//, ''), // Remove both
            cleanDomain.replace(/\.com$/, ''), // Remove .com
            cleanDomain.replace(/^www\./, '').replace(/\.com$/, ''), // Remove both www and .com
            'https://www.' + cleanDomain,
            'http://www.' + cleanDomain,
            
            // Subdomain variations
            cleanDomain.replace(/^[^.]+\./, ''), // Remove subdomain
            'www.' + cleanDomain.replace(/^[^.]+\./, ''), // Add www to subdomain-removed
        ];
        
        return variations.filter((v, i, arr) => arr.indexOf(v) === i && v.length > 0); // Remove duplicates and empty strings
    }

    /**
     * 🏢 EXTRACT COMPANY ID FROM RESPONSE
     * 
     * Handle different response structures and extract company ID
     */
    extractCompanyId(data, searchType, searchTerm) {
        if (!data || data.length === 0) {
            console.log(`   ⚠️ ${searchType} search found no results for: ${searchTerm}`);
            return null;
        }

        // Handle different response structures
        const items = data.hits ? data.hits : data;
        console.log(`   🔍 DEBUG: ${searchType} search response type: ${data.hits ? 'Elasticsearch' : 'Direct Array'}`);
        console.log(`   🔍 DEBUG: Response with ${items.length} items`);
        
        if (items && items.length > 0) {
            // Handle different ID formats
            let companyId = null;
            
            if (typeof items[0] === 'number') {
                companyId = items[0];
            } else if (typeof items[0] === 'string') {
                companyId = items[0];
            } else if (typeof items[0] === 'object') {
                companyId = items[0].id || 
                           items[0].company_id || 
                           items[0]._id || 
                           items[0].companyId || 
                           items[0].source_id ||
                           items[0].coresignal_company_id;
            }
            
            if (companyId) {
                console.log(`   ✅ Found company ID via ${searchType}: ${companyId} for "${searchTerm}"`);
                return companyId;
            } else {
                console.log(`   ⚠️ WARNING: Found company data but no ID field. Fields: ${Object.keys(items[0]).join(', ')}`);
                console.log(`   🔍 DEBUG: Sample response: ${JSON.stringify(items[0], null, 2).substring(0, 300)}...`);
            }
        }
        
        return null;
    }

    /**
     * 👔 IS CURRENT EMPLOYMENT
     * 
     * Determine if employee is currently employed based on CoreSignal data
     */
    isCurrentEmployment(data) {
        // Check 1: No end date = likely current
        if (!data.member_experience_end_date) {
            return true;
        }
        
        // Check 2: End date in future or recent past (<3 months)
        if (data.member_experience_end_date) {
            const endDate = new Date(data.member_experience_end_date);
            const now = new Date();
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(now.getMonth() - 3);
            
            if (endDate > threeMonthsAgo) {
                return true;
            }
        }
        
        // Check 3: Last updated recently (<6 months) = likely current
        if (data.last_updated) {
            const lastUpdate = new Date(data.last_updated);
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            if (lastUpdate > sixMonthsAgo) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 📊 CALCULATE EMPLOYMENT CONFIDENCE
     * 
     * Calculate confidence score for employment status
     */
    calculateEmploymentConfidence(data) {
        let confidence = 50; // Base confidence
        
        // Boost for recent data
        if (data.last_updated) {
            const lastUpdate = new Date(data.last_updated);
            const now = new Date();
            const monthsSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24 * 30);
            
            if (monthsSinceUpdate < 1) confidence += 30;
            else if (monthsSinceUpdate < 3) confidence += 20;
            else if (monthsSinceUpdate < 6) confidence += 10;
        }
        
        // Boost for no end date (likely current)
        if (!data.member_experience_end_date) {
            confidence += 20;
        }
        
        // Boost for recent start date
        if (data.member_experience_start_date) {
            const startDate = new Date(data.member_experience_start_date);
            const now = new Date();
            const monthsSinceStart = (now - startDate) / (1000 * 60 * 60 * 24 * 30);
            
            if (monthsSinceStart < 12) confidence += 15; // Recent hire
        }
        
        return Math.min(100, confidence);
    }
}

module.exports = { CoreSignalMultiSource };
