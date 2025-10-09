/**
 * 🧹 CLEANUP JOB - Automated Deletion Management
 * 
 * Runs periodically to clean up old soft-deleted records
 * Can be scheduled via cron, GitHub Actions, or cloud functions
 */

import { deletionService } from '../services/deletion-service';

export interface CleanupJobConfig {
  dryRun: boolean;           // If true, only log what would be deleted
  maxExecutionTime: number;  // Max time in milliseconds (default: 5 minutes)
  batchDelay: number;        // Delay between batches in milliseconds (default: 100ms)
}

export class CleanupJob {
  private config: CleanupJobConfig;

  constructor(config?: Partial<CleanupJobConfig>) {
    this.config = {
      dryRun: false,
      maxExecutionTime: 5 * 60 * 1000, // 5 minutes
      batchDelay: 100, // 100ms
      ...config,
    };
  }

  /**
   * 🚀 RUN CLEANUP JOB
   */
  async run(): Promise<{
    success: boolean;
    results: { [key: string]: number };
    executionTime: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];
    
    console.log(`🧹 [CLEANUP JOB] Starting cleanup job (dryRun: ${this.config.dryRun})`);

    try {
      // Get deletion statistics before cleanup
      const statsBefore = await deletionService.getDeletionStats();
      console.log(`📊 [CLEANUP JOB] Stats before cleanup:`, statsBefore);

      if (this.config.dryRun) {
        console.log(`🔍 [CLEANUP JOB] DRY RUN - No actual deletions will be performed`);
        return {
          success: true,
          results: statsBefore.softDeleted,
          executionTime: Date.now() - startTime,
          errors: [],
        };
      }

      // Run cleanup
      const results = await deletionService.cleanupOldSoftDeletes();
      
      // Get statistics after cleanup
      const statsAfter = await deletionService.getDeletionStats();
      console.log(`📊 [CLEANUP JOB] Stats after cleanup:`, statsAfter);

      const executionTime = Date.now() - startTime;
      console.log(`✅ [CLEANUP JOB] Completed in ${executionTime}ms`);

      return {
        success: true,
        results,
        executionTime,
        errors,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);
      
      console.error(`❌ [CLEANUP JOB] Failed:`, errorMessage);
      
      return {
        success: false,
        results: {},
        executionTime: Date.now() - startTime,
        errors,
      };
    }
  }

  /**
   * 📊 GET CLEANUP REPORT
   */
  async getReport(): Promise<{
    softDeleted: { [key: string]: number };
    retentionCompliance: { [key: string]: number };
    recommendations: string[];
  }> {
    const stats = await deletionService.getDeletionStats();
    const recommendations: string[] = [];

    // Generate recommendations based on current state
    if (stats.softDeleted.companies > 1000) {
      recommendations.push('Consider running cleanup job - high number of soft-deleted companies');
    }
    
    if (stats.softDeleted.people > 5000) {
      recommendations.push('Consider running cleanup job - high number of soft-deleted people');
    }
    
    if (stats.softDeleted.actions > 10000) {
      recommendations.push('Consider running cleanup job - high number of soft-deleted actions');
    }

    // Check retention compliance
    Object.entries(stats.retentionCompliance).forEach(([entity, count]) => {
      if (count > 0) {
        recommendations.push(`${entity} has ${count} records past retention period`);
      }
    });

    return {
      softDeleted: stats.softDeleted,
      retentionCompliance: stats.retentionCompliance,
      recommendations,
    };
  }
}

// CLI interface for running cleanup job
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  const job = new CleanupJob({ dryRun });
  
  job.run()
    .then(result => {
      console.log('🧹 Cleanup job result:', result);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Cleanup job failed:', error);
      process.exit(1);
    });
}
