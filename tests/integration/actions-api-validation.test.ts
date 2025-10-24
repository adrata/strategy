import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '@/app/api/v1/actions/[id]/route';

// Mock Prisma
const mockPrisma = {
  actions: {
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  companies: {
    findUnique: jest.fn(),
  },
  people: {
    findUnique: jest.fn(),
  },
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

// Mock the auth function
jest.mock('@/lib/auth', () => ({
  getV1AuthUser: jest.fn(),
}));

const mockGetV1AuthUser = require('@/lib/auth').getV1AuthUser;

describe('Actions API Validation', () => {
  const mockAuthUser = {
    id: 'user-123',
    workspaceId: 'workspace-123',
  };

  const mockExistingAction = {
    id: 'action-123',
    companyId: 'company-123',
    personId: 'person-123',
    description: 'Original description',
    status: 'PENDING',
    deletedAt: null,
  };

  const mockCompany = {
    id: 'company-123',
    name: 'Test Company',
    deletedAt: null,
  };

  const mockPerson = {
    id: 'person-123',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetV1AuthUser.mockResolvedValue(mockAuthUser);
    mockPrisma.actions.findUnique.mockResolvedValue(mockExistingAction);
    mockPrisma.actions.update.mockResolvedValue({
      ...mockExistingAction,
      description: 'Updated description',
    });
  });

  describe('PATCH /api/v1/actions/[id] - Company Validation', () => {
    it('should validate company when companyId is being changed', async () => {
      const newCompanyId = 'company-456';
      const mockNewCompany = {
        id: newCompanyId,
        name: 'New Company',
        deletedAt: null,
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockNewCompany);
      mockPrisma.actions.update.mockResolvedValue({
        ...mockExistingAction,
        companyId: newCompanyId,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          companyId: newCompanyId,
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.companies.findUnique).toHaveBeenCalledWith({
        where: { id: newCompanyId, deletedAt: null },
      });
    });

    it('should NOT validate company when only description is being updated', async () => {
      mockPrisma.actions.update.mockResolvedValue({
        ...mockExistingAction,
        description: 'Updated description',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.companies.findUnique).not.toHaveBeenCalled();
    });

    it('should NOT validate company when companyId is the same as existing', async () => {
      mockPrisma.actions.update.mockResolvedValue({
        ...mockExistingAction,
        description: 'Updated description',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          companyId: 'company-123', // Same as existing
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.companies.findUnique).not.toHaveBeenCalled();
    });

    it('should return error when companyId is changed to non-existent company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          companyId: 'non-existent-company',
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Company with ID non-existent-company not found or has been deleted');
    });

    it('should return error when companyId is changed to deleted company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue({
        id: 'company-456',
        name: 'Deleted Company',
        deletedAt: new Date(), // Company is deleted
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          companyId: 'company-456',
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Company with ID company-456 not found or has been deleted');
    });
  });

  describe('PATCH /api/v1/actions/[id] - Person Validation', () => {
    it('should validate person when personId is being changed', async () => {
      const newPersonId = 'person-456';
      const mockNewPerson = {
        id: newPersonId,
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        deletedAt: null,
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockNewPerson);
      mockPrisma.actions.update.mockResolvedValue({
        ...mockExistingAction,
        personId: newPersonId,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          personId: newPersonId,
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.people.findUnique).toHaveBeenCalledWith({
        where: { id: newPersonId, deletedAt: null },
      });
    });

    it('should NOT validate person when only description is being updated', async () => {
      mockPrisma.actions.update.mockResolvedValue({
        ...mockExistingAction,
        description: 'Updated description',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.people.findUnique).not.toHaveBeenCalled();
    });

    it('should return error when personId is changed to non-existent person', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          personId: 'non-existent-person',
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Person with ID non-existent-person not found or has been deleted');
    });
  });

  describe('Edge Cases', () => {
    it('should handle action not found', async () => {
      mockPrisma.actions.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/actions/non-existent', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Action not found');
    });

    it('should handle authentication failure', async () => {
      mockGetV1AuthUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.actions.update.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to update action');
    });
  });

  describe('Real-world Scenarios', () => {
    it('should allow updating description of action with invalid company reference', async () => {
      // This is the main fix - action has invalid company reference but we're only updating description
      const actionWithInvalidCompany = {
        ...mockExistingAction,
        companyId: 'invalid-company-id', // Invalid company reference
      };

      mockPrisma.actions.findUnique.mockResolvedValue(actionWithInvalidCompany);
      mockPrisma.actions.update.mockResolvedValue({
        ...actionWithInvalidCompany,
        description: 'Updated description',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.companies.findUnique).not.toHaveBeenCalled();
    });

    it('should validate when trying to change to a valid company', async () => {
      const actionWithInvalidCompany = {
        ...mockExistingAction,
        companyId: 'invalid-company-id',
      };

      const validCompany = {
        id: 'valid-company-id',
        name: 'Valid Company',
        deletedAt: null,
      };

      mockPrisma.actions.findUnique.mockResolvedValue(actionWithInvalidCompany);
      mockPrisma.companies.findUnique.mockResolvedValue(validCompany);
      mockPrisma.actions.update.mockResolvedValue({
        ...actionWithInvalidCompany,
        companyId: 'valid-company-id',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/actions/action-123', {
        method: 'PATCH',
        body: JSON.stringify({
          companyId: 'valid-company-id',
          description: 'Updated description',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'action-123' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockPrisma.companies.findUnique).toHaveBeenCalledWith({
        where: { id: 'valid-company-id', deletedAt: null },
      });
    });
  });
});
