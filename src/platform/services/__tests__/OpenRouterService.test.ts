/**
 * 🧪 OPENROUTER SERVICE TESTS
 * 
 * Unit tests for OpenRouter service functionality including
 * routing logic, failover, and cost optimization.
 */

import { OpenRouterService } from '../OpenRouterService';
import { QueryComplexityAnalyzer } from '../QueryComplexityAnalyzer';
import { ModelCostTracker } from '../ModelCostTracker';

// Mock environment variables
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    OPENROUTER_API_KEY: 'test-key',
    OPENROUTER_SITE_URL: 'https://test.com',
    OPENROUTER_APP_NAME: 'Test App'
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    service = new OpenRouterService();
  });

  describe('Query Complexity Analysis', () => {
    test('should classify simple queries correctly', () => {
      const analyzer = QueryComplexityAnalyzer.getInstance();
      
      const simpleQuery = {
        message: 'What is AI?',
        appType: 'pipeline',
        workspaceId: 'test-workspace',
        userId: 'test-user'
      };

      const analysis = analyzer.analyzeQuery(simpleQuery);
      
      expect(analysis.category).toBe('simple');
      expect(analysis.score).toBeLessThan(30);
      expect(analysis.recommendedModel).toContain('gpt-4o-mini');
    });

    test('should classify complex queries correctly', () => {
      const analyzer = QueryComplexityAnalyzer.getInstance();
      
      const complexQuery = {
        message: 'Analyze the buyer group strategy for enterprise software companies and recommend optimization approaches',
        appType: 'pipeline',
        workspaceId: 'test-workspace',
        userId: 'test-user',
        currentRecord: { name: 'Test Company', industry: 'Software' }
      };

      const analysis = analyzer.analyzeQuery(complexQuery);
      
      expect(analysis.category).toBe('complex');
      expect(analysis.score).toBeGreaterThan(70);
      expect(analysis.recommendedModel).toContain('claude-opus');
    });

    test('should classify research queries correctly', () => {
      const analyzer = QueryComplexityAnalyzer.getInstance();
      
      const researchQuery = {
        message: 'Search for the latest trends in AI-powered sales tools',
        appType: 'pipeline',
        workspaceId: 'test-workspace',
        userId: 'test-user'
      };

      const analysis = analyzer.analyzeQuery(researchQuery);
      
      expect(analysis.category).toBe('research');
      expect(analysis.factors).toContain('research-query');
      expect(analysis.recommendedModel).toContain('perplexity');
    });
  });

  describe('Model Selection', () => {
    test('should select appropriate model chain for simple queries', () => {
      const analyzer = QueryComplexityAnalyzer.getInstance();
      
      const simpleQuery = {
        message: 'Hello',
        appType: 'pipeline',
        workspaceId: 'test-workspace',
        userId: 'test-user'
      };

      const analysis = analyzer.analyzeQuery(simpleQuery);
      const availableModels = service.getAvailableModels();
      
      expect(availableModels.length).toBeGreaterThan(0);
      expect(analysis.recommendedModel).toBeDefined();
    });
  });

  describe('Cost Tracking', () => {
    test('should track costs correctly', () => {
      const tracker = ModelCostTracker.getInstance();
      
      const costId = tracker.recordCost({
        model: 'openai/gpt-4o-mini',
        provider: 'OpenAI',
        inputTokens: 100,
        outputTokens: 50,
        cost: 0.001,
        category: 'simple',
        complexity: 20,
        processingTime: 500,
        userId: 'test-user',
        workspaceId: 'test-workspace',
        appType: 'pipeline',
        success: true,
        fallbackUsed: false
      });

      expect(costId).toBeDefined();
      
      const analytics = tracker.getAnalytics();
      expect(analytics.totalCost).toBe(0.001);
      expect(analytics.totalRequests).toBe(1);
    });

    test('should calculate savings correctly', () => {
      const tracker = ModelCostTracker.getInstance();
      
      // Record a cost with OpenRouter (includes 5% fee)
      tracker.recordCost({
        model: 'anthropic/claude-sonnet-4.5',
        provider: 'Anthropic',
        inputTokens: 1000,
        outputTokens: 500,
        cost: 0.015, // With 5% OpenRouter fee
        category: 'standard',
        complexity: 50,
        processingTime: 1000,
        userId: 'test-user',
        workspaceId: 'test-workspace',
        appType: 'pipeline',
        success: true,
        fallbackUsed: false
      });

      const analytics = tracker.getAnalytics();
      expect(analytics.savings.actualSavings).toBeGreaterThan(0);
    });
  });

  describe('Configuration', () => {
    test('should load configuration correctly', () => {
      const config = service.getAvailableModels();
      expect(config.length).toBeGreaterThan(0);
      
      // Check that we have models for different complexity levels
      const modelIds = config.map(m => m.id);
      expect(modelIds).toContain('claude-haiku-4.0');
      expect(modelIds).toContain('claude-sonnet-4.5');
      expect(modelIds).toContain('claude-opus-4.0');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing API key gracefully', () => {
      process.env.OPENROUTER_API_KEY = '';
      const serviceWithoutKey = new OpenRouterService();
      
      // Should not throw error during initialization
      expect(serviceWithoutKey).toBeDefined();
    });

    test('should provide fallback response when service unavailable', async () => {
      process.env.OPENROUTER_API_KEY = '';
      const serviceWithoutKey = new OpenRouterService();
      
      const request = {
        message: 'Test message',
        appType: 'pipeline',
        workspaceId: 'test-workspace',
        userId: 'test-user'
      };

      const response = await serviceWithoutKey.generateResponse(request);
      
      expect(response.model).toBe('fallback');
      expect(response.response).toContain('technical difficulties');
      expect(response.confidence).toBeLessThan(0.5);
    });
  });
});

describe('Integration Tests', () => {
  test('should handle end-to-end request flow', async () => {
    const service = new OpenRouterService();
    const tracker = ModelCostTracker.getInstance();
    
    const request = {
      message: 'What is the best approach for lead generation?',
      appType: 'pipeline',
      workspaceId: 'test-workspace',
      userId: 'test-user',
      currentRecord: { name: 'Test Company' }
    };

    // This will use fallback since we don't have a real API key in tests
    const response = await service.generateResponse(request);
    
    expect(response).toBeDefined();
    expect(response.response).toBeDefined();
    expect(response.model).toBeDefined();
    expect(response.processingTime).toBeGreaterThan(0);
  });
});

describe('Performance Tests', () => {
  test('should handle multiple concurrent requests', async () => {
    const service = new OpenRouterService();
    
    const requests = Array.from({ length: 5 }, (_, i) => ({
      message: `Test message ${i}`,
      appType: 'pipeline',
      workspaceId: 'test-workspace',
      userId: `test-user-${i}`
    }));

    const startTime = Date.now();
    const responses = await Promise.all(
      requests.map(req => service.generateResponse(req))
    );
    const endTime = Date.now();

    expect(responses).toHaveLength(5);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});
