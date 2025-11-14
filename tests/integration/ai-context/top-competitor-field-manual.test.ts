/**
 * Integration Tests for TOP Competitor Field Manual AI Integration
 * 
 * Tests that the AI can understand and query the TOP Competitor Field Manual
 * through the ClaudeAIService integration
 */

import { ClaudeAIService } from '@/platform/services/ClaudeAIService';
import { TOPCompetitorFieldManual } from '@/platform/services/top-competitor-field-manual';

// Mock dependencies
jest.mock('@/platform/database/prisma-client', () => ({
  prisma: {
    users: { findFirst: jest.fn() },
    workspaces: { findFirst: jest.fn() },
    people: { findMany: jest.fn() },
    companies: { findMany: jest.fn() },
    actions: { findMany: jest.fn() }
  }
}));

jest.mock('@/platform/ai/services/EnhancedWorkspaceContextService', () => ({
  EnhancedWorkspaceContextService: {
    buildWorkspaceContext: jest.fn(),
    buildAIContextString: jest.fn()
  }
}));

jest.mock('@/platform/ai/tools/browser-tools', () => ({
  BrowserTools: {
    searchPerson: jest.fn(),
    shouldPerformWebResearch: jest.fn().mockReturnValue(false)
  }
}));

jest.mock('@/platform/services/BrowserAutomationService', () => ({
  browserAutomationService: {
    createSession: jest.fn()
  }
}));

import { prisma } from '@/platform/database/prisma-client';
import { EnhancedWorkspaceContextService } from '@/platform/ai/services/EnhancedWorkspaceContextService';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockEnhancedWorkspaceContextService = EnhancedWorkspaceContextService as jest.Mocked<typeof EnhancedWorkspaceContextService>;

describe('TOP Competitor Field Manual AI Integration', () => {
  let claudeService: ClaudeAIService;

  beforeEach(() => {
    jest.clearAllMocks();
    claudeService = new ClaudeAIService();
    
    // Setup default mocks
    mockPrisma.users.findFirst.mockResolvedValue({
      id: 'test-user-id',
      name: 'Test User',
      email: 'test@adrata.com',
      timezone: 'America/New_York'
    } as any);

    mockPrisma.workspaces.findFirst.mockResolvedValue({
      id: 'test-workspace-id',
      name: 'TOP Engineers Plus'
    } as any);

    mockPrisma.people.findMany.mockResolvedValue([]);
    mockPrisma.companies.findMany.mockResolvedValue([]);
    mockPrisma.actions.findMany.mockResolvedValue([]);

    mockEnhancedWorkspaceContextService.buildWorkspaceContext.mockResolvedValue({
      workspaceId: 'test-workspace-id',
      workspaceName: 'TOP Engineers Plus',
      businessModel: 'EPC Services',
      industry: 'Engineering',
      serviceOfferings: ['Utility Communications', 'EPC'],
      targetIndustries: ['Utilities', 'Energy']
    } as any);

    mockEnhancedWorkspaceContextService.buildAIContextString.mockReturnValue('Mock workspace context');
  });

  describe('buildTOPCompetitorContext', () => {
    it('should include TOP manual for queries about TOP', async () => {
      const request = {
        message: 'What are TOP\'s competitive advantages?',
        workspaceContext: {
          userContext: 'TOP Engineers Plus workspace',
          dataContext: 'EPC services for utilities'
        },
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id'
      };

      const dataContext = {
        workspaceContext: {
          workspaceId: 'test-workspace-id',
          workspaceName: 'TOP Engineers Plus'
        },
        workspaceMetrics: { people: 100, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const systemPrompt = await claudeService['buildEnhancedSystemPrompt'](request, dataContext);
      
      expect(systemPrompt).toBeDefined();
      expect(systemPrompt).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(systemPrompt).toContain('Burns & McDonnell');
      expect(systemPrompt).toContain('Black & Veatch');
      expect(systemPrompt).toContain('Lockard & White');
    });

    it('should include TOP manual for queries about competitors', () => {
      const request = {
        message: 'How do we compete against Burns & McDonnell?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(context).toContain('BURNS & MCDONNELL');
    });

    it('should include TOP manual for queries about competitive positioning', () => {
      const request = {
        message: 'How should we position ourselves in an RFP?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
    });

    it('should include TOP manual for queries about Black & Veatch', () => {
      const request = {
        message: 'What are Black & Veatch\'s weaknesses?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain('BLACK & VEATCH');
      expect(context).toContain('VULNERABILITIES YOU CAN EXPLOIT');
    });

    it('should include TOP manual for queries about Lockard & White', () => {
      const request = {
        message: 'How do we win against Lockard & White?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain('LOCKARD & WHITE');
      expect(context).toContain('CONCLUSION: HOW WE WIN');
    });

    it('should include TOP manual for EPC-related queries', () => {
      const request = {
        message: 'What are the best talk tracks for EPC proposals?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
    });

    it('should include TOP manual for utility communications queries', () => {
      const request = {
        message: 'How do we position for utility communications projects?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
    });

    it('should include specific competitor profile when competitor is mentioned', () => {
      const request = {
        message: 'Tell me about Burns & McDonnell',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain('BURNS & MCDONNELL');
      expect(context).toContain('WHO THEY ARE');
      expect(context).toContain('VULNERABILITIES YOU CAN EXPLOIT');
    });

    it('should not include TOP manual for unrelated queries', () => {
      const request = {
        message: 'What is the weather today?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBe('');
    });

    it('should include TOP manual for TOP workspace even without competitive keywords', () => {
      const request = {
        message: 'Help me with my sales strategy',
        workspaceContext: {
          userContext: 'TOP Engineers Plus workspace',
          dataContext: 'EPC services for utilities',
          applicationContext: 'TOP workspace'
        }
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toBeDefined();
      expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
    });
  });

  describe('System Prompt Integration', () => {
    it('should include TOP manual in system prompt for competitive queries', async () => {
      const dataContext = {
        workspaceContext: {
          workspaceId: 'test-workspace-id',
          workspaceName: 'TOP Engineers Plus',
          businessModel: 'EPC Services'
        },
        workspaceMetrics: { people: 100, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const request = {
        message: 'How do we win against Burns & McDonnell?',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        workspaceContext: {
          userContext: 'TOP Engineers Plus',
          dataContext: 'EPC services'
        }
      };

      const systemPrompt = await claudeService['buildEnhancedSystemPrompt'](request, dataContext);
      
      expect(systemPrompt).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(systemPrompt).toContain('BURNS & MCDONNELL');
      expect(systemPrompt).toContain('VULNERABILITIES YOU CAN EXPLOIT');
      expect(systemPrompt).toContain('DISCOVERY QUESTIONS');
      expect(systemPrompt).toContain('TALK TRACKS / COUNTERS');
    });

    it('should include positioning playbook for general competitive queries', async () => {
      const dataContext = {
        workspaceContext: {
          workspaceId: 'test-workspace-id',
          workspaceName: 'TOP Engineers Plus'
        },
        workspaceMetrics: { people: 100, companies: 50 },
        recentActivities: [],
        personSearchResults: null
      };

      const request = {
        message: 'How should we position TOP?',
        currentRecord: null,
        recordType: null,
        listViewContext: null,
        appType: 'pipeline',
        workspaceId: 'test-workspace-id',
        userId: 'test-user-id',
        workspaceContext: {
          userContext: 'TOP Engineers Plus'
        }
      };

      const systemPrompt = await claudeService['buildEnhancedSystemPrompt'](request, dataContext);
      
      expect(systemPrompt).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
      expect(systemPrompt).toContain('TOP POSITIONING PLAYBOOK');
      expect(systemPrompt).toContain('CORE POSITIONING STATEMENT');
    });
  });

  describe('Query Detection', () => {
    const testCases = [
      { query: 'What are TOP\'s advantages?', shouldInclude: true },
      { query: 'How do we compete against Burns?', shouldInclude: true },
      { query: 'Tell me about Black & Veatch', shouldInclude: true },
      { query: 'Lockard & White weaknesses', shouldInclude: true },
      { query: 'EPC positioning strategy', shouldInclude: true },
      { query: 'Utility communications competitive', shouldInclude: true },
      { query: 'How to position against competitors', shouldInclude: true },
      { query: 'What talk tracks work?', shouldInclude: true },
      { query: 'RFP language for EPC', shouldInclude: true },
      { query: 'What is the weather?', shouldInclude: false },
      { query: 'Help me with my calendar', shouldInclude: false },
      { query: 'Show me my leads', shouldInclude: false }
    ];

    testCases.forEach(({ query, shouldInclude }) => {
      it(`should ${shouldInclude ? 'include' : 'not include'} TOP manual for query: "${query}"`, () => {
        const request = {
          message: query,
          workspaceContext: {}
        };

        const context = claudeService['buildTOPCompetitorContext'](request);
        
        if (shouldInclude) {
          expect(context).toBeDefined();
          expect(context.length).toBeGreaterThan(0);
          expect(context).toContain("TOP'S STRATEGIC COMPETITOR FIELD MANUAL");
        } else {
          expect(context).toBe('');
        }
      });
    });
  });

  describe('Competitor-Specific Content', () => {
    it('should include Burns & McDonnell specific content when mentioned', () => {
      const request = {
        message: 'How do we beat Burns & McDonnell?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toContain('BURNS & MCDONNELL');
      expect(context).toContain('slow mobilization');
      expect(context).toContain('excessive overhead');
      expect(context).toContain('We move as fast as your data does');
    });

    it('should include Black & Veatch specific content when mentioned', () => {
      const request = {
        message: 'What are Black & Veatch\'s vulnerabilities?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toContain('BLACK & VEATCH');
      expect(context).toContain('PLTE orthodoxy');
      expect(context).toContain('We design for the outcome, not the spectrum');
    });

    it('should include Lockard & White specific content when mentioned', () => {
      const request = {
        message: 'How do we compete with Lockard & White?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      expect(context).toContain('LOCKARD & WHITE');
      expect(context).toContain('Limited EPC capacity');
      expect(context).toContain('They plan it. We build it');
    });
  });

  describe('Content Completeness', () => {
    it('should include all key sections in the manual', () => {
      const request = {
        message: 'Tell me about TOP\'s competitive strategy',
        workspaceContext: {
          userContext: 'TOP Engineers Plus'
        }
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      // Check for key sections
      expect(context).toContain('WHO THEY ARE');
      expect(context).toContain('WHAT THEY\'LL SAY');
      expect(context).toContain('VULNERABILITIES YOU CAN EXPLOIT');
      expect(context).toContain('DISCOVERY QUESTIONS');
      expect(context).toContain('TALK TRACKS / COUNTERS');
      expect(context).toContain('PROOF REQUESTS');
      expect(context).toContain('RFP LANGUAGE TRAPS');
      expect(context).toContain('PRICING & TIMELINE WEDGE');
      expect(context).toContain('CONCLUSION: HOW WE WIN');
    });

    it('should include actionable content (questions, talk tracks, etc.)', () => {
      const request = {
        message: 'What questions should I ask about Burns & McDonnell?',
        workspaceContext: {}
      };

      const context = claudeService['buildTOPCompetitorContext'](request);
      
      // Should contain discovery questions
      expect(context).toContain('How quickly do you expect');
      expect(context).toContain('When changes come mid-project');
      
      // Should contain talk tracks
      expect(context).toContain('We deliver the same EPC accountability');
    });
  });
});

