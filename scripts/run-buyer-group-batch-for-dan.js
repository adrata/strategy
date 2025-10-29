#!/usr/bin/env node

/**
 * 🚀 RUN BUYER GROUP DISCOVERY BATCH FOR DAN
 * 
 * Execute buyer group discovery pipeline for all companies assigned to Dan
 * in the adrata workspace, excluding Winning Variant.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

// Import the buyer group pipeline
const { SmartBuyerGroupPipeline } = require('../_future_now/find-buyer-group/index.js');

const prisma = new PrismaClient();

// Key IDs
const DAN_USER_ID = '01K7B327HWN9G6KGWA97S1TK43';
const ADRATA_WORKSPACE_ID = '01K7464TNANHQXPCZT1FYX205V';

// Configuration
const PROGRESS_FILE = 'scripts/buyer-group-batch-progress.json';
const RESULTS_DIR = 'scripts/buyer-group-batch-results';
const DEFAULT_DEAL_SIZE = 150000;
const DELAY_BETWEEN_RUNS = 2000; // 2 seconds
const TEST_MODE = false; // Set to true to process only 2 companies for testing
const TEST_COMPANY_LIMIT = 2;

class BuyerGroupBatchProcessor {
  constructor() {
    this.progress = [];
    this.stats = {
      total: 0,
      completed: 0,
      failed: 0,
      skipped: 0
    };
  }

  async loadProgress() {
    try {
      const data = await fs.readFile(PROGRESS_FILE, 'utf8');
      this.progress = JSON.parse(data);
      console.log(`📁 Loaded progress file: ${this.progress.length} companies tracked`);
    } catch (error) {
      console.log('📁 No existing progress file, starting fresh');
      this.progress = [];
    }
  }

  async saveProgress() {
    try {
      await fs.writeFile(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error('❌ Failed to save progress file:', error.message);
    }
  }

  async createResultsDirectory() {
    try {
      await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch (error) {
      console.error('❌ Failed to create results directory:', error.message);
    }
  }

  async getDanCompanies() {
    console.log('🔍 Fetching Dan\'s companies from database...');
    
    const companies = await prisma.companies.findMany({
      where: {
        workspaceId: ADRATA_WORKSPACE_ID,
        mainSellerId: DAN_USER_ID,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        website: true,
        industry: true,
        employeeCount: true,
        revenue: true,
        description: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Found ${companies.length} companies assigned to Dan`);
    return companies;
  }

  filterCompanies(companies) {
    // Filter out Winning Variant (case-insensitive)
    let filtered = companies.filter(company => 
      !company.name.toLowerCase().includes('winning variant')
    );

    console.log(`📋 Filtered out Winning Variant: ${companies.length - filtered.length} companies`);
    
    // In test mode, limit to first 2 companies
    if (TEST_MODE) {
      filtered = filtered.slice(0, TEST_COMPANY_LIMIT);
      console.log(`🧪 TEST MODE: Limited to first ${TEST_COMPANY_LIMIT} companies`);
    }
    
    console.log(`📋 Processing ${filtered.length} companies`);
    
    return filtered;
  }

  getCompletedCompanyIds() {
    return this.progress
      .filter(p => p.status === 'completed')
      .map(p => p.companyId);
  }

  async processCompany(company, index, total) {
    const companyId = company.id;
    const companyName = company.name;
    
    console.log(`\n🏢 [${index + 1}/${total}] Processing: ${companyName}`);
    console.log(`   ID: ${companyId}`);
    console.log(`   Website: ${company.website || 'None'}`);
    console.log(`   Industry: ${company.industry || 'Unknown'}`);

    // Check if already completed
    const existingProgress = this.progress.find(p => p.companyId === companyId);
    if (existingProgress && existingProgress.status === 'completed') {
      console.log(`   ⏭️  Already completed, skipping`);
      this.stats.skipped++;
      return;
    }

    // Update progress to processing
    this.updateProgress(companyId, companyName, 'processing');
    await this.saveProgress();

    try {
      // Determine target (website preferred, fallback to name)
      const target = company.website || company.name;
      if (!target) {
        throw new Error('No website or name available for company');
      }

      console.log(`   🎯 Target: ${target}`);

      // Initialize pipeline
      const pipeline = new SmartBuyerGroupPipeline({
        prisma: prisma,
        targetCompany: target,
        dealSize: DEFAULT_DEAL_SIZE,
        productCategory: 'sales',
        workspaceId: ADRATA_WORKSPACE_ID
      });

      // Execute pipeline
      console.log(`   🚀 Starting buyer group discovery...`);
      const startTime = Date.now();
      
      const result = await pipeline.run();
      
      const processingTime = Date.now() - startTime;
      console.log(`   ✅ Completed in ${processingTime}ms`);

      // Save detailed results
      await this.saveCompanyResults(company, result);

      // Update progress to completed
      this.updateProgress(companyId, companyName, 'completed', null, {
        processingTime,
        buyerGroupSize: result.buyerGroup?.length || 0,
        totalCost: result.costs?.total || 0
      });

      this.stats.completed++;
      console.log(`   📊 Buyer group: ${result.buyerGroup?.length || 0} members`);
      console.log(`   💰 Cost: $${result.costs?.total || 0}`);

    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
      
      // Update progress to failed
      this.updateProgress(companyId, companyName, 'failed', error.message);
      
      this.stats.failed++;
    }

    await this.saveProgress();
    
    // Disconnect and reconnect Prisma to clear cache and avoid "cached plan must not change result type" error
    try {
      await prisma.$disconnect();
      await prisma.$connect();
      console.log(`   🔄 Prisma connection refreshed`);
    } catch (error) {
      console.warn(`   ⚠️ Prisma refresh failed: ${error.message}`);
    }
  }

  updateProgress(companyId, companyName, status, errorMessage = null, metadata = null) {
    const existingIndex = this.progress.findIndex(p => p.companyId === companyId);
    const progressEntry = {
      companyId,
      companyName,
      status,
      timestamp: new Date().toISOString(),
      errorMessage,
      metadata
    };

    if (existingIndex >= 0) {
      this.progress[existingIndex] = progressEntry;
    } else {
      this.progress.push(progressEntry);
    }
  }

  async saveCompanyResults(company, result) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeName = company.name.replace(/[^a-zA-Z0-9]/g, '-');
      const filename = `buyer-group-${safeName}-${timestamp}.json`;
      const filepath = path.join(RESULTS_DIR, filename);

      const output = {
        company: {
          id: company.id,
          name: company.name,
          website: company.website,
          industry: company.industry,
          employeeCount: company.employeeCount,
          revenue: company.revenue
        },
        pipeline: {
          target: result.targetCompany || company.website || company.name,
          dealSize: DEFAULT_DEAL_SIZE,
          productCategory: 'sales',
          workspaceId: ADRATA_WORKSPACE_ID
        },
        results: result,
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(filepath, JSON.stringify(output, null, 2));
      console.log(`   💾 Results saved: ${filename}`);
    } catch (error) {
      console.error(`   ❌ Failed to save results: ${error.message}`);
    }
  }

  async validateEnvironment() {
    console.log('🔧 Validating environment...');
    
    // Check required API keys
    const coresignalKey = process.env.CORESIGNAL_API_KEY;
    if (!coresignalKey) {
      throw new Error('CORESIGNAL_API_KEY environment variable is required');
    }
    console.log('   ✅ CORESIGNAL_API_KEY found');

    // Check optional API keys
    if (process.env.LUSHA_API_KEY) {
      console.log('   ✅ LUSHA_API_KEY found (phone enrichment enabled)');
    } else {
      console.log('   ⚠️  LUSHA_API_KEY not found (phone enrichment disabled)');
    }

    if (process.env.ANTHROPIC_API_KEY) {
      console.log('   ✅ ANTHROPIC_API_KEY found (AI reasoning enabled)');
    } else {
      console.log('   ⚠️  ANTHROPIC_API_KEY not found (AI reasoning disabled)');
    }

    // Verify workspace exists
    const workspace = await prisma.workspaces.findUnique({
      where: { id: ADRATA_WORKSPACE_ID },
      select: { id: true, name: true, slug: true }
    });

    if (!workspace) {
      throw new Error(`Workspace ${ADRATA_WORKSPACE_ID} not found`);
    }
    console.log(`   ✅ Workspace found: ${workspace.name} (${workspace.slug})`);

    // Verify Dan's user exists
    const danUser = await prisma.users.findUnique({
      where: { id: DAN_USER_ID },
      select: { id: true, name: true, email: true }
    });

    if (!danUser) {
      throw new Error(`User ${DAN_USER_ID} not found`);
    }
    console.log(`   ✅ Dan found: ${danUser.name} (${danUser.email})`);

    console.log('✅ Environment validation complete\n');
  }

  printSummary() {
    console.log('\n📊 BATCH PROCESSING SUMMARY');
    console.log('============================');
    console.log(`Total companies: ${this.stats.total}`);
    console.log(`✅ Completed: ${this.stats.completed}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`📁 Progress saved: ${PROGRESS_FILE}`);
    console.log(`📁 Results directory: ${RESULTS_DIR}`);
    
    if (this.stats.failed > 0) {
      console.log('\n❌ Failed companies:');
      this.progress
        .filter(p => p.status === 'failed')
        .forEach(p => {
          console.log(`   - ${p.companyName}: ${p.errorMessage}`);
        });
    }
  }

  async run() {
    try {
      console.log('🚀 BUYER GROUP BATCH PROCESSOR FOR DAN');
      console.log('=====================================');
      console.log(`Dan's User ID: ${DAN_USER_ID}`);
      console.log(`Adrata Workspace ID: ${ADRATA_WORKSPACE_ID}`);
      console.log(`Deal Size: $${DEFAULT_DEAL_SIZE.toLocaleString()}`);
      console.log(`Test Mode: ${TEST_MODE ? 'ON' : 'OFF'}${TEST_MODE ? ` (${TEST_COMPANY_LIMIT} companies)` : ''}`);
      console.log('');

      // Connect to database
      await prisma.$connect();
      console.log('✅ Connected to database\n');

      // Validate environment
      await this.validateEnvironment();

      // Load existing progress
      await this.loadProgress();

      // Create results directory
      await this.createResultsDirectory();

      // Get Dan's companies
      const allCompanies = await this.getDanCompanies();
      
      // Filter out Winning Variant
      const companies = this.filterCompanies(allCompanies);
      this.stats.total = companies.length;

      // Get completed company IDs to skip
      const completedIds = this.getCompletedCompanyIds();
      console.log(`⏭️  Skipping ${completedIds.length} already completed companies\n`);

      // Process each company
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        
        // Skip if already completed
        if (completedIds.includes(company.id)) {
          this.stats.skipped++;
          continue;
        }

        await this.processCompany(company, i, companies.length);

        // Delay between runs (except for last company)
        if (i < companies.length - 1) {
          console.log(`   ⏳ Waiting ${DELAY_BETWEEN_RUNS}ms before next company...`);
          await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_RUNS));
        }
      }

      // Print final summary
      this.printSummary();

    } catch (error) {
      console.error('❌ Batch processing failed:', error.message);
      console.error(error.stack);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the batch processor
if (require.main === module) {
  const processor = new BuyerGroupBatchProcessor();
  processor.run().catch(console.error);
}

module.exports = BuyerGroupBatchProcessor;
