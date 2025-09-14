#!/usr/bin/env node

/**
 * ✅ CONTACT VALIDATOR MODULE
 * 
 * Validates executive contact information:
 * 1. Email generation with multiple pattern testing
 * 2. Phone number discovery and validation
 * 3. Professional profile links (excluding LinkedIn per compliance)
 * 4. Contact validation and verification
 * 5. Acquisition-aware domain handling
 */

const fetch = require('node-fetch');
const { ContactResearch } = require('../advanced/ContactResearch');
// const { DomainAnalysis } = require('./DomainAnalysis'); // Commented out - using inline domain logic

class ContactValidator {
    constructor(config = {}) {
        this.config = {
            ZEROBOUNCE_API_KEY: config.ZEROBOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: config.MYEMAILVERIFIER_API_KEY || process.env.MYEMAILVERIFIER_API_KEY,
            DROPCONTACT_API_KEY: config.DROPCONTACT_API_KEY || process.env.DROPCONTACT_API_KEY,
            PROSPEO_API_KEY: config.PROSPEO_API_KEY || process.env.PROSPEO_API_KEY,
            LUSHA_API_KEY: config.LUSHA_API_KEY || process.env.LUSHA_API_KEY,
            TWILIO_ACCOUNT_SID: config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: config.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.contactCache = new Map();
        this.emailPatterns = this.initializeEmailPatterns();
        this.contactResearch = new ContactResearch(this.config);
        this.enhancedDiscovery = this.contactResearch; // Use ContactResearch for enhanced discovery
        // this.domainAnalysis = new DomainAnalysis(this.config); // Using inline domain logic
    }

    /**
     * 📧 ENHANCED CONTACT ENRICHMENT - 95% ACCURACY TARGET
     */
    async enrichContacts(executiveDetection, companyResolution) {
        console.log(`\n📧 ENHANCED CONTACT ENRICHMENT: ${companyResolution.companyName}`);
        console.log('=' .repeat(60));

        const result = {
            companyName: companyResolution.companyName,
            domain: this.selectEmailDomain(companyResolution),
            enrichedExecutives: {
                ceo: null,
                cfo: null,
                cro: null
            },
            enrichmentStats: {
                emailsGenerated: 0,
                emailsValidated: 0,
                phonesFound: 0,
                profilesFound: 0,
                totalCost: 0,
                accuracyScore: 0
            },
            timestamp: new Date().toISOString()
        };

        try {
            // Handle dual domain testing for acquisitions
            if (typeof result.domain === 'object' && result.domain.testBoth) {
                console.log(`📍 ACQUISITION DETECTED: Testing both ${result.domain.primary} and ${result.domain.fallback}`);
            } else {
                console.log(`📍 Using email domain: ${result.domain}`);
            }

            // Handle different input formats - support both old and new formats
            let cfoExecutive = null;
            let croExecutive = null;
            let ceoExecutive = null;

            // New format from EnhancedExecutiveResearch
            if (executiveDetection.cfo) {
                cfoExecutive = executiveDetection.cfo;
            }
            if (executiveDetection.cro) {
                croExecutive = executiveDetection.cro;
            }

            // Old format compatibility
            if (executiveDetection.executives) {
                if (executiveDetection.executives.cfo) {
                    cfoExecutive = executiveDetection.executives.cfo;
                }
                if (executiveDetection.executives.cro) {
                    croExecutive = executiveDetection.executives.cro;
                }
                if (executiveDetection.executives.ceo) {
                    ceoExecutive = executiveDetection.executives.ceo;
                }
            }

            // Enrich CEO contacts
            if (ceoExecutive) {
                console.log('\n👨‍💼 ENRICHING CEO CONTACTS');
                result.enrichedExecutives.ceo = await this.enrichExecutiveContacts(
                    ceoExecutive,
                    result.domain,
                    companyResolution
                );
                this.updateStats(result.enrichmentStats, result.enrichedExecutives.ceo);
            }

            // Enrich CFO contacts
            if (cfoExecutive && cfoExecutive.name) {
                console.log('\n💰 ENRICHING CFO CONTACTS');
                result.enrichedExecutives.cfo = await this.enrichExecutiveContacts(
                    cfoExecutive,
                    result.domain,
                    companyResolution
                );
                this.updateStats(result.enrichmentStats, result.enrichedExecutives.cfo);
            } else {
                console.log('\n💰 CFO NOT FOUND IN RESEARCH - Searching CoreSignal executives...');
                // Search CoreSignal executives for CFO
                const cfoFromCoreSignal = await this.findCFOInCoreSignalExecutives(companyResolution);
                if (cfoFromCoreSignal) {
                    console.log(`   ✅ Found CFO in CoreSignal: ${cfoFromCoreSignal.name}`);
                    result.enrichedExecutives.cfo = await this.enrichExecutiveContacts(
                        cfoFromCoreSignal,
                        result.domain,
                        companyResolution
                    );
                    this.updateStats(result.enrichmentStats, result.enrichedExecutives.cfo);
                }
            }

            // Enrich CRO contacts
            if (croExecutive && croExecutive.name) {
                console.log('\n📈 ENRICHING CRO CONTACTS');
                result.enrichedExecutives.cro = await this.enrichExecutiveContacts(
                    croExecutive,
                    result.domain,
                    companyResolution
                );
                this.updateStats(result.enrichmentStats, result.enrichedExecutives.cro);
            } else {
                console.log('\n📈 CRO NOT FOUND IN RESEARCH - Searching CoreSignal executives...');
                // Search CoreSignal executives for CRO
                const croFromCoreSignal = await this.findCROInCoreSignalExecutives(companyResolution);
                if (croFromCoreSignal) {
                    console.log(`   ✅ Found CRO in CoreSignal: ${croFromCoreSignal.name}`);
                    result.enrichedExecutives.cro = await this.enrichExecutiveContacts(
                        croFromCoreSignal,
                        result.domain,
                        companyResolution
                    );
                    this.updateStats(result.enrichmentStats, result.enrichedExecutives.cro);
                }
            }



            // ENHANCED DISCOVERY: If low success rate, use advanced methods
            const successRate = this.calculateSuccessRate(result);
            if (successRate < 70) {
                console.log(`\n🎯 SUCCESS RATE LOW (${successRate}%) - ACTIVATING ENHANCED DISCOVERY`);
                const failedValidations = this.collectFailedValidations(result);
                const enhancedResults = await this.enhancedDiscovery.enhancedContactDiscovery(
                    executiveDetection.executives.ceo || executiveDetection.executives.cfo,
                    companyResolution,
                    failedValidations
                );
                
                // Merge enhanced results
                if (enhancedResults.contacts.emails.length > 0) {
                    result.enrichedExecutives.ceo = result.enrichedExecutives.ceo || {};
                    result.enrichedExecutives.ceo.contacts = result.enrichedExecutives.ceo.contacts || { emails: [], phones: [], profiles: [] };
                    result.enrichedExecutives.ceo.contacts.emails.push(...enhancedResults.contacts.emails);
                    result.enrichmentStats.emailsGenerated += enhancedResults.contacts.emails.length;
                }
                
                if (enhancedResults.contacts.phones.length > 0) {
                    result.enrichedExecutives.ceo = result.enrichedExecutives.ceo || {};
                    result.enrichedExecutives.ceo.contacts = result.enrichedExecutives.ceo.contacts || { emails: [], phones: [], profiles: [] };
                    result.enrichedExecutives.ceo.contacts.phones.push(...enhancedResults.contacts.phones);
                    result.enrichmentStats.phonesFound += enhancedResults.contacts.phones.length;
                }
                
                result.enhancedDiscoveryUsed = true;
                result.enhancedDiscoveryMethods = enhancedResults.discoveryMethods;
                result.enhancedDiscoveryConfidence = enhancedResults.confidence;
                
                console.log(`   🚀 Enhanced discovery added ${enhancedResults.contacts.emails.length} emails, ${enhancedResults.contacts.phones.length} phones`);
            }

            console.log(`\n✅ CONTACT ENRICHMENT COMPLETE`);
            console.log(`   Emails generated: ${result.enrichmentStats.emailsGenerated}`);
            console.log(`   Emails validated: ${result.enrichmentStats.emailsValidated}`);
            console.log(`   Phones found: ${result.enrichmentStats.phonesFound}`);
            if (result.enhancedDiscoveryUsed) {
                console.log(`   🎯 Enhanced discovery: ${result.enhancedDiscoveryMethods.join(', ')}`);
                console.log(`   🎯 Enhanced confidence: ${result.enhancedDiscoveryConfidence}%`);
            }

            // Calculate final accuracy score
            result.enrichmentStats.accuracyScore = this.calculateOverallAccuracy(result);
            
            console.log(`\n📊 FINAL ENRICHMENT RESULTS:`);
            console.log(`   Overall Accuracy: ${result.enrichmentStats.accuracyScore.toFixed(1)}%`);
            console.log(`   Target: 95% - ${result.enrichmentStats.accuracyScore >= 95 ? '✅ TARGET MET' : '❌ NEEDS IMPROVEMENT'}`);
            console.log(`   Total Cost: $${result.enrichmentStats.totalCost.toFixed(4)}`);

            return result;

        } catch (error) {
            console.error(`❌ Contact enrichment failed: ${error.message}`);
            result.error = error.message;
            result.enrichmentStats.accuracyScore = 0;
            return result;
        }
    }

    /**
     * 👔 ENRICH INDIVIDUAL EXECUTIVE CONTACTS
     */
    async enrichExecutiveContacts(executive, domain, companyResolution) {
        const enriched = {
            ...executive,
            contacts: {
                emails: [],
                phones: [],
                profiles: []
            },
            enrichmentNotes: []
        };

        // STEP 1: Smart Domain Analysis
        console.log(`   🎯 Analyzing email domain for ${executive.name}...`);
        const domainAnalysis = { executiveEmailDomain: domain, confidence: 80 }; // Simplified domain analysis
        
        // STEP 2: Email Discovery - Prioritize CoreSignal API data
        let emails = [];
        
        // Check if executive has verified email from CoreSignal
        if (executive.email && executive.email.includes('@')) {
            console.log(`   📧 Email present: ${executive.email} - Using VALIDATION flow (ZeroBounce → MyEmailVerifier)`);
            const validation = await this.validateEmail(executive.email);
            emails.push({
                email: executive.email,
                source: executive.source || 'provided',
                isValid: validation.isValid,
                confidence: validation.confidence,
                validationResult: validation.result,
                cost: validation.cost || 0.002
            });
            
            // Add additional emails if available
            if (executive.emails && executive.emails.length > 0) {
                for (const emailObj of executive.emails.slice(0, 2)) {
                    if (emailObj.professional_email && emailObj.professional_email !== executive.email) {
                        emails.push({
                            email: emailObj.professional_email,
                            isValid: true,
                            confidence: 90 - (emailObj.order_of_priority * 5),
                            source: 'CoreSignal Employee API (Alternative)',
                            validation: { result: 'api_verified', isValid: true }
                        });
                    }
                }
            }
        } else {
            // Email missing - Check if acquisition requires dual domain testing
            if (typeof domain === 'object' && domain.testBoth) {
                console.log(`   🔍 ACQUISITION: Testing both domains for ${executive.name}`);
                emails = await this.testBothDomainsForAcquisition(executive, domain, companyResolution);
            } else {
                // Standard discovery flow (Prospeo → DropContact → Lusha)
                console.log(`   🔍 Email missing for ${executive.name} - Using DISCOVERY flow`);
                const discoveredEmail = await this.discoverEmailFlow(executive.name, companyResolution.companyName, domain);
                if (discoveredEmail?.email) {
                    emails.push(discoveredEmail);
                } else {
                    // Try Lusha for email discovery as well
                    console.log(`   📧 Trying Lusha for email discovery...`);
                    const lushaEmails = await this.extractLushaEmails(executive.name, companyResolution.companyName);
                    if (lushaEmails.length > 0) {
                        emails.push(...lushaEmails);
                    }
                }
                
                if (emails.length === 0) {
                    // Final fallback: Generate patterns and validate
                    console.log(`   📧 Discovery failed - Generating email patterns for ${executive.name}...`);
                    const smartDomain = domainAnalysis.executiveEmailDomain || domain;
                    console.log(`   📍 Using domain: ${smartDomain} (confidence: ${domainAnalysis.confidence}%)`);
                    emails = await this.generateAndValidateEmails(executive.name, smartDomain);
                }
            }
        }
        
        enriched.contacts.emails = emails;
        
        if (emails.length > 0) {
            const validEmails = emails.filter(e => e.isValid).length;
            console.log(`   ✅ Generated ${emails.length} emails, ${validEmails} validated`);
            enriched.enrichmentNotes.push(`${emails.length} email patterns generated, ${validEmails} validated`);
        }

        // STEP 3: Phone Flow - Follow your optimized sequence (Twilio → Lusha for mobiles)
        console.log(`   📱 Phone discovery flow - Twilio Lookup first ($0.008) → Lusha for mobiles ($0.08/record)`);
        const phoneResult = await this.optimizedPhoneFlow(executive.name, companyResolution.companyName, executive);
        enriched.contacts.phones = phoneResult.phones;
        
        if (phoneResult.phones.length > 0) {
            console.log(`   ✅ Found ${phoneResult.phones.length} phone numbers`);
            enriched.enrichmentNotes.push(`${phoneResult.phones.length} phone numbers found`);
        }

        // STEP 4: LinkedIn Extraction (from Lusha data)
        if (phoneResult.linkedIn) {
            console.log(`   🔗 Extracting LinkedIn from Lusha data: ${phoneResult.linkedIn.linkedIn}`);
            enriched.linkedIn = phoneResult.linkedIn.linkedIn;
            enriched.linkedInSource = phoneResult.linkedIn.source;
            enriched.linkedInConfidence = phoneResult.linkedIn.confidence;
        }

        // STEP 4.5: COMPREHENSIVE LUSHA DATA EXTRACTION
        // Extract all available Lusha data for maximum value from API calls
        if (phoneResult.comprehensiveLushaData) {
            console.log(`   📊 Extracting comprehensive Lusha data for ${executive.name}...`);
            enriched.lushaEnrichment = phoneResult.comprehensiveLushaData;
            
            // Enhance executive data with Lusha professional info
            if (phoneResult.comprehensiveLushaData.professionalInfo) {
                const profInfo = phoneResult.comprehensiveLushaData.professionalInfo;
                enriched.enhancedProfessionalInfo = {
                    seniority: profInfo.seniority,
                    department: profInfo.department,
                    function: profInfo.function,
                    managementLevel: profInfo.managementLevel,
                    yearsInRole: profInfo.yearsInRole,
                    yearsAtCompany: profInfo.yearsAtCompany,
                    previousRoles: profInfo.previousRoles || []
                };
                console.log(`   ✅ Enhanced with seniority: ${profInfo.seniority}, department: ${profInfo.department}`);
            }

            // Add company intelligence from Lusha
            if (phoneResult.comprehensiveLushaData.companyInfo) {
                const compInfo = phoneResult.comprehensiveLushaData.companyInfo;
                enriched.lushaCompanyIntel = {
                    companySize: compInfo.companySize,
                    companyIndustry: compInfo.companyIndustry,
                    companyType: compInfo.companyType,
                    companyRevenue: compInfo.companyRevenue,
                    companyLocation: compInfo.companyLocation
                };
            }

            // Add skills and education data
            if (phoneResult.comprehensiveLushaData.skillsInfo) {
                enriched.skillsData = phoneResult.comprehensiveLushaData.skillsInfo;
            }

            if (phoneResult.comprehensiveLushaData.educationInfo) {
                enriched.educationData = phoneResult.comprehensiveLushaData.educationInfo;
            }
        }

        // STEP 5: Professional Profiles (NO LINKEDIN per compliance)
        console.log(`   🔗 Finding professional profiles (no LinkedIn)...`);
        const profiles = await this.findProfessionalProfiles(executive.name, companyResolution.companyName);
        enriched.contacts.profiles = profiles;
        
        if (profiles.length > 0) {
            console.log(`   ✅ Found ${profiles.length} professional profiles`);
            enriched.enrichmentNotes.push(`${profiles.length} professional profiles found`);
        }

        return enriched;
    }

    /**
     * 🌐 SELECT EMAIL DOMAIN (Multi-Domain Aware)
     */
    selectEmailDomain(companyResolution) {
        // For acquired companies, determine which domain to use for emails
        if (companyResolution.isAcquired) {
            const acquisitionType = companyResolution.acquisitionInfo?.acquisitionType;
            
            if (acquisitionType === 'full_acquisition' || acquisitionType === 'merger') {
                const originalDomain = companyResolution.finalUrl
                    ?.replace(/^https?:\/\//, '')
                    ?.replace(/^www\./, '')
                    ?.split('/')[0];
                const parentDomain = this.extractDomainFromCompany(companyResolution.parentCompany?.name);
                
                console.log(`   🏢 ACQUISITION: Testing BOTH domains - Original: ${originalDomain}, Parent: ${parentDomain}`);
                
                // Return both domains for testing
                return {
                    primary: parentDomain || originalDomain,
                    fallback: originalDomain,
                    testBoth: true,
                    acquisitionType: acquisitionType,
                    acquisitionDate: companyResolution.acquisitionInfo?.acquisitionDate
                };
            }
            // For subsidiaries, might still use original domain
        }

        // Check for multi-domain companies (based on research findings)
        const multiDomainCompanies = this.getMultiDomainCompanies(companyResolution);
        if (multiDomainCompanies) {
            console.log(`   🌐 MULTI-DOMAIN: Company uses multiple domains - Primary: ${multiDomainCompanies.primary}, Secondary: ${multiDomainCompanies.secondary}`);
            return {
                primary: multiDomainCompanies.primary,
                secondary: multiDomainCompanies.secondary,
                testBoth: true,
                multiDomain: true,
                reason: multiDomainCompanies.reason
            };
        }

        // Extract domain from available sources
        let domain = null;
        
        // Try finalUrl first
        if (companyResolution.finalUrl) {
            domain = companyResolution.finalUrl
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0];
        }
        // Fallback to website
        else if (companyResolution.website) {
            domain = companyResolution.website
                .replace(/^https?:\/\//, '')
                .replace(/^www\./, '')
                .split('/')[0];
        }
        // Fallback to domain property
        else if (companyResolution.domain) {
            domain = companyResolution.domain;
        }
        // Last resort: generate from company name
        else if (companyResolution.companyName) {
            domain = companyResolution.companyName
                .toLowerCase()
                .replace(/[^a-z0-9]/g, '')
                .substring(0, 10) + '.com';
        }

        return domain || 'unknown.com';
    }

    /**
     * 🏢 GET MULTI-DOMAIN COMPANIES (Based on Research Findings)
     */
    getMultiDomainCompanies(companyResolution) {
        const companyName = companyResolution.companyName?.toLowerCase();
        const domain = companyResolution.finalUrl
            ?.replace(/^https?:\/\//, '')
            ?.replace(/^www\./, '')
            ?.split('/')[0];

        // Multi-domain companies identified from research
        const multiDomainMap = {
            'gs lab': {
                primary: 'gavstech.com',
                secondary: 'kudu.co',
                reason: 'GS Lab/GAVS uses both gavstech.com and kudu.co domains'
            },
            'gavs': {
                primary: 'gavstech.com',
                secondary: 'kudu.co',
                reason: 'GAVS uses both gavstech.com and kudu.co domains'
            },
            'oneadvanced': {
                primary: 'oneadvanced.com',
                secondary: 'advanced365.com',
                reason: 'OneAdvanced uses both oneadvanced.com and advanced365.com domains'
            },
            'advanced365': {
                primary: 'oneadvanced.com',
                secondary: 'advanced365.com',
                reason: 'OneAdvanced uses both oneadvanced.com and advanced365.com domains'
            }
        };

        // Check if current company matches multi-domain pattern
        for (const [key, config] of Object.entries(multiDomainMap)) {
            if (companyName?.includes(key) || domain?.includes(key)) {
                return config;
            }
        }

        return null;
    }

    /**
     * 📧 EMAIL GENERATION AND VALIDATION (Multi-Domain Enhanced)
     */
    async generateAndValidateEmails(fullName, domain) {
        const emails = [];
        const nameParts = this.parseFullName(fullName);
        
        if (!nameParts.firstName || !nameParts.lastName) {
            return emails;
        }

        // Handle multi-domain testing
        if (typeof domain === 'object' && domain.testBoth) {
            console.log(`   🌐 MULTI-DOMAIN TESTING: Testing both domains for ${fullName}`);
            
            // Test primary domain
            if (domain.primary) {
                console.log(`   🔍 Testing primary domain: ${domain.primary}`);
                const primaryEmails = await this.generateAndValidateEmailsForDomain(fullName, domain.primary, nameParts, 'primary');
                emails.push(...primaryEmails);
            }
            
            // Test secondary/fallback domain
            if (domain.secondary || domain.fallback) {
                const secondaryDomain = domain.secondary || domain.fallback;
                console.log(`   🔍 Testing secondary domain: ${secondaryDomain}`);
                const secondaryEmails = await this.generateAndValidateEmailsForDomain(fullName, secondaryDomain, nameParts, 'secondary');
                emails.push(...secondaryEmails);
            }
        } else {
            // Single domain testing
            const singleDomainEmails = await this.generateAndValidateEmailsForDomain(fullName, domain, nameParts, 'single');
            emails.push(...singleDomainEmails);
        }

        // Sort by confidence and domain priority
        emails.sort((a, b) => {
            // Primary domain emails get priority
            if (a.domainType === 'primary' && b.domainType !== 'primary') return -1;
            if (b.domainType === 'primary' && a.domainType !== 'primary') return 1;
            // Then sort by confidence
            return b.confidence - a.confidence;
        });
        
        return emails;
    }

    /**
     * 📧 GENERATE AND VALIDATE EMAILS FOR SPECIFIC DOMAIN
     */
    async generateAndValidateEmailsForDomain(fullName, domain, nameParts, domainType) {
        const emails = [];
        
        // Generate email patterns with intelligent domain analysis
        const patterns = await this.generateEmailPatterns(nameParts, domain, 'Unknown Company');
        
        // Validate each pattern
        console.log(`   🔍 DEBUG: Generated ${patterns.length} email patterns for ${domain}: ${patterns.join(', ')}`);
        for (const pattern of patterns) {
            try {
                console.log(`   🔍 DEBUG: Testing email pattern: ${pattern}`);
                const validation = await this.validateEmail(pattern);
                console.log(`   🔍 DEBUG: Validation result for ${pattern}: Valid=${validation.isValid}, Confidence=${validation.confidence}%`);
                emails.push({
                    email: pattern,
                    pattern: this.getPatternName(pattern, nameParts),
                    isValid: validation.isValid,
                    confidence: validation.confidence,
                    validationResult: validation.result,
                    source: 'generated',
                    domainType: domainType,
                    domain: domain
                });
                
                // Rate limiting
                await this.delay(100);
                
            } catch (error) {
                emails.push({
                    email: pattern,
                    pattern: this.getPatternName(pattern, nameParts),
                    isValid: false,
                    confidence: 0,
                    validationResult: 'validation_failed',
                    source: 'generated',
                    domainType: domainType,
                    domain: domain,
                    error: error.message
                });
            }
        }
        
        return emails;
    }

    /**
     * 🔤 PARSE FULL NAME
     */
    parseFullName(fullName) {
        const parts = fullName.trim().split(/\s+/);
        
        return {
            firstName: parts[0]?.toLowerCase() || '',
            lastName: parts[parts.length - 1]?.toLowerCase() || '',
            middleName: parts.length > 2 ? parts.slice(1, -1).join(' ').toLowerCase() : '',
            fullName: fullName
        };
    }

    /**
     * 📧 GENERATE EMAIL PATTERNS (INTELLIGENT)
     */
    async generateEmailPatterns(nameParts, domain, companyName = 'Unknown Company') {
        // INTELLIGENT DOMAIN CORRECTION: AI-driven subdomain analysis
        const correctedDomain = await this.correctEmailDomain(domain, companyName);
        if (correctedDomain !== domain) {
            console.log(`   🎯 Domain correction: ${domain} → ${correctedDomain}`);
        }

        const { firstName, lastName, middleName } = nameParts;
        const patterns = [];

        // Standard patterns with corrected domain
        if (firstName && lastName) {
            patterns.push(`${firstName}.${lastName}@${correctedDomain}`);
            patterns.push(`${firstName}${lastName}@${correctedDomain}`);
            patterns.push(`${firstName}_${lastName}@${correctedDomain}`);
            patterns.push(`${firstName}-${lastName}@${correctedDomain}`);
            patterns.push(`${firstName[0]}${lastName}@${correctedDomain}`);
            patterns.push(`${firstName}${lastName[0]}@${correctedDomain}`);
            patterns.push(`${firstName[0]}.${lastName}@${correctedDomain}`);
            patterns.push(`${firstName}.${lastName[0]}@${correctedDomain}`);
        }

        // Executive-specific patterns (use original domain as fallback)
        if (firstName) {
            patterns.push(`${firstName}@${domain}`);
        }
        if (lastName) {
            patterns.push(`${lastName}@${domain}`);
        }

        // Middle name patterns
        if (middleName) {
            patterns.push(`${firstName}.${middleName[0]}.${lastName}@${domain}`);
            patterns.push(`${firstName}${middleName[0]}${lastName}@${domain}`);
        }

        // Remove duplicates and return
        return [...new Set(patterns)];
    }

    /**
     * 📧 GENERATE AND VALIDATE EMAILS WITH DOMAIN INTELLIGENCE
     * 
     * Uses smart domain analysis to generate more accurate email patterns
     */
    async generateAndValidateEmailsWithDomainIntelligence(fullName, smartDomain, domainAnalysis) {
        const emails = [];
        const nameParts = this.parseFullName(fullName);
        
        if (!nameParts.firstName || !nameParts.lastName) {
            return emails;
        }

        // Generate smart patterns using domain intelligence
        const smartPatterns = this.domainIntelligence.generateSmartEmailPatterns(fullName, domainAnalysis);
        
        // Use intelligent domain analysis for all companies
        const intelligentPatterns = await this.generateEmailPatterns(nameParts, smartDomain, fullName.split(' ').slice(-1)[0] || 'Unknown Company');
        
        for (const pattern of intelligentPatterns.slice(0, 8)) { // Limit to top 8
            try {
                const validation = await this.validateEmail(pattern);
                emails.push({
                    email: pattern,
                    pattern: 'intelligent_domain_pattern',
                    isValid: validation.isValid,
                    confidence: validation.confidence,
                    validationResult: validation.result,
                    source: 'intelligent_domain_analysis',
                    domainIntelligence: true
                });
                
                await this.delay(100); // Rate limiting
            } catch (error) {
                emails.push({
                    email: pattern,
                    pattern: 'intelligent_domain_pattern',
                    isValid: false,
                    confidence: 0,
                    validationResult: 'validation_failed',
                    source: 'intelligent_domain_analysis',
                    error: error.message
                });
            }
        }

        // Sort by confidence and validation status
        emails.sort((a, b) => {
            if (a.isValid !== b.isValid) return b.isValid - a.isValid;
            return b.confidence - a.confidence;
        });
        
        return emails;
    }

    /**
     * ✅ OPTIMIZED EMAIL VALIDATION FLOW
     * 
     * Your specified flow:
     * If email present → ZeroBounce (preferred for DPA/Enterprise) or MyEmailVerifier ($0.002–$0.0039)
     * If email missing → Prospeo ($0.0198/verified) → else DropContact (≥20k tier ≲$0.02/email)
     */
    async validateEmail(email) {
        console.log(`   🔍 DEBUG: Starting email validation flow for: ${email}`);
        
        try {
            // STEP 1: If email exists, validate with ZeroBounce (preferred) or MyEmailVerifier
            if (email && email.includes('@')) {
                console.log(`   📧 Email present - Using validation flow (ZeroBounce → MyEmailVerifier)`);
                
                // PRIMARY: ZeroBounce (preferred for DPA/Enterprise compliance)
                if (this.config.ZEROBOUNCE_API_KEY) {
                    console.log(`   🔍 Validating with ZeroBounce (DPA compliant, better for Enterprise)...`);
                    const zbResult = await this.validateWithZeroBounce(email);
                    
                    if (zbResult.confidence >= 70) {
                        console.log(`   ✅ ZeroBounce result: ${zbResult.result} (${zbResult.confidence}%)`);
                        return zbResult;
                    }
                }
                
                // FALLBACK: MyEmailVerifier (higher accuracy, cheaper at scale)
                if (this.config.MYEMAILVERIFIER_API_KEY) {
                    console.log(`   🔍 Fallback to MyEmailVerifier (98% accuracy, cheaper at scale)...`);
                    const mevResult = await this.validateWithMyEmailVerifier(email);
                    console.log(`   ✅ MyEmailVerifier result: ${mevResult.result} (${mevResult.confidence}%)`);
                    return mevResult;
                }
            } else {
                // STEP 2: If email missing, discover with Prospeo → DropContact
                console.log(`   🔍 Email missing - Using discovery flow (Prospeo → DropContact)`);
                // Note: For discovery, we need executive name, company, domain - this should be called from enrichExecutiveContacts
                return { isValid: false, confidence: 0, result: 'no_email_to_validate' };
            }
            
            // FALLBACK: Basic format validation
            console.log(`   ⚠️ Using basic format validation (no API keys available)`);
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const isValidFormat = emailRegex.test(email);
            
            return {
                isValid: isValidFormat,
                confidence: isValidFormat ? 50 : 0,
                result: isValidFormat ? 'valid_format' : 'invalid_format',
                provider: 'basic_regex',
                triangulated: false
            };
            
        } catch (error) {
            console.error(`   ❌ Email validation error: ${error.message}`);
            return {
                isValid: false,
                confidence: 0,
                result: 'validation_error',
                error: error.message,
                provider: 'error',
                triangulated: false
            };
        }
    }

    /**
     * 🔍 VALIDATE WITH ZEROBOUNCE
     */
    async validateWithZeroBounce(email) {
        try {
            // Check if API key is valid before making request
            if (!this.config.ZEROBOUNCE_API_KEY || this.config.ZEROBOUNCE_API_KEY.length < 10) {
                console.log(`   ⚠️ ZeroBounce API key not configured properly - skipping`);
                return null;
            }

            const url = `https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`;
            console.log(`   🔍 DEBUG: ZeroBounce URL: ${url.replace(this.config.ZEROBOUNCE_API_KEY, 'API_KEY')}`);
            const response = await fetch(url, { method: 'GET', timeout: 10000 });

            console.log(`   🔍 DEBUG: ZeroBounce Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: ZeroBounce Response: ${JSON.stringify(data)}`);
                
                // Handle API key errors gracefully
                if (data.error && data.error.includes('Invalid API key')) {
                    console.log(`   ⚠️ ZeroBounce API key invalid or out of credits - skipping future requests`);
                    this.config.ZEROBOUNCE_API_KEY = null; // Disable for this session
                    return null;
                }
                
                const isValid = data.status === 'valid';
                const confidence = this.calculateEmailConfidence(data.status, data.sub_status);
                
                return {
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

        return { isValid: false, confidence: 0, result: 'api_error' };
    }

    /**
     * 🔍 VALIDATE WITH MYEMAILVERIFIER
     * 
     * MyEmailVerifier API - 98% independent accuracy, cost-effective at scale
     */
    async validateWithMyEmailVerifier(email) {
        try {
            const url = `https://client.myemailverifier.com/verifier/validate_single/${encodeURIComponent(email)}/${this.config.MYEMAILVERIFIER_API_KEY}`;
            console.log(`   🔍 DEBUG: MyEmailVerifier URL: ${url.replace(this.config.MYEMAILVERIFIER_API_KEY, 'API_KEY')}`);
            const response = await fetch(url, { method: 'GET', timeout: 10000 });

            console.log(`   🔍 DEBUG: MyEmailVerifier Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: MyEmailVerifier Response: ${JSON.stringify(data)}`);
                
                const isValid = data.Status === 'Valid';
                const confidence = this.calculateMyEmailVerifierConfidence(data);
                
                return {
                    isValid,
                    confidence,
                    result: data.Status,
                    diagnosis: data.Diagnosis,
                    catchAll: data.catch_all === 'true',
                    disposableDomain: data.Disposable_Domain === 'true',
                    roleBased: data.Role_Based === 'true',
                    freeDomain: data.Free_Domain === 'true',
                    greylisted: data.Greylisted === 'true',
                    source: 'myemailverifier',
                    timestamp: new Date().toISOString()
                };
            } else {
                console.log(`   ⚠️ MyEmailVerifier API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ⚠️ MyEmailVerifier validation error: ${error.message}`);
        }

        return { isValid: false, confidence: 0, result: 'api_error', source: 'myemailverifier' };
    }

    /**
     * 🎯 TRIANGULATE EMAIL VALIDATION RESULTS
     * 
     * Intelligently combines results from multiple providers to increase accuracy
     */
    triangulateEmailValidation(results, email) {
        console.log(`   🎯 Triangulating ${results.length} validation results for ${email}`);
        
        // Count consensus
        const validCount = results.filter(r => r.isValid).length;
        const invalidCount = results.filter(r => !r.isValid).length;
        
        // Get highest confidence result
        const highestConfidence = results.reduce((max, current) => 
            current.confidence > max.confidence ? current : max
        );
        
        // Get most recent result (if timestamps available)
        const mostRecent = results.reduce((latest, current) => {
            const currentTime = new Date(current.timestamp || 0);
            const latestTime = new Date(latest.timestamp || 0);
            return currentTime > latestTime ? current : latest;
        });
        
        // Triangulation logic
        let finalResult;
        
        if (validCount > invalidCount) {
            // Majority says valid
            finalResult = {
                isValid: true,
                confidence: Math.min(95, highestConfidence.confidence + 5), // Boost confidence for consensus
                result: 'triangulated_valid',
                consensus: `${validCount}/${results.length} providers agree`,
                primarySource: highestConfidence.provider || highestConfidence.source,
                triangulated: true,
                triangulationMethod: 'majority_consensus'
            };
        } else if (invalidCount > validCount) {
            // Majority says invalid
            finalResult = {
                isValid: false,
                confidence: Math.min(95, highestConfidence.confidence + 5),
                result: 'triangulated_invalid',
                consensus: `${invalidCount}/${results.length} providers agree`,
                primarySource: highestConfidence.provider || highestConfidence.source,
                triangulated: true,
                triangulationMethod: 'majority_consensus'
            };
        } else {
            // Tie - use highest confidence provider
            finalResult = {
                ...highestConfidence,
                result: `${highestConfidence.result}_disputed`,
                confidence: Math.max(70, highestConfidence.confidence - 10), // Reduce confidence for dispute
                consensus: `${validCount}/${results.length} split decision`,
                triangulated: true,
                triangulationMethod: 'highest_confidence_tiebreaker'
            };
        }
        
        // Add detailed provider breakdown
        finalResult.providerBreakdown = results.map(r => ({
            provider: r.provider || r.source,
            isValid: r.isValid,
            confidence: r.confidence,
            result: r.result
        }));
        
        console.log(`   ✅ Triangulated result: ${finalResult.isValid ? 'VALID' : 'INVALID'} (${finalResult.confidence}% confidence)`);
        console.log(`   📊 Consensus: ${finalResult.consensus}`);
        
        return finalResult;
    }

    /**
     * 🔢 CALCULATE MYEMAILVERIFIER CONFIDENCE
     */
    calculateMyEmailVerifierConfidence(data) {
        let confidence = 0;
        
        switch (data.Status) {
            case 'Valid':
                confidence = 95;
                break;
            case 'Invalid':
                confidence = 90;
                break;
            case 'Unknown':
                confidence = 40;
                break;
            case 'Catch-All':
                confidence = 70;
                break;
            default:
                confidence = 30;
        }
        
        // Adjust based on additional factors
        if (data.Disposable_Domain === 'true') confidence -= 20;
        if (data.Role_Based === 'true') confidence -= 10;
        if (data.Free_Domain === 'true') confidence -= 5;
        if (data.Greylisted === 'true') confidence -= 15;
        
        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * 📱 INTELLIGENT PHONE NUMBER WATERFALL
     * 
     * Smart waterfall approach:
     * 1. AI search for publicly available numbers (Perplexity)
     * 2. Twilio Lookup for validation and carrier info ($0.008)
     * 3. Lusha API for mobile numbers (high-value targets only, $0.08/record)
     */
    async findPhoneNumbers(executiveName, companyName, isHighValueTarget = false) {
        const phoneResults = [];

        try {
            console.log(`   📱 Starting intelligent phone search for ${executiveName}`);
            
            // STEP 1: AI-powered public phone search
            const publicPhones = await this.searchPublicPhoneNumbers(executiveName, companyName);
            if (publicPhones.length > 0) {
                console.log(`   📞 Found ${publicPhones.length} public phone numbers`);
                phoneResults.push(...publicPhones.map(p => ({ ...p, source: 'public_search' })));
            }
            
                    // STEP 2: Validate and enrich found numbers with Twilio Lookup
        if (phoneResults.length > 0 && this.config.TWILIO_ACCOUNT_SID) {
            console.log(`   🔍 Validating phones with Twilio Lookup ($0.008 each)...`);
            for (let phone of phoneResults) {
                const lookupResult = await this.validatePhoneWithTwilio(phone.number);
                if (lookupResult.isValid) {
                    phone.twilioValidation = lookupResult;
                    phone.confidence = Math.min(95, phone.confidence + 10); // Boost confidence
                    
                    // Enhanced phone type classification
                    const phoneClassification = this.classifyPhoneTypeAdvanced(phone.number, lookupResult, companyName);
                    phone.phoneType = phoneClassification.type;
                    phone.phoneSubType = phoneClassification.subType;
                    phone.businessContext = phoneClassification.businessContext;
                    
                    console.log(`   ✅ Twilio validated: ${phone.number} (${phoneClassification.type} - ${phoneClassification.subType})`);
                }
            }
        }
            
                    // STEP 3: Precise Lusha lookup for Top 1000 companies (cost-optimized)
            if (isHighValueTarget && phoneResults.filter(p => p.type === 'mobile').length === 0) {
            console.log(`   📱 Precise Lusha lookup for Top 1000 company ($0.08)...`);
            
            // Use validated email or LinkedIn if available for precise lookup
            const validatedEmail = phoneResults.find(p => p.email && p.confidence > 80);
            const linkedinUrl = null; // Would come from LinkedIn intelligence
            
            const lushaPhones = await this.preciseLushaLookup(
                { name: executiveName, isTop1000: true, company: { name: companyName } }, 
                validatedEmail, 
                linkedinUrl
            );
            
                if (lushaPhones.length > 0) {
                    phoneResults.push(...lushaPhones);
                console.log(`   ✅ Precise Lusha lookup found ${lushaPhones.length} phone numbers`);
                }
            }
            
            // STEP 4: Triangulate and rank results
            const triangulatedPhones = this.triangulatePhoneResults(phoneResults);
            
            console.log(`   📊 Final phone results: ${triangulatedPhones.length} numbers with confidence scores`);
            return triangulatedPhones;
            
        } catch (error) {
            console.log(`   ❌ Phone search error: ${error.message}`);
            return [];
        }
    }

    /**
     * 🔍 SEARCH PUBLIC PHONE NUMBERS (Perplexity AI)
     */
    async searchPublicPhoneNumbers(executiveName, companyName) {
        try {
            const prompt = `Find publicly available phone numbers for ${executiveName} at ${companyName}.

Look for:
1. Company directory listings with direct numbers
2. Press releases with executive contact info
3. Public corporate communications
4. Executive bio pages and profiles
5. Company investor relations contacts

Provide ONLY a JSON response:
{
    "phones": [
        {
            "number": "+1-XXX-XXX-XXXX",
            "type": "office/mobile/direct/main",
            "source": "company_directory/press_release/investor_relations/bio_page",
            "confidence": 0.80,
            "context": "Brief context about where number was found"
        }
    ]
}

Only return numbers from official company sources. Do not use LinkedIn or social media.`;

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
                    max_tokens: 500
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const phoneData = JSON.parse(jsonMatch[0]);
                        return phoneData.phones || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Phone data parsing failed: ${parseError.message}`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Public phone search error: ${error.message}`);
        }

        return [];
    }

    /**
     * ☎️ VALIDATE PHONE WITH TWILIO LOOKUP
     * 
     * Twilio Lookup API - $0.008 per lookup, SOC 2 compliant
     */
    async validatePhoneWithTwilio(phoneNumber) {
        try {
            if (!this.config.TWILIO_ACCOUNT_SID || !this.config.TWILIO_AUTH_TOKEN) {
                return { isValid: false, error: 'No Twilio credentials' };
            }

            // Clean phone number for API
            const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
            
            const auth = Buffer.from(`${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`).toString('base64');
            
            const response = await fetch(
                `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(cleanPhone)}?Type=carrier`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${auth}`
                    },
                    timeout: 10000
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    isValid: true,
                    phoneNumber: data.phone_number,
                    nationalFormat: data.national_format,
                    carrier: data.carrier?.name || 'Unknown',
                    lineType: data.carrier?.type || 'Unknown',
                    countryCode: data.country_code,
                    confidence: 90,
                    source: 'twilio_lookup',
                    cost: 0.008
                };
            } else {
                console.log(`   ⚠️ Twilio Lookup error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ⚠️ Twilio validation error: ${error.message}`);
        }

        return { isValid: false, error: 'Twilio validation failed' };
    }

        /**
     * 📱 SEARCH LUSHA FOR EXECUTIVE PHONE NUMBERS
     * 
     * Lusha Prospecting API - Search + Enrich workflow for phone numbers
     * For Top 1000 companies only ($0.08/record)
     */
    async searchLushaPhoneNumbers(executiveName, companyName) {
        try {
            if (!this.config.LUSHA_API_KEY) {
                console.log(`   ⚠️ No Lusha API key available`);
                return [];
            }

            // Parse name for Lusha API
            const nameParts = executiveName.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';

            // STEP 1: Search for contacts using Lusha Prospecting API
            console.log(`   🔍 Searching Lusha for ${firstName} ${lastName} at ${companyName}...`);
            
            const searchResponse = await fetch('https://api.lusha.com/prospecting/contact/search', {
                method: 'POST',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pages: {
                        page: 0,
                        size: 10  // Fixed: minimum size is 10
                    },
                    filters: {
                        contacts: {
                            include: {
                                existing_data_points: ["phone", "mobile_phone", "email"]
                            }
                        },
                        companies: {
                            include: {
                                names: [companyName, `${companyName} Inc`, `${companyName}, Inc.`]  // Try multiple variations
                            }
                        }
                    }
                }),
                timeout: 15000
            });

            if (!searchResponse.ok) {
                console.log(`   ⚠️ Lusha search error: ${searchResponse.status}`);
                const errorText = await searchResponse.text();
                console.log(`   Error details: ${errorText}`);
                return [];
            }

            const searchData = await searchResponse.json();
            console.log(`   📊 Lusha search found ${searchData.totalResults || 0} results`);

            if (!searchData.contacts || searchData.contacts.length === 0) {
                console.log(`   ⚠️ No contacts found in Lusha for ${executiveName}`);
                return [];
            }

            // STEP 2: Enrich the found contacts to get phone numbers
            const contactIds = searchData.contacts
                .filter(contact => {
                    const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim().toLowerCase();
                    const searchName = `${firstName} ${lastName}`.toLowerCase();
                    return fullName.includes(firstName.toLowerCase()) && fullName.includes(lastName.toLowerCase());
                })
                .slice(0, 3) // Limit to top 3 matches
                .map(contact => contact.id);

            if (contactIds.length === 0) {
                console.log(`   ⚠️ No matching contacts found for ${executiveName}`);
                return [];
            }

            console.log(`   🔍 Enriching ${contactIds.length} matching contacts...`);
            
            const enrichResponse = await fetch('https://api.lusha.com/prospecting/contact/enrich', {
                method: 'POST',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    requestId: searchData.requestId,
                    contactIds: contactIds,
                    revealPhones: true // Only get phone numbers
                }),
                timeout: 15000
            });

            if (enrichResponse.ok) {
                const enrichData = await enrichResponse.json();
                const phones = [];
                
                if (enrichData.contacts) {
                    enrichData.contacts.forEach(contact => {
                        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                            contact.phoneNumbers.forEach(phoneObj => {
                                phones.push({
                                    number: phoneObj.number,
                                    type: this.classifyLushaPhoneType(phoneObj),
                                    source: 'lusha_prospecting',
                                    confidence: this.calculateLushaPhoneConfidence(phoneObj),
                                    cost: 0.08,
                                    context: `Lusha prospecting data for ${executiveName}`,
                                    verified: true,
                                    lushaData: {
                                        contactId: contact.id,
                                        type: phoneObj.type,
                                        doNotCall: phoneObj.doNotCall
                                    }
                                });
                            });
                        }
                    });
                }
                
                console.log(`   📱 Lusha enrichment returned ${phones.length} phone numbers`);
        return phones;
            } else {
                console.log(`   ⚠️ Lusha enrichment error: ${enrichResponse.status}`);
                const errorText = await enrichResponse.text();
                console.log(`   Error details: ${errorText}`);
            }

        } catch (error) {
            console.log(`   ❌ Lusha search error: ${error.message}`);
        }

        return [];
    }

    /**
     * 📞 CLASSIFY LUSHA PHONE TYPE
     * 
     * Maps Lusha's phone types to our 4-type classification system
     */
    classifyLushaPhoneType(phoneObj) {
        const lushaType = (phoneObj.type || '').toLowerCase();
        
        // Lusha typically provides: mobile, work, direct, main
        switch (lushaType) {
            case 'mobile':
                return 'work_mobile'; // Lusha mobile numbers are typically business mobile
            case 'work':
            case 'direct':
                return 'work_landline'; // Direct dial or work numbers
            case 'main':
                return 'work_landline'; // Company main numbers
            default:
                return 'work_unknown'; // Default to work context for Lusha data
        }
    }

    /**
     * 📊 CALCULATE LUSHA PHONE CONFIDENCE
     * 
     * Calculates confidence based on Lusha's data quality indicators
     */
    calculateLushaPhoneConfidence(phoneObj) {
        let confidence = 85; // Base confidence for Lusha data
        
        // Adjust based on Lusha's accuracy indicators
        if (phoneObj.accuracy === 'high') {
            confidence = 95;
        } else if (phoneObj.accuracy === 'medium') {
            confidence = 80;
        } else if (phoneObj.accuracy === 'low') {
            confidence = 65;
        }
        
        // Boost confidence for direct/mobile numbers
        if (phoneObj.type === 'direct' || phoneObj.type === 'mobile') {
            confidence += 5;
        }
        
        return Math.min(95, confidence);
    }

    /**
     * 🎯 TRIANGULATE PHONE RESULTS
     * 
     * Intelligently ranks and deduplicates phone numbers
     */
    triangulatePhoneResults(phoneResults) {
        if (phoneResults.length === 0) return [];

        // Deduplicate by normalizing numbers
        const phoneMap = new Map();
        
        phoneResults.forEach(phone => {
            const normalizedNumber = phone.number.replace(/[^\d]/g, '');
            
            if (phoneMap.has(normalizedNumber)) {
                // Combine data from multiple sources
                const existing = phoneMap.get(normalizedNumber);
                existing.confidence = Math.max(existing.confidence, phone.confidence);
                existing.sources = existing.sources || [];
                existing.sources.push(phone.source);
                
                // Prefer Twilio-validated data
                if (phone.twilioValidation) {
                    existing.twilioValidation = phone.twilioValidation;
                    existing.type = phone.twilioValidation.lineType || existing.type;
                }
            } else {
                phoneMap.set(normalizedNumber, {
                    ...phone,
                    sources: [phone.source],
                    triangulated: phoneResults.length > 1
                });
            }
        });

        // Convert back to array and sort by confidence
        const triangulatedPhones = Array.from(phoneMap.values())
            .sort((a, b) => b.confidence - a.confidence);

        return triangulatedPhones;
    }

    /**
     * 📞 ADVANCED PHONE TYPE CLASSIFICATION
     * 
     * Based on exact provider data definitions and business context
     * Classifies into 4 primary types: Work Landline, Work Mobile, Personal Landline, Personal Mobile
     */
    classifyPhoneTypeAdvanced(phoneNumber, twilioResult, companyName) {
        const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
        
        // Initialize classification
        let classification = {
            type: 'unknown',
            subType: 'unknown',
            businessContext: 'unknown',
            confidence: 50,
            reasoning: []
        };

        if (!twilioResult.isValid) {
            classification.confidence = 0;
            classification.reasoning.push('Phone number invalid per Twilio');
            return classification;
        }

        const lineType = (twilioResult.lineType || '').toLowerCase();
        const carrier = (twilioResult.carrier || '').toLowerCase();
        const hasBusinessContext = companyName && companyName !== 'Test' && companyName !== 'Unknown';

        // TOLL-FREE NUMBERS (Always work-related)
        if (cleanNumber.match(/^1(800|888|877|866|855|844|833)/)) {
            classification.type = 'work_toll_free';
            classification.subType = 'customer_service';
            classification.businessContext = 'business';
            classification.confidence = 95;
            classification.reasoning.push('Toll-free number pattern detected');
            return classification;
        }

        // PREMIUM NUMBERS
        if (lineType.includes('premium')) {
            classification.type = 'work_premium';
            classification.subType = 'premium_service';
            classification.businessContext = 'business';
            classification.confidence = 90;
            classification.reasoning.push('Premium line type from Twilio');
            return classification;
        }

        // MOBILE NUMBERS
        if (lineType.includes('mobile') || lineType.includes('wireless') || lineType.includes('cellular')) {
            if (hasBusinessContext) {
                classification.type = 'work_mobile';
                classification.subType = 'executive_mobile';
                classification.businessContext = 'business';
                classification.confidence = 80;
                classification.reasoning.push('Mobile line type with business context');
            } else {
                classification.type = 'personal_mobile';
                classification.subType = 'personal_cell';
                classification.businessContext = 'personal';
                classification.confidence = 75;
                classification.reasoning.push('Mobile line type without business context');
            }
            return classification;
        }

        // LANDLINE NUMBERS
        if (lineType.includes('landline') || lineType.includes('fixed')) {
            if (hasBusinessContext) {
                classification.type = 'work_landline';
                classification.subType = 'office_direct';
                classification.businessContext = 'business';
                classification.confidence = 85;
                classification.reasoning.push('Landline type with business context');
            } else {
                classification.type = 'personal_landline';
                classification.subType = 'home_phone';
                classification.businessContext = 'personal';
                classification.confidence = 80;
                classification.reasoning.push('Landline type without business context');
            }
            return classification;
        }

        // VOIP NUMBERS
        if (lineType.includes('voip')) {
            classification.type = 'work_voip';
            classification.subType = 'office_system';
            classification.businessContext = 'business';
            classification.confidence = 75;
            classification.reasoning.push('VoIP line type detected');
            return classification;
        }

        // SHARED COST NUMBERS
        if (lineType.includes('shared')) {
            classification.type = 'work_shared';
            classification.subType = 'shared_cost';
            classification.businessContext = 'business';
            classification.confidence = 70;
            classification.reasoning.push('Shared cost line type');
            return classification;
        }

        // FALLBACK: Use business context for unknown line types
        if (hasBusinessContext) {
            classification.type = 'work_unknown';
            classification.subType = 'business_line';
            classification.businessContext = 'business';
            classification.confidence = 60;
            classification.reasoning.push('Business context present, unknown line type');
        } else {
            classification.type = 'personal_unknown';
            classification.subType = 'personal_line';
            classification.businessContext = 'personal';
            classification.confidence = 50;
            classification.reasoning.push('No business context, unknown line type');
        }

        return classification;
    }

    /**
     * 🔗 FIND PROFESSIONAL PROFILES (NO LINKEDIN)
     */
    async findProfessionalProfiles(executiveName, companyName) {
        const profiles = [];

        try {
            // Search for professional profiles excluding LinkedIn
            const prompt = `Find professional profiles for ${executiveName} at ${companyName}.

Look for profiles on:
1. Company website executive pages
2. Industry association directories
3. Board member listings
4. Speaking engagement bios
5. Professional organization profiles

DO NOT include LinkedIn profiles.

Provide ONLY a JSON response:
{
    "profiles": [
        {
            "url": "https://example.com/profile",
            "platform": "company_website/industry_directory/etc",
            "title": "Profile title or description",
            "confidence": 0.85
        }
    ]
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
                    max_tokens: 600
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const profileData = JSON.parse(jsonMatch[0]);
                        return profileData.profiles || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Profile data parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Profile search error: ${error.message}`);
        }

        return profiles;
    }

    /**
     * 🔧 UTILITY METHODS
     */
    calculateEmailConfidence(status, subStatus) {
        // Enhanced confidence calculation for 95% accuracy target
        const baseConfidenceMap = {
            'valid': 95,
            'catch-all': 30, // Reduced from 70 - catch-all is unreliable
            'unknown': 25,   // Reduced from 40 - unknown is risky
            'do_not_mail': 5,
            'spamtrap': 0,
            'invalid': 0
        };
        
        let confidence = baseConfidenceMap[status] || 0;
        
        // Adjust based on sub-status for more accuracy
        if (subStatus) {
            switch (subStatus) {
                case 'antispam_system':
                    confidence = Math.max(confidence - 20, 0);
                    break;
                case 'greylisted':
                    confidence = Math.max(confidence - 15, 0);
                    break;
                case 'mail_server_temporary_error':
                    confidence = Math.max(confidence - 10, 0);
                    break;
                case 'forcible_disconnect':
                    confidence = Math.max(confidence - 25, 0);
                    break;
                case 'mail_server_did_not_respond':
                    confidence = Math.max(confidence - 30, 0);
                    break;
            }
        }
        
        return Math.max(confidence, 0);
    }

    /**
     * 📊 CALCULATE OVERALL ACCURACY SCORE
     */
    calculateOverallAccuracy(result) {
        let totalScore = 0;
        let maxScore = 0;
        let executiveCount = 0;

        // Check each executive
        ['cfo', 'cro', 'ceo'].forEach(role => {
            const executive = result.enrichedExecutives[role];
            if (executive) {
                executiveCount++;
                let executiveScore = 0;
                let executiveMaxScore = 100;

                // Email accuracy (60% weight)
                const validEmails = executive.contacts.emails.filter(e => e.isValid && e.confidence >= 70);
                if (validEmails.length > 0) {
                    executiveScore += 60;
                } else if (executive.contacts.emails.length > 0) {
                    // Partial credit for having emails even if not validated
                    const avgConfidence = executive.contacts.emails.reduce((sum, e) => sum + e.confidence, 0) / executive.contacts.emails.length;
                    executiveScore += Math.min(avgConfidence * 0.6, 30);
                }

                // Phone accuracy (25% weight)
                if (executive.contacts.phones.length > 0) {
                    executiveScore += 25;
                }

                // Profile accuracy (15% weight)
                if (executive.contacts.profiles.length > 0 || executive.linkedIn) {
                    executiveScore += 15;
                }

                totalScore += executiveScore;
                maxScore += executiveMaxScore;
            }
        });

        // Calculate weighted average
        if (maxScore > 0) {
            return (totalScore / maxScore) * 100;
        }

        return 0;
    }

    /**
     * 📊 CATEGORIZE DEPARTMENT BY TIERS
     */
    categorizeDepartmentByTiers(departmentMembers) {
        const tiers = {
            tier1: [], // C-level (CFO, CRO, etc.)
            tier2: [], // VP level
            tier3: [], // Director level
            tier4: [], // Manager level
            tier5: []  // Other roles
        };

        departmentMembers.forEach(member => {
            switch (member.tier) {
                case 1:
                    tiers.tier1.push(member);
                    break;
                case 2:
                    tiers.tier2.push(member);
                    break;
                case 3:
                    tiers.tier3.push(member);
                    break;
                case 4:
                    tiers.tier4.push(member);
                    break;
                default:
                    tiers.tier5.push(member);
            }
        });

        return {
            tier1: { count: tiers.tier1.length, members: tiers.tier1, description: 'C-Level Executives' },
            tier2: { count: tiers.tier2.length, members: tiers.tier2, description: 'VP Level' },
            tier3: { count: tiers.tier3.length, members: tiers.tier3, description: 'Director Level' },
            tier4: { count: tiers.tier4.length, members: tiers.tier4, description: 'Manager Level' },
            tier5: { count: tiers.tier5.length, members: tiers.tier5, description: 'Other Roles' }
        };
    }

    getPatternName(email, nameParts) {
        const { firstName, lastName } = nameParts;
        const localPart = email.split('@')[0];
        
        if (localPart === `${firstName}.${lastName}`) return 'first.last';
        if (localPart === `${firstName}${lastName}`) return 'firstlast';
        if (localPart === `${firstName}_${lastName}`) return 'first_last';
        if (localPart === `${firstName}-${lastName}`) return 'first-last';
        if (localPart === `${firstName[0]}${lastName}`) return 'flast';
        if (localPart === firstName) return 'first';
        
        return 'custom';
    }

    updateStats(stats, enrichedExecutive) {
        if (!enrichedExecutive) return;
        
        // Handle different data structures
        const contacts = enrichedExecutive.contacts || enrichedExecutive;
        
        // Update email stats
        if (contacts.emails) {
            stats.emailsGenerated += contacts.emails.length || 0;
            stats.emailsValidated += contacts.emails.filter(e => e?.isValid || e?.status === 'valid').length || 0;
        }
        
        // Update phone stats
        if (contacts.phones) {
            stats.phonesFound += contacts.phones.length || 0;
        }
        
        // Update profile stats  
        if (contacts.profiles) {
            stats.profilesFound += contacts.profiles.length || 0;
        } else if (contacts.linkedin || contacts.linkedinUrl) {
            stats.profilesFound += 1;
        }
        
        // Handle direct arrays (for testing)
        if (Array.isArray(contacts)) {
            stats.emailsGenerated += contacts.length || 0;
        }
    }

    async delay(ms) {
        // Reduced delay for faster processing
        const reducedMs = Math.min(ms, 50); // Max 50ms delay
        return new Promise(resolve => setTimeout(resolve, reducedMs));
    }

    initializeEmailPatterns() {
        return [
            'first.last',
            'firstlast',
            'first_last',
            'first-last',
            'flast',
            'first',
            'last',
            'f.last',
            'first.l'
        ];
    }

    /**
     * 📊 CALCULATE SUCCESS RATE
     * 
     * Determines if enhanced discovery should be activated
     */
    calculateSuccessRate(result) {
        let totalAttempts = 0;
        let successfulAttempts = 0;

        // Count email success
        if (result.enrichedExecutives.ceo?.contacts?.emails) {
            const emails = result.enrichedExecutives.ceo.contacts.emails;
            totalAttempts += emails.length;
            successfulAttempts += emails.filter(e => e.isValid && e.confidence > 70).length;
        }
        
        if (result.enrichedExecutives.cfo?.contacts?.emails) {
            const emails = result.enrichedExecutives.cfo.contacts.emails;
            totalAttempts += emails.length;
            successfulAttempts += emails.filter(e => e.isValid && e.confidence > 70).length;
        }

        // Count phone success
        if (result.enrichedExecutives.ceo?.contacts?.phones) {
            const phones = result.enrichedExecutives.ceo.contacts.phones;
            totalAttempts += phones.length;
            successfulAttempts += phones.filter(p => p.confidence > 70).length;
        }
        
        if (result.enrichedExecutives.cfo?.contacts?.phones) {
            const phones = result.enrichedExecutives.cfo.contacts.phones;
            totalAttempts += phones.length;
            successfulAttempts += phones.filter(p => p.confidence > 70).length;
        }

        if (totalAttempts === 0) return 0;
        return Math.round((successfulAttempts / totalAttempts) * 100);
    }

    /**
     * 📋 COLLECT FAILED VALIDATIONS
     * 
     * Collects information about what failed for enhanced discovery
     */
    collectFailedValidations(result) {
        const failed = [];

        // Collect failed emails
        ['ceo', 'cfo'].forEach(role => {
            const executive = result.enrichedExecutives[role];
            if (executive?.contacts?.emails) {
                executive.contacts.emails.forEach(email => {
                    if (!email.isValid || email.confidence < 70) {
                        failed.push({
                            type: 'email',
                            value: email.email,
                            reason: email.result || 'low_confidence',
                            confidence: email.confidence,
                            role: role
                        });
                    }
                });
            }
        });

        // Collect missing phones
        ['ceo', 'cfo'].forEach(role => {
            const executive = result.enrichedExecutives[role];
            if (!executive?.contacts?.phones || executive.contacts.phones.length === 0) {
                failed.push({
                    type: 'phone',
                    value: 'missing',
                    reason: 'no_phones_found',
                    confidence: 0,
                    role: role
                });
            }
        });

        return failed;
    }

    /**
     * 🎯 INTELLIGENT EMAIL DOMAIN CORRECTION
     * 
     * Uses AI to determine if subdomain is product vs corporate domain
     */
    async correctEmailDomain(domain, companyName) {
        const parts = domain.split('.');
        
        // If not a subdomain, return as-is
        if (parts.length <= 2) {
            return domain;
        }

        const subdomain = parts[0].toLowerCase();
        const baseDomain = parts.slice(1).join('.');
        
        // Intelligent subdomain analysis using AI
        try {
            const prompt = `Analyze the domain structure for ${companyName}:

Domain: ${domain}
Subdomain: ${subdomain}
Base domain: ${baseDomain}

Determine:
1. Is "${subdomain}" a product/service subdomain or do executives use it for email?
2. What domain do executives at ${companyName} typically use for email?

Provide ONLY a JSON response:
{
    "isProductSubdomain": true/false,
    "executiveEmailDomain": "domain executives actually use",
    "reasoning": "explanation of why",
    "confidence": 0.90
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
                    max_tokens: 300
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const analysis = JSON.parse(jsonMatch[0]);
                        console.log(`   🎯 AI domain analysis: ${analysis.reasoning}`);
                        return analysis.executiveEmailDomain || baseDomain;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Domain analysis parsing failed, using heuristic`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ AI domain analysis failed: ${error.message}`);
        }

        // Fallback: Intelligent heuristic for common product subdomains
        const productSubdomains = ['pos', 'app', 'portal', 'platform', 'shop', 'store', 'api', 'admin', 'dashboard'];
        if (productSubdomains.includes(subdomain)) {
            console.log(`   🎯 Heuristic: ${subdomain} appears to be product subdomain, using ${baseDomain}`);
            return baseDomain;
        }

        return domain; // Use original if unclear
    }

    /**
     * 📱 PRECISE LUSHA INTEGRATION WITH COST CONTROL
     * 
     * Uses validated emails or LinkedIn URLs for precise, cost-effective lookups
     */
    async preciseLushaLookup(executiveData, validatedEmail = null, linkedinUrl = null) {
        try {
            if (!this.config.LUSHA_API_KEY) {
                return [];
            }

            // PRIORITY 1: Use validated email (most precise, least expensive)
            if (validatedEmail && validatedEmail.confidence > 80) {
                console.log(`   📧 Lusha lookup using validated email: ${validatedEmail.email}`);
                return await this.lushaPersonLookupByEmail(validatedEmail.email);
            }

            // PRIORITY 2: Use LinkedIn URL (precise, cost-effective)
            if (linkedinUrl) {
                console.log(`   🔗 Lusha lookup using LinkedIn URL`);
                return await this.lushaPersonLookupByLinkedIn(linkedinUrl);
            }

            // PRIORITY 3: Only for Top 1000 companies - name lookup
            if (executiveData.isTop1000) {
                console.log(`   👤 Lusha lookup using name (Top 1000 company only)`);
                return await this.lushaPersonLookupByName(executiveData, executiveData.company);
            }

            console.log(`   ⚠️ No precise identifiers available for Lusha lookup`);
            return [];

        } catch (error) {
            console.log(`   ❌ Precise Lusha lookup error: ${error.message}`);
            return [];
        }
    }

    /**
     * 📧 LUSHA PERSON LOOKUP BY EMAIL (Most Precise)
     */
    async lushaPersonLookupByEmail(email) {
        try {
            const response = await fetch(`https://api.lusha.com/v2/person?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return this.extractLushaPhoneData(data, 'email_lookup');
            } else {
                console.log(`   ⚠️ Lusha email lookup error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha email lookup error: ${error.message}`);
        }

        return [];
    }

    /**
     * 🔗 LUSHA PERSON LOOKUP BY LINKEDIN (Precise)
     */
    async lushaPersonLookupByLinkedIn(linkedinUrl) {
        try {
            const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return this.extractLushaPhoneData(data, 'linkedin_lookup');
            } else {
                console.log(`   ⚠️ Lusha LinkedIn lookup error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha LinkedIn lookup error: ${error.message}`);
        }

        return [];
    }

    /**
     * 👤 LUSHA PERSON LOOKUP BY NAME (Last Resort)
     */
    async lushaPersonLookupByName(executiveData, companyData) {
        try {
            const nameParts = executiveData.name.trim().split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts[nameParts.length - 1] || '';
            
            const queryParams = new URLSearchParams({
                firstName: firstName,
                lastName: lastName,
                company: companyData.name
            });

            const response = await fetch(`https://api.lusha.com/v2/person?${queryParams}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            if (response.ok) {
                const data = await response.json();
                return this.extractLushaPhoneData(data, 'name_lookup');
            } else {
                console.log(`   ⚠️ Lusha name lookup error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha name lookup error: ${error.message}`);
        }

        return [];
    }

    /**
     * 📊 EXTRACT LUSHA PHONE DATA - ENHANCED WITH ALL AVAILABLE FIELDS
     */
    extractLushaPhoneData(data, lookupMethod) {
        const phones = [];
        
        if (data && data.phoneNumbers && data.phoneNumbers.length > 0) {
            data.phoneNumbers.forEach(phoneObj => {
                phones.push({
                    number: phoneObj.number,
                    type: this.classifyLushaPhoneType(phoneObj),
                    source: 'lusha_api',
                    confidence: this.calculateLushaPhoneConfidence(phoneObj),
                    cost: 0.08,
                    lookupMethod: lookupMethod,
                    verified: true,
                    lushaData: {
                        type: phoneObj.type,
                        doNotCall: phoneObj.doNotCall,
                        accuracy: phoneObj.accuracy || 'high',
                        // Enhanced fields from Lusha API
                        countryCode: phoneObj.countryCode,
                        nationalFormat: phoneObj.nationalFormat,
                        internationalFormat: phoneObj.internationalFormat,
                        carrier: phoneObj.carrier,
                        lineType: phoneObj.lineType,
                        isValid: phoneObj.isValid,
                        confidence: phoneObj.confidence
                    }
                });
            });
        }

        return phones;
    }

    /**
     * 🔗 EXTRACT LUSHA LINKEDIN DATA - ENHANCED
     */
    extractLushaLinkedInData(data, lookupMethod) {
        if (data && data.socialLinks && data.socialLinks.linkedin) {
            return {
                linkedIn: data.socialLinks.linkedin,
                source: 'lusha_api',
                confidence: 95,
                cost: 0.08,
                lookupMethod: lookupMethod,
                verified: true,
                // Enhanced social media data
                socialLinks: {
                    linkedin: data.socialLinks.linkedin,
                    twitter: data.socialLinks.twitter,
                    facebook: data.socialLinks.facebook,
                    instagram: data.socialLinks.instagram,
                    github: data.socialLinks.github
                }
            };
        }
        return null;
    }

    /**
     * 📊 EXTRACT COMPREHENSIVE LUSHA PERSON DATA - ALL AVAILABLE FIELDS
     * 
     * This function extracts ALL available data from Lusha API responses
     * to ensure we're getting maximum value from each API call.
     */
    extractComprehensiveLushaData(data, lookupMethod) {
        if (!data) return null;

        const result = {
            // Basic person information
            personalInfo: {
                firstName: data.firstName,
                lastName: data.lastName,
                fullName: data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                middleName: data.middleName,
                prefix: data.prefix,
                suffix: data.suffix
            },

            // Professional information
            professionalInfo: {
                jobTitle: data.jobTitle,
                seniority: data.seniority,
                department: data.department,
                function: data.function,
                managementLevel: data.managementLevel,
                yearsInRole: data.yearsInRole,
                yearsAtCompany: data.yearsAtCompany,
                previousRoles: data.previousRoles || []
            },

            // Company information
            companyInfo: {
                companyName: data.companyName,
                companyDomain: data.companyDomain,
                companySize: data.companySize,
                companyIndustry: data.companyIndustry,
                companyType: data.companyType,
                companyRevenue: data.companyRevenue,
                companyLocation: data.companyLocation,
                companyDescription: data.companyDescription
            },

            // Contact information
            contactInfo: {
                emails: (data.emailAddresses || []).map(email => ({
                    email: email.email,
                    type: email.type,
                    confidence: email.emailConfidence,
                    isValid: email.emailConfidence === 'A+',
                    isPrimary: email.isPrimary,
                    source: 'lusha_api'
                })),
                phones: this.extractLushaPhoneData(data, lookupMethod),
                socialLinks: data.socialLinks || {}
            },

            // Location information
            locationInfo: {
                country: data.country,
                state: data.state,
                city: data.city,
                region: data.region,
                timezone: data.timezone,
                coordinates: data.coordinates
            },

            // Skills and technologies
            skillsInfo: {
                skills: data.skills || [],
                technologies: data.technologies || [],
                certifications: data.certifications || [],
                languages: data.languages || []
            },

            // Education information
            educationInfo: {
                schools: data.schools || [],
                degrees: data.degrees || [],
                fieldOfStudy: data.fieldOfStudy || []
            },

            // Metadata
            metadata: {
                source: 'lusha_api',
                lookupMethod: lookupMethod,
                confidence: this.calculateOverallLushaConfidence(data),
                cost: 0.08,
                timestamp: new Date().toISOString(),
                dataCompleteness: this.calculateLushaDataCompleteness(data),
                verified: true
            }
        };

        return result;
    }

    /**
     * 📊 CALCULATE OVERALL LUSHA CONFIDENCE SCORE
     */
    calculateOverallLushaConfidence(data) {
        let score = 0;
        let factors = 0;

        // Email confidence
        if (data.emailAddresses && data.emailAddresses.length > 0) {
            const emailConf = data.emailAddresses[0].emailConfidence;
            if (emailConf === 'A+') score += 95;
            else if (emailConf === 'A') score += 85;
            else if (emailConf === 'B') score += 75;
            else score += 60;
            factors++;
        }

        // Phone confidence
        if (data.phoneNumbers && data.phoneNumbers.length > 0) {
            score += 85; // Lusha phone numbers are generally high quality
            factors++;
        }

        // Professional info completeness
        if (data.jobTitle && data.companyName) {
            score += 90;
            factors++;
        }

        // Social links
        if (data.socialLinks && data.socialLinks.linkedin) {
            score += 80;
            factors++;
        }

        return factors > 0 ? Math.round(score / factors) : 0;
    }

    /**
     * 📊 CALCULATE LUSHA DATA COMPLETENESS PERCENTAGE
     */
    calculateLushaDataCompleteness(data) {
        const fields = [
            'firstName', 'lastName', 'jobTitle', 'companyName', 
            'emailAddresses', 'phoneNumbers', 'socialLinks',
            'seniority', 'department', 'companySize', 'companyIndustry'
        ];

        let completedFields = 0;
        fields.forEach(field => {
            if (data[field] && 
                (Array.isArray(data[field]) ? data[field].length > 0 : true)) {
                completedFields++;
            }
        });

        return Math.round((completedFields / fields.length) * 100);
    }

    /**
     * 📞 CLASSIFY LUSHA PHONE TYPE
     */
    classifyLushaPhoneType(phoneObj) {
        const lushaType = (phoneObj.type || '').toLowerCase();
        
        switch (lushaType) {
            case 'mobile':
                return 'work_mobile';
            case 'work':
            case 'direct':
                return 'work_landline';
            case 'main':
                return 'work_landline';
            default:
                return 'work_unknown';
        }
    }

    /**
     * 📊 CALCULATE LUSHA PHONE CONFIDENCE
     */
    calculateLushaPhoneConfidence(phoneObj) {
        let confidence = 85; // Base confidence for Lusha data
        
        if (phoneObj.accuracy === 'high') confidence = 95;
        else if (phoneObj.accuracy === 'medium') confidence = 80;
        else if (phoneObj.accuracy === 'low') confidence = 65;
        
        if (phoneObj.type === 'direct' || phoneObj.type === 'mobile') {
            confidence += 5;
        }
        
        return Math.min(95, confidence);
    }

    /**
     * 🔍 EMAIL DISCOVERY FLOW (When email is missing)
     */
    async discoverEmailFlow(executiveName, companyName, domain) {
        console.log(`   🔍 DEBUG: Email discovery flow for ${executiveName}`);
        
        // STEP 1: Prospeo Discovery ($0.0198/verified email)
        if (this.config.PROSPEO_API_KEY) {
            console.log(`   🎯 Prospeo email discovery ($0.0198/verified)...`);
            const prospeoResult = await this.discoverWithProspeo(executiveName, companyName, domain);
            if (prospeoResult?.email) {
                return prospeoResult;
            }
        }
        
        // STEP 2: DropContact Discovery (≥20k tier ≲$0.02/email)
        if (this.config.DROPCONTACT_API_KEY) {
            console.log(`   🎯 DropContact email discovery (≥20k tier ≲$0.02/email)...`);
            const dropContactResult = await this.discoverWithDropContact(executiveName, companyName, domain);
            if (dropContactResult?.email) {
                return dropContactResult;
            }
        }
        
        return { isValid: false, confidence: 0, result: 'discovery_failed' };
    }

    /**
     * 🎯 PROSPEO EMAIL DISCOVERY
     */
    async discoverWithProspeo(executiveName, companyName, domain) {
        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            const url = 'https://api.prospeo.io/email-finder';
            // Fix: Clean domain format for Prospeo (remove www, protocols, paths)
            const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            console.log(`   🔍 DEBUG: Prospeo discovery for ${firstName} ${lastName} at ${cleanDomain} (cleaned from ${domain})`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-KEY': this.config.PROSPEO_API_KEY
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    company: cleanDomain
                })
            });
            
            console.log(`   🔍 DEBUG: Prospeo Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: Prospeo Response: ${JSON.stringify(data)}`);
                
                if (data.email) {
                    return {
                        email: data.email,
                        isValid: true,
                        confidence: data.confidence || 85,
                        result: 'discovered',
                        source: 'prospeo',
                        cost: 0.0198
                    };
                }
            } else {
                const errorText = await response.text();
                console.log(`   🔍 DEBUG: Prospeo Error: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ Prospeo discovery error: ${error.message}`);
        }
        return null;
    }

    /**
     * 🎯 DROPCONTACT EMAIL DISCOVERY
     */
    async discoverWithDropContact(executiveName, companyName, domain) {
        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            const url = 'https://api.dropcontact.io/batch';
            console.log(`   🔍 DEBUG: DropContact discovery for ${firstName} ${lastName} at ${domain}`);
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Token': this.config.DROPCONTACT_API_KEY
                },
                body: JSON.stringify({
                    data: [{
                        first_name: firstName,
                        last_name: lastName,
                        company: companyName,
                        website: domain
                    }]
                })
            });
            
            console.log(`   🔍 DEBUG: DropContact Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: DropContact Response: ${JSON.stringify(data)}`);
                
                if (data.data?.[0]?.email) {
                    return {
                        email: data.data[0].email,
                        isValid: true,
                        confidence: data.data[0].email_confidence || 80,
                        result: 'discovered',
                        source: 'dropcontact',
                        cost: 0.02
                    };
                }
            } else {
                const errorText = await response.text();
                console.log(`   🔍 DEBUG: DropContact Error: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ DropContact discovery error: ${error.message}`);
        }
        return null;
    }

    /**
     * 📱 OPTIMIZED PHONE FLOW
     * 
     * Your specified flow: Twilio Lookup first ($0.008) → Lusha for mobiles ($0.08/record)
     */
    async optimizedPhoneFlow(executiveName, companyName, executive) {
        console.log(`   🔍 DEBUG: Starting optimized phone flow for ${executiveName}`);
        const phoneResults = [];
        let linkedInData = null;
        
        // STEP 1: If phone exists, validate with Twilio Lookup ($0.008)
        if (executive.phone) {
            console.log(`   📱 Phone present: ${executive.phone} - Using Twilio Lookup ($0.008)`);
            const twilioResult = await this.validatePhoneWithTwilio(executive.phone);
            if (twilioResult.isValid) {
                phoneResults.push({
                    number: executive.phone,
                    type: twilioResult.lineType,
                    carrier: twilioResult.carrier,
                    isValid: true,
                    confidence: 90,
                    source: 'provided_twilio_validated',
                    cost: 0.008
                });
                
                // If it's a landline, try to find mobile via Lusha
                if (twilioResult.lineType === 'landline') {
                    console.log(`   📱 Landline detected - Searching Lusha for mobile ($0.08/record)`);
                    const lushaResult = await this.findLushaPhones(executiveName, companyName);
                    phoneResults.push(...lushaResult.phones);
                    if (lushaResult.linkedIn) {
                        linkedInData = lushaResult.linkedIn;
                    }
                }
            }
        } else {
            // STEP 2: Phone missing - Use Lusha for Buyer Group contacts ($0.08/record)
            console.log(`   📱 Phone missing - Using Lusha API for discovery ($0.08/record)`);
            const lushaResult = await this.findLushaPhones(executiveName, companyName);
            phoneResults.push(...lushaResult.phones);
            if (lushaResult.linkedIn) {
                linkedInData = lushaResult.linkedIn;
            }
        }
        
        console.log(`   📊 Final phone results: ${phoneResults.length} numbers with confidence scores`);
        return { 
            phones: phoneResults, 
            linkedIn: linkedInData,
            comprehensiveLushaData: null // Will be populated by Lusha calls above
        };
    }

    /**
     * 📱 FIND LUSHA PHONES (For mobiles and discovery)
     */
    async findLushaPhones(executiveName, companyName) {
        console.log(`   🔍 DEBUG: Lusha phone search for ${executiveName} at ${companyName}`);
        
        if (!this.config.LUSHA_API_KEY) {
            console.log(`   ❌ Lusha API key not available`);
            return { phones: [], linkedIn: null, comprehensiveLushaData: null };
        }
        
        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            const url = 'https://api.lusha.com/v2/person';
            const params = new URLSearchParams({
                firstName: firstName,
                lastName: lastName,
                companyName: companyName
            });
            
            console.log(`   🔍 DEBUG: Lusha URL: ${url}?${params}`);
            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log(`   🔍 DEBUG: Lusha Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: Lusha Response: ${JSON.stringify(data)}`);
                
                // Fix: Extract phone numbers from correct Lusha response structure
                const phoneNumbers = data.contact?.data?.phoneNumbers || data.phoneNumbers || [];
                console.log(`   🔍 DEBUG: Extracted ${phoneNumbers.length} phone numbers from Lusha`);
                
                const phones = [];
                if (phoneNumbers.length > 0) {
                    for (const phone of phoneNumbers) {
                        console.log(`   📱 Lusha phone: ${phone.number} (${phone.phoneType || phone.type})`);
                        
                        // Validate each phone with Twilio ($0.008 each)
                        const phoneData = {
                            number: phone.number,
                            type: phone.phoneType || phone.type || 'mobile',
                            confidence: 90,
                            source: 'lusha',
                            cost: 0.08
                        };
                        
                        // Add Twilio validation
                        if (this.config.TWILIO_ACCOUNT_SID && this.config.TWILIO_AUTH_TOKEN) {
                            console.log(`   🔍 Validating ${phone.number} with Twilio Lookup ($0.008)...`);
                            const twilioResult = await this.validatePhoneWithTwilio(phone.number);
                            if (twilioResult.isValid) {
                                phoneData.twilioValidation = twilioResult;
                                phoneData.carrier = twilioResult.carrier;
                                phoneData.lineType = twilioResult.lineType;
                                phoneData.isValid = true;
                                phoneData.totalCost = 0.088; // Lusha + Twilio
                                console.log(`   ✅ Twilio validated: ${twilioResult.lineType} (${twilioResult.carrier})`);
                            } else {
                                phoneData.isValid = false;
                                console.log(`   ❌ Twilio validation failed for ${phone.number}`);
                            }
                        } else {
                            phoneData.isValid = true; // Trust Lusha if no Twilio
                        }
                        
                        phones.push(phoneData);
                    }
                    console.log(`   ✅ Successfully extracted ${phones.length} phone numbers from Lusha (Twilio validated)`);
                }
                
                // Also extract email if available
                const emailAddresses = data.contact?.data?.emailAddresses || data.emailAddresses || [];
                if (emailAddresses.length > 0) {
                    console.log(`   📧 Lusha also found ${emailAddresses.length} emails: ${emailAddresses.map(e => e.email).join(', ')}`);
                }

                // Extract LinkedIn if available
                const socialLinks = data.contact?.data?.socialLinks || data.socialLinks;
                let linkedIn = null;
                if (socialLinks && socialLinks.linkedin) {
                    console.log(`   🔗 Lusha found LinkedIn: ${socialLinks.linkedin}`);
                    linkedIn = {
                        linkedIn: socialLinks.linkedin,
                        source: 'lusha_api',
                        confidence: 95,
                        cost: 0.08,
                        verified: true
                    };
                }

                // EXTRACT COMPREHENSIVE LUSHA DATA
                const comprehensiveLushaData = this.extractComprehensiveLushaData(
                    data.contact?.data || data, 
                    'phone_discovery'
                );
                
                if (comprehensiveLushaData) {
                    console.log(`   📊 Extracted comprehensive Lusha data - completeness: ${comprehensiveLushaData.metadata.dataCompleteness}%`);
                }
                
                return { phones, linkedIn, comprehensiveLushaData };
            } else {
                const errorText = await response.text();
                console.log(`   🔍 DEBUG: Lusha Error: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha phone search error: ${error.message}`);
        }
        
        return { phones: [], linkedIn: null, comprehensiveLushaData: null };
    }

    /**
     * 📧 EXTRACT LUSHA EMAILS (When other discovery fails)
     */
    async extractLushaEmails(executiveName, companyName) {
        console.log(`   🔍 DEBUG: Lusha email extraction for ${executiveName} at ${companyName}`);
        
        if (!this.config.LUSHA_API_KEY) {
            console.log(`   ❌ Lusha API key not available`);
            return [];
        }
        
        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            
            const url = 'https://api.lusha.com/v2/person';
            const params = new URLSearchParams({
                firstName: firstName,
                lastName: lastName,
                companyName: companyName
            });
            
            const response = await fetch(`${url}?${params}`, {
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const emailAddresses = data.contact?.data?.emailAddresses || data.emailAddresses || [];
                
                if (emailAddresses.length > 0) {
                    console.log(`   ✅ Lusha found ${emailAddresses.length} emails`);
                    return emailAddresses.map(email => ({
                        email: email.email,
                        isValid: email.emailConfidence === 'A+',
                        confidence: email.emailConfidence === 'A+' ? 95 : 80,
                        source: 'lusha_discovery',
                        result: 'discovered',
                        cost: 0.08
                    }));
                }
            }
        } catch (error) {
            console.log(`   ❌ Lusha email extraction error: ${error.message}`);
        }
        
        return [];
    }

    /**
     * 🌐 EXTRACT DOMAIN FROM COMPANY NAME
     */
    extractDomainFromCompany(companyName) {
        if (!companyName) return null;
        
        // Simple domain guessing from company name
        const cleanName = companyName.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .replace(/(inc|corp|llc|ltd|company|plc)$/g, '');
        
        return `${cleanName}.com`;
    }

    /**
     * 🔍 FIND CFO IN CORESIGNAL EXECUTIVES
     * 
     * When ExecutiveResearch fails to find CFO, search the CoreSignal executives
     * that were already retrieved to find finance leaders
     */
    async findCFOInCoreSignalExecutives(companyResolution) {
        console.log(`   🔍 Searching CoreSignal executives for CFO...`);
        
        try {
            // Get CoreSignal company intelligence
            const { ExecutiveContactIntelligence } = require('./ExecutiveContactIntelligence');
            const executiveIntelligence = new ExecutiveContactIntelligence(this.config);
            
            const coreSignalData = await executiveIntelligence.getCoreSignalCompanyIntelligence(companyResolution.companyName);
            
            if (!coreSignalData || !coreSignalData.key_executives || !Array.isArray(coreSignalData.key_executives)) {
                console.log(`   ❌ No CoreSignal executives available for ${companyResolution.companyName}`);
                return null;
            }
            
            console.log(`   📊 Found ${coreSignalData.key_executives.length} CoreSignal executives`);
            
            // Enhanced CFO search with department and parallel division discovery
            // Includes industry-specific variations for FinTech, SaaS, PropTech, Design, etc.
            const cfoKeywords = [
                // Tier 1: Primary CFO roles
                'cfo', 'chief financial officer', 'chief financial', 'chief accounting officer', 'cao',
                // Tier 2: VP Finance roles  
                'vp finance', 'vice president finance', 'vp of finance', 'finance director', 'head of finance',
                'vp financial', 'vice president financial', 'vp of financial',
                // Tier 3: Controller roles
                'controller', 'corporate controller', 'assistant controller', 'senior controller', 'group controller',
                // Tier 4: Finance management
                'finance manager', 'senior finance manager', 'accounting manager', 'financial planning manager',
                'fp&a manager', 'financial planning and analysis', 'finance operations manager',
                // Tier 5: Treasury and budget
                'treasurer', 'assistant treasurer', 'budget manager', 'financial analyst manager',
                // Industry-specific variations
                'head of accounting', 'director of finance', 'director of accounting', 'senior director finance',
                'principal finance', 'lead finance', 'finance lead', 'accounting lead',
                // FinTech/SaaS specific
                'head of fp&a', 'director fp&a', 'vp fp&a', 'finance operations director',
                // PropTech/Real Estate specific  
                'head of financial operations', 'director of financial operations',
                // Design/Creative industry specific
                'finance and operations', 'head of finance and operations'
            ];
            
            let bestCFO = null;
            let bestCFOConfidence = 0;
            let departmentMembers = []; // Track all finance department members
            
            for (const executive of coreSignalData.key_executives) {
                const name = executive.member_full_name || executive.name || '';
                const title = (executive.member_position_title || executive.title || '').toLowerCase();
                const email = executive.member_professional_email || executive.email || '';
                const linkedin = executive.member_linkedin_url || executive.linkedin || '';
                
                console.log(`      Checking: ${name} - ${title}`);
                
                // Check for CFO and finance department members
                const cfoMatch = cfoKeywords.some(keyword => title.includes(keyword));
                if (cfoMatch && name) {
                    const confidence = this.calculateExecutiveConfidence(title, email, linkedin);
                    const tier = this.categorizeFinanceRole(title);
                    
                    // Add to department members
                    departmentMembers.push({
                        name: name,
                        title: executive.member_position_title || executive.title || '',
                        email: email,
                        linkedIn: linkedin,
                        confidence: confidence,
                        tier: tier,
                        department: 'Finance'
                    });
                    
                    // Check if this is the best CFO candidate
                    if (confidence > bestCFOConfidence) {
                        bestCFO = {
                            name: name,
                            title: executive.member_position_title || executive.title || '',
                            email: email,
                            linkedIn: linkedin,
                            confidence: confidence,
                            source: 'CoreSignal Executive API',
                            role: 'CFO',
                            tier: tier,
                            departmentMembers: departmentMembers.length
                        };
                        bestCFOConfidence = confidence;
                        console.log(`      ✅ Found CFO: ${name} (${confidence}% confidence)`);
                    }
                }
            }
            
            if (bestCFO) {
                console.log(`   🎯 Returning CFO from CoreSignal: ${bestCFO.name} (${bestCFO.confidence}%)`);
                console.log(`   📊 Finance Department: ${departmentMembers.length} total members found`);
                
                // Add department breakdown to result
                bestCFO.departmentBreakdown = {
                    totalMembers: departmentMembers.length,
                    members: departmentMembers,
                    tiers: this.categorizeDepartmentByTiers(departmentMembers)
                };
                
                return bestCFO;
            }
            
            console.log(`   ❌ No CFO found in CoreSignal executives`);
            console.log(`   📊 Finance Department: ${departmentMembers.length} members found but no clear CFO`);
            
            // Return department info even if no clear CFO
            if (departmentMembers.length > 0) {
                return {
                    name: null,
                    title: null,
                    role: 'CFO',
                    source: 'CoreSignal Executive API',
                    departmentBreakdown: {
                        totalMembers: departmentMembers.length,
                        members: departmentMembers,
                        tiers: this.categorizeDepartmentByTiers(departmentMembers),
                        note: 'Finance department members found but no clear CFO identified'
                    }
                };
            }
            return null;
            
        } catch (error) {
            console.log(`   ❌ Error searching CoreSignal executives: ${error.message}`);
            return null;
        }
    }

    /**
     * 🔍 FIND CRO IN CORESIGNAL EXECUTIVES
     * 
     * When ExecutiveResearch fails to find CRO, search the CoreSignal executives
     * that were already retrieved to find revenue leaders
     */
    async findCROInCoreSignalExecutives(companyResolution) {
        console.log(`   🔍 Searching CoreSignal executives for CRO...`);
        
        try {
            // Get CoreSignal company intelligence
            const { ExecutiveContactIntelligence } = require('./ExecutiveContactIntelligence');
            const executiveIntelligence = new ExecutiveContactIntelligence(this.config);
            
            const coreSignalData = await executiveIntelligence.getCoreSignalCompanyIntelligence(companyResolution.companyName);
            
            if (!coreSignalData || !coreSignalData.key_executives || !Array.isArray(coreSignalData.key_executives)) {
                console.log(`   ❌ No CoreSignal executives available for ${companyResolution.companyName}`);
                return null;
            }
            
            console.log(`   📊 Found ${coreSignalData.key_executives.length} CoreSignal executives`);
            
            // Enhanced CRO search with department and parallel division discovery
            // Includes industry-specific variations for FinTech, SaaS, PropTech, Design, etc.
            const croKeywords = [
                // Tier 1: Primary CRO roles
                'cro', 'chief revenue officer', 'chief sales officer', 'cso', 'chief commercial officer', 'cco',
                'chief growth officer', 'cgo', 'chief business officer', 'cbo',
                // Tier 2: VP Sales/Revenue roles
                'vp sales', 'vice president sales', 'vp of sales', 'vp revenue', 'vice president revenue', 'vp of revenue',
                'vp commercial', 'vice president commercial', 'vp of commercial', 'vp business development',
                'vp growth', 'vice president growth', 'vp of growth',
                // Tier 3: Director roles
                'sales director', 'director of sales', 'revenue director', 'head of sales', 'head of revenue',
                'director of revenue', 'director of commercial', 'head of commercial', 'head of business development',
                'director of business development', 'senior director sales', 'senior director revenue',
                // Tier 4: Regional and senior management
                'regional sales director', 'senior sales manager', 'national sales manager', 'regional revenue director',
                'enterprise sales director', 'global sales director', 'international sales director',
                // Tier 5: Sales management
                'sales manager', 'account director', 'senior account manager', 'business development director',
                'sales lead', 'revenue lead', 'commercial lead', 'growth lead',
                // Industry-specific variations
                // FinTech/SaaS specific
                'head of customer success', 'vp customer success', 'director customer success',
                'head of partnerships', 'vp partnerships', 'director partnerships',
                'head of go-to-market', 'vp go-to-market', 'director go-to-market', 'gtm director',
                // PropTech/Real Estate specific
                'head of leasing', 'vp leasing', 'director leasing', 'head of client success',
                // Design/Creative industry specific
                'head of customer growth', 'director of customer growth', 'vp customer growth',
                // Technology/Data Analytics specific
                'head of enterprise sales', 'director enterprise sales', 'vp enterprise sales'
            ];
            
            let bestCRO = null;
            let bestCROConfidence = 0;
            let revenueDepartmentMembers = []; // Track all revenue/sales department members
            
            for (const executive of coreSignalData.key_executives) {
                const name = executive.member_full_name || executive.name || '';
                const title = (executive.member_position_title || executive.title || '').toLowerCase();
                const email = executive.member_professional_email || executive.email || '';
                const linkedin = executive.member_linkedin_url || executive.linkedin || '';
                
                console.log(`      Checking: ${name} - ${title}`);
                
                // Check for CRO and revenue department members
                const croMatch = croKeywords.some(keyword => title.includes(keyword));
                if (croMatch && name) {
                    const confidence = this.calculateExecutiveConfidence(title, email, linkedin);
                    const tier = this.categorizeRevenueRole(title);
                    
                    // Add to department members
                    revenueDepartmentMembers.push({
                        name: name,
                        title: executive.member_position_title || executive.title || '',
                        email: email,
                        linkedIn: linkedin,
                        confidence: confidence,
                        tier: tier,
                        department: 'Revenue/Sales'
                    });
                    
                    // Check if this is the best CRO candidate
                    if (confidence > bestCROConfidence) {
                        bestCRO = {
                            name: name,
                            title: executive.member_position_title || executive.title || '',
                            email: email,
                            linkedIn: linkedin,
                            confidence: confidence,
                            source: 'CoreSignal Executive API',
                            role: 'CRO',
                            tier: tier,
                            departmentMembers: revenueDepartmentMembers.length
                        };
                        bestCROConfidence = confidence;
                        console.log(`      ✅ Found CRO: ${name} (${confidence}% confidence)`);
                    }
                }
            }
            
            if (bestCRO) {
                console.log(`   🎯 Returning CRO from CoreSignal: ${bestCRO.name} (${bestCRO.confidence}%)`);
                console.log(`   📊 Revenue/Sales Department: ${revenueDepartmentMembers.length} total members found`);
                
                // Add department breakdown to result
                bestCRO.departmentBreakdown = {
                    totalMembers: revenueDepartmentMembers.length,
                    members: revenueDepartmentMembers,
                    tiers: this.categorizeDepartmentByTiers(revenueDepartmentMembers)
                };
                
                return bestCRO;
            }
            
            console.log(`   ❌ No CRO found in CoreSignal executives`);
            console.log(`   📊 Revenue/Sales Department: ${revenueDepartmentMembers.length} members found but no clear CRO`);
            
            // Return department info even if no clear CRO
            if (revenueDepartmentMembers.length > 0) {
                return {
                    name: null,
                    title: null,
                    role: 'CRO',
                    source: 'CoreSignal Executive API',
                    departmentBreakdown: {
                        totalMembers: revenueDepartmentMembers.length,
                        members: revenueDepartmentMembers,
                        tiers: this.categorizeDepartmentByTiers(revenueDepartmentMembers),
                        note: 'Revenue/Sales department members found but no clear CRO identified'
                    }
                };
            }
            return null;
            
        } catch (error) {
            console.log(`   ❌ Error searching CoreSignal executives: ${error.message}`);
            return null;
        }
    }

    /**
     * 📊 CALCULATE EXECUTIVE CONFIDENCE SCORE
     */
    calculateExecutiveConfidence(title, email, linkedin) {
        let confidence = 50; // Base confidence
        
        // Title relevance
        if (title.includes('chief') || title.includes('vp') || title.includes('director')) {
            confidence += 20;
        }
        
        // Contact information availability
        if (email && email.includes('@')) {
            confidence += 15;
        }
        
        if (linkedin && linkedin.includes('linkedin.com')) {
            confidence += 15;
        }
        
        return Math.min(100, confidence);
    }

    /**
     * 🏷️ CATEGORIZE FINANCE ROLE TIER
     */
    categorizeFinanceRole(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('cfo') || titleLower.includes('chief financial officer')) {
            return 1; // Tier 1: CFO
        }
        if (titleLower.includes('controller') || titleLower.includes('chief accounting officer')) {
            return 2; // Tier 2: Controller
        }
        if (titleLower.includes('vp finance') || titleLower.includes('finance director')) {
            return 3; // Tier 3: VP Finance
        }
        if (titleLower.includes('treasurer')) {
            return 4; // Tier 4: Treasurer
        }
        if (titleLower.includes('finance')) {
            return 5; // Tier 5: Other Finance
        }
        
        return 5; // Default tier
    }

    /**
     * 🏷️ CATEGORIZE REVENUE ROLE TIER
     */
    categorizeRevenueRole(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('cro') || titleLower.includes('chief revenue officer')) {
            return 1; // Tier 1: CRO
        }
        if (titleLower.includes('cso') || titleLower.includes('chief sales officer')) {
            return 2; // Tier 2: CSO
        }
        if (titleLower.includes('vp sales') || titleLower.includes('vp revenue')) {
            return 3; // Tier 3: VP Sales/Revenue
        }
        if (titleLower.includes('sales director') || titleLower.includes('revenue director')) {
            return 4; // Tier 4: Sales/Revenue Director
        }
        if (titleLower.includes('sales') || titleLower.includes('revenue')) {
            return 5; // Tier 5: Other Sales/Revenue
        }
        
        return 5; // Default tier
    }

    /**
     * 📧 TEST BOTH DOMAINS FOR ACQUIRED COMPANIES
     * 
     * When a company is acquired, test emails at both original and parent domains
     */
    async testBothDomainsForAcquisition(executive, domainInfo, companyResolution) {
        console.log(`   🔍 TESTING BOTH DOMAINS for ${executive.name} (${domainInfo.acquisitionType})`);
        
        const allEmails = [];
        
        // Test parent domain first (more likely to be current)
        if (domainInfo.primary) {
            console.log(`   📧 Testing parent domain: ${domainInfo.primary}`);
            const parentEmails = await this.generateAndValidateEmails(executive.name, domainInfo.primary);
            parentEmails.forEach(email => {
                email.domainType = 'parent';
                email.acquisitionAware = true;
            });
            allEmails.push(...parentEmails);
        }
        
        // Test original domain as fallback
        if (domainInfo.fallback && domainInfo.fallback !== domainInfo.primary) {
            console.log(`   📧 Testing original domain: ${domainInfo.fallback}`);
            const originalEmails = await this.generateAndValidateEmails(executive.name, domainInfo.fallback);
            originalEmails.forEach(email => {
                email.domainType = 'original';
                email.acquisitionAware = true;
            });
            allEmails.push(...originalEmails);
        }
        
        // Sort by validation success (valid emails first)
        allEmails.sort((a, b) => {
            if (a.isValid && !b.isValid) return -1;
            if (!a.isValid && b.isValid) return 1;
            return b.confidence - a.confidence;
        });
        
        console.log(`   🎯 Acquisition testing results: ${allEmails.length} emails tested, ${allEmails.filter(e => e.isValid).length} valid`);
        
        return allEmails;
    }
}

module.exports = { ContactValidator };
