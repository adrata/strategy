#!/usr/bin/env node

/**
 * Master Enrichment Script
 * 
 * Orchestrates all enrichment processes:
 * - Batch company enrichment
 * - Batch person enrichment
 * - Batch intelligence generation
 * 
 * Supports workspace filtering, dry-run mode, and comprehensive reporting
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

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
  allProduction: args.includes('--all-production'),
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  companiesOnly: args.includes('--companies-only'),
  peopleOnly: args.includes('--people-only'),
  limit: null
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

class MasterEnrichment {
  constructor(options) {
    this.options = options;
    this.results = {
      companies: null,
      people: null,
      intelligence: null,
      startTime: Date.now()
    };
  }

  /**
   * Run command and parse output
   */
  async runCommand(command) {
    console.log(`\n🏃 Running: ${command}\n`);
    
    try {
      const { stdout, stderr } = await execPromise(command);
      
      if (stderr) {
        console.error('stderr:', stderr);
      }
      
      console.log(stdout);
      
      // Parse results from output
      return this.parseResults(stdout);
    } catch (error) {
      console.error(`❌ Command failed: ${error.message}`);
      if (error.stdout) console.log(error.stdout);
      if (error.stderr) console.error(error.stderr);
      throw error;
    }
  }

  /**
   * Parse results from script output
   */
  parseResults(output) {
    const results = {
      totalProcessed: 0,
      enriched: 0,
      skipped: 0,
      failed: 0
    };

    // Extract numbers from output
    const processedMatch = output.match(/Total Processed:\s*(\d+)/);
    const enrichedMatch = output.match(/Enriched:\s*(\d+)/);
    const skippedMatch = output.match(/Skipped:\s*(\d+)/);
    const failedMatch = output.match(/Failed:\s*(\d+)/);

    if (processedMatch) results.totalProcessed = parseInt(processedMatch[1]);
    if (enrichedMatch) results.enriched = parseInt(enrichedMatch[1]);
    if (skippedMatch) results.skipped = parseInt(skippedMatch[1]);
    if (failedMatch) results.failed = parseInt(failedMatch[1]);

    return results;
  }

  /**
   * Build command arguments
   */
  buildArgs() {
    const args = [];
    
    if (this.options.workspace) {
      args.push(`--workspace=${this.options.workspace}`);
    }
    
    if (this.options.dryRun) {
      args.push('--dry-run');
    }
    
    if (this.options.force) {
      args.push('--force');
    }
    
    if (this.options.limit) {
      args.push(`--limit=${this.options.limit}`);
    }
    
    return args.join(' ');
  }

  /**
   * Run all enrichment processes
   */
  async run() {
    try {
      console.log('\n🚀 MASTER ENRICHMENT SCRIPT');
      console.log('='.repeat(60));
      console.log(`Workspace: ${this.options.workspace || 'ALL PRODUCTION'}`);
      console.log(`All Production: ${this.options.allProduction ? 'YES' : 'NO'}`);
      console.log(`Dry Run: ${this.options.dryRun ? 'YES' : 'NO'}`);
      console.log(`Force: ${this.options.force ? 'YES' : 'NO'}`);
      console.log(`Companies Only: ${this.options.companiesOnly ? 'YES' : 'NO'}`);
      console.log(`People Only: ${this.options.peopleOnly ? 'YES' : 'NO'}`);
      console.log(`Limit: ${this.options.limit || 'None'}`);
      console.log('='.repeat(60));

      const baseArgs = this.buildArgs();

      // Run company enrichment
      if (!this.options.peopleOnly) {
        console.log('\n' + '='.repeat(60));
        console.log('STEP 1: ENRICH COMPANIES');
        console.log('='.repeat(60));
        
        this.results.companies = await this.runCommand(
          `node scripts/batch-enrich-companies.js ${baseArgs}`
        );
      }

      // Run person enrichment
      if (!this.options.companiesOnly) {
        console.log('\n' + '='.repeat(60));
        console.log('STEP 2: ENRICH PEOPLE');
        console.log('='.repeat(60));
        
        this.results.people = await this.runCommand(
          `node scripts/batch-enrich-people.js ${baseArgs}`
        );
      }

      // Final summary
      this.printFinalSummary();

    } catch (error) {
      console.error('\n❌ Master enrichment failed:', error);
      throw error;
    }
  }

  /**
   * Print final summary
   */
  printFinalSummary() {
    const duration = Math.round((Date.now() - this.results.startTime) / 1000);
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    console.log('\n' + '='.repeat(60));
    console.log('🎯 MASTER ENRICHMENT SUMMARY');
    console.log('='.repeat(60));
    
    if (this.results.companies) {
      console.log('\n📊 Companies:');
      console.log(`   Processed: ${this.results.companies.totalProcessed}`);
      console.log(`   Enriched: ${this.results.companies.enriched}`);
      console.log(`   Skipped: ${this.results.companies.skipped}`);
      console.log(`   Failed: ${this.results.companies.failed}`);
    }
    
    if (this.results.people) {
      console.log('\n👥 People:');
      console.log(`   Processed: ${this.results.people.totalProcessed}`);
      console.log(`   Enriched: ${this.results.people.enriched}`);
      console.log(`   Skipped: ${this.results.people.skipped}`);
      console.log(`   Failed: ${this.results.people.failed}`);
    }
    
    console.log(`\n⏱️  Total Duration: ${minutes}m ${seconds}s`);
    console.log('='.repeat(60) + '\n');
  }
}

// Main execution
async function main() {
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Master Enrichment Script

Usage:
  node scripts/enrich-all-workspaces.js [options]

Options:
  --workspace=<name>    Target workspace (top-temp, notary-everyday, adrata, etc.)
  --all-production      Process all production workspaces
  --dry-run             Preview only, don't make changes
  --force               Re-enrich even if recently enriched
  --companies-only      Only enrich companies (skip people)
  --people-only         Only enrich people (skip companies)
  --limit=<n>           Limit number of records per type
  --help, -h            Show this help message

Examples:
  # Preview enrichment for top-temp
  node scripts/enrich-all-workspaces.js --workspace=top-temp --dry-run

  # Enrich top 10 companies and people in top-temp
  node scripts/enrich-all-workspaces.js --workspace=top-temp --limit=10

  # Full enrichment for top-temp
  node scripts/enrich-all-workspaces.js --workspace=top-temp

  # Only companies in top-temp
  node scripts/enrich-all-workspaces.js --workspace=top-temp --companies-only

  # All production workspaces
  node scripts/enrich-all-workspaces.js --all-production

Available Workspaces:
  - top-temp (priority)
  - notary-everyday
  - adrata
  - cloudcaddie
  - pinpoint
  - ei-cooperative

Excluded (demo/test):
  - demo
  - top-engineering-plus (TOP)
`);
    process.exit(0);
  }

  if (!options.workspace && !options.allProduction) {
    console.error('\n❌ Error: Must specify --workspace=<name> or --all-production\n');
    console.log('Run with --help for usage information\n');
    process.exit(1);
  }

  const enrichment = new MasterEnrichment(options);
  await enrichment.run();
}

main()
  .then(() => {
    console.log('✅ Master enrichment completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Master enrichment failed:', error);
    process.exit(1);
  });

