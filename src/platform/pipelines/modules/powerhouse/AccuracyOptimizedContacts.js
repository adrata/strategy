#!/usr/bin/env node

/**
 * 📧 ACCURACY-OPTIMIZED CONTACTS MODULE
 * 
 * Accuracy-optimized contact system that:
 * 1. Uses CoreSignal as PRIMARY email source (primary_professional_email)
 * 2. Validates only when CoreSignal confidence is low
 * 3. Uses Lusha for Top 1000 companies phone numbers
 * 4. Triangulation when providers disagree
 * 5. Discovery for maximum coverage
 */

const fetch = require('node-fetch');

class AccuracyOptimizedContacts {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: config.LUSHA_API_KEY || process.env.LUSHA_API_KEY,
            ZEROBOUNCE_API_KEY: config.ZEROBOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: config.MYEMAILVERIFIER_API_KEY || process.env.MYEMAILVERIFIER_API_KEY,
            TWILIO_ACCOUNT_SID: config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: config.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            ...config
        };

        this.accuracyStats = {
            coresignalEmailsUsed: 0,
            coresignalEmailsValidated: 0,
            lushaPhoneNumbers: 0,
            totalValidationCost: 0,
            accuracyScore: 0
        };
    }

    /**
     * 🎯 ACCURACY-OPTIMIZED CONTACT DISCOVERY
     * 
     * Uses the best data source for each contact type
     */
    async discoverAccurateContacts(executiveData, companyData) {
        console.log(`\n🎯 ACCURACY-OPTIMIZED CONTACT DISCOVERY: ${executiveData.name}`);
        console.log(`📊 Company: ${companyData.name} (Top 1000: ${companyData.isTop1000 ? 'Yes' : 'No'})`);
        console.log('=' .repeat(60));

        const result = {
            executive: executiveData,
            company: companyData,
            emails: [],
            phones: [],
            accuracy: {
                emailAccuracy: 0,
                phoneAccuracy: 0,
                overallAccuracy: 0,
                dataSource: 'unknown'
            },
            cost: 0,
            sources: [],
            timestamp: new Date().toISOString()
        };

        try {
            // STEP 1: Get professional email from Coresignal (PRIMARY SOURCE)
            console.log('🏢 STEP 1: Coresignal Professional Email Discovery');
            const coresignalEmail = await this.getCoresignalProfessionalEmail(executiveData, companyData);
            if (coresignalEmail) {
                result.emails.push(coresignalEmail);
                result.sources.push('coresignal');
                this.accuracyStats.coresignalEmailsUsed++;
                console.log(`   ✅ Coresignal email: ${coresignalEmail.email} (${coresignalEmail.confidence}% confidence)`);
            }

            // STEP 2: Validate Coresignal email if confidence is not "verified"
            if (coresignalEmail && coresignalEmail.needsValidation) {
                console.log('🔍 STEP 2: Email Validation (Coresignal confidence < verified)');
                const validatedEmail = await this.validateCoresignalEmail(coresignalEmail);
                result.emails[0] = validatedEmail; // Replace with validated version
                result.cost += validatedEmail.validationCost || 0;
                this.accuracyStats.coresignalEmailsValidated++;
                console.log(`   ✅ Validation result: ${validatedEmail.isValid ? 'VALID' : 'INVALID'} (${validatedEmail.confidence}%)`);
            }

            // STEP 3: Phone number discovery
            console.log('📱 STEP 3: Phone Number Discovery');
            const phoneResults = await this.discoverPhoneNumbers(executiveData, companyData);
            result.phones = phoneResults.phones;
            result.cost += phoneResults.cost;
            console.log(`   📞 Found ${phoneResults.phones.length} phone numbers (Cost: $${phoneResults.cost.toFixed(4)})`);

            // STEP 4: Enhanced discovery if accuracy is still low
            const currentAccuracy = this.calculateCurrentAccuracy(result);
            if (currentAccuracy < 80) {
                console.log(`🎯 STEP 4: Enhanced Discovery (Current accuracy: ${currentAccuracy}%)`);
                const enhancedResults = await this.enhancedDiscoveryForAccuracy(executiveData, companyData, result);
                result.emails.push(...enhancedResults.emails);
                result.phones.push(...enhancedResults.phones);
                result.cost += enhancedResults.cost;
                console.log(`   🚀 Enhanced discovery added ${enhancedResults.emails.length} emails, ${enhancedResults.phones.length} phones`);
            }

            // STEP 5: Final accuracy assessment
            result.accuracy = this.calculateFinalAccuracy(result);
            this.accuracyStats.accuracyScore = result.accuracy.overallAccuracy;

            console.log(`\n✅ ACCURACY-OPTIMIZED DISCOVERY COMPLETE:`);
            console.log(`   📧 Emails: ${result.emails.length} (${result.accuracy.emailAccuracy}% accuracy)`);
            console.log(`   📱 Phones: ${result.phones.length} (${result.accuracy.phoneAccuracy}% accuracy)`);
            console.log(`   🎯 Overall Accuracy: ${result.accuracy.overallAccuracy}%`);
            console.log(`   💰 Total Cost: $${result.cost.toFixed(4)}`);
            console.log(`   📊 Data Sources: ${result.sources.join(', ')}`);

            return result;

        } catch (error) {
            console.error(`❌ Accuracy-optimized discovery error: ${error.message}`);
            result.error = error.message;
            return result;
        }
    }

    /**
     * 🏢 GET CORESIGNAL PROFESSIONAL EMAIL
     * 
     * Uses Coresignal Employee API to get verified professional email
     */
    async getCoresignalProfessionalEmail(executiveData, companyData) {
        try {
            if (!this.config.CORESIGNAL_API_KEY) {
                console.log(`   ⚠️ No Coresignal API key available`);
                return null;
            }

            // Search for the executive in Coresignal
            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v1/employee/search/filter', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.CORESIGNAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    full_name: executiveData.name,
                    company_name: companyData.name,
                    limit: 5
                }),
                timeout: 15000
            });

            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                
                if (searchData.employees && searchData.employees.length > 0) {
                    const executive = searchData.employees[0]; // Take first match
                    
                    if (executive.primary_professional_email) {
                        const confidence = this.mapCoresignalEmailConfidence(executive.primary_professional_email_status);
                        const needsValidation = confidence < 95;
                        
                        return {
                            email: executive.primary_professional_email,
                            confidence: confidence,
                            source: 'coresignal',
                            status: executive.primary_professional_email_status,
                            needsValidation: needsValidation,
                            coresignalData: {
                                id: executive.id,
                                title: executive.active_experience_title,
                                company_id: executive.active_experience_company_id,
                                is_decision_maker: executive.is_decision_maker
                            }
                        };
                    }
                }
            } else {
                console.log(`   ⚠️ Coresignal API error: ${searchResponse.status}`);
            }
        } catch (error) {
            console.log(`   ❌ Coresignal email search error: ${error.message}`);
        }

        return null;
    }

    /**
     * 📊 MAP CORESIGNAL EMAIL CONFIDENCE
     * 
     * Maps Coresignal's email status to our confidence levels
     */
    mapCoresignalEmailConfidence(status) {
        const confidenceMap = {
            'verified': 95,           // Highest confidence - use directly
            'matched_email': 85,      // High confidence - validate for safety
            'matched_pattern': 70,    // Medium confidence - definitely validate
            'guessed_common_pattern': 50  // Low confidence - use other sources
        };
        
        return confidenceMap[status] || 40;
    }

    /**
     * ✅ VALIDATE CORESIGNAL EMAIL
     * 
     * Validates Coresignal email when confidence is not "verified"
     */
    async validateCoresignalEmail(coresignalEmail) {
        const email = coresignalEmail.email;
        let validationCost = 0;
        
        // Use ZeroBounce first (enterprise preferred)
        if (this.config.ZEROBOUNCE_API_KEY) {
            const zbResult = await this.validateWithZeroBounce(email);
            validationCost += 0.001;
            
            if (zbResult.confidence >= 90) {
                return {
                    ...coresignalEmail,
                    isValid: zbResult.isValid,
                    confidence: Math.max(coresignalEmail.confidence, zbResult.confidence),
                    validationResult: zbResult.result,
                    validationSource: 'zerobounce',
                    validationCost: validationCost,
                    triangulated: false
                };
            }
        }

        // Cross-validate with MyEmailVerifier for triangulation
        if (this.config.MYEMAILVERIFIER_API_KEY) {
            const mevResult = await this.validateWithMyEmailVerifier(email);
            validationCost += 0.003;
            
            // Triangulate if we have both results
            if (this.config.ZEROBOUNCE_API_KEY) {
                const triangulated = this.triangulateEmailValidation([
                    { ...zbResult, provider: 'zerobounce' },
                    { ...mevResult, provider: 'myemailverifier' }
                ], email);
                
                return {
                    ...coresignalEmail,
                    isValid: triangulated.isValid,
                    confidence: triangulated.confidence,
                    validationResult: triangulated.result,
                    validationSource: 'triangulated',
                    validationCost: validationCost,
                    triangulated: true,
                    consensus: triangulated.consensus
                };
            }
            
            return {
                ...coresignalEmail,
                isValid: mevResult.isValid,
                confidence: Math.max(coresignalEmail.confidence, mevResult.confidence),
                validationResult: mevResult.result,
                validationSource: 'myemailverifier',
                validationCost: validationCost,
                triangulated: false
            };
        }

        // No validation available - return Coresignal data as-is
        return {
            ...coresignalEmail,
            isValid: coresignalEmail.confidence > 70,
            validationResult: 'coresignal_only',
            validationCost: 0,
            triangulated: false
        };
    }

    /**
     * 📱 DISCOVER PHONE NUMBERS
     * 
     * Optimized phone discovery with Lusha for Top 1000 companies
     */
    async discoverPhoneNumbers(executiveData, companyData) {
        const phones = [];
        let cost = 0;

        // For Top 1000 companies, use Lusha as primary source
        if (companyData.isTop1000 && this.config.LUSHA_API_KEY) {
            console.log(`   📱 Using Lusha for Top 1000 company phone discovery...`);
            const lushaPhones = await this.searchLushaPhoneNumbers(executiveData, companyData);
            if (lushaPhones.length > 0) {
                phones.push(...lushaPhones);
                cost += lushaPhones.length * 0.08;
                console.log(`   ✅ Lusha found ${lushaPhones.length} phone numbers`);
            }
        }

        // Validate all found phones with Twilio
        if (phones.length > 0 && this.config.TWILIO_ACCOUNT_SID) {
            console.log(`   🔍 Validating ${phones.length} phones with Twilio...`);
            for (let phone of phones) {
                const validation = await this.validatePhoneWithTwilio(phone.number);
                if (validation.isValid) {
                    phone.twilioValidation = validation;
                    phone.phoneType = this.classifyPhoneTypeAdvanced(phone.number, validation, companyData.name);
                    phone.confidence = Math.min(95, phone.confidence + 10);
                    cost += 0.008;
                }
            }
        }

        // If no phones found, use public search as fallback
        if (phones.length === 0) {
            console.log(`   🔍 No premium phone data - using public search...`);
            const publicPhones = await this.searchPublicPhoneNumbers(executiveData, companyData);
            phones.push(...publicPhones);
        }

        return { phones, cost };
    }

    /**
     * 📧 ENHANCED DISCOVERY FOR ACCURACY
     * 
     * When accuracy is still low, use all available methods
     */
    async enhancedDiscoveryForAccuracy(executiveData, companyData, currentResult) {
        const enhanced = { emails: [], phones: [], cost: 0 };

        // If no good email from Coresignal, try Prospeo + Dropcontact
        if (currentResult.emails.length === 0 || currentResult.emails[0].confidence < 80) {
            console.log(`   📧 Email accuracy low - trying Prospeo + Dropcontact...`);
            
            // Try Prospeo
            if (this.config.PROSPEO_API_KEY) {
                const prospeoResult = await this.searchEmailsWithProspeo(executiveData, companyData);
                enhanced.emails.push(...prospeoResult.emails);
                enhanced.cost += prospeoResult.cost;
            }
            
            // Try Dropcontact
            if (this.config.DROPCONTACT_API_KEY) {
                const dropcontactResult = await this.enrichContactWithDropcontact(executiveData, companyData);
                enhanced.emails.push(...dropcontactResult.emails);
                enhanced.cost += dropcontactResult.cost;
            }
        }

        // If no phones found, use AI research
        if (currentResult.phones.length === 0) {
            console.log(`   📱 No phone numbers found - using AI research...`);
            const aiPhones = await this.aiPoweredPhoneResearch(executiveData, companyData);
            enhanced.phones.push(...aiPhones);
        }

        return enhanced;
    }

    /**
     * 📊 CALCULATE ACCURACY SCORES
     */
    calculateCurrentAccuracy(result) {
        let emailScore = 0;
        let phoneScore = 0;

        // Email accuracy
        if (result.emails.length > 0) {
            const bestEmail = result.emails.reduce((best, current) => 
                current.confidence > best.confidence ? current : best
            );
            emailScore = bestEmail.confidence;
        }

        // Phone accuracy
        if (result.phones.length > 0) {
            const bestPhone = result.phones.reduce((best, current) => 
                current.confidence > best.confidence ? current : best
            );
            phoneScore = bestPhone.confidence;
        }

        return Math.round((emailScore + phoneScore) / 2);
    }

    calculateFinalAccuracy(result) {
        const emailAccuracy = result.emails.length > 0 ? 
            Math.max(...result.emails.map(e => e.confidence)) : 0;
        const phoneAccuracy = result.phones.length > 0 ? 
            Math.max(...result.phones.map(p => p.confidence)) : 0;
        
        const overallAccuracy = result.emails.length > 0 && result.phones.length > 0 ?
            Math.round((emailAccuracy + phoneAccuracy) / 2) :
            Math.max(emailAccuracy, phoneAccuracy);

        return {
            emailAccuracy: Math.round(emailAccuracy),
            phoneAccuracy: Math.round(phoneAccuracy),
            overallAccuracy: Math.round(overallAccuracy),
            dataSource: this.identifyPrimaryDataSource(result)
        };
    }

    identifyPrimaryDataSource(result) {
        const sources = [];
        if (result.emails.some(e => e.source === 'coresignal')) sources.push('Coresignal');
        if (result.phones.some(p => p.source === 'lusha_api')) sources.push('Lusha');
        if (result.emails.some(e => e.validationSource === 'triangulated')) sources.push('Triangulated');
        
        return sources.length > 0 ? sources.join(' + ') : 'Public Research';
    }

    /**
     * 📱 PRECISE LUSHA PHONE DISCOVERY
     * 
     * Uses specific identifiers (email, LinkedIn) to minimize costs and maximize accuracy
     */
    async searchLushaPhoneNumbers(executiveData, companyData) {
        try {
            if (!this.config.LUSHA_API_KEY) {
                console.log(`   ⚠️ No Lusha API key available`);
                return [];
            }

            const phones = [];
            
            // METHOD 1: Use email for precise lookup (if we have a validated email)
            if (executiveData.email && executiveData.emailConfidence > 80) {
                console.log(`   📧 Using validated email for precise Lusha lookup: ${executiveData.email}`);
                const emailLookup = await this.lushaPersonLookupByEmail(executiveData.email);
                if (emailLookup.phones.length > 0) {
                    phones.push(...emailLookup.phones);
                    console.log(`   ✅ Email lookup found ${emailLookup.phones.length} phone numbers`);
                }
            }
            
            // METHOD 2: Use LinkedIn URL for precise lookup (if available)
            else if (executiveData.linkedinUrl) {
                console.log(`   🔗 Using LinkedIn URL for precise Lusha lookup`);
                const linkedinLookup = await this.lushaPersonLookupByLinkedIn(executiveData.linkedinUrl);
                if (linkedinLookup.phones.length > 0) {
                    phones.push(...linkedinLookup.phones);
                    console.log(`   ✅ LinkedIn lookup found ${linkedinLookup.phones.length} phone numbers`);
                }
            }
            
            // METHOD 3: Precise name + company lookup (last resort, most expensive)
            else {
                console.log(`   👤 Using precise name + company lookup (Top 1000 only)`);
                const nameLookup = await this.lushaPersonLookupByName(executiveData, companyData);
                if (nameLookup.phones.length > 0) {
                    phones.push(...nameLookup.phones);
                    console.log(`   ✅ Name lookup found ${nameLookup.phones.length} phone numbers`);
                }
            }

            // Deduplicate and enhance with Lusha confidence data
            const uniquePhones = this.deduplicateLushaPhones(phones);
            return uniquePhones;

        } catch (error) {
            console.log(`   ❌ Lusha phone discovery error: ${error.message}`);
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

        return { phones: [], cost: 0 };
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

        return { phones: [], cost: 0 };
    }

    /**
     * 👤 LUSHA PERSON LOOKUP BY NAME (Least Precise, Most Expensive)
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
                const errorText = await response.text();
                console.log(`   Error details: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ Lusha name lookup error: ${error.message}`);
        }

        return { phones: [], cost: 0 };
    }

    /**
     * 📊 EXTRACT LUSHA PHONE DATA
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
                        accuracy: phoneObj.accuracy || 'high'
                    }
                });
            });
        }

        return { phones, cost: phones.length * 0.08 };
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
     * 🔧 DEDUPLICATE LUSHA PHONES
     */
    deduplicateLushaPhones(phones) {
        const phoneMap = new Map();
        
        phones.forEach(phone => {
            const normalizedNumber = phone.number.replace(/[^\d]/g, '');
            
            if (phoneMap.has(normalizedNumber)) {
                const existing = phoneMap.get(normalizedNumber);
                existing.confidence = Math.max(existing.confidence, phone.confidence);
                existing.sources = existing.sources || [];
                existing.sources.push(phone.lookupMethod);
            } else {
                phoneMap.set(normalizedNumber, {
                    ...phone,
                    sources: [phone.lookupMethod]
                });
            }
        });

        return Array.from(phoneMap.values()).sort((a, b) => b.confidence - a.confidence);
    }

    async validateWithZeroBounce(email) {
        try {
            if (!this.config.ZEROBOUNCE_API_KEY) {
                return { isValid: false, confidence: 0, result: 'no_api_key' };
            }

            const response = await fetch(
                `https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${encodeURIComponent(email)}`,
                { method: 'GET', timeout: 10000 }
            );

            if (response.ok) {
                const data = await response.json();
                const isValid = data.status === 'valid';
                const confidence = this.calculateEmailConfidence(data.status, data.sub_status);
                
                return { isValid, confidence, result: data.status, subStatus: data.sub_status };
            }
        } catch (error) {
            console.log(`   ⚠️ ZeroBounce validation error: ${error.message}`);
        }

        return { isValid: false, confidence: 0, result: 'api_error' };
    }

    async validateWithMyEmailVerifier(email) {
        try {
            if (!this.config.MYEMAILVERIFIER_API_KEY) {
                return { isValid: false, confidence: 0, result: 'no_api_key' };
            }

            const response = await fetch(
                `https://client.myemailverifier.com/verifier/validate_single/${encodeURIComponent(email)}/${this.config.MYEMAILVERIFIER_API_KEY}`,
                { method: 'GET', timeout: 10000 }
            );

            if (response.ok) {
                const data = await response.json();
                const isValid = data.Status === 'Valid';
                const confidence = this.calculateMyEmailVerifierConfidence(data);
                
                return { isValid, confidence, result: data.Status };
            }
        } catch (error) {
            console.log(`   ⚠️ MyEmailVerifier validation error: ${error.message}`);
        }

        return { isValid: false, confidence: 0, result: 'api_error' };
    }

    triangulateEmailValidation(results, email) {
        if (results.length === 0) return { isValid: false, confidence: 0 };
        
        // Count consensus
        const validCount = results.filter(r => r.isValid).length;
        const invalidCount = results.filter(r => !r.isValid).length;
        
        // Get highest confidence result
        const highestConfidence = results.reduce((max, current) => 
            current.confidence > max.confidence ? current : max
        );
        
        // Triangulation logic
        if (validCount > invalidCount) {
            return {
                isValid: true,
                confidence: Math.min(95, highestConfidence.confidence + 5),
                result: 'triangulated_valid',
                consensus: `${validCount}/${results.length} providers agree`,
                triangulated: true
            };
        } else if (invalidCount > validCount) {
            return {
                isValid: false,
                confidence: Math.min(95, highestConfidence.confidence + 5),
                result: 'triangulated_invalid',
                consensus: `${invalidCount}/${results.length} providers agree`,
                triangulated: true
            };
        } else {
            return {
                ...highestConfidence,
                confidence: Math.max(70, highestConfidence.confidence - 10),
                result: `${highestConfidence.result}_disputed`,
                triangulated: true
            };
        }
    }

    async validatePhoneWithTwilio(number) {
        try {
            if (!this.config.TWILIO_ACCOUNT_SID || !this.config.TWILIO_AUTH_TOKEN) {
                return { isValid: false, error: 'No Twilio credentials' };
            }

            const cleanPhone = number.replace(/[^\d+]/g, '');
            const auth = Buffer.from(`${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`).toString('base64');
            
            const response = await fetch(
                `https://lookups.twilio.com/v1/PhoneNumbers/${encodeURIComponent(cleanPhone)}?Type=carrier`,
                {
                    method: 'GET',
                    headers: { 'Authorization': `Basic ${auth}` },
                    timeout: 10000
                }
            );

            if (response.ok) {
                const data = await response.json();
                return {
                    isValid: true,
                    phoneNumber: data.phone_number,
                    carrier: data.carrier?.name || 'Unknown',
                    lineType: data.carrier?.type || 'Unknown',
                    countryCode: data.country_code,
                    confidence: 90
                };
            }
        } catch (error) {
            console.log(`   ⚠️ Twilio validation error: ${error.message}`);
        }

        return { isValid: false, error: 'Twilio validation failed' };
    }

    classifyPhoneTypeAdvanced(number, validation, company) {
        const lineType = (validation.lineType || '').toLowerCase();
        
        if (lineType.includes('mobile') || lineType.includes('wireless')) {
            return { type: 'work_mobile', subType: 'executive_mobile', confidence: 80 };
        } else if (lineType.includes('landline') || lineType.includes('fixed')) {
            return { type: 'work_landline', subType: 'office_direct', confidence: 85 };
        } else if (lineType.includes('voip')) {
            return { type: 'work_voip', subType: 'office_system', confidence: 75 };
        }
        
        return { type: 'work_unknown', subType: 'business_line', confidence: 60 };
    }

    async searchPublicPhoneNumbers(executiveData, companyData) {
        try {
            if (!this.config.PERPLEXITY_API_KEY) {
                return [];
            }

            const prompt = `Find publicly available phone numbers for ${executiveData.name} at ${companyData.name}.

Look for company directory listings, press releases, and official corporate communications.

Provide ONLY a JSON response:
{
    "phones": [
        {
            "number": "+1-XXX-XXX-XXXX",
            "type": "office/mobile/direct",
            "source": "company_directory/press_release",
            "confidence": 0.80
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
                        const phoneData = JSON.parse(jsonMatch[0]);
                        return phoneData.phones || [];
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Phone data parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ❌ Public phone search error: ${error.message}`);
        }

        return [];
    }

    calculateEmailConfidence(status, subStatus) {
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
        
        if (data.Disposable_Domain === 'true') confidence -= 20;
        if (data.Role_Based === 'true') confidence -= 10;
        if (data.Free_Domain === 'true') confidence -= 5;
        if (data.Greylisted === 'true') confidence -= 15;
        
        return Math.max(0, Math.min(100, confidence));
    }

    /**
     * 📊 GET ACCURACY STATS
     */
    getAccuracyStats() {
        return this.accuracyStats;
    }
}

module.exports = { AccuracyOptimizedContacts };
