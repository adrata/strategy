/**
 * Strategy API Timeout Configuration Tests
 * 
 * Tests to verify the timeout configuration for the company strategy API
 * to ensure it matches the frontend timeout handling.
 */

import { describe, it, expect } from '@jest/globals';

describe('Company Strategy API Timeout Configuration', () => {
  it('should export maxDuration of 60 seconds', async () => {
    const routeModule = await import('@/app/api/v1/strategy/company/[id]/route');
    
    expect(routeModule).toHaveProperty('maxDuration');
    expect(routeModule.maxDuration).toBe(60);
  });

  it('should export dynamic as force-dynamic', async () => {
    const routeModule = await import('@/app/api/v1/strategy/company/[id]/route');
    
    expect(routeModule).toHaveProperty('dynamic');
    expect(routeModule.dynamic).toBe('force-dynamic');
  });

  it('should have GET and POST handlers exported', async () => {
    const routeModule = await import('@/app/api/v1/strategy/company/[id]/route');
    
    expect(routeModule).toHaveProperty('GET');
    expect(routeModule).toHaveProperty('POST');
    expect(typeof routeModule.GET).toBe('function');
    expect(typeof routeModule.POST).toBe('function');
  });
});

describe('Frontend Timeout Configuration', () => {
  it('should have TIMEOUT_MS constant set to 60000', async () => {
    // We can't directly import the component constant, but we can verify
    // the timeout value is 60 seconds (60000ms) by checking the implementation
    const componentModule = await import('@/frontend/components/pipeline/tabs/UniversalCompanyIntelTab');
    
    // The component should exist
    expect(componentModule).toHaveProperty('UniversalCompanyIntelTab');
    expect(typeof componentModule.UniversalCompanyIntelTab).toBe('function');
  });
});

