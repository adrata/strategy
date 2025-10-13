/**
 * Integration Tests for Atrium Reports API
 * 
 * Tests the Atrium API routes for report management
 */

import { 
  createTestPersonWithCoreSignal,
  createTestCompanyWithDetails,
  createTestDeepValueReport,
  createTestAtriumDocument,
  TEST_USER,
  getTestAuthHeaders,
  getTestApiUrl,
  validateApiResponse
} from '../../utils/test-factories';

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

import { prisma } from '@/lib/prisma';

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Atrium Reports API Integration Tests', () => {
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

  describe('POST /api/atrium/reports', () => {
    it('should create a new report', async () => {
      const person = createTestPersonWithCoreSignal();
      const company = createTestCompanyWithDetails();
      
      const mockAtriumDoc = createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: 'executive_summary',
          recordType: 'people',
          recordId: person.id,
          recordName: person.fullName
        }
      });

      mockPrisma.atriumDocument.create.mockResolvedValue(mockAtriumDoc);

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
      expect(result.data).toHaveProperty('atriumDocumentId');

      // Verify database operation
      expect(mockPrisma.atriumDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.stringContaining('Executive Summary'),
          type: 'PAPER',
          workspaceId: TEST_USER.workspaceId,
          createdById: TEST_USER.id,
          metadata: expect.objectContaining({
            reportType: 'executive_summary',
            recordType: 'people',
            recordId: person.id
          })
        })
      });
    });

    it('should handle validation errors', async () => {
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
    });

    it('should handle database errors', async () => {
      const person = createTestPersonWithCoreSignal();
      
      mockPrisma.atriumDocument.create.mockRejectedValue(new Error('Database error'));

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
    });
  });

  describe('GET /api/atrium/reports', () => {
    it('should list all reports', async () => {
      const reports = [
        createTestDeepValueReport('executive_summary'),
        createTestDeepValueReport('competitive_analysis')
      ];

      const atriumDocs = reports.map(report => createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      }));

      mockPrisma.atriumDocument.findMany.mockResolvedValue(atriumDocs);

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(2);
    });

    it('should filter reports by type', async () => {
      const executiveReports = [
        createTestDeepValueReport('executive_summary')
      ];

      const atriumDocs = executiveReports.map(report => createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      }));

      mockPrisma.atriumDocument.findMany.mockResolvedValue(atriumDocs);

      const response = await fetch(getTestApiUrl('/atrium/reports?type=executive_summary'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].type).toBe('executive_summary');
    });

    it('should filter reports by record type', async () => {
      const peopleReports = [
        createTestDeepValueReport('executive_summary', {
          recordType: 'people'
        })
      ];

      const atriumDocs = peopleReports.map(report => createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      }));

      mockPrisma.atriumDocument.findMany.mockResolvedValue(atriumDocs);

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

    it('should handle empty results', async () => {
      mockPrisma.atriumDocument.findMany.mockResolvedValue([]);

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('GET /api/atrium/reports/[id]', () => {
    it('should retrieve specific report', async () => {
      const report = createTestDeepValueReport('executive_summary');
      const atriumDoc = createTestAtriumDocument('PAPER', {
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

  describe('PUT /api/atrium/reports/[id]', () => {
    it('should update existing report', async () => {
      const report = createTestDeepValueReport('executive_summary');
      const updatedContent = '# Executive Summary\n\nUpdated content';
      
      const updatedAtriumDoc = createTestAtriumDocument('PAPER', {
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

    it('should handle update validation errors', async () => {
      const report = createTestDeepValueReport('executive_summary');

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'PUT',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({
          // Invalid data
          type: 'invalid_type'
        })
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(result, 400);
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
    });
  });

  describe('DELETE /api/atrium/reports/[id]', () => {
    it('should delete report', async () => {
      const report = createTestDeepValueReport('executive_summary');
      
      mockPrisma.atriumDocument.delete.mockResolvedValue({} as any);

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'DELETE',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      expect(result.message).toContain('deleted');

      // Verify database operation
      expect(mockPrisma.atriumDocument.delete).toHaveBeenCalledWith({
        where: { id: report.id }
      });
    });

    it('should handle delete errors', async () => {
      const report = createTestDeepValueReport('executive_summary');
      
      mockPrisma.atriumDocument.delete.mockRejectedValue(new Error('Delete failed'));

      const response = await fetch(getTestApiUrl(`/atrium/reports/${report.id}`), {
        method: 'DELETE',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'GET', url: '/atrium/reports' },
        { method: 'POST', url: '/atrium/reports' },
        { method: 'GET', url: '/atrium/reports/test-id' },
        { method: 'PUT', url: '/atrium/reports/test-id' },
        { method: 'DELETE', url: '/atrium/reports/test-id' }
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(getTestApiUrl(endpoint.url), {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json'
            // No auth headers
          },
          body: endpoint.method === 'POST' || endpoint.method === 'PUT' 
            ? JSON.stringify({}) 
            : undefined
        });

        expect(response.status).toBe(401);
      }
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
    });
  });

  describe('Pagination and Sorting', () => {
    it('should support pagination', async () => {
      const reports = Array.from({ length: 25 }, (_, i) => 
        createTestDeepValueReport('executive_summary', {
          id: `report_${i}`
        })
      );

      const atriumDocs = reports.map(report => createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      }));

      mockPrisma.atriumDocument.findMany.mockResolvedValue(atriumDocs.slice(0, 10));

      const response = await fetch(getTestApiUrl('/atrium/reports?page=1&limit=10'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);
      validateApiResponse.pagination(result);
      expect(result.data).toHaveLength(10);
      expect(result.meta.pagination.page).toBe(1);
      expect(result.meta.pagination.limit).toBe(10);
    });

    it('should support sorting', async () => {
      const reports = [
        createTestDeepValueReport('executive_summary'),
        createTestDeepValueReport('competitive_analysis')
      ];

      const atriumDocs = reports.map(report => createTestAtriumDocument('PAPER', {
        metadata: {
          reportType: report.type,
          recordType: report.recordType,
          recordId: report.recordId,
          recordName: report.recordName
        }
      }));

      mockPrisma.atriumDocument.findMany.mockResolvedValue(atriumDocs);

      const response = await fetch(getTestApiUrl('/atrium/reports?sortBy=createdAt&sortOrder=desc'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(result);

      // Verify database query includes sorting
      expect(mockPrisma.atriumDocument.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: expect.objectContaining({
            createdAt: 'desc'
          })
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: 'invalid json'
      });

      const result = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(result, 400);
    });

    it('should handle database connection errors', async () => {
      mockPrisma.atriumDocument.findMany.mockRejectedValue(new Error('Connection timeout'));

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
    });

    it('should handle unexpected errors gracefully', async () => {
      mockPrisma.atriumDocument.findMany.mockRejectedValue(new Error('Unexpected error'));

      const response = await fetch(getTestApiUrl('/atrium/reports'), {
        method: 'GET',
        headers: getTestAuthHeaders()
      });

      const result = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(result, 500);
      expect(result.error).toContain('Unexpected error');
    });
  });
});
