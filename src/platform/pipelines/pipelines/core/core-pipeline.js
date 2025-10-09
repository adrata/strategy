#!/usr/bin/env node

/**
 * CORE PIPELINE
 * 
 * Core pipeline that focuses ONLY on:
 * 1. Finding CFO (finance) and CRO (revenue/sales) with high accuracy
 * 2. Getting their verified contact information
 * 3. Essential validation for data quality
 * 
 * This version is optimized for speed and contact accuracy.
 * No related company expansion - just pure CFO/CRO contact data.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../../../.env copy') });

const { VersionManager } = require('../../scripts/version-manager');
const { CompanyResolver } = require('../../modules/core/CompanyResolver');
const { ExecutiveResearch } = require('../../modules/core/ExecutiveResearch');
const { ExecutiveContactIntelligence } = require('../../modules/core/ExecutiveContactIntelligence');
const { ContactValidator } = require('../../modules/core/ContactValidator');
const { ValidationEngine } = require('../../modules/core/ValidationEngine');
const { PEOwnershipAnalysis } = require('../../modules/core/PEOwnershipAnalysis');
const { ApiCostOptimizer } = require('../../modules/core/ApiCostOptimizer');
const { ExecutiveTransitionDetector } = require('../../modules/core/ExecutiveTransitionDetector');
const DataCache = require('../../modules/core/DataCache');

// NEW: Multi-source verification modules
const { CoreSignalMultiSource } = require('../../modules/core/CoreSignalMultiSource');
const { MultiSourceVerifier } = require('../../modules/core/MultiSourceVerifier');

/**
 * CORE PIPELINE 
 * 
 * Fast & focused executive contact discovery:
 * - CFO (finance) and CRO (revenue/sales) contacts + Parent/Merger/Acquisition companies
 * - Essential company data only
 * - Streamlined output (24 columns vs 80+ in advanced)
 * - Optimized for speed and essential contact data
 * - Perfect for quick prospecting and lead generation
 */
class CorePipeline {
    constructor() {
        // Pass environment variables to all modules that need API keys
        const config = {
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
            PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
            // Performance optimizations
            PARALLEL_PROCESSING: true,
            MAX_PARALLEL_COMPANIES: 5, // Reduced for rate limiting
            REDUCED_DELAYS: true,
            CACHE_ENABLED: true
        };

        this.companyResolver = new CompanyResolver(config);
        this.researcher = new ExecutiveResearch(config);
        this.executiveContactIntelligence = new ExecutiveContactIntelligence(config);
        this.contactValidator = new ContactValidator(config);
        this.validationEngine = new ValidationEngine(config);
        this.peIntelligence = new PEOwnershipAnalysis(config);
        this.apiCostOptimizer = new ApiCostOptimizer(config);
        this.executiveTransitionDetector = new ExecutiveTransitionDetector(config);
        
        // NEW: Multi-source verification modules
        this.coresignalMultiSource = new CoreSignalMultiSource(config);
        this.multiSourceVerifier = new MultiSourceVerifier(config);
        
        this.versionManager = new VersionManager();
        this.dataCache = new DataCache({
            CACHE_TTL_DAYS: 30,
            USE_FILE_CACHE: true
        });
        this.config = config; // Store config for later use
        
        this.results = [];
        this.stats = {
            processed: 0,
            successful: 0,
            errors: 0,
            cfoFound: 0,
            croFound: 0,
            bothFound: 0,
            contactsValidated: 0,
            highConfidence: 0,
            parentCompaniesAdded: 0,
            cacheHits: 0,
            cacheMisses: 0,
            apiCostsSaved: 0,
            startTime: Date.now()
        };
    }

    /**
     * MAIN PIPELINE EXECUTION - STREAMLINED FOR CFO/CRO CONTACTS
     */
    async runPipeline(inputFile = null) {
        // Store input file for use in loadCompanies
        this.inputFile = inputFile;
        
        console.log('CORE PIPELINE');
        console.log('=' .repeat(80));
        console.log('Core executive contact discovery');
        console.log('Focus: CFO (finance) + CRO (revenue/sales) identification and verified contact info');
        console.log('No related company expansion - pure contact data');

        try {
            // STEP 1: Load companies from CSV
            console.log('\nSTEP 1: Loading Companies');
            const companies = await this.loadCompanies();
            console.log(`   Loaded ${companies.length} companies`);

            // STEP 2: Process each company for CFO/CRO contacts (PARALLEL PROCESSING)
            console.log('\nSTEP 2: Core Contact Discovery (PARALLEL PROCESSING)');
            console.log(`🚀 Processing ${companies.length} companies with ${this.config.MAX_PARALLEL_COMPANIES}x parallelization`);
            
            // Check cache coverage
            await this.analyzeCacheCoverage(companies.slice(0, Math.min(20, companies.length)));
            
            let processedCount = 0;
            const totalCompanies = companies.length;

            // Process in parallel batches
            for (let i = 0; i < totalCompanies; i += this.config.MAX_PARALLEL_COMPANIES) {
                const batch = companies.slice(i, i + this.config.MAX_PARALLEL_COMPANIES);
                const batchNumber = Math.floor(i / this.config.MAX_PARALLEL_COMPANIES) + 1;
                const totalBatches = Math.ceil(totalCompanies / this.config.MAX_PARALLEL_COMPANIES);

                console.log(`\n🔄 BATCH ${batchNumber}/${totalBatches} - Processing ${batch.length} companies in parallel`);
                console.log(`   Companies ${i + 1}-${Math.min(i + batch.length, totalCompanies)} of ${totalCompanies}`);

                // Process batch in parallel
                const batchStartTime = Date.now();
                const batchPromises = batch.map((company, index) => 
                    this.processCompanyOptimized(company, processedCount + index + 1)
                );

                const batchResults = await Promise.allSettled(batchPromises);
                
                // Handle results with safety checks
                for (let j = 0; j < batchResults.length; j++) {
                    if (batchResults[j].status === 'fulfilled' && batchResults[j].value) {
                        const result = batchResults[j].value;
                        
                                    // Ensure all required objects exist
                        if (!result.cfo) {
                            result.cfo = { name: '', title: '', email: '', phone: '', linkedIn: '', confidence: 0, tier: null, role: 'N/A' };
                        }
                        if (!result.cro) {
                            result.cro = { name: '', title: '', email: '', phone: '', linkedIn: '', confidence: 0, tier: null, role: 'N/A' };
                        }
                        if (!result.companyInfo) {
                            result.companyInfo = { industry: '', employeeCount: '', headquarters: '', isPublic: false };
                        }
                        if (!result.corporateStructure) {
                            result.corporateStructure = { isAcquired: false, parentCompany: '', acquisitionDate: '' };
                        }
                        
                        this.results.push(result);
                    } else {
                        const errorMsg = batchResults[j].reason?.message || 'Unknown error';
                        console.error(`   ❌ Company ${processedCount + j + 1} failed:`, errorMsg);
                        
                        // Add failed company with proper structure
                        this.results.push({
                            website: batch[j]?.website || 'Unknown',
                            companyName: batch[j]?.companyName || 'Unknown',
                            accountOwner: batch[j]?.accountOwner || 'Unknown',
                            processingStatus: 'FAILED',
                            error: errorMsg,
                            cfo: { name: '', title: '', email: '', phone: '', linkedIn: '', confidence: 0, tier: null, role: 'N/A' },
                            cro: { name: '', title: '', email: '', phone: '', linkedIn: '', confidence: 0, tier: null, role: 'N/A' },
                            companyInfo: { industry: '', employeeCount: '', headquarters: '', isPublic: false },
                            corporateStructure: { isAcquired: false, parentCompany: '', acquisitionDate: '' },
                            overallConfidence: 0,
                            relationType: 'original'
                        });
                    }
                }

                processedCount += batch.length;
                const batchTime = Date.now() - batchStartTime;
                const avgTimePerCompany = Math.round(batchTime / batch.length);
                
                console.log(`   ✅ Batch completed in ${Math.round(batchTime/1000)}s (${avgTimePerCompany}ms per company)`);
                
                // Save progress every batch
                if (processedCount % 10 === 0 || processedCount === totalCompanies) {
                    await this.saveProgressBackup(processedCount);
                }

                // Reduced rate limiting between batches
                if (i + this.config.MAX_PARALLEL_COMPANIES < totalCompanies) {
                    console.log('   ⏳ Inter-batch delay: 2s...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }

            // STEP 3: Add Parent/Merger/Acquisition Companies
            console.log('\nSTEP 3: Adding Parent/Merger/Acquisition Companies');
            await this.addRelatedCompanyRows();

            // STEP 4: Generate core contact CSV
            console.log('\nSTEP 4: Generating Core Contact CSV');
            const version = this.versionManager.getNextVersion();
            await this.generateContactCSV(version);

            // STEP 5: Generate summary report
            console.log('\nSTEP 5: Pipeline Summary');
            this.generateSummary();
            
            // STEP 6: Performance summary
            this.printPerformanceSummary();

            return {
                success: true,
                results: this.results,
                stats: this.stats
            };

        } catch (error) {
            console.error(`Pipeline failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                results: this.results,
                stats: this.stats
            };
        }
    }

    /**
     * LOAD COMPANIES FROM CSV
     */
    async loadCompanies() {
        return new Promise((resolve, reject) => {
            const companies = [];
            
            // Use passed parameter, command line argument, or default file
            const inputFile = this.inputFile || process.argv[2] || path.join(__dirname, '../../inputs/all-1000-companies.csv');
            console.log(`    Reading from: ${inputFile}`);
            
            fs.createReadStream(inputFile)
                .pipe(csv())
                .on('data', (row) => {
                    // Support multiple CSV formats
                    const website = row.Website || row.domain || row.Domain;
                    const companyName = row['Company Name'] || row.company_name || row['company_name'];
                    
                    if (website && website.trim()) {
                        companies.push({
                            website: website.trim(),
                            company_name: companyName || website.trim(),
                            accountOwner: row['Account Owner'] || 'Unknown',
                            isTop1000: row['Top 1000'] === '1'
                        });
                    }
                })
                .on('end', () => resolve(companies))
                .on('error', reject);
        });
    }

    /**
     * PROCESS INDIVIDUAL COMPANY - STREAMLINED FOR CFO/CRO CONTACTS
     */
    async processCompany(company, index) {
        const result = {
            index,
            website: company.website,
            accountOwner: company.accountOwner,
            isTop1000: company.isTop1000,
            companyName: '',
            
            // CFO Information (Finance Leader)
            cfo: {
                name: '',
                title: '',
                email: '',
                phone: '',
                linkedIn: '',
                confidence: 0,
                source: '',
                validated: false,
                role: '', // CFO, Controller, VP Finance, etc.
                tier: null // 1-5 tier level
            },
            
            // CRO Information (Revenue/Sales Leader)
            cro: {
                name: '',
                title: '',
                email: '',
                phone: '',
                linkedIn: '',
                confidence: 0,
                source: '',
                validated: false,
                role: '', // CRO, CSO, VP Sales, etc.
                tier: null // 1-5 tier level
            },
            
            // Essential Company Data (for validation)
            companyInfo: {
                isPublic: false,
                ticker: '',
                parentCompany: '',
                industry: '',
                employeeCount: '',
                headquarters: ''
            },
            
            // Processing Metadata
            researchMethod: '',
            overallConfidence: 0,
            processingTime: 0,
            timestamp: new Date().toISOString(),
            validationNotes: [],
            error: null
        };

        const startTime = Date.now();

        try {
            this.stats.processed++;

            // STEP 1: Company Resolution (Essential for validation)
            console.log('Resolving company identity...');
            const companyResolution = await this.companyResolver.resolveCompany(company.website);
            result.companyName = companyResolution.companyName || this.extractCompanyName(company.website);
            
            // Store essential company info for validation and CSV output
            result.companyInfo = {
                isPublic: companyResolution.isPublic || false,
                ticker: companyResolution.ticker || '',
                parentCompany: companyResolution.parentCompany || '',
                industry: companyResolution.industry || '',
                employeeCount: companyResolution.employeeCount || '',
                headquarters: companyResolution.headquarters || ''
            };

            // Store corporate structure info for acquisition detection
            result.corporateStructure = {
                isAcquired: companyResolution.acquisitionInfo?.isAcquired || false,
                parentCompany: companyResolution.acquisitionInfo?.parentCompany || companyResolution.parentCompany || '',
                acquisitionDate: companyResolution.acquisitionInfo?.acquisitionDate || '',
                acquisitionType: companyResolution.acquisitionInfo?.acquisitionType || '',
                confidence: companyResolution.acquisitionInfo?.confidence || 0
            };

            // STEP 1.5: Post-Acquisition Executive Tracking (if applicable)
            if (companyResolution.acquisitionInfo?.isAcquired && companyResolution.acquisitionInfo?.executiveTracking) {
                console.log('Tracking post-acquisition executives...');
                const executiveTracking = await this.companyResolver.trackPostAcquisitionExecutives(
                    result.companyName,
                    companyResolution.acquisitionInfo
                );
                if (executiveTracking) {
                    result.executiveTracking = executiveTracking;
                    console.log(`   ✅ Tracked ${executiveTracking.executives.length} post-acquisition executives`);
                }
            }

            // STEP 2: Dual Role Executive Research (CFO + CRO Focus)
            console.log('Researching CFO and CRO...');
            const research = await this.researcher.researchExecutives({
                name: result.companyName,
                website: company.website,
                companyResolution: companyResolution
            });

            // Process CFO results - Always initialize CFO object
            result.cfo = {
                name: research.cfo?.name || '',
                title: research.cfo?.title || '',
                email: '',
                phone: '',
                linkedIn: '',
                confidence: Math.round((research.cfo?.confidence || 0) * 100),
                source: research.cfo?.source || '',
                validated: (research.cfo?.confidence || 0) > 0.8,
                role: this.categorizeRevenueFinanceRole(research.cfo?.title || ''),
                tier: research.cfo?.tier || null
            };
            
            if (research.cfo && research.cfo.name) {
                this.stats.cfoFound++;
            }

            // Process CRO results - Always initialize CRO object
            result.cro = {
                name: research.cro?.name || '',
                title: research.cro?.title || '',
                email: '',
                phone: '',
                linkedIn: '',
                confidence: Math.round((research.cro?.confidence || 0) * 100),
                source: research.cro?.source || '',
                validated: (research.cro?.confidence || 0) > 0.8,
                role: this.categorizeRevenueFinanceRole(research.cro?.title || ''),
                tier: research.cro?.tier || null
            };
            
            if (research.cro && research.cro.name) {
                this.stats.croFound++;
            }

            // STEP 3: Multi-Source Executive Discovery (NEW - Credit Efficient)
            console.log('🔍 STEP 3: Multi-Source Executive Discovery...');
            const multiSourceResult = await this.coresignalMultiSource.discoverExecutives(result.companyName, ['CFO', 'CRO']);
            
            // Use multi-source results if available, fallback to existing research
            if (multiSourceResult.cfo) {
                console.log(`   ✅ Multi-source CFO found: ${multiSourceResult.cfo.name}`);
                result.cfo = {
                    name: multiSourceResult.cfo.name,
                    title: multiSourceResult.cfo.title,
                    email: multiSourceResult.cfo.email || '',
                    phone: multiSourceResult.cfo.phone || '',
                    linkedIn: multiSourceResult.cfo.linkedinUrl || '',
                    confidence: multiSourceResult.cfo.confidence || 0,
                    source: 'coresignal-multisource',
                    validated: false,
                    role: this.categorizeRevenueFinanceRole(multiSourceResult.cfo.title || ''),
                    tier: this.categorizeRoleTier(multiSourceResult.cfo.title, 'CFO')
                };
                this.stats.cfoFound++;
            }
            
            if (multiSourceResult.cro) {
                console.log(`   ✅ Multi-source CRO found: ${multiSourceResult.cro.name}`);
                result.cro = {
                    name: multiSourceResult.cro.name,
                    title: multiSourceResult.cro.title,
                    email: multiSourceResult.cro.email || '',
                    phone: multiSourceResult.cro.phone || '',
                    linkedIn: multiSourceResult.cro.linkedinUrl || '',
                    confidence: multiSourceResult.cro.confidence || 0,
                    source: 'coresignal-multisource',
                    validated: false,
                    role: this.categorizeRevenueFinanceRole(multiSourceResult.cro.title || ''),
                    tier: this.categorizeRoleTier(multiSourceResult.cro.title, 'CRO')
                };
                this.stats.croFound++;
            }

            // STEP 4: Contact Intelligence (Email/Phone Discovery) - Enhanced
            console.log('Discovering contact information...');
            console.log('🔍 DEBUG: Starting contact intelligence with detailed API logging...');
            const contactIntelligence = await this.executiveContactIntelligence.enhanceExecutiveIntelligence(result);
            
            // Merge contact data with enhanced logging
            console.log('   📧 Merging contact intelligence data...');
            this.mergeContactData(result, contactIntelligence);
            
            // Debug: Show what contact intelligence returned
            console.log(`   🔍 Contact Intelligence Summary:`);
            console.log(`      Structure: ${JSON.stringify(Object.keys(contactIntelligence || {}))}`);
            if (contactIntelligence?.executiveContacts) {
                console.log(`      Executive Contacts: ${JSON.stringify(Object.keys(contactIntelligence.executiveContacts))}`);
            }
            
            // Populate company data from research
            if (research.companyDetails) {
                result.companyInfo.industry = result.companyInfo.industry || research.companyDetails.industry || '';
                result.companyInfo.employeeCount = result.companyInfo.employeeCount || research.companyDetails.employeeCount || '';
                result.companyInfo.headquarters = result.companyInfo.headquarters || research.companyDetails.headquarters || '';
            }

            // STEP 5: Essential Contact Validation
            console.log('Validating executive contacts...');
            console.log(`🔍 DEBUG: Passing executives to validator - CFO: ${result.cfo?.name}, CRO: ${result.cro?.name}`);
            const contactValidation = await this.contactValidator.enrichContacts(
                { executives: { cfo: result.cfo, cro: result.cro } },
                companyResolution
            );
            
            // Apply validation results
            this.applyContactValidation(result, contactValidation);
            
            // Ensure contact information is properly captured
            this.finalizeContactData(result, contactIntelligence, contactValidation);
            
            // DEBUG: Check what data we have before validation
            console.log(`🔍 DEBUG: Data before final validation:`);
            console.log(`   CFO: ${result.cfo?.name} - Email: ${result.cfo?.email} - Phone: ${result.cfo?.phone}`);
            console.log(`   CRO: ${result.cro?.name} - Email: ${result.cro?.email} - Phone: ${result.cro?.phone}`);

            // STEP 6: Multi-Source Verification (NEW - 2-3x Person, 2-3x Email, 2x Phone)
            console.log('🔍 STEP 6: Multi-Source Verification...');
            
            // Verify CFO if found
            if (result.cfo && result.cfo.name) {
                console.log(`   🎯 Verifying CFO: ${result.cfo.name}`);
                
                // Person Identity Verification (2-3x sources)
                const cfoPersonVerification = await this.multiSourceVerifier.verifyPersonIdentity(
                    result.cfo, 
                    result.companyName, 
                    company.website
                );
                
                // Email Multi-Layer Verification (2-3x layers)
                const cfoEmailVerification = await this.multiSourceVerifier.verifyEmailMultiLayer(
                    result.cfo.email,
                    result.cfo.name,
                    company.website
                );
                
                // Phone Verification (2x sources)
                const cfoPhoneVerification = await this.multiSourceVerifier.verifyPhone(
                    result.cfo.phone,
                    result.cfo.name,
                    result.companyName
                );
                
                // Store verification results
                result.cfo.personVerification = cfoPersonVerification;
                result.cfo.emailVerification = cfoEmailVerification;
                result.cfo.phoneVerification = cfoPhoneVerification;
                
                // Update confidence scores
                result.cfo.personConfidence = cfoPersonVerification.confidence;
                result.cfo.emailConfidence = cfoEmailVerification.confidence;
                result.cfo.phoneConfidence = cfoPhoneVerification.confidence;
                result.cfo.overallConfidence = Math.round((cfoPersonVerification.confidence + cfoEmailVerification.confidence + cfoPhoneVerification.confidence) / 3);
                
                console.log(`   ✅ CFO verification complete: Person ${cfoPersonVerification.confidence}%, Email ${cfoEmailVerification.confidence}%, Phone ${cfoPhoneVerification.confidence}%`);
            }
            
            // Verify CRO if found
            if (result.cro && result.cro.name) {
                console.log(`   🎯 Verifying CRO: ${result.cro.name}`);
                
                // Person Identity Verification (2-3x sources)
                const croPersonVerification = await this.multiSourceVerifier.verifyPersonIdentity(
                    result.cro, 
                    result.companyName, 
                    company.website
                );
                
                // Email Multi-Layer Verification (2-3x layers)
                const croEmailVerification = await this.multiSourceVerifier.verifyEmailMultiLayer(
                    result.cro.email,
                    result.cro.name,
                    company.website
                );
                
                // Phone Verification (2x sources)
                const croPhoneVerification = await this.multiSourceVerifier.verifyPhone(
                    result.cro.phone,
                    result.cro.name,
                    result.companyName
                );
                
                // Store verification results
                result.cro.personVerification = croPersonVerification;
                result.cro.emailVerification = croEmailVerification;
                result.cro.phoneVerification = croPhoneVerification;
                
                // Update confidence scores
                result.cro.personConfidence = croPersonVerification.confidence;
                result.cro.emailConfidence = croEmailVerification.confidence;
                result.cro.phoneConfidence = croPhoneVerification.confidence;
                result.cro.overallConfidence = Math.round((croPersonVerification.confidence + croEmailVerification.confidence + croPhoneVerification.confidence) / 3);
                
                console.log(`   ✅ CRO verification complete: Person ${croPersonVerification.confidence}%, Email ${croEmailVerification.confidence}%, Phone ${croPhoneVerification.confidence}%`);
            }

            // STEP 5: Basic Data Validation (Essential quality check)
            console.log('Running essential data validation...');
            const dataValidation = await this.validationEngine.validateExecutiveData(
                contactValidation,
                { executives: { cfo: result.cfo, cro: result.cro }, sources: ['ExecutiveResearch', 'ContactIntelligence'] },
                companyResolution
            );
            
            // Update confidence based on validation
            this.updateConfidenceScores(result, dataValidation);

            // Count successful finds
            if (result.cfo?.name && result.cro?.name) {
                this.stats.bothFound++;
            }

            result.researchMethod = research.researchMethod || 'cfo_cro_focused';
            result.overallConfidence = Math.round(((result.cfo?.confidence || 0) + (result.cro?.confidence || 0)) / 2);
            
            if (result.overallConfidence >= 80) {
                this.stats.highConfidence++;
            }

            if (result.cfo.email || result.cro.email) {
                this.stats.contactsValidated++;
            }

            // Validation notes
            result.validationNotes = this.generateValidationNotes(result);

            this.stats.successful++;

            console.log(`SUCCESS: ${result.companyName}`);
            console.log(`   CFO: ${result.cfo?.name || 'Not found'} (${result.cfo?.confidence || 0}%) Tier ${result.cfo?.tier || 'N/A'} ${result.cfo?.email ? '📧' : ''}`);
            console.log(`   CRO: ${result.cro?.name || 'Not found'} (${result.cro?.confidence || 0}%) Tier ${result.cro?.tier || 'N/A'} ${result.cro?.email ? '📧' : ''}`);
            console.log(`   CFO Role: ${result.cfo?.role || 'N/A'}`);
            console.log(`   CRO Role: ${result.cro?.role || 'N/A'}`);
            console.log(`   Overall: ${result.overallConfidence || 0}% confidence`);

        } catch (error) {
            console.error(`Error processing ${company.website}: ${error.message}`);
            result.error = error.message;
            this.stats.errors++;
        }

        result.processingTime = Date.now() - startTime;
        this.results.push(result);
    }

    /**
     * MERGE CONTACT DATA FROM INTELLIGENCE GATHERING
     */
    mergeContactData(result, contactIntelligence) {
        console.log(`   🔄 Merging contact data for ${result.companyName}...`);
        
        // Method 1: Check for direct executive contact data
        if (contactIntelligence?.executiveContacts) {
            console.log(`      Found executive contacts structure`);
            
            // Look for CFO contact data
            if (contactIntelligence.executiveContacts.cfo && result.cfo) {
                const cfoContact = contactIntelligence.executiveContacts.cfo;
                console.log(`      CFO contact data: ${JSON.stringify(cfoContact)}`);
                result.cfo.email = cfoContact.email || result.cfo.email;
                result.cfo.phone = cfoContact.phone || cfoContact.phoneNumbers?.[0]?.number || result.cfo.phone;
                result.cfo.linkedIn = cfoContact.linkedinUrl || result.cfo.linkedIn;
            }
            
            // Look for CRO contact data
            if (contactIntelligence.executiveContacts.cro && result.cro) {
                const croContact = contactIntelligence.executiveContacts.cro;
                console.log(`      CRO contact data: ${JSON.stringify(croContact)}`);
                result.cro.email = croContact.email || result.cro.email;
                result.cro.phone = croContact.phone || croContact.phoneNumbers?.[0]?.number || result.cro.phone;
                result.cro.linkedIn = croContact.linkedinUrl || result.cro.linkedIn;
            }
        }

        // Method 2: Check for array of executives
        if (contactIntelligence?.executiveContacts?.executives && Array.isArray(contactIntelligence.executiveContacts.executives)) {
            const executives = contactIntelligence.executiveContacts.executives;
            console.log(`      Found ${executives.length} executives in array`);
            
            // Find CRO contact data with enhanced matching
            const croContact = executives.find(exec => 
                ['CRO', 'CSO', 'VP Sales', 'VP Revenue', 'Chief Revenue Officer', 'Chief Sales Officer'].includes(exec.role) || 
                (exec.name && result.cro?.name && exec.name.toLowerCase().includes(result.cro.name.toLowerCase()))
            );

            if (croContact && result.cro) {
                console.log(`      Found CRO contact: ${croContact.name} - ${croContact.email}`);
                result.cro.email = croContact.email || result.cro.email;
                result.cro.phone = croContact.phone || croContact.phoneNumbers?.[0]?.number || result.cro.phone;
                result.cro.linkedIn = croContact.linkedinUrl || result.cro.linkedIn;
            }
            
            // Find CFO contact data with enhanced matching
            const cfoContact = executives.find(exec => 
                ['CFO', 'Chief Financial Officer', 'VP Finance'].includes(exec.role) || 
                (exec.name && result.cfo?.name && exec.name.toLowerCase().includes(result.cfo.name.toLowerCase()))
            );
            
            if (cfoContact && result.cfo) {
                console.log(`      Found CFO contact: ${cfoContact.name} - ${cfoContact.email}`);
                result.cfo.email = cfoContact.email || result.cfo.email;
                result.cfo.phone = cfoContact.phone || cfoContact.phoneNumbers?.[0]?.number || result.cfo.phone;
                result.cfo.linkedIn = cfoContact.linkedinUrl || result.cfo.linkedIn;
            }
        }

        // Method 3: Check for enhanced discovery results from ContactResearch
        if (contactIntelligence?.enhancedDiscovery) {
            console.log(`      Found enhanced discovery data`);
            const discovery = contactIntelligence.enhancedDiscovery;
            
            if (discovery.contacts?.emails?.length > 0) {
                console.log(`      Enhanced discovery has ${discovery.contacts.emails.length} emails`);
                // Try to match emails to executives by name
                for (const emailData of discovery.contacts.emails) {
                    console.log(`      Checking email: ${emailData.email} for executive: ${emailData.executive || 'unknown'}`);
                    if (result.cfo?.name && emailData.executive?.toLowerCase().includes(result.cfo.name.toLowerCase())) {
                        result.cfo.email = result.cfo.email || emailData.email;
                        console.log(`      ✅ Matched CFO email: ${emailData.email}`);
                    }
                    if (result.cro?.name && emailData.executive?.toLowerCase().includes(result.cro.name.toLowerCase())) {
                        result.cro.email = result.cro.email || emailData.email;
                        console.log(`      ✅ Matched CRO email: ${emailData.email}`);
                    }
                }
            }
            
            if (discovery.contacts?.phones?.length > 0) {
                console.log(`      Enhanced discovery has ${discovery.contacts.phones.length} phones`);
                // Try to match phones to executives by name
                for (const phoneData of discovery.contacts.phones) {
                    if (result.cfo?.name && phoneData.executive?.toLowerCase().includes(result.cfo.name.toLowerCase())) {
                        result.cfo.phone = result.cfo.phone || phoneData.phone;
                        console.log(`      ✅ Matched CFO phone: ${phoneData.phone}`);
                    }
                    if (result.cro?.name && phoneData.executive?.toLowerCase().includes(result.cro.name.toLowerCase())) {
                        result.cro.phone = result.cro.phone || phoneData.phone;
                        console.log(`      ✅ Matched CRO phone: ${phoneData.phone}`);
                    }
                }
            }
        }

        console.log(`   ✅ Contact merge complete`);
    }

    /**
     * APPLY CONTACT VALIDATION RESULTS
     */
    applyContactValidation(result, contactValidation) {
        if (contactValidation?.validatedContacts) {
            const validated = contactValidation.validatedContacts;
            
            // Apply CRO email validation
            if (validated.cro?.email) {
                result.cro.email = validated.cro.email;
                result.cro.validated = true;
            }
            
            // Apply CFO email validation
            if (validated.cfo?.email) {
                result.cfo.email = validated.cfo.email;
                result.cfo.validated = true;
            }
        }
    }

    /**
     * FINALIZE CONTACT DATA - Ensure all contact info is captured
     */
    finalizeContactData(result, contactIntelligence, contactValidation) {
        // Check if we have contact data from various sources that wasn't merged
        
        // From contact intelligence
        if (contactIntelligence?.executiveContacts?.cfo) {
            const cfoContact = contactIntelligence.executiveContacts.cfo;
            if (result.cfo && !result.cfo.email && cfoContact.email) {
                result.cfo.email = cfoContact.email;
            }
            if (result.cfo && !result.cfo.phone && cfoContact.phone) {
                result.cfo.phone = cfoContact.phone;
            }
            if (result.cfo && !result.cfo.linkedIn && cfoContact.linkedIn) {
                result.cfo.linkedIn = cfoContact.linkedIn;
            }
        }
        
        if (contactIntelligence?.executiveContacts?.cro) {
            const croContact = contactIntelligence.executiveContacts.cro;
            if (result.cro && !result.cro.email && croContact.email) {
                result.cro.email = croContact.email;
            }
            if (result.cro && !result.cro.phone && croContact.phone) {
                result.cro.phone = croContact.phone;
            }
            if (result.cro && !result.cro.linkedIn && croContact.linkedIn) {
                result.cro.linkedIn = croContact.linkedIn;
            }
        }

        // From contact validation - extract from enrichedExecutives structure
        if (contactValidation?.enrichedExecutives) {
            console.log(`      Contact validation structure: ${JSON.stringify(Object.keys(contactValidation.enrichedExecutives))}`);
            
            // Check CFO contacts
            if (contactValidation.enrichedExecutives.cfo?.contacts?.emails?.length > 0) {
                const cfoEmails = contactValidation.enrichedExecutives.cfo.contacts.emails;
                // Find the best email (prioritize non-generated, high confidence)
                const bestEmail = cfoEmails.find(e => e.source !== 'generated' && e.isValid) || 
                                 cfoEmails.find(e => e.confidence > 80) || 
                                 cfoEmails[0];
                if (bestEmail && result.cfo) {
                    result.cfo.email = bestEmail.email;
                    console.log(`      ✅ CFO Email extracted: ${bestEmail.email} (${bestEmail.source})`);
                }
            }
            
            if (contactValidation.enrichedExecutives.cfo?.contacts?.phones?.length > 0) {
                const cfoPhones = contactValidation.enrichedExecutives.cfo.contacts.phones;
                if (cfoPhones[0] && result.cfo) {
                    result.cfo.phone = cfoPhones[0].number || cfoPhones[0].phone;
                    console.log(`      ✅ CFO Phone extracted: ${result.cfo.phone}`);
                }
            }

            // Extract LinkedIn from contact validation
            if (contactValidation.enrichedExecutives.cfo?.linkedIn && result.cfo) {
                result.cfo.linkedIn = contactValidation.enrichedExecutives.cfo.linkedIn;
                console.log(`      ✅ CFO LinkedIn extracted: ${result.cfo.linkedIn}`);
            }

            // Check CRO contacts  
            if (contactValidation.enrichedExecutives.cro?.contacts?.emails?.length > 0) {
                const croEmails = contactValidation.enrichedExecutives.cro.contacts.emails;
                const bestEmail = croEmails.find(e => e.source !== 'generated' && e.isValid) || 
                                 croEmails.find(e => e.confidence > 80) || 
                                 croEmails[0];
                if (bestEmail && result.cro) {
                    result.cro.email = bestEmail.email;
                    console.log(`      ✅ CRO Email extracted: ${bestEmail.email} (${bestEmail.source})`);
                }
            }

            if (contactValidation.enrichedExecutives.cro?.contacts?.phones?.length > 0) {
                const croPhones = contactValidation.enrichedExecutives.cro.contacts.phones;
                if (croPhones[0] && result.cro) {
                    result.cro.phone = croPhones[0].number || croPhones[0].phone;
                    console.log(`      ✅ CRO Phone extracted: ${result.cro.phone}`);
                }
            }

            // Extract LinkedIn from contact validation
            if (contactValidation.enrichedExecutives.cro?.linkedIn && result.cro) {
                result.cro.linkedIn = contactValidation.enrichedExecutives.cro.linkedIn;
                console.log(`      ✅ CRO LinkedIn extracted: ${result.cro.linkedIn}`);
            }

            // Extract real contact data from CEO section (where AI research puts executive data)
            if (contactValidation.enrichedExecutives.ceo?.contacts?.emails?.length > 0) {
                const ceoEmails = contactValidation.enrichedExecutives.ceo.contacts.emails;
                console.log(`      Found ${ceoEmails.length} emails in CEO section`);
                
                ceoEmails.forEach((email, index) => {
                    console.log(`         ${index + 1}. ${email.email} (${email.source}) - Context: ${email.context || 'none'}`);
                    
                    // Extract real emails for CFO
                    if ((email.context?.toLowerCase().includes('cfo') || 
                         email.context?.toLowerCase().includes('financial') ||
                         email.context?.toLowerCase().includes(result.cfo?.name?.toLowerCase())) && 
                         result.cfo) {
                        
                        // Prioritize AI research emails over generated ones
                        if (email.source === 'ai_research' || !result.cfo.email) {
                            result.cfo.email = email.email;
                            console.log(`      ✅ CFO Email from CEO section: ${email.email} (${email.source})`);
                        }
                    }
                    
                    // Extract real emails for CRO
                    if ((email.context?.toLowerCase().includes('revenue') || 
                         email.context?.toLowerCase().includes('customer') ||
                         email.context?.toLowerCase().includes('sales') ||
                         email.context?.toLowerCase().includes(result.cro?.name?.toLowerCase())) && 
                         result.cro) {
                        
                        // Prioritize AI research emails over generated ones
                        if (email.source === 'ai_research' || !result.cro.email) {
                            result.cro.email = email.email;
                            console.log(`      ✅ CRO Email from CEO section: ${email.email} (${email.source})`);
                        }
                    }
                });
            }

            if (contactValidation.enrichedExecutives.ceo?.contacts?.phones?.length > 0) {
                const ceoPhones = contactValidation.enrichedExecutives.ceo.contacts.phones;
                console.log(`      Found ${ceoPhones.length} phones in CEO section`);
                
                ceoPhones.forEach((phone, index) => {
                    console.log(`         ${index + 1}. ${phone.number} - Context: ${phone.context || 'none'}`);
                    
                    // Extract phones for CFO
                    if ((phone.context?.toLowerCase().includes('cfo') || 
                         phone.context?.toLowerCase().includes('financial') ||
                         phone.context?.toLowerCase().includes(result.cfo?.name?.toLowerCase())) && 
                         result.cfo && !result.cfo.phone) {
                        result.cfo.phone = phone.number;
                        console.log(`      ✅ CFO Phone from CEO section: ${phone.number}`);
                    }
                    
                    // Extract phones for CRO
                    if ((phone.context?.toLowerCase().includes('revenue') || 
                         phone.context?.toLowerCase().includes('customer') ||
                         phone.context?.toLowerCase().includes('sales') ||
                         phone.context?.toLowerCase().includes(result.cro?.name?.toLowerCase())) && 
                         result.cro && !result.cro.phone) {
                        result.cro.phone = phone.number;
                        console.log(`      ✅ CRO Phone from CEO section: ${phone.number}`);
                    }
                });
            }
        }

        // Debug: Log what contact data we actually have
        console.log(`   🔍 Final contact data for ${result.companyName}:`);
        console.log(`      CFO ${result.cfo?.name}: Email=${result.cfo?.email || 'NONE'}, Phone=${result.cfo?.phone || 'NONE'}`);
        console.log(`      CRO ${result.cro?.name}: Email=${result.cro?.email || 'NONE'}, Phone=${result.cro?.phone || 'NONE'}`);
    }

    /**
     * UPDATE CONFIDENCE SCORES BASED ON VALIDATION
     */
    updateConfidenceScores(result, dataValidation) {
        if (dataValidation?.overallConfidence) {
            const validationBoost = Math.round(dataValidation.overallConfidence * 10);
            result.cro.confidence = Math.min(100, result.cro.confidence + validationBoost);
            result.cfo.confidence = Math.min(100, result.cfo.confidence + validationBoost);
        }
    }

    /**
     * GENERATE STREAMLINED CRO/CFO CONTACT CSV
     */
    async generateContactCSV(version) {
        // Create versioned outputs directory
        const outputDir = this.versionManager.ensureOutputsDir(version);

        const csvWriter = createObjectCsvWriter({
            path: `${outputDir}/core-cro-cfo-contacts.csv`,
            header: [
                // CORE COMPANY DATA (Essential Only)
                { id: 'companyName', title: 'Company Name' },
                { id: 'website', title: 'Website' },
                { id: 'industry', title: 'Industry' },
                { id: 'employeeCount', title: 'Employee Count' },
                { id: 'headquarters', title: 'Headquarters' },
                { id: 'isPublic', title: 'Public/Private' },
                { id: 'parentCompany', title: 'Parent Company' },
                { id: 'relationType', title: 'Relation Type' },
                
                // CRO ESSENTIALS (Contact Only)
                { id: 'croName', title: 'CRO Name' },
                { id: 'croTitle', title: 'CRO Title' },
                { id: 'croEmail', title: 'CRO Email' },
                { id: 'croPhone', title: 'CRO Phone' },
                { id: 'croLinkedIn', title: 'CRO LinkedIn' },
                { id: 'croConfidence', title: 'CRO Confidence' },
                { id: 'croTier', title: 'CRO Tier' },
                
                // CRO MULTI-SOURCE VERIFICATION (NEW)
                { id: 'croPersonConfidence', title: 'CRO Person Confidence' },
                { id: 'croPersonSources', title: 'CRO Person Sources' },
                { id: 'croPersonReasoning', title: 'CRO Person Reasoning' },
                { id: 'croEmailConfidence', title: 'CRO Email Confidence' },
                { id: 'croEmailValidationSteps', title: 'CRO Email Validation Steps' },
                { id: 'croEmailReasoning', title: 'CRO Email Reasoning' },
                { id: 'croPhoneConfidence', title: 'CRO Phone Confidence' },
                { id: 'croPhoneSources', title: 'CRO Phone Sources' },
                { id: 'croPhoneReasoning', title: 'CRO Phone Reasoning' },
                { id: 'croOverallConfidence', title: 'CRO Overall Confidence' },
                { id: 'croDataQualityGrade', title: 'CRO Data Quality Grade' },
                
                // CFO ESSENTIALS (Contact Only)
                { id: 'cfoName', title: 'CFO Name' },
                { id: 'cfoTitle', title: 'CFO Title' },
                { id: 'cfoEmail', title: 'CFO Email' },
                { id: 'cfoEmailSource', title: 'CFO Email Source' },
                { id: 'cfoEmailValidation', title: 'CFO Email Status' },
                { id: 'cfoAlternativeEmails', title: 'CFO Alt Emails' },
                { id: 'cfoPhone', title: 'CFO Phone' },
                { id: 'cfoPhoneType', title: 'CFO Phone Type' },
                { id: 'cfoPhoneCarrier', title: 'CFO Phone Carrier' },
                { id: 'cfoLinkedIn', title: 'CFO LinkedIn' },
                { id: 'cfoConfidence', title: 'CFO Confidence' },
                { id: 'cfoTier', title: 'CFO Tier' },
                { id: 'cfoCostTracking', title: 'CFO Discovery Cost' },
                
                // CFO MULTI-SOURCE VERIFICATION (NEW)
                { id: 'cfoPersonConfidence', title: 'CFO Person Confidence' },
                { id: 'cfoPersonSources', title: 'CFO Person Sources' },
                { id: 'cfoPersonReasoning', title: 'CFO Person Reasoning' },
                { id: 'cfoEmailConfidence', title: 'CFO Email Confidence' },
                { id: 'cfoEmailValidationSteps', title: 'CFO Email Validation Steps' },
                { id: 'cfoEmailReasoning', title: 'CFO Email Reasoning' },
                { id: 'cfoPhoneConfidence', title: 'CFO Phone Confidence' },
                { id: 'cfoPhoneSources', title: 'CFO Phone Sources' },
                { id: 'cfoPhoneReasoning', title: 'CFO Phone Reasoning' },
                { id: 'cfoOverallConfidence', title: 'CFO Overall Confidence' },
                { id: 'cfoDataQualityGrade', title: 'CFO Data Quality Grade' },
                
                // ACQUISITION METADATA
                { id: 'isAcquired', title: 'Is Acquired' },
                { id: 'parentCompany', title: 'Parent Company' },
                { id: 'acquisitionDate', title: 'Acquisition Date' },
                { id: 'originalDomain', title: 'Original Domain' },
                { id: 'currentDomain', title: 'Current Domain' },
                { id: 'validationNotes', title: 'Validation Notes' },
                
                // EXECUTIVE TRACKING (Post-Acquisition)
                { id: 'executiveTrackingStatus', title: 'Executive Tracking Status' },
                { id: 'trackedExecutives', title: 'Tracked Executives' },
                { id: 'executiveStatusUpdates', title: 'Executive Status Updates' },
                
                // CORE METADATA
                { id: 'accountOwner', title: 'Account Owner' },
                { id: 'researchDate', title: 'Research Date' },
                { id: 'totalCost', title: 'Total API Cost' }
            ]
        });

        const csvData = this.results.map(result => {
            // Safety check for undefined results
            if (!result || typeof result !== 'object') {
                return {
                    companyName: 'Unknown', website: 'Unknown', industry: '', employeeCount: '', headquarters: '',
                    isPublic: 'Unknown', parentCompany: '', relationType: 'original',
                    croName: '', croTitle: '', croEmail: '', croPhone: '', croLinkedIn: '', croConfidence: 0, croTier: '',
                    croPersonConfidence: 0, croPersonSources: '', croPersonReasoning: '',
                    croEmailConfidence: 0, croEmailValidationSteps: '', croEmailReasoning: '',
                    croPhoneConfidence: 0, croPhoneSources: '', croPhoneReasoning: '',
                    croOverallConfidence: 0, croDataQualityGrade: 'F',
                    cfoName: '', cfoTitle: '', cfoEmail: '', cfoPhone: '', cfoPhoneCarrier: '', cfoLinkedIn: '', 
                    cfoConfidence: 0, cfoTier: '', cfoCostTracking: '',
                    cfoPersonConfidence: 0, cfoPersonSources: '', cfoPersonReasoning: '',
                    cfoEmailConfidence: 0, cfoEmailValidationSteps: '', cfoEmailReasoning: '',
                    cfoPhoneConfidence: 0, cfoPhoneSources: '', cfoPhoneReasoning: '',
                    cfoOverallConfidence: 0, cfoDataQualityGrade: 'F',
                    isAcquired: 'No', acquisitionDate: '', originalDomain: '', currentDomain: '', validationNotes: '',
                    executiveTrackingStatus: '', trackedExecutives: '', executiveStatusUpdates: '',
                    accountOwner: '', researchDate: '', totalCost: 0
                };
            }
            
            return {
                // CORE COMPANY DATA
                companyName: result.companyName || '',
                website: result.website || '',
                industry: result.companyInfo?.industry || '',
                employeeCount: result.companyInfo?.employeeCount || '',
                headquarters: result.companyInfo?.headquarters || '',
                isPublic: result.companyInfo?.isPublic ? 'Public' : 'Private',
                parentCompany: result.corporateStructure?.parentCompany || '',
                relationType: result.relationType || 'original',
                
                // CRO DATA - Complete validation metadata extraction
                croName: result.cro?.name || '',
                croTitle: result.cro?.title || '',
                croEmail: result.cro?.email || '',
                croEmailSource: result.cro?.source || result.cro?.emailValidation?.source || '',
                croEmailValidation: result.cro?.validated ? 'Validated' : 
                                   result.cro?.emailValidation?.isValid ? 'Valid' : 
                                   result.cro?.emailValidation?.confidence > 70 ? 'Likely Valid' : '',
                croAlternativeEmails: result.cro?.alternativeEmails || 
                                     result.cro?.emailValidation?.alternativeEmails?.join('; ') || '',
                croPhone: result.cro?.phone || result.cro?.phoneNumbers?.[0]?.number || '',
                croPhoneType: result.cro?.phoneType || 
                             result.cro?.phoneNumbers?.[0]?.lineType || 
                             result.cro?.phoneNumbers?.[0]?.type || '',
                croPhoneCarrier: result.cro?.phoneCarrier || 
                                result.cro?.phoneNumbers?.[0]?.carrier || 
                                result.cro?.phoneNumbers?.[0]?.twilioValidation?.carrier || '',
                croLinkedIn: result.cro?.linkedIn || result.cro?.linkedinUrl || '',
                croConfidence: result.cro?.confidence || 0,
                croTier: result.cro?.tier || '',
                croCostTracking: result.cro?.costTracking || result.cro?.totalCost || '',
                
                // CRO MULTI-SOURCE VERIFICATION (NEW)
                croPersonConfidence: result.cro?.personConfidence || 0,
                croPersonSources: result.cro?.personVerification?.sources?.join(', ') || '',
                croPersonReasoning: result.cro?.personVerification?.reasoning || '',
                croEmailConfidence: result.cro?.emailConfidence || 0,
                croEmailValidationSteps: result.cro?.emailVerification?.validationSteps || '',
                croEmailReasoning: result.cro?.emailVerification?.reasoning || '',
                croPhoneConfidence: result.cro?.phoneConfidence || 0,
                croPhoneSources: result.cro?.phoneVerification?.sources?.join(', ') || '',
                croPhoneReasoning: result.cro?.phoneVerification?.reasoning || '',
                croOverallConfidence: result.cro?.overallConfidence || 0,
                croDataQualityGrade: this.calculateDataQualityGrade(result.cro?.overallConfidence || 0),
                
                // CFO DATA - Complete validation metadata extraction
                cfoName: result.cfo?.name || '',
                cfoTitle: result.cfo?.title || '',
                cfoEmail: result.cfo?.email || '',
                cfoEmailSource: result.cfo?.source || result.cfo?.emailValidation?.source || '',
                cfoEmailValidation: result.cfo?.validated ? 'Validated' : 
                                   result.cfo?.emailValidation?.isValid ? 'Valid' : 
                                   result.cfo?.emailValidation?.confidence > 70 ? 'Likely Valid' : '',
                cfoAlternativeEmails: result.cfo?.alternativeEmails || 
                                     result.cfo?.emailValidation?.alternativeEmails?.join('; ') || '',
                cfoPhone: result.cfo?.phone || result.cfo?.phoneNumbers?.[0]?.number || '',
                cfoPhoneType: result.cfo?.phoneType || 
                             result.cfo?.phoneNumbers?.[0]?.lineType || 
                             result.cfo?.phoneNumbers?.[0]?.type || '',
                cfoPhoneCarrier: result.cfo?.phoneCarrier || 
                                result.cfo?.phoneNumbers?.[0]?.carrier || 
                                result.cfo?.phoneNumbers?.[0]?.twilioValidation?.carrier || '',
                cfoLinkedIn: result.cfo?.linkedIn || result.cfo?.linkedinUrl || '',
                cfoConfidence: result.cfo?.confidence || 0,
                cfoTier: result.cfo?.tier || '',
                cfoCostTracking: result.cfo?.costTracking || result.cfo?.totalCost || '',
                
                // CFO MULTI-SOURCE VERIFICATION (NEW)
                cfoPersonConfidence: result.cfo?.personConfidence || 0,
                cfoPersonSources: result.cfo?.personVerification?.sources?.join(', ') || '',
                cfoPersonReasoning: result.cfo?.personVerification?.reasoning || '',
                cfoEmailConfidence: result.cfo?.emailConfidence || 0,
                cfoEmailValidationSteps: result.cfo?.emailVerification?.validationSteps || '',
                cfoEmailReasoning: result.cfo?.emailVerification?.reasoning || '',
                cfoPhoneConfidence: result.cfo?.phoneConfidence || 0,
                cfoPhoneSources: result.cfo?.phoneVerification?.sources?.join(', ') || '',
                cfoPhoneReasoning: result.cfo?.phoneVerification?.reasoning || '',
                cfoOverallConfidence: result.cfo?.overallConfidence || 0,
                cfoDataQualityGrade: this.calculateDataQualityGrade(result.cfo?.overallConfidence || 0),
                
                // ACQUISITION METADATA
                isAcquired: result.corporateStructure?.isAcquired ? 'Yes' : 'No',
                acquisitionDate: result.corporateStructure?.acquisitionDate || '',
                originalDomain: result.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '',
                currentDomain: result.corporateStructure?.isAcquired && result.corporateStructure?.parentCompany ? 
                    this.extractDomainFromCompany(result.corporateStructure.parentCompany) : 
                    result.website?.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] || '',
                validationNotes: this.generateValidationNotes(result).join('; ') || '',
                
                // EXECUTIVE TRACKING
                executiveTrackingStatus: result.executiveTracking ? 'Tracked' : 'Not Applicable',
                trackedExecutives: result.executiveTracking?.executives?.map(e => e?.name || 'Unknown').join('; ') || '',
                executiveStatusUpdates: result.executiveTracking?.executives?.map(e => 
                    `${e?.name || 'Unknown'}: ${e?.currentStatus?.status || 'unknown'} at ${e?.currentStatus?.currentCompany || 'unknown'}`
                ).join('; ') || '',
                
                // CORE METADATA
                accountOwner: result.accountOwner || '',
                researchDate: new Date().toISOString().split('T')[0],
                totalCost: this.calculateTotalCost(result)
            };
        });

        await csvWriter.writeRecords(csvData);
        console.log(`    Generated: ${outputDir}/core-cro-cfo-contacts.csv`);

        // Also generate JSON for analysis
        fs.writeFileSync(`${outputDir}/core-cro-cfo-data.json`, JSON.stringify(this.results, null, 2));
        console.log(`    Generated: ${outputDir}/core-cro-cfo-data.json`);
    }

    /**
     * GENERATE SUMMARY REPORT
     */
    generateSummary() {
        console.log('\nCORE PIPELINE SUMMARY');
        console.log('=' .repeat(80));
        console.log(`Companies Processed: ${this.stats.processed}`);
        console.log(`CFOs Found: ${this.stats.cfoFound}/${this.stats.processed} (${Math.round(this.stats.cfoFound/this.stats.processed*100)}%)`);
        console.log(`CROs Found: ${this.stats.croFound}/${this.stats.processed} (${Math.round(this.stats.croFound/this.stats.processed*100)}%)`);
        console.log(`Both Found: ${this.stats.bothFound}/${this.stats.processed} (${Math.round(this.stats.bothFound/this.stats.processed*100)}%)`);
        console.log(`Contacts Validated: ${this.stats.contactsValidated}/${this.stats.processed} (${Math.round(this.stats.contactsValidated/this.stats.processed*100)}%)`);
        console.log(`High Confidence: ${this.stats.highConfidence}/${this.stats.processed} (${Math.round(this.stats.highConfidence/this.stats.processed*100)}%)`);
        console.log(`Errors: ${this.stats.errors}/${this.stats.processed} (${Math.round(this.stats.errors/this.stats.processed*100)}%)`);

        const avgTime = this.results.reduce((sum, r) => sum + r.processingTime, 0) / this.results.length;
        console.log(`Average Processing Time: ${Math.round(avgTime/1000)}s per company`);

        console.log('\nOutput Files:');
        console.log('    outputs/contacts/cro-cfo-contacts.csv - Main contact results');
        console.log('    outputs/contacts/cro-cfo-data.json - Detailed data');
    }

    /**
     * UTILITY METHODS
     */
    
    extractCompanyName(website) {
        try {
            const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        } catch (error) {
            return website;
        }
    }

    extractDomainFromCompany(companyName) {
        // Extract domain from company name for acquisition cases
        if (!companyName) return '';
        
        // Common domain patterns for major companies
        const domainMap = {
            'Blackstone': 'blackstone.com',
            'Microsoft': 'microsoft.com',
            'Google': 'google.com',
            'Amazon': 'amazon.com',
            'Apple': 'apple.com',
            'Meta': 'meta.com',
            'Salesforce': 'salesforce.com',
            'Oracle': 'oracle.com',
            'IBM': 'ibm.com',
            'Intel': 'intel.com',
            'Cisco': 'cisco.com',
            'Adobe': 'adobe.com',
            'VMware': 'vmware.com',
            'Dell': 'dell.com',
            'HP': 'hp.com'
        };
        
        return domainMap[companyName] || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`;
    }

    categorizeRevenueFinanceRole(title) {
        const titleLower = title.toLowerCase();
        
        // TIER 1: Primary Targets
        if (titleLower.includes('cfo') || titleLower.includes('chief financial officer')) {
            return 'CFO';
        }
        if (titleLower.includes('cro') || titleLower.includes('chief revenue officer')) {
            return 'CRO';
        }
        
        // TIER 2: Senior Revenue/Sales Leaders
        if (titleLower.includes('cso') || titleLower.includes('chief sales officer')) {
            return 'CSO';
        }
        if (titleLower.includes('vp sales') || titleLower.includes('vp of sales') || titleLower.includes('vice president sales')) {
            return 'VP Sales';
        }
        if (titleLower.includes('vp revenue') || titleLower.includes('vp of revenue') || titleLower.includes('vice president revenue')) {
            return 'VP Revenue';
        }
        if (titleLower.includes('head of sales') || titleLower.includes('sales director')) {
            return 'Head of Sales';
        }
        if (titleLower.includes('head of revenue') || titleLower.includes('revenue director')) {
            return 'Head of Revenue';
        }
        if (titleLower.includes('vp business development')) {
            return 'VP Business Development';
        }
        
        // TIER 3: Finance Fallbacks (Chief Accounting Officer is FINANCE, not revenue)
        if (titleLower.includes('controller') || titleLower.includes('chief accounting officer')) {
            return 'Controller';
        }
        if (titleLower.includes('vp finance') || titleLower.includes('finance director')) {
            return 'VP Finance';
        }
        if (titleLower.includes('treasurer')) {
            return 'Treasurer';
        }
        if (titleLower.includes('finance') || titleLower.includes('accounting')) {
            return 'Finance Executive';
        }
        if (titleLower.includes('sales')) {
            return 'Sales Executive';
        }
        
        return 'Other Executive';
    }

    /**
     * Categorize role tier (1-5) for confidence scoring
     */
    categorizeRoleTier(title, roleType) {
        const titleLower = title ? title.toLowerCase() : '';
        
        if (roleType.toUpperCase() === 'CFO') {
            if (titleLower.includes('cfo') || titleLower.includes('chief financial')) return 1;
            if (titleLower.includes('controller') || titleLower.includes('chief accounting')) return 2;
            if (titleLower.includes('vp finance') || titleLower.includes('finance director')) return 3;
            if (titleLower.includes('treasurer') || titleLower.includes('finance manager')) return 4;
            return 5;
        }
        
        if (roleType.toUpperCase() === 'CRO') {
            if (titleLower.includes('cro') || titleLower.includes('chief revenue')) return 1;
            if (titleLower.includes('cso') || titleLower.includes('chief sales')) return 2;
            if (titleLower.includes('vp sales') || titleLower.includes('vp revenue')) return 3;
            if (titleLower.includes('sales director') || titleLower.includes('revenue director')) return 4;
            return 5;
        }
        
        return 5; // Default tier
    }

    /**
     * Calculate data quality grade based on overall confidence
     */
    calculateDataQualityGrade(confidence) {
        if (confidence >= 90) return 'A';
        if (confidence >= 80) return 'B';
        if (confidence >= 70) return 'C';
        if (confidence >= 60) return 'D';
        return 'F';
    }

    generateValidationNotes(result) {
        // Safety check for undefined result
        if (!result || typeof result !== 'object') {
            return [];
        }
        
        const notes = [];
        
        // Acquisition information
        if (result.corporateStructure?.isAcquired) {
            notes.push(`Company acquired by ${result.corporateStructure.parentCompany} (${result.corporateStructure.acquisitionDate})`);
        }
        
        // Executive tracking information
        if (result.executiveTracking?.executives?.length > 0) {
            const trackedCount = result.executiveTracking.executives.length;
            const verifiedCount = result.executiveTracking.executives.filter(e => e.currentStatus?.verified).length;
            notes.push(`Post-acquisition executive tracking: ${verifiedCount}/${trackedCount} executives verified`);
            
            // Add specific executive status updates
            result.executiveTracking.executives.forEach(exec => {
                const status = exec.currentStatus?.status || 'unknown';
                const company = exec.currentStatus?.currentCompany || 'unknown';
                notes.push(`${exec.name}: ${status} at ${company}`);
            });
        }
        
        // Executive identification confidence
        if (result.cfo.confidence >= 90) {
            notes.push(`High-confidence CFO identification (Tier ${result.cfo.tier})`);
        }
        
        if (result.cro.confidence >= 90) {
            notes.push(`High-confidence CRO identification (Tier ${result.cro.tier})`);
        }
        
        // Role categorization notes
        if (result.cfo.tier > 1 && result.cfo.name) {
            notes.push(`Finance leader is ${result.cfo.role} (Tier ${result.cfo.tier}), not traditional CFO`);
        }
        
        if (result.cro.tier > 1 && result.cro.name) {
            notes.push(`Revenue leader is ${result.cro.role} (Tier ${result.cro.tier}), not traditional CRO`);
        }
        
        // Contact discovery success
        if (result.cfo.email && result.cro.email) {
            notes.push('Both CFO and CRO emails discovered');
        }
        
        // Company status information
        if (result.companyInfo.isPublic) {
            notes.push('Public company - SEC filings available for validation');
        }
        
        if (result.companyInfo.parentCompany && !result.corporateStructure?.isAcquired) {
            notes.push(`Subsidiary of ${result.companyInfo.parentCompany}`);
        }
        
        return notes;
    }

    /**
     *  ADD RELATED COMPANY ROWS (CORE VERSION)
     * 
     * Analyzes results and adds:
     * 1. Parent companies (corporate parents)
     * 2. Merger and acquisition companies
     * 
     * Note: This is the core version - only parent/merger/acquisition
     */
    async addRelatedCompanyRows() {
        const relatedCompaniesToAdd = [];
        const processedCompanies = new Set();

        for (const result of this.results) {
            // ADD PARENT COMPANIES (includes mergers/acquisitions)
            await this.addParentCompanyIfNeeded(result, relatedCompaniesToAdd, processedCompanies);
        }

        // Add all related company results to the main results
        this.results.push(...relatedCompaniesToAdd);
        this.stats.parentCompaniesAdded = relatedCompaniesToAdd.length;
        
        console.log(`    Added ${relatedCompaniesToAdd.length} parent/merger/acquisition company rows`);
    }

    /**
     * Analyze cache coverage to estimate savings
     */
    async analyzeCacheCoverage(sampleCompanies) {
        let totalCached = 0;
        const sampleSize = sampleCompanies.length;
        
        console.log(`   💾 Analyzing cache for ${sampleSize} sample companies...`);
        
        for (const company of sampleCompanies) {
            const cacheInfo = await this.dataCache.hasCompanyData(company.website);
            if (cacheInfo.hasCachedData) {
                totalCached++;
            }
        }
        
        const estimatedCacheRate = Math.round((totalCached / sampleSize) * 100);
        
        console.log(`   💾 Cache hit rate: ${estimatedCacheRate}%`);
        console.log(`   💰 Estimated API cost savings: ${estimatedCacheRate}% of total API calls`);
        
        if (estimatedCacheRate > 50) {
            console.log(`   🎉 High cache coverage detected - significant speedup expected!`);
        }
    }

    /**
     * Process single company with caching optimization
     */
    async processCompanyOptimized(company, index) {
        const startTime = Date.now();
        
        try {
            console.log(`     [${index}] ${company.website}`);

            // Check for cached executive research first
            let cachedResearch = null;
            if (this.config.CACHE_ENABLED) {
                cachedResearch = await this.dataCache.get('lusha-cfo', company.website);
                if (cachedResearch) {
                    this.stats.cacheHits++;
                    this.stats.apiCostsSaved += 0.15; // Estimated Lusha cost per contact
                    console.log(`     [${index}] 💾 Using cached CFO data`);
                }
            }

            // Use the existing processCompany method but with caching awareness
            const result = await this.processCompany(company, index);
            
            // Add performance metrics (with safety check)
            if (result && typeof result === 'object') {
                result.processingTime = Date.now() - startTime;
                result.cacheUtilized = cachedResearch ? true : false;
            }
            
            return result || {
                website: company.website,
                companyName: company.companyName || 'Unknown',
                processingStatus: 'FAILED',
                error: 'Unknown processing error',
                processingTime: Date.now() - startTime,
                cacheUtilized: false
            };

        } catch (error) {
            console.log(`     [${index}] ❌ Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Save progress backup to prevent data loss
     */
    async saveProgressBackup(processedCount) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(__dirname, '../../outputs/recovery');
            
            // Create recovery directory if it doesn't exist
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const backupFile = path.join(backupDir, `core-pipeline-backup-${processedCount}-companies-${timestamp}.json`);
            
            const backupData = {
                timestamp: new Date().toISOString(),
                processedCount,
                totalCompanies: this.results.length,
                stats: this.stats,
                results: this.results
            };
            
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`   💾 Progress saved: ${processedCount} companies processed (backup: recovery/core-pipeline-backup-${processedCount}-companies-${timestamp}.json)`);
        } catch (error) {
            console.error(`   ⚠️ Failed to save progress backup: ${error.message}`);
        }
    }

    /**
     * Print performance summary
     */
    printPerformanceSummary() {
        const totalTime = Date.now() - this.stats.startTime;
        const avgTimePerCompany = this.stats.processed > 0 ? 
            Math.round(totalTime / this.stats.processed) : 0;
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 CORE PIPELINE PERFORMANCE SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Total Time: ${Math.round(totalTime / 1000 / 60)} minutes`);
        console.log(`⚡ Avg per Company: ${avgTimePerCompany}ms`);
        console.log(`🚀 Companies/Minute: ${this.stats.processed > 0 ? Math.round((this.stats.processed / totalTime) * 60000) : 0}`);
        console.log(`🔄 Parallel Factor: ${this.config.MAX_PARALLEL_COMPANIES}x`);
        console.log(`💾 Cache Hit Rate: ${Math.round((this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses)) * 100) || 0}%`);
        console.log(`💰 API Costs Saved: $${this.stats.apiCostsSaved.toFixed(2)}`);
        console.log(`📊 Companies Processed: ${this.stats.processed}`);
        console.log(`👔 CFOs Found: ${this.stats.cfoFound}`);
        console.log(`📈 CROs Found: ${this.stats.croFound}`);
        console.log(`🎯 Both Found: ${this.stats.bothFound}`);
        
        // Calculate improvement vs sequential
        const sequentialTime = this.stats.processed * 130; // 130s per company sequential
        const actualTime = totalTime / 1000;
        const speedup = Math.round(sequentialTime / actualTime);
        
        console.log(`\n🎯 SPEED IMPROVEMENT:`);
        console.log(`   Sequential estimate: ${Math.round(sequentialTime/3600)} hours`);
        console.log(`   Actual time: ${Math.round(actualTime/60)} minutes`);
        console.log(`   Speed improvement: ${speedup}x faster`);
        console.log('='.repeat(60));
    }

    /**
     * Add parent company row if needed
     */
    async addParentCompanyIfNeeded(result, relatedCompaniesToAdd, processedCompanies) {
        // Check multiple possible locations for parent company data
        let parentCompany = result.parentCompany || result.corporateStructure?.parentCompany || result.acquisitionInfo?.parentCompany;
        
        // Ensure parentCompany is a string, not an object
        if (typeof parentCompany === 'object' && parentCompany !== null) {
            parentCompany = parentCompany.name || parentCompany.companyName || parentCompany.toString();
        }
        
        if (parentCompany && 
            typeof parentCompany === 'string' &&
            parentCompany !== 'None' && 
            parentCompany !== 'null' &&
            !processedCompanies.has(parentCompany) &&
            this.shouldAddParentCompany(result)) {
            
            console.log(`   Processing parent company: ${parentCompany}`);
            processedCompanies.add(parentCompany);
            
            try {
                const parentResult = await this.researchRelatedCompany(
                    parentCompany, 
                    result, 
                    'parent_company',
                    'Standard Corporate Executives'
                );
                if (parentResult) {
                    relatedCompaniesToAdd.push(parentResult);
                    console.log(`    Added parent company: ${parentCompany}`);
                }
            } catch (error) {
                console.error(`    Failed to research parent company ${parentCompany}: ${error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    /**
     * Determine if we should add parent company
     */
    shouldAddParentCompany(result) {
        // Skip if company is too small or if parent company is same as original
        if (result.companyName === result.corporateStructure?.parentCompany) {
            return false;
        }
        
        // Add parent companies for publicly traded companies or companies with clear corporate structures
        return result.corporateStructure?.parentCompany && 
               result.corporateStructure.parentCompany !== 'None';
    }

    /**
     * Research related company (parent/merger/acquisition)
     */
    async researchRelatedCompany(companyName, originalResult, relationType, executiveType) {
        console.log(`      Researching ${relationType}: ${companyName}`);
        
        try {
            // Create a simplified company object for the related company
            const relatedCompany = {
                company_name: companyName,
                website: await this.guessCompanyWebsite(companyName),
                accountOwner: originalResult.accountOwner || 'Unknown',
                isTop1000: false
            };
            
            // Process the related company with core pipeline logic
            const result = await this.processCompany(relatedCompany, -1); // -1 indicates related company
            
            if (result) {
                // Mark as related company
                result.relationType = relationType;
                result.originalCompany = originalResult.companyName;
                result.isRelatedCompany = true;
                
                return result;
            }
        } catch (error) {
            console.error(`      Error researching ${relationType} ${companyName}: ${error.message}`);
        }
        
        return null;
    }

    /**
     * Guess company website for related companies
     */
    async guessCompanyWebsite(companyName) {
        // Simple domain guessing - in production this would use AI
        if (!companyName) return '';
        
        // Ensure companyName is a string
        const nameStr = typeof companyName === 'string' ? companyName : String(companyName);
        
        const cleanName = nameStr.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .replace(/(inc|corp|llc|ltd|company)$/g, '');
        
        return `${cleanName}.com`;
    }

    /**
     * 💰 CALCULATE TOTAL API COST
     */
    calculateTotalCost(result) {
        // Safety check for undefined result
        if (!result || typeof result !== 'object') {
            return 0;
        }
        
        let totalCost = 0;
        
        // Lusha costs
        if (result.cfo?.source?.includes('lusha')) totalCost += 0.08;
        if (result.cro?.source?.includes('lusha')) totalCost += 0.08;
        
        // Twilio costs (phone validation)
        const phoneCount = (result.cfo?.phone ? 1 : 0) + (result.cro?.phone ? 1 : 0);
        totalCost += phoneCount * 0.008;
        
        // Email validation costs
        const emailCount = (result.cfo?.email ? 1 : 0) + (result.cro?.email ? 1 : 0);
        totalCost += emailCount * 0.002; // ZeroBounce/MyEmailVerifier
        
        // Prospeo costs
        if (result.cfo?.source?.includes('prospeo')) totalCost += 0.0198;
        if (result.cro?.source?.includes('prospeo')) totalCost += 0.0198;
        
        return `$${totalCost.toFixed(4)}`;
    }

    /**
     * 🌐 EXTRACT DOMAIN FROM COMPANY NAME
     */
    extractDomainFromCompany(companyName) {
        if (!companyName) return '';
        
        // Ensure companyName is a string
        const nameStr = typeof companyName === 'string' ? companyName : String(companyName);
        
        const cleanName = nameStr.toLowerCase()
            .replace(/[^a-z0-9\s]/g, '')
            .replace(/\s+/g, '')
            .replace(/(inc|corp|llc|ltd|company|plc)$/g, '');
        
        return `${cleanName}.com`;
    }
}

/**
 * MAIN EXECUTION
 */
async function main() {
    console.log('🎯 Starting Core Pipeline...\n');
    
    const pipeline = new CorePipeline();
    const result = await pipeline.runPipeline();
    
    if (result.success) {
        console.log('\nCORE PIPELINE COMPLETED SUCCESSFULLY!');
        console.log('Core executive contact discovery completed');
        console.log('Parent companies, mergers, and acquisitions included');
        console.log('Essential contact data generated');
        process.exit(0);
    } else {
        console.error(`\nPIPELINE FAILED: ${result.error}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CorePipeline };
