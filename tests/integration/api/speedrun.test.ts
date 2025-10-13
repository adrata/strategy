/**
 * Speedrun API Integration Tests
 * 
 * Comprehensive tests for the speedrun API endpoint
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
    people: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    companies: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

// Import after mocks
import { GET } from '@/app/api/v1/speedrun/route';
import { createTestPerson, TEST_USER, getTestAuthHeaders, validateApiResponse } from '../../utils/test-factories';

describe('Speedrun API', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('GET /api/v1/speedrun', () => {
    it('should return top 50 ranked people with company data', async () => {
      const mockPeople = Array.from({ length: 50 }, (_, i) => 
        createTestPerson({ 
          globalRank: i + 1,
          company: {
            id: `company-${i}`,
            name: `Company ${i}`,
            website: `https://company${i}.com`,
            industry: 'Technology'
          }
        })
      );
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(50);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      validateApiResponse.success(data);
      expect(data.data).toHaveLength(50);
      expect(data.meta.total).toBe(50);
      expect(data.meta.limit).toBe(50);
    });

    it('should order by globalRank ascending', async () => {
      const mockPeople = [
        createTestPerson({ globalRank: 1, fullName: 'Alice' }),
        createTestPerson({ globalRank: 2, fullName: 'Bob' }),
        createTestPerson({ globalRank: 3, fullName: 'Charlie' }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(3);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(3);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { globalRank: 'asc' },
            { createdAt: 'desc' }
          ],
        })
      );
    });

    it('should include company relationship data', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          company: {
            id: 'company-1',
            name: 'Test Company',
            website: 'https://test.com',
            industry: 'Technology'
          }
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].company).toBeDefined();
      expect(data.data[0].company.name).toBe('Test Company');
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            company: true,
          }),
        })
      );
    });

    it('should transform mainSeller to "Me" for current user', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          mainSeller: {
            id: '01K1VBYZG41K9QA0D9CF06KNRG',
            name: 'Ross',
            email: 'ross@adrata.com'
          }
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].mainSeller).toBe('Me');
    });

    it('should transform coSellers to comma-separated list', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          coSellers: [
            { user: { name: 'Alice' } },
            { user: { name: 'Bob' } },
            { user: { name: 'Charlie' } }
          ]
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].coSellers).toBe('Alice, Bob, Charlie');
    });

    it('should handle empty coSellers array', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          coSellers: []
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].coSellers).toBe('');
    });

    it('should handle null mainSeller', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          mainSeller: null
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0].mainSeller).toBe('');
    });

    it('should filter by workspaceId', async () => {
      const mockPeople = [
        createTestPerson({ globalRank: 1 }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workspaceId: '01K1VBYXHD0J895XAN0HGFBKJP',
            deletedAt: null,
          }),
        })
      );
    });

    it('should limit results to 50 records', async () => {
      const mockPeople = Array.from({ length: 50 }, (_, i) => 
        createTestPerson({ globalRank: i + 1 })
      );
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(50);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(50);
      expect(mockPrisma.people.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });

    it('should handle demo mode correctly', async () => {
      // Mock demo mode detection
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const mockPeople = [
        createTestPerson({ globalRank: 1 }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(1);
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should require authentication', async () => {
      // Mock auth to return null
      const { getV1AuthUser } = require('@/app/api/v1/auth');
      getV1AuthUser.mockResolvedValueOnce(null);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      validateApiResponse.error(data, 401);
    });

    it('should handle database errors gracefully', async () => {
      mockPrisma.people.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      validateApiResponse.error(data, 500);
    });

    it('should return empty array when no people found', async () => {
      mockPrisma.people.findMany.mockResolvedValue([]);
      mockPrisma.people.count.mockResolvedValue(0);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toHaveLength(0);
      expect(data.meta.total).toBe(0);
    });

    it('should include all required fields in response', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          fullName: 'John Doe',
          email: 'john@example.com',
          jobTitle: 'CEO',
          phone: '+1234567890',
          linkedinUrl: 'https://linkedin.com/in/johndoe',
          status: 'LEAD',
          lastAction: 'Email sent',
          lastActionDate: new Date('2024-01-01'),
          nextAction: 'Follow up call',
          nextActionDate: new Date('2024-01-02'),
          company: {
            id: 'company-1',
            name: 'Test Company',
            website: 'https://test.com',
            industry: 'Technology'
          }
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0]).toMatchObject({
        id: expect.any(String),
        rank: 1,
        name: 'John Doe',
        email: 'john@example.com',
        title: 'CEO',
        phone: '+1234567890',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        status: 'LEAD',
        lastAction: 'Email sent',
        nextAction: 'Follow up call',
        company: expect.objectContaining({
          name: 'Test Company',
          website: 'https://test.com',
          industry: 'Technology'
        })
      });
    });

    it('should handle null values gracefully', async () => {
      const mockPeople = [
        createTestPerson({ 
          globalRank: 1,
          fullName: null,
          email: null,
          jobTitle: null,
          phone: null,
          linkedinUrl: null,
          lastAction: null,
          lastActionDate: null,
          nextAction: null,
          nextActionDate: null,
          company: null
        }),
      ];
      
      mockPrisma.people.findMany.mockResolvedValue(mockPeople);
      mockPrisma.people.count.mockResolvedValue(1);

      const request = new Request('http://localhost:3000/api/v1/speedrun', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data[0]).toMatchObject({
        id: expect.any(String),
        rank: 1,
        name: '',
        email: '',
        title: '',
        phone: '',
        linkedinUrl: '',
        lastAction: '',
        nextAction: '',
        company: null
      });
    });
  });
});
