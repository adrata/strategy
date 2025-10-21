#!/usr/bin/env node

/**
 * BUYER GROUP DISCOVERY PIPELINE
 * 
 * Parallel pipeline to CFO/CRO pipeline that discovers complete buyer groups for companies.
 * Leverages existing buyer group identification code to find 8-12 buyer group members
 * with proper role assignments (decision makers, champions, stakeholders, blockers, introducers).
 * 
 * This version is optimized for comprehensive buyer group discovery and contact enrichment.
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');
const { PrismaClient } = require('@prisma/client');

// Load environment variables from parent directory
require('dotenv').config({ path: 'C:/Users/ross/Development/adrata/.env' });

// Import shared pipeline modules
const { VersionManager } = require('../../scripts/version-manager');
const { CompanyResolver } = require('../../modules/core/CompanyResolver');
const { ExecutiveContactIntelligence } = require('../../modules/core/ExecutiveContactIntelligence');
const { ContactValidator } = require('../../modules/core/ContactValidator');
const { ValidationEngine } = require('../../modules/core/ValidationEngine');
const { ApiCostOptimizer } = require('../../modules/core/ApiCostOptimizer');
const DataCache = require('../../modules/core/DataCache');
const ApiCreditMonitor = require('../../modules/core/ApiCreditMonitor');
const ApiUsageLogger = require('../../modules/core/ApiUsageLogger');

// Import buyer group configuration and bridge
const config = require('./buyer-group-config');
const BuyerGroupBridge = require('./buyer-group-bridge');

/**
 * BUYER GROUP PIPELINE
 * 
 * Comprehensive buyer group discovery:
 * - 8-12 buyer group members per company
 * - Role assignments (decision/champion/stakeholder/blocker/introducer)
 * - Contact enrichment (email, phone, LinkedIn)
 * - Cohesion analysis and quality scoring
 * - Optimized for enterprise companies (1000+ employees)
 */
class BuyerGroupPipeline {
    constructor() {
        // Pass environment variables to all modules that need API keys
        const apiConfig = {
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
            PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY,
            PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
            TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
            TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
            ...config
        };

        this.companyResolver = new CompanyResolver(apiConfig);
        this.executiveContactIntelligence = new ExecutiveContactIntelligence(apiConfig);
        this.contactValidator = new ContactValidator(apiConfig);
        this.validationEngine = new ValidationEngine(apiConfig);
        this.apiCostOptimizer = new ApiCostOptimizer(apiConfig);
        
        // API credit monitoring
        this.apiCreditMonitor = new ApiCreditMonitor(apiConfig);
        this.apiUsageLogger = new ApiUsageLogger(apiConfig);
        
        this.versionManager = new VersionManager();
        this.dataCache = new DataCache({
            CACHE_TTL_DAYS: config.CACHE_TTL_DAYS,
            USE_FILE_CACHE: config.CACHE_ENABLED,
            COMPANY_RESOLUTION_TTL: config.COMPANY_RESOLUTION_TTL,
            BUYER_GROUP_DISCOVERY_TTL: config.BUYER_GROUP_DISCOVERY_TTL,
            CONTACT_ENRICHMENT_TTL: config.CONTACT_ENRICHMENT_TTL,
            CACHE_WARMUP: true,
            SMART_INVALIDATION: true
        });
        
        this.config = apiConfig;
        this.buyerGroupBridge = new BuyerGroupBridge(apiConfig);
        
        // Initialize Prisma client for database operations
        this.prisma = new PrismaClient();
        
        // Initialize rate limits
        this.rateLimits = {
            coresignal_search: { lastCall: 0, delay: config.API_DELAYS.CORESIGNAL_SEARCH },
            coresignal_collect: { lastCall: 0, delay: config.API_DELAYS.CORESIGNAL_COLLECT },
            contact_enrichment: { lastCall: 0, delay: config.API_DELAYS.CONTACT_ENRICHMENT },
            verification: { lastCall: 0, delay: config.API_DELAYS.VERIFICATION }
        };
        
        this.stats = {
            processed: 0,
            successful: 0,
            errors: 0,
            buyerGroupsFound: 0,
            totalMembers: 0,
            contactsEnriched: 0,
            highConfidence: 0,
            cacheHits: 0,
            cacheMisses: 0,
            apiCostsSaved: 0,
            startTime: Date.now()
        };
    }

    /**
     * ENFORCE RATE LIMITING
     */
    async enforceRateLimit(apiName) {
        const rateLimit = this.rateLimits[apiName] || { lastCall: 0, delay: 1000 };
        const timeSinceLastCall = Date.now() - rateLimit.lastCall;
        
        if (timeSinceLastCall < rateLimit.delay) {
            const waitTime = rateLimit.delay - timeSinceLastCall;
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        rateLimit.lastCall = Date.now();
    }

    /**
     * MAIN PIPELINE EXECUTION - BUYER GROUP DISCOVERY
     */
    async runPipeline(inputFile = null, onProgress = null) {
        // Store input file for use in loadCompanies
        this.inputFile = inputFile;
        
        console.log('BUYER GROUP DISCOVERY PIPELINE');
        console.log('=' .repeat(80));
        console.log('Comprehensive buyer group identification and contact enrichment');
        console.log('Focus: 8-12 buyer group members with role assignments and verified contact info');
        console.log('Target: Enterprise companies with complex buying committees');

        try {
            // STEP 0: Check API credits and initialize monitoring
            console.log('\nSTEP 0: API Credit Monitoring');
            await this.initializeApiMonitoring();
            
            // STEP 1: Load companies from CSV
            console.log('\nSTEP 1: Loading Companies');
            const companies = await this.loadCompanies();
            console.log(`   Loaded ${companies.length} companies`);

            // STEP 2: Process each company for buyer group discovery (PARALLEL PROCESSING)
            console.log('\nSTEP 2: Buyer Group Discovery (PARALLEL PROCESSING)');
            console.log(`🚀 Processing ${companies.length} companies with ${this.config.MAX_PARALLEL_COMPANIES}x parallelization`);
            
            // Check cache coverage
            await this.analyzeCacheCoverage(companies.slice(0, Math.min(20, companies.length)));
            
            let processedCount = 0;
            const totalCompanies = companies.length;
            const results = [];

            // Process in parallel batches
            for (let i = 0; i < companies.length; i += this.config.MAX_PARALLEL_COMPANIES) {
                const batch = companies.slice(i, i + this.config.MAX_PARALLEL_COMPANIES);
                console.log(`\n📦 Processing batch ${Math.floor(i / this.config.MAX_PARALLEL_COMPANIES) + 1}/${Math.ceil(companies.length / this.config.MAX_PARALLEL_COMPANIES)}`);
                
                // Process batch in parallel
                const batchPromises = batch.map(async (company, index) => {
                    const companyIndex = i + index + 1;
                    return this.processCompany(company, companyIndex, totalCompanies);
                });
                
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Process results
                for (const result of batchResults) {
                    if (result.status === 'fulfilled' && result.value) {
                        results.push(result.value);
                        this.stats.successful++;
                    } else {
                        this.stats.errors++;
                        console.log(`   ❌ Company processing failed: ${result.reason?.message || 'Unknown error'}`);
                    }
                    this.stats.processed++;
                    processedCount++;
                }
                
                // Progress update
                const progress = Math.round((processedCount / totalCompanies) * 100);
                console.log(`   📊 Progress: ${processedCount}/${totalCompanies} (${progress}%)`);
                
                // Stream progress if callback provided
                if (onProgress) {
                    onProgress({
                        processed: processedCount,
                        total: totalCompanies,
                        progress: progress,
                        currentBatch: batchResults.map(r => r.status === 'fulfilled' ? r.value : null).filter(Boolean),
                        stats: this.stats,
                        timestamp: new Date().toISOString()
                    });
                }
                
                // Save checkpoint if enabled
                if (this.config.PROGRESS.SAVE_CHECKPOINTS && processedCount % this.config.PROGRESS.CHECKPOINT_INTERVAL === 0) {
                    await this.saveCheckpoint(results, processedCount, totalCompanies);
                }
            }

            // STEP 3: Generate comprehensive CSV output
            console.log('\nSTEP 3: Generating Output Files');
            await this.generateOutputFiles(results);

            // STEP 4: Final reporting
            console.log('\nSTEP 4: Final Reporting');
            this.generateFinalReport(results);

            return results;

        } catch (error) {
            console.error('❌ Pipeline execution failed:', error.message);
            throw error;
        }
    }

    /**
     * LOAD COMPANIES FROM CSV OR JSON
     */
    async loadCompanies() {
        const inputFile = this.inputFile || 'inputs/all-1000-companies.csv';
        
        // Detect file type
        const fileExtension = path.extname(inputFile).toLowerCase();
        
        if (fileExtension === '.json') {
            return await this.loadCompaniesFromJSON(inputFile);
        } else {
            return await this.loadCompaniesFromCSV(inputFile);
        }
    }

    /**
     * LOAD COMPANIES FROM CSV
     */
    async loadCompaniesFromCSV(inputFile) {
        const companies = [];
        
        return new Promise((resolve, reject) => {
            fs.createReadStream(inputFile)
                .pipe(csv())
                .on('data', (row) => {
                    // Handle different CSV formats
                    const companyName = row.company_name || row.company || row.name || row.Company;
                    const website = row.website || row.domain || row.Website;
                    
                    if (companyName) {
                        companies.push({
                            name: companyName.trim(),
                            website: website ? website.trim() : null,
                            originalRow: row
                        });
                    }
                })
                .on('end', () => {
                    console.log(`   📊 Loaded ${companies.length} companies from CSV: ${inputFile}`);
                    resolve(companies);
                })
                .on('error', (error) => {
                    console.error('❌ Error reading CSV file:', error.message);
                    reject(error);
                });
        });
    }

    /**
     * LOAD COMPANIES FROM JSON
     */
    async loadCompaniesFromJSON(inputFile) {
        try {
            const data = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
            let companies = [];
            
            // Support multiple JSON formats
            if (Array.isArray(data)) {
                // Direct array of companies
                companies = data.map(item => ({
                    name: item.name || item.companyName || item.company,
                    website: item.website || item.domain || item.url,
                    originalRow: item
                }));
            } else if (data.companies && Array.isArray(data.companies)) {
                // Object with companies array
                companies = data.companies.map(item => ({
                    name: item.name || item.companyName || item.company,
                    website: item.website || item.domain || item.url,
                    originalRow: item
                }));
            } else if (data.accounts && Array.isArray(data.accounts)) {
                // Object with accounts array
                companies = data.accounts.map(item => ({
                    name: item.name || item.companyName || item.company,
                    website: item.website || item.domain || item.url,
                    originalRow: item
                }));
            } else {
                throw new Error('Invalid JSON format. Expected array of companies or object with companies/accounts array');
            }
            
            // Filter out invalid entries
            companies = companies.filter(company => company.name && company.name.trim().length > 0);
            
            console.log(`   📊 Loaded ${companies.length} companies from JSON: ${inputFile}`);
            return companies;
            
        } catch (error) {
            console.error('❌ Error reading JSON file:', error.message);
            throw error;
        }
    }

    /**
     * PROCESS SINGLE COMPANY (API METHOD)
     */
    async processSingleCompany(companyName, options = {}) {
        try {
            // Initialize without full pipeline
            await this.initializeApiMonitoring();
            
            // Validate input
            const company = { 
                name: companyName, 
                website: options.website || null 
            };
            this.validateCompanyInput(company);
            
            console.log(`🏢 Processing single company: ${companyName}`);
            
            // Process the company
            const result = await this.processCompany(company, 1, 1);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Single company processing failed for ${companyName}:`, error.message);
            throw error;
        }
    }

    /**
     * VALIDATE COMPANY INPUT
     */
    validateCompanyInput(company) {
        if (!company.name && !company.website) {
            throw new Error('Company must have either name or website');
        }
        
        if (company.name && company.name.length < 2) {
            throw new Error('Company name too short (minimum 2 characters)');
        }
        
        if (company.name && company.name.length > 200) {
            throw new Error('Company name too long (maximum 200 characters)');
        }
        
        if (company.website && !this.isValidUrl(company.website)) {
            throw new Error('Invalid website URL format');
        }
        
        return true;
    }

    /**
     * VALIDATE URL FORMAT
     */
    isValidUrl(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    /**
     * PROCESS SINGLE COMPANY FOR BUYER GROUP DISCOVERY
     */
    async processCompany(company, index, total) {
        const startTime = Date.now();
        console.log(`\n🏢 Company ${index}/${total}: ${company.name}`);
        
        try {
            // STEP 1: Company Resolution
            console.log(`   🔍 Resolving company information...`);
            const companyInfo = await this.resolveCompany(company);
            
            // STEP 2: Buyer Group Discovery
            console.log(`   👥 Discovering buyer group...`);
            const buyerGroup = await this.discoverBuyerGroup(companyInfo);
            
            // STEP 3: Contact Enrichment
            console.log(`   📧 Enriching contact information...`);
            const enrichedBuyerGroup = await this.enrichContacts(buyerGroup);
            
            // STEP 4: Quality Assessment
            console.log(`   📊 Assessing buyer group quality...`);
            const qualityAssessment = this.assessBuyerGroupQuality(enrichedBuyerGroup);
            
            const processingTime = Date.now() - startTime;
            
            const result = {
                index,
                companyName: companyInfo.name,
                website: companyInfo.website,
                industry: companyInfo.industry,
                size: companyInfo.size,
                buyerGroup: enrichedBuyerGroup,
                quality: qualityAssessment,
                processingTime,
                timestamp: new Date().toISOString(),
                cacheUtilized: companyInfo.cacheUtilized || false
            };
            
            // Update stats
            this.stats.buyerGroupsFound++;
            this.stats.totalMembers += enrichedBuyerGroup.totalMembers || 0;
            this.stats.contactsEnriched += enrichedBuyerGroup.contactsEnriched || 0;
            if (qualityAssessment.overallConfidence >= 80) {
                this.stats.highConfidence++;
            }
            
            console.log(`   ✅ Buyer group complete: ${enrichedBuyerGroup.totalMembers} members, confidence: ${qualityAssessment.overallConfidence}%`);
            
            return result;
            
        } catch (error) {
            console.log(`   ❌ Error processing ${company.name}: ${error.message}`);
            
            // Log error for tracking
            await this.logError(error, { 
                company: company.name, 
                step: 'buyer_group_processing',
                index: index,
                total: total
            });
            
            return {
                index,
                companyName: company.name,
                processingStatus: 'FAILED',
                error: error.message,
                errorType: error.constructor.name,
                processingTime: Date.now() - startTime,
                cacheUtilized: false,
                fallbackData: await this.getFallbackBuyerGroup(company)
            };
        }
    }

    /**
     * RESOLVE COMPANY INFORMATION
     */
    async resolveCompany(company) {
        const cacheKey = `company_resolution_${company.name.toLowerCase()}`;
        
        // Check cache first
        const cached = await this.dataCache.get(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            console.log(`   💾 Using cached company data`);
            return { ...cached, cacheUtilized: true };
        }
        
        this.stats.cacheMisses++;
        
        // Resolve company using existing CompanyResolver
        const companyInfo = await this.companyResolver.resolveCompany(company.name, company.website);
        
        // Cache the result
        await this.dataCache.set(cacheKey, companyInfo, this.config.COMPANY_RESOLUTION_TTL * 24 * 60 * 60 * 1000);
        
        return companyInfo;
    }

    /**
     * DISCOVER BUYER GROUP
     * 
     * Uses the buyer group bridge to integrate with TypeScript modules
     */
    async discoverBuyerGroup(companyInfo) {
        const companyName = companyInfo.companyName || companyInfo.name;
        const cacheKey = `buyer_group_${companyName.toLowerCase()}`;
        
        // Check cache first
        const cached = await this.dataCache.get(cacheKey);
        if (cached) {
            this.stats.cacheHits++;
            console.log(`   💾 Using cached buyer group data`);
            return cached;
        }
        
        this.stats.cacheMisses++;
        
        // Use buyer group bridge to discover buyer group
        const buyerGroup = await this.buyerGroupBridge.discoverBuyerGroup(companyName, companyInfo);
        
        // Cache the result
        await this.dataCache.set(cacheKey, buyerGroup, this.config.BUYER_GROUP_DISCOVERY_TTL * 24 * 60 * 60 * 1000);
        
        return buyerGroup;
    }

    /**
     * ENRICH CONTACT INFORMATION
     */
    async enrichContacts(buyerGroup) {
        const enrichedGroup = { ...buyerGroup };
        let contactsEnriched = 0;
        
        // Enrich contacts for each role
        for (const [roleType, members] of Object.entries(buyerGroup.roles)) {
            enrichedGroup.roles[roleType] = [];
            
            for (const member of members) {
                try {
                    // Use existing contact enrichment modules
                    const enrichedContact = await this.executiveContactIntelligence.enrichContact(member);
                    
                    // Validate contact information
                    const validation = await this.contactValidator.validateContact(enrichedContact);
                    
                    enrichedGroup.roles[roleType].push({
                        ...member,
                        ...enrichedContact,
                        validation,
                        enriched: true
                    });
                    
                    contactsEnriched++;
                    
                    // Rate limiting
                    await this.enforceRateLimit('contact_enrichment');
                    
                } catch (error) {
                    console.log(`   ⚠️ Contact enrichment failed for ${member.name}: ${error.message}`);
                    enrichedGroup.roles[roleType].push({
                        ...member,
                        enriched: false,
                        enrichmentError: error.message
                    });
                }
            }
        }
        
        enrichedGroup.contactsEnriched = contactsEnriched;
        return enrichedGroup;
    }

    /**
     * ASSESS BUYER GROUP QUALITY
     */
    assessBuyerGroupQuality(buyerGroup) {
        const assessment = {
            overallConfidence: 0,
            cohesionScore: buyerGroup.cohesion?.score || 0,
            roleCoverage: {},
            warnings: [],
            recommendations: []
        };
        
        // Calculate role coverage
        for (const [roleType, members] of Object.entries(buyerGroup.roles)) {
            assessment.roleCoverage[roleType] = {
                count: members.length,
                target: this.config.ROLE_TARGETS[roleType.toUpperCase()]?.ideal || 2,
                meetsTarget: members.length >= (this.config.ROLE_TARGETS[roleType.toUpperCase()]?.min || 1)
            };
        }
        
        // Calculate overall confidence
        const roleConfidence = Object.values(assessment.roleCoverage).reduce((sum, role) => {
            return sum + (role.meetsTarget ? 20 : 10);
        }, 0);
        
        assessment.overallConfidence = Math.min(
            roleConfidence + (assessment.cohesionScore * 0.3),
            100
        );
        
        // Generate warnings and recommendations
        if (assessment.roleCoverage.decision?.count === 0) {
            assessment.warnings.push('No decision makers identified');
            assessment.recommendations.push('Expand search to include C-level and VP roles');
        }
        
        if (assessment.roleCoverage.champion?.count === 0) {
            assessment.warnings.push('No champions identified');
            assessment.recommendations.push('Look for departmental leads and project managers');
        }
        
        if (buyerGroup.totalMembers < this.config.BUYER_GROUP.MIN_SIZE) {
            assessment.warnings.push('Buyer group may be too small for enterprise sales');
            assessment.recommendations.push('Consider expanding search criteria');
        }
        
        return assessment;
    }

    /**
     * GENERATE OUTPUT FILES
     */
    async generateOutputFiles(results) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputDir = path.join(__dirname, '../../outputs');
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Generate main CSV
        await this.generateMainCSV(results, outputDir, timestamp);
        
        // Generate role-specific CSVs if enabled
        if (this.config.OUTPUT.SPLIT_BY_ROLE) {
            await this.generateRoleSpecificCSVs(results, outputDir, timestamp);
        }
        
        // Generate JSON backup
        if (this.config.OUTPUT.GENERATE_JSON) {
            await this.generateJSONBackup(results, outputDir, timestamp);
        }
        
        console.log(`   📁 Output files generated in: ${outputDir}`);
    }

    /**
     * GENERATE MAIN CSV OUTPUT
     */
    async generateMainCSV(results, outputDir, timestamp) {
        const csvPath = path.join(outputDir, `buyer-group-data-${timestamp}.csv`);
        
        // Prepare CSV headers
        const headers = [
            'company_name', 'company_website', 'company_industry', 'company_size',
            'buyer_group_size', 'cohesion_score', 'primary_contact', 'decision_makers_count',
            'champions_count', 'stakeholders_count', 'blockers_count', 'introducers_count',
            'overall_confidence', 'processing_time', 'timestamp'
        ];
        
        // Add member columns (up to 12 members)
        for (let i = 1; i <= 12; i++) {
            headers.push(
                `member_${i}_name`, `member_${i}_title`, `member_${i}_role`,
                `member_${i}_email`, `member_${i}_phone`, `member_${i}_linkedin`,
                `member_${i}_confidence`
            );
        }
        
        const csvWriter = createObjectCsvWriter({
            path: csvPath,
            header: headers.map(h => ({ id: h, title: h }))
        });
        
        // Prepare CSV data
        const csvData = results.map(result => {
            const row = {
                company_name: result.companyName || '',
                company_website: result.website || '',
                company_industry: result.industry || '',
                company_size: result.size || '',
                buyer_group_size: result.buyerGroup?.totalMembers || 0,
                cohesion_score: result.buyerGroup?.cohesion?.score || 0,
                primary_contact: result.buyerGroup?.roles?.decision?.[0]?.name || '',
                decision_makers_count: result.buyerGroup?.roles?.decision?.length || 0,
                champions_count: result.buyerGroup?.roles?.champion?.length || 0,
                stakeholders_count: result.buyerGroup?.roles?.stakeholder?.length || 0,
                blockers_count: result.buyerGroup?.roles?.blocker?.length || 0,
                introducers_count: result.buyerGroup?.roles?.introducer?.length || 0,
                overall_confidence: result.quality?.overallConfidence || 0,
                processing_time: result.processingTime || 0,
                timestamp: result.timestamp || ''
            };
            
            // Add member data
            let memberIndex = 1;
            for (const [roleType, members] of Object.entries(result.buyerGroup?.roles || {})) {
                for (const member of members) {
                    if (memberIndex <= 12) {
                        row[`member_${memberIndex}_name`] = member.name || '';
                        row[`member_${memberIndex}_title`] = member.title || '';
                        row[`member_${memberIndex}_role`] = roleType || '';
                        row[`member_${memberIndex}_email`] = member.email || '';
                        row[`member_${memberIndex}_phone`] = member.phone || '';
                        row[`member_${memberIndex}_linkedin`] = member.linkedin || '';
                        row[`member_${memberIndex}_confidence`] = member.confidence || 0;
                        memberIndex++;
                    }
                }
            }
            
            return row;
        });
        
        await csvWriter.writeRecords(csvData);
        console.log(`   📊 Main CSV generated: ${csvPath}`);
    }

    /**
     * GENERATE ROLE-SPECIFIC CSV FILES
     */
    async generateRoleSpecificCSVs(results, outputDir, timestamp) {
        const roleTypes = ['decision', 'champion', 'stakeholder', 'blocker', 'introducer'];
        
        for (const roleType of roleTypes) {
            const csvPath = path.join(outputDir, `buyer-group-${roleType}-${timestamp}.csv`);
            
            const headers = [
                'company_name', 'company_website', 'member_name', 'member_title',
                'member_email', 'member_phone', 'member_linkedin', 'confidence',
                'cohesion_score', 'overall_confidence'
            ];
            
            const csvWriter = createObjectCsvWriter({
                path: csvPath,
                header: headers.map(h => ({ id: h, title: h }))
            });
            
            const csvData = [];
            for (const result of results) {
                if (result.buyerGroup?.roles?.[roleType]) {
                    for (const member of result.buyerGroup.roles[roleType]) {
                        csvData.push({
                            company_name: result.companyName || '',
                            company_website: result.website || '',
                            member_name: member.name || '',
                            member_title: member.title || '',
                            member_email: member.email || '',
                            member_phone: member.phone || '',
                            member_linkedin: member.linkedin || '',
                            confidence: member.confidence || 0,
                            cohesion_score: result.buyerGroup?.cohesion?.score || 0,
                            overall_confidence: result.quality?.overallConfidence || 0
                        });
                    }
                }
            }
            
            if (csvData.length > 0) {
                await csvWriter.writeRecords(csvData);
                console.log(`   📊 ${roleType} CSV generated: ${csvPath}`);
            }
        }
    }

    /**
     * GENERATE JSON BACKUP
     */
    async generateJSONBackup(results, outputDir, timestamp) {
        const jsonPath = path.join(outputDir, `buyer-group-backup-${timestamp}.json`);
        
        const backupData = {
            timestamp: new Date().toISOString(),
            processedCount: results.length,
            stats: this.stats,
            results: results
        };
        
        fs.writeFileSync(jsonPath, JSON.stringify(backupData, null, 2));
        console.log(`   📄 JSON backup generated: ${jsonPath}`);
    }

    /**
     * SAVE BUYER GROUP TO DATABASE (STREAMLINED)
     * 
     * Simple approach: Update existing people records with buyer group roles
     * No separate buyer group tables - just add roles to people
     */
    async saveBuyerGroupToDatabase(result, workspaceId = null) {
        try {
            if (!result.buyerGroup || !result.companyName) {
                console.log(`   ⚠️ Skipping database save - invalid result data`);
                return null;
            }

            let memberCount = 0;
            
            // Update people records with buyer group roles
            for (const [role, members] of Object.entries(result.buyerGroup.roles || {})) {
                for (const member of members) {
                    if (member && member.name && member.email) {
                        try {
                            // Find existing person by email and workspace
                            const existingPerson = await this.prisma.people.findFirst({
                                where: {
                                    workspaceId: workspaceId,
                                    OR: [
                                        { email: member.email },
                                        { workEmail: member.email },
                                        { personalEmail: member.email }
                                    ]
                                }
                            });

                            if (existingPerson) {
                                // Update existing person with buyer group role
                                await this.prisma.people.update({
                                    where: { id: existingPerson.id },
                                    data: {
                                        buyerGroupRole: role,
                                        influenceScore: member.influenceScore || member.confidence || 0,
                                        updatedAt: new Date()
                                    }
                                });
                                memberCount++;
                                console.log(`   ✅ Updated ${member.name} with ${role} role`);
                            } else {
                                // Create new person record if not found
                                await this.prisma.people.create({
                                    data: {
                                        workspaceId: workspaceId,
                                        firstName: member.name.split(' ')[0] || '',
                                        lastName: member.name.split(' ').slice(1).join(' ') || '',
                                        fullName: member.name,
                                        jobTitle: member.title || '',
                                        email: member.email,
                                        phone: member.phone || null,
                                        linkedinUrl: member.linkedin || null,
                                        buyerGroupRole: role,
                                        influenceScore: member.influenceScore || member.confidence || 0,
                                        status: 'PROSPECT',
                                        createdAt: new Date(),
                                        updatedAt: new Date()
                                    }
                                });
                                memberCount++;
                                console.log(`   ✅ Created ${member.name} with ${role} role`);
                            }
                        } catch (error) {
                            console.log(`   ⚠️ Failed to save ${member.name}: ${error.message}`);
                        }
                    }
                }
            }

            console.log(`   💾 Saved ${memberCount} buyer group members to database`);
            return { memberCount, companyName: result.companyName };

        } catch (error) {
            console.error(`   ❌ Database save failed for ${result.companyName}:`, error.message);
            // Don't throw - allow pipeline to continue
            return null;
        }
    }

    /**
     * SAVE MULTIPLE BUYER GROUPS TO DATABASE (STREAMLINED)
     */
    async saveBuyerGroupsToDatabase(results, workspaceId = null) {
        console.log(`   💾 Saving ${results.length} buyer groups to database...`);
        
        let savedCount = 0;
        let totalMembers = 0;
        
        for (const result of results) {
            if (result.buyerGroup && result.companyName) {
                const saved = await this.saveBuyerGroupToDatabase(result, workspaceId);
                if (saved) {
                    savedCount++;
                    totalMembers += saved.memberCount || 0;
                }
            }
        }
        
        console.log(`   ✅ Database save complete: ${savedCount}/${results.length} companies processed, ${totalMembers} total members saved`);
        return { savedCount, totalMembers };
    }

    /**
     * LOG ERROR FOR TRACKING
     */
    async logError(error, context = {}) {
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.constructor.name
                },
                context: context,
                pipeline: 'buyer-group',
                version: '2.0'
            };

            // Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.error('🔍 [ERROR LOG]', errorLog);
            }

            // Save to error log file
            const errorLogPath = path.join(__dirname, 'logs', 'buyer-group-errors.json');
            const errorLogDir = path.dirname(errorLogPath);
            
            if (!fs.existsSync(errorLogDir)) {
                fs.mkdirSync(errorLogDir, { recursive: true });
            }

            // Append to error log
            const existingLogs = fs.existsSync(errorLogPath) ? 
                JSON.parse(fs.readFileSync(errorLogPath, 'utf8')) : [];
            existingLogs.push(errorLog);
            
            // Keep only last 1000 errors
            if (existingLogs.length > 1000) {
                existingLogs.splice(0, existingLogs.length - 1000);
            }
            
            fs.writeFileSync(errorLogPath, JSON.stringify(existingLogs, null, 2));

        } catch (logError) {
            console.error('Failed to log error:', logError.message);
        }
    }

    /**
     * GET FALLBACK BUYER GROUP
     */
    async getFallbackBuyerGroup(company) {
        try {
            // Return basic company info as fallback
            return {
                companyName: company.name,
                website: company.website,
                buyerGroup: {
                    totalMembers: 0,
                    roles: {},
                    members: [],
                    cohesion: { score: 0, analysis: 'Fallback data - processing failed' }
                },
                quality: {
                    overallConfidence: 0,
                    cohesionScore: 0,
                    roleDistribution: {},
                    validationStatus: 'failed'
                },
                processingStatus: 'FALLBACK',
                fallbackReason: 'Primary processing failed'
            };
        } catch (error) {
            console.error('Fallback buyer group generation failed:', error);
            return null;
        }
    }

    /**
     * GENERATE FINAL REPORT
     */
    generateFinalReport(results) {
        const totalTime = Date.now() - this.stats.startTime;
        const successfulResults = results.filter(r => r.buyerGroup);
        
        console.log('\n🎉 BUYER GROUP DISCOVERY PIPELINE COMPLETE');
        console.log('=' .repeat(80));
        console.log(`📊 Total Companies Processed: ${this.stats.processed}`);
        console.log(`✅ Successful: ${this.stats.successful}`);
        console.log(`❌ Errors: ${this.stats.errors}`);
        console.log(`👥 Buyer Groups Found: ${this.stats.buyerGroupsFound}`);
        console.log(`👤 Total Members: ${this.stats.totalMembers}`);
        console.log(`📧 Contacts Enriched: ${this.stats.contactsEnriched}`);
        console.log(`⭐ High Confidence (80%+): ${this.stats.highConfidence}`);
        console.log(`💾 Cache Hits: ${this.stats.cacheHits}`);
        console.log(`🔄 Cache Misses: ${this.stats.cacheMisses}`);
        console.log(`💰 API Costs Saved: $${this.stats.apiCostsSaved.toFixed(2)}`);
        console.log(`⏱️ Total Processing Time: ${Math.round(totalTime / 1000)}s`);
        
        if (successfulResults.length > 0) {
            const avgGroupSize = this.stats.totalMembers / successfulResults.length;
            const avgConfidence = successfulResults.reduce((sum, r) => sum + (r.quality?.overallConfidence || 0), 0) / successfulResults.length;
            
            console.log(`\n📈 QUALITY METRICS:`);
            console.log(`   Average Buyer Group Size: ${avgGroupSize.toFixed(1)} members`);
            console.log(`   Average Confidence: ${avgConfidence.toFixed(1)}%`);
            console.log(`   Success Rate: ${Math.round((this.stats.successful / this.stats.processed) * 100)}%`);
        }
    }

    /**
     * INITIALIZE API MONITORING
     */
    async initializeApiMonitoring() {
        // ApiCreditMonitor is already initialized in constructor
        console.log('   ✅ API credit monitoring initialized');
    }

    /**
     * ANALYZE CACHE COVERAGE
     */
    async analyzeCacheCoverage(companies) {
        let cacheHits = 0;
        for (const company of companies) {
            const cacheKey = `company_resolution_${company.name.toLowerCase()}`;
            const cached = await this.dataCache.get(cacheKey);
            if (cached) cacheHits++;
        }
        
        const coverage = Math.round((cacheHits / companies.length) * 100);
        console.log(`   💾 Cache coverage: ${coverage}% (${cacheHits}/${companies.length} companies)`);
    }

    /**
     * SAVE CHECKPOINT
     */
    async saveCheckpoint(results, processedCount, totalCompanies) {
        const checkpointDir = path.join(__dirname, '../../outputs/checkpoints');
        if (!fs.existsSync(checkpointDir)) {
            fs.mkdirSync(checkpointDir, { recursive: true });
        }
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const checkpointPath = path.join(checkpointDir, `buyer-group-checkpoint-${processedCount}-${timestamp}.json`);
        
        const checkpointData = {
            timestamp: new Date().toISOString(),
            processedCount,
            totalCompanies,
            stats: this.stats,
            results: results
        };
        
        fs.writeFileSync(checkpointPath, JSON.stringify(checkpointData, null, 2));
        console.log(`   💾 Checkpoint saved: ${checkpointPath}`);
    }
}

// CLI execution
if (require.main === module) {
    const pipeline = new BuyerGroupPipeline();
    const inputFile = process.argv[2] || null;
    
    pipeline.runPipeline(inputFile)
        .then((results) => {
            console.log(`\n✅ Pipeline completed successfully with ${results.length} results`);
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Pipeline failed:', error.message);
            process.exit(1);
        });
}

module.exports = BuyerGroupPipeline;
