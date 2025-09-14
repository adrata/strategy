#!/usr/bin/env npx tsx
/**
 * 🚀 UNIVERSAL SINGLE COMPANY BUYER GROUP RUNNER
 * 
 * Fast, optimized script for running buyer group analysis on any company
 * 
 * Usage:
 *   # Using predefined profiles
 *   npx tsx scripts/run-single-company.ts --company "Microsoft" --profile "cybersecurity-platform" --confirm
 *   
 *   # Using custom profile  
 *   npx tsx scripts/run-single-company.ts --company "Goldman Sachs" --custom-product "SecureVault" --custom-seller "CyberShield Inc" --category "security" --confirm
 *   
 *   # Dry run (cost estimation)
 *   npx tsx scripts/run-single-company.ts --company "Apple" --profile "analytics-platform"
 */

import * as path from 'path';
import * as fs from 'fs';
import { 
  BuyerGroupPipeline, 
  PipelineConfig, 
  getSellerProfile, 
  createSellerProfile,
  SellerProfile 
} from '../src/platform/services/buyer-group/index.ts';

interface Args {
  company: string;
  profile?: string;
  customProduct?: string;
  customSeller?: string;
  category?: SellerProfile['solutionCategory'];
  targetDepartments?: string[];
  primaryPainPoints?: string[];
  competitiveThreats?: string[];
  dealSize?: SellerProfile['dealSize'];
  maxCollects: number;
  dryRun: boolean;
  confirm: boolean;
  verbose: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  const company = getArg(args, '--company') || 'Microsoft';
  const profile = getArg(args, '--profile');
  const customProduct = getArg(args, '--custom-product');
  const customSeller = getArg(args, '--custom-seller'); 
  const category = getArg(args, '--category') as SellerProfile['solutionCategory'];
  const targetDepartments = getArg(args, '--target-departments')?.split(',').map(d => d.trim());
  const primaryPainPoints = getArg(args, '--pain-points')?.split(',').map(p => p.trim());
  const competitiveThreats = getArg(args, '--competitive-threats')?.split(',').map(t => t.trim());
  const dealSize = getArg(args, '--deal-size') as SellerProfile['dealSize'];
  const maxCollectsStr = getArg(args, '--max-collects') || '120';
  const maxCollects = Number.parseInt(maxCollectsStr, 10);
  const dryRun = args.includes('--dry-run') || !args.includes('--confirm');
  const confirm = args.includes('--confirm');
  const verbose = args.includes('--verbose') || args.includes('-v');

  return {
    company,
    profile,
    customProduct,
    customSeller,
    category,
    targetDepartments,
    primaryPainPoints,
    competitiveThreats,
    dealSize,
    maxCollects: Number.isFinite(maxCollects) ? maxCollects : 120,
    dryRun,
    confirm,
    verbose
  };
}

function getArg(args: string[], key: string): string | undefined {
  const hit = args.find((a) => a.startsWith(key + '='));
  return hit ? hit.split('=').slice(1).join('=') : undefined;
}

async function main() {
  const startTime = Date.now();
  const args = parseArgs();
  
  console.log('🚀 UNIVERSAL BUYER GROUP RUNNER');
  console.log('================================');
  console.log(`🎯 Target Company: ${args.company}`);
  console.log(`⚙️  Mode: ${args.dryRun ? 'DRY RUN (Cost Estimation)' : 'LIVE RUN'}`);
  console.log('');

  // Validate API key
  const apiKey = process.env.CORESIGNAL_API_KEY || '';
  if (!apiKey && !args.dryRun) {
    console.error('❌ CORESIGNAL_API_KEY is not set in environment');
    console.error('   Set it or use --dry-run for cost estimation');
    process.exit(1);
  }

  // Create or get seller profile
  let sellerProfile: SellerProfile;
  
  if (args.customProduct && args.customSeller && args.category) {
    // Create custom profile
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
    
    console.log(`   Product: ${sellerProfile.productName}`);
    console.log(`   Seller: ${sellerProfile.sellerCompanyName}`);
    console.log(`   Category: ${sellerProfile.solutionCategory}`);
    console.log(`   Target Departments: ${sellerProfile.targetDepartments?.join(', ') || 'Auto-detected'}`);
  } else if (args.profile) {
    // Use predefined profile
    console.log(`🎯 Using predefined profile: ${args.profile}`);
    sellerProfile = getSellerProfile(args.profile);
    console.log(`   Product: ${sellerProfile.productName}`);
    console.log(`   Seller: ${sellerProfile.sellerCompanyName}`);
  } else {
    console.error('❌ Must specify either --profile or --custom-product + --custom-seller + --category');
    console.error('');
    console.error('Examples:');
    console.error('   --profile "cybersecurity-platform"');  
    console.error('   --custom-product "SecureVault" --custom-seller "CyberShield Inc" --category "security"');
    process.exit(1);
  }

  console.log('');

  // Optimize configuration for speed
  const config: PipelineConfig = {
    sellerProfile,
    coreSignal: {
      apiKey,
      baseUrl: 'https://api.coresignal.com',
      maxCollects: args.maxCollects,
      batchSize: 25, // Larger batches for speed
      useCache: true,
      cacheTTL: 72, // 3-day cache for performance
      dryRun: args.dryRun
    },
    analysis: {
      minInfluenceScore: 6, // Balanced accuracy vs speed
      maxBuyerGroupSize: 15,
      requireDirector: false,
      allowIC: true,
      targetBuyerGroupRange: { min: 8, max: 15 },
      earlyStopMode: 'accuracy_first', // Stop when good buyer group found
      minRoleTargets: { 
        decision: 1, 
        champion: 2, 
        stakeholder: 2, 
        blocker: 1, 
        introducer: 1 
      }
    },
    output: {
      format: 'json',
      includeFlightRisk: true,
      includeDecisionFlow: true,
      generatePlaybooks: true
    },
    llm: {
      enabled: false, // Disable for speed
      provider: 'openai',
      model: 'gpt-4o-mini'
    },
    enforceExactCompany: true
  };

  // Run pipeline
  console.log('⚡ Starting buyer group generation...');
  const pipeline = new BuyerGroupPipeline(config);
  
  try {
    const report = await pipeline.generateBuyerGroup(args.company);
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Display results
    console.log('');
    console.log('✅ BUYER GROUP GENERATED SUCCESSFULLY!');
    console.log('======================================');
    
    if (args.dryRun) {
      console.log('💰 COST ESTIMATION:');
      console.log(`   Estimated Credits: ${report.metadata.estimatedCredits || 0}`);
      console.log(`   Estimated Cost: $${(report.metadata.estimatedCost || 0).toFixed(2)}`);
      console.log('');
      console.log('💡 To run with actual API calls, add --confirm flag');
    } else {
      console.log('👥 BUYER GROUP COMPOSITION:');
      console.log(`   Decision Makers: ${report.buyerGroup.roles.decision.length}`);
      console.log(`   Champions: ${report.buyerGroup.roles.champion.length}`);
      console.log(`   Stakeholders: ${report.buyerGroup.roles.stakeholder.length}`);
      console.log(`   Blockers: ${report.buyerGroup.roles.blocker.length}`);
      console.log(`   Introducers: ${report.buyerGroup.roles.introducer.length}`);
      console.log(`   Total Members: ${report.buyerGroup.totalMembers}`);
      console.log('');
      console.log('💰 COST BREAKDOWN:');
      console.log(`   Search Credits: ${report.metadata.creditsUsed.search}`);
      console.log(`   Collect Credits: ${report.metadata.creditsUsed.collect}`);
      console.log(`   Total Credits: ${report.metadata.creditsUsed.search + report.metadata.creditsUsed.collect}`);
      console.log(`   Estimated Cost: $${((report.metadata.creditsUsed.search + report.metadata.creditsUsed.collect) * 0.196).toFixed(2)}`);
    }
    
    console.log('');
    console.log('⚡ PERFORMANCE:');
    console.log(`   Duration: ${duration.toFixed(1)}s`);
    console.log(`   Cache Hits: ${pipeline.getStats().cacheStats.size} items`);
    
    // Save report
    if (!args.dryRun) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const companySlug = args.company.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const productSlug = sellerProfile.productName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const filename = `${companySlug}-${productSlug}-${timestamp}.json`;
      const outPath = path.join('data', 'production', 'reports', filename);
      
      // Ensure directory exists
      const dir = path.dirname(outPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      await pipeline.exportReport(report, outPath);
      console.log(`   Report: ${outPath}`);
    }

    // Show sample results if verbose
    if (args.verbose && !args.dryRun) {
      console.log('');
      console.log('🔍 SAMPLE RESULTS:');
      console.log('==================');
      
      if (report.buyerGroup.roles.decision.length > 0) {
        const dm = report.buyerGroup.roles.decision[0];
        if (dm) {
          const profile = report.buyerGroup.roles.decision.find(r => r.personId === dm.personId);
          console.log(`Decision Maker: ${profile ? 'Found profile data' : 'Profile not found'} (Confidence: ${(dm.confidence * 100).toFixed(0)}%)`);
        }
      }
      
      if (report.buyerGroup.roles.champion.length > 0) {
        const champion = report.buyerGroup.roles.champion[0];
        if (champion) {
          console.log(`Champion: Score ${champion.score?.toFixed(1) ?? 'N/A'} (Confidence: ${(champion.confidence * 100).toFixed(0)}%)`);
        }
      }
      
      console.log(`Opportunity Score: ${report.buyerGroup.opportunitySignals.length} signals detected`);
    }

  } catch (error) {
    console.error('❌ PIPELINE FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🚀 UNIVERSAL SINGLE COMPANY BUYER GROUP RUNNER

USAGE:
  npx tsx scripts/run-single-company.ts [OPTIONS]

PREDEFINED PROFILES:
  --profile "buyer-group-intelligence"  # Adrata's buyer group intelligence (default)
  --profile "cybersecurity-platform"    # Enterprise security solution
  --profile "analytics-platform"        # Business intelligence platform  
  --profile "hr-platform"               # HR management platform
  --profile "marketing-automation"       # Marketing automation platform
  --profile "universal-b2b"             # Generic B2B solution

CUSTOM PROFILES:
  --custom-product "Your Product"       # Your product name
  --custom-seller "Your Company"        # Your company name  
  --category "security|hr|analytics|..."# Solution category
  --target-departments "hr,talent"      # Target departments (optional)
  --pain-points "problem1,problem2"     # Problems you solve (optional)
  --competitive-threats "finance,legal" # Potential blockers (optional)
  --deal-size "small|medium|large|enterprise" # Deal size (optional)

COMMON OPTIONS:
  --company "Target Company"            # Company to analyze (required)
  --max-collects 120                    # Max profiles to collect (default: 120)
  --confirm                             # Run live (otherwise dry-run)
  --verbose                             # Show detailed results
  --help                                # Show this help

EXAMPLES:
  # Dry run cost estimation
  npx tsx scripts/run-single-company.ts --company "Microsoft" --profile "cybersecurity-platform"

  # Live run with predefined profile
  npx tsx scripts/run-single-company.ts --company "Goldman Sachs" --profile "cybersecurity-platform" --confirm

  # Custom HR solution for manufacturing company
  npx tsx scripts/run-single-company.ts \\
    --company "Boeing" \\
    --custom-product "TalentFlow" \\
    --custom-seller "PeopleFirst Solutions" \\
    --category "hr" \\
    --target-departments "hr,talent,people operations" \\
    --pain-points "talent acquisition,employee engagement" \\
    --confirm

SPEED OPTIMIZATIONS:
  • Larger batch sizes (25 profiles per batch)
  • 3-day cache TTL for repeated runs
  • Early stop when buyer group criteria met
  • Parallel processing where possible
  • Optimized query building
`);
  process.exit(0);
}

main().catch(console.error);
