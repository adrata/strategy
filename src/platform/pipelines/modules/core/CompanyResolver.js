#!/usr/bin/env node

/**
 * 🏢 COMPANY RESOLVER MODULE
 * 
 * Handles the complex process of resolving company identity:
 * 1. URL resolution and redirect following
 * 2. Acquisition detection and parent company mapping
 * 3. Domain canonicalization
 * 4. Company status determination (active/acquired/merged/defunct)
 * 
 * This is the FIRST and most critical step in the pipeline.
 */

const fetch = require('node-fetch');
const dns = require('dns').promises;

class CompanyResolver {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            MAX_REDIRECTS: 10,
            TIMEOUT: 30000,
            CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 hours
            ...config
        };
        
        this.resolutionCache = new Map();
        this.acquisitionDatabase = this.loadAcquisitionDatabase();
    }

    /**
     * 🔍 MAIN COMPANY RESOLUTION PROCESS
     */
    async resolveCompany(inputUrl) {
        console.log(`\n🏢 RESOLVING COMPANY: ${inputUrl}`);
        console.log('=' .repeat(60));
        
        const cacheKey = inputUrl.toLowerCase();
        if (this.resolutionCache.has(cacheKey)) {
            console.log('✅ Using cached resolution');
            return this.resolutionCache.get(cacheKey);
        }

        const resolution = {
            originalUrl: inputUrl,
            canonicalUrl: '',
            finalUrl: '',
            redirectChain: [],
            companyName: '',
            companyStatus: 'unknown', // active/acquired/merged/defunct/subsidiary
            isAcquired: false,
            parentCompany: null,
            acquisitionInfo: null,
            domains: [],
            confidence: 0,
            resolutionMethod: '',
            timestamp: new Date().toISOString(),
            metadata: {}
        };

        try {
            // STEP 1: URL Resolution and Redirect Following
            console.log('📍 STEP 1: URL Resolution');
            const urlResolution = await this.resolveUrlWithRedirects(inputUrl);
            resolution.canonicalUrl = urlResolution.canonical;
            resolution.finalUrl = urlResolution.final;
            resolution.redirectChain = urlResolution.redirects;
            resolution.domains = urlResolution.domains;

            console.log(`   Original: ${inputUrl}`);
            console.log(`   Canonical: ${resolution.canonicalUrl}`);
            console.log(`   Final: ${resolution.finalUrl}`);
            if (resolution.redirectChain.length > 1) {
                console.log(`   Redirects: ${resolution.redirectChain.length - 1} found`);
            }

            // STEP 2: Acquisition Detection
            console.log('\n🔍 STEP 2: Acquisition Detection');
            const acquisitionInfo = await this.detectAcquisition(resolution.canonicalUrl, resolution.finalUrl);
            if (acquisitionInfo.isAcquired) {
                resolution.isAcquired = true;
                resolution.parentCompany = acquisitionInfo.parentCompany;
                resolution.acquisitionInfo = acquisitionInfo;
                resolution.companyStatus = 'acquired';
                console.log(`   🚨 ACQUISITION DETECTED: ${acquisitionInfo.parentCompany.name}`);
                console.log(`   📅 Date: ${acquisitionInfo.acquisitionDate}`);
            }

            // STEP 3: Company Name Resolution
            console.log('\n🏷️  STEP 3: Company Name Resolution');
            const nameResolution = await this.resolveCompanyName(resolution.finalUrl, resolution.canonicalUrl);
            resolution.companyName = nameResolution.name;
            resolution.confidence = nameResolution.confidence;
            resolution.resolutionMethod = nameResolution.method;
            resolution.metadata = nameResolution.metadata;

            console.log(`   Company: ${resolution.companyName}`);
            console.log(`   Method: ${resolution.resolutionMethod}`);
            console.log(`   Confidence: ${resolution.confidence}%`);

            // STEP 4: Status Determination
            console.log('\n📊 STEP 4: Status Determination');
            if (!resolution.isAcquired) {
                const statusCheck = await this.determineCompanyStatus(resolution.companyName, resolution.finalUrl);
                resolution.companyStatus = statusCheck.status;
                if (statusCheck.additionalInfo) {
                    resolution.metadata.statusInfo = statusCheck.additionalInfo;
                }
            }

            console.log(`   Status: ${resolution.companyStatus.toUpperCase()}`);

            // Cache the result
            this.resolutionCache.set(cacheKey, resolution);

            console.log(`\n✅ COMPANY RESOLUTION COMPLETE`);
            console.log(`   ${resolution.companyName} (${resolution.companyStatus})`);
            
            return resolution;

        } catch (error) {
            console.error(`❌ Company resolution failed: ${error.message}`);
            resolution.companyStatus = 'error';
            resolution.metadata.error = error.message;
            return resolution;
        }
    }

    /**
     * 🌐 URL RESOLUTION WITH REDIRECT FOLLOWING
     */
    async resolveUrlWithRedirects(inputUrl) {
        const redirects = [];
        const domains = new Set();
        let currentUrl = this.normalizeUrl(inputUrl);
        let canonical = currentUrl;
        
        // Add initial domain
        try {
            const initialDomain = new URL(currentUrl).hostname;
            domains.add(initialDomain);
        } catch (e) {
            // Invalid URL, try to fix it
            if (!currentUrl.startsWith('http')) {
                currentUrl = 'https://' + currentUrl;
                canonical = currentUrl;
            }
        }

        redirects.push(currentUrl);

        for (let i = 0; i < this.config.MAX_REDIRECTS; i++) {
            try {
                const response = await fetch(currentUrl, {
                    method: 'HEAD',
                    redirect: 'manual',
                    timeout: this.config.TIMEOUT,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; ExecutiveFinder/1.0)'
                    }
                });

                // Check for redirects
                if (response.status >= 300 && response.status < 400) {
                    const location = response.headers.get('location');
                    if (location) {
                        currentUrl = new URL(location, currentUrl).href;
                        redirects.push(currentUrl);
                        
                        // Add domain to set
                        const domain = new URL(currentUrl).hostname;
                        domains.add(domain);
                        
                        continue;
                    }
                }

                // No more redirects
                break;

            } catch (error) {
                console.log(`   ⚠️ Redirect resolution error: ${error.message}`);
                break;
            }
        }

        const finalUrl = redirects[redirects.length - 1];
        
        return {
            canonical,
            final: finalUrl,
            redirects,
            domains: Array.from(domains)
        };
    }

    /**
     * 🔍 ACQUISITION DETECTION
     */
    async detectAcquisition(canonicalUrl, finalUrl) {
        // Check if domains are different (potential acquisition indicator)
        const canonicalDomain = this.extractDomain(canonicalUrl);
        const finalDomain = this.extractDomain(finalUrl);
        
        const acquisitionInfo = {
            isAcquired: false,
            parentCompany: null,
            acquisitionDate: null,
            acquisitionType: null, // full_acquisition/merger/subsidiary
            confidence: 0,
            evidence: []
        };

        // STEP 1: Check hardcoded recent acquisitions database
        const hardcodedMatch = this.checkRecentAcquisitions(canonicalDomain, finalDomain);
        if (hardcodedMatch.isAcquired) {
            acquisitionInfo.isAcquired = true;
            acquisitionInfo.parentCompany = hardcodedMatch.parentCompany;
            acquisitionInfo.acquisitionDate = hardcodedMatch.acquisitionDate;
            acquisitionInfo.acquisitionType = hardcodedMatch.type;
            acquisitionInfo.confidence = hardcodedMatch.confidence;
            acquisitionInfo.evidence.push('hardcoded_database');
            console.log(`   🎯 Hardcoded acquisition found: ${hardcodedMatch.parentCompany}`);
            return acquisitionInfo;
        }

        // STEP 2: Check for domain change (potential acquisition)
        if (canonicalDomain !== finalDomain) {
            acquisitionInfo.evidence.push('domain_redirect');
            
            // Use AI to investigate the relationship
            const aiInvestigation = await this.investigateAcquisitionWithAI(canonicalDomain, finalDomain);
            if (aiInvestigation.isAcquired) {
                acquisitionInfo.isAcquired = true;
                acquisitionInfo.parentCompany = aiInvestigation.parentCompany;
                acquisitionInfo.acquisitionDate = aiInvestigation.acquisitionDate;
                acquisitionInfo.acquisitionType = aiInvestigation.type;
                acquisitionInfo.confidence = aiInvestigation.confidence;
                acquisitionInfo.evidence.push('ai_investigation');
            }
        }

        // STEP 3: AI-powered company research (even without domain change)
        // This catches acquisitions where domain didn't change
        const companyResearch = await this.researchCompanyAcquisitionStatus(canonicalDomain);
        if (companyResearch.isAcquired) {
            acquisitionInfo.isAcquired = true;
            acquisitionInfo.parentCompany = companyResearch.parentCompany;
            acquisitionInfo.acquisitionDate = companyResearch.acquisitionDate;
            acquisitionInfo.acquisitionType = companyResearch.type;
            acquisitionInfo.confidence = Math.max(acquisitionInfo.confidence, companyResearch.confidence);
            acquisitionInfo.evidence.push('company_research');
        }

        return acquisitionInfo;
    }

    /**
     * 📚 CHECK RECENT ACQUISITIONS DATABASE
     */
    checkRecentAcquisitions(originalDomain, finalDomain) {
        const recentAcquisitions = {
            // QTS Realty Trust - Acquired by Blackstone in 2021
            'qtsdatacenters.com': {
                isAcquired: true,
                parentCompany: 'Blackstone',
                acquisitionDate: '2021-10-01',
                type: 'full_acquisition',
                confidence: 95,
                originalCompany: 'QTS Realty Trust, LLC',
                parentCompanyDetails: 'Blackstone Real Estate Income Trust',
                executiveTracking: {
                    'Tag Greason': {
                        originalRole: 'Co-Chief Executive Officer',
                        originalCompany: 'QTS Realty Trust',
                        status: 'needs_verification',
                        lastVerified: '2021-10-01',
                        notes: 'Post-acquisition status unknown - need to verify current role'
                    },
                    'Jeff Berson': {
                        originalRole: 'Chief Financial Officer',
                        originalCompany: 'QTS Realty Trust',
                        status: 'needs_verification',
                        lastVerified: '2021-10-01',
                        notes: 'Post-acquisition status unknown - need to verify current role'
                    }
                }
            },
            // Add more recent acquisitions here
            'zoom.us': {
                isAcquired: false, // Zoom is independent
                parentCompany: null,
                acquisitionDate: null,
                type: null,
                confidence: 100
            }
        };

        // Check if either domain matches our database
        const match = recentAcquisitions[originalDomain] || recentAcquisitions[finalDomain];
        return match || { isAcquired: false, confidence: 0 };
    }

    /**
     * 🔍 RESEARCH COMPANY ACQUISITION STATUS
     */
    async researchCompanyAcquisitionStatus(domain) {
        try {
            const prompt = `Research the current ownership status of the company at ${domain}.

Please investigate:
1. Has this company been acquired in the last 5 years (2020-2025)?
2. Is it currently a subsidiary of a larger company?
3. Has it merged with another company?
4. What is the current parent company (if any)?
5. When did any acquisition/merger occur?

Focus on recent changes (2020-2025). If the company is independent, say so.

Provide ONLY a JSON response:
{
    "isAcquired": true/false,
    "parentCompany": "Parent Company Name or null",
    "acquisitionDate": "YYYY-MM-DD or YYYY or null",
    "type": "full_acquisition/merger/subsidiary/partnership/independent",
    "confidence": 0.85,
    "evidence": "brief explanation of findings",
    "originalCompany": "Original company name if changed",
    "currentStatus": "active/subsidiary/merged/defunct"
}

Only return acquisitions from 2020-2025. If no recent acquisition, return isAcquired: false.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 600
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log(`   🔍 Company research: ${result.isAcquired ? 'Acquisition detected' : 'Independent company'}`);
                        return result;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Company research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Company research error: ${error.message}`);
        }

        return { isAcquired: false, confidence: 0 };
    }

    /**
     * 🤖 AI-POWERED ACQUISITION INVESTIGATION
     */
    async investigateAcquisitionWithAI(originalDomain, finalDomain) {
        try {
            const prompt = `Investigate if there's an acquisition relationship between these domains:

Original domain: ${originalDomain}
Final domain: ${finalDomain}

Please analyze:
1. Was the company at ${originalDomain} acquired by the company at ${finalDomain}?
2. When did this acquisition occur?
3. What type of acquisition was it? (full acquisition, merger, subsidiary creation)

Provide ONLY a JSON response:
{
    "isAcquired": true/false,
    "parentCompany": {
        "name": "Parent Company Name",
        "domain": "${finalDomain}",
        "ticker": "STOCK_SYMBOL or null"
    },
    "subsidiaryCompany": {
        "name": "Subsidiary Company Name", 
        "domain": "${originalDomain}"
    },
    "acquisitionDate": "YYYY-MM-DD or YYYY or null",
    "type": "full_acquisition/merger/subsidiary/partnership/null",
    "confidence": 0.85,
    "source": "news/sec_filing/press_release/company_website"
}

Only return acquisitions from 2015-2025. If no acquisition, return isAcquired: false.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 800
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log(`   🤖 AI Investigation: ${result.isAcquired ? 'Acquisition detected' : 'No acquisition'}`);
                        return result;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ AI response parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ AI investigation error: ${error.message}`);
        }

        return { isAcquired: false, confidence: 0 };
    }

    /**
     * 🏷️ COMPANY NAME RESOLUTION
     */
    async resolveCompanyName(finalUrl, canonicalUrl) {
        const domain = this.extractDomain(finalUrl);
        
        // Try multiple methods to get the company name
        const methods = [
            () => this.getNameFromDomain(domain),
            () => this.getNameFromWebsite(finalUrl),
            () => this.getNameFromAI(finalUrl, domain)
        ];

        for (const method of methods) {
            try {
                const result = await method();
                if (result.name && result.confidence > 70) {
                    return result;
                }
            } catch (error) {
                console.log(`   ⚠️ Name resolution method failed: ${error.message}`);
            }
        }

        // Fallback: use domain name
        return {
            name: domain.replace(/\.(com|org|net|io|co)$/, '').replace(/^www\./, ''),
            confidence: 40,
            method: 'domain_fallback',
            metadata: {}
        };
    }

    /**
     * 📊 COMPANY STATUS DETERMINATION
     */
    async determineCompanyStatus(companyName, url) {
        try {
            const prompt = `Determine the current business status of ${companyName} (${url}):

Please provide ONLY a JSON response:
{
    "status": "active/acquired/merged/defunct/subsidiary",
    "isPublic": true/false,
    "ticker": "STOCK_SYMBOL or null",
    "exchange": "NYSE/NASDAQ or null",
    "lastUpdate": "2025-01-XX",
    "confidence": 0.90,
    "additionalInfo": "Brief status explanation"
}

Focus on current status as of 2025.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
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
                        return JSON.parse(jsonMatch[0]);
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Status parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Status determination error: ${error.message}`);
        }

        return { status: 'unknown', confidence: 0 };
    }

    /**
     * 🔧 UTILITY METHODS
     */
    normalizeUrl(url) {
        if (!url) return '';
        
        // Add protocol if missing
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }
        
        // Remove trailing slash
        url = url.replace(/\/$/, '');
        
        return url;
    }

    extractDomain(url) {
        try {
            return new URL(url).hostname.toLowerCase();
        } catch (error) {
            return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].toLowerCase();
        }
    }

    getNameFromDomain(domain) {
        const cleanDomain = domain.replace(/^www\./, '').replace(/\.(com|org|net|io|co)$/, '');
        const name = cleanDomain.split('.')[0];
        
        return {
            name: name.charAt(0).toUpperCase() + name.slice(1),
            confidence: 60,
            method: 'domain_extraction',
            metadata: { domain }
        };
    }

    async getNameFromWebsite(url) {
        // This would implement website scraping for company name
        // For now, return low confidence
        return {
            name: '',
            confidence: 0,
            method: 'website_scraping',
            metadata: { url }
        };
    }

    async getNameFromAI(url, domain) {
        try {
            const prompt = `What is the official company name for the website ${url} (domain: ${domain})?

Provide ONLY a JSON response:
{
    "name": "Official Company Name",
    "confidence": 0.85,
    "source": "company_website/about_page/footer"
}`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
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
                        const result = JSON.parse(jsonMatch[0]);
                        return {
                            name: result.name,
                            confidence: Math.round(result.confidence * 100),
                            method: 'ai_research',
                            metadata: { source: result.source }
                        };
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ AI name parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ AI name resolution error: ${error.message}`);
        }

        return { name: '', confidence: 0, method: 'ai_research', metadata: {} };
    }

    /**
     * 📚 INITIALIZE ACQUISITION DATABASE (ENHANCED)
     */
    loadAcquisitionDatabase() {
        // Return enhanced Map with recent acquisitions
        // This provides immediate detection for known acquisitions
        const database = new Map();
        
        // Add recent acquisitions to the database
        const recentAcquisitions = {
            'qtsdatacenters.com': {
                isAcquired: true,
                parentCompany: 'Blackstone',
                acquisitionDate: '2021-10-01',
                type: 'full_acquisition',
                confidence: 95,
                originalCompany: 'QTS Realty Trust, LLC',
                parentCompanyDetails: 'Blackstone Real Estate Income Trust'
            }
        };
        
        // Convert to Map for consistency
        Object.entries(recentAcquisitions).forEach(([domain, data]) => {
            database.set(domain, data);
        });
        
        return database;
    }

    /**
     * 👔 TRACK POST-ACQUISITION EXECUTIVES
     */
    async trackPostAcquisitionExecutives(companyName, acquisitionInfo) {
        if (!acquisitionInfo.isAcquired || !acquisitionInfo.executiveTracking) {
            return null;
        }

        console.log(`   🔍 TRACKING POST-ACQUISITION EXECUTIVES: ${companyName}`);
        
        const trackingResults = {
            companyName: companyName,
            acquisitionDate: acquisitionInfo.acquisitionDate,
            parentCompany: acquisitionInfo.parentCompany,
            executives: []
        };

        for (const [executiveName, tracking] of Object.entries(acquisitionInfo.executiveTracking)) {
            console.log(`   👔 Tracking executive: ${executiveName} (${tracking.originalRole})`);
            
            try {
                const currentStatus = await this.verifyExecutivePostAcquisition(
                    executiveName,
                    tracking.originalRole,
                    acquisitionInfo.parentCompany,
                    companyName
                );
                
                trackingResults.executives.push({
                    name: executiveName,
                    originalRole: tracking.originalRole,
                    originalCompany: tracking.originalCompany,
                    currentStatus: currentStatus,
                    lastVerified: new Date().toISOString().split('T')[0]
                });
                
            } catch (error) {
                console.log(`   ❌ Error tracking ${executiveName}: ${error.message}`);
                trackingResults.executives.push({
                    name: executiveName,
                    originalRole: tracking.originalRole,
                    originalCompany: tracking.originalCompany,
                    currentStatus: { verified: false, error: error.message },
                    lastVerified: new Date().toISOString().split('T')[0]
                });
            }
        }

        return trackingResults;
    }

    /**
     * 🔍 VERIFY EXECUTIVE POST-ACQUISITION
     */
    async verifyExecutivePostAcquisition(executiveName, originalRole, parentCompany, originalCompany) {
        try {
            const prompt = `Research the current status of ${executiveName} who was ${originalRole} at ${originalCompany}.

This company was acquired by ${parentCompany} in 2021. Please verify:

1. Is ${executiveName} still employed at ${originalCompany} (now owned by ${parentCompany})?
2. Has ${executiveName} moved to ${parentCompany}?
3. Has ${executiveName} left the company entirely?
4. What is their current role and company (if different)?
5. When did any changes occur?

Provide ONLY a JSON response:
{
    "verified": true/false,
    "currentCompany": "Current company name or null",
    "currentRole": "Current role or null",
    "status": "still_at_original/moved_to_parent/left_company/unknown",
    "changeDate": "YYYY-MM-DD or null",
    "confidence": 0.85,
    "source": "linkedin/news/company_website",
    "notes": "Brief explanation of findings"
}

Focus on recent information (2021-2025).`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'sonar-pro',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1,
                    max_tokens: 500
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        console.log(`   ✅ ${executiveName}: ${result.status} at ${result.currentCompany || 'unknown'}`);
                        return result;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Executive verification parsing failed for ${executiveName}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Executive verification error for ${executiveName}: ${error.message}`);
        }

        return { verified: false, status: 'unknown', confidence: 0 };
    }
}

module.exports = { CompanyResolver };
