#!/usr/bin/env tsx

/**
 * Batch Enrich All Companies with Intelligence
 * 
 * Generates intelligence/strategy data for all companies that don't have it
 * - Processes companies in specified workspace
 * - Only generates for companies missing strategyData
 * - Rate limited to avoid overwhelming the API
 * - Tracks progress and provides detailed reporting
 * 
 * Usage:
 *   npx tsx scripts/batch-enrich-all-companies.ts --workspace=top-temp
 */

// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { companyStrategyService, CompanyStrategyRequest } from '../src/platform/services/company-strategy-service';

const prisma = new PrismaClient();

// Workspace configuration
const WORKSPACE_IDS: Record<string, string> = {
  'top': '01K75ZD7DWHG1XF16HAF2YVKCK',
  'top-temp': '01K9QAP09FHT6EAP1B4G2KP3D2',
  'top-engineering-plus': '01K75ZD7DWHG1XF16HAF2YVKCK',
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
  skip: 0,
  force: args.includes('--force') // Force regenerate even if data exists
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
  totalCompanies: number;
  companiesWithData: number;
  companiesNeedingData: number;
  processed: number;
  generated: number;
  skipped: number;
  failed: number;
  startTime: number;
}

class BatchEnrichment {
  private options: typeof options;
  private stats: Stats;

  constructor(opts: typeof options) {
    this.options = opts;
    this.stats = {
      totalCompanies: 0,
      companiesWithData: 0,
      companiesNeedingData: 0,
      processed: 0,
      generated: 0,
      skipped: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  /**
   * Infer industry category from company industry
   */
  private inferIndustryCategory(industry: string | null): string | null {
    if (!industry) return null;
    
    const industryLower = industry.toLowerCase();
    
    if (industryLower.includes('utility') || 
        industryLower.includes('energy') || 
        industryLower.includes('power') || 
        industryLower.includes('electric') ||
        industryLower.includes('utilities')) {
      return 'Utilities/Energy';
    }
    
    if (industryLower.includes('healthcare') || 
        industryLower.includes('health') || 
        industryLower.includes('hospital') || 
        industryLower.includes('medical')) {
      return 'Healthcare';
    }
    
    if (industryLower.includes('bank') || 
        industryLower.includes('financial') || 
        industryLower.includes('insurance') || 
        industryLower.includes('finance')) {
      return 'Financial Services';
    }
    
    if (industryLower.includes('software') || 
        industryLower.includes('technology') || 
        industryLower.includes('tech') || 
        industryLower.includes('saas') ||
        industryLower.includes('it services') ||
        industryLower.includes('information technology')) {
      return 'Technology/SaaS';
    }
    
    if (industryLower.includes('manufacturing') || 
        industryLower.includes('manufacturer')) {
      return 'Manufacturing';
    }
    
    if (industryLower.includes('retail') || 
        industryLower.includes('e-commerce') || 
        industryLower.includes('ecommerce')) {
      return 'Retail/E-commerce';
    }
    
    if (industryLower.includes('real estate') || 
        industryLower.includes('title') || 
        industryLower.includes('property')) {
      return 'Real Estate';
    }
    
    if (industryLower.includes('education') || 
        industryLower.includes('school') || 
        industryLower.includes('university')) {
      return 'Education';
    }
    
    if (industryLower.includes('government') || 
        industryLower.includes('public sector')) {
      return 'Government/Public Sector';
    }
    
    if (industryLower.includes('consulting') || 
        industryLower.includes('professional services') || 
        industryLower.includes('legal') ||
        industryLower.includes('law')) {
      return 'Professional Services';
    }
    
    if (industryLower.includes('non-profit') || 
        industryLower.includes('nonprofit') || 
        industryLower.includes('non profit')) {
      return 'Non-Profit';
    }
    
    return industry;
  }

  /**
   * Parse company size to number
   */
  private parseCompanySize(size: any): number {
    if (typeof size === 'number') return size;
    if (!size) return 0;
    const sizeStr = String(size).toLowerCase();
    const match = sizeStr.match(/(\d{1,3}(?:,\d{3})*)/);
    if (match) return parseInt(match[1].replace(/,/g, ''), 10);
    const rangeMatch = sizeStr.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) return parseInt(rangeMatch[2], 10);
    if (sizeStr.includes('10000+') || sizeStr.includes('enterprise')) return 10000;
    if (sizeStr.includes('5000+')) return 5000;
    if (sizeStr.includes('1000+')) return 1000;
    if (sizeStr.includes('500+')) return 500;
    if (sizeStr.includes('200+')) return 200;
    if (sizeStr.includes('50+')) return 50;
    return 0;
  }

  /**
   * Determine growth stage
   */
  private determineGrowthStage(age: number, size: number, revenue: number): 'startup' | 'growth' | 'mature' | 'declining' {
    if (age < 3 && size < 50) return 'startup';
    if (age < 10 && size < 500) return 'growth';
    if (age >= 10 || size >= 500) return 'mature';
    if (age > 20 && size < 100 && revenue < 1000000) return 'declining';
    return 'mature';
  }

  /**
   * Determine market position
   */
  private determineMarketPosition(size: number, revenue: number, globalRank?: number): 'leader' | 'challenger' | 'follower' | 'niche' {
    if (globalRank && globalRank <= 1000) return 'leader';
    if (revenue > 1000000000) return 'leader';
    if (size > 1000 || revenue > 100000000) return 'challenger';
    if (size > 100 || revenue > 10000000) return 'follower';
    return 'niche';
  }

  /**
   * Generate strategy for a single company
   */
  async generateStrategy(company: any) {
    this.stats.processed++;

    const customFields = company.customFields as any;
    const hasStrategy = !!customFields?.strategyData;

    console.log(`\n[${this.stats.processed}] ${company.name}`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Industry: ${company.industry || 'Unknown'}`);

    // Skip if already has data and not forcing
    if (hasStrategy && !this.options.force) {
      console.log(`   ⏭️  Skipped: Already has strategyData`);
      this.stats.skipped++;
      return { success: true, skipped: true };
    }

    try {
      if (this.options.dryRun) {
        console.log(`   🏃 DRY RUN: Would generate strategy`);
        this.stats.generated++;
        return { success: true, dryRun: true };
      }

      // Get company people (limit to 20 for performance)
      const people = await prisma.people.findMany({
        where: {
          companyId: company.id,
          deletedAt: null
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          jobTitle: true,
          email: true,
          phone: true,
          linkedinUrl: true,
          lastAction: true,
          nextAction: true
        },
        take: 20
      });

      // Infer targetIndustry
      const inferredTargetIndustry = customFields?.targetIndustry || 
        (company.industry ? this.inferIndustryCategory(company.industry) : null) ||
        (company.sector ? this.inferIndustryCategory(company.sector) : null) ||
        'Unknown';

      // Calculate company characteristics
      const companyAge = company.foundedYear ? new Date().getFullYear() - company.foundedYear : 0;
      const companySize = this.parseCompanySize(company.size || company.employeeCount);
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
        forceRegenerate: this.options.force,
        website: company.website,
        headquarters: company.hqLocation,
        foundedYear: company.foundedYear,
        isPublic: company.isPublic,
        sector: company.sector,
        description: company.description,
        linkedinFollowers: company.linkedinFollowers,
        globalRank: company.globalRank,
        competitors: Array.isArray(company.competitors) ? company.competitors : [],
        lastAction: company.lastAction,
        nextAction: company.nextAction,
        opportunityStage: company.opportunityStage,
        opportunityAmount: company.opportunityAmount,
        people: people.map(p => ({
          id: p.id,
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          title: p.jobTitle || '',
          email: p.email,
          phone: p.phone,
          linkedinUrl: p.linkedinUrl,
          lastAction: p.lastAction,
          nextAction: p.nextAction
        }))
      };

      console.log(`   🤖 Generating strategy...`);
      const result = await companyStrategyService.generateCompanyStrategy(strategyRequest);

      if (result.success && result.data) {
        const strategy = result.data;
        
        // Update company record
        await prisma.companies.update({
          where: { id: company.id },
          data: {
            customFields: {
              ...(customFields || {}),
              strategyData: strategy,
              lastStrategyUpdate: new Date().toISOString()
            }
          }
        });
        
        console.log(`   ✅ Strategy generated:`);
        console.log(`      Target Industry: ${strategy.targetIndustry || 'Unknown'}`);
        console.log(`      Archetype: ${strategy.archetypeName || '-'}`);
        
        this.stats.generated++;
        return { success: true, result };
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
   * Run batch enrichment
   */
  async run() {
    try {
      console.log('\n🚀 BATCH ENRICH ALL COMPANIES WITH INTELLIGENCE');
      console.log('='.repeat(80));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.log(`Force Regenerate: ${this.options.force ? 'YES' : 'NO'}`);
      console.log(`Limit: ${this.options.limit || 'None'}`);
      console.log(`Skip: ${this.options.skip}`);
      console.log('='.repeat(80));

      if (!this.options.workspace) {
        console.error('❌ Error: --workspace is required');
        console.log('\nUsage: npx tsx scripts/batch-enrich-all-companies.ts --workspace=top-temp');
        process.exit(1);
      }

      const workspaceId = WORKSPACE_IDS[this.options.workspace];
      if (!workspaceId) {
        console.error(`❌ Error: Unknown workspace "${this.options.workspace}"`);
        console.log(`Available workspaces: ${Object.keys(WORKSPACE_IDS).join(', ')}`);
        process.exit(1);
      }

      // Get all companies
      const allCompanies = await prisma.companies.findMany({
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
          hqLocation: true,
          description: true,
          isPublic: true,
          linkedinFollowers: true,
          globalRank: true,
          competitors: true,
          lastAction: true,
          nextAction: true,
          opportunityStage: true,
          opportunityAmount: true,
          customFields: true
        },
        orderBy: { createdAt: 'desc' }
      });

      this.stats.totalCompanies = allCompanies.length;

      // Filter companies needing data
      const companiesNeedingData = this.options.force 
        ? allCompanies 
        : allCompanies.filter(company => {
            const customFields = company.customFields as any;
            return !customFields?.strategyData;
          });

      this.stats.companiesWithData = this.stats.totalCompanies - companiesNeedingData.length;
      this.stats.companiesNeedingData = companiesNeedingData.length;

      // Apply skip and limit
      const companiesToProcess = companiesNeedingData
        .slice(this.options.skip)
        .slice(0, this.options.limit || companiesNeedingData.length);

      console.log(`\n📊 STATISTICS:`);
      console.log(`   Total companies: ${this.stats.totalCompanies}`);
      console.log(`   Companies with data: ${this.stats.companiesWithData}`);
      console.log(`   Companies needing data: ${this.stats.companiesNeedingData}`);
      console.log(`   Companies to process: ${companiesToProcess.length}\n`);

      if (companiesToProcess.length === 0) {
        console.log('✅ All companies already have intelligence data!');
        return;
      }

      // Process each company
      for (let i = 0; i < companiesToProcess.length; i++) {
        const company = companiesToProcess[i];
        
        await this.generateStrategy(company);

        // Rate limiting: wait 1 second between requests (AI calls)
        if (i < companiesToProcess.length - 1 && !this.options.dryRun) {
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
   * Print progress
   */
  printProgress() {
    console.log('\n' + '─'.repeat(80));
    console.log(`📊 Progress: ${this.stats.processed} processed`);
    console.log(`   ✅ Generated: ${this.stats.generated}`);
    console.log(`   ⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`   ❌ Failed: ${this.stats.failed}`);
    console.log('─'.repeat(80) + '\n');
  }

  /**
   * Print final report
   */
  printFinalReport() {
    const duration = Math.round((Date.now() - this.stats.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + '='.repeat(80));
    console.log('🚀 BATCH ENRICHMENT COMPLETE');
    console.log('='.repeat(80));
    console.log(`Total Companies: ${this.stats.totalCompanies}`);
    console.log(`Companies with Data: ${this.stats.companiesWithData}`);
    console.log(`Companies Needing Data: ${this.stats.companiesNeedingData}`);
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`✅ Generated: ${this.stats.generated}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    console.log('='.repeat(80) + '\n');
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Enrich All Companies with Intelligence

Generates intelligence/strategy data for all companies missing it.

Usage:
  npx tsx scripts/batch-enrich-all-companies.ts [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.) [REQUIRED]
  --dry-run             Preview only, don't make changes
  --force               Force regenerate even if data exists
  --limit=<n>           Limit number of companies to process
  --skip=<n>            Skip first N companies
  --help, -h            Show this help message

Examples:
  npx tsx scripts/batch-enrich-all-companies.ts --workspace=top-temp --dry-run
  npx tsx scripts/batch-enrich-all-companies.ts --workspace=top-temp --limit=10
  npx tsx scripts/batch-enrich-all-companies.ts --workspace=top-temp
`);
    process.exit(0);
  }

  const enrichment = new BatchEnrichment(options);
  await enrichment.run();
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

