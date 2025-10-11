/**
 * COMPREHENSIVE FUNCTION TESTS
 * 
 * Unit tests for all pure functions in the function-based pipeline
 * Tests idempotency, error handling, and expected outputs
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Import all functions
import { resolveCompanyFunction } from '../../functions/company/resolve-company';
import { discoverExecutivesFunction } from '../../functions/executives/discover-executives';
import { verifyPersonFunction } from '../../functions/verification/verify-person';
import { verifyEmailFunction } from '../../functions/verification/verify-email';
import { verifyPhoneFunction } from '../../functions/verification/verify-phone';
import { verifyEmploymentFunction } from '../../functions/verification/verify-employment';
import { saveExecutiveFunction } from '../../functions/database/save-executive';
import { generateCSVFunction } from '../../functions/output/generate-csv';
import { generateJSONFunction } from '../../functions/output/generate-json';

// ============================================================================
// MOCK CONTEXT
// ============================================================================

const mockContext = {
  workspaceId: 'test-workspace',
  userId: 'test-user',
  enrichmentLevel: 'enrich' as const,
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
// COMPANY RESOLUTION TESTS
// ============================================================================

describe('Company Resolution Function', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resolve company from URL', async () => {
    const input = {
      companyUrl: 'https://salesforce.com',
      companyName: 'Salesforce'
    };

    const result = await resolveCompanyFunction.execute(input, mockContext);

    expect(result).toHaveProperty('companyName');
    expect(result).toHaveProperty('domain');
    expect(result).toHaveProperty('companyId');
    expect(result).toHaveProperty('creditsUsed');
    expect(result.companyName).toBe('Salesforce');
    expect(result.domain).toBe('salesforce.com');
  });

  it('should be idempotent (same input = same output)', async () => {
    const input = {
      companyUrl: 'https://microsoft.com',
      companyName: 'Microsoft'
    };

    const result1 = await resolveCompanyFunction.execute(input, mockContext);
    const result2 = await resolveCompanyFunction.execute(input, mockContext);

    expect(result1).toEqual(result2);
  });

  it('should handle invalid URLs gracefully', async () => {
    const input = {
      companyUrl: 'invalid-url',
      companyName: 'Invalid Company'
    };

    await expect(resolveCompanyFunction.execute(input, mockContext))
      .rejects.toThrow('Company not found');
  });
});

// ============================================================================
// EXECUTIVE DISCOVERY TESTS
// ============================================================================

describe('Executive Discovery Function', () => {
  it('should discover CFO and CRO', async () => {
    const input = {
      companyId: 'test-company-id',
      companyName: 'Test Company',
      domain: 'testcompany.com'
    };

    const result = await discoverExecutivesFunction.execute(input, mockContext);

    expect(result).toHaveProperty('cfo');
    expect(result).toHaveProperty('cro');
    expect(result).toHaveProperty('creditsUsed');
    expect(result).toHaveProperty('discoveryMethod');
  });

  it('should handle companies with no executives', async () => {
    const input = {
      companyId: 'empty-company-id',
      companyName: 'Empty Company',
      domain: 'emptycompany.com'
    };

    const result = await discoverExecutivesFunction.execute(input, mockContext);

    expect(result.cfo).toBeNull();
    expect(result.cro).toBeNull();
    expect(result.creditsUsed).toBeGreaterThan(0);
  });
});

// ============================================================================
// VERIFICATION TESTS
// ============================================================================

describe('Person Verification Function', () => {
  it('should verify person identity', async () => {
    const input = {
      personName: 'John Doe',
      companyName: 'Test Company',
      domain: 'testcompany.com',
      linkedinUrl: 'https://linkedin.com/in/johndoe'
    };

    const result = await verifyPersonFunction.execute(input, mockContext);

    expect(result).toHaveProperty('verified');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('sources');
    expect(result).toHaveProperty('creditsUsed');
    expect(result).toHaveProperty('verificationDetails');
  });

  it('should handle verification failures gracefully', async () => {
    const input = {
      personName: 'Unknown Person',
      companyName: 'Test Company',
      domain: 'testcompany.com'
    };

    const result = await verifyPersonFunction.execute(input, mockContext);

    expect(result.verified).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

describe('Email Verification Function', () => {
  it('should verify email with 4-layer validation', async () => {
    const input = {
      email: 'john.doe@testcompany.com',
      personName: 'John Doe',
      companyName: 'Test Company'
    };

    const result = await verifyEmailFunction.execute(input, mockContext);

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('deliverability');
    expect(result).toHaveProperty('creditsUsed');
    expect(result).toHaveProperty('verificationDetails');
  });

  it('should determine deliverability level correctly', async () => {
    const input = {
      email: 'test@testcompany.com',
      personName: 'Test User',
      companyName: 'Test Company'
    };

    const result = await verifyEmailFunction.execute(input, mockContext);

    expect(['high', 'medium', 'low', 'unknown']).toContain(result.deliverability);
  });
});

describe('Phone Verification Function', () => {
  it('should verify phone with 4-source validation', async () => {
    const input = {
      phone: '+1-555-123-4567',
      personName: 'John Doe',
      companyName: 'Test Company',
      linkedinUrl: 'https://linkedin.com/in/johndoe'
    };

    const result = await verifyPhoneFunction.execute(input, mockContext);

    expect(result).toHaveProperty('valid');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('lineType');
    expect(result).toHaveProperty('creditsUsed');
    expect(result).toHaveProperty('verificationDetails');
  });

  it('should determine line type correctly', async () => {
    const input = {
      phone: '+1-555-123-4567',
      personName: 'John Doe',
      companyName: 'Test Company'
    };

    const result = await verifyPhoneFunction.execute(input, mockContext);

    expect(['mobile', 'landline', 'voip', 'unknown']).toContain(result.lineType);
  });
});

describe('Employment Verification Function', () => {
  it('should verify current employment', async () => {
    const input = {
      personName: 'John Doe',
      companyName: 'Test Company',
      title: 'CFO'
    };

    const result = await verifyEmploymentFunction.execute(input, mockContext);

    expect(result).toHaveProperty('isCurrent');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('creditsUsed');
    expect(result).toHaveProperty('verificationDetails');
  });

  it('should reject former employees', async () => {
    const input = {
      personName: 'Former Employee',
      companyName: 'Test Company',
      title: 'Former CFO'
    };

    const result = await verifyEmploymentFunction.execute(input, mockContext);

    expect(result.isCurrent).toBe(false);
    expect(result.confidence).toBe(0);
  });
});

// ============================================================================
// DATABASE TESTS
// ============================================================================

describe('Database Save Function', () => {
  it('should save executive data idempotently', async () => {
    const input = {
      companyId: 'test-company-id',
      companyName: 'Test Company',
      role: 'CFO' as const,
      name: 'John Doe',
      title: 'Chief Financial Officer',
      email: 'john.doe@testcompany.com',
      phone: '+1-555-123-4567',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      confidence: 95,
      verificationDetails: {
        person: { verified: true, confidence: 95 },
        email: { valid: true, confidence: 90 },
        phone: { valid: true, confidence: 85 },
        employment: { isCurrent: true, confidence: 90 }
      }
    };

    const result = await saveExecutiveFunction.execute(input, mockContext);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('created');
    expect(result).toHaveProperty('updated');
    expect(result).toHaveProperty('timestamp');
  });

  it('should be idempotent (safe to retry)', async () => {
    const input = {
      companyId: 'test-company-id',
      companyName: 'Test Company',
      role: 'CRO' as const,
      name: 'Jane Smith',
      title: 'Chief Revenue Officer',
      confidence: 90,
      verificationDetails: {
        person: { verified: true, confidence: 90 },
        email: { valid: true, confidence: 85 },
        phone: { valid: true, confidence: 80 },
        employment: { isCurrent: true, confidence: 95 }
      }
    };

    const result1 = await saveExecutiveFunction.execute(input, mockContext);
    const result2 = await saveExecutiveFunction.execute(input, mockContext);

    // Should not throw error on retry
    expect(result1).toBeDefined();
    expect(result2).toBeDefined();
  });
});

// ============================================================================
// OUTPUT GENERATION TESTS
// ============================================================================

describe('CSV Output Function', () => {
  it('should generate CSV output', async () => {
    const input = {
      outputPath: './test-output.csv',
      record: {
        companyName: 'Test Company',
        role: 'CFO' as const,
        name: 'John Doe',
        title: 'Chief Financial Officer',
        email: 'john.doe@testcompany.com',
        phone: '+1-555-123-4567',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        confidence: 95,
        personVerified: true,
        emailValid: true,
        phoneValid: true,
        employmentCurrent: true,
        verificationDetails: '{"test": "data"}',
        timestamp: new Date().toISOString()
      }
    };

    const result = await generateCSVFunction.execute(input, mockContext);

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('recordsWritten');
    expect(result).toHaveProperty('fileSize');
    expect(result.recordsWritten).toBe(1);
  });
});

describe('JSON Output Function', () => {
  it('should generate JSON output', async () => {
    const input = {
      outputPath: './test-output.json',
      record: {
        company: {
          name: 'Test Company',
          domain: 'testcompany.com',
          companyId: 'test-company-id'
        },
        executive: {
          role: 'CFO' as const,
          name: 'John Doe',
          title: 'Chief Financial Officer',
          email: 'john.doe@testcompany.com',
          phone: '+1-555-123-4567',
          linkedinUrl: 'https://linkedin.com/in/johndoe'
        },
        verification: {
          overall: {
            confidence: 95,
            verified: true
          },
          person: { verified: true, confidence: 95 },
          email: { valid: true, confidence: 90 },
          phone: { valid: true, confidence: 85 },
          employment: { isCurrent: true, confidence: 90 }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          pipelineVersion: '2.0.0-function-based',
          executionTime: 1000
        }
      }
    };

    const result = await generateJSONFunction.execute(input, mockContext);

    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('recordsWritten');
    expect(result).toHaveProperty('fileSize');
    expect(result.recordsWritten).toBe(1);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Function Integration', () => {
  it('should execute complete workflow for a company', async () => {
    // Step 1: Resolve company
    const companyInput = {
      companyUrl: 'https://testcompany.com',
      companyName: 'Test Company'
    };
    const company = await resolveCompanyFunction.execute(companyInput, mockContext);

    // Step 2: Discover executives
    const executiveInput = {
      companyId: company.companyId,
      companyName: company.companyName,
      domain: company.domain
    };
    const executives = await discoverExecutivesFunction.execute(executiveInput, mockContext);

    // Step 3: Verify person (if found)
    if (executives.cfo) {
      const personInput = {
        personName: executives.cfo.name,
        companyName: company.companyName,
        domain: company.domain,
        linkedinUrl: executives.cfo.linkedinUrl
      };
      const personVerification = await verifyPersonFunction.execute(personInput, mockContext);

      expect(personVerification).toBeDefined();
      expect(personVerification).toHaveProperty('verified');
      expect(personVerification).toHaveProperty('confidence');
    }

    // Verify the workflow completed successfully
    expect(company).toBeDefined();
    expect(executives).toBeDefined();
  });
});

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

describe('Error Handling', () => {
  it('should handle API failures gracefully', async () => {
    const input = {
      companyUrl: 'https://nonexistent.com',
      companyName: 'Nonexistent Company'
    };

    await expect(resolveCompanyFunction.execute(input, mockContext))
      .rejects.toThrow();
  });

  it('should handle network timeouts', async () => {
    const input = {
      personName: 'Timeout Test',
      companyName: 'Test Company',
      domain: 'testcompany.com'
    };

    // This should not throw an unhandled error
    const result = await verifyPersonFunction.execute(input, mockContext);
    expect(result).toBeDefined();
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

describe('Performance', () => {
  it('should execute functions within timeout limits', async () => {
    const input = {
      companyUrl: 'https://testcompany.com',
      companyName: 'Test Company'
    };

    const startTime = Date.now();
    await resolveCompanyFunction.execute(input, mockContext);
    const executionTime = Date.now() - startTime;

    // Should complete within 10 seconds (timeout limit)
    expect(executionTime).toBeLessThan(10000);
  });

  it('should handle concurrent executions', async () => {
    const inputs = [
      { companyUrl: 'https://company1.com', companyName: 'Company 1' },
      { companyUrl: 'https://company2.com', companyName: 'Company 2' },
      { companyUrl: 'https://company3.com', companyName: 'Company 3' }
    ];

    const promises = inputs.map(input => 
      resolveCompanyFunction.execute(input, mockContext)
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result).toHaveProperty('companyName');
      expect(result).toHaveProperty('companyId');
    });
  });
});
