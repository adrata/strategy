#!/usr/bin/env node

/**
 * 🔍 MULTI-SOURCE VERIFIER MODULE
 * 
 * Orchestrates multi-source verification for maximum confidence:
 * 1. Person Identity Verification (2-3x sources)
 * 2. Email Multi-Layer Verification (2-3x layers)
 * 3. Phone Verification (1x source)
 * 4. Confidence consolidation and reasoning
 */

const { CoreSignalMultiSource } = require('./CoreSignalMultiSource');
const RetryHandler = require('./RetryHandler');
const TimeoutHandler = require('./TimeoutHandler');

class MultiSourceVerifier {
    constructor(config = {}) {
        this.config = {
            LUSHA_API_KEY: config.LUSHA_API_KEY || process.env.LUSHA_API_KEY,
            ZEROBOUNCE_API_KEY: config.ZEROBOUNCE_API_KEY || process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: config.MYEMAILVERIFIER_API_KEY || process.env.MYEMAILVERIFIER_API_KEY,
            PROSPEO_API_KEY: config.PROSPEO_API_KEY || process.env.PROSPEO_API_KEY,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            PEOPLE_DATA_LABS_API_KEY: config.PEOPLE_DATA_LABS_API_KEY || process.env.PEOPLE_DATA_LABS_API_KEY,
            TWILIO_ACCOUNT_SID: config.TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: config.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN,
            TIMEOUT: config.TIMEOUT || 30000,
            ...config
        };

        this.coresignal = new CoreSignalMultiSource(config);
        
        // Initialize retry and timeout handlers
        this.retryHandler = new RetryHandler({
            maxRetries: 2,
            baseDelay: 1000,
            maxDelay: 10000
        });
        
        this.timeoutHandler = new TimeoutHandler({
            defaultTimeout: this.config.TIMEOUT
        });
        
        this.stats = {
            personVerifications: 0,
            emailVerifications: 0,
            phoneVerifications: 0,
            highConfidenceResults: 0,
            totalCreditsUsed: 0
        };

        // Lusha rate limiting (2000 calls/day)
        this.lushaUsage = {
            dailyCount: 0,
            lastResetDate: new Date().toDateString(),
            maxDailyCalls: 2000
        };
    }

    /**
     * 🚦 CHECK LUSHA RATE LIMIT
     * 
     * Check if we can make Lusha API calls without exceeding daily limit
     */
    checkLushaRateLimit() {
        const today = new Date().toDateString();
        
        // Reset counter if new day
        if (this.lushaUsage.lastResetDate !== today) {
            this.lushaUsage.dailyCount = 0;
            this.lushaUsage.lastResetDate = today;
        }
        
        const remainingCalls = this.lushaUsage.maxDailyCalls - this.lushaUsage.dailyCount;
        
        if (remainingCalls <= 0) {
            console.log(`   ⚠️ Lusha daily limit reached (${this.lushaUsage.maxDailyCalls} calls). Skipping Lusha verification.`);
            return false;
        }
        
        if (remainingCalls < 100) {
            console.log(`   ⚠️ Lusha calls remaining: ${remainingCalls}. Consider reducing usage.`);
        }
        
        return true;
    }

    /**
     * 📊 INCREMENT LUSHA USAGE
     */
    incrementLushaUsage() {
        this.lushaUsage.dailyCount++;
    }

    /**
     * 🎯 VERIFY PERSON IDENTITY (2-3x sources)
     * 
     * Cross-reference person data across multiple sources
     */
    async verifyPersonIdentity(personData, company, domain) {
        console.log(`   🔍 Multi-Source: Verifying person identity for ${personData.name}...`);
        this.stats.personVerifications++;

        const verificationSources = [];
        let totalConfidence = 0;
        let sourceCount = 0;

        // Source 1: CoreSignal (if available)
        if (personData.source === 'coresignal' || personData.coresignalId) {
            verificationSources.push({
                source: 'CoreSignal',
                confidence: personData.confidence || 0,
                verified: true,
                reasoning: 'CoreSignal employment data verified'
            });
            totalConfidence += personData.confidence || 0;
            sourceCount++;
        }

        // Source 2: Lusha (person lookup) - with rate limiting
        if (this.checkLushaRateLimit()) {
            try {
                const lushaData = await this.verifyWithLusha(personData.name, company, domain);
                this.incrementLushaUsage();
                if (lushaData) {
                    verificationSources.push({
                        source: 'Lusha',
                        confidence: lushaData.confidence || 0,
                        verified: true,
                        reasoning: `Lusha person lookup: ${lushaData.reasoning || 'Profile found'}`
                    });
                    totalConfidence += lushaData.confidence || 0;
                    sourceCount++;
                }
            } catch (error) {
                console.log(`   ⚠️ Lusha verification failed: ${error.message}`);
                this.incrementLushaUsage(); // Still count failed calls
            }
        } else {
            console.log(`   ⚠️ Skipping Lusha verification due to rate limit`);
        }

        // Source 3: Perplexity AI (real-time employment check)
        try {
            const perplexityData = await this.verifyWithPerplexity(personData.name, personData.title, company);
            if (perplexityData) {
                verificationSources.push({
                    source: 'Perplexity',
                    confidence: perplexityData.confidence || 0,
                    verified: perplexityData.isCurrent,
                    reasoning: `Perplexity real-time check: ${perplexityData.isCurrent ? 'Currently employed' : 'Not currently employed'}`
                });
                totalConfidence += perplexityData.confidence || 0;
                sourceCount++;
            }
        } catch (error) {
            console.log(`   ⚠️ Perplexity verification failed: ${error.message}`);
        }

        // Calculate consolidated confidence
        const averageConfidence = sourceCount > 0 ? Math.round(totalConfidence / sourceCount) : 0;
        const agreementBonus = this.calculateAgreementBonus(verificationSources);
        const finalConfidence = Math.min(100, averageConfidence + agreementBonus);

        // Generate reasoning
        const reasoning = this.generatePersonReasoning(verificationSources, finalConfidence);

        const result = {
            verified: finalConfidence >= 70,
            confidence: finalConfidence,
            sources: verificationSources.map(s => s.source),
            reasoning: reasoning,
            verificationDetails: verificationSources,
            metadata: {
                sourceCount: sourceCount,
                agreementBonus: agreementBonus,
                verifiedAt: new Date().toISOString()
            }
        };

        if (finalConfidence >= 80) {
            this.stats.highConfidenceResults++;
        }

        console.log(`   ✅ Person verification: ${finalConfidence}% confidence (${sourceCount} sources)`);
        return result;
    }

    /**
     * 📧 VERIFY EMAIL MULTI-LAYER (2-3x layers)
     * 
     * Multi-layer email verification for maximum accuracy
     */
    async verifyEmailMultiLayer(email, personName, domain) {
        if (!email || !email.includes('@')) {
            return {
                valid: false,
                confidence: 0,
                validationSteps: [],
                reasoning: 'No email provided or invalid format'
            };
        }

        console.log(`   📧 Multi-Source: Verifying email ${email}...`);
        this.stats.emailVerifications++;

        const validationSteps = [];
        let totalConfidence = 0;
        let stepCount = 0;

        // Layer 1: Syntax validation
        const syntaxValid = this.validateEmailSyntax(email);
        validationSteps.push({
            step: 'Syntax',
            passed: syntaxValid,
            confidence: syntaxValid ? 100 : 0,
            reasoning: syntaxValid ? 'Valid email format' : 'Invalid email format'
        });
        if (syntaxValid) {
            totalConfidence += 100;
            stepCount++;
        }

        // Layer 2: Domain validation
        const domainValid = await this.validateEmailDomain(email, domain);
        validationSteps.push({
            step: 'Domain',
            passed: domainValid.valid,
            confidence: domainValid.confidence,
            reasoning: domainValid.reasoning
        });
        if (domainValid.valid) {
            totalConfidence += domainValid.confidence;
            stepCount++;
        }

        // Layer 3: SMTP validation (ZeroBounce or MyEmailVerifier)
        const smtpValid = await this.validateEmailSMTP(email);
        validationSteps.push({
            step: 'SMTP',
            passed: smtpValid.valid,
            confidence: smtpValid.confidence,
            reasoning: smtpValid.reasoning
        });
        if (smtpValid.valid) {
            totalConfidence += smtpValid.confidence;
            stepCount++;
        }

        // Layer 4: Prospeo verification (if available)
        try {
            const prospeoEmail = await this.verifyEmailWithProspeo(email, personName, domain);
            if (prospeoEmail) {
                validationSteps.push({
                    step: 'Prospeo',
                    passed: prospeoEmail.isValid,
                    confidence: prospeoEmail.confidence,
                    reasoning: prospeoEmail.reasoning
                });
                if (prospeoEmail.isValid) {
                    totalConfidence += prospeoEmail.confidence;
                    stepCount++;
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Prospeo email verification failed: ${error.message}`);
        }

        // Calculate final confidence
        const averageConfidence = stepCount > 0 ? Math.round(totalConfidence / stepCount) : 0;
        const finalConfidence = Math.min(100, averageConfidence);

        // Generate reasoning
        const passedSteps = validationSteps.filter(s => s.passed);
        const reasoning = this.generateEmailReasoning(validationSteps, finalConfidence);

        const result = {
            valid: finalConfidence >= 70,
            confidence: finalConfidence,
            validationSteps: validationSteps.map(s => `${s.step}${s.passed ? '✓' : '✗'}`).join(','),
            reasoning: reasoning,
            validationDetails: validationSteps,
            metadata: {
                stepCount: stepCount,
                passedSteps: passedSteps.length,
                verifiedAt: new Date().toISOString()
            }
        };

        console.log(`   ✅ Email verification: ${finalConfidence}% confidence (${passedSteps.length}/${validationSteps.length} steps passed)`);
        return result;
    }

    /**
     * 📱 VERIFY PHONE (4x sources)
     * 
     * Verify phone numbers using Lusha + People Data Labs + Twilio + Prospeo Mobile Finder
     * Note: Prospeo provides both email verification AND mobile number finder
     */
    async verifyPhone(phone, personName, company, linkedinUrl = null) {
        if (!phone) {
            return {
                valid: false,
                confidence: 0,
                sources: [],
                reasoning: 'No phone number provided'
            };
        }

        console.log(`   📱 Multi-Source: Verifying phone ${phone}...`);
        this.stats.phoneVerifications++;

        const verificationSources = [];
        let totalConfidence = 0;
        let sourceCount = 0;

        // Source 1: Lusha phone lookup - with rate limiting
        if (this.checkLushaRateLimit()) {
            try {
                const lushaPhone = await this.verifyPhoneWithLusha(phone, personName, company);
                this.incrementLushaUsage();
                if (lushaPhone) {
                    verificationSources.push({
                        source: 'Lusha',
                        confidence: lushaPhone.confidence || 0,
                        verified: lushaPhone.valid,
                        reasoning: lushaPhone.reasoning || 'Lusha phone verification'
                    });
                    totalConfidence += lushaPhone.confidence || 0;
                    sourceCount++;
                }
            } catch (error) {
                console.log(`   ⚠️ Lusha phone verification failed: ${error.message}`);
                this.incrementLushaUsage(); // Still count failed calls
            }
        } else {
            console.log(`   ⚠️ Skipping Lusha phone verification due to rate limit`);
        }

        // Source 2: People Data Labs phone enrichment
        try {
            const pdlPhone = await this.verifyPhoneWithPDL(phone, personName, company);
            if (pdlPhone) {
                verificationSources.push({
                    source: 'People Data Labs',
                    confidence: pdlPhone.confidence || 0,
                    verified: pdlPhone.valid,
                    reasoning: pdlPhone.reasoning || 'People Data Labs phone verification'
                });
                totalConfidence += pdlPhone.confidence || 0;
                sourceCount++;
            }
        } catch (error) {
            console.log(`   ⚠️ People Data Labs phone verification failed: ${error.message}`);
        }

        // Source 3: Twilio phone validation
        try {
            const twilioPhone = await this.verifyPhoneWithTwilio(phone);
            if (twilioPhone) {
                verificationSources.push({
                    source: 'Twilio',
                    confidence: twilioPhone.confidence || 0,
                    verified: twilioPhone.valid,
                    reasoning: twilioPhone.reasoning || 'Twilio phone validation'
                });
                totalConfidence += twilioPhone.confidence || 0;
                sourceCount++;
            }
        } catch (error) {
            console.log(`   ⚠️ Twilio phone verification failed: ${error.message}`);
        }

        // Source 4: Prospeo Mobile Finder
        try {
            const prospeoPhone = await this.verifyPhoneWithProspeo(phone, personName, company, linkedinUrl);
            if (prospeoPhone) {
                verificationSources.push({
                    source: 'Prospeo Mobile',
                    confidence: prospeoPhone.confidence || 0,
                    verified: prospeoPhone.valid,
                    reasoning: prospeoPhone.reasoning || 'Prospeo mobile finder'
                });
                totalConfidence += prospeoPhone.confidence || 0;
                sourceCount++;
            }
        } catch (error) {
            console.log(`   ⚠️ Prospeo mobile verification failed: ${error.message}`);
        }


        // Calculate consolidated confidence
        const averageConfidence = sourceCount > 0 ? Math.round(totalConfidence / sourceCount) : 0;
        const agreementBonus = this.calculateAgreementBonus(verificationSources);
        const finalConfidence = Math.min(100, averageConfidence + agreementBonus);

        // Generate reasoning
        const reasoning = this.generatePhoneReasoning(verificationSources, finalConfidence);

        const result = {
            valid: finalConfidence >= 70,
            confidence: finalConfidence,
            sources: verificationSources.map(s => s.source),
            reasoning: reasoning,
            verificationDetails: verificationSources,
            metadata: {
                sourceCount: sourceCount,
                agreementBonus: agreementBonus,
                verifiedAt: new Date().toISOString()
            }
        };

        console.log(`   ✅ Phone verification: ${finalConfidence}% confidence (${sourceCount} sources)`);
        return result;
    }

    /**
     * 🔧 HELPER METHODS
     */

    async verifyWithLusha(name, company, domain) {
        if (!this.config.LUSHA_API_KEY) {
            console.log('   ⚠️ Lusha API key not configured');
            return null;
        }

        try {
            console.log(`   🔍 Lusha: Looking up person ${name} at ${company}...`);

            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout('https://api.lusha.com/person', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': this.config.LUSHA_API_KEY.trim()
                    },
                    body: JSON.stringify({
                        name: name,
                        company: company,
                        domain: domain
                    })
                }, this.timeoutHandler.getApiTimeout('lusha'));
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`   ⚠️ Lusha: No person found for ${name} at ${company}`);
                    return null;
                }
                throw new Error(`Lusha person lookup error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`   ✅ Lusha: Found person profile for ${data.full_name || name}`);

            // Calculate confidence based on data completeness
            let confidence = 60; // Base confidence
            if (data.email) confidence += 15;
            if (data.phone) confidence += 10;
            if (data.linkedin_url) confidence += 10;
            if (data.title) confidence += 5;

            return {
                confidence: Math.min(100, confidence),
                reasoning: `Lusha person profile found: ${data.title || 'Unknown title'} at ${data.company_name || company}`,
                data: {
                    name: data.full_name || name,
                    title: data.title,
                    company: data.company_name || company,
                    email: data.email,
                    phone: data.phone,
                    linkedin: data.linkedin_url,
                    location: data.location
                }
            };

        } catch (error) {
            console.log(`   ❌ Lusha person lookup failed: ${error.message}`);
            return null;
        }
    }

    async verifyWithPerplexity(name, title, company) {
        if (!this.config.PERPLEXITY_API_KEY) {
            console.log('   ⚠️ Perplexity API key not configured');
            return null;
        }

        try {
            console.log(`   🔍 Perplexity: Verifying employment status for ${name} at ${company}...`);
            
            const prompt = `Is ${name} currently employed as ${title} at ${company} as of ${new Date().toISOString().split('T')[0]}? 
            
            Respond in this exact format:
            STATUS: [CURRENT|FORMER|UNKNOWN]
            CONFIDENCE: [0-100]
            LAST_KNOWN_DATE: [YYYY-MM-DD or UNKNOWN]
            NOTES: [Brief explanation]`;

            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout('https://api.perplexity.ai/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY.trim()}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'sonar',
                        messages: [{ role: 'user', content: prompt }],
                        temperature: 0.1,
                        max_tokens: 150
                    })
                }, this.timeoutHandler.getApiTimeout('perplexity'));
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices?.[0]?.message?.content || '';
                
                console.log(`   🔍 Perplexity response: ${content.substring(0, 200)}...`);
                
                // Parse structured response
                const statusMatch = content.match(/STATUS:\s*([A-Z]+)/);
                const confidenceMatch = content.match(/CONFIDENCE:\s*(\d+)/);
                const dateMatch = content.match(/LAST_KNOWN_DATE:\s*([^\n]+)/);
                const notesMatch = content.match(/NOTES:\s*([^\n]+)/);
                
                const status = statusMatch ? statusMatch[1] : 'UNKNOWN';
                const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 50;
                const lastKnownDate = dateMatch ? dateMatch[1].trim() : 'UNKNOWN';
                const notes = notesMatch ? notesMatch[1].trim() : 'No additional notes';
                
                const isCurrent = status === 'CURRENT';

                const result = {
                    isCurrent,
                    confidence,
                    lastKnownDate,
                    reasoning: `Perplexity real-time check: ${status} (${confidence}% confidence) - ${notes}`
                };
                
                console.log(`   ✅ Perplexity: ${status} employment status (${confidence}% confidence)`);
                return result;
            } else {
                console.log(`   ⚠️ Perplexity API error: ${response.status} ${response.statusText}`);
                return null;
            }
        } catch (error) {
            console.log(`   ❌ Perplexity verification error: ${error.message}`);
            return null;
        }
    }

    validateEmailSyntax(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async validateEmailDomain(email, companyDomain) {
        const emailDomain = email.split('@')[1].toLowerCase();
        const companyDomainClean = companyDomain ? companyDomain.replace(/^www\./, '').toLowerCase() : '';
        
        if (emailDomain === companyDomainClean) {
            return {
                valid: true,
                confidence: 95,
                reasoning: 'Email domain matches company domain'
            };
        }

        // Check for common business email patterns
        const businessDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
        if (businessDomains.includes(emailDomain)) {
            return {
                valid: false,
                confidence: 20,
                reasoning: 'Personal email domain detected'
            };
        }

        return {
            valid: true,
            confidence: 70,
            reasoning: 'Business email domain detected'
        };
    }

    async validateEmailSMTP(email) {
        // Try ZeroBounce first
        if (this.config.ZEROBOUNCE_API_KEY) {
            try {
                const response = await fetch(`https://api.zerobounce.net/v2/validate?api_key=${this.config.ZEROBOUNCE_API_KEY}&email=${email}`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        valid: data.status === 'valid',
                        confidence: data.status === 'valid' ? 95 : 10,
                        reasoning: `ZeroBounce: ${data.status}`
                    };
                }
            } catch (error) {
                console.log(`   ⚠️ ZeroBounce validation failed: ${error.message}`);
            }
        }

        // Fallback to MyEmailVerifier (with 429 error handling)
        if (this.config.MYEMAILVERIFIER_API_KEY) {
            try {
                const response = await fetch(`https://api.myemailverifier.com/api/verify?ApiKey=${this.config.MYEMAILVERIFIER_API_KEY}&Email=${email}`);
                if (response.ok) {
                    const data = await response.json();
                    return {
                        valid: data.status === 'valid',
                        confidence: data.status === 'valid' ? 90 : 10,
                        reasoning: `MyEmailVerifier: ${data.status}`
                    };
                } else if (response.status === 429) {
                    console.log(`   ⚠️ MyEmailVerifier rate limit exceeded (429). Skipping this verification.`);
                    return {
                        valid: false,
                        confidence: 0,
                        reasoning: 'MyEmailVerifier rate limit exceeded'
                    };
                }
            } catch (error) {
                if (error.message.includes('429')) {
                    console.log(`   ⚠️ MyEmailVerifier rate limit exceeded. Skipping this verification.`);
                } else {
                    console.log(`   ⚠️ MyEmailVerifier validation failed: ${error.message}`);
                }
            }
        }

        return {
            valid: false,
            confidence: 0,
            reasoning: 'No SMTP validation available'
        };
    }

    async verifyPhoneWithLusha(phone, name, company) {
        if (!this.config.LUSHA_API_KEY) {
            console.log('   ⚠️ Lusha API key not configured');
            return null;
        }

        try {
            console.log(`   🔍 Lusha: Verifying phone ${phone} for ${name}...`);

            const response = await fetch('https://api.lusha.com/phone', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.config.LUSHA_API_KEY.trim()
                },
                body: JSON.stringify({
                    phone: phone,
                    name: name,
                    company: company
                }),
                timeout: this.config.TIMEOUT
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`   ⚠️ Lusha: No phone data found for ${phone}`);
                    return null;
                }
                throw new Error(`Lusha phone verification error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`   ✅ Lusha: Phone verification result for ${phone}`);

            // Calculate confidence based on verification results
            let confidence = 50; // Base confidence
            let valid = false;

            if (data.status === 'valid' || data.valid === true) {
                valid = true;
                confidence = 90;
            } else if (data.status === 'risky' || data.risky === true) {
                valid = false;
                confidence = 30;
            } else if (data.status === 'invalid' || data.valid === false) {
                valid = false;
                confidence = 10;
            }

            // Boost confidence if we have additional data
            if (data.line_type && data.line_type !== 'unknown') confidence += 5;
            if (data.carrier) confidence += 5;
            if (data.country_code) confidence += 5;

            return {
                valid: valid,
                confidence: Math.min(100, confidence),
                reasoning: `Lusha phone verification: ${data.status || (valid ? 'valid' : 'invalid')} - ${data.line_type || 'unknown type'}`,
                data: {
                    phone: phone,
                    status: data.status,
                    line_type: data.line_type,
                    carrier: data.carrier,
                    country_code: data.country_code,
                    risk_score: data.risk_score
                }
            };

        } catch (error) {
            console.log(`   ❌ Lusha phone verification failed: ${error.message}`);
            return null;
        }
    }

    async verifyPhoneWithPDL(phone, personName, company) {
        if (!this.config.PEOPLE_DATA_LABS_API_KEY) {
            return null;
        }

        try {
            console.log(`   🔍 People Data Labs: Verifying phone ${phone}...`);

            const response = await fetch('https://api.peopledatalabs.com/v5/person/enrich', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': this.config.PEOPLE_DATA_LABS_API_KEY
                },
                body: JSON.stringify({
                    phone: phone,
                    name: personName,
                    company: company,
                    include_phone_verification: true
                }),
                timeout: this.config.TIMEOUT
            });

            if (!response.ok) {
                if (response.status === 402) {
                    console.log(`   ⚠️ People Data Labs: Payment required (credits exhausted) - ${response.status}`);
                    return null;
                }
                throw new Error(`People Data Labs phone verification error: ${response.status}`);
            }

            const data = await response.json();
            console.log(`   ✅ People Data Labs phone verification: ${data.status} (${data.confidence}%)`);

            return {
                phone: phone,
                isValid: data.status === 'valid',
                confidence: data.confidence || 0,
                status: data.status,
                type: data.phone_type || 'unknown',
                ownershipVerified: data.ownership_verified || false,
                source: 'people_data_labs',
                reasoning: data.reasoning || `People Data Labs verification: ${data.status}`,
                metadata: {
                    verificationId: data.verification_id,
                    verifiedAt: data.verified_at,
                    carrier: data.carrier,
                    country: data.country,
                    lineType: data.line_type
                }
            };

        } catch (error) {
            console.log(`   ❌ People Data Labs phone verification failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 📱 VERIFY PHONE WITH TWILIO
     * 
     * Use Twilio Lookup API to validate phone numbers
     * Checks if number is valid, active, and reachable
     */
    async verifyPhoneWithTwilio(phone) {
        if (!this.config.TWILIO_ACCOUNT_SID || !this.config.TWILIO_AUTH_TOKEN) {
            console.log('   ⚠️ Twilio credentials not configured');
            return null;
        }

        try {
            console.log(`   🔍 Twilio: Validating phone ${phone}...`);

            // Clean phone number for Twilio API
            const cleanPhone = phone.replace(/[^\d+]/g, '');
            const encodedPhone = encodeURIComponent(cleanPhone);
            
            const url = `https://lookups.twilio.com/v1/PhoneNumbers/${encodedPhone}`;
            
            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${Buffer.from(`${this.config.TWILIO_ACCOUNT_SID}:${this.config.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
                        'Accept': 'application/json'
                    }
                }, this.timeoutHandler.getApiTimeout('twilio'));
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`   ⚠️ Twilio: Phone number not found or invalid: ${phone}`);
                    return {
                        valid: false,
                        confidence: 0,
                        reasoning: 'Phone number not found in Twilio database'
                    };
                }
                throw new Error(`Twilio phone validation error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`   ✅ Twilio: Phone validation successful for ${data.phone_number}`);

            // Calculate confidence based on Twilio response
            let confidence = 70; // Base confidence for valid number
            
            // Boost confidence for mobile numbers (more likely to be current)
            if (data.line_type === 'mobile') {
                confidence += 15;
            }
            
            // Boost confidence for US numbers (better data quality)
            if (data.country_code === 'US') {
                confidence += 10;
            }

            return {
                valid: true,
                confidence: Math.min(100, confidence),
                reasoning: `Valid ${data.line_type} number, carrier: ${data.carrier?.name || 'Unknown'}`,
                metadata: {
                    lineType: data.line_type,
                    carrier: data.carrier?.name,
                    countryCode: data.country_code,
                    nationalFormat: data.national_format
                }
            };

        } catch (error) {
            console.log(`   ❌ Twilio phone verification failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 📱 VERIFY PHONE WITH PROSPEO MOBILE FINDER
     * 
     * Use Prospeo's Mobile Finder API to find mobile numbers via LinkedIn URL
     * Prospeo Mobile Finder REQUIRES a LinkedIn URL to work
     */
    async verifyPhoneWithProspeo(phone, personName, company, linkedinUrl) {
        if (!this.config.PROSPEO_API_KEY) {
            console.log('   ⚠️ Prospeo API key not configured');
            return null;
        }
        
        if (!linkedinUrl) {
            console.log('   ⚠️ Prospeo Mobile: LinkedIn URL required, skipping');
            return null;
        }

        // Validate and clean LinkedIn URL format
        let cleanLinkedInUrl = linkedinUrl;
        
        // Remove any query parameters or fragments
        if (linkedinUrl.includes('?')) {
            cleanLinkedInUrl = linkedinUrl.split('?')[0];
        }
        if (cleanLinkedInUrl.includes('#')) {
            cleanLinkedInUrl = cleanLinkedInUrl.split('#')[0];
        }
        
        // Check if it's a valid LinkedIn profile URL
        if (!cleanLinkedInUrl.includes('linkedin.com/in/')) {
            console.log('   ⚠️ Prospeo Mobile: Invalid LinkedIn URL format, skipping');
            return null;
        }
        
        // Skip if it contains special LinkedIn IDs (these are usually private)
        if (cleanLinkedInUrl.includes('ACw') || cleanLinkedInUrl.includes('ACo') || cleanLinkedInUrl.includes('/AC')) {
            console.log('   ⚠️ Prospeo Mobile: LinkedIn URL contains private ID, skipping');
            return null;
        }

        try {
            console.log(`   🔍 Prospeo Mobile: Finding mobile via LinkedIn ${linkedinUrl}...`);

            // Prospeo Mobile Finder endpoint
            const url = 'https://api.prospeo.io/mobile-finder';
            
            const response = await this.retryHandler.execute(async () => {
                return this.timeoutHandler.fetchWithTimeout(url, {
                    method: 'POST',
                    headers: {
                        'X-KEY': this.config.PROSPEO_API_KEY.trim(),
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        url: cleanLinkedInUrl  // Use cleaned LinkedIn URL
                    })
                }, this.timeoutHandler.getApiTimeout('prospeo'));
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log(`   ⚠️ Prospeo: No mobile number found via LinkedIn`);
                    return {
                        valid: false,
                        confidence: 0,
                        reasoning: 'No mobile number found via LinkedIn'
                    };
                }
                if (response.status === 400) {
                    console.log(`   ⚠️ Prospeo: Bad request (likely LinkedIn URL validation issue) - ${response.status}`);
                    return null;
                }
                throw new Error(`Prospeo mobile finder error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            const foundPhone = data.mobile || data.phone_number;
            
            if (foundPhone) {
                console.log(`   ✅ Prospeo Mobile: Found ${foundPhone}`);
                
                let confidence = 75; // Base confidence for Prospeo mobile finder
                if (phone && foundPhone === phone) {
                    confidence += 15; // Phone matches
                }

                return {
                    valid: true,
                    confidence: Math.min(100, confidence),
                    reasoning: `Mobile found via LinkedIn: ${foundPhone}`,
                    metadata: {
                        mobile: foundPhone,
                        source: 'prospeo-linkedin',
                        linkedinUrl: linkedinUrl
                    }
                };
            } else {
                console.log(`   ⚠️ Prospeo: No mobile number found in LinkedIn profile`);
                return {
                    valid: false,
                    confidence: 0,
                    reasoning: 'No mobile number found in LinkedIn profile'
                };
            }

        } catch (error) {
            console.log(`   ❌ Prospeo mobile failed: ${error.message}`);
            return null;
        }
    }

    async verifyEmailWithProspeo(email, personName, domain) {
        if (!this.config.PROSPEO_API_KEY) {
            return null;
        }

        console.log(`   🔍 Prospeo: Verifying email ${email}...`);

        // Use the working endpoint directly (confirmed working in tests)
        try {
            const response = await fetch('https://api.prospeo.io/email-verifier', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-KEY': this.config.PROSPEO_API_KEY.trim()
                },
                body: JSON.stringify({ email, person_name: personName, domain: domain }),
                timeout: this.config.TIMEOUT
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`   ✅ Prospeo email verification: ${data.response?.email_status || 'success'} (${data.response?.confidence || 80}%)`);

                return {
                    email: email,
                    isValid: data.response?.email_status === 'valid' || data.response?.email_status === 'deliverable',
                    confidence: data.response?.confidence || 80,
                    status: data.response?.email_status || 'verified',
                    source: 'prospeo',
                    reasoning: `Prospeo verification: ${data.response?.email_status || 'success'}`,
                    metadata: {
                        endpoint: 'https://api.prospeo.io/email-verifier',
                        verificationId: data.response?.verification_id,
                        verifiedAt: data.response?.verified_at || new Date().toISOString()
                    }
                };
            } else {
                const error = await response.text();
                console.log(`   ❌ Prospeo failed: ${response.status} ${response.statusText} - ${error}`);
            }
        } catch (error) {
            console.log(`   ❌ Prospeo error: ${error.message}`);
        }
        
        return null;
    }

    calculateAgreementBonus(sources) {
        const verifiedSources = sources.filter(s => s.verified);
        if (verifiedSources.length >= 3) return 15; // 3+ sources agree
        if (verifiedSources.length === 2) return 10; // 2 sources agree
        return 0; // No agreement bonus
    }

    generatePersonReasoning(sources, confidence) {
        const verifiedSources = sources.filter(s => s.verified);
        const sourceNames = verifiedSources.map(s => s.source).join(', ');
        
        if (verifiedSources.length >= 3) {
            return `${verifiedSources.length} sources confirm identity: ${sourceNames}. High confidence match.`;
        } else if (verifiedSources.length === 2) {
            return `2 sources confirm identity: ${sourceNames}. Moderate confidence match.`;
        } else if (verifiedSources.length === 1) {
            return `Single source confirmation: ${sourceNames}. Low confidence match.`;
        } else {
            return 'No source confirmation available.';
        }
    }

    generateEmailReasoning(steps, confidence) {
        const passedSteps = steps.filter(s => s.passed);
        const stepNames = passedSteps.map(s => s.step).join(', ');
        
        if (passedSteps.length >= 3) {
            return `Email validated through ${passedSteps.length} layers: ${stepNames}. High confidence.`;
        } else if (passedSteps.length === 2) {
            return `Email validated through 2 layers: ${stepNames}. Moderate confidence.`;
        } else if (passedSteps.length === 1) {
            return `Email validated through 1 layer: ${stepNames}. Low confidence.`;
        } else {
            return 'Email validation failed all checks.';
        }
    }

    generatePhoneReasoning(sources, confidence) {
        const verifiedSources = sources.filter(s => s.verified);
        const sourceNames = verifiedSources.map(s => s.source).join(', ');
        
        if (verifiedSources.length >= 2) {
            return `Phone verified by ${verifiedSources.length} sources: ${sourceNames}. High confidence.`;
        } else if (verifiedSources.length === 1) {
            return `Phone verified by 1 source: ${sourceNames}. Moderate confidence.`;
        } else {
            return 'Phone verification failed.';
        }
    }

    /**
     * 📊 GET STATISTICS
     */
    getStats() {
        return {
            ...this.stats,
            highConfidenceRate: this.stats.personVerifications > 0 
                ? Math.round((this.stats.highConfidenceResults / this.stats.personVerifications) * 100)
                : 0
        };
    }
}

module.exports = { MultiSourceVerifier };
