/**
 * V1 Person Research API Integration Tests
 * 
 * Tests person research and enrichment endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.OPENAI_API_KEY = 'test-key';
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.PEOPLE_DATA_LABS_API_KEY = 'test-key';

describe('V1 Person Research API', () => {
  const baseUrl = 'http://localhost:3000';
  const testPerson = {
    name: 'John Smith',
    company: 'Nike',
    title: 'CFO'
  };

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  describe('POST /api/v1/intelligence/person/research', () => {
    it('should perform deep person research', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          title: testPerson.title,
          analysisDepth: {
            innovationProfile: true,
            painAwareness: true,
            buyingAuthority: true,
            influenceNetwork: true,
            careerTrajectory: true,
            riskProfile: true
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.metadata.analysisCompleted).toBeDefined();
      expect(data.metadata.analysisCompleted.length).toBeGreaterThan(0);
    });

    it('should handle minimal person research request', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should validate required name field', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          company: testPerson.company
          // Missing name
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('name');
    });

    it('should validate name length', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'A', // Too short
          company: testPerson.company
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('characters');
    });

    it('should include AI intelligence when requested', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          analysisDepth: {
            includeAI: true
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.aiIntelligence) {
        expect(data.aiIntelligence.wants).toBeDefined();
        expect(data.aiIntelligence.pains).toBeDefined();
        expect(data.aiIntelligence.outreach).toBeDefined();
        expect(data.aiIntelligence.overallInsight).toBeDefined();
        expect(data.aiIntelligence.confidence).toBeGreaterThan(0);
      }
    });
  });

  describe('POST /api/v1/intelligence/person/enrich', () => {
    it('should enrich person with contact information', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/enrich`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          title: testPerson.title,
          enrichmentLevel: 'enrich'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.person).toBeDefined();
      expect(data.person.name).toBe(testPerson.name);
    });

    it('should handle different enrichment levels', async () => {
      const levels = ['discover', 'enrich', 'research'];
      
      for (const level of levels) {
        const response = await fetch(`${baseUrl}/api/v1/intelligence/person/enrich`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            name: testPerson.name,
            company: testPerson.company,
            enrichmentLevel: level
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.person).toBeDefined();
        expect(data.metadata.enrichmentLevel).toBe(level);
      }
    });
  });

  describe('POST /api/v1/intelligence/person/ai-analysis', () => {
    it('should perform AI-powered person analysis', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/ai-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          title: testPerson.title,
          analysisType: 'comprehensive'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.aiAnalysis).toBeDefined();
      expect(data.aiAnalysis.wants).toBeDefined();
      expect(data.aiAnalysis.pains).toBeDefined();
      expect(data.aiAnalysis.outreach).toBeDefined();
    });

    it('should handle different analysis types', async () => {
      const analysisTypes = ['wants', 'pains', 'outreach', 'comprehensive'];
      
      for (const type of analysisTypes) {
        const response = await fetch(`${baseUrl}/api/v1/intelligence/person/ai-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            name: testPerson.name,
            company: testPerson.company,
            analysisType: type
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.aiAnalysis).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/intelligence/person/research', () => {
    it('should return API documentation', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.endpoint).toBe('/api/v1/intelligence/person/research');
      expect(data.method).toBe('POST');
      expect(data.description).toBeDefined();
      expect(data.parameters).toBeDefined();
      expect(data.example).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing Authorization header
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication');
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{"name": "John Smith", "company": "Nike"' // Missing closing brace
      });

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: 'InvalidPersonNameThatShouldCauseError',
          company: 'InvalidCompany'
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

  describe('Analysis Depth Options', () => {
    it('should handle innovation profile analysis', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          analysisDepth: {
            innovationProfile: true
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.data.innovationProfile) {
        expect(data.data.innovationProfile.segment).toBeDefined();
        expect(data.data.innovationProfile.confidence).toBeGreaterThan(0);
      }
    });

    it('should handle pain awareness analysis', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          analysisDepth: {
            painAwareness: true
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.data.painAwareness) {
        expect(data.data.painAwareness.painPoints).toBeDefined();
        expect(data.data.painAwareness.urgencyLevel).toBeDefined();
      }
    });

    it('should handle buying authority analysis', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/person/research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          name: testPerson.name,
          company: testPerson.company,
          analysisDepth: {
            buyingAuthority: true
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      if (data.data.buyingAuthority) {
        expect(data.data.buyingAuthority.role).toBeDefined();
        expect(data.data.buyingAuthority.decisionPower).toBeDefined();
      }
    });
  });
});
