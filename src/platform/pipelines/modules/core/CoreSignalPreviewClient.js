#!/usr/bin/env node

/**
 * 🔍 CORESIGNAL PREVIEW API CLIENT
 * 
 * Specialized client for CoreSignal Preview API endpoints:
 * - Employee Preview: /employee_multi_source/search/es_dsl/preview
 * - Company Preview: /company_multi_source/search/es_dsl/preview
 * 
 * Optimized for buyer group discovery with proper field mapping
 */

const fetch = require('node-fetch');

class CoreSignalPreviewClient {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            CORESIGNAL_BASE_URL: config.CORESIGNAL_BASE_URL || 'https://api.coresignal.com',
            TIMEOUT: config.TIMEOUT || 20000,
            MAX_RETRIES: config.MAX_RETRIES || 2,
            RATE_LIMIT_DELAY: config.RATE_LIMIT_DELAY || 200,
            ...config
        };
        
        this.stats = {
            employeePreviewSearches: 0,
            companyPreviewSearches: 0,
            creditsUsed: 0,
            successes: 0,
            failures: 0
        };
    }

    /**
     * 👥 EMPLOYEE PREVIEW SEARCH
     * 
     * Search for employees using Preview API
     * Returns limited fields optimized for buyer group discovery
     */
    async searchEmployeePreview(query, options = {}) {
        if (!this.config.CORESIGNAL_API_KEY) {
            throw new Error('CoreSignal API key not configured');
        }

        try {
            console.log(`   🔍 CoreSignal Preview: Employee search...`);
            this.stats.employeePreviewSearches++;

            const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl/preview`;
            
            // Add pagination if specified
            const searchUrl = options.page ? `${url}?page=${options.page}` : url;

            const response = await fetch(searchUrl, {
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
                console.log(`   ❌ Employee preview failed: ${response.status} ${response.statusText}`);
                this.stats.failures++;
                throw new Error(`Preview search failed: ${response.status}`);
            }

            const data = await response.json();
            this.stats.creditsUsed += 1; // Preview search costs 1 credit
            this.stats.successes++;

            // Preview API returns array of employee objects with limited fields
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   ✅ Employee preview: Found ${data.length} employees`);
                return data.map(emp => this.mapEmployeePreviewFields(emp));
            } else {
                console.log(`   ⚠️ Employee preview: No employees found`);
                return [];
            }

        } catch (error) {
            console.log(`   ❌ Employee preview error: ${error.message}`);
            this.stats.failures++;
            throw error;
        }
    }

    /**
     * 🏢 COMPANY PREVIEW SEARCH
     * 
     * Search for companies using Preview API
     * Returns limited fields optimized for company discovery
     */
    async searchCompanyPreview(query, options = {}) {
        if (!this.config.CORESIGNAL_API_KEY) {
            throw new Error('CoreSignal API key not configured');
        }

        try {
            console.log(`   🔍 CoreSignal Preview: Company search...`);
            this.stats.companyPreviewSearches++;

            const url = `${this.config.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/search/es_dsl/preview`;
            
            // Add pagination if specified
            const searchUrl = options.page ? `${url}?page=${options.page}` : url;

            const response = await fetch(searchUrl, {
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
                console.log(`   ❌ Company preview failed: ${response.status} ${response.statusText}`);
                this.stats.failures++;
                throw new Error(`Company preview search failed: ${response.status}`);
            }

            const data = await response.json();
            this.stats.creditsUsed += 1; // Preview search costs 1 credit
            this.stats.successes++;

            // Preview API returns array of company objects with limited fields
            if (Array.isArray(data) && data.length > 0) {
                console.log(`   ✅ Company preview: Found ${data.length} companies`);
                return data.map(comp => this.mapCompanyPreviewFields(comp));
            } else {
                console.log(`   ⚠️ Company preview: No companies found`);
                return [];
            }

        } catch (error) {
            console.log(`   ❌ Company preview error: ${error.message}`);
            this.stats.failures++;
            throw error;
        }
    }

    /**
     * 🎯 BUYER GROUP EMPLOYEE SEARCH
     * 
     * Specialized search for buyer group discovery
     * Uses broad criteria to find all potential buyer group members
     */
    async searchBuyerGroupEmployees(companyName, options = {}) {
        const query = {
            query: {
                bool: {
                    should: [
                        // C-level executives
                        { match: { "active_experience_management_level": "C-Level" }},
                        
                        // VP and Director level
                        { match: { "active_experience_management_level": "VP-Level" }},
                        { match: { "active_experience_management_level": "Director" }},
                        
                        // Key departments for buyer groups
                        { match: { "active_experience_department": "Finance" }},
                        { match: { "active_experience_department": "Sales" }},
                        { match: { "active_experience_department": "Operations" }},
                        { match: { "active_experience_department": "Product" }},
                        { match: { "active_experience_department": "Engineering" }},
                        { match: { "active_experience_department": "Marketing" }},
                        { match: { "active_experience_department": "Legal" }},
                        { match: { "active_experience_department": "Compliance" }},
                        { match: { "active_experience_department": "Procurement" }},
                        { match: { "active_experience_department": "Strategy" }},
                        
                        // Company name match (fallback)
                        { match: { "company_name": companyName }}
                    ],
                    minimum_should_match: 1
                }
            }
        };

        return await this.searchEmployeePreview(query, options);
    }

    /**
     * 🏢 COMPANY DISCOVERY SEARCH
     * 
     * Search for companies by name or domain
     */
    async searchCompanyByName(companyName, options = {}) {
        const query = {
            query: {
                bool: {
                    should: [
                        { match: { "company_name": companyName }},
                        { match_phrase: { "company_name": companyName }},
                        { match: { "company_website": companyName }},
                        { match: { "company_domain": companyName }}
                    ],
                    minimum_should_match: 1
                }
            }
        };

        return await this.searchCompanyPreview(query, options);
    }

    /**
     * 🏢 COMPANY DISCOVERY BY DOMAIN
     * 
     * Search for companies by website domain
     */
    async searchCompanyByDomain(domain, options = {}) {
        const cleanDomain = this.cleanDomain(domain);
        
        const query = {
            query: {
                bool: {
                    should: [
                        { match: { "company_website": cleanDomain }},
                        { match: { "company_domain": cleanDomain }},
                        { match: { "website": cleanDomain }},
                        { match: { "domain": cleanDomain }}
                    ],
                    minimum_should_match: 1
                }
            }
        };

        return await this.searchCompanyPreview(query, options);
    }

    /**
     * 📊 FIELD MAPPING FUNCTIONS
     */
    
    mapEmployeePreviewFields(employee) {
        return {
            // Core identification
            id: employee.id,
            full_name: employee.full_name,
            linkedin_url: employee.linkedin_url,
            headline: employee.headline,
            
            // Location
            location_full: employee.location_full,
            location_country: employee.location_country,
            
            // Network metrics
            connections_count: employee.connections_count,
            followers_count: employee.followers_count,
            
            // Current company info
            company_name: employee.company_name,
            company_linkedin_url: employee.company_linkedin_url,
            company_website: employee.company_website,
            company_industry: employee.company_industry,
            
            // Current role info (CRITICAL for buyer group)
            active_experience_title: employee.active_experience_title,
            active_experience_department: employee.active_experience_department,
            active_experience_management_level: employee.active_experience_management_level,
            
            // Company details
            company_hq_full_address: employee.company_hq_full_address,
            company_hq_country: employee.company_hq_country,
            
            // Scoring
            _score: employee._score,
            
            // Additional fields that might be useful
            email: employee.email || '',
            phone: employee.phone || '',
            location: employee.location || '',
            city: employee.city || '',
            state: employee.state || '',
            country: employee.country || ''
        };
    }

    mapCompanyPreviewFields(company) {
        return {
            // Core identification
            id: company.id,
            company_name: company.company_name,
            linkedin_url: company.linkedin_url,
            website: company.website,
            unique_domain: company.unique_domain,
            
            // Company details
            size_range: company.size_range,
            industry: company.industry,
            hq_country: company.hq_country,
            company_logo: company.company_logo,
            
            // Scoring
            _score: company._score,
            
            // Additional fields
            domain: company.domain || '',
            description: company.description || '',
            founded_year: company.founded_year || '',
            employee_count: company.employee_count || '',
            revenue: company.revenue || '',
            headquarters: company.headquarters || ''
        };
    }

    /**
     * 🔧 UTILITY FUNCTIONS
     */
    
    cleanDomain(domain) {
        if (!domain) return '';
        return domain
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .split('/')[0]
            .toLowerCase();
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            ...this.stats,
            successRate: this.stats.successes + this.stats.failures > 0 
                ? (this.stats.successes / (this.stats.successes + this.stats.failures)) * 100 
                : 0
        };
    }

    /**
     * 🔄 RATE LIMITING
     */
    async enforceRateLimit() {
        if (this.config.RATE_LIMIT_DELAY > 0) {
            await new Promise(resolve => setTimeout(resolve, this.config.RATE_LIMIT_DELAY));
        }
    }
}

module.exports = CoreSignalPreviewClient;
