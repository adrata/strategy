/**
 * SAGA PATTERN
 * 
 * Implements saga pattern for distributed transaction management
 * Provides compensation logic for rollback on failures
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SagaStep {
  name: string;
  execute: () => Promise<any>;
  compensate: () => Promise<void>;
  retryable?: boolean;
  maxRetries?: number;
}

export interface SagaResult {
  success: boolean;
  executedSteps: string[];
  compensatedSteps: string[];
  result?: any;
  error?: Error;
}

// ============================================================================
// SAGA CLASS
// ============================================================================

export class Saga {
  private executedSteps: SagaStep[] = [];
  private compensationResults: Array<{ step: string; success: boolean; error?: Error }> = [];

  constructor(private steps: SagaStep[]) {}

  /**
   * Execute saga with compensation on failure
   */
  async execute(): Promise<SagaResult> {
    console.log(`🔄 Starting saga with ${this.steps.length} steps`);
    
    try {
      // Execute all steps in sequence
      for (const step of this.steps) {
        console.log(`   ⏳ Executing step: ${step.name}`);
        
        const result = await this.executeStepWithRetry(step);
        this.executedSteps.push(step);
        
        console.log(`   ✅ Step completed: ${step.name}`);
      }

      console.log(`✅ Saga completed successfully`);
      
      return {
        success: true,
        executedSteps: this.executedSteps.map(s => s.name),
        compensatedSteps: []
      };
    } catch (error) {
      console.log(`❌ Saga failed, starting compensation...`);
      
      // Rollback in reverse order
      await this.compensate();
      
      return {
        success: false,
        executedSteps: this.executedSteps.map(s => s.name),
        compensatedSteps: this.compensationResults.map(r => r.step),
        error: error as Error
      };
    }
  }

  /**
   * Execute single step with retry logic
   */
  private async executeStepWithRetry(step: SagaStep): Promise<any> {
    const maxRetries = step.maxRetries || 3;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await step.execute();
      } catch (error) {
        lastError = error as Error;
        console.log(`   ⚠️ Step ${step.name} attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < maxRetries && step.retryable !== false) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }

  /**
   * Compensate all executed steps
   */
  private async compensate(): Promise<void> {
    // Compensate in reverse order
    for (const step of this.executedSteps.reverse()) {
      try {
        console.log(`   🔄 Compensating step: ${step.name}`);
        await step.compensate();
        
        this.compensationResults.push({
          step: step.name,
          success: true
        });
        
        console.log(`   ✅ Compensation successful: ${step.name}`);
      } catch (error) {
        console.error(`   ❌ Compensation failed for ${step.name}: ${error.message}`);
        
        this.compensationResults.push({
          step: step.name,
          success: false,
          error: error as Error
        });
      }
    }
  }

  /**
   * Get compensation results
   */
  getCompensationResults(): Array<{ step: string; success: boolean; error?: Error }> {
    return [...this.compensationResults];
  }
}

// ============================================================================
// SAGA BUILDER
// ============================================================================

export class SagaBuilder {
  private steps: SagaStep[] = [];

  /**
   * Add a step to the saga
   */
  addStep(step: SagaStep): this {
    this.steps.push(step);
    return this;
  }

  /**
   * Add multiple steps
   */
  addSteps(steps: SagaStep[]): this {
    this.steps.push(...steps);
    return this;
  }

  /**
   * Build and return the saga
   */
  build(): Saga {
    return new Saga(this.steps);
  }
}

// ============================================================================
// EXAMPLE SAGA STEPS FOR CFO/CRO PIPELINE
// ============================================================================

/**
 * Example saga step for company resolution
 */
export const createCompanyResolutionStep = (companyUrl: string, coresignal: any): SagaStep => ({
  name: 'resolveCompany',
  execute: async () => {
    const result = await coresignal.searchCompanyId(companyUrl);
    if (!result) {
      throw new Error(`Company not found: ${companyUrl}`);
    }
    return result;
  },
  compensate: async () => {
    // No compensation needed for read-only operation
    console.log('   📝 No compensation needed for company resolution');
  },
  retryable: true,
  maxRetries: 3
});

/**
 * Example saga step for executive discovery
 */
export const createExecutiveDiscoveryStep = (companyId: string, coresignal: any): SagaStep => ({
  name: 'discoverExecutives',
  execute: async () => {
    const executives = await coresignal.discoverExecutiveMultiStrategy(companyId, 'finance');
    return executives;
  },
  compensate: async () => {
    // No compensation needed for read-only operation
    console.log('   📝 No compensation needed for executive discovery');
  },
  retryable: true,
  maxRetries: 2
});

/**
 * Example saga step for database save (with compensation)
 */
export const createDatabaseSaveStep = (executiveData: any, database: any): SagaStep => ({
  name: 'saveExecutive',
  execute: async () => {
    const result = await database.upsert(executiveData);
    return result;
  },
  compensate: async () => {
    // Compensate by deleting the record
    console.log(`   🔄 Compensating database save for ${executiveData.name}`);
    await database.delete(executiveData.id);
  },
  retryable: true,
  maxRetries: 3
});

// ============================================================================
// EXPORTS
// ============================================================================

export default Saga;
