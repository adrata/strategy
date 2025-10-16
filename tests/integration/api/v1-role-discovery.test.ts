/**
 * V1 Role Discovery API Integration Tests
 * 
 * Tests role discovery with multi-company scenarios
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.PEOPLE_DATA_LABS_API_KEY = 'test-key';

describe('V1 Role Discovery API', () => {
  const baseUrl = 'http://localhost:3000';
  const testRoles = ['CFO', 'VP Marketing', 'CMO'];
  const testCompanies = ['Nike', 'Adidas', 'Puma'];

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  describe('POST /api/v1/intelligence/role/discover', () => {
    it('should discover people by role across multiple companies', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: testRoles,
          companies: testCompanies,
          enrichmentLevel: 'discover'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.people).toBeDefined();
      expect(data.metadata.totalFound).toBeGreaterThan(0);
      expect(data.metadata.totalReturned).toBeGreaterThan(0);
      expect(data.metadata.enrichmentLevel).toBe('discover');
    });

    it('should handle single role discovery', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['CFO'],
          companies: ['Nike'],
          enrichmentLevel: 'enrich'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.people).toBeDefined();
      expect(data.metadata.enrichmentLevel).toBe('enrich');
    });

    it('should handle different enrichment levels', async () => {
      const levels = ['discover', 'enrich', 'research'];
      
      for (const level of levels) {
        const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            roles: ['CFO'],
            companies: ['Nike'],
            enrichmentLevel: level
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.metadata.enrichmentLevel).toBe(level);
      }
    });

    it('should validate required roles array', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companies: testCompanies
          // Missing roles
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('roles');
    });

    it('should validate required companies array', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: testRoles
          // Missing companies
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('companies');
    });

    it('should validate non-empty roles array', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: [],
          companies: testCompanies
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('empty');
    });

    it('should validate non-empty companies array', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: testRoles,
          companies: []
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('empty');
    });

    it('should apply filters when provided', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['CFO'],
          companies: ['Nike'],
          enrichmentLevel: 'discover',
          filters: {
            minExperience: 5,
            location: 'United States',
            industry: 'Technology'
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.people).toBeDefined();
    });
  });

  describe('POST /api/v1/intelligence/role/bulk', () => {
    it('should handle bulk role discovery', async () => {
      const bulkRequest = {
        requests: [
          {
            roles: ['CFO'],
            companies: ['Nike'],
            enrichmentLevel: 'discover'
          },
          {
            roles: ['CMO'],
            companies: ['Adidas'],
            enrichmentLevel: 'enrich'
          }
        ]
      };

      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify(bulkRequest)
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.results).toBeDefined();
      expect(data.results.length).toBe(2);
      
      data.results.forEach((result: any) => {
        expect(result.success).toBe(true);
        expect(result.people).toBeDefined();
      });
    });

    it('should handle empty bulk request', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          requests: []
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('requests');
    });
  });

  describe('GET /api/v1/intelligence/role/discover', () => {
    it('should return API documentation', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.endpoint).toBe('/api/v1/intelligence/role/discover');
      expect(data.method).toBe('POST');
      expect(data.description).toBeDefined();
      expect(data.parameters).toBeDefined();
      expect(data.example).toBeDefined();
    });
  });

  describe('AI-Powered Role Variation Generation', () => {
    it('should generate role variations for common roles', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['CFO'],
          companies: ['Nike'],
          enrichmentLevel: 'discover'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.metadata.roleVariationsGenerated).toBeDefined();
    });

    it('should handle uncommon role variations', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['Chief Revenue Officer'],
          companies: ['Nike'],
          enrichmentLevel: 'discover'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.people).toBeDefined();
    });
  });

  describe('Cross-Reference with PDL', () => {
    it('should cross-reference with People Data Labs', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['CFO'],
          companies: ['Nike'],
          enrichmentLevel: 'enrich'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.metadata.pdlResults).toBeDefined();
    });
  });

  describe('Role Scoring and Ranking', () => {
    it('should score and rank role candidates', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['CFO'],
          companies: ['Nike'],
          enrichmentLevel: 'discover'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.people).toBeDefined();
      
      // Check if people are ranked by relevance
      if (data.people.length > 1) {
        expect(data.people[0].relevanceScore).toBeGreaterThanOrEqual(data.people[1].relevanceScore);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing Authorization header
        },
        body: JSON.stringify({
          roles: testRoles,
          companies: testCompanies
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication');
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{"roles": ["CFO"], "companies": ["Nike"' // Missing closing brace
      });

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: ['InvalidRoleThatShouldCauseError'],
          companies: ['InvalidCompany']
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

  describe('Performance and Rate Limiting', () => {
    it('should handle large role discovery requests', async () => {
      const largeRoles = ['CFO', 'CMO', 'CTO', 'VP Sales', 'VP Marketing', 'VP Engineering'];
      const largeCompanies = ['Nike', 'Adidas', 'Puma', 'Reebok', 'Under Armour'];
      
      const response = await fetch(`${baseUrl}/api/v1/intelligence/role/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          roles: largeRoles,
          companies: largeCompanies,
          enrichmentLevel: 'discover'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.metadata.executionTime).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});
