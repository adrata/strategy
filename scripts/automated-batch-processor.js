const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');

const prisma = new PrismaClient();

class AutomatedBatchProcessor {
  constructor() {
    this.workspaceId = '01K1VBYXHD0J895XAN0HGFBKJP';
    this.batchSize = 50;
    this.delayBetweenBatches = 5000; // 5 seconds
    this.maxRetries = 3;
  }

  /**
   * Check current enrichment progress
   */
  async checkProgress() {
    try {
      const totalCompanies = await prisma.companies.count({
        where: { workspaceId: this.workspaceId }
      });

      const enrichedCompanies = await prisma.companies.count({
        where: { 
          workspaceId: this.workspaceId,
          customFields: { not: null }
        }
      });

      const coresignalCompanies = await prisma.companies.count({
        where: {
          workspaceId: this.workspaceId,
          customFields: {
            path: ['coresignalData'],
            not: null
          }
        }
      });

      return {
        total: totalCompanies,
        enriched: enrichedCompanies,
        coresignal: coresignalCompanies,
        remaining: totalCompanies - enrichedCompanies,
        progress: Math.round((enrichedCompanies / totalCompanies) * 100)
      };
    } catch (error) {
      console.error('❌ Error checking progress:', error.message);
      return null;
    }
  }

  /**
   * Run a single batch of enrichment
   */
  async runBatch() {
    return new Promise((resolve, reject) => {
      console.log('🚀 Starting enrichment batch...');
      
      const env = {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
        CORESIGNAL_API_KEY: process.env.CORESIGNAL_API_KEY
      };

      const child = spawn('node', ['scripts/enrich-companies-prisma.js'], {
        env: env,
        stdio: 'inherit'
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Batch completed successfully');
          resolve(true);
        } else {
          console.log(`❌ Batch failed with code ${code}`);
          resolve(false);
        }
      });

      child.on('error', (error) => {
        console.error('❌ Batch error:', error.message);
        resolve(false);
      });
    });
  }

  /**
   * Wait for a specified amount of time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process all companies in batches
   */
  async processAllCompanies() {
    console.log('🤖 AUTOMATED BATCH PROCESSOR');
    console.log('============================');
    console.log('✅ Automatic batch processing');
    console.log('✅ Progress monitoring');
    console.log('✅ Continuous until complete');
    console.log('');

    let batchNumber = 1;
    let totalBatches = 0;

    try {
      // Get initial progress
      let progress = await this.checkProgress();
      if (!progress) {
        console.error('❌ Failed to get initial progress');
        return;
      }

      console.log(`📊 Initial Status:`);
      console.log(`   Total companies: ${progress.total}`);
      console.log(`   Enriched: ${progress.enriched}`);
      console.log(`   CoreSignal data: ${progress.coresignal}`);
      console.log(`   Remaining: ${progress.remaining}`);
      console.log(`   Progress: ${progress.progress}%`);
      console.log('');

      // Calculate total batches needed
      totalBatches = Math.ceil(progress.remaining / this.batchSize);
      console.log(`🎯 Need to process ${totalBatches} batches of ${this.batchSize} companies each\n`);

      // Process batches until all companies are enriched
      while (progress.remaining > 0) {
        console.log(`\n🔄 BATCH ${batchNumber}/${totalBatches}`);
        console.log('==================');
        console.log(`📊 Before batch: ${progress.remaining} companies remaining`);

        // Run the batch
        const success = await this.runBatch();
        
        if (!success) {
          console.log('❌ Batch failed, retrying...');
          await this.wait(2000);
          continue;
        }

        // Wait a bit for database to update
        await this.wait(2000);

        // Check progress after batch
        progress = await this.checkProgress();
        if (!progress) {
          console.error('❌ Failed to get progress after batch');
          break;
        }

        console.log(`📊 After batch: ${progress.remaining} companies remaining`);
        console.log(`📈 Progress: ${progress.progress}%`);
        console.log(`🔗 CoreSignal data: ${progress.coresignal}`);

        if (progress.remaining === 0) {
          console.log('\n🎉 ALL COMPANIES ENRICHED!');
          console.log('=========================');
          console.log(`✅ Total companies: ${progress.total}`);
          console.log(`✅ Enriched companies: ${progress.enriched}`);
          console.log(`✅ CoreSignal data: ${progress.coresignal}`);
          console.log(`✅ Progress: ${progress.progress}%`);
          console.log('');
          console.log('🎯 MISSION ACCOMPLISHED!');
          console.log('✅ All companies enriched with CoreSignal data');
          console.log('✅ Ready for rich Overview and Intelligence tabs');
          break;
        }

        batchNumber++;
        
        // Wait before next batch
        if (progress.remaining > 0) {
          console.log(`⏳ Waiting ${this.delayBetweenBatches/1000} seconds before next batch...`);
          await this.wait(this.delayBetweenBatches);
        }
      }

    } catch (error) {
      console.error('❌ Fatal error in batch processor:', error.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

// Run the automated batch processor
const processor = new AutomatedBatchProcessor();
processor.processAllCompanies();
