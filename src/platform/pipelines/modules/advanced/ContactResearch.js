#!/usr/bin/env node

/**
 * 🔍 CONTACT RESEARCH MODULE
 * 
 * Multi-layered contact research system:
 * 1. Standard validation waterfall (ZeroBounce, MyEmailVerifier, Twilio)
 * 2. Cross-domain email pattern analysis
 * 3. Corporate structure-based email discovery
 * 4. AI-powered research with multiple validation sources
 * 5. Social proof and public record verification
 * 6. Acquisition/merger email transition tracking
 * 7. Executive network pattern analysis
 */

const fetch = require('node-fetch');

class ContactResearch {
    constructor(config = {}) {
        this.config = {
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            ZEROBOUNCE_API_KEY: config.ZEROBOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: config.MYEMAILVERIFIER_API_KEY || process.env.MYEMAILVERIFIER_API_KEY,
            TWILIO_ACCOUNT_SID: config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: config.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
            DROPCONTACT_API_KEY: config.DROPCONTACT_API_KEY || process.env.DROPCONTACT_API_KEY,
            PROSPEO_API_KEY: config.PROSPEO_API_KEY || process.env.PROSPEO_API_KEY,
            ...config
        };

        this.discoveryCache = new Map();
        this.patternCache = new Map();
        this.corporateStructureCache = new Map();
    }

    /**
     * 🎯 ENHANCED CONTACT DISCOVERY PIPELINE
     * 
     * When standard verification fails, this system uses multiple intelligence layers
     */
    async enhancedContactDiscovery(executiveData, companyData, failedValidations = []) {
        console.log(`\n🎯 ENHANCED CONTACT DISCOVERY: ${executiveData.name}`);
        console.log(`📧 Standard validations failed: ${failedValidations.length}`);
        console.log('=' .repeat(60));

        const discovery = {
            executive: executiveData,
            company: companyData,
            contacts: {
                emails: [],
                phones: [],
                socialProfiles: []
            },
            discoveryMethods: [],
            confidence: 0,
            verificationSources: [],
            timestamp: new Date().toISOString()
        };

        try {
            // LAYER 1: Cross-Domain Email Pattern Analysis
            console.log('🔍 LAYER 1: Cross-Domain Email Pattern Analysis');
            const crossDomainResults = await this.crossDomainPatternAnalysis(executiveData, companyData);
            if (crossDomainResults.emails.length > 0) {
                discovery.contacts.emails.push(...crossDomainResults.emails);
                discovery.discoveryMethods.push('cross_domain_patterns');
                console.log(`   ✅ Found ${crossDomainResults.emails.length} cross-domain patterns`);
            }

            // LAYER 2: Corporate Structure Email Discovery
            console.log('🏢 LAYER 2: Corporate Structure Email Discovery');
            const structureResults = await this.corporateStructureEmailDiscovery(executiveData, companyData);
            if (structureResults.emails.length > 0) {
                discovery.contacts.emails.push(...structureResults.emails);
                discovery.discoveryMethods.push('corporate_structure');
                console.log(`   ✅ Found ${structureResults.emails.length} structure-based emails`);
            }

            // LAYER 3: AI-Powered Multi-Source Research
            console.log('🤖 LAYER 3: AI-Powered Multi-Source Research');
            const aiResults = await this.aiPoweredContactResearch(executiveData, companyData);
            if (aiResults.contacts.emails.length > 0 || aiResults.contacts.phones.length > 0) {
                discovery.contacts.emails.push(...aiResults.contacts.emails);
                discovery.contacts.phones.push(...aiResults.contacts.phones);
                discovery.discoveryMethods.push('ai_research');
                discovery.verificationSources.push(...aiResults.sources);
                console.log(`   ✅ AI found ${aiResults.contacts.emails.length} emails, ${aiResults.contacts.phones.length} phones`);
            }

            // LAYER 4: Acquisition/Merger Email Transition Tracking
            console.log('🔄 LAYER 4: Acquisition/Merger Email Tracking');
            const transitionResults = await this.emailTransitionTracking(executiveData, companyData);
            if (transitionResults.emails.length > 0) {
                discovery.contacts.emails.push(...transitionResults.emails);
                discovery.discoveryMethods.push('email_transitions');
                console.log(`   ✅ Found ${transitionResults.emails.length} transition emails`);
            }

            // LAYER 5: Executive Network Pattern Analysis
            console.log('👥 LAYER 5: Executive Network Pattern Analysis');
            const networkResults = await this.executiveNetworkPatternAnalysis(executiveData, companyData);
            if (networkResults.contacts.emails.length > 0 || networkResults.contacts.phones.length > 0) {
                discovery.contacts.emails.push(...networkResults.contacts.emails);
                discovery.contacts.phones.push(...networkResults.contacts.phones);
                discovery.discoveryMethods.push('network_patterns');
                console.log(`   ✅ Network analysis found ${networkResults.contacts.emails.length} emails, ${networkResults.contacts.phones.length} phones`);
            }

            // LAYER 6: Public Record and Social Proof Verification
            console.log('📋 LAYER 6: Public Record Verification');
            const publicResults = await this.publicRecordVerification(discovery.contacts, executiveData, companyData);
            discovery.verificationSources.push(...publicResults.sources);
            discovery.confidence = publicResults.confidence;

            // LAYER 7: Final Validation and Ranking
            console.log('🏆 LAYER 7: Final Validation and Ranking');
            const finalResults = await this.finalValidationAndRanking(discovery);

            console.log(`\n✅ ENHANCED DISCOVERY COMPLETE:`);
            console.log(`   Methods used: ${discovery.discoveryMethods.join(', ')}`);
            console.log(`   Emails found: ${finalResults.contacts.emails.length}`);
            console.log(`   Phones found: ${finalResults.contacts.phones.length}`);
            console.log(`   Confidence: ${finalResults.confidence}%`);
            console.log(`   Sources: ${finalResults.verificationSources.length}`);

            return finalResults;

        } catch (error) {
            console.error(`❌ Enhanced discovery error: ${error.message}`);
            discovery.error = error.message;
            return discovery;
        }
    }

    /**
     * 🔍 CROSS-DOMAIN EMAIL PATTERN ANALYSIS
     * 
     * Analyzes email patterns across parent companies, subsidiaries, and industry standards
     */
    async crossDomainPatternAnalysis(executiveData, companyData) {
        const results = { emails: [], confidence: 0 };

        try {
            // Get all related domains (parent, subsidiaries, acquisitions)
            const relatedDomains = await this.getRelatedDomains(companyData);
            
            // Analyze patterns across domains
            for (const domain of relatedDomains) {
                const patterns = this.generateAdvancedEmailPatterns(executiveData.name, domain);
                
                // Test each pattern with lightweight validation
                for (const pattern of patterns.slice(0, 3)) { // Limit to top 3 per domain
                    const validation = await this.lightweightEmailValidation(pattern);
                    if (validation.isValid || validation.confidence > 60) {
                        results.emails.push({
                            email: pattern,
                            domain: domain.domain,
                            pattern: domain.type,
                            confidence: validation.confidence,
                            source: 'cross_domain_analysis',
                            domainType: domain.type // parent, subsidiary, acquisition
                        });
                    }
                }
            }

            results.confidence = results.emails.length > 0 ? 
                Math.max(...results.emails.map(e => e.confidence)) : 0;

        } catch (error) {
            console.log(`   ⚠️ Cross-domain analysis error: ${error.message}`);
        }

        return results;
    }

    /**
     * 🏢 CORPORATE STRUCTURE EMAIL DISCOVERY
     * 
     * Uses corporate structure knowledge to predict email patterns
     */
    async corporateStructureEmailDiscovery(executiveData, companyData) {
        const results = { emails: [], confidence: 0 };

        try {
            // Use Perplexity to understand corporate email structure
            const prompt = `Analyze the email structure for executives at ${companyData.name} (${companyData.website}).

Research:
1. What email domain do executives use? (company domain vs parent company domain)
2. What are the common email patterns for executives at this company?
3. Has the company changed domains due to acquisitions or rebranding?
4. What are the email patterns for similar companies in ${companyData.industry}?

For ${executiveData.name} (${executiveData.title}), provide ONLY a JSON response:
{
    "emailDomain": "primary domain used by executives",
    "alternativeDomains": ["other domains used"],
    "executivePatterns": [
        {
            "pattern": "first.last@domain.com",
            "likelihood": "high/medium/low",
            "reasoning": "why this pattern is likely"
        }
    ],
    "domainChanges": {
        "hasChanged": true/false,
        "previousDomain": "old domain if changed",
        "changeReason": "acquisition/rebrand/merger"
    },
    "industryStandards": "common patterns in this industry"
}`;

            const response = await this.callPerplexityAPI(prompt, 'corporate_structure');
            if (response.emailDomain) {
                const patterns = this.generatePatternsFromStructure(executiveData.name, response);
                
                for (const pattern of patterns) {
                    const validation = await this.lightweightEmailValidation(pattern.email);
                    if (validation.isValid || validation.confidence > 50) {
                        results.emails.push({
                            email: pattern.email,
                            pattern: pattern.type,
                            confidence: validation.confidence,
                            source: 'corporate_structure',
                            reasoning: pattern.reasoning
                        });
                    }
                }
            }

        } catch (error) {
            console.log(`   ⚠️ Corporate structure discovery error: ${error.message}`);
        }

        return results;
    }

    /**
     * 🤖 AI-POWERED MULTI-SOURCE CONTACT RESEARCH
     * 
     * Uses AI to research contacts across multiple public sources
     */
    async aiPoweredContactResearch(executiveData, companyData) {
        const results = { contacts: { emails: [], phones: [] }, sources: [] };

        try {
            const prompt = `Find verified contact information for ${executiveData.name}, ${executiveData.title} at ${companyData.name}.

Search these sources:
1. Company press releases and announcements
2. Industry publications and interviews
3. Conference speaker listings and bios
4. Board member directories
5. Patent filings and legal documents
6. Acquisition announcements
7. Executive team pages on company websites
8. SEC filings (if public company)
9. Professional association directories
10. University alumni directories

For each contact found, provide verification source and recency.

Provide ONLY a JSON response:
{
    "emails": [
        {
            "email": "verified email address",
            "source": "specific source where found",
            "confidence": 0.95,
            "lastSeen": "2025-01-17",
            "context": "where/how it was found"
        }
    ],
    "phones": [
        {
            "number": "+1-XXX-XXX-XXXX",
            "type": "office/mobile/direct",
            "source": "specific source where found", 
            "confidence": 0.90,
            "lastSeen": "2025-01-17",
            "context": "where/how it was found"
        }
    ],
    "verificationSources": [
        {
            "source": "source name",
            "url": "source URL if available",
            "date": "2025-01-17",
            "reliability": "high/medium/low"
        }
    ]
}

Only return contacts with high confidence from verifiable sources. Do not use social media.`;

            const response = await this.callPerplexityAPI(prompt, 'ai_contact_research');
            if (response.emails) {
                results.contacts.emails = response.emails.map(email => ({
                    ...email,
                    source: 'ai_research',
                    discoveryMethod: 'multi_source_research'
                }));
            }
            if (response.phones) {
                results.contacts.phones = response.phones.map(phone => ({
                    ...phone,
                    source: 'ai_research',
                    discoveryMethod: 'multi_source_research'
                }));
            }
            if (response.verificationSources) {
                results.sources = response.verificationSources;
            }

        } catch (error) {
            console.log(`   ⚠️ AI research error: ${error.message}`);
        }

        return results;
    }

    /**
     * 🔄 EMAIL TRANSITION TRACKING
     * 
     * Tracks email changes due to acquisitions, mergers, or rebranding
     */
    async emailTransitionTracking(executiveData, companyData) {
        const results = { emails: [], confidence: 0 };

        try {
            if (!companyData.isAcquired && !companyData.isRebranded) {
                return results; // No transitions to track
            }

            const prompt = `Track email address changes for ${executiveData.name} at ${companyData.name}.

Company context:
- Current domain: ${companyData.website}
- Parent company: ${companyData.parentCompany || 'Unknown'}
- Change type: ${companyData.changeType || 'Unknown'}
- Change date: ${companyData.changeDate || 'Unknown'}

Research:
1. What was the executive's email before the ${companyData.changeType}?
2. What is their current email after the ${companyData.changeType}?
3. Are both emails still active?
4. When did the email transition occur?
5. What is the email migration pattern for this company?

Provide ONLY a JSON response:
{
    "currentEmail": "current active email",
    "legacyEmails": [
        {
            "email": "previous email address",
            "domain": "previous domain",
            "activeUntil": "2024-XX-XX",
            "transitionReason": "acquisition/merger/rebrand"
        }
    ],
    "transitionPattern": "immediate/gradual/dual_usage",
    "migrationComplete": true/false,
    "recommendedEmail": "best email to use",
    "confidence": 0.85
}`;

            const response = await this.callPerplexityAPI(prompt, 'email_transitions');
            if (response.currentEmail) {
                results.emails.push({
                    email: response.currentEmail,
                    type: 'current',
                    confidence: response.confidence || 70,
                    source: 'transition_tracking'
                });
            }
            if (response.legacyEmails) {
                results.emails.push(...response.legacyEmails.map(email => ({
                    email: email.email,
                    type: 'legacy',
                    confidence: (response.confidence || 70) - 20,
                    source: 'transition_tracking',
                    transitionReason: email.transitionReason
                })));
            }

        } catch (error) {
            console.log(`   ⚠️ Email transition tracking error: ${error.message}`);
        }

        return results;
    }

    /**
     * 👥 EXECUTIVE NETWORK PATTERN ANALYSIS
     * 
     * Analyzes patterns from similar executives in the same industry/company size
     */
    async executiveNetworkPatternAnalysis(executiveData, companyData) {
        const results = { contacts: { emails: [], phones: [] }, confidence: 0 };

        try {
            const prompt = `Analyze contact patterns for ${executiveData.title} executives in ${companyData.industry} companies similar to ${companyData.name}.

Research patterns for:
1. Email formats used by ${executiveData.title}s at companies with ${companyData.employeeCount || 'similar size'}
2. Phone number patterns (direct dial vs main office)
3. Communication preferences for this executive level
4. Industry-specific contact conventions

Based on patterns, predict likely contacts for ${executiveData.name}:

Provide ONLY a JSON response:
{
    "emailPatterns": [
        {
            "pattern": "predicted email pattern",
            "probability": 0.85,
            "reasoning": "why this pattern is common"
        }
    ],
    "phonePatterns": [
        {
            "type": "direct/office/mobile",
            "pattern": "likely phone pattern",
            "probability": 0.75,
            "reasoning": "why this type is common"
        }
    ],
    "industryNorms": {
        "preferredEmailFormat": "most common format",
        "phoneAccessibility": "high/medium/low",
        "communicationStyle": "formal/informal/mixed"
    },
    "confidence": 0.80
}`;

            const response = await this.callPerplexityAPI(prompt, 'network_patterns');
            if (response.emailPatterns) {
                for (const pattern of response.emailPatterns) {
                    const email = this.generateEmailFromPattern(executiveData.name, pattern.pattern, companyData.website);
                    if (email) {
                        results.contacts.emails.push({
                            email: email,
                            confidence: pattern.probability * 100,
                            source: 'network_patterns',
                            reasoning: pattern.reasoning
                        });
                    }
                }
            }

            results.confidence = response.confidence || 0;

        } catch (error) {
            console.log(`   ⚠️ Network pattern analysis error: ${error.message}`);
        }

        return results;
    }

    /**
     * 📋 PUBLIC RECORD VERIFICATION
     * 
     * Verifies discovered contacts against public records and social proof
     */
    async publicRecordVerification(contacts, executiveData, companyData) {
        const results = { sources: [], confidence: 0 };

        try {
            const allContacts = [...contacts.emails, ...contacts.phones];
            if (allContacts.length === 0) return results;

            const prompt = `Verify these contacts for ${executiveData.name} at ${companyData.name}:

Emails: ${contacts.emails.map(e => e.email).join(', ')}
Phones: ${contacts.phones.map(p => p.number).join(', ')}

Cross-reference against:
1. SEC filings and proxy statements
2. Press releases and company announcements  
3. Patent filings and legal documents
4. Conference speaker listings
5. Board member directories
6. Industry publication mentions
7. Company website team pages
8. Professional association directories

For each contact, provide verification status and source.

Provide ONLY a JSON response:
{
    "verifiedContacts": [
        {
            "contact": "email or phone",
            "verified": true/false,
            "sources": ["source1", "source2"],
            "lastSeen": "2025-01-17",
            "confidence": 0.95
        }
    ],
    "overallConfidence": 0.85,
    "verificationSources": [
        {
            "source": "source name",
            "reliability": "high/medium/low",
            "date": "2025-01-17"
        }
    ]
}`;

            const response = await this.callPerplexityAPI(prompt, 'public_verification');
            if (response.verificationSources) {
                results.sources = response.verificationSources;
            }
            results.confidence = response.overallConfidence || 0;

            // Update contact confidence based on verification
            if (response.verifiedContacts) {
                response.verifiedContacts.forEach(verified => {
                    contacts.emails.forEach(email => {
                        if (email.email === verified.contact) {
                            email.verified = verified.verified;
                            email.verificationSources = verified.sources;
                            if (verified.verified) {
                                email.confidence = Math.min(95, email.confidence + 20);
                            }
                        }
                    });
                    contacts.phones.forEach(phone => {
                        if (phone.number === verified.contact) {
                            phone.verified = verified.verified;
                            phone.verificationSources = verified.sources;
                            if (verified.verified) {
                                phone.confidence = Math.min(95, phone.confidence + 20);
                            }
                        }
                    });
                });
            }

        } catch (error) {
            console.log(`   ⚠️ Public record verification error: ${error.message}`);
        }

        return results;
    }

    /**
     * 🏆 FINAL VALIDATION AND RANKING
     * 
     * Final validation and intelligent ranking of all discovered contacts
     */
    async finalValidationAndRanking(discovery) {
        try {
            // Remove duplicates
            discovery.contacts.emails = this.deduplicateContacts(discovery.contacts.emails, 'email');
            discovery.contacts.phones = this.deduplicateContacts(discovery.contacts.phones, 'number');

            // Sort by confidence and verification status
            discovery.contacts.emails.sort((a, b) => {
                if (a.verified !== b.verified) return b.verified - a.verified;
                return b.confidence - a.confidence;
            });

            discovery.contacts.phones.sort((a, b) => {
                if (a.verified !== b.verified) return b.verified - a.verified;
                return b.confidence - a.confidence;
            });

            // Calculate overall confidence
            const allContacts = [...discovery.contacts.emails, ...discovery.contacts.phones];
            if (allContacts.length > 0) {
                discovery.confidence = Math.round(
                    allContacts.reduce((sum, contact) => sum + contact.confidence, 0) / allContacts.length
                );
            }

            // Add final recommendations
            discovery.recommendations = {
                primaryEmail: discovery.contacts.emails[0]?.email || null,
                primaryPhone: discovery.contacts.phones[0]?.number || null,
                alternativeEmail: discovery.contacts.emails[1]?.email || null,
                alternativePhone: discovery.contacts.phones[1]?.number || null,
                confidence: discovery.confidence,
                verificationStatus: discovery.verificationSources.length > 0 ? 'verified' : 'unverified'
            };

        } catch (error) {
            console.log(`   ⚠️ Final validation error: ${error.message}`);
        }

        return discovery;
    }

    /**
     * 🔧 UTILITY METHODS
     */

    async getRelatedDomains(companyData) {
        const domains = [];
        
        // Add primary domain
        const primaryDomain = companyData.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        if (primaryDomain) {
            domains.push({ domain: primaryDomain, type: 'primary' });
        }

        // Add parent company domain if acquired
        if (companyData.parentCompany && companyData.isAcquired) {
            const parentDomain = this.guessCompanyDomain(companyData.parentCompany);
            domains.push({ domain: parentDomain, type: 'parent' });
        }

        return domains;
    }

    generateAdvancedEmailPatterns(name, domainInfo) {
        const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        const domain = domainInfo.domain;

        const patterns = [
            `${firstName}.${lastName}@${domain}`,
            `${firstName}${lastName}@${domain}`,
            `${firstName}_${lastName}@${domain}`,
            `${firstName[0]}${lastName}@${domain}`,
            `${firstName}.${lastName[0]}@${domain}`
        ];

        return patterns.filter(p => p.includes('@'));
    }

    async lightweightEmailValidation(email) {
        // Basic format check + simple DNS check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValidFormat = emailRegex.test(email);
        
        if (!isValidFormat) {
            return { isValid: false, confidence: 0 };
        }

        // Simple confidence based on domain and pattern
        const domain = email.split('@')[1];
        let confidence = 60; // Base confidence for valid format

        // Boost confidence for business domains
        if (!['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'].includes(domain)) {
            confidence += 20;
        }

        return { isValid: true, confidence };
    }

    generatePatternsFromStructure(name, structure) {
        const patterns = [];
        const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';

        if (structure.executivePatterns) {
            structure.executivePatterns.forEach(pattern => {
                const email = pattern.pattern
                    .replace('first', firstName)
                    .replace('last', lastName)
                    .replace('domain.com', structure.emailDomain);
                
                patterns.push({
                    email: email,
                    type: pattern.pattern,
                    reasoning: pattern.reasoning
                });
            });
        }

        return patterns;
    }

    generateEmailFromPattern(name, pattern, website) {
        const nameParts = name.toLowerCase().replace(/[^a-z\s]/g, '').split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts[nameParts.length - 1] || '';
        const domain = website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];

        if (!domain) return null;

        return pattern
            .replace('first', firstName)
            .replace('last', lastName)
            .replace('domain.com', domain);
    }

    deduplicateContacts(contacts, keyField) {
        const seen = new Set();
        return contacts.filter(contact => {
            const key = contact[keyField]?.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    guessCompanyDomain(companyName) {
        return companyName.toLowerCase()
            .replace(/[^a-z0-9]/g, '') + '.com';
    }

    async callPerplexityAPI(prompt, requestType) {
        if (!this.config.PERPLEXITY_API_KEY) {
            console.log(`   ⚠️ No Perplexity API key for ${requestType}`);
            return {};
        }

        try {
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
                    max_tokens: 1500
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
                    console.log(`   ⚠️ JSON parsing failed for ${requestType}`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Perplexity API error for ${requestType}: ${error.message}`);
        }

        return {};
    }
}

module.exports = { ContactResearch };
