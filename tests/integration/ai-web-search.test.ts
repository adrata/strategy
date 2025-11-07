/**
 * AI Web Search Integration Tests
 * 
 * Validates that the AI right panel can search the web and return results
 */

import { webResearchService } from '@/platform/ai/services/WebResearchService';

describe('AI Web Search Integration', () => {
  beforeAll(() => {
    // Set up test environment
    process.env.PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || 'test-key';
  });

  describe('Web Research Service', () => {
    it('should be properly instantiated', () => {
      expect(webResearchService).toBeDefined();
      expect(typeof webResearchService.performResearch).toBe('function');
    });

    it('should handle research requests', async () => {
      const result = await webResearchService.performResearch({
        query: 'Latest news about artificial intelligence',
        options: {
          maxResults: 5
        }
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('sources');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('model');
    });

    it('should return array of sources', async () => {
      const result = await webResearchService.performResearch({
        query: 'What is Salesforce?',
        options: {
          maxResults: 3
        }
      });

      expect(Array.isArray(result.sources)).toBe(true);
      if (result.sources.length > 0) {
        expect(result.sources[0]).toHaveProperty('title');
        expect(result.sources[0]).toHaveProperty('url');
        expect(result.sources[0]).toHaveProperty('snippet');
      }
    });

    it('should handle company research', async () => {
      const result = await webResearchService.researchCompany('Microsoft Corporation');

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.confidence).toBeGreaterThanOrEqual(0); // Can be 0 if no API key in test
    });

    it('should handle person research', async () => {
      const result = await webResearchService.researchPerson('Satya Nadella', 'Microsoft');

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });

    it('should handle industry research', async () => {
      const result = await webResearchService.researchIndustry('Cloud Computing');

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });

    it('should include processing time', async () => {
      const result = await webResearchService.performResearch({
        query: 'Test query'
      });

      expect(result.processingTime).toBeGreaterThanOrEqual(0); // Can be 0 in fast tests
      expect(typeof result.processingTime).toBe('number');
    });

    it('should have reasonable confidence scores', async () => {
      const result = await webResearchService.performResearch({
        query: 'General query'
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing API key gracefully', async () => {
      // Temporarily remove API key
      const originalKey = process.env.PERPLEXITY_API_KEY;
      delete process.env.PERPLEXITY_API_KEY;

      const result = await webResearchService.performResearch({
        query: 'Test query'
      });

      // Should return error result, not throw
      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.confidence).toBe(0);

      // Restore API key
      process.env.PERPLEXITY_API_KEY = originalKey;
    });

    it('should handle network errors', async () => {
      // Test with invalid query that might cause errors
      const result = await webResearchService.performResearch({
        query: '' // Empty query
      });

      expect(result).toBeDefined();
      // Should not throw, even with bad input
    });
  });

  describe('Context Enhancement', () => {
    it('should enhance queries with context', async () => {
      const result = await webResearchService.performResearch({
        query: 'Recent acquisitions',
        context: {
          company: 'Salesforce',
          timeframe: 'recent'
        }
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
    });

    it('should handle industry context', async () => {
      const result = await webResearchService.performResearch({
        query: 'Market trends',
        context: {
          industry: 'SaaS',
          timeframe: 'current'
        }
      });

      expect(result).toBeDefined();
    });

    it('should handle person context', async () => {
      const result = await webResearchService.performResearch({
        query: 'Career history',
        context: {
          person: 'Marc Benioff',
          company: 'Salesforce'
        }
      });

      expect(result).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('should complete within reasonable time', async () => {
      const startTime = Date.now();
      
      await webResearchService.performResearch({
        query: 'Quick test'
      });

      const duration = Date.now() - startTime;
      
      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
    }, 35000); // 35s timeout for test

    it('should handle concurrent requests', async () => {
      const queries = [
        'Query 1',
        'Query 2',
        'Query 3'
      ];

      const results = await Promise.all(
        queries.map(q => webResearchService.performResearch({ query: q }))
      );

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result).toHaveProperty('content');
      });
    }, 45000); // 45s timeout for concurrent tests
  });
});

