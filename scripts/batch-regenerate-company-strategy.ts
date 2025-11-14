#!/usr/bin/env tsx

/**
 * Batch Company Strategy Regeneration Script
 * 
 * Regenerates company strategy/intelligence data with corrected industry classification
 * - Processes companies in specified workspace
 * - Forces regeneration to get fresh data with new industry logic
 * - Rate limited to avoid overwhelming the API
 * - Tracks progress and provides detailed reporting
 * 
 * Usage:
 *   npx tsx scripts/batch-regenerate-company-strategy.ts --workspace=top-temp
 */

// Load environment variables from .env file
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Try .env.local first
dotenv.config(); // Fallback to .env

import { PrismaClient } from '@prisma/client';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

const prisma = new PrismaClient();

// Workspace configuration
const WORKSPACE_IDS: Record<string, string> = {
  'top-temp': '01K9QAP09FHT6EAP1B4G2KP3D2',
  'notary-everyday': '01K7DNYR5VZ7JY36KGKKN76XZ1',
  'adrata': '01K7464TNANHQXPCZT1FYX205V',
  'cloudcaddie': '01K7DSWP8ZBA75K5VSWVXPEMAH',
  'pinpoint': '01K90EQWJCCN2JDMRQF12F49GN',
  'ei-cooperative': '01K9WFW99WEGDQY2RARPCVC4JD'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  workspace: null as string | null,
  dryRun: args.includes('--dry-run'),
  limit: null as number | null,
  skip: 0
};

// Parse workspace argument
const workspaceArg = args.find(arg => arg.startsWith('--workspace='));
if (workspaceArg) {
  options.workspace = workspaceArg.split('=')[1];
}

// Parse limit argument
const limitArg = args.find(arg => arg.startsWith('--limit='));
if (limitArg) {
  options.limit = parseInt(limitArg.split('=')[1]);
}

// Parse skip argument
const skipArg = args.find(arg => arg.startsWith('--skip='));
if (skipArg) {
  options.skip = parseInt(skipArg.split('=')[1]);
}

interface Stats {
  totalProcessed: number;
  regenerated: number;
  skipped: number;
  failed: number;
  industryDistribution: Record<string, number>;
  startTime: number;
}

class BatchStrategyRegeneration {
  private options: typeof options;
  private stats: Stats;

  constructor(opts: typeof options) {
    this.options = opts;
    this.stats = {
      totalProcessed: 0,
      regenerated: 0,
      skipped: 0,
      failed: 0,
      industryDistribution: {},
      startTime: Date.now()
    };
  }

  /**
   * Infer industry category from company industry
   */
  private inferIndustryCategory(industry: string | null): string | null {
    if (!industry) return null;
    
    const industryLower = industry.toLowerCase();
    
    // Utility/Energy sector
    if (industryLower.includes('utility') || 
        industryLower.includes('energy') || 
        industryLower.includes('power') || 
        industryLower.includes('electric') ||
        industryLower.includes('utilities')) {
      return 'Utilities/Energy';
    }
    
    // Healthcare
    if (industryLower.includes('healthcare') || 
        industryLower.includes('health') || 
        industryLower.includes('hospital') || 
        industryLower.includes('medical')) {
      return 'Healthcare';
    }
    
    // Financial Services
    if (industryLower.includes('bank') || 
        industryLower.includes('financial') || 
        industryLower.includes('insurance') || 
        industryLower.includes('finance')) {
      return 'Financial Services';
    }
    
    // Technology/SaaS
    if (industryLower.includes('software') || 
        industryLower.includes('technology') || 
        industryLower.includes('tech') || 
        industryLower.includes('saas') ||
        industryLower.includes('it services') ||
        industryLower.includes('information technology')) {
      return 'Technology/SaaS';
    }
    
    // Manufacturing
    if (industryLower.includes('manufacturing') || 
        industryLower.includes('manufacturer')) {
      return 'Manufacturing';
    }
    
    // Retail
    if (industryLower.includes('retail') || 
        industryLower.includes('e-commerce') || 
        industryLower.includes('ecommerce')) {
      return 'Retail/E-commerce';
    }
    
    // Real Estate
    if (industryLower.includes('real estate') || 
        industryLower.includes('title') || 
        industryLower.includes('property')) {
      return 'Real Estate';
    }
    
    // Education
    if (industryLower.includes('education') || 
        industryLower.includes('school') || 
        industryLower.includes('university')) {
      return 'Education';
    }
    
    // Government
    if (industryLower.includes('government') || 
        industryLower.includes('public sector')) {
      return 'Government/Public Sector';
    }
    
    // Professional Services
    if (industryLower.includes('consulting') || 
        industryLower.includes('professional services') || 
        industryLower.includes('legal') ||
        industryLower.includes('law')) {
      return 'Professional Services';
    }
    
    // Non-Profit
    if (industryLower.includes('non-profit') || 
        industryLower.includes('nonprofit') || 
        industryLower.includes('non profit')) {
      return 'Non-Profit';
    }
    
    // If no match, return the original industry as-is
    return industry;
  }

  /**
   * Regenerate strategy for a single company
   */
  async regenerateStrategy(company: any) {
    this.stats.totalProcessed++;
    
    console.log(`\n[${this.stats.totalProcessed}] ${company.name}`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Industry: ${company.industry || 'Unknown'}`);
    console.log(`   Sector: ${company.sector || 'Unknown'}`);

    try {
      if (this.options.dryRun) {
        console.log(`   🏃 DRY RUN: Would regenerate strategy`);
        this.stats.regenerated++;
        return { success: true, dryRun: true };
      }

      // Infer targetIndustry from company industry if not set
      const inferredTargetIndustry = (company.customFields as any)?.targetIndustry || 
        (company.industry ? this.inferIndustryCategory(company.industry) : null) ||
        (company.sector ? this.inferIndustryCategory(company.sector) : null) ||
        'Unknown';

      // Intelligently determine company characteristics
      const companyAge = company.foundedYear ? new Date().getFullYear() - company.foundedYear : 0;
      const companySize = typeof company.size === 'string' ? parseInt(company.size) || company.employeeCount || 0 : (company.size || company.employeeCount || 0);
      const companyRevenue = company.revenue ? parseFloat(company.revenue.toString()) : 0;
      
      const growthStage = this.determineGrowthStage(companyAge, companySize, companyRevenue);
      const marketPosition = this.determineMarketPosition(companySize, companyRevenue, company.globalRank);

      // Build strategy request
      const strategyRequest: CompanyStrategyRequest = {
        companyId: company.id,
        companyName: company.name,
        companyIndustry: company.industry || 'Unknown',
        targetIndustry: inferredTargetIndustry,
        companySize: companySize,
        companyRevenue: companyRevenue,
        companyAge: companyAge,
        growthStage: growthStage,
        marketPosition: marketPosition,
        forceRegenerate: true,
        website: company.website,
        sector: company.sector,
        description: company.description
      };

      // Call strategy service
      const result = await companyStrategyService.generateCompanyStrategy(strategyRequest);

      if (result.success && result.data) {
        const strategy = result.data;
        const targetIndustry = strategy.targetIndustry || 'Unknown';
        
        // Update company record with new strategy data
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            customFields: {
              ...((company.customFields as any) || {}),
              strategyData: strategy,
              lastStrategyUpdate: new Date().toISOString()
            }
          }
        });
        
        console.log(`   ✅ Strategy regenerated:`);
        console.log(`      Target Industry: ${targetIndustry}`);
        console.log(`      Archetype: ${strategy.archetypeName || '-'}`);
        console.log(`      Generated By: ${strategy.strategyGeneratedBy || '-'}`);
        
        // Track industry distribution
        this.stats.industryDistribution[targetIndustry] = 
          (this.stats.industryDistribution[targetIndustry] || 0) + 1;
        
        this.stats.regenerated++;
        return { success: true, result, targetIndustry };
      } else {
        console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
        this.stats.failed++;
        return { success: false, error: result.error || 'Unknown error' };
      }

    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}`);
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Run batch strategy regeneration
   */
  async run() {
    try {
      console.log('\n🔄 BATCH COMPANY STRATEGY REGENERATION');
      console.log('='.repeat(60));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.log(`Limit: ${this.options.limit || 'None'}`);
      console.log(`Skip: ${this.options.skip}`);
      console.log('='.repeat(60));

      if (!this.options.workspace) {
        console.error('❌ Error: --workspace is required');
        console.log('\nUsage: npx tsx scripts/batch-regenerate-company-strategy.ts --workspace=top-temp');
        process.exit(1);
      }

      const workspaceId = WORKSPACE_IDS[this.options.workspace];
      if (!workspaceId) {
        console.error(`❌ Error: Unknown workspace "${this.options.workspace}"`);
        console.log(`Available workspaces: ${Object.keys(WORKSPACE_IDS).join(', ')}`);
        process.exit(1);
      }

      // Query companies with all needed fields
      const companies = await prisma.companies.findMany({
        where: {
          workspaceId: workspaceId,
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          industry: true,
          sector: true,
          size: true,
          employeeCount: true,
          revenue: true,
          foundedYear: true,
          website: true,
          description: true,
          globalRank: true,
          customFields: true
        },
        orderBy: { createdAt: 'desc' },
        skip: this.options.skip,
        take: this.options.limit || undefined
      });

      console.log(`\n📊 Found ${companies.length} companies to process\n`);

      if (companies.length === 0) {
        console.log('No companies to process.');
        return;
      }

      // Process each company
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        
        await this.regenerateStrategy(company);

        // Rate limiting: wait 1 second between requests (AI calls)
        if (i < companies.length - 1 && !this.options.dryRun) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Progress checkpoint every 10 records
        if ((i + 1) % 10 === 0) {
          this.printProgress();
        }
      }

      // Final report
      this.printFinalReport();

    } catch (error) {
      console.error('\n❌ Fatal error:', error);
      throw error;
    } finally {
      await prisma.$disconnect();
    }
  }

  /**
   * Helper: Determine growth stage intelligently
   */
  private determineGrowthStage(age: number, size: number, revenue: number): 'startup' | 'growth' | 'mature' | 'declining' {
    // Startup: New companies (< 3 years) with small teams
    if (age < 3 && size < 50) return 'startup';
    
    // Growth: Young companies (< 10 years) scaling up
    if (age < 10 && size < 500) return 'growth';
    
    // Mature: Established companies (10+ years) with substantial size
    if (age >= 10 || size >= 500) return 'mature';
    
    // Declining: Old companies with small size (indicating contraction)
    if (age > 20 && size < 100 && revenue < 1000000) return 'declining';
    
    return 'mature'; // Default to mature
  }

  /**
   * Helper: Determine market position intelligently
   */
  private determineMarketPosition(size: number, revenue: number, globalRank?: number): 'leader' | 'challenger' | 'follower' | 'niche' {
    // Leader: High global rank (top 1000) or very large companies
    if (globalRank && globalRank <= 1000) return 'leader';
    if (revenue > 1000000000) return 'leader'; // $1B+ revenue
    
    // Challenger: Large companies competing with leaders
    if (size > 1000 || revenue > 100000000) return 'challenger'; // 1000+ employees or $100M+ revenue
    
    // Follower: Mid-sized companies following market trends
    if (size > 100 || revenue > 10000000) return 'follower'; // 100+ employees or $10M+ revenue
    
    // Niche: Small, specialized companies
    return 'niche';
  }

  /**
   * Print progress
   */
  printProgress() {
    console.log('\n' + '─'.repeat(60));
    console.log(`📊 Progress: ${this.stats.totalProcessed} processed`);
    console.log(`   ✅ Regenerated: ${this.stats.regenerated}`);
    console.log(`   ⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`   ❌ Failed: ${this.stats.failed}`);
    console.log('─'.repeat(60) + '\n');
  }

  /**
   * Print final report
   */
  printFinalReport() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + '='.repeat(60));
    console.log('🔄 BATCH COMPANY STRATEGY REGENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Processed: ${this.stats.totalProcessed}`);
    console.log(`✅ Regenerated: ${this.stats.regenerated}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    
    if (Object.keys(this.stats.industryDistribution).length > 0) {
      console.log('\n📊 Industry Distribution:');
      Object.entries(this.stats.industryDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([industry, count]) => {
          console.log(`   ${industry}: ${count}`);
        });
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Company Strategy Regeneration Script

Regenerates company strategy/intelligence data with corrected industry classification.

Usage:
  npx tsx scripts/batch-regenerate-company-strategy.ts [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.) [REQUIRED]
  --dry-run             Preview only, don't make changes
  --limit=<n>           Limit number of companies to process
  --skip=<n>            Skip first N companies
  --help, -h            Show this help message

Examples:
  npx tsx scripts/batch-regenerate-company-strategy.ts --workspace=top-temp --dry-run
  npx tsx scripts/batch-regenerate-company-strategy.ts --workspace=top-temp --limit=10
  npx tsx scripts/batch-regenerate-company-strategy.ts --workspace=top-temp
`);
    process.exit(0);
  }

  const regeneration = new BatchStrategyRegeneration(options);
  await regeneration.run();
}

main()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

