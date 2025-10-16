/**
 * V1 Company Intelligence API Integration Tests
 * 
 * Tests company discovery, ICP scoring, and analytics
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock environment variables for testing
process.env.CORESIGNAL_API_KEY = 'test-key';
process.env.OPENAI_API_KEY = 'test-key';

describe('V1 Company Intelligence API', () => {
  const baseUrl = 'http://localhost:3000';
  const testCompany = 'Nike';
  const testWebsite = 'nike.com';

  beforeAll(async () => {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 5000));
  });

  describe('POST /api/v1/intelligence/company/discover', () => {
    it('should discover companies matching criteria', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          criteria: {
            industry: 'Technology',
            sizeRange: '100-500',
            location: 'United States',
            limit: 10
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companies).toBeDefined();
      expect(data.companies.length).toBeGreaterThan(0);
      expect(data.metadata.totalFound).toBeGreaterThan(0);
    });

    it('should handle firmographic filtering', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          criteria: {
            industry: 'Technology',
            sizeRange: '100-500',
            revenueRange: '10M-100M',
            location: 'United States',
            foundedAfter: '2010',
            limit: 5
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companies).toBeDefined();
    });

    it('should validate required criteria', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          // Missing criteria
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('criteria');
    });
  });

  describe('POST /api/v1/intelligence/company/icp', () => {
    it('should perform people-centric ICP scoring', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/icp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          icpCriteria: {
            targetRoles: ['CFO', 'CMO', 'CTO'],
            targetDepartments: ['Finance', 'Marketing', 'Engineering'],
            companySize: '100-1000',
            industry: 'Technology'
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.icpScore).toBeDefined();
      expect(data.icpScore.overall).toBeGreaterThanOrEqual(0);
      expect(data.icpScore.overall).toBeLessThanOrEqual(100);
      expect(data.icpScore.breakdown).toBeDefined();
    });

    it('should validate required company information', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/icp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          icpCriteria: {
            targetRoles: ['CFO']
          }
          // Missing companyName
        })
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('company name');
    });
  });

  describe('POST /api/v1/intelligence/company/score', () => {
    it('should score company fit', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          scoringCriteria: {
            innovationSegment: 'Early Adopters',
            painSignals: ['scaling challenges', 'growth constraints'],
            buyerGroupQuality: 'high'
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.fitScore).toBeDefined();
      expect(data.fitScore.overall).toBeGreaterThanOrEqual(0);
      expect(data.fitScore.overall).toBeLessThanOrEqual(100);
      expect(data.fitScore.breakdown).toBeDefined();
    });

    it('should handle different scoring criteria', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          scoringCriteria: {
            innovationSegment: 'Innovators',
            painSignals: ['technology adoption'],
            buyerGroupQuality: 'medium'
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.fitScore).toBeDefined();
    });
  });

  describe('GET /api/v1/intelligence/company/recommend', () => {
    it('should provide company recommendations', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/recommend?limit=5`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.recommendations).toBeDefined();
      expect(data.recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should handle limit parameter', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/recommend?limit=10`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.recommendations.length).toBeLessThanOrEqual(10);
    });
  });

  describe('POST /api/v1/intelligence/company/analytics', () => {
    it('should provide company analytics', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          analyticsType: 'comprehensive'
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.analytics).toBeDefined();
      expect(data.analytics.companyMetrics).toBeDefined();
      expect(data.analytics.buyerGroupMetrics).toBeDefined();
      expect(data.analytics.marketPosition).toBeDefined();
    });

    it('should handle different analytics types', async () => {
      const analyticsTypes = ['company', 'buyer-group', 'market', 'comprehensive'];
      
      for (const type of analyticsTypes) {
        const response = await fetch(`${baseUrl}/api/v1/intelligence/company/analytics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-token'
          },
          body: JSON.stringify({
            companyName: testCompany,
            website: testWebsite,
            analyticsType: type
          })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.analytics).toBeDefined();
      }
    });
  });

  describe('GET /api/v1/intelligence/company/discover', () => {
    it('should return API documentation', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'GET'
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.endpoint).toBe('/api/v1/intelligence/company/discover');
      expect(data.method).toBe('POST');
      expect(data.description).toBeDefined();
      expect(data.parameters).toBeDefined();
      expect(data.example).toBeDefined();
    });
  });

  describe('Innovation Profile Matching', () => {
    it('should match companies by innovation profile', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          criteria: {
            innovationProfile: {
              segment: 'Early Adopters',
              characteristics: ['technology-forward', 'growth-oriented']
            },
            limit: 5
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.companies).toBeDefined();
    });
  });

  describe('Company Fit Scoring', () => {
    it('should calculate comprehensive fit scores', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          companyName: testCompany,
          website: testWebsite,
          scoringCriteria: {
            innovationSegment: 'Early Adopters',
            painSignals: ['scaling challenges'],
            buyerGroupQuality: 'high',
            marketPosition: 'leader',
            growthTrajectory: 'positive'
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.fitScore.breakdown.innovationFit).toBeDefined();
      expect(data.fitScore.breakdown.painAlignment).toBeDefined();
      expect(data.fitScore.breakdown.buyerGroupQuality).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle authentication errors', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing Authorization header
        },
        body: JSON.stringify({
          criteria: {
            industry: 'Technology'
          }
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Authentication');
    });

    it('should handle malformed requests', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: '{"criteria": {"industry": "Technology"' // Missing closing brace
      });

      expect(response.status).toBe(400);
    });

    it('should handle server errors gracefully', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          criteria: {
            industry: 'InvalidIndustryThatShouldCauseError'
          }
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

  describe('Performance and Scalability', () => {
    it('should handle large discovery requests efficiently', async () => {
      const response = await fetch(`${baseUrl}/api/v1/intelligence/company/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        },
        body: JSON.stringify({
          criteria: {
            industry: 'Technology',
            sizeRange: '10-1000',
            location: 'United States',
            limit: 100
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.metadata.executionTime).toBeLessThan(60000); // Should complete within 60 seconds
    });
  });
});
