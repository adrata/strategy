/**
 * CFO/CRO Discovery Pipeline Execution Engine
 * 
 * Handles parallel processing, real-time monitoring, and cost tracking
 */

import { WorkflowNode, WorkflowConnection, WorkflowExecution, CompanyData, ExecutiveData, VerificationResult } from '../types/workflow';

export class ExecutionEngine {
  private execution: WorkflowExecution | null = null;
  private onProgress?: (execution: WorkflowExecution) => void;
  private onComplete?: (execution: WorkflowExecution) => void;
  private onError?: (error: string) => void;

  constructor(
    onProgress?: (execution: WorkflowExecution) => void,
    onComplete?: (execution: WorkflowExecution) => void,
    onError?: (error: string) => void
  ) {
    this.onProgress = onProgress;
    this.onComplete = onComplete;
    this.onError = onError;
  }

  async executeWorkflow(
    nodes: WorkflowNode[],
    connections: WorkflowConnection[],
    companyData: CompanyData
  ): Promise<WorkflowExecution> {
    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}`,
      workflowId: 'cfo-cro-discovery',
      status: 'running',
      startTime: new Date(),
      totalCost: 0,
      successRate: 0,
      progress: 0,
      results: {},
      errors: []
    };

    this.execution = execution;
    this.onProgress?.(execution);

    try {
      // Step 1: Company Resolution
      await this.executeStep('company-resolution', companyData, execution);
      
      // Step 2: Executive Discovery (3-tier waterfall)
      await this.executeStep('executive-discovery', companyData, execution);
      
      // Step 3: Contact Enrichment
      await this.executeStep('contact-enrichment', companyData, execution);
      
      // Step 4: Parallel Verification (3 simultaneous processes)
      await this.executeParallelVerification(companyData, execution);
      
      // Step 5: Result Aggregation
      await this.executeStep('result-aggregation', companyData, execution);
      
      // Step 6: Efficacy Tracking
      await this.executeStep('efficacy-tracking', companyData, execution);
      
      // Step 7: Results Storage
      await this.executeStep('results-storage', companyData, execution);

      execution.status = 'completed';
      execution.endTime = new Date();
      execution.progress = 100;
      execution.successRate = this.calculateSuccessRate(execution);

      this.onComplete?.(execution);
      return execution;

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');
      this.onError?.(error instanceof Error ? error.message : 'Unknown error');
      return execution;
    }
  }

  private async executeStep(stepId: string, companyData: CompanyData, execution: WorkflowExecution): Promise<void> {
    const startTime = Date.now();
    
    try {
      switch (stepId) {
        case 'company-resolution':
          await this.companyResolution(companyData, execution);
          break;
        case 'executive-discovery':
          await this.executiveDiscovery(companyData, execution);
          break;
        case 'contact-enrichment':
          await this.contactEnrichment(companyData, execution);
          break;
        case 'result-aggregation':
          await this.resultAggregation(execution);
          break;
        case 'efficacy-tracking':
          await this.efficacyTracking(execution);
          break;
        case 'results-storage':
          await this.resultsStorage(execution);
          break;
      }

      const executionTime = Date.now() - startTime;
      execution.results[stepId] = { executionTime, status: 'completed' };
      execution.progress += (100 / 7); // 7 total steps
      this.onProgress?.(execution);

    } catch (error) {
      execution.errors.push(`${stepId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  private async executeParallelVerification(companyData: CompanyData, execution: WorkflowExecution): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Execute 3 verification types in parallel
      const [emailVerification, phoneVerification, personVerification] = await Promise.allSettled([
        this.emailVerification(companyData, execution),
        this.phoneVerification(companyData, execution),
        this.personVerification(companyData, execution)
      ]);

      const results = {
        email: emailVerification.status === 'fulfilled' ? emailVerification.value : null,
        phone: phoneVerification.status === 'fulfilled' ? phoneVerification.value : null,
        person: personVerification.status === 'fulfilled' ? personVerification.value : null
      };

      execution.results['parallel-verification'] = {
        executionTime: Date.now() - startTime,
        status: 'completed',
        results
      };

      execution.progress += (100 / 7);
      this.onProgress?.(execution);

    } catch (error) {
      execution.errors.push(`parallel-verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  // API Integration Methods
  private async companyResolution(companyData: CompanyData, execution: WorkflowExecution): Promise<void> {
    // Simulate CoreSignal API call
    await this.delay(1000);
    execution.totalCost += 0.05;
    
    const resolvedData = {
      ...companyData,
      domain: `${companyData.name.toLowerCase().replace(/\s+/g, '')}.com`,
      size: 'medium',
      employees: Math.floor(Math.random() * 1000) + 50
    };
    
    execution.results['company-resolution'] = resolvedData;
  }

  private async executiveDiscovery(companyData: CompanyData, execution: WorkflowExecution): Promise<void> {
    // Simulate 3-tier waterfall: CoreSignal → Executive Research → AI Research
    await this.delay(2000);
    execution.totalCost += 0.15;

    const executives: ExecutiveData[] = [
      {
        name: 'John Smith',
        title: 'Chief Financial Officer',
        email: 'john.smith@company.com',
        company: companyData.name,
        confidence: 0.95,
        source: 'CoreSignal',
        lastUpdated: new Date()
      },
      {
        name: 'Sarah Johnson',
        title: 'Chief Revenue Officer',
        email: 'sarah.johnson@company.com',
        company: companyData.name,
        confidence: 0.88,
        source: 'Claude AI Research',
        lastUpdated: new Date()
      }
    ];

    execution.results['executive-discovery'] = executives;
  }

  private async contactEnrichment(companyData: CompanyData, execution: WorkflowExecution): Promise<void> {
    // Simulate People Data Labs API call
    await this.delay(1500);
    execution.totalCost += 0.10;

    const enrichedContacts = execution.results['executive-discovery']?.map((exec: ExecutiveData) => ({
      ...exec,
      phone: `+1-555-${Math.floor(Math.random() * 9000) + 1000}`,
      linkedin: `https://linkedin.com/in/${exec.name.toLowerCase().replace(/\s+/g, '-')}`
    }));

    execution.results['contact-enrichment'] = enrichedContacts;
  }

  private async emailVerification(companyData: CompanyData, execution: WorkflowExecution): Promise<VerificationResult> {
    // Simulate ZeroBounce API call
    await this.delay(800);
    execution.totalCost += 0.05;

    return {
      type: 'email',
      status: 'valid',
      confidence: 0.92,
      source: 'ZeroBounce',
      cost: 0.05,
      timestamp: new Date()
    };
  }

  private async phoneVerification(companyData: CompanyData, execution: WorkflowExecution): Promise<VerificationResult> {
    // Simulate Prospeo Mobile API call
    await this.delay(1200);
    execution.totalCost += 0.08;

    return {
      type: 'phone',
      status: 'valid',
      confidence: 0.85,
      source: 'Prospeo Mobile',
      cost: 0.08,
      timestamp: new Date()
    };
  }

  private async personVerification(companyData: CompanyData, execution: WorkflowExecution): Promise<VerificationResult> {
    // Simulate Lusha API call
    await this.delay(1000);
    execution.totalCost += 0.07;

    return {
      type: 'person',
      status: 'valid',
      confidence: 0.90,
      source: 'Lusha',
      cost: 0.07,
      timestamp: new Date()
    };
  }

  private async resultAggregation(execution: WorkflowExecution): Promise<void> {
    await this.delay(500);
    
    const aggregatedResults = {
      executives: execution.results['contact-enrichment'],
      verifications: execution.results['parallel-verification']?.results,
      totalCost: execution.totalCost,
      confidence: this.calculateOverallConfidence(execution)
    };

    execution.results['result-aggregation'] = aggregatedResults;
  }

  private async efficacyTracking(execution: WorkflowExecution): Promise<void> {
    await this.delay(300);
    
    const efficacy = {
      successRate: this.calculateSuccessRate(execution),
      costPerDiscovery: execution.totalCost,
      executionTime: Date.now() - execution.startTime.getTime(),
      apiCalls: this.countApiCalls(execution)
    };

    execution.results['efficacy-tracking'] = efficacy;
  }

  private async resultsStorage(execution: WorkflowExecution): Promise<void> {
    await this.delay(200);
    
    // Simulate saving to database with audit trail
    const auditTrail = {
      executionId: execution.id,
      timestamp: new Date(),
      results: execution.results,
      totalCost: execution.totalCost,
      successRate: execution.successRate
    };

    execution.results['results-storage'] = auditTrail;
  }

  private calculateSuccessRate(execution: WorkflowExecution): number {
    const totalSteps = 7;
    const successfulSteps = Object.keys(execution.results).length;
    return (successfulSteps / totalSteps) * 100;
  }

  private calculateOverallConfidence(execution: WorkflowExecution): number {
    const verifications = execution.results['parallel-verification']?.results;
    if (!verifications) return 0;

    const confidences = Object.values(verifications)
      .filter(v => v !== null)
      .map((v: any) => v.confidence);
    
    return confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
  }

  private countApiCalls(execution: WorkflowExecution): number {
    // Count API calls based on cost (rough estimate)
    return Math.floor(execution.totalCost / 0.05);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCurrentExecution(): WorkflowExecution | null {
    return this.execution;
  }

  cancelExecution(): void {
    if (this.execution && this.execution.status === 'running') {
      this.execution.status = 'cancelled';
      this.execution.endTime = new Date();
      this.onProgress?.(this.execution);
    }
  }
}
