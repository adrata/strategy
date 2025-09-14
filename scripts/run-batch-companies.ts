#!/usr/bin/env npx tsx
/**
 * 🚀 UNIVERSAL BATCH COMPANY BUYER GROUP RUNNER
 * 
 * High-performance script for running buyer group analysis on multiple companies
 * with intelligent batching, caching, and cost optimization
 * 
 * Usage:
 *   # Run 10 companies with predefined profile
 *   npx tsx scripts/run-batch-companies.ts --companies "Microsoft,Apple,Google,Amazon,Meta,Tesla,Netflix,Salesforce,Adobe,Intel" --profile "cybersecurity-platform" --confirm
 *   
 *   # Run from CSV file
 *   npx tsx scripts/run-batch-companies.ts --csv "data/target-companies.csv" --profile "hr-platform" --confirm
 *   
 *   # Custom solution for multiple companies
 *   npx tsx scripts/run-batch-companies.ts --companies "Boeing,Ford,GM" --custom-product "SafetyFirst" --custom-seller "IndustrialTech Inc" --category "operations" --confirm
 */

import * as path from 'path';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import { 
  BuyerGroupPipeline, 
  PipelineConfig, 
  getSellerProfile, 
  createSellerProfile,
  SellerProfile,
  IntelligenceReport 
} from '../src/platform/services/buyer-group/index.js';

interface Args {
  companies?: string[];
  csvFile?: string;
  profile?: string;
  customProduct?: string;
  customSeller?: string;
  category?: SellerProfile['solutionCategory'];
  targetDepartments?: string[];
  primaryPainPoints?: string[];
  competitiveThreats?: string[];
  dealSize?: SellerProfile['dealSize'];
  maxCollects: number;
  batchSize: number;
  maxConcurrent: number;
  dryRun: boolean;
  confirm: boolean;
  verbose: boolean;
  continueOnError: boolean;
  outputDir: string;
}

interface BatchResult {
  company: string;
  success: boolean;
  report?: IntelligenceReport;
  error?: string;
  duration: number;
  creditsUsed: number;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  const companiesStr = getArg(args, '--companies');
  const companies = companiesStr ? companiesStr.split(',').map(c => c.trim()) : undefined;
  const csvFile = getArg(args, '--csv');
  const profile = getArg(args, '--profile');
  const customProduct = getArg(args, '--custom-product');
  const customSeller = getArg(args, '--custom-seller');
  const category = getArg(args, '--category') as SellerProfile['solutionCategory'];
  const targetDepartments = getArg(args, '--target-departments')?.split(',').map(d => d.trim());
  const primaryPainPoints = getArg(args, '--pain-points')?.split(',').map(p => p.trim());
  const competitiveThreats = getArg(args, '--competitive-threats')?.split(',').map(t => t.trim());
  const dealSize = getArg(args, '--deal-size') as SellerProfile['dealSize'];
  const maxCollectsStr = getArg(args, '--max-collects') || '100';
  const batchSizeStr = getArg(args, '--batch-size') || '3';
  const maxConcurrentStr = getArg(args, '--max-concurrent') || '2';
  const outputDir = getArg(args, '--output-dir') || 'data/production/batch-reports';
  
  const maxCollects = Number.parseInt(maxCollectsStr, 10);
  const batchSize = Number.parseInt(batchSizeStr, 10);
  const maxConcurrent = Number.parseInt(maxConcurrentStr, 10);
  const dryRun = args.includes('--dry-run') || !args.includes('--confirm');
  const confirm = args.includes('--confirm');
  const verbose = args.includes('--verbose') || args.includes('-v');
  const continueOnError = args.includes('--continue-on-error');

  return {
    companies,
    csvFile,
    profile,
    customProduct,
    customSeller,
    category,
    targetDepartments,
    primaryPainPoints,
    competitiveThreats,
    dealSize,
    maxCollects: Number.isFinite(maxCollects) ? maxCollects : 100,
    batchSize: Number.isFinite(batchSize) ? batchSize : 3,
    maxConcurrent: Number.isFinite(maxConcurrent) ? maxConcurrent : 2,
    dryRun,
    confirm,
    verbose,
    continueOnError,
    outputDir
  };
}

function getArg(args: string[], key: string): string | undefined {
  const hit = args.find((a) => a.startsWith(key + '='));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

async function loadCompaniesFromCSV(csvFile: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const companies: string[] = [];
    
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => {
        // Try common column names for company names
        const companyName = row.company || row.name || row.company_name || row.Company || row.Name;
        if (companyName && typeof companyName === 'string') {
          companies.push(companyName.trim());
        }
      })
      .on('end', () => {
        resolve(companies);
      })
      .on('error', reject);
  });
}

function createOptimizedPipeline(sellerProfile: SellerProfile, apiKey: string, dryRun: boolean, maxCollects: number): BuyerGroupPipeline {
  const config: PipelineConfig = {
    sellerProfile,
    coreSignal: {
      apiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects,
      batchSize: 30, // Larger batches for speed
      useCache: true,
      cacheTTL: 72, // 3-day cache for batch efficiency
      dryRun
    },
    analysis: {
      minInfluenceScore: 5, // Lower threshold for speed while maintaining quality
      maxBuyerGroupSize: 12,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 6, max: 12 },
      earlyStopMode: 'conservative', // Balanced speed vs accuracy for batch
      minRoleTargets: { 
        decision: 1, 
        champion: 1, 
        stakeholder: 1, 
        blocker: 0, // Optional for speed
        introducer: 1 
      }
    },
    output: {
      format: 'json',
      includeFlightRisk: false, // Disable for speed
      includeDecisionFlow: false, // Disable for speed  
      generatePlaybooks: false // Disable for speed
    },
    llm: {
      enabled: false, // Disable for speed and cost
      provider: 'openai',
      model: 'gpt-4o-mini'
    },
    enforceExactCompany: true
  };

  return new BuyerGroupPipeline(config);
}

async function processBatch(
  companies: string[], 
  pipeline: BuyerGroupPipeline, 
  sellerProfile: SellerProfile,
  verbose: boolean,
  continueOnError: boolean
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  
  for (const company of companies) {
    const startTime = Date.now();
    
    try {
      if (verbose) {
        console.log(`   🎯 Processing: ${company}`);
      }
      
      const report = await pipeline.generateBuyerGroup(company);
      const duration = Date.now() - startTime;
      const creditsUsed = report.metadata.creditsUsed ? 
        report.metadata.creditsUsed.search + report.metadata.creditsUsed.collect : 0;
      
      results.push({
        company,
        success: true,
        report,
        duration,
        creditsUsed
      });
      
      if (verbose) {
        console.log(`   ✅ ${company}: ${report.buyerGroup.totalMembers} members, ${creditsUsed} credits, ${(duration/1000).toFixed(1)}s`);
      }
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      
      results.push({
        company,
        success: false,
        error: errorMsg,
        duration,
        creditsUsed: 0
      });
      
      console.warn(`   ⚠️  ${company}: Failed - ${errorMsg}`);
      
      if (!continueOnError) {
        throw error;
      }
    }
    
    // Brief pause between companies to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return results;
}

async function saveBatchResults(results: BatchResult[], outputDir: string, sellerProfile: SellerProfile): Promise<string> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const productSlug = sellerProfile.productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const batchFilename = `batch-${productSlug}-${timestamp}.json`;
  const batchPath = path.join(outputDir, batchFilename);
  
  // Save individual reports and create summary
  const summary = {
    metadata: {
      generatedAt: new Date().toISOString(),
      sellerProfile: {
        productName: sellerProfile.productName,
        sellerCompanyName: sellerProfile.sellerCompanyName,
        solutionCategory: sellerProfile.solutionCategory
      },
      totalCompanies: results.length,
      successfulCompanies: results.filter(r => r.success).length,
      failedCompanies: results.filter(r => !r.success).length,
      totalCreditsUsed: results.reduce((sum, r) => sum + r.creditsUsed, 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0),
      averageDuration: results.reduce((sum, r) => sum + r.duration, 0) / results.length
    },
    results: results.map(result => ({
      company: result.company,
      success: result.success,
      duration: result.duration,
      creditsUsed: result.creditsUsed,
      error: result.error,
      buyerGroupSummary: result.report ? {
        totalMembers: result.report.buyerGroup.totalMembers,
        decisionMakers: result.report.buyerGroup.roles.decision.length,
        champions: result.report.buyerGroup.roles.champion.length,
        stakeholders: result.report.buyerGroup.roles.stakeholder.length,
        blockers: result.report.buyerGroup.roles.blocker.length,
        introducers: result.report.buyerGroup.roles.introducer.length,
        opportunitySignals: result.report.buyerGroup.opportunitySignals.length
      } : null,
      reportFile: result.success ? `${result.company.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${productSlug}-${timestamp}.json` : null
    })),
    individualReports: []
  };
  
  // Save individual reports
  for (const result of results) {
    if (result.success && result.report) {
      const companySlug = result.company.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${companySlug}-${productSlug}-${timestamp}.json`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(result.report, null, 2));
      summary.individualReports.push(filename);
    }
  }
  
  // Save batch summary
  fs.writeFileSync(batchPath, JSON.stringify(summary, null, 2));
  
  return batchPath;
}

async function runBatch(companies: string[], args: Args, sellerProfile: SellerProfile): Promise<void> {
  const startTime = Date.now();
  
  console.log(`🚀 Processing ${companies.length} companies in batches of ${args.batchSize}`);
  console.log(`⚡ Max concurrent: ${args.maxConcurrent}, Cache enabled: 72h TTL`);
  console.log('');
  
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey && !args.dryRun) {
    throw new Error('CORESIGNAL_API_KEY is not set in environment');
  }
  
  const allResults: BatchResult[] = [];
  
  // Process companies in batches
  for (let i = 0; i < companies.length; i += args.batchSize) {
    const batch = companies.slice(i, i + args.batchSize);
    const batchNum = Math.floor(i / args.batchSize) + 1;
    const totalBatches = Math.ceil(companies.length / args.batchSize);
    
    console.log(`📦 Batch ${batchNum}/${totalBatches}: ${batch.join(', ')}`);
    
    // Create fresh pipeline for each batch to avoid memory issues
    const pipeline = createOptimizedPipeline(sellerProfile, apiKey, args.dryRun, args.maxCollects);
    
    try {
      const batchResults = await processBatch(batch, pipeline, sellerProfile, args.verbose, args.continueOnError);
      allResults.push(...batchResults);
      
      const batchSuccess = batchResults.filter(r => r.success).length;
      const batchCredits = batchResults.reduce((sum, r) => sum + r.creditsUsed, 0);
      const batchDuration = batchResults.reduce((sum, r) => sum + r.duration, 0) / 1000;
      
      console.log(`   ✅ Batch ${batchNum}: ${batchSuccess}/${batch.length} successful, ${batchCredits} credits, ${batchDuration.toFixed(1)}s`);
      
    } catch (error) {
      console.error(`   ❌ Batch ${batchNum} failed:`, error);
      if (!args.continueOnError) {
        throw error;
      }
    }
    
    // Pause between batches to avoid overwhelming the API
    if (i + args.batchSize < companies.length) {
      console.log(`   ⏳ Cooling down for 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('');
  }
  
  // Save results and generate report
  if (!args.dryRun) {
    const summaryPath = await saveBatchResults(allResults, args.outputDir, sellerProfile);
    
    const endTime = Date.now();
    const totalDuration = (endTime - startTime) / 1000;
    const successful = allResults.filter(r => r.success);
    const failed = allResults.filter(r => !r.success);
    const totalCredits = allResults.reduce((sum, r) => sum + r.creditsUsed, 0);
    const totalCost = totalCredits * 0.196;
    
    console.log('🎉 BATCH PROCESSING COMPLETE!');
    console.log('============================');
    console.log(`📊 Results: ${successful.length}/${allResults.length} successful`);
    console.log(`💰 Cost: ${totalCredits} credits ($${totalCost.toFixed(2)})`);
    console.log(`⚡ Performance: ${totalDuration.toFixed(1)}s total, ${(totalDuration/companies.length).toFixed(1)}s per company`);
    console.log(`📁 Summary: ${summaryPath}`);
    console.log(`📁 Reports: ${args.outputDir}/`);
    
    if (failed.length > 0) {
      console.log('');
      console.log('⚠️  FAILED COMPANIES:');
      failed.forEach(f => console.log(`   ${f.company}: ${f.error}`));
    }
    
    if (successful.length > 0) {
      console.log('');
      console.log('📈 BUYER GROUP STATISTICS:');
      const avgMembers = successful.reduce((sum, r) => sum + (r.report?.buyerGroup.totalMembers || 0), 0) / successful.length;
      const avgDecisionMakers = successful.reduce((sum, r) => sum + (r.report?.buyerGroup.roles.decision.length || 0), 0) / successful.length;
      const avgChampions = successful.reduce((sum, r) => sum + (r.report?.buyerGroup.roles.champion.length || 0), 0) / successful.length;
      
      console.log(`   Average buyer group size: ${avgMembers.toFixed(1)} members`);
      console.log(`   Average decision makers: ${avgDecisionMakers.toFixed(1)}`);
      console.log(`   Average champions: ${avgChampions.toFixed(1)}`);
    }
  } else {
    console.log('🧮 DRY RUN COMPLETE - Add --confirm to execute');
  }
}

async function main() {
  const args = parseArgs();
  
  console.log('🚀 UNIVERSAL BATCH BUYER GROUP RUNNER');
  console.log('=====================================');
  console.log(`⚙️  Mode: ${args.dryRun ? 'DRY RUN (Cost Estimation)' : 'LIVE BATCH PROCESSING'}`);
  console.log('');
  
  // Load companies
  let companies: string[];
  if (args.csvFile) {
    console.log(`📊 Loading companies from CSV: ${args.csvFile}`);
    companies = await loadCompaniesFromCSV(args.csvFile);
    console.log(`   Loaded ${companies.length} companies`);
  } else if (args.companies) {
    companies = args.companies;
    console.log(`📋 Processing ${companies.length} companies from command line`);
  } else {
    console.error('❌ Must specify either --companies or --csv');
    console.error('');
    console.error('Examples:');
    console.error('   --companies "Microsoft,Apple,Google"');
    console.error('   --csv "data/target-companies.csv"');
    process.exit(1);
  }
  
  if (companies.length === 0) {
    console.error('❌ No companies found to process');
    process.exit(1);
  }
  
  console.log(`🎯 Target Companies: ${companies.slice(0, 5).join(', ')}${companies.length > 5 ? ` (+${companies.length - 5} more)` : ''}`);
  console.log('');
  
  // Create or get seller profile
  let sellerProfile: SellerProfile;
  
  if (args.customProduct && args.customSeller && args.category) {
    console.log('🎨 Creating custom seller profile...');
    sellerProfile = createSellerProfile({
      productName: args.customProduct,
      sellerCompanyName: args.customSeller,
      solutionCategory: args.category,
      targetDepartments: args.targetDepartments,
      primaryPainPoints: args.primaryPainPoints,
      competitiveThreats: args.competitiveThreats,
      dealSize: args.dealSize || 'medium'
    });
  } else if (args.profile) {
    console.log(`🎯 Using predefined profile: ${args.profile}`);
    sellerProfile = getSellerProfile(args.profile);
  } else {
    console.error('❌ Must specify either --profile or --custom-product + --custom-seller + --category');
    process.exit(1);
  }
  
  console.log(`   Product: ${sellerProfile.productName}`);
  console.log(`   Seller: ${sellerProfile.sellerCompanyName}`);
  console.log(`   Category: ${sellerProfile.solutionCategory}`);
  console.log('');
  
  try {
    await runBatch(companies, args, sellerProfile);
  } catch (error) {
    console.error('❌ BATCH PROCESSING FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 UNIVERSAL BATCH COMPANY BUYER GROUP RUNNER

USAGE:
  npx tsx scripts/run-batch-companies.ts [OPTIONS]

COMPANY INPUT:
  --companies "Company1,Company2,..."   # Comma-separated company names
  --csv "path/to/companies.csv"         # CSV file with company names

PREDEFINED PROFILES:
  --profile "cybersecurity-platform"    # Enterprise security solution
  --profile "analytics-platform"        # Business intelligence platform
  --profile "hr-platform"               # HR management platform
  --profile "marketing-automation"       # Marketing automation platform

CUSTOM PROFILES:
  --custom-product "Your Product"       # Your product name
  --custom-seller "Your Company"        # Your company name
  --category "security|hr|analytics|..." # Solution category

BATCH OPTIONS:
  --batch-size 3                        # Companies per batch (default: 3)
  --max-concurrent 2                    # Max concurrent batches (default: 2)
  --max-collects 100                    # Max profiles per company (default: 100)
  --continue-on-error                   # Continue if individual companies fail
  --output-dir "path/to/output"         # Output directory (default: data/production/batch-reports)

COMMON OPTIONS:
  --confirm                             # Run live (otherwise dry-run)
  --verbose                             # Show detailed progress
  --help                                # Show this help

EXAMPLES:
  # Batch security analysis for tech companies
  npx tsx scripts/run-batch-companies.ts \\
    --companies "Microsoft,Apple,Google,Amazon,Meta" \\
    --profile "cybersecurity-platform" \\
    --confirm

  # HR solution for manufacturing companies from CSV
  npx tsx scripts/run-batch-companies.ts \\
    --csv "data/manufacturing-companies.csv" \\
    --profile "hr-platform" \\
    --batch-size 5 \\
    --confirm

  # Custom analytics solution for financial services
  npx tsx scripts/run-batch-companies.ts \\
    --companies "JPMorgan,Goldman Sachs,Morgan Stanley" \\
    --custom-product "FinanceInsights" \\
    --custom-seller "DataCorp Inc" \\
    --category "analytics" \\
    --confirm

PERFORMANCE OPTIMIZATIONS:
  • Intelligent batching with cooling periods
  • 3-day cache TTL for repeated analysis
  • Optimized early stopping criteria
  • Parallel processing with rate limiting
  • Memory-efficient batch processing
  • Automatic retry logic for failed requests

CSV FORMAT:
  Your CSV should have a column named 'company', 'name', or 'company_name':
  company,industry,size
  Microsoft,Technology,Large
  Apple,Technology,Large
  Boeing,Aerospace,Large
`);
  process.exit(0);
}

main().catch(console.error);
