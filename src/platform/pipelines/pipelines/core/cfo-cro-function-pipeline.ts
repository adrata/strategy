#!/usr/bin/env node

/**
 * CFO/CRO FUNCTION-BASED PIPELINE
 * 
 * Modern function-based orchestration pipeline for CFO/CRO discovery
 * Following 2025 best practices with idempotency, retry logic, and cost tracking
 */

import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-parser';
import { CFOCROOrchestrator } from '../../orchestration/cfo-cro-orchestrator';
import type { PipelineContext } from '../../../intelligence/shared/orchestration';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Load companies from CSV file
 */
async function loadCompaniesFromCSV(filePath: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const companies: string[] = [];
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        // Support multiple column names for company URLs
        const companyUrl = row['Company URL'] || row['company_url'] || row['url'] || row['company'] || row['Company'];
        if (companyUrl) {
          companies.push(companyUrl);
        }
      })
      .on('end', () => {
        console.log(`📋 Loaded ${companies.length} companies from ${filePath}`);
        resolve(companies);
      })
      .on('error', reject);
  });
}

/**
 * Load companies from command line arguments
 */
function loadCompaniesFromArgs(args: string[]): string[] {
  const companies: string[] = [];
  
  for (const arg of args) {
    if (arg.startsWith('http')) {
      companies.push(arg);
    } else if (arg.includes('.')) {
      // Assume it's a domain, add https://
      companies.push(`https://${arg}`);
    }
  }
  
  return companies;
}

/**
 * Create output directory
 */
function ensureOutputDirectory(): void {
  const outputDir = './output';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created output directory: ${outputDir}`);
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function main() {
  try {
    console.log('🚀 CFO/CRO Function-Based Pipeline v2.0.0');
    console.log('=' .repeat(60));
    
    // Load environment variables
    require('dotenv').config({ path: path.join(process.cwd(), '.env') });
    
    // Create pipeline context
    const context: PipelineContext = {
      workspaceId: process.env.WORKSPACE_ID || 'default',
      userId: process.env.USER_ID || 'default',
      enrichmentLevel: 'enrich',
      config: {
        CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY,
        LUSHA_API_KEY: process.env.LUSHA_API_KEY,
        PROSPEO_API_KEY: process.env.PROSPEO_API_KEY,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY,
        ZEROBOUNCE_API_KEY: process.env.ZEROBOUNCE_API_KEY,
        MYEMAILVERIFIER_API_KEY: process.env.MYEMAILVERIFIER_API_KEY,
        PEOPLE_DATA_LABS_API_KEY: process.env.PEOPLE_DATA_LABS_API_KEY
      },
      metadata: {
        startTime: Date.now(),
        stepCount: 0,
        currentStep: ''
      }
    };

    // Validate required API keys
    const requiredKeys = [
      'CORESIGNAL_API_KEY',
      'LUSHA_API_KEY',
      'PERPLEXITY_API_KEY'
    ];
    
    const missingKeys = requiredKeys.filter(key => !context.config[key]);
    if (missingKeys.length > 0) {
      console.error(`❌ Missing required API keys: ${missingKeys.join(', ')}`);
      process.exit(1);
    }

    // Load companies
    let companies: string[] = [];
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Default to test companies file
      const defaultFile = './test-companies.csv';
      if (fs.existsSync(defaultFile)) {
        companies = await loadCompaniesFromCSV(defaultFile);
      } else {
        console.log('📋 No input provided, using default test companies');
        companies = [
          'https://salesforce.com',
          'https://hubspot.com',
          'https://microsoft.com'
        ];
      }
    } else if (args[0].endsWith('.csv')) {
      // Load from CSV file
      companies = await loadCompaniesFromCSV(args[0]);
    } else {
      // Load from command line arguments
      companies = loadCompaniesFromArgs(args);
    }

    if (companies.length === 0) {
      console.error('❌ No companies to process');
      process.exit(1);
    }

    console.log(`📊 Companies to process: ${companies.length}`);
    console.log(`🏢 Companies: ${companies.slice(0, 3).join(', ')}${companies.length > 3 ? '...' : ''}`);
    
    // Ensure output directory exists
    ensureOutputDirectory();
    
    // Create orchestrator
    const orchestrator = new CFOCROOrchestrator(context);
    
    // Set up event handlers for real-time monitoring
    orchestrator.on('stepStart', (event) => {
      console.log(`   ⏳ Starting: ${event.step}...`);
    });
    
    orchestrator.on('stepComplete', (event) => {
      console.log(`   ✅ Complete: ${event.step} (${event.duration}ms)`);
    });
    
    orchestrator.on('stepFailed', (event) => {
      console.log(`   ❌ Failed: ${event.step} - ${event.error.message}`);
    });
    
    orchestrator.on('progress', (event) => {
      const progress = ((event.completed / event.total) * 100).toFixed(1);
      const eta = event.eta > 0 ? ` (ETA: ${Math.round(event.eta / 1000)}s)` : '';
      console.log(`   📊 Progress: ${progress}% (${event.completed}/${event.total})${eta}`);
    });
    
    orchestrator.on('costUpdate', (event) => {
      console.log(`   💰 [${event.api}] Cost: $${event.cost.toFixed(2)}`);
    });

    // Initialize progress tracking
    orchestrator.initializeProgress(companies.length);
    
    // Execute pipeline
    const startTime = Date.now();
    const result = await orchestrator.execute(companies);
    const totalTime = Date.now() - startTime;
    
    // Display results
    console.log('\n' + '=' .repeat(60));
    console.log('📊 Pipeline Complete!');
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️ Total Time: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`);
    console.log(`💰 Total Cost: $${result.metadata.costEstimate.toFixed(2)}`);
    console.log(`📞 API Calls: ${JSON.stringify(result.metadata.apiCalls)}`);
    
    if (result.success && result.data) {
      const results = result.data as any[];
      const cfoFound = results.filter(r => r.cfo.found).length;
      const croFound = results.filter(r => r.cro.found).length;
      
      console.log(`\n📈 Results Summary:`);
      console.log(`   🏢 Companies processed: ${results.length}`);
      console.log(`   💰 CFOs found: ${cfoFound} (${((cfoFound / results.length) * 100).toFixed(1)}%)`);
      console.log(`   📈 CROs found: ${croFound} (${((croFound / results.length) * 100).toFixed(1)}%)`);
      
      // Show circuit breaker status
      const circuitStatus = orchestrator.getCircuitBreakerStatus();
      const openBreakers = Object.entries(circuitStatus).filter(([_, status]) => status.state === 'open');
      if (openBreakers.length > 0) {
        console.log(`\n⚠️ Circuit Breakers OPEN: ${openBreakers.map(([name, _]) => name).join(', ')}`);
      }
    }
    
    if (!result.success) {
      console.error(`❌ Pipeline failed: ${result.error}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

if (require.main === module) {
  main().catch(console.error);
}

export { main as executeCFOCROPipeline };
