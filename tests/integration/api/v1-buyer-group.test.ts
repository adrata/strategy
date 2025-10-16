/**
 * V1 Buyer Group API Integration Tests
 * 
 * Tests all enrichment levels and functionality of the v1 buyer group API
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.CORESIGNAL_API_KEY = 'test-key';
process.env.PERPLEXITY_API_KEY = 'test-key';
process.env.LUSHA_API_KEY = 'test-key';

describe('V1 Buyer Group API', () => {
  const baseUrl = 'http://localhost:3000';
  const testCompany = 'Nike';
  const testWebsite = 'nike.com';

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  afterAll(async () => {
    // Cleanup if needed
  });

  describe('POST /api/v1/intelligence/buyer-group', () => {
    it('should handle Level 1 (Identify) enrichment', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // Mock auth
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          enrichmentLevel: 'identify',
          saveToDatabase: false
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companyName).toBe(testCompany);
      expect(data.buyerGroup).toBeDefined();
      expect(data.buyerGroup.totalMembers).toBeGreaterThan(0);
      expect(data.metadata.enrichmentLevel).toBe('identify');
      expect(data.metadata.costEstimate).toBeLessThan(1); // Should be ~$0.10
    });

    it('should handle Level 2 (Enrich) enrichment', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          enrichmentLevel: 'enrich',
          saveToDatabase: false
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.buyerGroup.members).toBeDefined();
      expect(data.buyerGroup.members.length).toBeGreaterThan(0);
      
      // Level 2 should include contact information
      const memberWithContact = data.buyerGroup.members.find((m: any) => m.email);
      expect(memberWithContact).toBeDefined();
      expect(data.metadata.costEstimate).toBeLessThan(5); // Should be ~$2-3
    });

    it('should handle Level 3 (Deep Research) enrichment', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          enrichmentLevel: 'deep_research',
          saveToDatabase: false
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.buyerGroup.members).toBeDefined();
      expect(data.buyerGroup.members.length).toBeGreaterThan(0);
      
      // Level 3 should include comprehensive intelligence
      const memberWithIntelligence = data.buyerGroup.members.find((m: any) => 
        m.email && m.phone && m.linkedin
      );
      expect(memberWithIntelligence).toBeDefined();
      expect(data.metadata.costEstimate).toBeLessThan(10); // Should be ~$5-8
    });

    it('should validate required fields', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          // Missing companyName
          enrichmentLevel: 'identify'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('company name');
    });

    it('should validate enrichment level', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          enrichmentLevel: 'invalid_level'
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('enrichment level');
    });

    it('should handle authentication errors', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing Authorization header
        },
        body: JSON.stringify({
          companyName: testCompany,
          enrichmentLevel: 'identify'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication');
    });
  });

  describe('GET /api/v1/intelligence/buyer-group', () => {
    it('should retrieve saved buyer group', async () => {
      // First, create a buyer group
      const createResponse = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          enrichmentLevel: 'identify',
          saveToDatabase: true
        })
      });

      expect(createResponse.status).toBe(200);

      // Then retrieve it
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group?company=${encodeURIComponent(testCompany)}`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companyName).toBe(testCompany);
      expect(data.buyerGroup).toBeDefined();
    });

    it('should handle missing company parameter', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('company name');
    });

    it('should handle non-existent buyer group', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group?company=NonExistentCompany123`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('POST /api/v1/intelligence/buyer-group/bulk', () => {
    it('should handle bulk buyer group discovery', async () => {
      const companies = ['Nike', 'Adidas', 'Puma'];
      
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companies: companies.map(name => ({
            companyName: name,
            enrichmentLevel: 'identify',
            saveToDatabase: false
          }))
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.length).toBe(companies.length);
      
      data.results.forEach((result: any, index: number) => {
        expect(result.companyName).toBe(companies[index]);
        expect(result.buyerGroup).toBeDefined();
      });
    });

    it('should handle empty bulk request', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companies: []
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('companies');
    });
  });

  describe('POST /api/v1/intelligence/buyer-group/refresh', () => {
    it('should refresh stale buyer group data', async () => {
      // First, create a buyer group
      await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          enrichmentLevel: 'identify',
          saveToDatabase: true
        })
      });

      // Then refresh it
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          enrichmentLevel: 'enrich' // Upgrade enrichment level
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companyName).toBe(testCompany);
      expect(data.buyerGroup).toBeDefined();
      expect(data.metadata.enrichmentLevel).toBe('enrich');
    });

    it('should handle refresh of non-existent buyer group', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: 'NonExistentCompany123',
          enrichmentLevel: 'identify'
        })
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });
  });

  describe('Progressive Enrichment Cost Tracking', () => {
    it('should track costs accurately across enrichment levels', async () => {
      const levels = ['identify', 'enrich', 'deep_research'];
      const expectedCosts = [0.10, 2.00, 5.00]; // Approximate costs
      
      for (let i = 0; i < levels.length; i++) {
        const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            companyName: testCompany,
            website: testWebsite,
            enrichmentLevel: levels[i],
            saveToDatabase: false
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.metadata.costEstimate).toBeGreaterThan(0);
        expect(data.metadata.costEstimate).toBeLessThan(expectedCosts[i] * 2); // Allow for variance
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{"companyName": "Nike", "enrichmentLevel": "identify"' // Missing closing brace
      });

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      // This test would require mocking external API failures
      // For now, we'll test the error response structure
      const response = await fetch(`${baseUrl}/api/v1/intelligence/buyer-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: 'InvalidCompanyNameThatShouldCauseError',
          enrichmentLevel: 'identify'
        })
      });

      // Should either succeed with empty results or fail gracefully
      if (response.status === 200) {
        const data = await response.json();
        expect(data.success).toBe(true);
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.status).toBeLessThan(600);
      }
    });
  });
});
