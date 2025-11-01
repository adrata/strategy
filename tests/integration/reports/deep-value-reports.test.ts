/**
 * Integration Tests for Deep Value Reports
 * 
 * Tests the complete report generation flow including API routes and database operations
 */

import { 
  createTestPersonWithCoreSignal,
  createTestCompanyWithDetails,
  createTestDeepValueReport,
  createTestWorkshopDocument,
  TEST_USER,
  getTestAuthHeaders,
  getTestApiUrl,
  validateApiResponse
} from '../../utils/test-factories';

// Mock the AI service
jest.mock('@/platform/ai/ai-service', () => ({
  generateStreamingResponse: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    atriumDocument: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    workspace: {
      findUnique: jest.fn(),
    },
  },
}));

import { generateStreamingResponse } from '@/platform/ai/ai-service';
import { prisma } from '@/lib/prisma';

const mockGenerateStreamingResponse = generateStreamingResponse as jest.MockedFunction<typeof generateStreamingResponse>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Deep Value Reports Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock user and workspace
    mockPrisma.user.findUnique.mockResolvedValue({
      id: TEST_USER.id,
      email: TEST_USER.email,
      name: TEST_USER.name,
      workspaces: [{
        id: TEST_USER.workspaceId,
        name: 'Test Workspace'
      }]
    } as any);

    mockPrisma.workspace.findUnique.mockResolvedValue({
      id: TEST_USER.workspaceId,
      name: 'Test Workspace'
    } as any);
  });

  describe('Report Generation Flow', () => {
    it('should generate and save a complete report', async () => {
      const person = createTestPersonWithCoreSignal();
      const company = createTestCompanyWithDetails();
      
      // Mock AI response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\n' };
          yield { content: 'This is a comprehensive executive summary.\n\n' };
          yield { content: '## Key Insights\n- Insight 1\n- Insight 2\n' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);

      // Mock Atrium document creation
      const mockAtriumDoc = createTestWorkshopDocument('PAPER', {
        metadata: {
          reportType: 'executive_summary',
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName
        }
      });

      mockPrisma.atriumDocument.create.mockResolvedValue(mockAtriumDoc);

      // Test the complete flow
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName,
          companyData: company
        })
      });

      const result = await response.json();

      expect(response.status).toBe(201);
      validateApiResponse.success(result);
      
      expect(result.data).toHaveProperty('id');
      expect(result.data).toHaveProperty('type', 'executive_summary');
      expect(result.data).toHaveProperty('content');
      expect(result.data).toHaveProperty('atriumDocumentId');

      // Verify database operations
      expect(mockPrisma.atriumDocument.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: expect.stringContaining('Executive Summary'),
            content: expect.stringContaining('# Executive Summary'),
            type: 'PAPER',
            metadata: expect.objectContaining({
              reportType: 'executive_summary',
              recordType: 'people',
              recordId: person.id
            })
          })
        })
      );
    });

    it('should handle report generation for company records', async () => {
      const company = createTestCompanyWithDetails();
      
      // Mock AI response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\n' };
          yield { content: 'Company executive summary content.\n\n' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);

      // Mock Atrium document creation
      const mockAtriumDoc = createTestWorkshopDocument('PAPER', {
        metadata: {
          reportType: 'executive_summary',
          recordType: 'companies',
          recordId: company.id,
          recordName: company.name
        }
      });

      mockPrisma.atriumDocument.create.mockResolvedValue(mockAtriumDoc);

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'companies',
          recordId: company.id,
          recordName: company.name,
          companyData: company
        })
      });

      const result = await response.json();

      expect(response.status).toBe(201);
      validateApiResponse.success(result);
      
      expect(result.data.recordType).toBe('companies');
      expect(result.data.recordId).toBe(company.id);
    });

    it('should handle AI generation errors gracefully', async () => {
      const person = createTestPersonWithCoreSignal();
      
      // Mock AI error
      mockGenerateStreamingResponse.mockRejectedValue(new Error('AI service unavailable'));

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName
        })
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
      expect(result.error).toContain('AI service unavailable');
    });

    it('should handle database errors gracefully', async () => {
      const person = createTestPersonWithCoreSignal();
      
      // Mock AI response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\nTest content' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);

      // Mock database error
      mockPrisma.atriumDocument.create.mockRejectedValue(new Error('Database connection failed'));

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName
        })
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
      expect(result.error).toContain('Database connection failed');
    });
  });

  describe('Report Retrieval', () => {
    it('should retrieve existing reports', async () => {
      const person = createTestPersonWithCoreSignal();
      const existingReports = [
        createTestDeepValueReport('executive_summary', {
          recordId: person.id,
          recordName: person.fullName,
          status: 'completed'
        }),
        createTestDeepValueReport('competitive_analysis', {
          recordId: person.id,
          recordName: person.fullName,
          status: 'completed'
        })
      ];

      mockPrisma.atriumDocument.findMany.mockResolvedValue(
        existingReports.map(report => createTestWorkshopDocument('PAPER', {
          metadata: {
            reportType: report.type,
            recordType: report.recordType,
            recordId: report.recordId,
            recordName: report.recordName
          }
        }))
      );

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(2);
      expect(result.data[0]).toHaveProperty('type', 'executive_summary');
      expect(result.data[1]).toHaveProperty('type', 'competitive_analysis');
    });

    it('should retrieve specific report by ID', async () => {
      const report = createTestDeepValueReport('executive_summary');
      const atriumDoc = createTestWorkshopDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      });

      mockPrisma.atriumDocument.findUnique.mockResolvedValue(atriumDoc);

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveProperty('id', report.id);
      expect(result.data).toHaveProperty('type', 'executive_summary');
    });

    it('should handle report not found', async () => {
      mockPrisma.atriumDocument.findUnique.mockResolvedValue(null);

      const response = await fetch(getTestApiUrl('/atrium/reports/nonexistent-id'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(result, 404);
      expect(result.error).toContain('Report not found');
    });
  });

  describe('Report Updates', () => {
    it('should update existing report', async () => {
      const report = createTestDeepValueReport('executive_summary');
      const updatedContent = '# Executive Summary\n\nUpdated content';
      
      const updatedAtriumDoc = createTestWorkshopDocument('PAPER', {
        content: updatedContent,
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      });

      mockPrisma.atriumDocument.update.mockResolvedValue(updatedAtriumDoc);

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'PUT',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          content: updatedContent
        })
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data.content).toBe(updatedContent);

      // Verify database update
      expect(mockPrisma.atriumDocument.update).toHaveBeenCalledWith({
        where: { id: report.id },
        data: expect.objectContaining({
          content: updatedContent,
          updatedAt: expect.any(Date)
        })
      });
    });

    it('should handle update errors', async () => {
      const report = createTestDeepValueReport('executive_summary');
      
      mockPrisma.atriumDocument.update.mockRejectedValue(new Error('Update failed'));

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'PUT',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          content: 'Updated content'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
      expect(result.error).toContain('Update failed');
    });
  });

  describe('AI-Powered Editing', () => {
    it('should edit report with AI', async () => {
      const report = createTestDeepValueReport('executive_summary');
      const editInstruction = 'Make this more concise';
      
      // Mock AI response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { content: '# Executive Summary\n\n' };
          yield { content: 'Concise version of the report.\n\n' };
        }
      };

      mockGenerateStreamingResponse.mockResolvedValue(mockStream);

      const updatedAtriumDoc = createTestWorkshopDocument('PAPER', {
        content: 'Concise version of the report.',
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      });

      mockPrisma.atriumDocument.update.mockResolvedValue(updatedAtriumDoc);

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}/edit`), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          instruction: editInstruction
        })
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data.content).toContain('Concise version');

      // Verify AI service was called
      expect(mockGenerateStreamingResponse).toHaveBeenCalledWith(
        expect.stringContaining(editInstruction),
        expect.objectContaining({
          model: 'gpt-4o',
          temperature: 0.7,
          maxTokens: 4000
        })
      );
    });

    it('should handle AI edit errors', async () => {
      const report = createTestDeepValueReport('executive_summary');
      
      mockGenerateStreamingResponse.mockRejectedValue(new Error('AI service unavailable'));

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}/edit`), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          instruction: 'Make this more concise'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
      expect(result.error).toContain('AI service unavailable');
    });
  });

  describe('Report Filtering and Search', () => {
    it('should filter reports by type', async () => {
      const person = createTestPersonWithCoreSignal();
      const executiveReports = [
        createTestDeepValueReport('executive_summary', {
          recordId: person.id,
          recordName: person.fullName
        })
      ];

      mockPrisma.atriumDocument.findMany.mockResolvedValue(
        executiveReports.map(report => createTestWorkshopDocument('PAPER', {
          metadata: {
            reportType: report.type,
            recordType: report.recordType,
            recordId: report.recordId,
            recordName: report.recordName
          }
        }))
      );

      const response = await fetch(getTestApiUrl('/atrium/reports?type=executive_summary'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('executive_summary');

      // Verify database query
      expect(mockPrisma.atriumDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            metadata: expect.objectContaining({
              path: ['reportType'],
              equals: 'executive_summary'
            })
          })
        })
      );
    });

    it('should filter reports by record type', async () => {
      const person = createTestPersonWithCoreSignal();
      const peopleReports = [
        createTestDeepValueReport('executive_summary', {
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName
        })
      ];

      mockPrisma.atriumDocument.findMany.mockResolvedValue(
        peopleReports.map(report => createTestWorkshopDocument('PAPER', {
          metadata: {
            reportType: report.type,
            recordType: report.recordType,
            recordId: report.recordId,
            recordName: report.recordName
          }
        }))
      );

      const response = await fetch(getTestApiUrl('/atrium/reports?recordType=people'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].recordType).toBe('people');
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication', async () => {
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // No auth headers
        },
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'people',
          recordId: 'test-id',
          recordName: 'Test Person'
        })
      });

      expect(response.status).toBe(401);
    });

    it('should validate workspace access', async () => {
      // Mock user without workspace access
      mockPrisma.user.findUnique.mockResolvedValue({
        id: TEST_USER.id,
        email: TEST_USER.email,
        workspaces: [] // No workspaces
      } as any);

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(403);
      validateApiResponse.error(result, 403);
      expect(result.error).toContain('Access denied');
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields', async () => {
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          // Missing required fields
        })
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(result, 400);
      expect(result.error).toContain('validation');
    });

    it('should validate report type', async () => {
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'invalid_type',
          recordType: 'people',
          recordId: 'test-id',
          recordName: 'Test Person'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(result, 400);
      expect(result.error).toContain('Invalid report type');
    });

    it('should validate record type', async () => {
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          type: 'executive_summary',
          recordType: 'invalid_record_type',
          recordId: 'test-id',
          recordName: 'Test Person'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(result, 400);
      expect(result.error).toContain('Invalid record type');
    });
  });
});
