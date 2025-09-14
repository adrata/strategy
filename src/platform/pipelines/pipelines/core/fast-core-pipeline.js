#!/usr/bin/env node

/**
 * 🚀 FAST CORE PIPELINE - OPTIMIZED FOR SPEED
 * 
 * Performance Optimizations:
 * - Parallel processing (10x faster)
 * - Data caching (avoid re-purchasing API data)
 * - Reduced rate limiting
 * - Batch processing
 * - Real-time progress saving
 * 
 * Target: 30 minutes for 1000 companies (vs 36 hours sequential)
 */

require('dotenv').config({ path: '../../.env' });

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

// Import optimized modules
const { ExecutiveResearch } = require('../../modules/ExecutiveResearch');
const { ContactValidator } = require('../../modules/ContactValidator');
const DataCache = require('../../modules/DataCache');

class FastCorePipeline {
    constructor() {
        this.config = {
            MAX_PARALLEL_COMPANIES: 10,  // Process 10 companies simultaneously
            BATCH_SIZE: 50,               // Save progress every 50 companies
            CACHE_ENABLED: true,          // Use cached data when available
            REDUCED_DELAYS: true,         // Reduce rate limiting delays
            ...this.loadConfig()
        };

        this.results = [];
        this.stats = {
            companiesProcessed: 0,
            executivesFound: 0,
            emailsValidated: 0,
            phoneNumbersFound: 0,
            cacheHits: 0,
            cacheMisses: 0,
            processingTimeMs: 0,
            startTime: Date.now()
        };

        // Initialize modules with optimized config
        this.executiveResearch = new ExecutiveResearch({
            RATE_LIMIT_DELAY: this.config.REDUCED_DELAYS ? 200 : 1000,  // 5x faster
            MAX_RETRIES: 2,
            CACHE_ENABLED: true
        });

        this.contactValidator = new ContactValidator({
            RATE_LIMIT_DELAY: this.config.REDUCED_DELAYS ? 50 : 100,    // 2x faster
            MAX_RETRIES: 2,
            CACHE_ENABLED: true
        });

        this.dataCache = new DataCache({
            CACHE_TTL_DAYS: 30,
            USE_FILE_CACHE: true
        });

        console.log('🚀 FAST CORE PIPELINE INITIALIZED');
        console.log(`   Parallel Companies: ${this.config.MAX_PARALLEL_COMPANIES}`);
        console.log(`   Batch Size: ${this.config.BATCH_SIZE}`);
        console.log(`   Cache Enabled: ${this.config.CACHE_ENABLED}`);
        console.log(`   Reduced Delays: ${this.config.REDUCED_DELAYS}`);
    }

    loadConfig() {
        return {
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: process.env.LUSHA_API_KEY,
            ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
            MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY
        };
    }

    /**
     * 🚀 MAIN EXECUTION - PARALLEL PROCESSING
     */
    async run(inputFile = 'inputs/all-1000-companies.csv') {
        try {
            console.log('\n' + '='.repeat(80));
            console.log('🚀 FAST CORE PIPELINE - PARALLEL EXECUTION');
            console.log('='.repeat(80));

            // STEP 1: Load and validate companies
            console.log('\n📊 STEP 1: Loading Companies');
            const companies = await this.loadCompanies(inputFile);
            console.log(`   ✅ Loaded ${companies.length} companies`);

            // STEP 2: Check cache coverage
            console.log('\n💾 STEP 2: Cache Analysis');
            await this.analyzeCacheCoverage(companies);

            // STEP 3: Parallel processing
            console.log('\n⚡ STEP 3: Parallel Processing');
            await this.processCompaniesInParallel(companies);

            // STEP 4: Generate outputs
            console.log('\n📄 STEP 4: Generating Outputs');
            await this.generateOutputs();

            // STEP 5: Performance summary
            console.log('\n📈 STEP 5: Performance Summary');
            this.printPerformanceSummary();

        } catch (error) {
            console.error('❌ Pipeline failed:', error);
            throw error;
        }
    }

    /**
     * Load companies from CSV
     */
    async loadCompanies(inputFile) {
        return new Promise((resolve, reject) => {
            const companies = [];
            const filePath = path.join(__dirname, '../../', inputFile);

            if (!fs.existsSync(filePath)) {
                reject(new Error(`Input file not found: ${filePath}`));
                return;
            }

            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    if (row.Website && row['Company Name']) {
                        companies.push({
                            website: row.Website.trim(),
                            companyName: row['Company Name'].trim(),
                            accountOwner: row['Account Owner'] || 'Unknown'
                        });
                    }
                })
                .on('end', () => resolve(companies))
                .on('error', reject);
        });
    }

    /**
     * Analyze cache coverage to estimate savings
     */
    async analyzeCacheCoverage(companies) {
        let totalCached = 0;
        const sampleSize = Math.min(50, companies.length);
        
        console.log(`   🔍 Analyzing cache for ${sampleSize} sample companies...`);
        
        for (let i = 0; i < sampleSize; i++) {
            const company = companies[i];
            const cacheInfo = await this.dataCache.hasCompanyData(company.website);
            if (cacheInfo.hasCachedData) {
                totalCached++;
            }
        }
        
        const estimatedCacheRate = Math.round((totalCached / sampleSize) * 100);
        const estimatedSavings = Math.round(companies.length * (estimatedCacheRate / 100));
        
        console.log(`   💾 Estimated cache hit rate: ${estimatedCacheRate}%`);
        console.log(`   💰 Estimated API calls saved: ${estimatedSavings}/${companies.length}`);
        
        if (estimatedCacheRate > 50) {
            console.log(`   🎉 High cache coverage detected - significant speedup expected!`);
        }
    }

    /**
     * Process companies in parallel batches
     */
    async processCompaniesInParallel(companies) {
        const totalCompanies = companies.length;
        let processedCount = 0;

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
            
            // Handle results
            for (let j = 0; j < batchResults.length; j++) {
                if (batchResults[j].status === 'fulfilled') {
                    this.results.push(batchResults[j].value);
                } else {
                    console.error(`   ❌ Company ${processedCount + j + 1} failed:`, batchResults[j].reason.message);
                    // Add failed company with basic data
                    this.results.push({
                        website: batch[j].website,
                        companyName: batch[j].companyName,
                        processingStatus: 'FAILED',
                        error: batchResults[j].reason.message
                    });
                }
            }

            processedCount += batch.length;
            const batchTime = Date.now() - batchStartTime;
            const avgTimePerCompany = Math.round(batchTime / batch.length);
            
            console.log(`   ✅ Batch completed in ${Math.round(batchTime/1000)}s (${avgTimePerCompany}ms per company)`);
            
            // Save progress every batch
            if (processedCount % this.config.BATCH_SIZE === 0 || processedCount === totalCompanies) {
                await this.saveProgressBackup(processedCount);
            }

            // Rate limiting between batches (reduced)
            if (i + this.config.MAX_PARALLEL_COMPANIES < totalCompanies) {
                console.log('   ⏳ Inter-batch delay: 2s...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        this.stats.companiesProcessed = processedCount;
    }

    /**
     * Process single company with caching optimization
     */
    async processCompanyOptimized(company, index) {
        const startTime = Date.now();
        
        try {
            console.log(`     [${index}] ${company.website}`);

            // Initialize result
            const result = {
                website: company.website,
                companyName: company.companyName,
                accountOwner: company.accountOwner,
                processingStatus: 'SUCCESS',
                processingTime: 0,
                cacheHits: 0
            };

            // Check cache for executive data
            let executiveData = null;
            if (this.config.CACHE_ENABLED) {
                executiveData = await this.dataCache.get('executive-research', company.website);
                if (executiveData) {
                    result.cacheHits++;
                    this.stats.cacheHits++;
                }
            }

            // Get executive research (cached or fresh)
            if (!executiveData) {
                executiveData = await this.executiveResearch.researchExecutives(company);
                if (this.config.CACHE_ENABLED && executiveData) {
                    await this.dataCache.set('executive-research', company.website, executiveData);
                }
                this.stats.cacheMisses++;
            }

            // Process executive data
            if (executiveData) {
                result.cfo = executiveData.cfo;
                result.cro = executiveData.cro;
                result.executivesFound = (executiveData.cfo ? 1 : 0) + (executiveData.cro ? 1 : 0);
                this.stats.executivesFound += result.executivesFound;
            }

            // Contact validation with caching
            if (result.cfo || result.cro) {
                const contacts = [result.cfo, result.cro].filter(Boolean);
                for (const contact of contacts) {
                    if (contact.email) {
                        // Check cache for validation
                        let validationResult = null;
                        if (this.config.CACHE_ENABLED) {
                            validationResult = await this.dataCache.get('email-validation', contact.email);
                            if (validationResult) {
                                result.cacheHits++;
                                this.stats.cacheHits++;
                            }
                        }

                        if (!validationResult) {
                            validationResult = await this.contactValidator.validateEmail(contact.email);
                            if (this.config.CACHE_ENABLED && validationResult) {
                                await this.dataCache.set('email-validation', contact.email, validationResult);
                            }
                            this.stats.cacheMisses++;
                        }

                        if (validationResult) {
                            contact.emailValidation = validationResult;
                            if (validationResult.isValid) {
                                this.stats.emailsValidated++;
                            }
                        }
                    }
                }
            }

            result.processingTime = Date.now() - startTime;
            console.log(`     [${index}] ✅ Completed in ${result.processingTime}ms (cache hits: ${result.cacheHits})`);
            
            return result;

        } catch (error) {
            console.log(`     [${index}] ❌ Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Save progress backup
     */
    async saveProgressBackup(processedCount) {
        try {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupDir = path.join(__dirname, '../../outputs/recovery');
            
            if (!fs.existsSync(backupDir)) {
                fs.mkdirSync(backupDir, { recursive: true });
            }
            
            const backupFile = path.join(backupDir, `fast-pipeline-backup-${processedCount}-companies-${timestamp}.json`);
            
            const backupData = {
                timestamp: new Date().toISOString(),
                processedCount,
                stats: this.stats,
                results: this.results
            };
            
            fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
            console.log(`   💾 Progress saved: ${processedCount} companies (${backupFile.split('/').pop()})`);
        } catch (error) {
            console.error(`   ⚠️ Failed to save progress: ${error.message}`);
        }
    }

    /**
     * Generate final outputs
     */
    async generateOutputs() {
        const timestamp = new Date().toISOString().split('T')[0];
        const outputDir = path.join(__dirname, `../../outputs/v${this.getNextVersionNumber()}`);
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate CSV
        await this.generateCSV(outputDir);
        
        // Generate JSON
        await this.generateJSON(outputDir);
        
        console.log(`   📁 Outputs saved to: ${outputDir}`);
    }

    /**
     * Generate CSV output
     */
    async generateCSV(outputDir) {
        const csvPath = path.join(outputDir, 'fast-core-cro-cfo-contacts.csv');
        const csvWriter = createCsvWriter({
            path: csvPath,
            header: [
                { id: 'website', title: 'Website' },
                { id: 'companyName', title: 'Company Name' },
                { id: 'accountOwner', title: 'Account Owner' },
                { id: 'cfoName', title: 'CFO Name' },
                { id: 'cfoTitle', title: 'CFO Title' },
                { id: 'cfoEmail', title: 'CFO Email' },
                { id: 'cfoEmailValid', title: 'CFO Email Valid' },
                { id: 'croName', title: 'CRO Name' },
                { id: 'croTitle', title: 'CRO Title' },
                { id: 'croEmail', title: 'CRO Email' },
                { id: 'croEmailValid', title: 'CRO Email Valid' },
                { id: 'processingTime', title: 'Processing Time (ms)' },
                { id: 'cacheHits', title: 'Cache Hits' }
            ]
        });

        const csvData = this.results.map(result => ({
            website: result.website,
            companyName: result.companyName,
            accountOwner: result.accountOwner,
            cfoName: result.cfo?.name || '',
            cfoTitle: result.cfo?.title || '',
            cfoEmail: result.cfo?.email || '',
            cfoEmailValid: result.cfo?.emailValidation?.isValid ? 'Yes' : 'No',
            croName: result.cro?.name || '',
            croTitle: result.cro?.title || '',
            croEmail: result.cro?.email || '',
            croEmailValid: result.cro?.emailValidation?.isValid ? 'Yes' : 'No',
            processingTime: result.processingTime || 0,
            cacheHits: result.cacheHits || 0
        }));

        await csvWriter.writeRecords(csvData);
        console.log(`   📊 CSV generated: fast-core-cro-cfo-contacts.csv (${csvData.length} rows)`);
    }

    /**
     * Generate JSON output
     */
    async generateJSON(outputDir) {
        const jsonPath = path.join(outputDir, 'fast-core-cro-cfo-data.json');
        
        const jsonData = {
            metadata: {
                generatedAt: new Date().toISOString(),
                version: this.getNextVersionNumber(),
                pipeline: 'fast-core-pipeline',
                totalCompanies: this.results.length,
                processingTime: Date.now() - this.stats.startTime,
                performance: this.getPerformanceMetrics()
            },
            stats: this.stats,
            cacheStats: this.dataCache.getStats(),
            results: this.results
        };

        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
        console.log(`   📋 JSON generated: fast-core-cro-cfo-data.json`);
    }

    /**
     * Get next version number
     */
    getNextVersionNumber() {
        const outputsDir = path.join(__dirname, '../../outputs');
        if (!fs.existsSync(outputsDir)) return 50;
        
        const versions = fs.readdirSync(outputsDir)
            .filter(dir => dir.startsWith('v'))
            .map(dir => parseInt(dir.substring(1)))
            .filter(num => !isNaN(num));
            
        return versions.length > 0 ? Math.max(...versions) + 1 : 50;
    }

    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        const totalTime = Date.now() - this.stats.startTime;
        const avgTimePerCompany = this.stats.companiesProcessed > 0 ? 
            Math.round(totalTime / this.stats.companiesProcessed) : 0;
        
        return {
            totalProcessingTimeMs: totalTime,
            totalProcessingTimeMinutes: Math.round(totalTime / 1000 / 60),
            avgTimePerCompanyMs: avgTimePerCompany,
            companiesPerMinute: this.stats.companiesProcessed > 0 ? 
                Math.round((this.stats.companiesProcessed / totalTime) * 60000) : 0,
            parallelizationFactor: this.config.MAX_PARALLEL_COMPANIES
        };
    }

    /**
     * Print performance summary
     */
    printPerformanceSummary() {
        const metrics = this.getPerformanceMetrics();
        const cacheStats = this.dataCache.getStats();
        
        console.log('\n' + '='.repeat(60));
        console.log('📈 PERFORMANCE SUMMARY');
        console.log('='.repeat(60));
        console.log(`⏱️  Total Time: ${metrics.totalProcessingTimeMinutes} minutes`);
        console.log(`⚡ Avg per Company: ${metrics.avgTimePerCompanyMs}ms`);
        console.log(`🚀 Companies/Minute: ${metrics.companiesPerMinute}`);
        console.log(`🔄 Parallel Factor: ${metrics.parallelizationFactor}x`);
        console.log(`💾 Cache Hit Rate: ${cacheStats.hitRate}`);
        console.log(`📊 Companies Processed: ${this.stats.companiesProcessed}`);
        console.log(`👔 Executives Found: ${this.stats.executivesFound}`);
        console.log(`📧 Emails Validated: ${this.stats.emailsValidated}`);
        
        // Calculate improvement vs sequential
        const sequentialTime = this.stats.companiesProcessed * 130; // 130s per company sequential
        const actualTime = metrics.totalProcessingTimeMs / 1000;
        const speedup = Math.round(sequentialTime / actualTime);
        
        console.log(`\n🎯 SPEED IMPROVEMENT:`);
        console.log(`   Sequential estimate: ${Math.round(sequentialTime/3600)} hours`);
        console.log(`   Actual time: ${Math.round(actualTime/60)} minutes`);
        console.log(`   Speed improvement: ${speedup}x faster`);
        console.log('='.repeat(60));
    }
}

// CLI execution
if (require.main === module) {
    const pipeline = new FastCorePipeline();
    const inputFile = process.argv[2] || 'inputs/all-1000-companies.csv';
    
    pipeline.run(inputFile)
        .then(() => {
            console.log('\n🎉 FAST PIPELINE COMPLETED SUCCESSFULLY!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n💥 PIPELINE FAILED:', error);
            process.exit(1);
        });
}

module.exports = FastCorePipeline;
