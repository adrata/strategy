import { NextRequest } from 'next/server';
import { GET, PATCH } from '@/app/api/v1/people/[id]/route';

// Mock the required modules
jest.mock('@/platform/api-fetch', () => ({
  authFetch: jest.fn(),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    people: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    companies: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('@/platform/api/auth/secure-api-context', () => ({
  getSecureApiContext: jest.fn(),
}));

describe('Company Association API Integration', () => {
  const mockPrisma = require('@/lib/prisma').prisma;
  const mockGetSecureApiContext = require('@/platform/api/auth/secure-api-context').getSecureApiContext;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful authentication
    mockGetSecureApiContext.mockResolvedValue({
      context: {
        userId: 'test-user-id',
        workspaceId: 'test-workspace-id',
        userEmail: 'test@example.com',
      },
      response: null,
    });
  });

  describe('PATCH /api/v1/people/[id] - Company Association', () => {
    const mockPerson = {
      id: 'person-1',
      fullName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      companyId: null,
      company: null,
      workspaceId: 'test-workspace-id',
    };

    const mockCompany = {
      id: 'company-1',
      name: 'Test Company',
      workspaceId: 'test-workspace-id',
    };

    it('should successfully associate a person with a company', async () => {
      // Mock existing person
      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);
      
      // Mock company exists
      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);
      
      // Mock successful update
      mockPrisma.people.update.mockResolvedValue({
        ...mockPerson,
        companyId: 'company-1',
        company: 'Test Company',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'company-1',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe('company-1');
      expect(data.data.company).toBe('Test Company');

      // Verify prisma update was called with correct data
      expect(mockPrisma.people.update).toHaveBeenCalledWith({
        where: { id: 'person-1' },
        data: {
          companyId: 'company-1',
          company: 'Test Company',
        },
        include: expect.any(Object),
      });
    });

    it('should handle company association with company name only', async () => {
      // Mock existing person
      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);
      
      // Mock company exists
      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);
      
      // Mock successful update
      mockPrisma.people.update.mockResolvedValue({
        ...mockPerson,
        companyId: 'company-1',
        company: 'Test Company',
      });

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe('company-1');
      expect(data.data.company).toBe('Test Company');
    });

    it('should return 404 if person not found', async () => {
      // Mock person not found
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/people/nonexistent-person', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'company-1',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'nonexistent-person' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Person not found');
    });

    it('should return 400 for invalid company ID', async () => {
      // Mock existing person
      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);
      
      // Mock company not found
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'nonexistent-company',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Company not found');
    });

    it('should handle database errors gracefully', async () => {
      // Mock existing person
      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);
      
      // Mock company exists
      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);
      
      // Mock database error
      mockPrisma.people.update.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'company-1',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Internal server error');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('No valid fields provided');
    });

    it('should handle concurrent updates', async () => {
      // Mock existing person
      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);
      
      // Mock company exists
      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);
      
      // Mock optimistic locking error
      mockPrisma.people.update.mockRejectedValue(new Error('Record was modified by another user'));

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'company-1',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Record was modified');
    });

    it('should remove company association when companyId is null', async () => {
      const personWithCompany = {
        ...mockPerson,
        companyId: 'company-1',
        company: 'Test Company',
      };

      // Mock existing person with company
      mockPrisma.people.findUnique.mockResolvedValue(personWithCompany);
      
      // Mock successful update to remove company
      mockPrisma.people.update.mockResolvedValue({
        ...personWithCompany,
        companyId: null,
        company: null,
      });

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: null,
          company: null,
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBeNull();
      expect(data.data.company).toBeNull();

      // Verify prisma update was called with null values
      expect(mockPrisma.people.update).toHaveBeenCalledWith({
        where: { id: 'person-1' },
        data: {
          companyId: null,
          company: null,
        },
        include: expect.any(Object),
      });
    });

    it('should handle workspace isolation', async () => {
      const personFromDifferentWorkspace = {
        ...mockPerson,
        workspaceId: 'different-workspace-id',
      };

      // Mock person from different workspace
      mockPrisma.people.findUnique.mockResolvedValue(personFromDifferentWorkspace);

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId: 'company-1',
          company: 'Test Company',
        }),
      });

      const response = await PATCH(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Access denied');
    });
  });

  describe('GET /api/v1/people/[id] - Company Association Retrieval', () => {
    it('should return person with company association', async () => {
      const personWithCompany = {
        id: 'person-1',
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: 'company-1',
        company: {
          id: 'company-1',
          name: 'Test Company',
          website: 'https://testcompany.com',
          industry: 'Technology',
        },
        workspaceId: 'test-workspace-id',
      };

      // Mock existing person with company
      mockPrisma.people.findUnique.mockResolvedValue(personWithCompany);

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'GET',
      });

      const response = await GET(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe('company-1');
      expect(data.data.company).toEqual({
        id: 'company-1',
        name: 'Test Company',
        website: 'https://testcompany.com',
        industry: 'Technology',
      });
    });

    it('should return person without company association', async () => {
      const personWithoutCompany = {
        id: 'person-1',
        fullName: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        companyId: null,
        company: null,
        workspaceId: 'test-workspace-id',
      };

      // Mock existing person without company
      mockPrisma.people.findUnique.mockResolvedValue(personWithoutCompany);

      const request = new NextRequest('http://localhost:3000/api/v1/people/person-1', {
        method: 'GET',
      });

      const response = await GET(request, { params: Promise.resolve({ id: 'person-1' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBeNull();
      expect(data.data.company).toBeNull();
    });
  });
});
