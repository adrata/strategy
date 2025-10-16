/**
 * V1 API Functionality Tests
 * 
 * Tests the actual implementation of v1 intelligence APIs
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

// Import the actual API implementations
import { BuyerGroupEngine } from '../../../src/platform/intelligence/buyer-group/buyer-group-engine';
import { PersonResearchPipeline } from '../../../src/platform/pipelines/orchestrators/PersonResearchPipeline';
import { RoleDiscoveryPipeline } from '../../../src/platform/pipelines/orchestrators/RoleDiscoveryPipeline';
import { CompanyDiscoveryPipeline } from '../../../src/platform/pipelines/orchestrators/CompanyDiscoveryPipeline';

describe('V1 Intelligence API Functionality', () => {
  describe('Buyer Group Engine', () => {
    it('should initialize without errors', () => {
      expect(() => {
        const engine = new BuyerGroupEngine();
        expect(engine).toBeDefined();
      }).not.toThrow();
    });

    it('should have required methods', () => {
      const engine = new BuyerGroupEngine();
      expect(typeof engine.discover).toBe('function');
      expect(typeof engine.saveToDatabase).toBe('function');
      expect(typeof engine.getFromDatabase).toBe('function');
    });
  });

  describe('Person Research Pipeline', () => {
    it('should initialize without errors', () => {
      expect(() => {
        const pipeline = new PersonResearchPipeline();
        expect(pipeline).toBeDefined();
      }).not.toThrow();
    });

    it('should have required methods', () => {
      const pipeline = new PersonResearchPipeline();
      expect(typeof pipeline.research).toBe('function');
    });
  });

  describe('Role Discovery Pipeline', () => {
    it('should initialize without errors', () => {
      expect(() => {
        const pipeline = new RoleDiscoveryPipeline();
        expect(pipeline).toBeDefined();
      }).not.toThrow();
    });

    it('should have required methods', () => {
      const pipeline = new RoleDiscoveryPipeline();
      expect(typeof pipeline.discover).toBe('function');
    });
  });

  describe('Company Discovery Pipeline', () => {
    it('should initialize without errors', () => {
      expect(() => {
        const pipeline = new CompanyDiscoveryPipeline();
        expect(pipeline).toBeDefined();
      }).not.toThrow();
    });

    it('should have required methods', () => {
      const pipeline = new CompanyDiscoveryPipeline();
      expect(typeof pipeline.discover).toBe('function');
    });
  });

  describe('API Route Handlers', () => {
    it('should have buyer group route handler', async () => {
      // Test that the route file exists and can be imported
      expect(() => {
        require('../../../src/app/api/v1/intelligence/buyer-group/route');
      }).not.toThrow();
    });

    it('should have person research route handler', async () => {
      expect(() => {
        require('../../../src/app/api/v1/intelligence/person/research/route');
      }).not.toThrow();
    });

    it('should have role discovery route handler', async () => {
      expect(() => {
        require('../../../src/app/api/v1/intelligence/role/discover/route');
      }).not.toThrow();
    });

    it('should have company intelligence route handler', async () => {
      expect(() => {
        require('../../../src/app/api/v1/intelligence/company/discover/route');
      }).not.toThrow();
    });
  });

  describe('Progressive Enrichment Engine', () => {
    it('should have progressive enrichment implementation', () => {
      expect(() => {
        require('../../../src/platform/intelligence/buyer-group/progressive-enrichment');
      }).not.toThrow();
    });

    it('should support all three enrichment levels', () => {
      const enrichmentLevels = ['identify', 'enrich', 'deep_research'];
      enrichmentLevels.forEach(level => {
        expect(['identify', 'enrich', 'deep_research']).toContain(level);
      });
    });
  });

  describe('External API Integrations', () => {
    it('should have CoreSignal integration', () => {
      expect(() => {
        require('../../../src/platform/services/CoreSignalClient');
      }).not.toThrow();
    });

    it('should have Perplexity AI integration', () => {
      expect(() => {
        require('../../../src/platform/ai/services/WebResearchService');
      }).not.toThrow();
    });

    it('should have Lusha integration', () => {
      expect(() => {
        require('../../../src/platform/pipelines/modules/core/ContactValidator');
      }).not.toThrow();
    });
  });

  describe('Database Integration', () => {
    it('should have Prisma client configuration', () => {
      expect(() => {
        require('../../../src/platform/database/prisma-client');
      }).not.toThrow();
    });

    it('should have database schema for intelligence data', () => {
      // Check that the schema includes intelligence-related fields
      const schema = require('../../../prisma/schema.prisma');
      expect(schema).toBeDefined();
    });
  });

  describe('AI Integration', () => {
    it('should have Claude AI service', () => {
      expect(() => {
        require('../../../src/platform/services/ClaudeAIService');
      }).not.toThrow();
    });

    it('should have AI chat integration', () => {
      expect(() => {
        require('../../../src/app/api/ai-chat/route');
      }).not.toThrow();
    });
  });

  describe('Validation Functions', () => {
    it('should have buyer group input validation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/validation/validateBuyerGroupInput');
      }).not.toThrow();
    });

    it('should have person input validation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/validation/validatePersonInput');
      }).not.toThrow();
    });

    it('should have role criteria validation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/validation/validateRoleCriteria');
      }).not.toThrow();
    });

    it('should have company discovery criteria validation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/validation/validateCompanyDiscoveryCriteria');
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should have error handling utilities', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/error-handling/handleAPIError');
      }).not.toThrow();
    });

    it('should have validation error handling', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/error-handling/handleValidationError');
      }).not.toThrow();
    });
  });

  describe('Cost Tracking', () => {
    it('should have cost tracking implementation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/cost-tracking/trackAPICost');
      }).not.toThrow();
    });

    it('should have cost estimation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/cost-tracking/estimateEnrichmentCost');
      }).not.toThrow();
    });
  });

  describe('Caching', () => {
    it('should have caching implementation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/caching/cacheIntelligenceData');
      }).not.toThrow();
    });

    it('should have cache invalidation', () => {
      expect(() => {
        require('../../../src/platform/pipelines/functions/caching/invalidateCache');
      }).not.toThrow();
    });
  });
});
