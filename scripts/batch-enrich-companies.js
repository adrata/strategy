#!/usr/bin/env node

/**
 * Batch Company Enrichment Script
 * 
 * Enriches existing company records with data from CoreSignal, Perplexity, and Lusha
 * - Only enriches companies with website OR LinkedIn URL
 * - Skips companies already enriched in last 30 days
 * - Rate limited to 1 request per second
 * - Tracks progress and can resume from checkpoint
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const http = require('http');

const prisma = new PrismaClient();

// Workspace configuration
const WORKSPACE_IDS = {
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
  workspace: null,
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  limit: null,
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

class BatchCompanyEnrichment {
  constructor(options) {
    this.options = options;
    this.stats = {
      totalProcessed: 0,
      enriched: 0,
      skipped: 0,
      failed: 0,
      fieldsPopulated: {},
      startTime: Date.now()
    };
  }

  /**
   * Make internal API call to enrich endpoint
   */
  async enrichCompanyViaAPI(companyId) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        type: 'company',
        entityId: companyId,
        options: {}
      });

      const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/v1/enrich',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const result = JSON.parse(responseData);
            resolve(result);
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Check if company needs enrichment
   */
  needsEnrichment(company) {
    // Must have identifier
    if (!company.website && !company.linkedinUrl) {
      return { needs: false, reason: 'No website or LinkedIn URL' };
    }

    // Check if recently enriched (skip unless --force)
    if (!this.options.force && company.lastVerified) {
      const daysSince = (Date.now() - new Date(company.lastVerified).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        return { needs: false, reason: `Recently enriched ${Math.round(daysSince)} days ago` };
      }
    }

    // Check for missing critical fields
    const missingFields = [];
    if (!company.industry) missingFields.push('industry');
    if (!company.employeeCount) missingFields.push('employeeCount');
    if (!company.description) missingFields.push('description');
    if (!company.revenue) missingFields.push('revenue');
    if (!company.foundedYear) missingFields.push('foundedYear');

    if (missingFields.length === 0 && !this.options.force) {
      return { needs: false, reason: 'All critical fields populated' };
    }

    return { needs: true, reason: `Missing: ${missingFields.join(', ')}`, missingFields };
  }

  /**
   * Enrich a single company
   */
  async enrichCompany(company) {
    this.stats.totalProcessed++;
    
    console.log(`\n[${this.stats.totalProcessed}] ${company.name}`);
    console.log(`   ID: ${company.id}`);
    console.log(`   Website: ${company.website || '-'}`);
    console.log(`   LinkedIn: ${company.linkedinUrl || '-'}`);

    try {
      // Check if enrichment needed
      const check = this.needsEnrichment(company);
      
      if (!check.needs) {
        console.log(`   ⏭️  Skipped: ${check.reason}`);
        this.stats.skipped++;
        return { success: false, reason: check.reason };
      }

      console.log(`   📊 Needs enrichment: ${check.reason}`);

      if (this.options.dryRun) {
        console.log(`   🏃 DRY RUN: Would enrich this company`);
        this.stats.enriched++;
        return { success: true, dryRun: true };
      }

      // Call enrichment API
      const result = await this.enrichCompanyViaAPI(company.id);

      if (result.status === 'completed') {
        console.log(`   ✅ Enriched: ${result.fieldsPopulated?.length || 0} fields`);
        console.log(`   📈 Quality Score: ${Math.round(result.dataQualityScore || 0)}%`);
        console.log(`   🔗 Sources: ${result.dataSources?.join(', ') || 'CoreSignal'}`);
        
        // Track fields populated
        (result.fieldsPopulated || []).forEach(field => {
          this.stats.fieldsPopulated[field] = (this.stats.fieldsPopulated[field] || 0) + 1;
        });
        
        this.stats.enriched++;
        return { success: true, result };
      } else {
        console.log(`   ❌ Failed: ${result.message || result.error}`);
        this.stats.failed++;
        return { success: false, error: result.message || result.error };
      }

    } catch (error) {
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
      console.log('\n🚀 BATCH COMPANY ENRICHMENT');
      console.log('='.repeat(60));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.log(`Force Re-enrich: ${this.options.force ? 'YES' : 'NO'}`);
      console.log(`Limit: ${this.options.limit || 'None'}`);
      console.log(`Skip: ${this.options.skip}`);
      console.log('='.repeat(60));

      // Build workspace filter
      const workspaceFilter = this.options.workspace
        ? { workspaceId: WORKSPACE_IDS[this.options.workspace] }
        : { workspaceId: { in: Object.values(WORKSPACE_IDS) } };

      // Query companies
      const companies = await prisma.companies.findMany({
        where: {
          ...workspaceFilter,
          deletedAt: null,
          OR: [
            { website: { not: null } },
            { linkedinUrl: { not: null } }
          ]
        },
        select: {
          id: true,
          name: true,
          website: true,
          linkedinUrl: true,
          industry: true,
          employeeCount: true,
          description: true,
          revenue: true,
          foundedYear: true,
          lastVerified: true,
          customFields: true,
          workspaceId: true
        },
        orderBy: { createdAt: 'desc' },
        skip: this.options.skip,
        take: this.options.limit
      });

      console.log(`\n📊 Found ${companies.length} companies with website/LinkedIn\n`);

      if (companies.length === 0) {
        console.log('No companies to enrich. Exiting.');
        return;
      }

      // Process each company
      for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        
        await this.enrichCompany(company);

        // Rate limiting: wait 1 second between requests
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
   * Print progress
   */
  printProgress() {
    console.log('\n' + '─'.repeat(60));
    console.log(`📊 Progress: ${this.stats.totalProcessed} processed`);
    console.log(`   ✅ Enriched: ${this.stats.enriched}`);
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
    console.log('📊 BATCH ENRICHMENT COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Processed: ${this.stats.totalProcessed}`);
    console.log(`✅ Enriched: ${this.stats.enriched}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    
    if (Object.keys(this.stats.fieldsPopulated).length > 0) {
      console.log('\n📈 Fields Populated:');
      Object.entries(this.stats.fieldsPopulated)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([field, count]) => {
          console.log(`   ${field}: ${count}`);
        });
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Company Enrichment Script

Usage:
  node scripts/batch-enrich-companies.js [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.)
  --dry-run             Preview only, don't make changes
  --force               Re-enrich even if recently enriched
  --limit=<n>           Limit number of companies to process
  --skip=<n>            Skip first N companies
  --help, -h            Show this help message

Examples:
  node scripts/batch-enrich-companies.js --workspace=top-temp --dry-run
  node scripts/batch-enrich-companies.js --workspace=top-temp --limit=10
  node scripts/batch-enrich-companies.js --workspace=top-temp
  node scripts/batch-enrich-companies.js --workspace=top-temp --force --limit=100
`);
    process.exit(0);
  }

  const enrichment = new BatchCompanyEnrichment(options);
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

