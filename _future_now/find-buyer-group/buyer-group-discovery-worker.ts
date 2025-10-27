/**
 * Buyer Group Discovery Worker
 * 
 * Background job processor for buyer group discovery using existing platform patterns
 * Integrates with src/platform/services/job-queue/queue-manager.ts
 */

import { QueueManager } from '../../platform/services/job-queue/queue-manager';
import { SmartBuyerGroupPipeline } from '../buyer-group/index';

interface BuyerGroupDiscoveryJob {
  id: string;
  type: 'buyer-group-discovery';
  data: {
    linkedinUrl: string;
    dealSize: number;
    maxPages?: number;
    workspaceId?: string;
    userId?: string;
  };
  priority: 'high' | 'medium' | 'low';
  retries: number;
  createdAt: Date;
}

class BuyerGroupDiscoveryWorker {
  private queueManager: QueueManager;
  private pipeline: SmartBuyerGroupPipeline;

  constructor() {
    this.queueManager = new QueueManager();
    this.pipeline = new SmartBuyerGroupPipeline();
  }

  /**
   * Process buyer group discovery job
   * @param job - Job data
   * @returns Promise<JobResult>
   */
  async processJob(job: BuyerGroupDiscoveryJob): Promise<any> {
    try {
      console.log(`🔄 Processing buyer group discovery for: ${job.data.linkedinUrl}`);
      
      // Initialize pipeline with job data
      const result = await this.pipeline.run({
        linkedinUrl: job.data.linkedinUrl,
        dealSize: job.data.dealSize,
        maxPages: job.data.maxPages || 5,
        workspaceId: job.data.workspaceId,
        userId: job.data.userId
      });

      // Save results to database
      await this.saveResults(result, job.data);

      console.log(`✅ Buyer group discovery completed for: ${job.data.linkedinUrl}`);
      
      return {
        success: true,
        result: {
          buyerGroupSize: result.buyerGroup?.length || 0,
          totalCost: result.costs?.total || 0,
          companyTier: result.companyIntelligence?.tier || 'Unknown'
        }
      };

    } catch (error) {
      console.error(`❌ Buyer group discovery failed:`, error.message);
      
      return {
        success: false,
        error: error.message,
        retryable: this.isRetryableError(error)
      };
    }
  }

  /**
   * Save buyer group results to database
   * @param result - Pipeline result
   * @param jobData - Job data
   */
  private async saveResults(result: any, jobData: any): Promise<void> {
    // Implementation would save to BuyerGroups and BuyerGroupMembers tables
    // Using the same patterns as production-buyer-group.js
    console.log('💾 Saving buyer group results to database...');
  }

  /**
   * Determine if error is retryable
   * @param error - Error object
   * @returns boolean
   */
  private isRetryableError(error: any): boolean {
    // API rate limits, network timeouts are retryable
    // Validation errors, authentication failures are not
    return error.message.includes('timeout') || 
           error.message.includes('rate limit') ||
           error.message.includes('network');
  }

  /**
   * Start worker processing
   */
  async start(): Promise<void> {
    console.log('🚀 Starting Buyer Group Discovery Worker...');
    
    // Register job processor with queue manager
    await this.queueManager.registerProcessor('buyer-group-discovery', this.processJob.bind(this));
    
    // Start processing jobs
    await this.queueManager.start();
    
    console.log('✅ Buyer Group Discovery Worker started');
  }

  /**
   * Stop worker processing
   */
  async stop(): Promise<void> {
    console.log('🛑 Stopping Buyer Group Discovery Worker...');
    await this.queueManager.stop();
    console.log('✅ Buyer Group Discovery Worker stopped');
  }
}

// Export for use in platform
export { BuyerGroupDiscoveryWorker };

// Usage example:
// const worker = new BuyerGroupDiscoveryWorker();
// await worker.start();
