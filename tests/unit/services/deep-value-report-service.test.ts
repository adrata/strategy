/**
 * Unit Tests for Deep Value Report Service
 * 
 * Tests the core functionality of the deep value report generation service
 */

import { deepValueReportService } from '@/platform/services/deep-value-report-service';
import { 
  createTestPersonWithCoreSignal,
  createTestCompanyWithDetails,
  createTestDeepValueReport,
  createTestAtriumDocument,
  TEST_USER,
  validateTestData
} from '../../utils/test-factories';

// Mock the AI service
jest.mock('@/platform/ai/services/openaiService', () => ({
  openaiService: {
    generateContent: jest.fn(),
  },
}));

// Mock authFetch
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

import { openaiService } from '@/platform/ai/services/openaiService';
import { authFetch } from '@/platform/api-fetch';

const mockGenerateContent = openaiService.generateContent as jest.MockedFunction<typeof openaiService.generateContent>;
const mockAuthFetch = authFetch as jest.MockedFunction<typeof authFetch>;

describe('Deep Value Report Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Instantiation', () => {
    it('should create service instance', () => {
      expect(deepValueReportService).toBeDefined();
      expect(deepValueReportService).toBeInstanceOf(Object);
    });

    it('should have required methods', () => {
      expect(deepValueReportService.generateAllReports).toBeDefined();
      expect(deepValueReportService.streamReportGeneration).toBeDefined();
      expect(deepValueReportService.updateReportWithAI).toBeDefined();
      expect(deepValueReportService.saveReportToAtrium).toBeDefined();
    });
  });

  describe('generateAllReports', () => {
    it('should generate all report types for a person', async () => {
      const person = createTestPersonWithCoreSignal();
      
      // Mock AI responses
      mockGenerateContent.mockResolvedValue({
        success: true,
        data: {
          content: '# Test Report\n\nThis is a test report content.'
        }
      });

      // Mock authFetch for Atrium document creation
      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            id: 'atrium-doc-123',
            title: 'Test Report',
            type: 'PAPER',
            content: '# Test Report\n\nThis is a test report content.'
          }
        })
      } as Response);

      const reports = await deepValueReportService.generateAllReports(
        person,
        'people',
        TEST_USER.workspaceId,
        TEST_USER.id
      );

      expect(reports).toBeDefined();
      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThan(0);
    });
  });

  describe('saveReportToAtrium', () => {
    it('should save report to Atrium successfully', async () => {
      const report = createTestDeepValueReport('executive_summary');

      mockAuthFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          documentId: 'atrium-doc-123',
          data: {
            id: 'atrium-doc-123',
            title: report.title,
            type: 'PAPER',
            content: report.content
          }
        })
      } as Response);

      const result = await deepValueReportService.saveReportToAtrium(report, report.content);

      expect(result).toBe('atrium-doc-123');
      expect(mockAuthFetch).toHaveBeenCalledWith(
        '/api/atrium/reports',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining(report.title)
        })
      );
    });

    it('should handle Atrium save errors', async () => {
      const report = createTestDeepValueReport('executive_summary');

      mockAuthFetch.mockRejectedValue(new Error('Atrium service unavailable'));

      await expect(
        deepValueReportService.saveReportToAtrium(report, report.content)
      ).rejects.toThrow('Atrium service unavailable');
    });
  });

  describe('Report Type Validation', () => {
    it('should validate all report types', () => {
      const validTypes = [
        'executive_summary',
        'competitive_analysis',
        'value_proposition',
        'engagement_strategy',
        'risk_assessment'
      ];

      validTypes.forEach(type => {
        const report = createTestDeepValueReport(type as any);
        validateTestData.report(report);
        expect(report.type).toBe(type);
      });
    });
  });
});
