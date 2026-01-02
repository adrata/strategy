#!/usr/bin/env node

/**
 * Find Homeowners - Paradise Valley Gate Prospects Pipeline
 * 
 * Searches for high-value homeowners in Paradise Valley, AZ
 * who are likely to purchase premium gates.
 * 
 * Features:
 * - BatchData property search and skip-tracing
 * - Arizona phone filtering (480, 520, 602, 623, 928 area codes only)
 * - "Thirsty Buyer" scoring algorithm
 * - Phone verification
 * - Prisma database integration
 * - Progress saving and resumability
 * 
 * Usage: node scripts/_future_now/find-homeowners/index.js
 * 
 * Options:
 *   --city="Paradise Valley"  Target city (default: Paradise Valley)
 *   --limit=1000              Max homeowners to import
 *   --min-score=50            Minimum thirsty buyer score
 *   --dry-run                 Preview without importing
 *   --no-arizona-filter       Disable Arizona phone number filtering
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Import modules
const BatchDataSearcher = require('./modules/BatchDataSearcher');
const { HomeownerScorer } = require('./modules/HomeownerScorer');
const { PhoneVerifier } = require('./modules/PhoneVerifier');
const { ProgressTracker } = require('./modules/ProgressTracker');
const { ArizonaPhoneFilter } = require('./modules/ArizonaPhoneFilter');

class FindHomeowners {
  constructor(options = {}) {
    this.prisma = new PrismaClient();
    
    // Configuration
    this.workspaceId = options.workspaceId || '01KBDP8ZXDTAHJNT14S3WB1DTA'; // Rune Gate Co.
    this.city = options.city || 'Paradise Valley';
    this.state = options.state || 'AZ';
    this.maxResults = options.limit || 1000;
    this.minScore = options.minScore !== undefined ? options.minScore : 50;
    this.dryRun = options.dryRun || false;
    this.skipOffset = options.skipOffset || 0;
    
    // Initialize modules with API key
    this.searcher = new BatchDataSearcher(process.env.BATCHDATA_API_KEY);
    this.scorer = new HomeownerScorer();
    this.phoneVerifier = new PhoneVerifier();
    this.progressTracker = new ProgressTracker();
    this.arizonaFilter = new ArizonaPhoneFilter();
    
    // Filter options
    this.arizonaOnly = options.arizonaOnly !== false; // Default to true

    // Get Josh's user ID
    this.userId = null;
  }

  async run() {
    console.log('\n' + '='.repeat(60));
    console.log('   FIND HOMEOWNERS - Paradise Valley Gate Prospects');
    console.log('='.repeat(60));
    console.log(`\n   Workspace: Rune Gate Co. (${this.workspaceId})`);
    console.log(`   Target: ${this.city}, ${this.state}`);
    console.log(`   Max Results: ${this.maxResults}`);
    console.log(`   Min Score: ${this.minScore}`);
    console.log(`   Arizona Only: ${this.arizonaOnly}`);
    console.log(`   Dry Run: ${this.dryRun}`);

    try {
      await this.prisma.$connect();
      console.log('\n   Connected to database');

      // Load previous progress
      const processedIds = await this.progressTracker.loadProgress();
      console.log(`   Previous progress: ${processedIds.length} homeowners processed`);

      // Get Josh's user ID
      await this.findUserId();

      // Step 1: Search for properties and skip-trace owners
      console.log('\n   STEP 1: Property Search & Skip-Trace');
      console.log('   ' + '-'.repeat(40));
      
      let homeowners = await this.searcher.searchHomeowners({
        city: this.city,
        state: this.state,
        minLotSizeSqFt: 10000,   // 0.25+ acres
        minHomeValue: 1500000,   // $1.5M+ for Paradise Valley
        maxResults: this.maxResults,
        skipOffset: this.skipOffset
      });

      if (homeowners.length === 0) {
        console.log('\n   No homeowners found matching criteria');
        return;
      }

      // Step 1b: Skip trace to get phone numbers
      console.log('\n   STEP 1b: Skip Trace (Getting Phone Numbers)');
      console.log('   ' + '-'.repeat(40));
      
      homeowners = await this.searcher.skipTraceHomeowners(homeowners);

      this.progressTracker.setStat('totalProperties', homeowners.length);
      this.progressTracker.setStat('totalHomeowners', homeowners.length);
      this.progressTracker.setStat('withPhone', homeowners.filter(h => h.phone).length);

      // Step 1c: Filter for Arizona phone numbers only
      if (this.arizonaOnly) {
        console.log('\n   STEP 1c: Arizona Phone Filter');
        console.log('   ' + '-'.repeat(40));
        
        // Show area code distribution before filtering
        const distribution = this.arizonaFilter.getAreaCodeDistribution(homeowners);
        console.log('   Area code distribution before filter:');
        Object.entries(distribution).slice(0, 10).forEach(([code, count]) => {
          const isAZ = this.arizonaFilter.arizonaAreaCodes.includes(code);
          console.log(`     ${code}: ${count} ${isAZ ? '✅ AZ' : ''}`);
        });
        
        homeowners = this.arizonaFilter.filterAll(homeowners);
        
        this.progressTracker.setStat('arizonaPhones', homeowners.length);
        this.progressTracker.setStat('filteredOut', this.arizonaFilter.getStats().nonArizonaPhones + this.arizonaFilter.getStats().noPhone);
      }

      // Step 2: Score homeowners with "Thirsty Buyer" algorithm
      console.log('\n   STEP 2: Scoring Homeowners (Thirsty Buyer Algorithm)');
      console.log('   ' + '-'.repeat(40));
      
      const scoredHomeowners = this.scorer.scoreAll(homeowners);
      
      // Filter by minimum score
      const qualifiedHomeowners = this.scorer.filterByScore(scoredHomeowners, this.minScore);

      // Update stats
      const scorerStats = this.scorer.getStats();
      this.progressTracker.setStat('highPriority', scorerStats.distribution.high);
      this.progressTracker.setStat('mediumPriority', scorerStats.distribution.medium);
      this.progressTracker.setStat('lowPriority', scorerStats.distribution.low);
      
      // Calculate average score
      const avgScore = qualifiedHomeowners.length > 0
        ? Math.round(qualifiedHomeowners.reduce((sum, h) => sum + h.thirstyBuyerScore, 0) / qualifiedHomeowners.length)
        : 0;
      this.progressTracker.setStat('averageScore', avgScore);

      // Step 3: Verify phone numbers (optional, uses Twilio credits)
      console.log('\n   STEP 3: Phone Verification');
      console.log('   ' + '-'.repeat(40));
      
      let verifiedHomeowners;
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        verifiedHomeowners = await this.phoneVerifier.verifyAll(qualifiedHomeowners);
        const phoneStats = this.phoneVerifier.getStats();
        this.progressTracker.setStat('withMobile', phoneStats.mobile);
      } else {
        console.log('   Twilio not configured - skipping phone verification');
        verifiedHomeowners = qualifiedHomeowners;
      }

      // Step 4: Import to database
      console.log('\n   STEP 4: Database Import');
      console.log('   ' + '-'.repeat(40));
      
      if (this.dryRun) {
        console.log('   DRY RUN - Skipping database import');
        console.log(`   Would import ${verifiedHomeowners.length} homeowners`);
        
        // Show top 5 for preview
        console.log('\n   Top 5 Leads Preview:');
        verifiedHomeowners.slice(0, 5).forEach((h, i) => {
          console.log(`   ${i + 1}. ${h.ownerName || 'Unknown'} - Score: ${h.thirstyBuyerScore}`);
          console.log(`      ${h.address}, ${h.city}`);
          console.log(`      Value: $${h.homeValue?.toLocaleString()} | Lot: ${h.lotSizeSqFt?.toLocaleString()} sqft`);
          console.log(`      Phone: ${h.phone || 'N/A'}`);
        });
      } else {
        await this.importToDatabase(verifiedHomeowners);
      }

      // Step 5: Export CSV backup
      console.log('\n   STEP 5: Export CSV Backup');
      console.log('   ' + '-'.repeat(40));
      
      await this.progressTracker.exportToCSV(
        verifiedHomeowners, 
        `paradise-valley-leads-${new Date().toISOString().split('T')[0]}.csv`
      );

      // Save final progress
      await this.progressTracker.saveProgress();

      // Print results
      this.progressTracker.printResults();

      // Update BatchData credits used
      const searcherStats = this.searcher.getStats();
      console.log(`\n   BatchData Stats:`);
      console.log(`   - API Requests: ${searcherStats.requestCount}`);
      console.log(`   - Estimated Cost: $${searcherStats.estimatedCost.toFixed(2)}`);

    } catch (error) {
      console.error('\n   Pipeline Error:', error.message);
      this.progressTracker.trackError('Pipeline', error.message);
      await this.progressTracker.saveProgress();
      throw error;
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Find Josh's user ID for assignment
   */
  async findUserId() {
    try {
      const user = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: 'finn@runegateco.com' },
            { email: 'joshuadp1997@gmail.com' }
          ]
        }
      });

      if (user) {
        this.userId = user.id;
        console.log(`   Found user: ${user.name} (${user.id})`);
      } else {
        console.log('   Warning: Josh user not found, leads will be unassigned');
      }
    } catch (error) {
      console.log(`   Warning: Could not find user: ${error.message}`);
    }
  }

  /**
   * Import homeowners to database as People records
   * @param {Array} homeowners - Scored and verified homeowners
   */
  async importToDatabase(homeowners) {
    console.log(`   Importing ${homeowners.length} homeowners to database...`);
    
    let imported = 0;
    let skipped = 0;
    let failed = 0;

    for (const homeowner of homeowners) {
      try {
        // Check for existing record by address
        const existing = await this.prisma.people.findFirst({
          where: {
            workspaceId: this.workspaceId,
            address: homeowner.address,
            deletedAt: null
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Parse owner name
        const nameParts = this.parseOwnerName(homeowner.ownerName);

        // Create person record - simplified for debugging
        await this.prisma.people.create({
          data: {
            workspaceId: this.workspaceId,
            firstName: nameParts.firstName || 'Unknown',
            lastName: nameParts.lastName || 'Homeowner',
            fullName: homeowner.ownerName || 'Unknown Homeowner',
            
            // Contact info
            phone: homeowner.phone ? String(homeowner.phone) : null,
            mobilePhone: homeowner.phoneType === 'mobile' ? String(homeowner.phone) : null,
            
            // Address
            address: homeowner.address || null,
            city: homeowner.city || null,
            state: homeowner.state || null,
            postalCode: homeowner.postalCode || null,
            country: 'US',
            
            // Lead status
            status: 'LEAD',
            source: `BatchData - ${this.city}`,
            
            // Assignment
            mainSellerId: this.userId,
            
            // Notes
            notes: `Property: ${homeowner.fullAddress || homeowner.address}\nPhone: ${homeowner.phone || 'N/A'}\nEmail: ${homeowner.email || 'N/A'}`
          }
        });

        imported++;
        this.progressTracker.trackProcessed(homeowner);

        // Progress update
        if (imported % 50 === 0) {
          console.log(`   Progress: ${imported} imported, ${skipped} skipped, ${failed} failed`);
          await this.progressTracker.saveProgress();
        }

      } catch (error) {
        failed++;
        this.progressTracker.trackError(homeowner.address, error.message);
      }
    }

    this.progressTracker.setStat('imported', imported);
    this.progressTracker.setStat('skipped', skipped);
    this.progressTracker.setStat('failed', failed);

    console.log(`   Import complete: ${imported} imported, ${skipped} skipped, ${failed} failed`);
  }

  /**
   * Parse owner name into first/last name
   * @param {string} ownerName - Full owner name
   * @returns {Object} - { firstName, lastName }
   */
  parseOwnerName(ownerName) {
    if (!ownerName) {
      return { firstName: 'Homeowner', lastName: '' };
    }

    // Handle corporate names
    if (ownerName.includes('LLC') || ownerName.includes('Inc') || ownerName.includes('Trust')) {
      return { firstName: ownerName, lastName: '' };
    }

    // Split by space
    const parts = ownerName.trim().split(/\s+/);
    
    if (parts.length === 1) {
      return { firstName: parts[0], lastName: '' };
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' ')
    };
  }

  /**
   * Generate lead notes with property insights
   * @param {Object} homeowner - Homeowner data
   * @returns {string} - Notes for sales rep
   */
  generateLeadNotes(homeowner) {
    const explanation = this.scorer.explainScore(homeowner);
    const notes = [
      `THIRSTY BUYER SCORE: ${homeowner.thirstyBuyerScore}/100 (${homeowner.priority} Priority)`,
      '',
      'WHY THIS IS A GOOD LEAD:',
      ...explanation.reasons.map(r => `- ${r}`),
      '',
      'PROPERTY DETAILS:',
      `- Value: $${homeowner.homeValue?.toLocaleString() || 'Unknown'}`,
      `- Lot Size: ${homeowner.lotSizeSqFt?.toLocaleString() || 'Unknown'} sqft`,
      `- Year Built: ${homeowner.yearBuilt || 'Unknown'}`,
      `- Bedrooms: ${homeowner.bedrooms || 'Unknown'}`,
      '',
      `Data Source: BatchData (${new Date().toLocaleDateString()})`
    ];

    return notes.join('\n');
  }
}

// CLI execution
async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--city=')) {
      options.city = arg.split('=')[1].replace(/"/g, '');
    } else if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--min-score=')) {
      options.minScore = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--skip=')) {
      options.skipOffset = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--no-arizona-filter') {
      options.arizonaOnly = false;
    }
  });

  const pipeline = new FindHomeowners(options);
  await pipeline.run();
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { FindHomeowners };

