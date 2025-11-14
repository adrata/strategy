/**
 * People API - Company Field Fix Tests
 * 
 * Tests to verify that the people API correctly handles cases where:
 * 1. companyId exists but company relation is null (soft-deleted companies)
 * 2. companyId is always included in the response
 * 3. Company name is fetched and included when relation is null
 */

import { NextRequest } from 'next/server';
import { GET } from '@/app/api/v1/people/[id]/route';
import { getTestAuthHeaders, TEST_USER } from '../../utils/test-factories';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    people: {
      findUnique: jest.fn(),
    },
    companies: {
      findUnique: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Mock auth
jest.mock('@/app/api/v1/auth', () => ({
  getV1AuthUser: jest.fn(),
}));

// Mock buyer group sync service
jest.mock('@/platform/services/buyer-group-sync-service', () => ({
  BuyerGroupSyncService: {
    syncPersonBuyerGroupData: jest.fn().mockResolvedValue(undefined),
  },
}));

// Mock merge function
jest.mock('@/platform/utils/prismaHelpers', () => ({
  mergeCorePersonWithWorkspace: jest.fn((person) => person),
}));

describe('People API - Company Field Fix', () => {
  let mockPrisma: any;
  let mockGetV1AuthUser: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Get mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
    
    // Get mocked auth function
    const { getV1AuthUser } = require('@/app/api/v1/auth');
    mockGetV1AuthUser = getV1AuthUser;
    mockGetV1AuthUser.mockResolvedValue({
      id: TEST_USER.id,
      email: TEST_USER.email,
      workspaceId: TEST_USER.workspaceId,
    });
  });

  describe('GET /api/v1/people/[id] - Company Field Handling', () => {
    it('should include companyId in response even when company relation is null', async () => {
      const personId = 'test-person-id';
      const companyId = 'test-company-id';
      
      // Mock person with companyId but null company relation
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: companyId,
        company: null, // Company relation is null
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe(companyId);
    });

    it('should fetch company name when company relation is null but companyId exists', async () => {
      const personId = 'test-person-id';
      const companyId = 'test-company-id';
      const companyName = 'Test Company';
      
      // Mock person with companyId but null company relation
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: companyId,
        company: null, // Company relation is null
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      // Mock company fetch (including soft-deleted companies)
      mockPrisma.companies.findUnique.mockResolvedValue({
        id: companyId,
        name: companyName,
        website: 'https://testcompany.com',
        industry: 'Technology',
        status: 'ACTIVE',
        priority: 'MEDIUM',
        deletedAt: new Date('2024-01-01'), // Soft-deleted company
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe(companyId);
      expect(data.data.company).toBeDefined();
      expect(data.data.company.name).toBe(companyName);
      expect(data.data.company.deletedAt).toBeDefined(); // Should include deletedAt
      
      // Verify company was fetched
      expect(mockPrisma.companies.findUnique).toHaveBeenCalledWith({
        where: {
          id: companyId,
          workspaceId: TEST_USER.workspaceId,
        },
        select: {
          id: true,
          name: true,
          website: true,
          industry: true,
          status: true,
          priority: true,
          deletedAt: true,
        },
      });
    });

    it('should handle case where companyId exists but company is not found in database', async () => {
      const personId = 'test-person-id';
      const companyId = 'non-existent-company-id';
      
      // Mock person with companyId but null company relation
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: companyId,
        company: null,
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      // Mock company not found
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe(companyId); // companyId should still be present
      expect(data.data.company).toBeNull(); // Company relation should be null
    });

    it('should not fetch company when company relation already exists', async () => {
      const personId = 'test-person-id';
      const companyId = 'test-company-id';
      const companyName = 'Existing Company';
      
      // Mock person with existing company relation
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: companyId,
        company: {
          id: companyId,
          name: companyName,
          website: 'https://existingcompany.com',
          industry: 'Technology',
          status: 'ACTIVE',
          priority: 'MEDIUM',
          deletedAt: null,
        },
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe(companyId);
      expect(data.data.company.name).toBe(companyName);
      
      // Should NOT fetch company since relation already exists
      expect(mockPrisma.companies.findUnique).not.toHaveBeenCalled();
    });

    it('should not fetch company when companyId is null', async () => {
      const personId = 'test-person-id';
      
      // Mock person without companyId
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: null,
        company: null,
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBeNull();
      
      // Should NOT fetch company when companyId is null
      expect(mockPrisma.companies.findUnique).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully when fetching company fails', async () => {
      const personId = 'test-person-id';
      const companyId = 'test-company-id';
      
      // Mock person with companyId but null company relation
      mockPrisma.people.findUnique.mockResolvedValue({
        id: personId,
        companyId: companyId,
        company: null,
        fullName: 'Test Person',
        email: 'test@example.com',
        workspaceId: TEST_USER.workspaceId,
        deletedAt: null,
        corePerson: null,
        mainSeller: null,
        actions: [],
        _count: { actions: 0 },
      });

      // Mock company fetch error
      mockPrisma.companies.findUnique.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest(`http://localhost:3000/api/v1/people/${personId}`, {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: Promise.resolve({ id: personId }) });
      const data = await response.json();

      // Should still return success with companyId, even if company fetch fails
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.companyId).toBe(companyId);
      // Company should be null if fetch failed
      expect(data.data.company).toBeNull();
    });
  });
});

