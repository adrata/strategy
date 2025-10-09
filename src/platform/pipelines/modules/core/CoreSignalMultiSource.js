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

const fetch = require('node-fetch');

class CoreSignalMultiSource {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: config.CORESIGNAL_BASE_URL || 'https://api.coresignal.com',
            TIMEOUT: config.TIMEOUT || 30000,
            MAX_RETRIES: config.MAX_RETRIES || 2,
            PREVIEW_LIMIT: config.PREVIEW_LIMIT || 100,
            ...config
        };
        
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
     * 🔍 PREVIEW EMPLOYEES AT COMPANY
     * 
     * Search for employees with basic info (1 credit for 100 employees)
     */
    async previewEmployees(companyName, limit = 100) {
        if (!this.config.CORESIGNAL_API_KEY) {
            console.log('   ⚠️ CoreSignal API key not configured');
            return null;
        }

        try {
            console.log(`   🏢 CoreSignal: Previewing employees at ${companyName}...`);
            this.stats.previewSearches++;

            const searchQuery = {
                query: {
                    bool: {
                        must: [
                            {
                                nested: {
                                    path: 'experience',
                                    query: {
                                        bool: {
                                            must: [
                                                { term: { 'experience.active_experience': 1 } },
                                                {
                                                    bool: {
                                                        should: [
                                                            { match: { 'experience.company_name': companyName } },
                                                            { match_phrase: { 'experience.company_name': companyName } }
                                                        ]
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            };

            const response = await fetch(`${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=${limit}`, {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY.trim(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(searchQuery),
                timeout: this.config.TIMEOUT
            });

            if (!response.ok) {
                throw new Error(`CoreSignal preview error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.stats.creditsUsed += 1; // Preview costs 1 credit
            this.stats.successes++;

            if (data && data.length > 0) {
                console.log(`   ✅ CoreSignal: Found ${data.length} employees in preview`);
                
                // Extract basic info from preview
                const employees = data.map(emp => ({
                    id: emp.id,
                    name: emp.full_name,
                    title: emp.current_title,
                    company: emp.current_company_name,
                    linkedinUrl: emp.linkedin_url,
                    email: emp.primary_professional_email,
                    phone: emp.phone_number,
                    confidence: emp.confidence_score || 0,
                    lastUpdated: emp.last_updated
                }));

                return employees;
            }

            console.log(`   ⚠️ CoreSignal: No employees found for ${companyName}`);
            return [];

        } catch (error) {
            console.log(`   ❌ CoreSignal preview failed: ${error.message}`);
            this.stats.failures++;
            return null;
        }
    }

    /**
     * 🎯 FIND EXECUTIVE IN PREVIEW
     * 
     * Filter CFO/CRO candidates from preview results (free operation)
     */
    async findExecutiveInPreview(employees, roleType) {
        if (!employees || employees.length === 0) {
            return null;
        }

        console.log(`   🔍 Filtering ${roleType.toUpperCase()} from ${employees.length} employees...`);

        const rolePatterns = this.getRolePatterns(roleType);
        let bestMatch = null;
        let highestScore = 0;

        for (const employee of employees) {
            const title = employee.title ? employee.title.toLowerCase() : '';
            let score = 0;

            // Score based on title patterns
            for (const pattern of rolePatterns) {
                if (title.includes(pattern.toLowerCase())) {
                    score += pattern === roleType.toUpperCase() ? 100 : 80; // Exact match gets higher score
                    break;
                }
            }

            // Boost score for high confidence
            score += (employee.confidence || 0) * 0.1;

            // Boost score for having contact info
            if (employee.email) score += 10;
            if (employee.phone) score += 10;
            if (employee.linkedinUrl) score += 5;

            console.log(`      🔍 ${employee.name} (${employee.title}): Score ${score}`);

            if (score > highestScore && score > 50) { // Minimum threshold
                highestScore = score;
                bestMatch = {
                    ...employee,
                    matchScore: score,
                    roleType: roleType.toUpperCase(),
                    tier: this.categorizeRoleTier(employee.title, roleType)
                };
            }
        }

        if (bestMatch) {
            console.log(`   ✅ Found ${roleType.toUpperCase()}: ${bestMatch.name} (${bestMatch.title}) - Score: ${bestMatch.matchScore}`);
            this.stats[`${roleType}Found`]++;
        } else {
            console.log(`   ⚠️ No ${roleType.toUpperCase()} found in preview`);
        }

        return bestMatch;
    }

    /**
     * 📊 COLLECT FULL PROFILE
     * 
     * Collect complete profile data for a specific employee (1 credit)
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
     * Complete workflow: preview → filter → collect
     */
    async discoverExecutives(companyName, targetRoles = ['CFO', 'CRO']) {
        console.log(`   🚀 CoreSignal Multi-Source: Discovering executives at ${companyName}...`);
        
        // Step 1: Preview employees
        const employees = await this.previewEmployees(companyName);
        if (!employees || employees.length === 0) {
            return { cfo: null, cro: null, creditsUsed: 1 };
        }

        const result = { cfo: null, cro: null, creditsUsed: 1 }; // Preview cost

        // Step 2: Find and collect CFO
        if (targetRoles.includes('CFO')) {
            const cfoCandidate = await this.findExecutiveInPreview(employees, 'CFO');
            if (cfoCandidate) {
                const cfoProfile = await this.collectProfile(cfoCandidate.id);
                if (cfoProfile) {
                    result.cfo = cfoProfile;
                    result.creditsUsed += 1; // Collect cost
                }
            }
        }

        // Step 3: Find and collect CRO
        if (targetRoles.includes('CRO')) {
            const croCandidate = await this.findExecutiveInPreview(employees, 'CRO');
            if (croCandidate) {
                const croProfile = await this.collectProfile(croCandidate.id);
                if (croProfile) {
                    result.cro = croProfile;
                    result.creditsUsed += 1; // Collect cost
                }
            }
        }

        console.log(`   📊 CoreSignal Multi-Source: Found CFO: ${result.cfo ? 'Yes' : 'No'}, CRO: ${result.cro ? 'Yes' : 'No'}, Credits: ${result.creditsUsed}`);
        
        return result;
    }

    /**
     * 🏷️ GET ROLE PATTERNS
     */
    getRolePatterns(roleType) {
        const patterns = {
            CFO: [
                'CFO', 'Chief Financial Officer', 'Chief Finance Officer',
                'VP Finance', 'Vice President Finance', 'VP of Finance',
                'Finance Director', 'Head of Finance', 'Director of Finance',
                'Controller', 'Chief Controller', 'Corporate Controller',
                'Treasurer', 'Chief Treasurer'
            ],
            CRO: [
                'CRO', 'Chief Revenue Officer', 'Chief Revenue',
                'CSO', 'Chief Sales Officer', 'Chief Sales',
                'VP Sales', 'Vice President Sales', 'VP of Sales',
                'VP Revenue', 'Vice President Revenue', 'VP of Revenue',
                'Sales Director', 'Head of Sales', 'Director of Sales',
                'Revenue Director', 'Head of Revenue', 'Director of Revenue'
            ]
        };

        return patterns[roleType.toUpperCase()] || [];
    }

    /**
     * 📊 CATEGORIZE ROLE TIER
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
}

module.exports = { CoreSignalMultiSource };
