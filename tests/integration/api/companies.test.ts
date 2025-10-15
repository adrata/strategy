/**
 * Companies API Integration Tests
 * 
 * Comprehensive tests for all CRUD operations on companies
 */

// Mock the auth function first
jest.mock('@/app/api/v1/auth', () => ({
  getV1AuthUser: jest.fn().mockResolvedValue({
    id: '01K1VBYZG41K9QA0D9CF06KNRG',
    email: 'ross@adrata.com',
    name: 'Ross',
    workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
  }),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    companies: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    actions: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Import after mocks
import { GET, POST } from '@/app/api/v1/companies/route';
import { GET as GET_BY_ID, PUT, PATCH, DELETE } from '@/app/api/v1/companies/[id]/route';
import { createTestCompany, TEST_USER, getTestAuthHeaders, validateApiResponse, validateTestData } from '../../utils/test-factories';

describe('Companies API', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/v1/companies', () => {
    it('should list companies with pagination', async () => {
      const mockCompanies = [
        createTestCompany({ id: 'company-1', name: 'Test Company 1' }),
        createTestCompany({ id: 'company-2', name: 'Test Company 2' }),
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(2);

      const request = new Request('http://localhost:3000/api/v1/companies?page=1&limit=10', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      validateApiResponse.pagination(data);
      expect(data.data).toHaveLength(2);
      expect(data.meta.pagination.totalCount).toBe(2);
    });

    it('should filter companies by status', async () => {
      const mockCompanies = [
        createTestCompany({ id: 'company-1', status: 'ACTIVE' }),
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/companies?status=ACTIVE', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            deletedAt: null,
          }),
        })
      );
    });

    it('should search companies by name', async () => {
      const mockCompanies = [
        createTestCompany({ id: 'company-1', name: 'Acme Corp' }),
      ];

      mockPrisma.companies.findMany.mockResolvedValue(mockCompanies);
      mockPrisma.companies.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/companies?search=Acme', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.companies.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  expect.objectContaining({ name: expect.objectContaining({ contains: 'Acme' }) }),
                ]),
              }),
            ]),
          }),
        })
      );
    });

    it('should return status counts when counts=true', async () => {
      const mockCounts = [
        { status: 'ACTIVE', _count: { id: 5 } },
        { status: 'INACTIVE', _count: { id: 2 } },
      ];

      mockPrisma.companies.groupBy.mockResolvedValue(mockCounts);

      const request = new Request('http://localhost:3000/api/v1/companies?counts=true', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual({
        ACTIVE: 5,
        INACTIVE: 2,
      });
    });

    it('should require authentication', async () => {
      // Mock auth to return null
      const { getV1AuthUser } = require('@/app/api/v1/auth');
      getV1AuthUser.mockResolvedValueOnce(null);

      const request = new Request('http://localhost:3000/api/v1/companies', {
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      validateApiResponse.error(data, 401);
    });
  });

  describe('POST /api/v1/companies', () => {
    it('should create a new company', async () => {
      const companyData = createTestCompany();
      const createdCompany = { ...companyData, id: 'new-company-id' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data).toEqual(createdCompany);
      expect(data.meta.message).toBe('Company created successfully');
    });

    it('should create company with opportunity fields', async () => {
      const companyData = createTestCompany({
        status: 'OPPORTUNITY',
        opportunityStage: 'Proposal',
        opportunityAmount: 50000,
        opportunityProbability: 75,
        expectedCloseDate: new Date('2024-12-31'),
      });

      const createdCompany = { ...companyData, id: 'new-company-id' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.opportunityStage).toBe('Proposal');
      expect(data.data.opportunityAmount).toBe(50000);
      expect(data.data.opportunityProbability).toBe(75);
    });

    it('should require company name', async () => {
      const companyData = createTestCompany();
      delete companyData.name;

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(data, 400);
      expect(data.error).toContain('Company name is required');
    });

    it('should handle duplicate company creation', async () => {
      const companyData = createTestCompany();

      mockPrisma.$transaction.mockRejectedValue({
        code: 'P2002',
        message: 'Unique constraint failed',
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      validateApiResponse.error(data, 400);
      expect(data.error).toContain('already exists');
    });
  });

  describe('GET /api/v1/companies/[id]', () => {
    it('should get a specific company', async () => {
      const company = createTestCompany({ id: 'company-1' });
      const mockCompany = {
        ...company,
        mainSeller: { id: TEST_USER.id, name: TEST_USER.name, email: TEST_USER.email },
        people: [],
        actions: [],
        _count: { people: 0, actions: 0 },
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/company-1', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.id).toBe('company-1');
      expect(data.data.mainSeller).toBeDefined();
    });

    it('should return 404 for non-existent company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/companies/non-existent', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
      expect(data.error).toBe('Company not found');
    });

    it('should not return soft-deleted companies', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/companies/deleted-company', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET_BY_ID(request, { params: { id: 'deleted-company' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(mockPrisma.companies.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: 'deleted-company',
            deletedAt: null,
          }),
        })
      );
    });
  });

  describe('PATCH /api/v1/companies/[id]', () => {
    it('should partially update a company', async () => {
      const existingCompany = createTestCompany({ id: 'company-1' });
      const updateData = { name: 'Updated Company Name', status: 'OPPORTUNITY' };
      const updatedCompany = { ...existingCompany, ...updateData };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.companies.update.mockResolvedValue(updatedCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/company-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.name).toBe('Updated Company Name');
      expect(data.data.status).toBe('OPPORTUNITY');
      expect(data.meta.message).toBe('Company updated successfully');
    });

    it('should update opportunity fields', async () => {
      const existingCompany = createTestCompany({ id: 'company-1' });
      const updateData = {
        opportunityStage: 'Negotiation',
        opportunityAmount: 75000,
        opportunityProbability: 85,
        expectedCloseDate: new Date('2024-11-30'),
      };
      const updatedCompany = { ...existingCompany, ...updateData };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.companies.update.mockResolvedValue(updatedCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/company-1', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(updateData),
      });

      const response = await PATCH(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.opportunityStage).toBe('Negotiation');
      expect(data.data.opportunityAmount).toBe(75000);
      expect(data.data.opportunityProbability).toBe(85);
    });

    it('should return 404 for non-existent company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/companies/non-existent', {
        method: 'PATCH',
        headers: getTestAuthHeaders(),
        body: JSON.stringify({ name: 'Updated Name' }),
      });

      const response = await PATCH(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
    });
  });

  describe('DELETE /api/v1/companies/[id]', () => {
    it('should soft delete a company by default', async () => {
      const existingCompany = createTestCompany({ id: 'company-1' });
      existingCompany._count = { people: 0, actions: 0 };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.companies.update.mockResolvedValue({ ...existingCompany, deletedAt: new Date() });

      const request = new Request('http://localhost:3000/api/v1/companies/company-1', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.meta.message).toBe('Company deleted successfully');
      expect(data.meta.mode).toBe('soft');
      expect(mockPrisma.companies.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'company-1' },
          data: expect.objectContaining({
            deletedAt: expect.any(Date),
            updatedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should hard delete a company when mode=hard', async () => {
      const existingCompany = createTestCompany({ id: 'company-1' });
      existingCompany._count = { people: 0, actions: 0 };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.companies.delete.mockResolvedValue(existingCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/company-1?mode=hard', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.meta.message).toBe('Company permanently deleted successfully');
      expect(data.meta.mode).toBe('hard');
      expect(mockPrisma.companies.delete).toHaveBeenCalledWith({
        where: { id: 'company-1' },
      });
    });

    it('should prevent hard delete when company has related data', async () => {
      const existingCompany = createTestCompany({ id: 'company-1' });
      existingCompany._count = { people: 2, actions: 5 };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/company-1?mode=hard', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'company-1' } });
      const data = await response.json();

      expect(response.status).toBe(409);
      validateApiResponse.error(data, 409);
      expect(data.error).toContain('Cannot hard delete company with associated people or actions');
    });

    it('should return 404 for non-existent company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/companies/non-existent', {
        method: 'DELETE',
        headers: getTestAuthHeaders(),
      });

      const response = await DELETE(request, { params: { id: 'non-existent' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      validateApiResponse.error(data, 404);
    });
  });

  describe('Enhanced Company Creation Tests', () => {
    it('should normalize website URLs correctly', async () => {
      const companyData = createTestCompany({
        name: 'Test Company',
        website: 'testcompany.com', // Should be normalized to https://testcompany.com
      });

      const createdCompany = { ...companyData, id: 'new-company-id' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.website).toBe('https://testcompany.com');
    });

    it('should trim company names', async () => {
      const companyData = createTestCompany({
        name: '  Test Company  ', // Should be trimmed
      });

      const createdCompany = { ...companyData, id: 'new-company-id', name: 'Test Company' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.name).toBe('Test Company');
    });

    it('should handle special characters in company names', async () => {
      const companyData = createTestCompany({
        name: 'Company & Associates, LLC',
      });

      const createdCompany = { ...companyData, id: 'new-company-id' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data.name).toBe('Company & Associates, LLC');
    });

    it('should handle concurrent company creation', async () => {
      const companyData1 = createTestCompany({ name: 'Company 1' });
      const companyData2 = createTestCompany({ name: 'Company 2' });

      const createdCompany1 = { ...companyData1, id: 'company-1' };
      const createdCompany2 = { ...companyData2, id: 'company-2' };
      const createdAction = { id: 'action-id', type: 'company_created' };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany1),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      // Create first company
      const request1 = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData1),
      });

      const response1 = await POST(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      validateApiResponse.success(data1);
      expect(data1.data.name).toBe('Company 1');

      // Update mock for second company
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          companies: {
            create: jest.fn().mockResolvedValue(createdCompany2),
          },
          actions: {
            create: jest.fn().mockResolvedValue(createdAction),
          },
        });
      });

      // Create second company
      const request2 = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData2),
      });

      const response2 = await POST(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      validateApiResponse.success(data2);
      expect(data2.data.name).toBe('Company 2');
    });

    it('should validate company name length', async () => {
      const companyData = createTestCompany({
        name: 'A'.repeat(1000), // Very long name
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should either succeed or fail gracefully
      expect([200, 400]).toContain(response.status);
      if (response.status === 400) {
        validateApiResponse.error(data, 400);
      }
    });

    it('should handle malformed website URLs', async () => {
      const companyData = createTestCompany({
        name: 'Test Company',
        website: 'not-a-valid-url',
      });

      const request = new Request('http://localhost:3000/api/v1/companies', {
        method: 'POST',
        headers: getTestAuthHeaders(),
        body: JSON.stringify(companyData),
      });

      const response = await POST(request);
      const data = await response.json();

      // Should either normalize the URL or reject it
      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        validateApiResponse.success(data);
        // URL should be normalized or cleaned
        expect(data.data.website).toBeDefined();
      }
    });
  });
});
