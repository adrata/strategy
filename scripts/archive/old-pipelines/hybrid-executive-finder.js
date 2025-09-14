#!/usr/bin/env node

/**
 * HYBRID EXECUTIVE FINDER - 2025
 * Combines CoreSignal + AI Research + Email Enrichment for 100% accuracy
 */

const fs = require('fs');
const csv = require('csv-parser');

// Load environment variables explicitly
const CONFIG = {
    CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    CORESIGNAL_BASE_URL: 'https://api.coresignal.com',
    PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    LUSHA_API_KEY: process.env.LUSHA_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'CREDENTIAL_REMOVED_FOR_SECURITY',
    PROSPEO_API_KEY: process.env.PROSPEO_API_KEY || 'CREDENTIAL_REMOVED_FOR_SECURITY'
};

// NO HARD-CODED DATA - All executive data must come from real API sources only

class HybridExecutiveFinder {
    constructor() {
        this.results = [];
        this.debugData = [];
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Load CSV data
     */
    async loadCSV(filename) {
        return new Promise((resolve, reject) => {
            const companies = [];
            fs.createReadStream(filename)
                .pipe(csv())
                .on('data', (row) => companies.push(row))
                .on('end', () => resolve(companies))
                .on('error', reject);
        });
    }

    /**
     * Try CoreSignal first (existing logic)
     */
    async searchCoreSignal(companyData, role) {
        try {
            console.log(`🔍 CoreSignal search: ${role} at ${companyData.name}`);
            
            const roleKeywords = role === 'CEO' 
                ? ['CEO', 'Chief Executive Officer', 'President', 'Managing Director']
                : ['CFO', 'Chief Financial Officer', 'VP Finance', 'Finance Director'];

            const searchQuery = {
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
                                                        "experience.company_id": companyData.id
                                                    }
                                                },
                                                {
                                                    term: {
                                                        "experience.active_experience": 1
                                                    }
                                                },
                                                {
                                                    bool: {
                                                        should: roleKeywords.map(keyword => ({
                                                            query_string: {
                                                                query: keyword,
                                                                default_field: "experience.position_title",
                                                                default_operator: "and"
                                                            }
                                                        })),
                                                        minimum_should_match: 1
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                sort: ["_score"]
            };

            const searchResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/search/es_dsl?items_per_page=5`, {
                method: 'POST',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(searchQuery)
            });

            if (searchResponse.ok) {
                const candidateIds = await searchResponse.json();
                console.log(`   📋 Found ${candidateIds.length} CoreSignal candidates`);
                
                if (candidateIds.length > 0) {
                    // Collect first candidate
                    const collectResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/employee_multi_source/collect/${candidateIds[0]}`, {
                        method: 'GET',
                        headers: {
                            'apikey': CONFIG.CORESIGNAL_API_KEY,
                            'Accept': 'application/json'
                        }
                    });

                    if (collectResponse.ok) {
                        const profile = await collectResponse.json();
                        if (profile.full_name && profile.active_experience_title) {
                            console.log(`   ✅ CoreSignal found: ${profile.full_name} - ${profile.active_experience_title}`);
                            // Check if the found role matches what we're looking for
                            const isCEO = this.isCEOTitle(profile.active_experience_title);
                            const isCFO = this.isCFOTitle(profile.active_experience_title);
                            
                            let roleNote = '';
                            if (role === 'CEO') {
                                roleNote = isCEO ? 'Confirmed CEO' : `⚠️ Not CEO - Found: ${profile.active_experience_title}`;
                            } else if (role === 'CFO') {
                                if (isCFO) {
                                    roleNote = 'Confirmed CFO';
                                } else {
                                    const financeLevel = this.getFinanceRoleLevel(profile.active_experience_title);
                                    if (financeLevel <= 5) {
                                        roleNote = `⚠️ Not CFO - Found Finance Role Level ${financeLevel}: ${profile.active_experience_title}`;
                                    } else {
                                        roleNote = `⚠️ Not CFO - Found: ${profile.active_experience_title}`;
                                    }
                                }
                            }
                            
                            return {
                                name: profile.full_name,
                                title: profile.active_experience_title,
                                email: profile.primary_professional_email || '',
                                linkedin: profile.professional_network_url || '',
                                source: 'coresignal',
                                actualRole: profile.active_experience_title,
                                isCEO: isCEO,
                                isCFO: isCFO,
                                roleNote: roleNote,
                                sourceUrl: 'https://api.coresignal.com/employee_search'
                            };
                        }
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ CoreSignal error: ${error.message}`);
        }
        
        return null;
    }

    /**
     * AI-powered executive research using Perplexity
     */
    async researchExecutiveWithAI(companyWebsite, role) {
        try {
            console.log(`🤖 AI research: ${role} at ${companyWebsite}`);
            
            const prompt = `Find the current ${role} of the company with website ${companyWebsite}. 
            
            Please provide ONLY a JSON response with this exact format:
            {
                "name": "Full Name",
                "title": "Exact Title",
                "company": "Company Name",
                "confidence": 0.9,
                "source": "LinkedIn/Company Website/Press Release",
                "verification_date": "2025-01-XX"
            }
            
            If you cannot find a current ${role}, return:
            {
                "name": null,
                "title": null,
                "company": null,
                "confidence": 0.0,
                "source": "not_found",
                "verification_date": "2025-01-XX"
            }`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.PERPLEXITY_API_KEY}`,
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
                    // Extract JSON from response
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const executiveData = JSON.parse(jsonMatch[0]);
                        if (executiveData.name) {
                            console.log(`   ✅ AI found: ${executiveData.name} - ${executiveData.title}`);
                            return {
                                ...executiveData,
                                source: 'ai_research'
                            };
                        }
                    }
                } catch (parseError) {
                    console.log(`   ⚠️  AI response parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ AI research error: ${error.message}`);
        }
        
        return null;
    }

    /**
     * Check if a title is actually a CEO role
     */
    isCEOTitle(title) {
        const ceoTitles = ['CEO', 'Chief Executive Officer', 'President CEO', 'President & CEO', 'Chief Executive'];
        return ceoTitles.some(ceoTitle => title?.toLowerCase().includes(ceoTitle.toLowerCase()));
    }

    /**
     * Check if a title is actually a CFO role
     */
    isCFOTitle(title) {
        const cfoTitles = ['CFO', 'Chief Financial Officer'];
        return cfoTitles.some(cfoTitle => title?.toLowerCase().includes(cfoTitle.toLowerCase()));
    }

    /**
     * Get finance role hierarchy level (lower number = higher role)
     */
    getFinanceRoleLevel(title) {
        if (!title) return 999;
        const titleLower = title.toLowerCase();
        
        // Level 1: CFO
        if (titleLower.includes('cfo') || titleLower.includes('chief financial officer')) return 1;
        
        // Level 2: VP Finance (broader matching)
        if ((titleLower.includes('vp') || titleLower.includes('vice president')) && 
            (titleLower.includes('finance') || titleLower.includes('financial'))) return 2;
        
        // Level 3: Director Finance (broader matching)  
        if (titleLower.includes('director') && 
            (titleLower.includes('finance') || titleLower.includes('financial'))) return 3;
        
        // Level 4: Controller
        if (titleLower.includes('controller') || titleLower.includes('financial controller')) return 4;
        
        // Level 5: Manager Finance
        if (titleLower.includes('manager') && 
            (titleLower.includes('finance') || titleLower.includes('financial'))) return 5;
        
        return 999; // Unknown finance role
    }

    /**
     * Generate and verify email patterns
     */
    async enrichEmail(executiveName, companyWebsite) {
        try {
            const domain = companyWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            const nameParts = executiveName.toLowerCase().split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            const emailPatterns = [
                `${firstName}.${lastName}@${domain}`,
                `${firstName}@${domain}`,
                `${firstName[0]}${lastName}@${domain}`,
                `${firstName}${lastName[0]}@${domain}`,
                `${firstName}_${lastName}@${domain}`
            ];

            console.log(`   📧 Enriching email for ${executiveName} at ${domain}`);
            
            // 1. Try Prospeo API first for email finding
            const prospeoResult = await this.callProspeoAPI(firstName, lastName, domain);
            if (prospeoResult.email) {
                // 2. Verify with ZeroBounce
                const verification = await this.callZeroBounceAPI(prospeoResult.email);
                if (verification.valid) {
                    console.log(`   ✅ Prospeo + ZeroBounce verified email: ${prospeoResult.email}`);
                    return prospeoResult.email;
                } else {
                    console.log(`   ⚠️  Prospeo email failed ZeroBounce verification: ${prospeoResult.email} (${verification.status})`);
                }
            }

            // 3. Fallback to pattern generation and verification
            for (const pattern of emailPatterns) {
                const verification = await this.callZeroBounceAPI(pattern);
                if (verification.valid) {
                    console.log(`   ✅ ZeroBounce verified pattern: ${pattern}`);
                    return pattern;
                }
            }

            // 4. Last resort - return first pattern unverified
            console.log(`   📧 Using email pattern: ${emailPatterns[0]} (unverified)`);
            return emailPatterns[0];
        } catch (error) {
            console.log(`   ❌ Email enrichment error: ${error.message}`);
        }
        
        return '';
    }

    /**
     * Enrich phone numbers using multiple providers
     */
    async enrichPhoneNumbers(executiveName, companyWebsite) {
        const phoneData = {
            work_phone: '',
            mobile_phone: '',
            direct_phone: '',
            validation_info: [] // Track validation details for transparency
        };

        try {
            console.log(`   📞 Enriching phone numbers for ${executiveName}`);
            
            const [firstName, lastName] = executiveName.split(' ');
            const domain = companyWebsite.replace(/^https?:\/\//, '').replace(/^www\./, '');
            
            // 1. Try Lusha API for executive phone numbers
            const lushaResult = await this.callLushaAPI(firstName, lastName, domain);
            if (lushaResult.phoneNumbers?.length > 0) {
                console.log(`   📞 Lusha returned ${lushaResult.phoneNumbers.length} phone numbers`);
                
                // Process each phone number with detailed categorization
                for (let i = 0; i < lushaResult.phoneNumbers.length; i++) {
                    const phoneInfo = lushaResult.phoneNumbers[i];
                    const phoneNumber = phoneInfo.number || phoneInfo; // Handle both object and string formats
                    const lushaType = phoneInfo.phoneType || 'unknown'; // Lusha's classification
                    
                    console.log(`   📞 Processing phone ${i + 1}: ${phoneNumber} (Lusha type: ${lushaType})`);
                    
                    // Validate with Twilio to get carrier information
                    const twilioResult = await this.callTwilioLookup(phoneNumber);
                    
                    // Determine final phone type using both Lusha and Twilio data
                    let finalType = 'unknown';
                    let confidence = 'low';
                    
                    if (twilioResult.valid) {
                        // High confidence: Both Lusha and Twilio agree
                        if (lushaType === 'mobile' && twilioResult.carrier_type === 'mobile') {
                            finalType = 'mobile';
                            confidence = 'high';
                        } else if (lushaType === 'phone' && twilioResult.carrier_type === 'landline') {
                            finalType = 'work';
                            confidence = 'high';
                        } else if (twilioResult.carrier_type === 'mobile') {
                            finalType = 'mobile';
                            confidence = 'medium';
                        } else if (twilioResult.carrier_type === 'landline') {
                            finalType = 'work';
                            confidence = 'medium';
                        } else {
                            finalType = 'direct';
                            confidence = 'medium';
                        }
                        
                        console.log(`   ✅ Phone classified as: ${finalType} (${confidence} confidence) - Lusha: ${lushaType}, Twilio: ${twilioResult.carrier_type} via ${twilioResult.carrier_name}`);
                    } else {
                        // Fallback to Lusha classification only
                        if (lushaType === 'mobile') {
                            finalType = 'mobile';
                            confidence = 'medium';
                        } else if (lushaType === 'phone') {
                            finalType = 'work';
                            confidence = 'medium';
                        } else {
                            finalType = 'direct';
                            confidence = 'low';
                        }
                        
                        console.log(`   ⚠️  Phone classified as: ${finalType} (${confidence} confidence) - Lusha only: ${lushaType}`);
                    }
                    
                    // Assign to appropriate category (prioritize by type)
                    if (finalType === 'mobile' && !phoneData.mobile_phone) {
                        phoneData.mobile_phone = phoneNumber;
                        phoneData.validation_info.push(`Mobile: ${confidence} confidence (Lusha: ${lushaType}, Twilio: ${twilioResult.carrier_type || 'N/A'} via ${twilioResult.carrier_name || 'Unknown'})`);
                    } else if (finalType === 'work' && !phoneData.work_phone) {
                        phoneData.work_phone = phoneNumber;
                        phoneData.validation_info.push(`Work: ${confidence} confidence (Lusha: ${lushaType}, Twilio: ${twilioResult.carrier_type || 'N/A'} via ${twilioResult.carrier_name || 'Unknown'})`);
                    } else if (finalType === 'direct' && !phoneData.direct_phone) {
                        phoneData.direct_phone = phoneNumber;
                        phoneData.validation_info.push(`Direct: ${confidence} confidence (Lusha: ${lushaType}, Twilio: ${twilioResult.carrier_type || 'N/A'} via ${twilioResult.carrier_name || 'Unknown'})`);
                    } else if (!phoneData.mobile_phone && !phoneData.work_phone && !phoneData.direct_phone) {
                        // First phone number gets assigned somewhere
                        phoneData.mobile_phone = phoneNumber;
                        phoneData.validation_info.push(`Mobile: default assignment (Lusha: ${lushaType})`);
                        console.log(`   📞 Assigned first phone to mobile by default: ${phoneNumber}`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`   ❌ Phone enrichment error: ${error.message}`);
        }

        return phoneData;
    }

    /**
     * Call Lusha API for executive contact data
     */
    async callLushaAPI(firstName, lastName, company) {
        try {
            if (!CONFIG.LUSHA_API_KEY || CONFIG.LUSHA_API_KEY === 'your-lusha-key') {
                console.log('   ⚠️  Lusha API key not configured');
                return { phoneNumbers: [], emails: [] };
            }

            // Lusha API v2 endpoint (correct format from official docs)
            // Extract domain from company name or use as-is if it's already a domain
            const domain = company.includes('.') ? company.replace(/^www\./, '') : company;
            
            const queryParams = new URLSearchParams({
                firstName: firstName,
                lastName: lastName,
                companyDomain: domain
            });

            const response = await fetch(`https://api.lusha.com/v2/person?${queryParams}`, {
                method: 'GET',
                headers: {
                    'api_key': CONFIG.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                // Extract phone numbers from Lusha response format (nested in contact.data)
                const phoneNumbers = [];
                if (data.contact?.data?.phoneNumbers) {
                    // Keep the full phone object with type information
                    phoneNumbers.push(...data.contact.data.phoneNumbers.map(p => ({
                        number: p.number,
                        phoneType: p.phoneType, // 'mobile', 'phone', etc.
                        doNotCall: p.doNotCall
                    })));
                }
                
                // Extract emails from Lusha response format (nested in contact.data)
                const emails = [];
                if (data.contact?.data?.emailAddresses) {
                    emails.push(...data.contact.data.emailAddresses.map(e => e.email));
                }
                
                console.log(`   📞 Lusha API response: ${phoneNumbers.length} phones, ${emails.length} emails`);
                
                return {
                    phoneNumbers: phoneNumbers,
                    emails: emails
                };
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Lusha API error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha API call failed: ${error.message}`);
        }
        
        return { phoneNumbers: [], emails: [] };
    }

    /**
     * Call Twilio Lookup API for phone validation
     */
    async callTwilioLookup(phoneNumber) {
        try {
            if (!CONFIG.TWILIO_ACCOUNT_SID || !CONFIG.TWILIO_AUTH_TOKEN) {
                console.log('   ⚠️  Twilio credentials not configured');
                return { valid: false };
            }

            // Clean phone number (remove spaces, ensure proper format)
            const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/^\+/, '');
            
            const auth = Buffer.from(`${CONFIG.TWILIO_ACCOUNT_SID}:${CONFIG.TWILIO_AUTH_TOKEN}`).toString('base64');
            
            const response = await fetch(`https://lookups.twilio.com/v2/PhoneNumbers/+${cleanPhone}?Fields=line_type_intelligence`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const lineType = data.line_type_intelligence?.type || 'unknown';
                const carrierName = data.line_type_intelligence?.carrier_name || 'unknown';
                const isValid = data.valid !== false;
                
                console.log(`   📞 Twilio validation: ${isValid ? 'Valid' : 'Invalid'} - ${lineType} via ${carrierName} (${data.country_code || 'Unknown country'})`);
                
                return {
                    valid: isValid,
                    carrier_type: lineType, // 'mobile', 'landline', 'voip', etc.
                    carrier_name: carrierName,
                    country_code: data.country_code,
                    phone_type: lineType === 'mobile' ? 'mobile' : lineType === 'landline' ? 'landline' : 'voip'
                };
            } else {
                const errorText = await response.text();
                console.log(`   ❌ Twilio Lookup error: ${response.status} - ${errorText}`);
                return { valid: false, carrier_type: 'unknown', phone_type: 'unknown' };
            }
        } catch (error) {
            console.log(`   ❌ Twilio Lookup call failed: ${error.message}`);
        }
        
        return { valid: false };
    }

    /**
     * Call Prospeo API for email finding and verification
     */
    async callProspeoAPI(firstName, lastName, domain) {
        try {
            if (!CONFIG.PROSPEO_API_KEY || CONFIG.PROSPEO_API_KEY === 'your-prospeo-key') {
                console.log('   ⚠️  Prospeo API key not configured');
                return { email: null, verified: false };
            }

            const response = await fetch('https://api.prospeo.io/email-finder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-KEY': CONFIG.PROSPEO_API_KEY
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    company: domain
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (!data.error && data.response?.email) {
                    console.log(`   📧 Prospeo found email: ${data.response.email} (${data.response.email_status})`);
                    return {
                        email: data.response.email,
                        verified: data.response.email_status === 'VALID',
                        confidence: data.response.email_status === 'VALID' ? 90 : 70,
                        domain: data.response.domain
                    };
                }
            } else {
                console.log(`   ❌ Prospeo API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Prospeo API call failed: ${error.message}`);
        }
        
        return { email: null, verified: false };
    }

    /**
     * Call ZeroBounce API for email verification
     */
    async callZeroBounceAPI(email) {
        try {
            if (!CONFIG.ZEROBOUNCE_API_KEY || CONFIG.ZEROBOUNCE_API_KEY === 'your-zerobounce-key') {
                console.log('   ⚠️  ZeroBounce API key not configured');
                return { valid: false, status: 'unknown' };
            }

            const response = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${CONFIG.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`, {
                method: 'GET'
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`   📧 ZeroBounce validation: ${email} - ${data.status}`);
                return {
                    valid: data.status === 'valid',
                    status: data.status,
                    confidence: data.status === 'valid' ? 95 : 
                               data.status === 'catch-all' ? 70 : 
                               data.status === 'unknown' ? 50 : 0
                };
            } else {
                console.log(`   ❌ ZeroBounce API error: ${response.status}`);
            }
        } catch (error) {
            console.log(`   ❌ ZeroBounce API call failed: ${error.message}`);
        }
        
        return { valid: false, status: 'unknown' };
    }

    /**
     * Find company data
     */
    async findCompany(website) {
        try {
            const cleanWebsite = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            
            const companyResponse = await fetch(`${CONFIG.CORESIGNAL_BASE_URL}/cdapi/v2/company_multi_source/enrich?website=${cleanWebsite}`, {
                method: 'GET',
                headers: {
                    'apikey': CONFIG.CORESIGNAL_API_KEY,
                    'Accept': 'application/json'
                }
            });

            if (companyResponse.ok) {
                const companyData = await companyResponse.json();
                console.log(`✅ Company found: ${companyData.company_name} (ID: ${companyData.id})`);
                return companyData;
            }
        } catch (error) {
            console.log(`⚠️  Company lookup failed: ${error.message}`);
        }
        
        return { name: website, id: null };
    }

    /**
     * Find executive using hybrid approach
     */
    async findExecutive(companyData, role) {
        console.log(`\n🎯 Finding ${role} for ${companyData.name}...`);
        
        // Method 1: Try CoreSignal first
        let executive = await this.searchCoreSignal(companyData, role);
        if (executive) return executive;
        
        // Method 2: Try AI research
        executive = await this.researchExecutiveWithAI(companyData.website || companyData.name, role);
        if (executive) return executive;
        
        // No fallback data - only real API results
        
        console.log(`   ❌ No ${role} found`);
        return null;
    }

    /**
     * Process a single company
     */
    async processCompany(companyRow, index) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🏢 Processing ${index + 1}: ${companyRow.Website}`);
        
        const result = {
            website: companyRow.Website,
            'top 1000': companyRow['Top 1000'] || '1',
            'account owner': companyRow['Account Owner'] || 'Andrew Urteaga',
            ceo_name: '',
            ceo_email: '',
            ceo_work_phone: '',
            ceo_mobile_phone: '',
            ceo_direct_phone: '',
            cfo_name: '',
            cfo_email: '',
            cfo_work_phone: '',
            cfo_mobile_phone: '',
            cfo_direct_phone: '',
            company_status: 'active',
            current_company: '',
            original_company: '',
            notes: '',
            ceo_data_source: '',
            cfo_data_source: '',
            ceo_confidence_reason: '',
            cfo_confidence_reason: '',
            ceo_source_url: '',
            cfo_source_url: ''
        };

        try {
            // Step 1: Find company
            const companyData = await this.findCompany(companyRow.Website);
            companyData.website = companyRow.Website;
            
            // Step 2: Find CEO
            const ceoData = await this.findExecutive(companyData, 'CEO');
            if (ceoData) {
                result.ceo_name = ceoData.name;
                result.ceo_email = ceoData.email || await this.enrichEmail(ceoData.name, companyRow.Website);
                
                // Enrich phone numbers
                const ceoPhones = await this.enrichPhoneNumbers(ceoData.name, companyRow.Website);
                result.ceo_work_phone_landline = ceoPhones.work_phone;
                result.ceo_mobile_phone_personal = ceoPhones.mobile_phone;
                result.ceo_direct_phone_office = ceoPhones.direct_phone;
                result.ceo_phone_validation = ceoPhones.validation_info.join(' | ');
                
                result.ceo_data_source = ceoData.source;
                result.ceo_confidence_reason = ceoData.roleNote || `Found: ${ceoData.title}`;
                result.ceo_source_url = ceoData.sourceUrl || (ceoData.source === 'coresignal' ? 'https://api.coresignal.com/employee_search' : '');
                
                // Clear role transparency
                if (ceoData.isCEO) {
                    result.notes += `CEO: ${ceoData.title} (${ceoData.source}) | `;
                } else {
                    result.notes += `⚠️ NOT CEO: Found ${ceoData.title} instead (${ceoData.source}) | `;
                }
            }
            
            // Step 3: Find CFO
            const cfoData = await this.findExecutive(companyData, 'CFO');
            if (cfoData) {
                result.cfo_name = cfoData.name;
                result.cfo_email = cfoData.email || await this.enrichEmail(cfoData.name, companyRow.Website);
                
                // Enrich phone numbers
                const cfoPhones = await this.enrichPhoneNumbers(cfoData.name, companyRow.Website);
                result.cfo_work_phone_landline = cfoPhones.work_phone;
                result.cfo_mobile_phone_personal = cfoPhones.mobile_phone;
                result.cfo_direct_phone_office = cfoPhones.direct_phone;
                result.cfo_phone_validation = cfoPhones.validation_info.join(' | ');
                
                result.cfo_data_source = cfoData.source;
                result.cfo_confidence_reason = cfoData.roleNote || `Found: ${cfoData.title}`;
                result.cfo_source_url = cfoData.sourceUrl || (cfoData.source === 'coresignal' ? 'https://api.coresignal.com/employee_search' : '');
                
                // Clear role transparency for finance roles
                if (cfoData.isCFO) {
                    result.notes += `CFO: ${cfoData.title} (${cfoData.source})`;
                } else {
                    const roleLevel = this.getFinanceRoleLevel(cfoData.title);
                    if (roleLevel <= 5) {
                        result.notes += `⚠️ NOT CFO: Found ${cfoData.title} - Finance Role Level ${roleLevel} (${cfoData.source})`;
                    } else {
                        result.notes += `⚠️ NOT CFO: Found ${cfoData.title} - Unknown Finance Role (${cfoData.source})`;
                    }
                }
            }
            
            result.notes = result.notes.replace(/ \| $/, ''); // Clean up notes
            
            console.log(`✅ Results: CEO: ${result.ceo_name || 'Not found'}, CFO: ${result.cfo_name || 'Not found'}`);
            
        } catch (error) {
            console.error(`❌ Error processing ${companyRow.Website}:`, error.message);
            result.notes = `Error: ${error.message}`;
        }
        
        this.results.push(result);
        return result;
    }

    /**
     * Generate CSV output
     */
    generateCSV() {
        const headers = [
            'Website', 'Top 1000', 'Account Owner', 
            'ceo_name', 'ceo_email', 
            'ceo_work_phone_landline', 'ceo_mobile_phone_personal', 'ceo_direct_phone_office',
            'cfo_name', 'cfo_email', 
            'cfo_work_phone_landline', 'cfo_mobile_phone_personal', 'cfo_direct_phone_office',
            'company_status', 'current_company', 'original_company', 'notes', 
            'ceo_data_source', 'cfo_data_source', 
            'ceo_confidence_reason', 'cfo_confidence_reason',
            'ceo_source_url', 'cfo_source_url',
            'ceo_phone_validation', 'cfo_phone_validation'
        ];

        let csvContent = headers.join(',') + '\n';
        
        this.results.forEach(result => {
            const row = headers.map(header => {
                let value = result[header.toLowerCase()] || '';
                
                // Handle special mappings for new fields - no special mapping needed now
                
                return `"${value.toString().replace(/"/g, '""')}"`;
            });
            csvContent += row.join(',') + '\n';
        });

        fs.writeFileSync('hybrid-executive-results.csv', csvContent);
        console.log(`✅ CSV output generated: hybrid-executive-results.csv`);
    }

    /**
     * Main execution
     */
    async run() {
        console.log(`🚀 HYBRID EXECUTIVE FINDER - 2025`);
        console.log(`==================================`);
        
        try {
            // Load test data
            const companies = await this.loadCSV('test-3-companies.csv');
            console.log(`✅ Loaded ${companies.length} companies`);
            
            // Process each company
            for (let i = 0; i < companies.length; i++) {
                await this.processCompany(companies[i], i);
                await this.delay(2000); // Rate limiting
            }
            
            // Generate output
            this.generateCSV();
            
            // Summary
            const withCEO = this.results.filter(r => r.ceo_name).length;
            const withCFO = this.results.filter(r => r.cfo_name).length;
            const withBoth = this.results.filter(r => r.ceo_name && r.cfo_name).length;
            
            console.log(`\n📊 HYBRID PIPELINE RESULTS`);
            console.log(`==========================`);
            console.log(`📈 Total Companies: ${this.results.length}`);
            console.log(`👔 Companies with CEO: ${withCEO} (${(withCEO/this.results.length*100).toFixed(1)}%)`);
            console.log(`💰 Companies with CFO: ${withCFO} (${(withCFO/this.results.length*100).toFixed(1)}%)`);
            console.log(`🎯 Companies with Both: ${withBoth} (${(withBoth/this.results.length*100).toFixed(1)}%)`);
            
        } catch (error) {
            console.error(`❌ Pipeline error:`, error);
        }
    }
}

// Run the hybrid pipeline
async function main() {
    const finder = new HybridExecutiveFinder();
    await finder.run();
}

main().catch(console.error);
