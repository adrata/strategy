/**
 * 🎯 EXECUTIVE CONTACT INTELLIGENCE MODULE
 * 
 * Primary contact intelligence gathering:
 * - CoreSignal: Company data (growth metrics, employee counts, job postings)
 * - Lusha: Executive contact data (emails, phone numbers)
 * - Perplexity: Executive research and validation
 * - Optimized for accuracy and cost efficiency
 */

const fetch = require('node-fetch');

class ExecutiveContactIntelligence {
    constructor(config = {}) {
        this.config = {
            CORESIGNAL_API_KEY: config.CORESIGNAL_API_KEY || process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: config.LUSHA_API_KEY || process.env.LUSHA_API_KEY,
            PERPLEXITY_API_KEY: config.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY,
            BASE_URL: 'https://api.coresignal.com/cdapi/v2',
            MAX_RETRIES: 2,
            RATE_LIMIT_DELAY: 100,  // Reduced from 1000ms to 100ms
            ...config
        };
        this.creditsUsed = 0;
    }

    /**
     * 🎯 ENHANCE EXECUTIVE INTELLIGENCE (Cost-Optimized)
     * 
     * Strategy:
     * 1. CoreSignal: Get company growth metrics and job posting intelligence
     * 2. Lusha: Get executive contact information
     * 3. Perplexity: Validate and enrich executive data
     */
    async enhanceExecutiveIntelligence(companyResult) {
        console.log(`💰 Cost-effective enhancement: ${companyResult.companyName}`);

        const enhancement = {
            companyIntelligence: null,
            executiveContacts: null,
            hiringIntelligence: null,
            dataQuality: {
                confidence: 0,
                sources: [],
                costOptimized: true
            }
        };

        try {
            // Step 1: Get CoreSignal company intelligence (2-4 credits)
            if (this.config.CORESIGNAL_API_KEY) {
                enhancement.companyIntelligence = await this.getCoreSignalCompanyIntelligence(
                    companyResult.companyName,
                    companyResult.website
                );
            }

            // Step 2: Get executive contacts via Lusha (cost per successful find)
            if (this.config.LUSHA_API_KEY) {
                enhancement.executiveContacts = await this.getLushaExecutiveContacts(
                    companyResult,
                    companyResult.website
                );
            }

            // Step 3: Optional job posting intelligence (if under credit limit)
            if (this.creditsUsed < 10 && enhancement.companyIntelligence?.companyId) {
                enhancement.hiringIntelligence = await this.getJobPostingIntelligence(
                    enhancement.companyIntelligence.companyId,
                    companyResult.companyName
                );
            }

            // Calculate data quality
            enhancement.dataQuality = this.calculateDataQuality(enhancement);

            console.log(`   ✅ Enhancement complete (${this.creditsUsed} credits used)`);
            console.log(`   📊 Data quality: ${enhancement.dataQuality.confidence}%`);
            
            return enhancement;

        } catch (error) {
            console.error(`   ❌ Enhancement failed: ${error.message}`);
            return enhancement;
        }
    }

    /**
     * 🏢 GET CORESIGNAL COMPANY INTELLIGENCE
     */
    async getCoreSignalCompanyIntelligence(companyName, website) {
        console.log(`   🏢 CoreSignal company intelligence...`);
        console.log(`   🔍 DEBUG: API Key available: ${this.config.CORESIGNAL_API_KEY ? 'YES' : 'NO'}`);
        console.log(`   🔍 DEBUG: Company: ${companyName}, Website: ${website}`);

        try {
            // Try intelligent shorthand name first (most cost-effective)
            const shorthandName = await this.generateShorthandName(companyName, website);
            console.log(`   🔍 DEBUG: Generated shorthand: ${shorthandName}`);
            let companyData = await this.getCompanyByShorthand(shorthandName);

            // Fallback to search if shorthand fails
            if (!companyData) {
                companyData = await this.searchCompanyElasticsearch(companyName, website);
            }

            if (companyData) {
                console.log(`   ✅ Company data: ${companyData.company_name || companyName}`);
                
                // Extract executive emails and LinkedIn from CoreSignal
                const executiveData = {
                    keyExecutives: companyData.key_executives || [],
                    companyEmails: companyData.company_emails || [],
                    executiveContacts: []
                };
                
                // Process key executives for contact data
                if (companyData.key_executives && companyData.key_executives.length > 0) {
                    console.log(`   👥 CoreSignal found ${companyData.key_executives.length} key executives`);
                    
                    // Fix: Check the actual structure of key_executives
                    console.log(`   🔍 DEBUG: First executive structure: ${JSON.stringify(companyData.key_executives[0])}`);
                    
                    executiveData.executiveContacts = companyData.key_executives.map(exec => {
                        // Fix: Handle CoreSignal's actual structure
                        const name = exec.member_full_name || exec.full_name || exec.name || exec.executive_name || 'Unknown';
                        const title = exec.member_position_title || exec.title || exec.job_title || exec.position || 'Unknown';
                        const email = exec.member_professional_email || exec.professional_email || exec.email || exec.work_email || null;
                        const linkedIn = exec.member_linkedin_url || exec.linkedin_url || exec.linkedin || null;
                        
                        return {
                            name: name,
                            title: title,
                            email: email,
                            linkedIn: linkedIn,
                            department: exec.department || null,
                            seniority: exec.seniority || null,
                            source: 'coresignal_executives'
                        };
                    });
                    
                    // Log what executives we found with better debugging
                    executiveData.executiveContacts.slice(0, 5).forEach((exec, index) => {
                        console.log(`   👤 Executive ${index + 1}: ${exec.name} (${exec.title}) - Email: ${exec.email || 'None'}, LinkedIn: ${exec.linkedIn || 'None'}`);
                    });
                    
                    if (executiveData.executiveContacts.length > 5) {
                        console.log(`   ... and ${executiveData.executiveContacts.length - 5} more executives`);
                    }
                }
                
                return {
                    companyId: companyData.id,
                    employeeCount: companyData.employees_count,
                    employeeGrowth: companyData.employees_count_change,
                    industry: companyData.industry,
                    foundedYear: companyData.founded_year,
                    revenueRange: companyData.revenue_annual_range,
                    website: companyData.website,
                    headquarters: {
                        country: companyData.hq_country,
                        city: companyData.hq_city,
                        state: companyData.hq_state
                    },
                    lastUpdated: companyData.last_updated,
                    confidence: 90,
                    executiveData: executiveData
                };
            } else {
                console.log(`   ⚠️ Company not found in CoreSignal`);
                return null;
            }

        } catch (error) {
            console.log(`   ❌ CoreSignal error: ${error.message}`);
            return null;
        }
    }

    /**
     * 👤 GET LUSHA EXECUTIVE CONTACTS
     */
    async getLushaExecutiveContacts(companyResult, website) {
        console.log(`   👤 Lusha executive contacts...`);
        console.log(`   🔍 DEBUG: Lusha API Key available: ${this.config.LUSHA_API_KEY ? 'YES' : 'NO'}`);
        console.log(`   🔍 DEBUG: Website: ${website}`);

        if (!this.config.LUSHA_API_KEY) {
            console.log(`   ⚠️ Lusha API key not available`);
            return null;
        }

        try {
            const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '');
            console.log(`   🔍 DEBUG: Extracted domain: ${domain}`);
            const executives = [];
            console.log(`   🔍 DEBUG: CEO name: ${companyResult.ceo?.name || 'Not found'}`);
            console.log(`   🔍 DEBUG: CFO name: ${companyResult.cfo?.name || 'Not found'}`);
            console.log(`   🔍 DEBUG: CRO name: ${companyResult.cro?.name || 'Not found'}`);

            // Get CEO contact
            if (companyResult.ceo?.name) {
                const ceoContact = await this.searchLushaExecutive(
                    companyResult.ceo.name,
                    companyResult.companyName,
                    domain,
                    'CEO'
                );
                if (ceoContact) executives.push(ceoContact);
            }

            // Get CFO/Finance Leader contact
            if (companyResult.cfo?.name) {
                const cfoContact = await this.searchLushaExecutive(
                    companyResult.cfo.name,
                    companyResult.companyName,
                    domain,
                    'CFO'
                );
                if (cfoContact) executives.push(cfoContact);
            }
            
            // Get CRO/Revenue Leader contact
            if (companyResult.cro?.name) {
                const croContact = await this.searchLushaExecutive(
                    companyResult.cro.name,
                    companyResult.companyName,
                    domain,
                    'CRO'
                );
                if (croContact) executives.push(croContact);
            }

            console.log(`   ✅ Lusha contacts: ${executives.length} executives found`);
            return {
                executives,
                totalFound: executives.length,
                searchAttempts: (companyResult.ceo?.name ? 1 : 0) + (companyResult.financeLeader?.name ? 1 : 0)
            };

        } catch (error) {
            console.log(`   ❌ Lusha error: ${error.message}`);
            return null;
        }
    }

    /**
     * 🔍 ENHANCED EXECUTIVE SEARCH (CoreSignal + Lusha Combined)
     * 
     * Optimal workflow:
     * 1. CoreSignal: Search for employee IDs → Collect verified emails + LinkedIn URLs
     * 2. Lusha: Use LinkedIn URLs to get phone numbers
     * 3. Combine: Complete contact profile with verified data
     */
    async searchLushaExecutive(executiveName, companyName, domain, role) {
        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            console.log(`   🔍 Enhanced executive search: ${firstName} ${lastName} (${role})`);
            console.log(`   🔍 DEBUG: Lusha search parameters - Name: ${executiveName}, Company: ${companyName}, Domain: ${domain}`);

            // OPTIMIZED FLOW: Lusha first (precision) → CoreSignal (validation)
            console.log(`   🎯 OPTIMIZED FLOW: Lusha (precision) → CoreSignal (validation)`);
            
            // STEP 1: Lusha - Get LinkedIn URL and initial contact data (precision targeting)
            console.log(`   🔍 STEP 1: Lusha person search for precision targeting...`);
            const lushaData = await this.searchLushaPersonV2(executiveName, companyName, domain, role);
            
            // STEP 2: CoreSignal - Use LinkedIn URL for exact person match (better use of credits)
            let coreSignalData = null;
            if (lushaData?.linkedinUrl) {
                console.log(`   🔍 STEP 2: CoreSignal search using LinkedIn URL for exact match...`);
                console.log(`   🔗 Using LinkedIn: ${lushaData.linkedinUrl}`);
                coreSignalData = await this.searchCoreSignalByLinkedIn(lushaData.linkedinUrl, executiveName);
            } else if (lushaData?.email) {
                console.log(`   🔍 STEP 2: CoreSignal search using email for exact match...`);
                coreSignalData = await this.searchCoreSignalByEmail(lushaData.email, executiveName);
            } else {
                console.log(`   🔍 STEP 2: Fallback CoreSignal search by name...`);
                coreSignalData = await this.searchCoreSignalExecutive(executiveName, companyName, role);
            }
            
            // STEP 3: Combine and cross-validate data from both sources
            console.log(`   🔍 STEP 3: Cross-validating data between Lusha and CoreSignal...`);
            const combinedData = this.combineExecutiveData(lushaData, coreSignalData, executiveName, role);
            const emailValidation = this.crossValidateEmails(coreSignalData, lushaPhoneData, domain, firstName, lastName);
            
            // STEP 6: Combine data sources for optimal result
            const combinedResult = {
                name: executiveName,
                role: role,
                // Use cross-validated email with confidence boost
                email: emailValidation.email,
                emailValidation: emailValidation,
                // Use Lusha phone data (more comprehensive)
                phone: lushaPhoneData?.phone || null,
                phoneNumbers: lushaPhoneData?.phoneNumbers || [],
                // Use CoreSignal title (more accurate) > Lusha title > role
                title: coreSignalData?.title || lushaPhoneData?.title || role,
                company: companyData?.name || companyName,
                // CoreSignal LinkedIn is more reliable
                linkedinUrl: coreSignalData?.linkedinUrl || lushaPhoneData?.linkedinUrl || this.generateLinkedInURL(firstName, lastName),
                // Calculate confidence based on data sources + email validation
                confidence: this.calculateCombinedConfidence(coreSignalData, lushaPhoneData, emailValidation),
                source: this.generateCombinedSource(coreSignalData, lushaPhoneData),
                // Combine company data
                companyData: companyData ? {
                    employees: companyData.employees,
                    revenue: companyData.revenueRange,
                    industry: companyData.subIndustry,
                    location: companyData.location?.city + ', ' + companyData.location?.state
                } : null,
                // Track data sources for validation
                dataSources: {
                    coreSignal: !!coreSignalData,
                    lusha: !!lushaPhoneData,
                    hasVerifiedEmail: !!coreSignalData?.email,
                    hasVerifiedPhone: !!(lushaPhoneData?.phoneNumbers?.length > 0)
                }
            };
            
            console.log(`   ✅ Combined result: ${combinedResult.confidence}% confidence`);
            console.log(`      📧 Email: ${combinedResult.email} (${emailValidation.source})`);
            if (emailValidation.crossValidated) {
                console.log(`      ✅ CROSS-VALIDATED: Both CoreSignal and Lusha agree on email!`);
            }
            console.log(`      📞 Phone: ${combinedResult.phoneNumbers?.length || 0} numbers from Lusha`);
            
            return combinedResult;

        } catch (error) {
            console.log(`   ❌ Enhanced search error: ${error.message}`);
            return null;
        }
    }

    /**
     * 👤 SEARCH LUSHA PERSON V2 API
     */
    async searchLushaPersonV2(executiveName, companyName, domain, role) {
        if (!this.config.LUSHA_API_KEY) {
            return null;
        }

        try {
            const nameParts = executiveName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];

            console.log(`   👤 Lusha v2 Person API: ${firstName} ${lastName} at ${companyName}`);

            // Use Lusha v2 Person API with proper parameters
            const params = new URLSearchParams({
                firstName: firstName,
                lastName: lastName,
                companyName: companyName,
                companyDomain: domain,
                refreshJobInfo: 'true',
                revealEmails: 'true',
                revealPhones: 'true'
            });

            const response = await fetch(`https://api.lusha.com/v2/person?${params}`, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const personData = await response.json();
                console.log(`   ✅ Lusha v2 person found: ${personData.fullName || executiveName}`);
                
                // Extract contact information from v2 response
                const emails = personData.emailAddresses || [];
                const phones = personData.phoneNumbers || [];
                const primaryEmail = emails.length > 0 ? emails[0].email : null;
                const primaryPhone = phones.length > 0 ? phones[0].number : null;
                
                return {
                    name: personData.fullName || executiveName,
                    email: primaryEmail,
                    phone: primaryPhone,
                    title: personData.jobTitle || role,
                    company: personData.company?.name || companyName,
                    linkedinUrl: personData.linkedinUrl,
                    companyData: personData.company ? {
                        name: personData.company.name,
                        industry: personData.company.industry,
                        size: personData.company.size,
                        founded: personData.company.founded,
                        location: personData.company.location
                    } : null
                };
            } else if (response.status === 404) {
                console.log(`   ⚠️ Lusha v2: Person not found in database`);
                return null;
            } else {
                console.log(`   ⚠️ Lusha v2 API error: ${response.status}`);
                return null;
            }
        } catch (error) {
            console.error(`   ❌ Lusha v2 Person API failed: ${error.message}`);
            return null;
        }
    }

    /**
     * 🏢 GET LUSHA COMPANY DATA
     */
    async getLushaCompanyData(domain) {
        try {
            const lushaUrl = `https://api.lusha.com/company?domain=${encodeURIComponent(domain)}`;
            
            const response = await fetch(lushaUrl, {
                method: 'GET',
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.data; // Return the company data object
            }
        } catch (error) {
            console.log(`   ⚠️ Lusha company data error: ${error.message}`);
        }
        return null;
    }

    /**
     * 📞 RESEARCH EXECUTIVE CONTACT (Using Perplexity)
     */
    async researchExecutiveContact(executiveName, companyName, domain, role) {
        if (!this.config.PERPLEXITY_API_KEY) {
            return null;
        }

        try {
            const prompt = `Find contact information for ${executiveName}, ${role} at ${companyName} (${domain}).

Please provide ONLY a JSON response with verified contact information:
{
    "email": "executive@company.com or null if not found",
    "phone": "+1-xxx-xxx-xxxx or null if not found", 
    "title": "Exact current title",
    "linkedinUrl": "LinkedIn profile URL or null",
    "lastVerified": "2025-01-17",
    "source": "company_website/press_release/linkedin"
}

Focus on publicly available, professional contact information only.`;

            const response = await fetch('https://api.perplexity.ai/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.PERPLEXITY_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.1-sonar-small-128k-online',
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.1
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                // Try to parse JSON response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Perplexity contact research error: ${error.message}`);
        }
        
        return null;
    }

    /**
     * 🔧 UTILITY METHODS FOR CONTACT GENERATION
     */
    generateProbableEmail(firstName, lastName, domain) {
        // Generate probable email patterns
        const cleanDomain = domain.replace(/^www\./, '');
        const patterns = [
            `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${cleanDomain}`,
            `${firstName.toLowerCase()}${lastName.toLowerCase()}@${cleanDomain}`,
            `${firstName.charAt(0).toLowerCase()}${lastName.toLowerCase()}@${cleanDomain}`,
            `${firstName.toLowerCase()}@${cleanDomain}`
        ];
        return patterns[0]; // Return most common pattern
    }

    generateLinkedInURL(firstName, lastName) {
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
        return `https://www.linkedin.com/in/${cleanFirst}-${cleanLast}`;
    }

    /**
     * 💼 GET JOB POSTING INTELLIGENCE (Optional, cost-controlled)
     */
    async getJobPostingIntelligence(companyId, companyName) {
        console.log(`   💼 Optional job posting intelligence...`);

        try {
            // First, check how many job postings exist (minimal cost)
            const countQuery = {
                query: {
                    bool: {
                        must: [
                            { term: { company_id: companyId } },
                            { range: { created_at: { gte: "2024-07-01" } } } // Last 6 months
                        ]
                    }
                }
            };

            const countResponse = await fetch(`${this.config.BASE_URL}/job_posting_multi_source/search/es_dsl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.config.CORESIGNAL_API_KEY
                },
                body: JSON.stringify(countQuery)
            });

            if (countResponse.ok) {
                const countData = await countResponse.json();
                this.creditsUsed += 2;
                
                const jobCount = countData.hits?.total?.value || 0;
                console.log(`   📊 Found ${jobCount} recent job postings`);

                if (jobCount > 0 && jobCount <= 10) {
                    // Only get detailed data if reasonable number of postings
                    return {
                        totalJobPostings: jobCount,
                        hiringVelocity: this.categorizeHiringVelocity(jobCount),
                        growthSignal: jobCount > 5 ? 'Active hiring' : 'Standard hiring',
                        lastUpdated: new Date().toISOString()
                    };
                } else if (jobCount > 10) {
                    console.log(`   ⚠️ Too many job postings (${jobCount}), using summary only`);
                    return {
                        totalJobPostings: jobCount,
                        hiringVelocity: 'Very High',
                        growthSignal: 'Rapid expansion',
                        lastUpdated: new Date().toISOString()
                    };
                } else {
                    return {
                        totalJobPostings: 0,
                        hiringVelocity: 'Low',
                        growthSignal: 'Stable',
                        lastUpdated: new Date().toISOString()
                    };
                }
            }

        } catch (error) {
            console.log(`   ❌ Job posting error: ${error.message}`);
        }

        return null;
    }

    /**
     * 🔧 UTILITY METHODS
     */
    /**
     * 🎯 INTELLIGENT SHORTHAND NAME GENERATION
     * 
     * Uses AI to research the correct CoreSignal shorthand name
     */
    async generateShorthandName(companyName, website) {
        try {
            const prompt = `What is the CoreSignal API shorthand identifier for ${companyName} (${website})?

CoreSignal uses shorthand names like:
- "microsoft" for Microsoft
- "google" for Google  
- "apple" for Apple
- Company names in lowercase with hyphens

Research the likely CoreSignal shorthand for this company.

Provide ONLY a JSON response:
{
    "shorthand": "likely-shorthand-name",
    "confidence": 0.85,
    "reasoning": "why this shorthand is likely"
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
                        console.log(`   🎯 AI shorthand: ${result.shorthand} (${result.reasoning})`);
                        return result.shorthand;
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Shorthand research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Shorthand research failed: ${error.message}`);
        }

        // Fallback: Intelligent heuristic generation
        const cleanWebsite = website?.replace(/^https?:\/\//, '').replace(/^www\./, '');
        const domainName = cleanWebsite?.split('.')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const companyShorthand = companyName.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-');
        
        // Use domain-based shorthand if available, otherwise company name
        return domainName || companyShorthand;
    }

    async getCompanyByShorthand(shorthandName) {
        try {
            const url = `${this.config.BASE_URL}/company_multi_source/collect/${shorthandName}`;
            console.log(`   🔍 DEBUG: CoreSignal URL: ${url}`);
            const response = await fetch(url, {
                headers: { 'apikey': this.config.CORESIGNAL_API_KEY }
            });

            console.log(`   🔍 DEBUG: CoreSignal Response Status: ${response.status}`);
            if (response.ok) {
                const data = await response.json();
                console.log(`   🔍 DEBUG: CoreSignal Response Keys: ${Object.keys(data)}`);
                console.log(`   🔍 DEBUG: Company Name: ${data.company_name || 'Not found'}`);
                console.log(`   🔍 DEBUG: Key Executives: ${data.key_executives ? 'Available' : 'Not available'}`);
                console.log(`   🔍 DEBUG: Company Emails: ${data.company_emails ? 'Available' : 'Not available'}`);
                this.creditsUsed += 2;
                return data;
            } else {
                const errorText = await response.text();
                console.log(`   🔍 DEBUG: CoreSignal Error Response: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ⚠️ Shorthand error: ${error.message}`);
        }
        return null;
    }

    async searchCompanyElasticsearch(companyName, website) {
        try {
            const query = {
                query: {
                    bool: {
                        should: [
                            { match: { company_name: companyName } },
                            { match: { website: website } }
                        ]
                    }
                }
            };

            const response = await fetch(`${this.config.BASE_URL}/company_multi_source/search/es_dsl`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': this.config.CORESIGNAL_API_KEY
                },
                body: JSON.stringify(query)
            });

            if (response.ok) {
                const data = await response.json();
                this.creditsUsed += 2;
                
                if (data.hits?.hits?.length > 0) {
                    const companyId = data.hits.hits[0]._id;
                    // Get full company data
                    const companyResponse = await fetch(`${this.config.BASE_URL}/company_multi_source/collect/${companyId}`, {
                        headers: { 'apikey': this.config.CORESIGNAL_API_KEY }
                    });
                    
                    if (companyResponse.ok) {
                        this.creditsUsed += 2;
                        return await companyResponse.json();
                    }
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Company search error: ${error.message}`);
        }
        return null;
    }

    categorizeHiringVelocity(jobCount) {
        if (jobCount >= 20) return 'Very High';
        if (jobCount >= 10) return 'High';
        if (jobCount >= 5) return 'Moderate';
        if (jobCount >= 1) return 'Low';
        return 'Minimal';
    }

    calculateDataQuality(enhancement) {
        let confidence = 0;
        const sources = [];

        if (enhancement.companyIntelligence) {
            confidence += 40;
            sources.push('CoreSignal Company');
        }

        if (enhancement.executiveContacts?.executives?.length > 0) {
            confidence += 40;
            sources.push('Lusha Contacts');
        }

        if (enhancement.hiringIntelligence) {
            confidence += 20;
            sources.push('CoreSignal Jobs');
        }

        return {
            confidence: Math.min(confidence, 100),
            sources,
            creditsUsed: this.creditsUsed,
            costEfficient: this.creditsUsed < 20
        };
    }

    /**
     * 📊 GET CREDITS USED
     */
    getCreditsUsed() {
        return this.creditsUsed;
    }

    /**
     * 🔄 RESET CREDITS COUNTER
     */
    resetCreditsCounter() {
        this.creditsUsed = 0;
    }

    /**
     * ✅ CROSS-VALIDATE EMAILS BETWEEN CORESIGNAL AND LUSHA
     */
    crossValidateEmails(coreSignalData, lushaData, domain, firstName, lastName) {
        const validation = {
            email: null,
            confidence: 0,
            source: 'none',
            crossValidated: false,
            validationDetails: {
                coreSignalEmail: coreSignalData?.email || null,
                lushaEmail: lushaData?.email || null,
                match: false,
                reliability: 'low'
            }
        };

        // If both sources have emails, check if they match
        if (coreSignalData?.email && lushaData?.email) {
            const coreEmail = coreSignalData.email.toLowerCase().trim();
            const lushaEmail = lushaData.email.toLowerCase().trim();
            
            if (coreEmail === lushaEmail) {
                // PERFECT MATCH - Both APIs agree!
                validation.email = coreSignalData.email;
                validation.confidence = 95;
                validation.source = 'CoreSignal + Lusha (cross-validated)';
                validation.crossValidated = true;
                validation.validationDetails.match = true;
                validation.validationDetails.reliability = 'very_high';
                
                console.log(`      ✅ EMAIL CROSS-VALIDATION: Perfect match! ${coreEmail}`);
                return validation;
            } else {
                // MISMATCH - Need to decide which is more reliable
                console.log(`      ⚠️ EMAIL MISMATCH: CoreSignal(${coreEmail}) vs Lusha(${lushaEmail})`);
                
                // Prefer CoreSignal (primary_professional_email is more reliable)
                validation.email = coreSignalData.email;
                validation.confidence = 75;
                validation.source = 'CoreSignal (preferred over Lusha mismatch)';
                validation.validationDetails.reliability = 'medium';
                return validation;
            }
        }
        
        // Only CoreSignal has email
        if (coreSignalData?.email && !lushaData?.email) {
            validation.email = coreSignalData.email;
            validation.confidence = 85;
            validation.source = 'CoreSignal verified';
            validation.validationDetails.reliability = 'high';
            
            console.log(`      📧 CoreSignal email only: ${coreSignalData.email}`);
            return validation;
        }
        
        // Only Lusha has email
        if (!coreSignalData?.email && lushaData?.email) {
            validation.email = lushaData.email;
            validation.confidence = 70;
            validation.source = 'Lusha only';
            validation.validationDetails.reliability = 'medium';
            
            console.log(`      📧 Lusha email only: ${lushaData.email}`);
            return validation;
        }
        
        // No emails from either source - fallback to generated
        const generatedEmail = this.generateProbableEmail(firstName, lastName, domain);
        
        validation.email = generatedEmail;
        validation.confidence = 30;
        validation.source = 'generated (no API data)';
        validation.validationDetails.reliability = 'low';
        
        console.log(`      ⚠️ No verified emails found, generated: ${generatedEmail}`);
        return validation;
    }

    /**
     * 📊 SEARCH CORESIGNAL EXECUTIVE (SEARCH → COLLECT WORKFLOW)
     */
    async searchCoreSignalExecutive(executiveName, companyName, role) {
        if (!this.config.CORESIGNAL_API_KEY) {
            return null;
        }

        try {
            console.log(`   📊 CoreSignal: Searching for ${executiveName} at ${companyName}...`);

            // STEP 1: Search for executive employee ID
            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        bool: {
                            must: [
                                {
                                    nested: {
                                        path: "experience",
                                        query: {
                                            bool: {
                                                must: [
                                                    { term: { "experience.active_experience": 1 } },
                                                    { 
                                        bool: {
                                            should: [
                                                { match: { "experience.company_name": companyName } },
                                                { match: { "experience.company_name": companyName.replace(/,?\s*(Inc|LLC|Corp|Ltd|Corporation|Company)\.?$/i, '') } },
                                                { match: { "experience.company_name": companyName.split(',')[0].trim() } }
                                            ],
                                            minimum_should_match: 1
                                        }
                                    }
                                                ]
                                            }
                                        }
                                    }
                                },
                                { match: { "full_name": executiveName } }
                            ]
                        }
                    }
                })
            });

            if (!searchResponse.ok) {
                console.log(`   ❌ CoreSignal search failed: ${searchResponse.status}`);
                return null;
            }

            const searchData = await searchResponse.json();
            const hits = searchData.hits?.hits || [];
            
            if (hits.length === 0) {
                console.log(`   ⚠️ No CoreSignal results for ${executiveName}`);
                return null;
            }

            // STEP 2: Collect the first matching profile
            const employeeId = hits[0]._id;
            console.log(`   🔍 Collecting profile for employee ID: ${employeeId}`);

            const collectResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY
                }
            });

            if (collectResponse.ok) {
                const profile = await collectResponse.json();
                
                console.log(`   ✅ CoreSignal profile collected: ${profile.full_name}`);
                console.log(`      📧 Email: ${profile.primary_professional_email || 'None'}`);
                console.log(`      🔗 LinkedIn: ${profile.linkedin_url || 'None'}`);

                this.creditsUsed += 4; // 2 for search + 2 for collect

                return {
                    name: profile.full_name,
                    title: profile.active_experience_title,
                    email: profile.primary_professional_email,
                    alternativeEmails: profile.professional_emails_collection || [],
                    linkedinUrl: profile.linkedin_url,
                    source: 'CoreSignal Employee API',
                    confidence: profile.primary_professional_email ? 95 : 80,
                    employeeId: employeeId
                };
            }

            return null;

        } catch (error) {
            console.log(`   ❌ CoreSignal executive search error: ${error.message}`);
            return null;
        }
    }

    /**
     * 📞 GET LUSHA PHONE BY LINKEDIN URL
     */
    async getLushaPhoneByLinkedIn(linkedinUrl) {
        if (!this.config.LUSHA_API_KEY || !linkedinUrl) {
            return null;
        }

        try {
            console.log(`   📞 Lusha: Getting phone via LinkedIn URL...`);

            const response = await fetch(`https://api.lusha.com/v2/person?linkedinUrl=${encodeURIComponent(linkedinUrl)}`, {
                headers: {
                    'api_key': this.config.LUSHA_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                
                if (data.data && data.data.phoneNumbers) {
                    const callablePhones = data.data.phoneNumbers.filter(phone => !phone.doNotCall);
                    
                    console.log(`   ✅ Lusha found ${callablePhones.length} callable phone numbers`);

                    this.creditsUsed += 1; // Lusha credit

                    return {
                        name: data.data.fullName,
                        title: data.data.jobTitle,
                        email: data.data.emailAddresses?.[0]?.email || null,
                        phone: callablePhones[0]?.number || null,
                        phoneNumbers: callablePhones.map(phone => ({
                            number: phone.number,
                            type: phone.type || 'unknown',
                            source: 'Lusha API',
                            doNotCall: phone.doNotCall || false
                        })),
                        linkedinUrl: linkedinUrl,
                        source: 'Lusha LinkedIn Lookup',
                        confidence: callablePhones.length > 0 ? 90 : 70
                    };
                }
            }

            console.log(`   ⚠️ Lusha: No phone data found for LinkedIn URL`);
            return null;

        } catch (error) {
            console.log(`   ❌ Lusha LinkedIn lookup error: ${error.message}`);
            return null;
        }
    }

    /**
     * 🎯 CALCULATE COMBINED CONFIDENCE
     */
    calculateCombinedConfidence(coreSignalData, lushaPhoneData, emailValidation = null) {
        let confidence = 50; // Base confidence

        if (coreSignalData) {
            confidence += 30; // CoreSignal data adds significant confidence
            if (coreSignalData.email) {
                confidence += 15; // Verified email adds confidence
            }
            if (coreSignalData.linkedinUrl) {
                confidence += 5; // LinkedIn adds some confidence
            }
        }

        if (lushaPhoneData) {
            confidence += 15; // Lusha data adds confidence
            if (lushaPhoneData.phoneNumbers && lushaPhoneData.phoneNumbers.length > 0) {
                confidence += 15; // Phone numbers add more confidence
            }
        }

        // Email validation confidence boost
        if (emailValidation) {
            if (emailValidation.crossValidated) {
                confidence += 20; // Both APIs agree on email - huge confidence boost!
                console.log(`      🚀 CONFIDENCE BOOST: Cross-validated email (+20%)`);
            } else if (emailValidation.confidence >= 85) {
                confidence += 10; // Single verified source
                console.log(`      📧 CONFIDENCE BOOST: Verified email (+10%)`);
            } else if (emailValidation.confidence >= 70) {
                confidence += 5; // Medium confidence source
                console.log(`      📧 CONFIDENCE BOOST: Medium email (+5%)`);
            }
        }

        return Math.min(confidence, 98); // Cap at 98% (perfect match scenario)
    }

    /**
     * 📊 GENERATE COMBINED SOURCE
     */
    generateCombinedSource(coreSignalData, lushaPhoneData) {
        const sources = [];
        
        if (coreSignalData) {
            sources.push('CoreSignal API');
        }
        
        if (lushaPhoneData) {
            sources.push('Lusha API');
        }
        
        if (sources.length === 0) {
            return 'Inferred';
        }
        
        return sources.join(' + ');
    }

    /**
     * 📧 GENERATE PROBABLE EMAIL
     */
    generateProbableEmail(firstName, lastName, domain) {
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
        return `${cleanFirst}.${cleanLast}@${domain}`;
    }

    /**
     * 🔗 GENERATE LINKEDIN URL
     */
    generateLinkedInURL(firstName, lastName) {
        const cleanFirst = firstName.toLowerCase().replace(/[^a-z]/g, '');
        const cleanLast = lastName.toLowerCase().replace(/[^a-z]/g, '');
        return `https://www.linkedin.com/in/${cleanFirst}-${cleanLast}`;
    }

    /**
     * 🎯 CORESIGNAL SEARCH BY LINKEDIN URL (Exact Person Match)
     * 
     * Uses LinkedIn URL from Lusha to find exact CoreSignal profile
     * Much more accurate and cost-effective than broad company search
     */
    async searchCoreSignalByLinkedIn(linkedinUrl, executiveName) {
        console.log(`   🔍 DEBUG: CoreSignal LinkedIn search for ${executiveName}`);
        console.log(`   🔗 DEBUG: LinkedIn URL: ${linkedinUrl}`);
        
        try {
            // CoreSignal employee search by LinkedIn URL
            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        bool: {
                            must: [
                                {
                                    match: {
                                        linkedin_url: linkedinUrl
                                    }
                                }
                            ]
                        }
                    },
                    size: 1
                })
            });

            console.log(`   🔍 DEBUG: CoreSignal LinkedIn search status: ${searchResponse.status}`);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const hits = searchData.hits?.hits || [];
                console.log(`   🔍 DEBUG: CoreSignal found ${hits.length} LinkedIn matches`);
                
                if (hits.length > 0) {
                    const employeeId = hits[0]._id;
                    console.log(`   🔍 Found CoreSignal employee ID: ${employeeId}`);
                    
                    // Get detailed profile
                    const profileResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                        headers: {
                            'apikey': this.config.CORESIGNAL_API_KEY
                        }
                    });
                    
                    if (profileResponse.ok) {
                        const profile = await profileResponse.json();
                        console.log(`   ✅ CoreSignal profile: ${profile.full_name}`);
                        console.log(`   📧 Primary email: ${profile.primary_professional_email || 'None'}`);
                        console.log(`   📧 Alt emails: ${profile.professional_emails_collection?.length || 0}`);
                        console.log(`   🔗 LinkedIn: ${profile.linkedin_url || 'None'}`);
                        
                        this.creditsUsed += 3; // Search + Collect
                        
                        return {
                            name: profile.full_name,
                            title: profile.active_experience_title,
                            primaryEmail: profile.primary_professional_email,
                            alternativeEmails: profile.professional_emails_collection || [],
                            linkedinUrl: profile.linkedin_url,
                            company: profile.active_experience_company_name,
                            experience: profile.experience_months,
                            source: 'coresignal_linkedin_match',
                            confidence: 95
                        };
                    } else {
                        console.log(`   ❌ CoreSignal profile collection failed: ${profileResponse.status}`);
                    }
                } else {
                    console.log(`   ❌ No CoreSignal employee found with LinkedIn: ${linkedinUrl}`);
                }
            } else {
                const errorText = await searchResponse.text();
                console.log(`   🔍 DEBUG: CoreSignal LinkedIn search error: ${errorText}`);
            }
        } catch (error) {
            console.log(`   ❌ CoreSignal LinkedIn search error: ${error.message}`);
        }
        
        return null;
    }

    /**
     * 🎯 CORESIGNAL SEARCH BY EMAIL (Exact Person Match)
     */
    async searchCoreSignalByEmail(email, executiveName) {
        console.log(`   🔍 DEBUG: CoreSignal email search for ${executiveName}`);
        console.log(`   📧 DEBUG: Email: ${email}`);
        
        try {
            const searchResponse = await fetch('https://api.coresignal.com/cdapi/v2/employee_multi_source/search/es_dsl', {
                method: 'POST',
                headers: {
                    'apikey': this.config.CORESIGNAL_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: {
                        bool: {
                            should: [
                                {
                                    match: {
                                        primary_professional_email: email
                                    }
                                },
                                {
                                    nested: {
                                        path: "professional_emails_collection",
                                        query: {
                                            match: {
                                                "professional_emails_collection.professional_email": email
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    size: 1
                })
            });

            console.log(`   🔍 DEBUG: CoreSignal email search status: ${searchResponse.status}`);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                const hits = searchData.hits?.hits || [];
                console.log(`   🔍 DEBUG: CoreSignal found ${hits.length} email matches`);
                
                if (hits.length > 0) {
                    const employeeId = hits[0]._id;
                    console.log(`   🔍 Found CoreSignal employee ID by email: ${employeeId}`);
                    
                    // Get detailed profile
                    const profileResponse = await fetch(`https://api.coresignal.com/cdapi/v2/employee_multi_source/collect/${employeeId}`, {
                        headers: {
                            'apikey': this.config.CORESIGNAL_API_KEY
                        }
                    });
                    
                    if (profileResponse.ok) {
                        const profile = await profileResponse.json();
                        console.log(`   ✅ CoreSignal profile by email: ${profile.full_name}`);
                        
                        this.creditsUsed += 3; // Search + Collect
                        
                        return {
                            name: profile.full_name,
                            title: profile.active_experience_title,
                            primaryEmail: profile.primary_professional_email,
                            alternativeEmails: profile.professional_emails_collection || [],
                            linkedinUrl: profile.linkedin_url,
                            company: profile.active_experience_company_name,
                            experience: profile.experience_months,
                            source: 'coresignal_email_match',
                            confidence: 95
                        };
                    }
                }
            }
        } catch (error) {
            console.log(`   ❌ CoreSignal email search error: ${error.message}`);
        }
        
        return null;
    }

    /**
     * 🎯 COMBINE EXECUTIVE DATA (Lusha + CoreSignal)
     * 
     * Smart combination of Lusha precision with CoreSignal validation
     */
    combineExecutiveData(lushaData, coreSignalData, executiveName, role) {
        console.log(`   🔍 DEBUG: Combining data for ${executiveName}`);
        
        const combined = {
            name: executiveName,
            role: role,
            confidence: 0,
            sources: []
        };
        
        // Primary data from Lusha (higher precision)
        if (lushaData) {
            combined.email = lushaData.email;
            combined.phoneNumbers = lushaData.phoneNumbers || [];
            combined.linkedinUrl = lushaData.linkedinUrl;
            combined.title = lushaData.title;
            combined.sources.push('lusha');
            combined.confidence += 40;
            console.log(`   ✅ Lusha data: Email=${lushaData.email || 'None'}, Phones=${lushaData.phoneNumbers?.length || 0}, LinkedIn=${lushaData.linkedinUrl || 'None'}`);
        }
        
        // Validation data from CoreSignal (cross-validation)
        if (coreSignalData) {
            // Cross-validate email
            if (coreSignalData.primaryEmail && combined.email === coreSignalData.primaryEmail) {
                console.log(`   ✅ Email cross-validated: ${combined.email}`);
                combined.confidence += 30;
                combined.emailValidated = true;
            } else if (coreSignalData.primaryEmail && !combined.email) {
                combined.email = coreSignalData.primaryEmail;
                combined.confidence += 25;
                console.log(`   ✅ Email from CoreSignal: ${coreSignalData.primaryEmail}`);
            }
            
            // Add alternative emails
            if (coreSignalData.alternativeEmails?.length > 0) {
                combined.alternativeEmails = coreSignalData.alternativeEmails;
                console.log(`   📧 CoreSignal alt emails: ${coreSignalData.alternativeEmails.length}`);
            }
            
            // Cross-validate LinkedIn
            if (coreSignalData.linkedinUrl && combined.linkedinUrl === coreSignalData.linkedinUrl) {
                console.log(`   ✅ LinkedIn cross-validated: ${combined.linkedinUrl}`);
                combined.confidence += 20;
                combined.linkedinValidated = true;
            }
            
            // Cross-validate title
            if (coreSignalData.title && combined.title && 
                coreSignalData.title.toLowerCase().includes(combined.title.toLowerCase())) {
                console.log(`   ✅ Title cross-validated: ${combined.title}`);
                combined.confidence += 10;
            }
            
            combined.sources.push('coresignal');
            combined.experience = coreSignalData.experience;
        }
        
        console.log(`   🎯 Combined confidence: ${combined.confidence}% from sources: ${combined.sources.join(', ')}`);
        return combined;
    }
}

module.exports = { ExecutiveContactIntelligence };
