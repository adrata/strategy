#!/usr/bin/env node

/**
 * Batch Intelligence Generation Script
 * 
 * Generates intelligence for people who have been enriched but lack intelligence fields
 * - Only processes people with CoreSignal data
 * - Skips if intelligence generated in last 30 days
 * - Rate limited to 1 request per second (AI calls are expensive)
 * - Generates: buyerGroupRole, influenceLevel, decisionPower, engagementLevel
 */

const { PrismaClient } = require('@prisma/client');
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

class BatchIntelligenceGeneration {
  constructor(options) {
    this.options = options;
    this.stats = {
      totalProcessed: 0,
      generated: 0,
      cached: 0,
      skipped: 0,
      failed: 0,
      roleDistribution: {},
      startTime: Date.now()
    };
  }

  /**
   * Generate intelligence via API
   */
  async generateIntelligenceViaAPI(personId) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/v1/people/${personId}/generate-intelligence`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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

      req.end();
    });
  }

  /**
   * Check if person needs intelligence generation
   */
  needsIntelligence(person) {
    // Must have CoreSignal data
    const customFields = person.customFields || {};
    if (!customFields.coresignalId && !customFields.coresignalData) {
      return { needs: false, reason: 'No CoreSignal data (enrich first)' };
    }

    // Check if recently generated (skip unless --force)
    if (!this.options.force && customFields.intelligenceGeneratedAt) {
      const daysSince = (Date.now() - new Date(customFields.intelligenceGeneratedAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        return { needs: false, reason: `Intelligence ${Math.round(daysSince)} days old`, cached: true };
      }
    }

    // Check for missing intelligence fields
    const missingFields = [];
    if (!person.buyerGroupRole) missingFields.push('buyerGroupRole');
    if (!customFields.influenceLevel) missingFields.push('influenceLevel');
    if (!customFields.decisionPower) missingFields.push('decisionPower');
    if (!customFields.engagementLevel) missingFields.push('engagementLevel');

    if (missingFields.length === 0 && !this.options.force) {
      return { needs: false, reason: 'Intelligence already complete', cached: true };
    }

    return { needs: true, reason: `Missing: ${missingFields.join(', ')}`, missingFields };
  }

  /**
   * Generate intelligence for a single person
   */
  async generateIntelligence(person) {
    this.stats.totalProcessed++;
    
    console.log(`\n[${this.stats.totalProcessed}] ${person.fullName}`);
    console.log(`   ID: ${person.id}`);
    console.log(`   Title: ${person.jobTitle || '-'}`);
    console.log(`   Department: ${person.department || '-'}`);

    try {
      // Check if intelligence needed
      const check = this.needsIntelligence(person);
      
      if (!check.needs) {
        console.log(`   ⏭️  ${check.cached ? 'Cached' : 'Skipped'}: ${check.reason}`);
        if (check.cached) {
          this.stats.cached++;
        } else {
          this.stats.skipped++;
        }
        return { success: false, reason: check.reason };
      }

      console.log(`   🤖 Needs intelligence: ${check.reason}`);

      if (this.options.dryRun) {
        console.log(`   🏃 DRY RUN: Would generate intelligence`);
        this.stats.generated++;
        return { success: true, dryRun: true };
      }

      // Call intelligence API
      const result = await this.generateIntelligenceViaAPI(person.id);

      if (result.success) {
        const intel = result.data.intelligence;
        console.log(`   ✅ Intelligence generated:`);
        console.log(`      Role: ${intel.buyerGroupRole || '-'}`);
        console.log(`      Influence: ${intel.influenceLevel || '-'}`);
        console.log(`      Decision Power: ${intel.decisionPower || '-'}`);
        console.log(`      Engagement: ${intel.engagementLevel || '-'}`);
        console.log(`      Confidence: ${intel.confidence || 0}%`);
        
        // Track role distribution
        if (intel.buyerGroupRole) {
          this.stats.roleDistribution[intel.buyerGroupRole] = 
            (this.stats.roleDistribution[intel.buyerGroupRole] || 0) + 1;
        }
        
        if (result.data.cached) {
          this.stats.cached++;
        } else {
          this.stats.generated++;
        }
        
        return { success: true, result };
      } else {
        console.log(`   ❌ Failed: ${result.error || result.message}`);
        this.stats.failed++;
        return { success: false, error: result.error || result.message };
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.stats.failed++;
      return { success: false, error: error.message };
    }
  }

  /**
   * Run batch intelligence generation
   */
  async run() {
    try {
      console.log('\n🤖 BATCH INTELLIGENCE GENERATION');
      console.log('='.repeat(60));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.log(`Force Regenerate: ${this.options.force ? 'YES' : 'NO'}`);
      console.log(`Limit: ${this.options.limit || 'None'}`);
      console.log(`Skip: ${this.options.skip}`);
      console.log('='.repeat(60));

      // Build workspace filter
      const workspaceFilter = this.options.workspace
        ? { workspaceId: WORKSPACE_IDS[this.options.workspace] }
        : { workspaceId: { in: Object.values(WORKSPACE_IDS) } };

      // Query people with enrichment data
      const people = await prisma.people.findMany({
        where: {
          ...workspaceFilter,
          deletedAt: null,
          OR: [
            { customFields: { path: ['coresignalId'], not: null } },
            { customFields: { path: ['coresignalData'], not: null } }
          ]
        },
        select: {
          id: true,
          fullName: true,
          jobTitle: true,
          department: true,
          buyerGroupRole: true,
          customFields: true,
          workspaceId: true
        },
        orderBy: { createdAt: 'desc' },
        skip: this.options.skip,
        take: this.options.limit
      });

      console.log(`\n📊 Found ${people.length} people with CoreSignal data\n`);

      if (people.length === 0) {
        console.log('No people to process. Enrich people first with batch-enrich-people.js');
        return;
      }

      // Process each person
      for (let i = 0; i < people.length; i++) {
        const person = people[i];
        
        await this.generateIntelligence(person);

        // Rate limiting: wait 1 second between requests (AI calls)
        if (i < people.length - 1 && !this.options.dryRun) {
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
    console.log(`   🤖 Generated: ${this.stats.generated}`);
    console.log(`   💾 Cached: ${this.stats.cached}`);
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
    console.log('🤖 BATCH INTELLIGENCE GENERATION COMPLETE');
    console.log('='.repeat(60));
    console.log(`Total Processed: ${this.stats.totalProcessed}`);
    console.log(`🤖 Generated: ${this.stats.generated}`);
    console.log(`💾 Cached: ${this.stats.cached}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped}`);
    console.log(`❌ Failed: ${this.stats.failed}`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    
    if (Object.keys(this.stats.roleDistribution).length > 0) {
      console.log('\n📊 Buyer Group Role Distribution:');
      Object.entries(this.stats.roleDistribution)
        .sort((a, b) => b[1] - a[1])
        .forEach(([role, count]) => {
          console.log(`   ${role}: ${count}`);
        });
    }
    
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Batch Intelligence Generation Script

Usage:
  node scripts/batch-generate-intelligence.js [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.)
  --dry-run             Preview only, don't make changes
  --force               Regenerate even if intelligence exists
  --limit=<n>           Limit number of people to process
  --skip=<n>            Skip first N people
  --help, -h            Show this help message

Examples:
  node scripts/batch-generate-intelligence.js --workspace=top-temp --dry-run
  node scripts/batch-generate-intelligence.js --workspace=top-temp --limit=10
  node scripts/batch-generate-intelligence.js --workspace=top-temp
`);
    process.exit(0);
  }

  const generation = new BatchIntelligenceGeneration(options);
  await generation.run();
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

