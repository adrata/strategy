#!/usr/bin/env node

/**
 * 📧 EMAIL TRANSITION TRACKER MODULE
 * 
 * Email validation and tracking:
 * 1. Current active email detection
 * 2. Legacy/historical email tracking
 * 3. Post-acquisition email transitions
 * 4. Email domain validation
 * 5. Email deliverability assessment
 * 
 * Critical for acquisitions where executives may use multiple emails
 */

const fetch = require('node-fetch');

class EmailTransitionTracker {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.emailCache = new Map();
        this.domainValidation = new Map();
    }

    /**
     * 📧 COMPREHENSIVE EMAIL ANALYSIS
     * 
     * Analyzes executive email patterns and validates current addresses
     */
    async analyzeExecutiveEmails(companyData) {
        console.log(`📧 Analyzing email intelligence: ${companyData.name}`);

        const emailAnalysis = {
            company: companyData,
            
            // COMPANY EMAIL DOMAINS
            currentDomain: null,
            legacyDomains: [],
            parentCompanyDomain: null,
            domainStatus: null,
            
            // CEO EMAIL INTELLIGENCE
            ceoCurrentEmail: null,
            ceoLegacyEmail: null,
            ceoEmailConfidence: 0,
            ceoEmailStatus: null,
            
            // CFO EMAIL INTELLIGENCE
            cfoCurrentEmail: null,
            cfoLegacyEmail: null,
            cfoEmailConfidence: 0,
            cfoEmailStatus: null,
            
            // EMAIL TRANSITION ANALYSIS
            emailTransitionStatus: null,
            emailTransitionDate: null,
            emailMigrationComplete: null,
            dualEmailUsage: null,
            
            // DELIVERABILITY ASSESSMENT
            primaryEmailRecommendation: null,
            alternativeEmailRecommendation: null,
            emailValidationNotes: null,
            
            timestamp: new Date().toISOString()
        };

        try {
            // Step 1: Analyze company domain changes
            const domainAnalysis = await this.analyzeDomainChanges(companyData);
            emailAnalysis.currentDomain = domainAnalysis.currentDomain;
            emailAnalysis.legacyDomains = domainAnalysis.legacyDomains;
            emailAnalysis.parentCompanyDomain = domainAnalysis.parentCompanyDomain;
            emailAnalysis.domainStatus = domainAnalysis.status;

            // Step 2: Research CEO email patterns
            if (companyData.ceo) {
                const ceoEmails = await this.researchExecutiveEmails(
                    companyData.ceo, 
                    companyData, 
                    domainAnalysis
                );
                emailAnalysis.ceoCurrentEmail = ceoEmails.currentEmail;
                emailAnalysis.ceoLegacyEmail = ceoEmails.legacyEmail;
                emailAnalysis.ceoEmailConfidence = ceoEmails.confidence;
                emailAnalysis.ceoEmailStatus = ceoEmails.status;
            }

            // Step 3: Research CFO email patterns
            if (companyData.financeLeader) {
                const cfoEmails = await this.researchExecutiveEmails(
                    companyData.financeLeader, 
                    companyData, 
                    domainAnalysis
                );
                emailAnalysis.cfoCurrentEmail = cfoEmails.currentEmail;
                emailAnalysis.cfoLegacyEmail = cfoEmails.legacyEmail;
                emailAnalysis.cfoEmailConfidence = cfoEmails.confidence;
                emailAnalysis.cfoEmailStatus = cfoEmails.status;
            }

            // Step 4: Analyze email transition patterns
            emailAnalysis.emailTransitionStatus = this.analyzeEmailTransition(emailAnalysis, companyData);
            emailAnalysis.emailTransitionDate = this.estimateTransitionDate(companyData);
            emailAnalysis.emailMigrationComplete = this.assessMigrationStatus(emailAnalysis);
            emailAnalysis.dualEmailUsage = this.assessDualEmailUsage(emailAnalysis);

            // Step 5: Generate recommendations
            emailAnalysis.primaryEmailRecommendation = this.recommendPrimaryEmail(emailAnalysis);
            emailAnalysis.alternativeEmailRecommendation = this.recommendAlternativeEmail(emailAnalysis);
            emailAnalysis.emailValidationNotes = this.generateValidationNotes(emailAnalysis);

            return emailAnalysis;

        } catch (error) {
            console.error(`❌ Email analysis error for ${companyData.name}:`, error.message);
            return this.generateFallbackEmailAnalysis(companyData);
        }
    }

    /**
     * 🌐 ANALYZE DOMAIN CHANGES
     * 
     * Tracks domain changes due to acquisitions, rebrands, etc.
     */
    async analyzeDomainChanges(companyData) {
        const analysis = {
            currentDomain: this.extractDomainFromWebsite(companyData.website),
            legacyDomains: [],
            parentCompanyDomain: null,
            status: 'Active'
        };

        // Check if company was acquired or rebranded
        if (companyData.corporateStatus === 'Subsidiary' || companyData.isAcquired) {
            // Research domain history
            const domainHistory = await this.researchDomainHistory(companyData);
            analysis.legacyDomains = domainHistory.legacyDomains;
            analysis.parentCompanyDomain = domainHistory.parentDomain;
            analysis.status = domainHistory.status;
        }

        return analysis;
    }

    /**
     * 🔍 RESEARCH DOMAIN HISTORY
     */
    async researchDomainHistory(companyData) {
        const query = `What domain changes occurred when ${companyData.name} was acquired by ${companyData.parentCompany}? Did they keep their original domain or switch to the parent company domain? Include any legacy domains.`;
        
        const response = await this.makePerplexityRequest(query);
        if (!response.success) {
            return this.getFallbackDomainHistory(companyData);
        }

        return this.parseDomainHistory(response.content, companyData);
    }

    /**
     * 👔 RESEARCH EXECUTIVE EMAILS
     * 
     * Determines current and legacy email addresses for executives
     */
    async researchExecutiveEmails(executive, companyData, domainAnalysis) {
        const cacheKey = `email_${executive.name}_${companyData.domain}`;
        if (this.emailCache.has(cacheKey)) {
            return this.emailCache.get(cacheKey);
        }

        const emailResearch = {
            currentEmail: null,
            legacyEmail: null,
            confidence: 0,
            status: 'Unknown'
        };

        try {
            // Generate likely email patterns
            const emailPatterns = this.generateEmailPatterns(executive.name, domainAnalysis);
            
            // Research actual email usage
            const emailIntelligence = await this.researchEmailUsage(executive, companyData, emailPatterns);
            
            emailResearch.currentEmail = emailIntelligence.currentEmail;
            emailResearch.legacyEmail = emailIntelligence.legacyEmail;
            emailResearch.confidence = emailIntelligence.confidence;
            emailResearch.status = emailIntelligence.status;

            this.emailCache.set(cacheKey, emailResearch);
            return emailResearch;

        } catch (error) {
            console.error(`Email research error for ${executive.name}:`, error.message);
            return this.getFallbackEmailResearch(executive, domainAnalysis);
        }
    }

    /**
     * 📋 GENERATE EMAIL PATTERNS
     * 
     * Creates likely email address patterns based on name and domains
     */
    generateEmailPatterns(executiveName, domainAnalysis) {
        const name = executiveName.toLowerCase().replace(/[^a-z\s]/g, '');
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        const firstInitial = firstName.charAt(0) || '';
        const lastInitial = lastName.charAt(0) || '';

        const patterns = [];
        const domains = [
            domainAnalysis.currentDomain,
            ...domainAnalysis.legacyDomains,
            domainAnalysis.parentCompanyDomain
        ].filter(domain => domain);

        // Generate common email patterns for each domain
        domains.forEach(domain => {
            if (firstName && lastName) {
                patterns.push(`${firstName}.${lastName}@${domain}`);
                patterns.push(`${firstName}${lastName}@${domain}`);
                patterns.push(`${firstInitial}${lastName}@${domain}`);
                patterns.push(`${firstName}${lastInitial}@${domain}`);
                patterns.push(`${firstInitial}.${lastName}@${domain}`);
                patterns.push(`${firstName}.${lastInitial}@${domain}`);
            }
        });

        return patterns;
    }

    /**
     * 🔍 RESEARCH EMAIL USAGE
     */
    async researchEmailUsage(executive, companyData, emailPatterns) {
        const query = `What is the current email address for ${executive.name} at ${companyData.name}? Has their email changed since the acquisition by ${companyData.parentCompany || 'N/A'}? Include both current and any previous email addresses.`;
        
        const response = await this.makePerplexityRequest(query);
        if (!response.success) {
            return this.getFallbackEmailUsage(executive, emailPatterns);
        }

        return this.parseEmailUsage(response.content, emailPatterns);
    }

    /**
     * 🧠 EMAIL ANALYSIS METHODS
     */
    analyzeEmailTransition(emailAnalysis, companyData) {
        if (!companyData.isAcquired && !companyData.isRebranded) {
            return 'No Transition (Independent Company)';
        }

        const ceoTransitioned = emailAnalysis.ceoCurrentEmail && emailAnalysis.ceoLegacyEmail;
        const cfoTransitioned = emailAnalysis.cfoCurrentEmail && emailAnalysis.cfoLegacyEmail;

        if (ceoTransitioned && cfoTransitioned) {
            return 'Full Transition (Both executives using new emails)';
        } else if (ceoTransitioned || cfoTransitioned) {
            return 'Partial Transition (Mixed email usage)';
        } else if (emailAnalysis.currentDomain !== emailAnalysis.legacyDomains[0]) {
            return 'Domain Changed (Email transition likely)';
        } else {
            return 'No Transition Detected';
        }
    }

    estimateTransitionDate(companyData) {
        if (companyData.changeDate) {
            // Estimate email transition 3-6 months after acquisition
            const changeDate = new Date(companyData.changeDate);
            const transitionDate = new Date(changeDate);
            transitionDate.setMonth(transitionDate.getMonth() + 4); // +4 months average
            return transitionDate.toISOString().split('T')[0];
        }
        return 'Unknown';
    }

    assessMigrationStatus(emailAnalysis) {
        const transitionStatus = emailAnalysis.emailTransitionStatus;
        
        if (transitionStatus.includes('Full Transition')) {
            return 'Complete';
        } else if (transitionStatus.includes('Partial')) {
            return 'In Progress';
        } else if (transitionStatus.includes('Domain Changed')) {
            return 'Pending';
        } else {
            return 'Not Required';
        }
    }

    assessDualEmailUsage(emailAnalysis) {
        const hasBothCEO = emailAnalysis.ceoCurrentEmail && emailAnalysis.ceoLegacyEmail;
        const hasBothCFO = emailAnalysis.cfoCurrentEmail && emailAnalysis.cfoLegacyEmail;

        if (hasBothCEO && hasBothCFO) {
            return 'High Likelihood (Both executives have dual emails)';
        } else if (hasBothCEO || hasBothCFO) {
            return 'Moderate Likelihood (One executive has dual emails)';
        } else {
            return 'Low Likelihood (Single email pattern detected)';
        }
    }

    /**
     * 💡 RECOMMENDATION METHODS
     */
    recommendPrimaryEmail(emailAnalysis) {
        // Prioritize current emails over legacy
        if (emailAnalysis.ceoCurrentEmail) {
            return `CEO: ${emailAnalysis.ceoCurrentEmail} (Current - Recommended)`;
        } else if (emailAnalysis.ceoLegacyEmail) {
            return `CEO: ${emailAnalysis.ceoLegacyEmail} (Legacy - Verify Status)`;
        }
        
        if (emailAnalysis.cfoCurrentEmail) {
            return `CFO: ${emailAnalysis.cfoCurrentEmail} (Current - Recommended)`;
        } else if (emailAnalysis.cfoLegacyEmail) {
            return `CFO: ${emailAnalysis.cfoLegacyEmail} (Legacy - Verify Status)`;
        }

        return 'Email research required';
    }

    recommendAlternativeEmail(emailAnalysis) {
        const alternatives = [];
        
        if (emailAnalysis.ceoLegacyEmail && emailAnalysis.ceoCurrentEmail) {
            alternatives.push(`CEO Legacy: ${emailAnalysis.ceoLegacyEmail}`);
        }
        
        if (emailAnalysis.cfoLegacyEmail && emailAnalysis.cfoCurrentEmail) {
            alternatives.push(`CFO Legacy: ${emailAnalysis.cfoLegacyEmail}`);
        }

        return alternatives.length > 0 ? alternatives.join('; ') : 'No alternative emails identified';
    }

    generateValidationNotes(emailAnalysis) {
        const notes = [];
        
        if (emailAnalysis.emailTransitionStatus.includes('Transition')) {
            notes.push('Email transition detected - validate both addresses');
        }
        
        if (emailAnalysis.dualEmailUsage.includes('High')) {
            notes.push('High likelihood of dual email usage - test both addresses');
        }
        
        if (emailAnalysis.emailMigrationComplete === 'In Progress') {
            notes.push('Email migration in progress - expect changes');
        }
        
        if (emailAnalysis.domainStatus !== 'Active') {
            notes.push('Domain status uncertain - verify email deliverability');
        }

        return notes.length > 0 ? notes.join('; ') : 'Standard email validation recommended';
    }

    /**
     * 🛠️ UTILITY METHODS
     */
    extractDomainFromWebsite(website) {
        try {
            const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            return domain;
        } catch (error) {
            return 'unknown.com';
        }
    }

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
     * 🔄 PARSING METHODS
     */
    parseDomainHistory(content, companyData) {
        const history = {
            legacyDomains: [],
            parentDomain: null,
            status: 'Active'
        };

        const lines = content.split('\n');
        
        for (const line of lines) {
            const lower = line.toLowerCase();
            
            // Look for domain mentions
            const domainPattern = /([a-z0-9-]+\.com|[a-z0-9-]+\.net|[a-z0-9-]+\.org)/gi;
            const domains = line.match(domainPattern) || [];
            
            domains.forEach(domain => {
                if (domain !== companyData.website && !history.legacyDomains.includes(domain)) {
                    history.legacyDomains.push(domain);
                }
            });
            
            // Determine status
            if (lower.includes('discontinued') || lower.includes('retired')) {
                history.status = 'Legacy';
            } else if (lower.includes('redirects') || lower.includes('forwards')) {
                history.status = 'Redirected';
            }
        }

        return history;
    }

    parseEmailUsage(content, emailPatterns) {
        const usage = {
            currentEmail: null,
            legacyEmail: null,
            confidence: 0,
            status: 'Unknown'
        };

        // Look for email addresses in content
        const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
        const foundEmails = content.match(emailPattern) || [];

        if (foundEmails.length > 0) {
            // Prioritize emails that match our patterns
            for (const email of foundEmails) {
                if (emailPatterns.includes(email.toLowerCase())) {
                    if (!usage.currentEmail) {
                        usage.currentEmail = email.toLowerCase();
                        usage.confidence += 30;
                    } else if (!usage.legacyEmail) {
                        usage.legacyEmail = email.toLowerCase();
                        usage.confidence += 20;
                    }
                }
            }
            
            // If no pattern matches, use first found email
            if (!usage.currentEmail && foundEmails.length > 0) {
                usage.currentEmail = foundEmails[0].toLowerCase();
                usage.confidence += 15;
            }
        }

        // Determine status
        if (usage.currentEmail && usage.legacyEmail) {
            usage.status = 'Dual Email Usage';
            usage.confidence += 25;
        } else if (usage.currentEmail) {
            usage.status = 'Single Email';
            usage.confidence += 15;
        }

        return usage;
    }

    /**
     * 🔄 FALLBACK METHODS
     */
    getFallbackDomainHistory(companyData) {
        return {
            legacyDomains: [],
            parentDomain: null,
            status: 'Unknown'
        };
    }

    getFallbackEmailResearch(executive, domainAnalysis) {
        const patterns = this.generateEmailPatterns(executive.name, domainAnalysis);
        return {
            currentEmail: patterns[0] || 'research.required@company.com',
            legacyEmail: patterns[1] || null,
            confidence: 10, // Low confidence for fallback
            status: 'Generated Pattern'
        };
    }

    getFallbackEmailUsage(executive, emailPatterns) {
        return {
            currentEmail: emailPatterns[0] || null,
            legacyEmail: emailPatterns[1] || null,
            confidence: 5,
            status: 'Pattern-Based Estimate'
        };
    }

    generateFallbackEmailAnalysis(companyData) {
        return {
            company: companyData,
            currentDomain: this.extractDomainFromWebsite(companyData.website),
            legacyDomains: [],
            parentCompanyDomain: null,
            domainStatus: 'Unknown',
            ceoCurrentEmail: 'research.required@company.com',
            ceoLegacyEmail: null,
            ceoEmailConfidence: 0,
            ceoEmailStatus: 'Research Required',
            cfoCurrentEmail: 'research.required@company.com',
            cfoLegacyEmail: null,
            cfoEmailConfidence: 0,
            cfoEmailStatus: 'Research Required',
            emailTransitionStatus: 'Unknown',
            emailTransitionDate: 'Unknown',
            emailMigrationComplete: 'Unknown',
            dualEmailUsage: 'Unknown',
            primaryEmailRecommendation: 'Email research required',
            alternativeEmailRecommendation: 'No alternative emails identified',
            emailValidationNotes: 'Comprehensive email research needed',
            timestamp: new Date().toISOString()
        };
    }
}

module.exports = { EmailTransitionTracker };

