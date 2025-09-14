#!/usr/bin/env node

/**
 * 📧 EMAIL DISCOVERY MODULE
 * 
 * Email finding and verification:
 * 1. Search vs. Enrich decision logic
 * 2. Prospeo for email finding ($0.0198/verified email)
 * 3. Dropcontact for B2B enrichment (≥20k tier ≲$0.02/email)
 * 4. Triangulation of data sources with recency scoring
 * 5. Cost optimization
 */

const fetch = require('node-fetch');

class EmailDiscovery {
    constructor(config = {}) {
        this.config = {
            PROSPEO_API_KEY: config.PROSPEO_API_KEY || process.env.PROSPEO_API_KEY,
            DROPCONTACT_API_KEY: config.DROPCONTACT_API_KEY || process.env.DROPCONTACT_API_KEY,
            MYEMAILVERIFIER_API_KEY: config.MYEMAILVERIFIER_API_KEY || process.env.MYEMAILVERIFIER_API_KEY,
            ZEROBOUNCE_API_KEY: config.ZEROBOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY,
            ...config
        };

        this.emailCache = new Map();
        this.enrichmentStats = {
            prospeoSearches: 0,
            dropcontactEnrichments: 0,
            emailsFound: 0,
            emailsVerified: 0,
            totalCost: 0
        };
    }

    /**
     * 🎯 INTELLIGENT EMAIL SEARCH VS ENRICH DECISION
     * 
     * Decides whether to search for emails or enrich existing data
     */
    async intelligentEmailProcess(executiveData, companyData, options = {}) {
        const { isTop1000Company = false, forceEnrich = false } = options;
        
        console.log(`\n📧 INTELLIGENT EMAIL PROCESSING: ${executiveData.name}`);
        console.log('=' .repeat(60));

        const result = {
            executive: executiveData,
            company: companyData,
            emails: [],
            enrichmentMethod: null,
            confidence: 0,
            cost: 0,
            dataFreshness: null,
            triangulated: false,
            sources: [],
            timestamp: new Date().toISOString()
        };

        try {
            // DECISION LOGIC: Search vs. Enrich
            const hasEmail = executiveData.email && executiveData.email.trim();
            const decision = this.makeSearchVsEnrichDecision(executiveData, companyData, hasEmail, forceEnrich);
            
            console.log(`🤔 Decision: ${decision.action} (${decision.reason})`);
            result.enrichmentMethod = decision.action;

            if (decision.action === 'VERIFY_EXISTING') {
                // Verify existing email with waterfall validation
                const verificationResult = await this.verifyExistingEmail(executiveData.email);
                result.emails = [verificationResult];
                result.confidence = verificationResult.confidence;
                result.cost = verificationResult.cost || 0;
                
            } else if (decision.action === 'SEARCH_NEW') {
                // Search for new emails using Prospeo
                const searchResults = await this.searchEmailsWithProspeo(executiveData, companyData);
                result.emails = searchResults.emails;
                result.confidence = searchResults.confidence;
                result.cost = searchResults.cost;
                result.sources.push('prospeo');
                
            } else if (decision.action === 'ENRICH_CONTACT') {
                // Enrich contact data using Dropcontact
                const enrichmentResults = await this.enrichContactWithDropcontact(executiveData, companyData);
                result.emails = enrichmentResults.emails;
                result.confidence = enrichmentResults.confidence;
                result.cost = enrichmentResults.cost;
                result.sources.push('dropcontact');
                
            } else if (decision.action === 'TRIANGULATE') {
                // Use multiple sources and triangulate
                const triangulatedResults = await this.triangulateEmailSources(executiveData, companyData);
                result.emails = triangulatedResults.emails;
                result.confidence = triangulatedResults.confidence;
                result.cost = triangulatedResults.cost;
                result.sources = triangulatedResults.sources;
                result.triangulated = true;
            }

            // Update stats
            this.enrichmentStats.totalCost += result.cost;
            this.enrichmentStats.emailsFound += result.emails.filter(e => e.isValid).length;

            console.log(`✅ EMAIL PROCESSING COMPLETE:`);
            console.log(`   Method: ${result.enrichmentMethod}`);
            console.log(`   Emails found: ${result.emails.length}`);
            console.log(`   Confidence: ${result.confidence}%`);
            console.log(`   Cost: $${result.cost.toFixed(4)}`);

            return result;

        } catch (error) {
            console.error(`❌ Email processing error: ${error.message}`);
            result.error = error.message;
            return result;
        }
    }

    /**
     * 🤔 SEARCH VS ENRICH DECISION LOGIC
     */
    makeSearchVsEnrichDecision(executiveData, companyData, hasEmail, forceEnrich) {
        // Priority 1: If we have an email, verify it first
        if (hasEmail && !forceEnrich) {
            return {
                action: 'VERIFY_EXISTING',
                reason: 'Email present - verify with waterfall validation',
                confidence: 80
            };
        }

        // Priority 2: For Top 1000 companies, use triangulation for maximum accuracy
        if (companyData.isTop1000 || companyData.revenue > 100000000) {
            return {
                action: 'TRIANGULATE',
                reason: 'Top 1000 company - triangulate multiple sources for maximum accuracy',
                confidence: 95
            };
        }

        // Priority 3: For B2B companies, use Dropcontact (better for business emails)
        if (companyData.industry && this.isB2BIndustry(companyData.industry)) {
            return {
                action: 'ENRICH_CONTACT',
                reason: 'B2B company - Dropcontact specialized for business emails',
                confidence: 85
            };
        }

        // Priority 4: Default to Prospeo for email search
        return {
            action: 'SEARCH_NEW',
            reason: 'No email found - search with Prospeo',
            confidence: 75
        };
    }

    /**
     * ✅ VERIFY EXISTING EMAIL
     */
    async verifyExistingEmail(email) {
        console.log(`   ✅ Verifying existing email: ${email}`);
        
        // Use waterfall validation (ZeroBounce preferred, MyEmailVerifier fallback)
        if (this.config.ZEROBOUNCE_API_KEY) {
            const zbResult = await this.validateWithZeroBounce(email);
            if (zbResult.confidence >= 90) {
                return { ...zbResult, cost: 0.001 }; // ZeroBounce cost estimate
            }
        }

        if (this.config.MYEMAILVERIFIER_API_KEY) {
            const mevResult = await this.validateWithMyEmailVerifier(email);
            return { ...mevResult, cost: 0.003 }; // MyEmailVerifier cost
        }

        return {
            email: email,
            isValid: false,
            confidence: 0,
            result: 'no_validation_available',
            cost: 0
        };
    }

    /**
     * 🔍 SEARCH EMAILS WITH PROSPEO
     * 
     * Prospeo API - $0.0198/verified email on Growth monthly
     */
    async searchEmailsWithProspeo(executiveData, companyData) {
        console.log(`   🔍 Searching emails with Prospeo ($0.0198/verified)...`);
        
        try {
            if (!this.config.PROSPEO_API_KEY) {
                throw new Error('No Prospeo API key available');
            }

            // Parse name for API
            const nameParts = executiveData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';
            
            // Extract domain from company website
            const domain = companyData.website 
                ? companyData.website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0]
                : companyData.domain;

            const response = await fetch('https://api.prospeo.io/email-finder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-KEY': this.config.PROSPEO_API_KEY
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    company_domain: domain
                }),
                timeout: 15000
            });

            if (response.ok) {
                const data = await response.json();
                this.enrichmentStats.prospeoSearches++;
                
                const emails = [];
                if (data.email && data.email.email) {
                    emails.push({
                        email: data.email.email,
                        isValid: data.email.verification?.result === 'deliverable',
                        confidence: this.calculateProspeoConfidence(data.email.verification),
                        source: 'prospeo',
                        pattern: data.email.email_pattern,
                        verification: data.email.verification,
                        cost: 0.0198,
                        timestamp: new Date().toISOString()
                    });
                }

                return {
                    emails: emails,
                    confidence: emails.length > 0 ? emails[0].confidence : 0,
                    cost: emails.length > 0 ? 0.0198 : 0,
                    method: 'prospeo_search'
                };
            } else {
                console.log(`   ⚠️ Prospeo API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Prospeo search error: ${error.message}`);
        }

        return { emails: [], confidence: 0, cost: 0, method: 'prospeo_failed' };
    }

    /**
     * 🏢 ENRICH CONTACT WITH DROPCONTACT
     * 
     * Dropcontact API - ≲$0.02/email on ≥20k tier, GDPR compliant
     */
    async enrichContactWithDropcontact(executiveData, companyData) {
        console.log(`   🏢 Enriching with Dropcontact (≲$0.02/email, GDPR compliant)...`);
        
        try {
            if (!this.config.DROPCONTACT_API_KEY) {
                throw new Error('No Dropcontact API key available');
            }

            // Parse name for API
            const nameParts = executiveData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';

            const response = await fetch('https://api.dropcontact.com/v1/enrich/all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Token': this.config.DROPCONTACT_API_KEY
                },
                body: JSON.stringify({
                    data: [{
                        first_name: firstName,
                        last_name: lastName,
                        company: companyData.name,
                        website: companyData.website
                    }]
                }),
                timeout: 20000
            });

            if (response.ok) {
                const data = await response.json();
                this.enrichmentStats.dropcontactEnrichments++;
                
                const emails = [];
                if (data.data && data.data.length > 0) {
                    const enrichedData = data.data[0];
                    
                    if (enrichedData.email && enrichedData.email.length > 0) {
                        enrichedData.email.forEach(emailObj => {
                            emails.push({
                                email: emailObj.email,
                                isValid: emailObj.qualification === 'correct',
                                confidence: this.calculateDropcontactConfidence(emailObj),
                                source: 'dropcontact',
                                qualification: emailObj.qualification,
                                qualification_result: emailObj.qualification_result,
                                cost: 0.02,
                                timestamp: new Date().toISOString()
                            });
                        });
                    }
                }

                return {
                    emails: emails,
                    confidence: emails.length > 0 ? Math.max(...emails.map(e => e.confidence)) : 0,
                    cost: emails.length > 0 ? 0.02 : 0,
                    method: 'dropcontact_enrichment'
                };
            } else {
                console.log(`   ⚠️ Dropcontact API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Dropcontact enrichment error: ${error.message}`);
        }

        return { emails: [], confidence: 0, cost: 0, method: 'dropcontact_failed' };
    }

    /**
     * 🎯 TRIANGULATE EMAIL SOURCES
     * 
     * Uses multiple providers and triangulates results with recency scoring
     */
    async triangulateEmailSources(executiveData, companyData) {
        console.log(`   🎯 Triangulating multiple email sources...`);
        
        const allResults = [];
        const sources = [];
        let totalCost = 0;

        // Run Prospeo search
        const prospeoResults = await this.searchEmailsWithProspeo(executiveData, companyData);
        if (prospeoResults.emails.length > 0) {
            allResults.push(...prospeoResults.emails);
            sources.push('prospeo');
            totalCost += prospeoResults.cost;
        }

        // Run Dropcontact enrichment
        const dropcontactResults = await this.enrichContactWithDropcontact(executiveData, companyData);
        if (dropcontactResults.emails.length > 0) {
            allResults.push(...dropcontactResults.emails);
            sources.push('dropcontact');
            totalCost += dropcontactResults.cost;
        }

        // Triangulate results
        const triangulatedEmails = this.triangulateEmailResults(allResults);
        
        return {
            emails: triangulatedEmails,
            confidence: triangulatedEmails.length > 0 ? triangulatedEmails[0].confidence : 0,
            cost: totalCost,
            sources: sources,
            method: 'triangulated'
        };
    }

    /**
     * 🎯 TRIANGULATE EMAIL RESULTS
     * 
     * Intelligently combines results from multiple providers
     */
    triangulateEmailResults(emailResults) {
        if (emailResults.length === 0) return [];

        // Group by email address
        const emailMap = new Map();
        
        emailResults.forEach(result => {
            const email = result.email.toLowerCase();
            
            if (emailMap.has(email)) {
                const existing = emailMap.get(email);
                
                // Combine confidence scores (weighted average)
                const totalWeight = existing.sourceCount + 1;
                existing.confidence = Math.round(
                    (existing.confidence * existing.sourceCount + result.confidence) / totalWeight
                );
                existing.sourceCount = totalWeight;
                existing.sources.push(result.source);
                existing.triangulated = true;
                
                // Prefer more recent data
                const existingTime = new Date(existing.timestamp);
                const resultTime = new Date(result.timestamp);
                if (resultTime > existingTime) {
                    existing.timestamp = result.timestamp;
                    existing.primarySource = result.source;
                }
                
                // Boost confidence for consensus
                if (existing.isValid === result.isValid) {
                    existing.confidence = Math.min(98, existing.confidence + 5);
                    existing.consensus = true;
                }
                
            } else {
                emailMap.set(email, {
                    ...result,
                    sources: [result.source],
                    sourceCount: 1,
                    primarySource: result.source,
                    triangulated: false,
                    consensus: false
                });
            }
        });

        // Convert to array and sort by confidence
        const triangulatedEmails = Array.from(emailMap.values())
            .sort((a, b) => {
                // Prioritize valid emails
                if (a.isValid !== b.isValid) {
                    return b.isValid - a.isValid;
                }
                // Then by confidence
                if (a.confidence !== b.confidence) {
                    return b.confidence - a.confidence;
                }
                // Then by source count (more sources = better)
                return b.sourceCount - a.sourceCount;
            });

        return triangulatedEmails;
    }

    /**
     * 🔧 UTILITY METHODS
     */
    
    isB2BIndustry(industry) {
        const b2bKeywords = [
            'software', 'technology', 'consulting', 'services', 'enterprise',
            'manufacturing', 'industrial', 'logistics', 'finance', 'banking',
            'healthcare', 'pharmaceutical', 'telecommunications', 'energy'
        ];
        
        return b2bKeywords.some(keyword => 
            industry.toLowerCase().includes(keyword)
        );
    }

    calculateProspeoConfidence(verification) {
        if (!verification) return 50;
        
        switch (verification.result) {
            case 'deliverable': return 95;
            case 'undeliverable': return 5;
            case 'risky': return 40;
            case 'unknown': return 30;
            default: return 20;
        }
    }

    calculateDropcontactConfidence(emailObj) {
        switch (emailObj.qualification) {
            case 'correct': return 95;
            case 'incorrect': return 10;
            case 'professional': return 85;
            case 'personal': return 70;
            default: return 40;
        }
    }

    async validateWithZeroBounce(email) {
        try {
            if (!this.config.ZEROBOUNCE_API_KEY) {
                return { email, isValid: false, confidence: 0, result: 'no_api_key', source: 'zerobounce' };
            }

            const response = await fetch(
                `https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`,
                { method: 'GET', timeout: 10000 }
            );

            if (response.ok) {
                const data = await response.json();
                const isValid = data.status === 'valid';
                const confidence = this.calculateZeroBounceConfidence(data.status, data.sub_status);
                
                return {
                    email,
                    isValid,
                    confidence,
                    result: data.status,
                    subStatus: data.sub_status,
                    source: 'zerobounce'
                };
            }
        } catch (error) {
            console.log(`   ⚠️ ZeroBounce validation error: ${error.message}`);
        }

        return { email, isValid: false, confidence: 0, result: 'api_error', source: 'zerobounce' };
    }

    async validateWithMyEmailVerifier(email) {
        try {
            if (!this.config.MYEMAILVERIFIER_API_KEY) {
                return { email, isValid: false, confidence: 0, result: 'no_api_key', source: 'myemailverifier' };
            }

            const response = await fetch(
                `https://client.myemailverifier.com/verifier/validate_single/${encodeURIComponent(email)}/${this.config.MYEMAILVERIFIER_API_KEY}`,
                { method: 'GET', timeout: 10000 }
            );

            if (response.ok) {
                const data = await response.json();
                const isValid = data.Status === 'Valid';
                const confidence = this.calculateMyEmailVerifierConfidence(data);
                
                return {
                    email,
                    isValid,
                    confidence,
                    result: data.Status,
                    source: 'myemailverifier'
                };
            }
        } catch (error) {
            console.log(`   ⚠️ MyEmailVerifier validation error: ${error.message}`);
        }

        return { email, isValid: false, confidence: 0, result: 'api_error', source: 'myemailverifier' };
    }

    calculateZeroBounceConfidence(status, subStatus) {
        const confidenceMap = {
            'valid': 95,
            'catch-all': 70,
            'unknown': 40,
            'do_not_mail': 10,
            'spamtrap': 5,
            'invalid': 0
        };
        return confidenceMap[status] || 0;
    }

    calculateMyEmailVerifierConfidence(data) {
        let confidence = 0;
        switch (data.Status) {
            case 'Valid': confidence = 95; break;
            case 'Invalid': confidence = 90; break;
            case 'Unknown': confidence = 40; break;
            case 'Catch-All': confidence = 70; break;
            default: confidence = 30;
        }
        
        // Adjust based on additional factors
        if (data.Disposable_Domain === 'true') confidence -= 20;
        if (data.Role_Based === 'true') confidence -= 10;
        if (data.Free_Domain === 'true') confidence -= 5;
        if (data.Greylisted === 'true') confidence -= 15;
        
        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * 📊 GET ENRICHMENT STATS
     */
    getEnrichmentStats() {
        return {
            ...this.enrichmentStats,
            averageCostPerEmail: this.enrichmentStats.emailsFound > 0 
                ? this.enrichmentStats.totalCost / this.enrichmentStats.emailsFound 
                : 0,
            successRate: this.enrichmentStats.prospeoSearches + this.enrichmentStats.dropcontactEnrichments > 0
                ? (this.enrichmentStats.emailsFound / (this.enrichmentStats.prospeoSearches + this.enrichmentStats.dropcontactEnrichments)) * 100
                : 0
        };
    }
}

module.exports = { EmailDiscovery };
