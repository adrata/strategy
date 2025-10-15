#!/usr/bin/env node

/**
 * POWERHOUSE PIPELINE
 * 
 * Maximum intelligence pipeline that:
 * 1. Processes companies from CSV with comprehensive executive research
 * 2. Adds parent company, PE firm, and VC firm intelligence (FULL EXPANSION)
 * 3. Integrates CoreSignal people data (emails, experience, salary)
 * 4. Generates AI-powered buyer group analysis for each company
 * 5. Produces powerhouse CSV with complete executive intelligence ecosystem
 * 6. Includes PE/VC firm analysis for complete investment landscape
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createObjectCsvWriter } = require('csv-writer');

// Load environment variables from parent directory
require('dotenv').config({ path: path.join(__dirname, '../../env/.env.local') });
const { VersionManager } = require('../../version-manager');
const { CompanyResolver } = require('../../modules/CompanyResolver');
const { ExecutiveResearch } = require('../../modules/ExecutiveResearch');
const { PEOwnershipAnalysis } = require('../../modules/PEOwnershipAnalysis');
const { ExecutiveContactIntelligence } = require('../../modules/ExecutiveContactIntelligence');
const { IndustryClassification } = require('../../modules/IndustryClassification');
const { ContactValidator } = require('../../modules/ContactValidator');
const { ValidationEngine } = require('../../modules/ValidationEngine');
const { RelationshipValidator } = require('../../modules/RelationshipValidator');
const { DataEnhancer } = require('../../modules/DataEnhancer');
const { AccuracyOptimizedContacts } = require('../../modules/AccuracyOptimizedContacts');
const { UniversalBuyerGroupAI } = require('../../buyer-groups/universal-buyer-group-ai');
const { ApiCostOptimizer } = require('../../modules/ApiCostOptimizer');
const { ExecutiveTransitionDetector } = require('../../modules/ExecutiveTransitionDetector');

class PowerhousePipeline {
    constructor() {
        // Pass environment variables to all modules that need API keys
        const config = {
            PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
            OPENAI_API_KEY: process.env.OPENAI_API_KEY,
            CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
            LUSHA_API_KEY: process.env.LUSHA_API_KEY
        };

        this.companyResolver = new CompanyResolver(config);
        this.researcher = new ExecutiveResearch(config);
        this.peIntelligence = new PEOwnershipAnalysis(config);
        this.executiveContactIntelligence = new ExecutiveContactIntelligence(config);
        this.versionManager = new VersionManager();
        this.industryClassification = new IndustryClassification(config);
        this.contactValidator = new ContactValidator(config);
        this.validationEngine = new ValidationEngine(config);
        this.relationshipValidator = new RelationshipValidator(config);
        this.dataEnhancer = new DataEnhancer();
        this.accuracyOptimizedContacts = new AccuracyOptimizedContacts();
        this.buyerGroupAI = new UniversalBuyerGroupAI();
        this.results = [];
        this.stats = {
            processed: 0,
            successful: 0,
            errors: 0,
            ceoFound: 0,
            financeFound: 0,
            bothFound: 0,
            highConfidence: 0,
            parentCompaniesAdded: 0,
            relationshipsValidated: 0,
            sourcesFound: 0,
            executiveConnections: 0,
            buyerGroupsGenerated: 0,
            buyerGroupRolesIdentified: 0
        };
    }

    /**
     *  MAIN PIPELINE EXECUTION
     */
    async runPipeline() {
        console.log('POWERHOUSE PIPELINE');
        console.log('=' .repeat(80));
        console.log('Maximum intelligence executive research with complete ecosystem analysis');
        console.log('Real-time web validation and cross-referencing');
        console.log('Perplexity API with sonar-pro model');
        console.log('CoreSignal people intelligence (emails, experience, salary)');
        console.log('AI-powered buyer group analysis for each company');
        console.log('COMPLETE PE/VC firm and parent company research');
        console.log('Industry classification and competitor analysis');

        try {
            // STEP 1: Load companies from CSV
            console.log('\nSTEP 1: Loading Companies');
            const companies = await this.loadCompanies();
            console.log(`   Loaded ${companies.length} companies`);

            // STEP 2: Process each company with executive research
            console.log('\nSTEP 2: Executive Research');
            for (let i = 0; i < companies.length; i++) {
                const company = companies[i];
                console.log(`\n${'-'.repeat(80)}`);
                console.log(`PROCESSING ${i + 1}/${companies.length}: ${company.website}`);
                console.log(`${'-'.repeat(80)}`);
                
                await this.processCompany(company, i + 1);
                
                // Rate limiting between companies
                if (i < companies.length - 1) {
                    console.log('\nRate limiting: 10s delay between companies...');
                    await new Promise(resolve => setTimeout(resolve, 10000));
                }
            }

            // STEP 3: Add parent company, PE firm, and VC firm rows
            console.log('\nSTEP 3: Adding Parent Company, PE, and VC Rows');
            await this.addRelatedCompanyRows();

            // STEP 4: Generate dataset CSV
            console.log('\nSTEP 4: Generating Powerhouse Dataset CSV');
            const version = this.versionManager.getNextVersion();
            await this.generateDatasetCSV(version);

            // STEP 5: Generate metrics file
            console.log('\nSTEP 5: Generating Dataset Metrics');
            await this.generateDatasetMetrics(version);

            // STEP 6: Generate summary report
            console.log('\nSTEP 6: Pipeline Summary');
            this.generateSummary();

            return {
                success: true,
                results: this.results,
                stats: this.stats
            };

        } catch (error) {
            console.error(` Pipeline failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                results: this.results,
                stats: this.stats
            };
        }
    }

    /**
     *  LOAD COMPANIES FROM CSV
     */
    async loadCompanies() {
        return new Promise((resolve, reject) => {
            const companies = [];
            
            // Use command line argument or default file
            const inputFile = process.argv[2] || path.join(__dirname, '../../inputs/test-1-company.csv');
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
     *  PROCESS INDIVIDUAL COMPANY
     */
    async processCompany(company, index) {
        const result = {
            index,
            website: company.website,
            accountOwner: company.accountOwner,
            isTop1000: company.isTop1000,
            companyName: '',
            ceo: {
                name: '',
                title: '',
                confidence: 0,
                source: '',
                validated: false
            },
            financeLeader: {
                name: '',
                title: '',
                confidence: 0,
                source: '',
                validated: false,
                role: '', // CFO, Controller, VP Finance, etc.
                financeResponsibilities: ''
            },
            researchMethod: '',
            overallConfidence: 0,
            riskLevel: 'HIGH',
            processingTime: 0,
            timestamp: new Date().toISOString(),
            validationNotes: [],
            error: null
        };

        const startTime = Date.now();

        try {
            this.stats.processed++;

            // STEP 0: Company Resolution (URL resolution, acquisition detection)
            console.log('Resolving company identity and structure...');
            const companyResolution = await this.companyResolver.resolveCompany(company.website);
            result.companyResolution = companyResolution;
            result.companyName = companyResolution.companyName || this.extractCompanyName(company.website);

            // Enhanced executive research
            const research = await this.researcher.researchExecutives({
                name: result.companyName,
                website: company.website,
                companyResolution: companyResolution
            });

            // Process research results
            if (research.ceo) {
                result.ceo = {
                    name: research.ceo.name || '',
                    title: research.ceo.title || '',
                    confidence: Math.round((research.ceo.confidence || 0) * 100),
                    source: research.ceo.source || '',
                    validated: research.ceo.confidence > 0.8
                };
                this.stats.ceoFound++;
            }

            if (research.financeLeader) {
                result.financeLeader = {
                    name: research.financeLeader.name || '',
                    title: research.financeLeader.title || '',
                    confidence: Math.round((research.financeLeader.confidence || 0) * 100),
                    source: research.financeLeader.source || '',
                    validated: research.financeLeader.confidence > 0.8,
                    role: this.categorizeFinanceRole(research.financeLeader.title || ''),
                    financeResponsibilities: research.financeLeader.financeResponsibilities || ''
                };
                this.stats.financeFound++;
            }

            // Store additional research data
            result.corporateStructure = research.corporateStructure || {};
            result.companyDetails = research.companyDetails || {};
            result.dataFreshness = research.dataFreshness || {};
            result.confidenceExplanation = research.confidenceExplanation || {};

            // STEP 6: PE Ownership Analysis
            console.log(' Analyzing PE ownership...');
            const peAnalysis = await this.peIntelligence.analyzePEOwnership(result.corporateStructure);
            result.peOwnership = peAnalysis;

            // STEP 7: Cost-Effective Intelligence (CoreSignal + Lusha)
            console.log('Adding cost-effective intelligence (CoreSignal + Lusha)...');
            const contactIntelligenceData = await this.executiveContactIntelligence.enhanceExecutiveIntelligence(result);
            result.executiveContactIntelligence = contactIntelligenceData;

            // STEP 8: Industry Classification & Competitor Analysis
            console.log('Analyzing industry classification and competitors...');
            const industryData = await this.industryClassification.analyzeIndustryAndCompetitors(result);
            result.industryIntelligence = industryData;

            // STEP 8.5: AI-Powered Buyer Group Analysis
            console.log('Generating AI-powered buyer group analysis...');
            const buyerGroupData = await this.analyzeBuyerGroup(result);
            result.buyerGroupIntelligence = buyerGroupData;
            if (buyerGroupData.success) {
                this.stats.buyerGroupsGenerated++;
                this.stats.buyerGroupRolesIdentified += buyerGroupData.buyerGroup?.roles?.length || 0;
            }

            // STEP 9: Contact Validation (Email/Phone validation with triangulation)
            console.log('Validating executive contacts...');
            const contactValidation = await this.contactValidator.enrichContacts(
                { executives: { ceo: result.ceo, cfo: result.financeLeader } },
                companyResolution
            );
            result.contactValidation = contactValidation;

            // STEP 10: Comprehensive Data Validation (Risk assessment + Quality metrics)
            console.log('Running comprehensive data validation...');
            const dataValidation = await this.validationEngine.validateExecutiveData(
                contactValidation,
                { executives: { ceo: result.ceo, cfo: result.financeLeader }, sources: ['ExecutiveResearch', 'ExecutiveContactIntelligence'] },
                companyResolution
            );
            result.dataValidation = dataValidation;

            // STEP 7: Relationship Validation & Intelligence Enhancement
            console.log(' Enhancing with relationship intelligence...');
            
            // Only run relationship validation if we have substantial REAL data to validate
            const hasRealCorporateData = result.corporateStructure?.parentCompany && result.corporateStructure.parentCompany !== 'None';
            const hasRealPEData = result.peOwnership?.isPEOwned && result.peOwnership.peOwner !== 'None';
            const hasRealExecutiveData = (result.ceo.name && result.ceo.name !== '') && 
                                        (result.financeLeader.name && result.financeLeader.name !== '');
            
            if (hasRealCorporateData || hasRealPEData || hasRealExecutiveData) {
                
                const smartRelationships = this.createSmartRelationships(result, research);
                const relationshipValidation = await this.relationshipValidator.validateRelationships({
                    companyName: result.companyName,
                    website: company.website
                }, smartRelationships);
                
                // Intelligently merge validation results with existing data
                result.relationshipIntelligence = this.mergeRelationshipIntelligence(result, relationshipValidation);
                
                // Update stats only for successful validations
                if (relationshipValidation.overallConfidence > 70) {
                    this.stats.relationshipsValidated++;
                    this.stats.sourcesFound += relationshipValidation.validationSources?.length || 0;
                    this.stats.executiveConnections += relationshipValidation.executiveConnections?.internalConnections?.length || 0;
                }
            } else {
                // For companies with limited data, create basic relationship intelligence
                result.relationshipIntelligence = this.createBasicRelationshipIntelligence(result);
                console.log('   ℹ️ Limited data - using basic relationship intelligence');
            }

            if (result.ceo.name && result.financeLeader.name) {
                this.stats.bothFound++;
            }

            result.companyName = research.company?.name || this.extractCompanyName(company.website);
            result.researchMethod = research.researchMethod || 'enhanced_research';
            result.overallConfidence = Math.round((research.confidence || 0) * 100);
            
            // Risk assessment
            result.riskLevel = this.assessRisk(result);
            
            if (result.overallConfidence >= 80) {
                this.stats.highConfidence++;
            }

            // Validation notes
            result.validationNotes = this.generateValidationNotes(research, result);

            this.stats.successful++;

            console.log(` SUCCESS: ${result.companyName}`);
            console.log(`   CEO: ${result.ceo.name || 'Not found'} (${result.ceo.confidence}%)`);
            console.log(`   Finance: ${result.financeLeader.name || 'Not found'} (${result.financeLeader.confidence}%)`);
            console.log(`   Role: ${result.financeLeader.role || 'N/A'}`);
            console.log(`   Method: ${result.researchMethod}`);
            console.log(`   Overall: ${result.overallConfidence}% confidence, ${result.riskLevel} risk`);
            console.log(`   Relationship Intelligence: ${result.relationshipIntelligence?.overallConfidence || 0}% confidence`);
            console.log(`   Sources: ${result.relationshipIntelligence?.validationSources?.length || 0} validated`);

        } catch (error) {
            console.error(` Error processing ${company.website}: ${error.message}`);
            result.error = error.message;
            result.riskLevel = 'CRITICAL';
            this.stats.errors++;
        }

        result.processingTime = Date.now() - startTime;
        this.results.push(result);
    }

    /**
     *  ADD RELATED COMPANY ROWS
     * 
     * Analyzes results and adds:
     * 1. Parent companies (corporate parents)
     * 2. PE firms (private equity owners)
     * 3. VC firms (venture capital investors)
     * 
     * Each with appropriate executive research for their industry type
     */
    async addRelatedCompanyRows() {
        const relatedCompaniesToAdd = [];
        const processedCompanies = new Set();

        for (const result of this.results) {
            // 1. ADD PARENT COMPANIES
            await this.addParentCompanyIfNeeded(result, relatedCompaniesToAdd, processedCompanies);
            
            // 2. ADD PE FIRMS
            await this.addPEFirmIfNeeded(result, relatedCompaniesToAdd, processedCompanies);
            
            // 3. ADD VC FIRMS (if different from PE)
            await this.addVCFirmIfNeeded(result, relatedCompaniesToAdd, processedCompanies);
        }

        // Add all related company results to the main results
        this.results.push(...relatedCompaniesToAdd);
        this.stats.parentCompaniesAdded = relatedCompaniesToAdd.length;
        
        console.log(`    Added ${relatedCompaniesToAdd.length} related company rows`);
    }

    /**
     * Add parent company row if needed
     */
    async addParentCompanyIfNeeded(result, relatedCompaniesToAdd, processedCompanies) {
        const parentCompany = result.corporateStructure?.parentCompany;
        
        if (parentCompany && 
            parentCompany !== 'None' && 
            !processedCompanies.has(parentCompany) &&
            this.shouldAddParentCompany(result)) {
            
            console.log(` Processing parent company: ${parentCompany}`);
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
     * Add PE firm row if needed
     */
    async addPEFirmIfNeeded(result, relatedCompaniesToAdd, processedCompanies) {
        const peOwnership = result.peOwnership;
        
        if (peOwnership?.isPEOwned && 
            peOwnership.peOwner !== 'None' &&
            !processedCompanies.has(peOwnership.peOwner)) {
            
            console.log(` Processing PE firm: ${peOwnership.peOwner}`);
            processedCompanies.add(peOwnership.peOwner);
            
            try {
                const peResult = await this.researchRelatedCompany(
                    peOwnership.peOwner,
                    result,
                    'pe_firm',
                    'PE/Investment Firm Executives'
                );
                if (peResult) {
                    relatedCompaniesToAdd.push(peResult);
                    console.log(`    Added PE firm: ${peOwnership.peOwner}`);
                }
            } catch (error) {
                console.error(`    Failed to research PE firm ${peOwnership.peOwner}: ${error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    /**
     * Add VC firm row if needed (separate from PE)
     */
    async addVCFirmIfNeeded(result, relatedCompaniesToAdd, processedCompanies) {
        // Check if parent company is a VC firm (different from PE)
        const parentCompany = result.corporateStructure?.parentCompany;
        
        if (parentCompany && 
            !processedCompanies.has(parentCompany) &&
            this.isVCFirm(parentCompany) &&
            !result.peOwnership?.isPEOwned) {
            
            console.log(`🚀 Processing VC firm: ${parentCompany}`);
            processedCompanies.add(parentCompany);
            
            try {
                const vcResult = await this.researchRelatedCompany(
                    parentCompany,
                    result,
                    'vc_firm', 
                    'VC/Investment Firm Executives'
                );
                if (vcResult) {
                    relatedCompaniesToAdd.push(vcResult);
                    console.log(`    Added VC firm: ${parentCompany}`);
                }
            } catch (error) {
                console.error(`    Failed to research VC firm ${parentCompany}: ${error.message}`);
            }
            
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    /**
     * Determine if a parent company should be added as a separate row
     */
    shouldAddParentCompany(result) {
        const parentCompany = result.corporateStructure?.parentCompany;
        const changeType = result.corporateStructure?.changeType;
        
        // Skip generic holding companies
        const holdingPatterns = ['Holdings', 'Holding Co', 'LLC', 'Inc.', 'Ltd.'];
        if (holdingPatterns.some(pattern => parentCompany.includes(pattern) && parentCompany.length < 30)) {
            return false;
        }

        // Always add PE firms
        if (result.peOwnership?.isPEOwned && result.peOwnership.peOwner === parentCompany) {
            return true;
        }

        // Add significant corporate parents
        if (changeType === 'acquisition' || changeType === 'merger') {
            return true;
        }

        // Add pending acquisitions
        if (parentCompany.includes('pending')) {
            return true;
        }

        return false;
    }

    /**
     * Research related company (parent, PE, or VC) executives and details
     */
    async researchRelatedCompany(companyName, subsidiaryResult, companyType, executiveContext) {
        // Create company info for research
        const companyInfo = {
            name: this.cleanCompanyName(companyName),
            website: await this.guessCompanyWebsite(companyName, companyType)
        };

        console.log(`    Researching: ${companyInfo.name} (${companyInfo.website})`);

        // Use specialized research based on company type
        let research;
        if (companyType === 'pe_firm' || companyType === 'vc_firm') {
            research = await this.researchInvestmentFirmExecutives(companyInfo, companyType);
        } else {
            research = await this.researcher.researchExecutives(companyInfo);
        }
        
        if (!research.ceo && !research.financeLeader) {
            console.log(`   ⚠️ No executives found for ${companyName}`);
            return null;
        }

        // Create result structure
        const relatedResult = {
            index: this.results.length + 1,
            website: companyInfo.website,
            accountOwner: subsidiaryResult.accountOwner,
            isTop1000: false,
            companyName: companyInfo.name,
            ceo: research.ceo || { name: '', title: '', confidence: 0, source: '', validated: false },
            financeLeader: research.financeLeader || { name: '', title: '', confidence: 0, source: '', validated: false, role: '' },
            researchMethod: research.researchMethod || `${companyType}_research`,
            overallConfidence: research.confidence || 0,
            riskLevel: companyType === 'pe_firm' || companyType === 'vc_firm' ? 'LOW' : 'MEDIUM',
            processingTime: Date.now() - Date.now(),
            timestamp: new Date().toISOString(),
            validationNotes: [this.getRelationshipNote(companyType, subsidiaryResult.companyName)],
            error: null,
            corporateStructure: research.corporateStructure || {},
            companyDetails: research.companyDetails || {},
            dataFreshness: research.dataFreshness || {},
            confidenceExplanation: research.confidenceExplanation || {},
            peOwnership: companyType === 'pe_firm' ? this.createPEFirmSelfOwnership() : 
                        await this.peIntelligence.analyzePEOwnership(research.corporateStructure || {})
        };

        // Mark relationship type
        relatedResult.corporateStructure.relationshipType = companyType;
        relatedResult.corporateStructure.relatedCompanies = [subsidiaryResult.companyName];

        return relatedResult;
    }

    /**
     * Research investment firm executives (PE/VC specific)
     */
    async researchInvestmentFirmExecutives(companyInfo, firmType) {
        const firmTypeLabel = firmType === 'pe_firm' ? 'private equity' : 'venture capital';
        
        const prompt = `Find the senior executives of ${companyInfo.name} (${companyInfo.website}), a ${firmTypeLabel} firm.

For ${firmTypeLabel} firms, focus on:
- Managing Partner, Senior Partner, or CEO
- Chief Financial Officer, Chief Operating Officer, or Head of Finance
- Investment Partners with senior roles
- Principals with significant authority

Please provide ONLY a JSON response:
{
    "ceo": {
        "name": "Senior executive name (Managing Partner, CEO, Senior Partner)",
        "title": "Exact title",
        "source": "company_website/press_release/news",
        "confidence": 0.95,
        "lastVerified": "2025-01-17"
    },
    "financeLeader": {
        "name": "Finance executive name (CFO, COO, Head of Finance)",
        "title": "Exact title", 
        "source": "company_website/press_release/news",
        "confidence": 0.85,
        "financeRole": "investment_firm_finance",
        "lastVerified": "2025-01-17"
    },
    "companyInfo": {
        "officialName": "Official firm name",
        "firmType": "${firmTypeLabel}",
        "aum": "Assets under management",
        "lastUpdate": "2025-01-17"
    },
    "researchNotes": "Key findings about the firm's leadership structure"
}

Focus on senior decision-makers who would be involved in portfolio company oversight and investment decisions.`;

        return await this.researcher.callPerplexityAPI(prompt, `${firmType}_executives`);
    }

    /**
     * Identify if a company is a VC firm
     */
    isVCFirm(companyName) {
        const vcPatterns = [
            'Ventures', 'Venture Capital', 'VC', 'Venture Partners',
            'Seed', 'Early Stage', 'Growth Capital', 'Investment Partners'
        ];
        
        return vcPatterns.some(pattern => 
            companyName.toLowerCase().includes(pattern.toLowerCase())
        );
    }

    /**
     * Get relationship note based on company type
     */
    getRelationshipNote(companyType, subsidiaryName) {
        const notes = {
            'parent_company': `Parent company of ${subsidiaryName}`,
            'pe_firm': `Private equity owner of ${subsidiaryName}`,
            'vc_firm': `Venture capital investor in ${subsidiaryName}`
        };
        return notes[companyType] || `Related to ${subsidiaryName}`;
    }

    /**
     * Create PE firm self-ownership result
     */
    createPEFirmSelfOwnership() {
        return {
            isPEOwned: false, // PE firms own themselves
            peOwner: 'Self (PE Firm)',
            peOwnerFullName: 'Self (Private Equity Firm)',
            peOwnerType: 'PE Firm Entity',
            peOwnerAUM: 'Self-managed',
            peFocus: 'Investment management',
            peHoldingPeriod: 'N/A',
            peExitStrategy: 'N/A',
            peInvestmentThesis: 'Portfolio management',
            peSalesImplications: 'Investment firm decision makers',
            peStrategicNotes: 'Private equity firm - focus on portfolio management and investment decisions'
        };
    }

    /**
     * Clean company name for research
     */
    cleanCompanyName(companyName) {
        // Remove common suffixes and clarifications
        return companyName
            .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical info
            .replace(/\s*(Holdings?|Holding Co\.?|LLC|Inc\.?|Ltd\.?|Corp\.?)\s*$/i, '') // Remove entity types
            .trim();
    }

    /**
     * Guess company website based on type (AI-DRIVEN)
     */
    async guessCompanyWebsite(companyName, companyType) {
        const cleanName = this.cleanCompanyName(companyName)
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ''); // Remove special characters
        
        // Use AI to research the likely website for investment firms
        try {
            const prompt = `What is the official website for ${companyName}?

Provide ONLY a JSON response:
{
    "website": "www.company.com",
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
                    max_tokens: 150
                })
            });

            if (response.ok) {
                const data = await response.json();
                const content = data.choices[0].message.content;
                
                try {
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        if (result.website) {
                            console.log(`   🎯 AI-researched website: ${result.website}`);
                            return result.website;
                        }
                    }
                } catch (parseError) {
                    console.log(`   ⚠️ Website research parsing failed`);
                }
            }
        } catch (error) {
            console.log(`   ⚠️ Website research failed: ${error.message}`);
        }

        // Fallback: Generate based on cleaned name
        return `www.${cleanName}.com`;
    }

    /**
     *  GENERATE FINAL CSV
     */
    async generateDatasetCSV() {
        // Create outputs directory if it doesn't exist
        const outputsDir = path.join(__dirname, '../../outputs');
        const outputsV8Dir = path.join(__dirname, '../../outputs/v8');
        const outputsLatestDir = path.join(__dirname, '../../outputs/latest');
        
        if (!fs.existsSync(outputsDir)) {
            fs.mkdirSync(outputsDir, { recursive: true });
        }
        if (!fs.existsSync(outputsV8Dir)) {
            fs.mkdirSync(outputsV8Dir, { recursive: true });
        }
        if (!fs.existsSync(outputsLatestDir)) {
            fs.mkdirSync(outputsLatestDir, { recursive: true });
        }

        const csvWriter = createObjectCsvWriter({
            path: path.join(__dirname, '../../outputs/v8/executive-intelligence-dataset.csv'),
            header: [
                // Basic Company Info
                { id: 'website', title: 'Original Website' },
                { id: 'finalDomain', title: 'Current Domain' },
                { id: 'companyName', title: 'Company Name' },
                { id: 'accountOwner', title: 'Account Owner' },
                { id: 'isTop1000', title: 'Top 1000' },
                
                // Corporate Structure
                { id: 'isAcquired', title: 'Is Acquired' },
                { id: 'isRebranded', title: 'Is Rebranded' },
                { id: 'parentCompany', title: 'Parent Company' },
                { id: 'changeType', title: 'Change Type' },
                { id: 'changeDate', title: 'Change Date' },
                
                // Company Details
                { id: 'isPublic', title: 'Public/Private' },
                { id: 'ticker', title: 'Stock Ticker' },
                { id: 'exchange', title: 'Stock Exchange' },
                { id: 'industry', title: 'Industry' },
                { id: 'employeeCount', title: 'Total Employees' },
                { id: 'headquarters', title: 'HQ Location' },
                
                // Executive Data
                { id: 'ceoName', title: 'CEO Name' },
                { id: 'ceoTitle', title: 'CEO Title' },
                { id: 'ceoConfidence', title: 'CEO Confidence' },
                { id: 'ceoSource', title: 'CEO Source' },
                { id: 'financeLeaderName', title: 'Finance Leader Name' },
                { id: 'financeLeaderTitle', title: 'Finance Leader Title' },
                { id: 'financeRole', title: 'Finance Role Type' },
                { id: 'financeConfidence', title: 'Finance Confidence' },
                { id: 'financeSource', title: 'Finance Source' },
                
                // PE Ownership Intelligence
                { id: 'isPEOwned', title: 'PE Owned' },
                { id: 'peOwner', title: 'PE Owner' },
                { id: 'peOwnerFullName', title: 'PE Owner Full Name' },
                { id: 'peOwnerAUM', title: 'PE AUM' },
                { id: 'peFocus', title: 'PE Focus' },
                { id: 'peExitTimeline', title: 'PE Exit Timeline' },
                { id: 'peStrategicNotes', title: 'PE Strategic Notes' },
                
                // Cost-Effective Intelligence (CoreSignal + Lusha)
                { id: 'ceoVerifiedEmail', title: 'CEO Verified Email' },
                { id: 'ceoPhone', title: 'CEO Phone' },
                { id: 'ceoLinkedIn', title: 'CEO LinkedIn' },
                { id: 'ceoEmailSource', title: 'CEO Email Source' },
                { id: 'cfoVerifiedEmail', title: 'CFO Verified Email' },
                { id: 'cfoPhone', title: 'CFO Phone' },
                { id: 'cfoLinkedIn', title: 'CFO LinkedIn' },
                { id: 'cfoEmailSource', title: 'CFO Email Source' },
                { id: 'companyEmployeeCount', title: 'Company Total Employees (CoreSignal)' },
                { id: 'companyEmployeeGrowth', title: 'Company Employee Growth %' },
                { id: 'companyIndustry', title: 'Company Industry (CoreSignal)' },
                { id: 'companyFoundedYear', title: 'Company Founded Year' },
                { id: 'companyHeadquarters', title: 'Company HQ Location' },
                { id: 'companyActiveJobPostings', title: 'Active Job Postings' },
                { id: 'hiringVelocity', title: 'Hiring Velocity' },
                { id: 'dataQualityScore', title: 'Data Quality Score' },
                { id: 'intelligenceSources', title: 'Intelligence Sources' },
                { id: 'creditsUsed', title: 'API Credits Used' },
                
                // Industry Classification & Competitors
                { id: 'naicsCode', title: 'NAICS Code' },
                { id: 'naicsDescription', title: 'NAICS Description' },
                { id: 'sicCode', title: 'SIC Code' },
                { id: 'sicDescription', title: 'SIC Description' },
                { id: 'primarySector', title: 'Primary Sector' },
                { id: 'businessVertical', title: 'Business Vertical' },
                { id: 'marketSegment', title: 'Market Segment' },
                { id: 'directCompetitors', title: 'Direct Competitors' },
                { id: 'marketLeaders', title: 'Market Leaders' },
                { id: 'competitivePosition', title: 'Competitive Position' },
                { id: 'industryTrends', title: 'Industry Trends' },
                { id: 'strategicContext', title: 'Strategic Context' },
                
                // Buyer Group Intelligence
                { id: 'buyerGroupSuccess', title: 'Buyer Group Analysis Success' },
                { id: 'buyerGroupRoleCount', title: 'Buyer Group Role Count' },
                { id: 'buyerGroupDecisionMakers', title: 'Decision Makers' },
                { id: 'buyerGroupChampions', title: 'Champions' },
                { id: 'buyerGroupInfluencers', title: 'Influencers' },
                { id: 'buyerGroupFinancialStakeholders', title: 'Financial Stakeholders' },
                { id: 'buyerGroupProcurement', title: 'Procurement Stakeholders' },
                { id: 'buyerGroupBlockers', title: 'Potential Blockers' },
                { id: 'buyerGroupIntroducers', title: 'Introducers' },
                { id: 'buyerGroupSalesStrategy', title: 'Recommended Sales Strategy' },
                { id: 'buyerGroupComplexity', title: 'Buyer Group Complexity' },
                { id: 'buyerGroupInfluence', title: 'Buyer Group Influence Score' },
                
                // Data Quality
                { id: 'overallConfidence', title: 'Overall Confidence' },
                { id: 'confidenceExplanation', title: 'Confidence Explanation' },
                { id: 'lastExecutiveChange', title: 'Last Executive Change' },
                { id: 'dataAge', title: 'Data Freshness' },
                { id: 'validationStatus', title: 'Validation Status' },
                
                // Relationship Intelligence
                { id: 'relationshipConfidence', title: 'Relationship Confidence' },
                { id: 'validationSources', title: 'Validation Sources Count' },
                { id: 'organizationalStructure', title: 'Organizational Structure' },
                { id: 'reportingRelationship', title: 'Reporting Relationship' },
                { id: 'executiveConnections', title: 'Executive Connections' },
                { id: 'corporateValidation', title: 'Corporate Structure Validation' },
                
                { id: 'researchDate', title: 'Research Date' }
            ]
        });

        const csvData = this.results.map(result => ({
            // Basic Company Info
            website: result.website,
            finalDomain: result.corporateStructure?.finalDomain || result.website,
            companyName: result.companyName,
            accountOwner: result.accountOwner,
            isTop1000: result.isTop1000 ? 'Yes' : 'No',
            
            // Corporate Structure
            isAcquired: result.corporateStructure?.isAcquired ? 'Yes' : 'No',
            isRebranded: result.corporateStructure?.isRebranded ? 'Yes' : 'No',
            parentCompany: result.corporateStructure?.parentCompany || '',
            changeType: result.corporateStructure?.changeType || 'None',
            changeDate: result.corporateStructure?.changeDate || '',
            
            // Company Details
            isPublic: result.companyDetails?.isPublic ? 'Public' : 'Private',
            ticker: result.companyDetails?.ticker || '',
            exchange: result.companyDetails?.exchange || '',
            industry: result.companyDetails?.industry || '',
            employeeCount: result.companyDetails?.employeeCount || '',
            headquarters: result.companyDetails?.headquarters || '',
            
            // Executive Data
            ceoName: result.ceo.name,
            ceoTitle: result.ceo.title,
            ceoConfidence: `${result.ceo.confidence}%`,
            ceoSource: result.ceo.source || '',
            financeLeaderName: result.financeLeader.name,
            financeLeaderTitle: result.financeLeader.title,
            financeRole: result.financeLeader.role,
            financeConfidence: `${result.financeLeader.confidence}%`,
            financeSource: result.financeLeader.source || '',
            
            // PE Ownership Intelligence
            isPEOwned: result.peOwnership?.isPEOwned ? 'Yes' : 'No',
            peOwner: result.peOwnership?.peOwner || 'None',
            peOwnerFullName: result.peOwnership?.peOwnerFullName || null,
            peOwnerAUM: result.peOwnership?.peOwnerAUM || null,
            peFocus: result.peOwnership?.peFocus || null,
            peExitTimeline: result.peOwnership?.isPEOwned && result.corporateStructure?.changeDate ? 
                this.peIntelligence.calculatePEExitTimeline(result.corporateStructure.changeDate, result.peOwnership.peHoldingPeriod) : null,
            peStrategicNotes: result.peOwnership?.peStrategicNotes || null,
            
            // Cost-Effective Intelligence (CoreSignal + Lusha)
            ceoVerifiedEmail: this.getExecutiveEmail(result.executiveContactIntelligence?.executiveContacts?.executives, 'CEO') || null,
            ceoPhone: this.getExecutivePhone(result.executiveContactIntelligence?.executiveContacts?.executives, 'CEO') || null,
            ceoLinkedIn: this.getExecutiveLinkedIn(result.executiveContactIntelligence?.executiveContacts?.executives, 'CEO') || null,
            ceoEmailSource: this.getExecutiveEmailSource(result.executiveContactIntelligence?.executiveContacts?.executives, 'CEO') || null,
            cfoVerifiedEmail: this.getExecutiveEmail(result.executiveContactIntelligence?.executiveContacts?.executives, 'CFO') || null,
            cfoPhone: this.getExecutivePhone(result.executiveContactIntelligence?.executiveContacts?.executives, 'CFO') || null,
            cfoLinkedIn: this.getExecutiveLinkedIn(result.executiveContactIntelligence?.executiveContacts?.executives, 'CFO') || null,
            cfoEmailSource: this.getExecutiveEmailSource(result.executiveContactIntelligence?.executiveContacts?.executives, 'CFO') || null,
            companyEmployeeCount: result.executiveContactIntelligence?.companyIntelligence?.employeeCount || null,
            companyEmployeeGrowth: result.executiveContactIntelligence?.companyIntelligence?.employeeGrowth || null,
            companyIndustry: result.executiveContactIntelligence?.companyIntelligence?.industry || null,
            companyFoundedYear: result.executiveContactIntelligence?.companyIntelligence?.foundedYear || null,
            companyHeadquarters: this.formatHeadquarters(result.executiveContactIntelligence?.companyIntelligence?.headquarters) || null,
            companyActiveJobPostings: result.executiveContactIntelligence?.hiringIntelligence?.totalJobPostings || null,
            hiringVelocity: result.executiveContactIntelligence?.hiringIntelligence?.hiringVelocity || null,
            dataQualityScore: `${result.executiveContactIntelligence?.dataQuality?.confidence || 0}%`,
            intelligenceSources: result.executiveContactIntelligence?.dataQuality?.sources?.join(', ') || null,
            creditsUsed: result.executiveContactIntelligence?.dataQuality?.creditsUsed || null,
            
            // Industry Classification & Competitors
            naicsCode: result.industryIntelligence?.industryClassification?.naicsCode || null,
            naicsDescription: result.industryIntelligence?.industryClassification?.naicsDescription || null,
            sicCode: result.industryIntelligence?.industryClassification?.sicCode || null,
            sicDescription: result.industryIntelligence?.industryClassification?.sicDescription || null,
            primarySector: result.industryIntelligence?.industryClassification?.primarySector || null,
            businessVertical: result.industryIntelligence?.industryClassification?.businessVertical || null,
            marketSegment: result.industryIntelligence?.industryClassification?.marketSegment || null,
            directCompetitors: result.industryIntelligence?.competitorIntelligence?.directCompetitors?.join(', ') || null,
            marketLeaders: result.industryIntelligence?.competitorIntelligence?.marketLeaders?.join(', ') || null,
            competitivePosition: result.industryIntelligence?.competitorIntelligence?.competitivePosition || null,
            industryTrends: result.industryIntelligence?.industryClassification?.industryTrends?.join(', ') || null,
            strategicContext: result.industryIntelligence?.strategicContext || null,
            
            // Buyer Group Intelligence
            buyerGroupSuccess: result.buyerGroupIntelligence?.success ? 'Yes' : 'No',
            buyerGroupRoleCount: result.buyerGroupIntelligence?.buyerGroup?.roles?.length || 0,
            buyerGroupDecisionMakers: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Decision Maker'),
            buyerGroupChampions: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Champion'),
            buyerGroupInfluencers: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Influencer'),
            buyerGroupFinancialStakeholders: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Financial Stakeholder'),
            buyerGroupProcurement: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Procurement Stakeholder'),
            buyerGroupBlockers: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Blocker'),
            buyerGroupIntroducers: this.extractBuyerGroupRoles(result.buyerGroupIntelligence, 'Introducer'),
            buyerGroupSalesStrategy: result.buyerGroupIntelligence?.salesStrategy?.primaryApproach || null,
            buyerGroupComplexity: result.buyerGroupIntelligence?.buyerGroup?.complexity || null,
            buyerGroupInfluence: result.buyerGroupIntelligence?.buyerGroup?.influenceScore ? `${Math.round(result.buyerGroupIntelligence.buyerGroup.influenceScore * 100)}%` : null,
            
            // Data Quality
            overallConfidence: `${result.overallConfidence}%`,
            confidenceExplanation: result.confidenceExplanation?.summary || '',
            lastExecutiveChange: result.dataFreshness?.lastExecutiveChange || '',
            dataAge: result.dataFreshness?.dataAge || null,
            validationStatus: this.getValidationStatus(result),
            
            // Relationship Intelligence
            relationshipConfidence: `${result.relationshipIntelligence?.enhancedConfidence || result.relationshipIntelligence?.overallConfidence || 0}%`,
            validationSources: result.relationshipIntelligence?.validationSources?.length || 0,
            organizationalStructure: this.getOrganizationalStructure(result),
            reportingRelationship: this.getReportingRelationship(result),
            executiveConnections: this.getExecutiveConnections(result),
            corporateValidation: this.getCorporateValidation(result),
            
            researchDate: result.timestamp.split('T')[0] // Just the date
        }));

        await csvWriter.writeRecords(csvData);
        console.log('    Generated: ../../outputs/v8/executive-intelligence-dataset.csv');

        // Also generate detailed JSON for analysis
        fs.writeFileSync(path.join(__dirname, '../../outputs/v8/executive-intelligence-data.json'), JSON.stringify(this.results, null, 2));
        console.log('    Generated: ../../outputs/v8/executive-intelligence-data.json');
    }

    /**
     *  GENERATE COMPREHENSIVE DATASET METRICS
     */
    async generateDatasetMetrics() {
        const metrics = {
            // PIPELINE PERFORMANCE
            pipelinePerformance: {
                executionDate: new Date().toISOString().split('T')[0],
                totalProcessingTime: this.results.reduce((sum, r) => sum + (r.processingTime || 0), 0),
                avgProcessingTimePerCompany: Math.round(this.results.reduce((sum, r) => sum + (r.processingTime || 0), 0) / this.stats.processed / 1000),
                successRate: Math.round((this.stats.successful / this.stats.processed) * 100),
                errorRate: Math.round((this.stats.errors / this.stats.processed) * 100)
            },

            // DATASET OVERVIEW
            datasetOverview: {
                originalCompanies: this.stats.processed,
                parentCompaniesAdded: this.stats.parentCompaniesAdded,
                totalRowsGenerated: this.results.length,
                expansionRatio: Math.round((this.results.length / this.stats.processed) * 100) / 100,
                dataCompleteness: this.calculateDataCompleteness()
            },

            // EXECUTIVE INTELLIGENCE
            executiveIntelligence: {
                ceoDetectionRate: Math.round((this.stats.ceoFound / this.stats.processed) * 100),
                financeLeaderDetectionRate: Math.round((this.stats.financeFound / this.stats.processed) * 100),
                bothExecutivesFoundRate: Math.round((this.stats.bothFound / this.stats.processed) * 100),
                avgCEOConfidence: this.calculateAvgCEOConfidence(),
                avgFinanceConfidence: this.calculateAvgFinanceConfidence(),
                avgOverallConfidence: this.calculateAvgOverallConfidence(),
                highConfidenceRate: Math.round((this.stats.highConfidence / this.stats.processed) * 100),
                financeRoleBreakdown: this.getFinanceRoleBreakdown(),
                executiveTitleVariations: this.getExecutiveTitleVariations()
            },

            // CORPORATE STRUCTURE ANALYSIS
            corporateStructure: {
                independentCompanies: this.countByStatus('Independent'),
                subsidiaries: this.countByStatus('Subsidiary'),
                parentCompanies: this.countByStatus('Parent'),
                publicCompanies: this.countPublicPrivate('Public'),
                privateCompanies: this.countPublicPrivate('Private'),
                acquisitionActivity: this.analyzeAcquisitionActivity(),
                corporateChanges: this.analyzeCorporateChanges()
            },

            // PE/VC OWNERSHIP INTELLIGENCE
            peVcIntelligence: {
                peOwnedCompanies: this.countPEOwned(),
                peOwnedPercentage: Math.round((this.countPEOwned() / this.stats.processed) * 100),
                identifiedPEFirms: this.getUniquePEFirms(),
                peExitTimelines: this.analyzePEExitTimelines(),
                peStrategicImplications: this.summarizePEImplications(),
                vcFirmsIdentified: this.getUniqueVCFirms()
            },

            // INDUSTRY & GEOGRAPHIC ANALYSIS
            industryGeographic: {
                industryBreakdown: this.getIndustryBreakdown(),
                geographicDistribution: this.getGeographicDistribution(),
                companySize: this.getCompanySizeDistribution(),
                publicPrivateRatio: this.getPublicPrivateRatio()
            },

            // DATA QUALITY ASSESSMENT
            dataQuality: {
                overallDataQuality: this.assessOverallDataQuality(),
                confidenceDistribution: this.getConfidenceDistribution(),
                riskLevelDistribution: this.getRiskLevelDistribution(),
                validationStatus: this.getValidationStatusBreakdown(),
                dataFreshnessAnalysis: this.analyzeDataFreshness(),
                sourceReliability: this.analyzeSourceReliability()
            },

            // STRATEGIC INSIGHTS
            strategicInsights: {
                topTargetCompanies: this.identifyTopTargets(),
                highValueOpportunities: this.identifyHighValueOpportunities(),
                riskFactors: this.identifyKeyRiskFactors(),
                contactStrategy: this.recommendContactStrategy(),
                territoryAnalysis: this.analyzeTerritoryDistribution()
            }
        };

        // Generate JSON metrics file
        const metricsJson = JSON.stringify(metrics, null, 2);
        fs.writeFileSync(path.join(__dirname, '../../outputs/v8/dataset-metrics.json'), metricsJson);
        console.log('    Generated: ../../outputs/v8/dataset-metrics.json');

        // Generate human-readable metrics report
        await this.generateMetricsReport(metrics);
        console.log('    Generated: ../../outputs/v8/dataset-metrics-report.md');
    }

    /**
     *  METRICS CALCULATION METHODS
     */
    calculateDataCompleteness() {
        const fields = ['ceo.name', 'financeLeader.name', 'companyName', 'corporateStructure.parentCompany'];
        let totalFields = 0;
        let completedFields = 0;

        this.results.forEach(result => {
            totalFields += fields.length;
            if (result.ceo?.name) completedFields++;
            if (result.financeLeader?.name) completedFields++;
            if (result.companyName) completedFields++;
            if (result.corporateStructure?.parentCompany) completedFields++;
        });

        return Math.round((completedFields / totalFields) * 100);
    }

    calculateAvgCEOConfidence() {
        const ceoConfidences = this.results
            .filter(r => r.ceo?.confidence)
            .map(r => r.ceo.confidence);
        return ceoConfidences.length > 0 ? 
            Math.round(ceoConfidences.reduce((sum, c) => sum + c, 0) / ceoConfidences.length) : 0;
    }

    calculateAvgFinanceConfidence() {
        const financeConfidences = this.results
            .filter(r => r.financeLeader?.confidence)
            .map(r => r.financeLeader.confidence);
        return financeConfidences.length > 0 ? 
            Math.round(financeConfidences.reduce((sum, c) => sum + c, 0) / financeConfidences.length) : 0;
    }

    calculateAvgOverallConfidence() {
        const overallConfidences = this.results
            .filter(r => r.overallConfidence)
            .map(r => r.overallConfidence);
        return overallConfidences.length > 0 ? 
            Math.round(overallConfidences.reduce((sum, c) => sum + c, 0) / overallConfidences.length) : 0;
    }

    getFinanceRoleBreakdown() {
        const roles = {};
        this.results.forEach(result => {
            const role = result.financeLeader?.role || 'Unknown';
            roles[role] = (roles[role] || 0) + 1;
        });
        return roles;
    }

    getExecutiveTitleVariations() {
        const ceoTitles = {};
        const financeTitles = {};
        
        this.results.forEach(result => {
            if (result.ceo?.title) {
                ceoTitles[result.ceo.title] = (ceoTitles[result.ceo.title] || 0) + 1;
            }
            if (result.financeLeader?.title) {
                financeTitles[result.financeLeader.title] = (financeTitles[result.financeLeader.title] || 0) + 1;
            }
        });
        
        return { ceoTitles, financeTitles };
    }

    countByStatus(status) {
        return this.results.filter(r => {
            if (status === 'Independent') return !r.corporateStructure?.parentCompany;
            if (status === 'Subsidiary') return r.corporateStructure?.parentCompany && !r.corporateStructure?.isParentCompany;
            if (status === 'Parent') return r.corporateStructure?.isParentCompany;
            return false;
        }).length;
    }

    countPublicPrivate(type) {
        return this.results.filter(r => 
            (type === 'Public' && r.companyDetails?.isPublic) ||
            (type === 'Private' && !r.companyDetails?.isPublic)
        ).length;
    }

    countPEOwned() {
        return this.results.filter(r => r.peOwnership?.isPEOwned).length;
    }

    getUniquePEFirms() {
        const peFirms = new Set();
        this.results.forEach(r => {
            if (r.peOwnership?.isPEOwned && r.peOwnership.peOwner !== 'None') {
                peFirms.add(r.peOwnership.peOwner);
            }
        });
        return Array.from(peFirms);
    }

    getUniqueVCFirms() {
        const vcFirms = new Set();
        this.results.forEach(r => {
            const parent = r.corporateStructure?.parentCompany;
            if (parent && this.isVCFirm(parent) && !r.peOwnership?.isPEOwned) {
                vcFirms.add(parent);
            }
        });
        return Array.from(vcFirms);
    }

    getIndustryBreakdown() {
        const industries = {};
        this.results.forEach(result => {
            const industry = result.companyDetails?.industry || 'Unknown';
            industries[industry] = (industries[industry] || 0) + 1;
        });
        return industries;
    }

    getGeographicDistribution() {
        const locations = {};
        this.results.forEach(result => {
            const hq = result.companyDetails?.headquarters || 'Unknown';
            locations[hq] = (locations[hq] || 0) + 1;
        });
        return locations;
    }

    getCompanySizeDistribution() {
        const sizes = {};
        this.results.forEach(result => {
            const size = result.companyDetails?.employeeCount || 'Unknown';
            sizes[size] = (sizes[size] || 0) + 1;
        });
        return sizes;
    }

    getPublicPrivateRatio() {
        const publicCount = this.countPublicPrivate('Public');
        const privateCount = this.countPublicPrivate('Private');
        return {
            public: publicCount,
            private: privateCount,
            ratio: privateCount > 0 ? Math.round((publicCount / privateCount) * 100) / 100 : 0
        };
    }

    /**
     *  GENERATE HUMAN-READABLE METRICS REPORT
     */
    async generateMetricsReport(metrics) {
        const report = `#  EXECUTIVE INTELLIGENCE DATASET METRICS

##  Pipeline Performance
- **Execution Date**: ${metrics.pipelinePerformance.executionDate}
- **Success Rate**: ${metrics.pipelinePerformance.successRate}%
- **Average Processing Time**: ${metrics.pipelinePerformance.avgProcessingTimePerCompany}s per company
- **Error Rate**: ${metrics.pipelinePerformance.errorRate}%

##  Dataset Overview
- **Original Companies**: ${metrics.datasetOverview.originalCompanies}
- **Parent Companies Added**: ${metrics.datasetOverview.parentCompaniesAdded}
- **Total Rows Generated**: ${metrics.datasetOverview.totalRowsGenerated}
- **Dataset Expansion**: ${metrics.datasetOverview.expansionRatio}x
- **Data Completeness**: ${metrics.datasetOverview.dataCompleteness}%

##  Executive Intelligence
- **CEO Detection Rate**: ${metrics.executiveIntelligence.ceoDetectionRate}%
- **Finance Leader Detection Rate**: ${metrics.executiveIntelligence.financeLeaderDetectionRate}%
- **Both Executives Found**: ${metrics.executiveIntelligence.bothExecutivesFoundRate}%
- **Average CEO Confidence**: ${metrics.executiveIntelligence.avgCEOConfidence}%
- **Average Finance Confidence**: ${metrics.executiveIntelligence.avgFinanceConfidence}%
- **High Confidence Rate**: ${metrics.executiveIntelligence.highConfidenceRate}%

##  Corporate Structure
- **Independent Companies**: ${metrics.corporateStructure.independentCompanies}
- **Subsidiaries**: ${metrics.corporateStructure.subsidiaries}
- **Parent Companies**: ${metrics.corporateStructure.parentCompanies}
- **Public Companies**: ${metrics.corporateStructure.publicCompanies}
- **Private Companies**: ${metrics.corporateStructure.privateCompanies}

##  PE/VC Intelligence
- **PE-Owned Companies**: ${metrics.peVcIntelligence.peOwnedCompanies} (${metrics.peVcIntelligence.peOwnedPercentage}%)
- **PE Firms Identified**: ${metrics.peVcIntelligence.identifiedPEFirms.join(', ')}
- **VC Firms Identified**: ${metrics.peVcIntelligence.vcFirmsIdentified.join(', ')}

##  Key Insights
${this.generateKeyInsights(metrics)}

---
*Generated by Adrata Executive Intelligence Pipeline*
*Timestamp: ${new Date().toISOString()}*
`;

        fs.writeFileSync(path.join(__dirname, '../../outputs/v8/dataset-metrics-report.md'), report);
    }

    generateKeyInsights(metrics) {
        const insights = [];
        
        if (metrics.executiveIntelligence.avgCEOConfidence >= 95) {
            insights.push('- **Excellent CEO Data Quality**: Average confidence above 95%');
        }
        
        if (metrics.peVcIntelligence.peOwnedPercentage > 0) {
            insights.push(`- **PE Ownership Detected**: ${metrics.peVcIntelligence.peOwnedPercentage}% of companies are PE-owned`);
        }
        
        if (metrics.datasetOverview.expansionRatio > 1.5) {
            insights.push(`- **Significant Dataset Expansion**: ${metrics.datasetOverview.expansionRatio}x expansion with parent companies`);
        }
        
        if (metrics.corporateStructure.publicCompanies > 0) {
            insights.push(`- **Public Company Coverage**: ${metrics.corporateStructure.publicCompanies} public companies with SEC validation`);
        }
        
        return insights.join('\n');
    }

    // Additional metrics analysis methods
    analyzeAcquisitionActivity() {
        const acquisitions = this.results.filter(r => 
            r.corporateStructure?.changeType === 'acquisition'
        );
        return {
            totalAcquisitions: acquisitions.length,
            recentAcquisitions: acquisitions.filter(r => {
                const changeDate = new Date(r.corporateStructure?.changeDate || '2000-01-01');
                const twoYearsAgo = new Date();
                twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
                return changeDate > twoYearsAgo;
            }).length
        };
    }

    analyzeCorporateChanges() {
        const changes = {};
        this.results.forEach(r => {
            const changeType = r.corporateStructure?.changeType || 'none';
            changes[changeType] = (changes[changeType] || 0) + 1;
        });
        return changes;
    }

    analyzePEExitTimelines() {
        const timelines = {};
        this.results.forEach(r => {
            if (r.peOwnership?.isPEOwned) {
                const timeline = this.peIntelligence.calculatePEExitTimeline(
                    r.corporateStructure?.changeDate, 
                    r.peOwnership.peHoldingPeriod
                );
                const phase = timeline.split(' ')[0];
                timelines[phase] = (timelines[phase] || 0) + 1;
            }
        });
        return timelines;
    }

    summarizePEImplications() {
        const implications = [];
        this.results.forEach(r => {
            if (r.peOwnership?.isPEOwned && r.peOwnership.peSalesImplications) {
                implications.push(r.peOwnership.peSalesImplications);
            }
        });
        return [...new Set(implications)]; // Remove duplicates
    }

    assessOverallDataQuality() {
        const avgConfidence = this.calculateAvgOverallConfidence();
        if (avgConfidence >= 90) return 'Excellent';
        if (avgConfidence >= 80) return 'Good';
        if (avgConfidence >= 70) return 'Fair';
        return 'Poor';
    }

    getConfidenceDistribution() {
        const distribution = { '90-100%': 0, '80-89%': 0, '70-79%': 0, '60-69%': 0, '<60%': 0 };
        this.results.forEach(r => {
            const confidence = r.overallConfidence || 0;
            if (confidence >= 90) distribution['90-100%']++;
            else if (confidence >= 80) distribution['80-89%']++;
            else if (confidence >= 70) distribution['70-79%']++;
            else if (confidence >= 60) distribution['60-69%']++;
            else distribution['<60%']++;
        });
        return distribution;
    }

    getRiskLevelDistribution() {
        const distribution = {};
        this.results.forEach(r => {
            const risk = r.riskLevel || 'UNKNOWN';
            distribution[risk] = (distribution[risk] || 0) + 1;
        });
        return distribution;
    }

    getValidationStatusBreakdown() {
        const statuses = {};
        this.results.forEach(r => {
            const status = this.getValidationStatus(r);
            statuses[status] = (statuses[status] || 0) + 1;
        });
        return statuses;
    }

    analyzeDataFreshness() {
        const freshness = {};
        this.results.forEach(r => {
            const age = r.dataFreshness?.dataAge || 'unknown';
            freshness[age] = (freshness[age] || 0) + 1;
        });
        return freshness;
    }

    analyzeSourceReliability() {
        const sources = {};
        this.results.forEach(r => {
            const ceoSource = r.ceo?.source || 'unknown';
            const financeSource = r.financeLeader?.source || 'unknown';
            sources[ceoSource] = (sources[ceoSource] || 0) + 1;
            sources[financeSource] = (sources[financeSource] || 0) + 1;
        });
        return sources;
    }

    identifyTopTargets() {
        return this.results
            .filter(r => r.overallConfidence >= 90)
            .sort((a, b) => b.overallConfidence - a.overallConfidence)
            .slice(0, 5)
            .map(r => ({
                company: r.companyName,
                confidence: r.overallConfidence,
                ceo: r.ceo.name,
                finance: r.financeLeader.name
            }));
    }

    identifyHighValueOpportunities() {
        return this.results
            .filter(r => r.peOwnership?.isPEOwned || r.companyDetails?.isPublic)
            .map(r => ({
                company: r.companyName,
                type: r.peOwnership?.isPEOwned ? 'PE-Owned' : 'Public',
                value: r.peOwnership?.isPEOwned ? r.peOwnership.peStrategicNotes : 'Public company opportunity'
            }));
    }

    identifyKeyRiskFactors() {
        const risks = [];
        this.results.forEach(r => {
            if (r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL') {
                risks.push(`${r.companyName}: ${r.riskLevel} risk`);
            }
        });
        return risks;
    }

    recommendContactStrategy() {
        const strategies = {};
        this.results.forEach(r => {
            let strategy = 'Standard';
            if (r.peOwnership?.isPEOwned) strategy = 'PE-Focused';
            else if (r.companyDetails?.isPublic) strategy = 'Public Company';
            else if (r.corporateStructure?.parentCompany) strategy = 'Subsidiary';
            
            strategies[strategy] = (strategies[strategy] || 0) + 1;
        });
        return strategies;
    }

    analyzeTerritoryDistribution() {
        const territories = {};
        this.results.forEach(r => {
            const accountOwner = r.accountOwner || 'Unknown';
            territories[accountOwner] = (territories[accountOwner] || 0) + 1;
        });
        return territories;
    }

    /**
     *  GENERATE SUMMARY REPORT
     */
    generateSummary() {
        console.log('\n FINAL PIPELINE SUMMARY');
        console.log('=' .repeat(80));
        const totalRows = this.results.length;
        console.log(` Original Companies Processed: ${this.stats.processed}`);
        console.log(` Parent Companies Added: ${this.stats.parentCompaniesAdded}`);
        console.log(`📋 Total Rows in Output: ${totalRows}`);
        console.log(` CEOs Found: ${this.stats.ceoFound}/${this.stats.processed} (${Math.round(this.stats.ceoFound/this.stats.processed*100)}%)`);
        console.log(` Finance Leaders Found: ${this.stats.financeFound}/${this.stats.processed} (${Math.round(this.stats.financeFound/this.stats.processed*100)}%)`);
        console.log(` Both Found: ${this.stats.bothFound}/${this.stats.processed} (${Math.round(this.stats.bothFound/this.stats.processed*100)}%)`);
        console.log(` High Confidence: ${this.stats.highConfidence}/${this.stats.processed} (${Math.round(this.stats.highConfidence/this.stats.processed*100)}%)`);
        console.log(` Errors: ${this.stats.errors}/${this.stats.processed} (${Math.round(this.stats.errors/this.stats.processed*100)}%)`);
        console.log(` Relationships Validated: ${this.stats.relationshipsValidated}/${this.stats.processed} (${Math.round(this.stats.relationshipsValidated/this.stats.processed*100)}%)`);
        console.log(`📋 Validation Sources Found: ${this.stats.sourcesFound}`);
        console.log(` Executive Connections: ${this.stats.executiveConnections}`);
        console.log(` Buyer Groups Generated: ${this.stats.buyerGroupsGenerated}/${this.stats.processed} (${Math.round(this.stats.buyerGroupsGenerated/this.stats.processed*100)}%)`);
        console.log(` Buyer Group Roles Identified: ${this.stats.buyerGroupRolesIdentified}`);

        console.log('\n BUYER GROUP ANALYSIS:');
        const buyerGroupComplexity = {};
        this.results.forEach(result => {
            if (result.buyerGroupIntelligence?.buyerGroup?.complexity) {
                const complexity = result.buyerGroupIntelligence.buyerGroup.complexity;
                buyerGroupComplexity[complexity] = (buyerGroupComplexity[complexity] || 0) + 1;
            }
        });
        
        Object.entries(buyerGroupComplexity).forEach(([complexity, count]) => {
            console.log(`   ${complexity}: ${count}`);
        });

        console.log('\n FINANCE ROLE BREAKDOWN:');
        const financeRoles = {};
        this.results.forEach(result => {
            if (result.financeLeader.role) {
                financeRoles[result.financeLeader.role] = (financeRoles[result.financeLeader.role] || 0) + 1;
            }
        });

        Object.entries(financeRoles).forEach(([role, count]) => {
            console.log(`   ${role}: ${count}`);
        });

        console.log('\n RISK DISTRIBUTION:');
        const riskLevels = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
        this.results.forEach(result => {
            riskLevels[result.riskLevel]++;
        });

        Object.entries(riskLevels).forEach(([level, count]) => {
            const percentage = Math.round(count/this.stats.processed*100);
            console.log(`   ${level}: ${count} (${percentage}%)`);
        });

        const avgConfidence = this.results.reduce((sum, r) => sum + r.overallConfidence, 0) / this.results.length;
        console.log(`\n Average Confidence: ${Math.round(avgConfidence)}%`);
        
        const avgTime = this.results.reduce((sum, r) => sum + r.processingTime, 0) / this.results.length;
        console.log(`⏱️ Average Processing Time: ${Math.round(avgTime/1000)}s`);

        console.log('\n Output Files:');
        console.log('    outputs/v8/executive-intelligence-dataset.csv - Main results');
        console.log('    outputs/v8/executive-intelligence-data.json - Detailed data');
        console.log('    outputs/v8/dataset-metrics.json - Dataset analytics');
        console.log('    outputs/v8/dataset-metrics-report.md - Human-readable metrics');
    }

    /**
     * 🤖 AI-POWERED BUYER GROUP ANALYSIS
     * 
     * Analyzes company context and generates intelligent buyer group recommendations
     */
    async analyzeBuyerGroup(result) {
        try {
            // Build comprehensive company context for buyer group analysis
            const companyContext = {
                companyName: result.companyName,
                website: result.website,
                industry: result.industryIntelligence?.industryClassification?.primarySector || 
                         result.companyDetails?.industry || 'Unknown',
                businessVertical: result.industryIntelligence?.industryClassification?.businessVertical,
                marketSegment: result.industryIntelligence?.industryClassification?.marketSegment,
                employeeCount: result.executiveContactIntelligence?.companyIntelligence?.employeeCount ||
                              result.companyDetails?.employeeCount,
                isPublic: result.companyDetails?.isPublic,
                isPEOwned: result.peOwnership?.isPEOwned,
                peOwner: result.peOwnership?.peOwner,
                parentCompany: result.corporateStructure?.parentCompany,
                headquarters: result.executiveContactIntelligence?.companyIntelligence?.headquarters ||
                             result.companyDetails?.headquarters,
                competitors: result.industryIntelligence?.competitorIntelligence?.directCompetitors,
                
                // Executive context for buyer group analysis
                executiveStructure: {
                    ceo: {
                        name: result.ceo.name,
                        title: result.ceo.title,
                        confidence: result.ceo.confidence
                    },
                    financeLeader: {
                        name: result.financeLeader.name,
                        title: result.financeLeader.title,
                        role: result.financeLeader.role,
                        confidence: result.financeLeader.confidence
                    }
                },
                
                // Sales context
                salesContext: {
                    accountOwner: result.accountOwner,
                    isTop1000: result.isTop1000,
                    overallConfidence: result.overallConfidence,
                    riskLevel: result.riskLevel
                }
            };

            console.log(`   🎯 Analyzing buyer group for ${result.companyName} (${companyContext.industry})`);
            
            // Generate buyer group using Universal AI
            const buyerGroupAnalysis = await this.buyerGroupAI.determineBuyerGroup(companyContext);
            
            if (buyerGroupAnalysis.success) {
                console.log(`   ✅ Generated ${buyerGroupAnalysis.buyerGroup.roles.length} buyer group roles`);
                console.log(`   📊 Decision makers: ${buyerGroupAnalysis.buyerGroup.roles.filter(r => r.influence === 'Decision Maker').length}`);
                console.log(`   🎯 Champions: ${buyerGroupAnalysis.buyerGroup.roles.filter(r => r.influence === 'Champion').length}`);
                
                return {
                    success: true,
                    buyerGroup: buyerGroupAnalysis.buyerGroup,
                    salesStrategy: buyerGroupAnalysis.salesStrategy,
                    companyContext: companyContext,
                    generatedAt: new Date().toISOString()
                };
            } else {
                console.log(`   ⚠️ Buyer group analysis failed: ${buyerGroupAnalysis.error}`);
                return {
                    success: false,
                    error: buyerGroupAnalysis.error,
                    companyContext: companyContext
                };
            }
            
        } catch (error) {
            console.error(`   ❌ Buyer group analysis error: ${error.message}`);
            return {
                success: false,
                error: error.message,
                companyContext: result.companyName
            };
        }
    }

    /**
     * 🔧 UTILITY METHODS
     */
    
    /**
     * Extract buyer group roles by influence type
     */
    extractBuyerGroupRoles(buyerGroupIntelligence, influenceType) {
        if (!buyerGroupIntelligence?.success || !buyerGroupIntelligence?.buyerGroup?.roles) {
            return null;
        }
        
        const roles = buyerGroupIntelligence.buyerGroup.roles
            .filter(role => role.influence === influenceType)
            .map(role => `${role.title} (${role.department})`)
            .join('; ');
            
        return roles || null;
    }

    /**
     * Extract executive contact information from cost-effective intelligence data
     */
    getExecutiveEmail(executives, role) {
        const exec = executives?.find(e => e.role === role);
        return exec?.email || null;
    }
    
    getExecutivePhone(executives, role) {
        const exec = executives?.find(e => e.role === role);
        return exec?.phone || null;
    }
    
    getExecutiveLinkedIn(executives, role) {
        const exec = executives?.find(e => e.role === role);
        return exec?.linkedinUrl || null;
    }
    
    getExecutiveEmailSource(executives, role) {
        const exec = executives?.find(e => e.role === role);
        return exec?.source || null;
    }
    
    formatHeadquarters(headquarters) {
        if (!headquarters) return null;
        const parts = [];
        if (headquarters.city) parts.push(headquarters.city);
        if (headquarters.state) parts.push(headquarters.state);
        if (headquarters.country) parts.push(headquarters.country);
        return parts.join(', ') || null;
    }
    extractCompanyName(website) {
        try {
            const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
            return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
        } catch (error) {
            return website;
        }
    }

    categorizeFinanceRole(title) {
        const titleLower = title.toLowerCase();
        
        if (titleLower.includes('cfo') || titleLower.includes('chief financial officer')) {
            return 'CFO';
        }
        if (titleLower.includes('controller') || titleLower.includes('chief accounting officer')) {
            return 'Controller';
        }
        if (titleLower.includes('vp finance') || titleLower.includes('finance director')) {
            return 'VP Finance';
        }
        if (titleLower.includes('treasurer')) {
            return 'Treasurer';
        }
        if (titleLower.includes('finance')) {
            return 'Finance Executive';
        }
        if (titleLower.includes('coo') && titleLower.includes('finance')) {
            return 'COO/Finance';
        }
        
        return 'Other Finance';
    }

    assessRisk(result) {
        let riskScore = 0;
        
        // CEO confidence
        if (result.ceo.confidence < 70) riskScore += 2;
        else if (result.ceo.confidence < 85) riskScore += 1;
        
        // Finance leader confidence
        if (result.financeLeader.confidence < 70) riskScore += 2;
        else if (result.financeLeader.confidence < 85) riskScore += 1;
        
        // Overall confidence
        if (result.overallConfidence < 60) riskScore += 2;
        else if (result.overallConfidence < 80) riskScore += 1;
        
        // Missing executives
        if (!result.ceo.name) riskScore += 3;
        if (!result.financeLeader.name) riskScore += 3;
        
        if (riskScore >= 6) return 'CRITICAL';
        if (riskScore >= 4) return 'HIGH';
        if (riskScore >= 2) return 'MEDIUM';
        return 'LOW';
    }

    generateValidationNotes(research, result) {
        const notes = [];
        
        if (research.researchMethod === 'full_team_analysis') {
            notes.push('Used full C-level team analysis to identify finance leader');
        }
        
        if (result.financeLeader.role !== 'CFO' && result.financeLeader.name) {
            notes.push(`Finance leader is ${result.financeLeader.role}, not traditional CFO`);
        }
        
        if (result.ceo.confidence < 80) {
            notes.push('CEO identification has moderate confidence - verify manually');
        }
        
        if (result.financeLeader.confidence < 80) {
            notes.push('Finance leader identification has moderate confidence - verify manually');
        }
        
        if (research.validationSources && research.validationSources.length > 0) {
            notes.push(`Validated against ${research.validationSources.length} sources`);
        }
        
        return notes;
    }

    getValidationStatus(result) {
        if (result.ceo.validated && result.financeLeader.validated) {
            return 'Fully Validated';
        }
        if (result.ceo.validated || result.financeLeader.validated) {
            return 'Partially Validated';
        }
        return 'Requires Validation';
    }

    /**
     * 🧠 CREATE SMART RELATIONSHIPS
     * 
     * Intelligently builds relationship data from existing pipeline research
     */
    createSmartRelationships(result, research) {
        return {
            corporateHierarchy: {
                parentCompanies: result.corporateStructure?.parentCompany ? 
                    [{
                        name: result.corporateStructure.parentCompany,
                        changeType: result.corporateStructure.changeType,
                        changeDate: result.corporateStructure.changeDate,
                        isAcquired: result.corporateStructure.isAcquired
                    }] : [],
                subsidiaries: [],
                acquisitions: [],
                ownershipStructure: {
                    status: result.companyDetails?.isPublic ? 'Public' : 'Private',
                    ticker: result.companyDetails?.ticker,
                    exchange: result.companyDetails?.exchange
                },
                connections: this.extractCorporateConnections(result)
            },
            executiveNetwork: {
                currentExecutives: this.buildExecutiveNetwork(result, research),
                executiveMovements: [],
                networkSize: this.calculateNetworkSize(result, research),
                connectionStrength: this.assessConnectionStrength(result)
            },
            investorNetwork: {
                investors: this.buildInvestorNetwork(result),
                totalFunding: this.estimateFunding(result),
                peConnections: result.peOwnership?.isPEOwned ? [result.peOwnership] : [],
                vcConnections: []
            }
        };
    }

    /**
     *  MERGE RELATIONSHIP INTELLIGENCE
     * 
     * Intelligently merges validation results with existing pipeline data
     */
    mergeRelationshipIntelligence(result, validation) {
        return {
            // Preserve validation results
            ...validation,
            
            // Enhance with pipeline-specific intelligence
            pipelineEnhancements: {
                executiveConfidence: {
                    ceo: result.ceo.confidence,
                    finance: result.financeLeader.confidence,
                    combined: Math.round((result.ceo.confidence + result.financeLeader.confidence) / 2)
                },
                corporateStructureConfidence: result.corporateStructure ? 85 : 20,
                peOwnershipConfidence: result.peOwnership?.isPEOwned ? 90 : 10,
                dataFreshness: result.dataFreshness?.dataAge || 'current'
            },
            
            // Smart confidence calculation
            enhancedConfidence: this.calculateEnhancedConfidence(result, validation),
            
            // Pipeline-specific insights
            pipelineInsights: this.generatePipelineInsights(result, validation)
        };
    }

    /**
     *  CREATE BASIC RELATIONSHIP INTELLIGENCE
     * 
     * Creates basic relationship intelligence for companies with limited data
     */
    createBasicRelationshipIntelligence(result) {
        return {
            overallConfidence: Math.max(result.ceo.confidence, result.financeLeader.confidence),
            validationSources: ['pipeline_research'],
            organizationalStructure: {
                structureType: result.corporateStructure?.parentCompany ? 'subsidiary' : 'independent',
                autonomyLevel: 'unknown'
            },
            executiveConnections: {
                internalConnections: result.ceo.name && result.financeLeader.name ? 
                    [{ executive1: result.ceo.name, executive2: result.financeLeader.name, connectionType: 'colleagues' }] : [],
                externalConnections: []
            },
            pipelineEnhancements: {
                executiveConfidence: {
                    ceo: result.ceo.confidence,
                    finance: result.financeLeader.confidence,
                    combined: Math.round((result.ceo.confidence + result.financeLeader.confidence) / 2)
                },
                dataSource: 'enhanced_executive_research',
                hasRealData: !!(result.ceo.name || result.financeLeader.name)
            }
        };
    }

    /**
     * 🔧 RELATIONSHIP INTELLIGENCE EXTRACTORS
     */
    getOrganizationalStructure(result) {
        const orgStructure = result.relationshipIntelligence?.organizationalStructure;
        if (orgStructure?.structureType) {
            return `${orgStructure.structureType}${orgStructure.autonomyLevel ? ` (${orgStructure.autonomyLevel} autonomy)` : ''}`;
        }
        
        // Only return real data from research, no assumptions
        if (result.corporateStructure?.parentCompany && result.corporateStructure.parentCompany !== 'None') {
            return result.corporateStructure.changeType || 'subsidiary';
        }
        
        return 'independent';
    }

    getReportingRelationship(result) {
        const reportingInfo = result.relationshipIntelligence?.organizationalStructure?.reportingRelationship;
        if (reportingInfo?.reportsTo) {
            return `CEO reports to ${reportingInfo.reportsTo}`;
        }
        
        // Only return real reporting data, no assumptions
        if (result.corporateStructure?.parentCompany && result.corporateStructure.parentCompany !== 'None') {
            return `Reports to ${result.corporateStructure.parentCompany}`;
        }
        
        return result.companyDetails?.isPublic ? 'Public company board' : null;
    }

    getExecutiveConnections(result) {
        const execConnections = result.relationshipIntelligence?.executiveConnections;
        if (execConnections?.internalConnections) {
            const connections = execConnections.internalConnections.length;
            const external = execConnections.externalConnections?.length || 0;
            return `${connections} internal${external > 0 ? `, ${external} external` : ''}`;
        }
        
        // Only count real executives found, no placeholders
        const realExecutives = [];
        if (result.ceo.name && result.ceo.name !== '') realExecutives.push('CEO');
        if (result.financeLeader.name && result.financeLeader.name !== '') realExecutives.push('Finance');
        
        return realExecutives.length > 0 ? realExecutives.join(', ') : 'None identified';
    }

    getCorporateValidation(result) {
        const corpValidation = result.relationshipIntelligence?.validatedRelationships?.corporateStructure;
        if (corpValidation?.overallConfidence) {
            return `${Math.round(corpValidation.overallConfidence * 100)}% validated`;
        }
        
        // Only return validation status if we have real corporate structure data
        if (result.corporateStructure?.parentCompany && result.corporateStructure.parentCompany !== 'None') {
            return result.corporateStructure.confidence ? 
                `${result.corporateStructure.confidence}% confidence` : 'Identified';
        }
        
        return null;
    }

    /**
     * 🧠 INTELLIGENT RELATIONSHIP BUILDERS
     */
    extractCorporateConnections(result) {
        const connections = {};
        
        // Only include real, validated corporate connections
        if (result.corporateStructure?.parentCompany && result.corporateStructure.parentCompany !== 'None') {
            connections.parent = {
                name: result.corporateStructure.parentCompany,
                type: result.corporateStructure.changeType || null,
                confidence: result.corporateStructure.confidence || null
            };
        }
        
        if (result.peOwnership?.isPEOwned && result.peOwnership.peOwner !== 'None') {
            connections.investor = {
                name: result.peOwnership.peOwner,
                type: 'private_equity',
                confidence: result.peOwnership.confidence || null
            };
        }
        
        return connections;
    }

    buildExecutiveNetwork(result, research) {
        const executives = [];
        
        if (result.ceo.name) {
            executives.push({
                name: result.ceo.name,
                title: result.ceo.title,
                confidence: result.ceo.confidence,
                source: result.ceo.source,
                role: 'leadership'
            });
        }
        
        if (result.financeLeader.name) {
            executives.push({
                name: result.financeLeader.name,
                title: result.financeLeader.title,
                confidence: result.financeLeader.confidence,
                source: result.financeLeader.source,
                role: 'finance'
            });
        }
        
        // Add any additional executives from research
        if (research?.allExecutives) {
            research.allExecutives.forEach(exec => {
                if (!executives.find(e => e.name === exec.name)) {
                    executives.push({
                        name: exec.name,
                        title: exec.title,
                        confidence: exec.confidence || 70,
                        source: 'team_research',
                        role: 'executive'
                    });
                }
            });
        }
        
        return executives;
    }

    calculateNetworkSize(result, research) {
        let size = 0;
        if (result.ceo.name) size++;
        if (result.financeLeader.name) size++;
        if (research?.allExecutives) size += research.allExecutives.length;
        return size; // Return actual count, no artificial minimum
    }

    assessConnectionStrength(result) {
        const ceoConfidence = result.ceo.confidence || 0;
        const financeConfidence = result.financeLeader.confidence || 0;
        const avgConfidence = (ceoConfidence + financeConfidence) / 2;
        
        if (avgConfidence >= 90) return 'Very High';
        if (avgConfidence >= 80) return 'High';
        if (avgConfidence >= 70) return 'Medium';
        return 'Low';
    }

    buildInvestorNetwork(result) {
        const investors = [];
        
        // Only include real PE ownership data, no hardcoded confidence
        if (result.peOwnership?.isPEOwned && result.peOwnership.peOwner !== 'None') {
            investors.push({
                name: result.peOwnership.peOwner,
                type: 'PE',
                aum: result.peOwnership.peOwnerAUM || null,
                confidence: result.peOwnership.confidence || null
            });
        }
        
        return investors;
    }

    estimateFunding(result) {
        // Only return real funding data if available, no estimates
        if (result.companyDetails?.revenue) {
            return result.companyDetails.revenue;
        }
        
        // Return null for no real data - no artificial estimates
        return null;
    }

    calculateEnhancedConfidence(result, validation) {
        const pipelineConfidence = result.overallConfidence || 0;
        const validationConfidence = validation.overallConfidence || 0;
        const executiveConfidence = Math.max(result.ceo.confidence, result.financeLeader.confidence);
        
        // Weighted average with pipeline data having higher weight
        return Math.round((pipelineConfidence * 0.5 + validationConfidence * 0.3 + executiveConfidence * 0.2));
    }

    generatePipelineInsights(result, validation) {
        const insights = [];
        
        if (result.ceo.confidence >= 95) {
            insights.push('High-confidence CEO identification');
        }
        
        if (result.financeLeader.confidence >= 95) {
            insights.push('High-confidence finance leader identification');
        }
        
        if (result.peOwnership?.isPEOwned) {
            insights.push(`PE-owned by ${result.peOwnership.peOwner} - strategic approach required`);
        }
        
        if (result.corporateStructure?.isAcquired) {
            insights.push('Recently acquired - potential executive changes');
        }
        
        if (validation.validationSources?.length > 10) {
            insights.push('Extensively validated with multiple sources');
        }
        
        return insights;
    }
}

/**
 *  MAIN EXECUTION
 */
async function main() {
    console.log('🚀 Starting Powerhouse Pipeline...\n');
    
    const pipeline = new PowerhousePipeline();
    const result = await pipeline.runPipeline();
    
    if (result.success) {
        console.log('\n POWERHOUSE PIPELINE COMPLETED SUCCESSFULLY!');
        console.log(' All companies processed with maximum intelligence');
        console.log(' Production dataset generated with CoreSignal people data');
        console.log(' Parent companies, PE firms, and VC firms included');
        console.log(' Dataset metrics and analytics generated');
        process.exit(0);
    } else {
        console.error(`\n PIPELINE FAILED: ${result.error}`);
        process.exit(1);
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { PowerhousePipeline };
