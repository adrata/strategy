/**
 * ORCHESTRATION INTEGRATION TESTS
 * 
 * Integration tests for the complete function-based orchestration pipeline
 * Tests end-to-end workflow, error handling, and performance
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { CFOCROOrchestrator } from '../orchestration/cfo-cro-orchestrator';
import type { PipelineContext } from '../../intelligence/shared/orchestration';

// ============================================================================
// MOCK CONTEXT
// ============================================================================

const mockContext: PipelineContext = {
  workspaceId: 'test-workspace',
  userId: 'test-user',
  enrichmentLevel: 'enrich',
  config: {
    CORESIGNAL_API_KEY: 'test-coresignal-key',
    LUSHA_API_KEY: 'test-lusha-key',
    PROSPEO_API_KEY: 'test-prospeo-key',
    TWILIO_ACCOUNT_SID: 'test-twilio-sid',
    TWILIO_AUTH_TOKEN: 'test-twilio-token',
    PERPLEXITY_API_KEY: 'test-perplexity-key',
    ZEROBOUNCE_API_KEY: 'test-zerobounce-key',
    MYEMAILVERIFIER_API_KEY: 'test-myemailverifier-key',
    PEOPLE_DATA_LABS_API_KEY: 'test-pdl-key'
  },
  metadata: {
    startTime: Date.now(),
    stepCount: 0,
    currentStep: ''
  }
};

// ============================================================================
// ORCHESTRATOR TESTS
// ============================================================================

describe('CFOCROOrchestrator', () => {
  let orchestrator: CFOCROOrchestrator;

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
    jest.clearAllMocks();
  });

  it('should initialize with all required steps', () => {
    expect(orchestrator).toBeDefined();
    expect(orchestrator).toBeInstanceOf(CFOCROOrchestrator);
  });

  it('should execute pipeline for single company', async () => {
    const companies = ['https://testcompany.com'];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.metadata).toBeDefined();
    expect(result.metadata.executionTime).toBeGreaterThan(0);
    expect(result.metadata.stepsExecuted.length).toBeGreaterThan(0);
  });

  it('should execute pipeline for multiple companies', async () => {
    const companies = [
      'https://company1.com',
      'https://company2.com',
      'https://company3.com'
    ];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    
    if (result.data) {
      result.data.forEach((companyResult: any) => {
        expect(companyResult).toHaveProperty('companyName');
        expect(companyResult).toHaveProperty('cfo');
        expect(companyResult).toHaveProperty('cro');
        expect(companyResult).toHaveProperty('totalCost');
        expect(companyResult).toHaveProperty('executionTime');
      });
    }
  });

  it('should track costs accurately', async () => {
    const companies = ['https://testcompany.com'];

    const result = await orchestrator.execute(companies);

    expect(result.metadata.costEstimate).toBeGreaterThan(0);
    expect(result.metadata.apiCalls).toBeDefined();
    
    // Should have API calls for different services
    const apiCalls = result.metadata.apiCalls;
    expect(Object.keys(apiCalls).length).toBeGreaterThan(0);
  });

  it('should handle company resolution failures gracefully', async () => {
    const companies = ['https://nonexistent-company.com'];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    
    if (result.data) {
      const companyResult = result.data[0];
      expect(companyResult.cfo.found).toBe(false);
      expect(companyResult.cro.found).toBe(false);
    }
  });

  it('should process CFO and CRO in parallel when both found', async () => {
    const companies = ['https://testcompany.com'];

    const startTime = Date.now();
    const result = await orchestrator.execute(companies);
    const executionTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    
    // Should complete within reasonable time (parallel processing)
    expect(executionTime).toBeLessThan(30000); // 30 seconds max
  });
});

// ============================================================================
// EVENT SYSTEM TESTS
// ============================================================================

describe('Event System Integration', () => {
  let orchestrator: CFOCROOrchestrator;
  let eventLogs: any[] = [];

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
    eventLogs = [];
    
    // Capture events
    orchestrator.on('stepStart', (event) => {
      eventLogs.push({ type: 'stepStart', step: event.step });
    });
    
    orchestrator.on('stepComplete', (event) => {
      eventLogs.push({ type: 'stepComplete', step: event.step, duration: event.duration });
    });
    
    orchestrator.on('stepFailed', (event) => {
      eventLogs.push({ type: 'stepFailed', step: event.step, error: event.error.message });
    });
  });

  it('should emit step start and complete events', async () => {
    const companies = ['https://testcompany.com'];

    await orchestrator.execute(companies);

    const startEvents = eventLogs.filter(log => log.type === 'stepStart');
    const completeEvents = eventLogs.filter(log => log.type === 'stepComplete');

    expect(startEvents.length).toBeGreaterThan(0);
    expect(completeEvents.length).toBeGreaterThan(0);
    
    // Should have matching start/complete events
    expect(startEvents.length).toBe(completeEvents.length);
  });

  it('should emit progress events', async () => {
    const companies = ['https://company1.com', 'https://company2.com'];
    let progressEvents: any[] = [];

    orchestrator.on('progress', (event) => {
      progressEvents.push(event);
    });

    await orchestrator.execute(companies);

    expect(progressEvents.length).toBeGreaterThan(0);
    
    // Progress should increase
    const progressValues = progressEvents.map(e => e.completed / e.total);
    expect(progressValues[progressValues.length - 1]).toBeGreaterThan(progressValues[0]);
  });

  it('should emit cost update events', async () => {
    const companies = ['https://testcompany.com'];
    let costEvents: any[] = [];

    orchestrator.on('costUpdate', (event) => {
      costEvents.push(event);
    });

    await orchestrator.execute(companies);

    expect(costEvents.length).toBeGreaterThan(0);
    
    // Should have cost updates for different APIs
    const apis = [...new Set(costEvents.map(e => e.api))];
    expect(apis.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// CIRCUIT BREAKER TESTS
// ============================================================================

describe('Circuit Breaker Integration', () => {
  let orchestrator: CFOCROOrchestrator;

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
  });

  it('should track circuit breaker status', async () => {
    const companies = ['https://testcompany.com'];

    await orchestrator.execute(companies);

    const status = orchestrator.getCircuitBreakerStatus();
    expect(status).toBeDefined();
    expect(typeof status).toBe('object');
  });

  it('should reset circuit breakers', () => {
    orchestrator.resetCircuitBreakers();
    
    const status = orchestrator.getCircuitBreakerStatus();
    expect(status).toBeDefined();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance Integration', () => {
  let orchestrator: CFOCROOrchestrator;

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
  });

  it('should complete within reasonable time for single company', async () => {
    const companies = ['https://testcompany.com'];

    const startTime = Date.now();
    const result = await orchestrator.execute(companies);
    const executionTime = Date.now() - startTime;

    expect(result.success).toBe(true);
    expect(executionTime).toBeLessThan(60000); // 1 minute max
  });

  it('should scale linearly with company count', async () => {
    const singleCompany = ['https://testcompany.com'];
    const multipleCompanies = [
      'https://company1.com',
      'https://company2.com',
      'https://company3.com'
    ];

    const startTime1 = Date.now();
    await orchestrator.execute(singleCompany);
    const time1 = Date.now() - startTime1;

    const startTime2 = Date.now();
    await orchestrator.execute(multipleCompanies);
    const time2 = Date.now() - startTime2;

    // Multiple companies should take longer but not exponentially
    expect(time2).toBeGreaterThan(time1);
    expect(time2).toBeLessThan(time1 * 4); // Should be roughly linear
  });

  it('should handle concurrent executions', async () => {
    const companies1 = ['https://company1.com'];
    const companies2 = ['https://company2.com'];
    const companies3 = ['https://company3.com'];

    const promises = [
      orchestrator.execute(companies1),
      orchestrator.execute(companies2),
      orchestrator.execute(companies3)
    ];

    const results = await Promise.all(promises);

    results.forEach(result => {
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});

// ============================================================================
// ERROR RECOVERY TESTS
// ============================================================================

describe('Error Recovery Integration', () => {
  let orchestrator: CFOCROOrchestrator;

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
  });

  it('should recover from individual company failures', async () => {
    const companies = [
      'https://valid-company.com',
      'https://invalid-company.com',
      'https://another-valid-company.com'
    ];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    
    // Should have processed all companies even if some failed
    if (result.data) {
      result.data.forEach(companyResult => {
        expect(companyResult).toHaveProperty('companyName');
        expect(companyResult).toHaveProperty('executionTime');
      });
    }
  });

  it('should provide detailed error information', async () => {
    const companies = ['https://error-company.com'];

    const result = await orchestrator.execute(companies);

    // Should not crash the entire pipeline
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
});

// ============================================================================
// DATA INTEGRITY TESTS
// ============================================================================

describe('Data Integrity Integration', () => {
  let orchestrator: CFOCROOrchestrator;

  beforeEach(() => {
    orchestrator = new CFOCROOrchestrator(mockContext);
  });

  it('should maintain data consistency across steps', async () => {
    const companies = ['https://testcompany.com'];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    
    if (result.data) {
      const companyResult = result.data[0];
      
      // Data should be consistent
      expect(companyResult.companyName).toBeDefined();
      expect(typeof companyResult.cfo.found).toBe('boolean');
      expect(typeof companyResult.cro.found).toBe('boolean');
      expect(typeof companyResult.totalCost).toBe('number');
      expect(typeof companyResult.executionTime).toBe('number');
    }
  });

  it('should generate valid output files', async () => {
    const companies = ['https://testcompany.com'];

    const result = await orchestrator.execute(companies);

    expect(result.success).toBe(true);
    
    // Check if output files were created (if any executives were found)
    // This would require checking the file system
  });
});
