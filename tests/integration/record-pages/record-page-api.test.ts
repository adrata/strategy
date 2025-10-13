/**
 * Integration Tests for Record Page APIs
 * 
 * Tests API integration for all record types, data transformation, and error handling
 */

import { GET } from '@/app/api/v1/people/[id]/route';
import { GET as GetCompany } from '@/app/api/v1/companies/[id]/route';
import { GET as GetLead } from '@/app/api/v1/leads/[id]/route';
import { GET as GetProspect } from '@/app/api/v1/prospects/[id]/route';
import { GET as GetOpportunity } from '@/app/api/v1/opportunities/[id]/route';
import { GET as GetClient } from '@/app/api/v1/clients/[id]/route';
import { GET as GetSpeedrun } from '@/app/api/v1/speedrun/[id]/route';
import { 
  createMockApiResponse,
  createMockErrorResponse,
  TEST_USER,
  getTestAuthHeaders
} from '../../utils/test-factories';

// Mock the auth function
jest.mock('@/app/api/v1/auth', () => ({
  getV1AuthUser: jest.fn().mockResolvedValue({
    id: TEST_USER.id,
    email: TEST_USER.email,
    name: TEST_USER.name,
    workspaceId: TEST_USER.workspaceId,
  }),
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    people: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    companies: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    leads: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    prospects: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    opportunities: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    clients: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  })),
}));

describe('Record Page API Integration', () => {
  let mockPrisma: any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Get the mocked Prisma instance
    const { PrismaClient } = require('@prisma/client');
    mockPrisma = new PrismaClient();
  });

  describe('People API', () => {
    it('should return person data with company relationship', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'CEO',
        phone: '+1234567890',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        status: 'LEAD',
        company: {
          id: 'test-company-id',
          name: 'Test Company',
          website: 'https://test.com',
          industry: 'Technology'
        },
        mainSeller: {
          id: TEST_USER.id,
          name: TEST_USER.name,
          email: TEST_USER.email
        },
        coSellers: [
          { user: { name: 'Alice' } },
          { user: { name: 'Bob' } }
        ]
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@example.com',
        jobTitle: 'CEO',
        company: expect.objectContaining({
          name: 'Test Company',
          website: 'https://test.com',
          industry: 'Technology'
        })
      });
    });

    it('should handle person not found', async () => {
      mockPrisma.people.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/people/non-existent-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('not found');
    });

    it('should require authentication', async () => {
      const { getV1AuthUser } = require('@/app/api/v1/auth');
      getV1AuthUser.mockResolvedValueOnce(null);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('Companies API', () => {
    it('should return company data with related people', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology',
        phone: '+1234567890',
        address: '123 Test St',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        people: [
          {
            id: 'person-1',
            fullName: 'John Doe',
            jobTitle: 'CEO',
            email: 'john@example.com'
          },
          {
            id: 'person-2',
            fullName: 'Jane Smith',
            jobTitle: 'CTO',
            email: 'jane@example.com'
          }
        ]
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new Request('http://localhost:3000/api/v1/companies/test-company-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetCompany(request, { params: { id: 'test-company-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 'test-company-id',
        name: 'Test Company',
        website: 'https://test.com',
        industry: 'Technology',
        people: expect.arrayContaining([
          expect.objectContaining({
            fullName: 'John Doe',
            jobTitle: 'CEO'
          })
        ])
      });
    });

    it('should handle company not found', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/v1/companies/non-existent-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetCompany(request, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
    });
  });

  describe('Leads API', () => {
    it('should return lead data with proper status', async () => {
      const mockLead = {
        id: 'test-lead-id',
        fullName: 'Lead Person',
        email: 'lead@example.com',
        jobTitle: 'Manager',
        status: 'LEAD',
        source: 'Website',
        priority: 'HIGH',
        company: {
          id: 'company-1',
          name: 'Lead Company',
          website: 'https://lead.com'
        }
      };

      mockPrisma.leads.findUnique.mockResolvedValue(mockLead);

      const request = new Request('http://localhost:3000/api/v1/leads/test-lead-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetLead(request, { params: { id: 'test-lead-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('LEAD');
      expect(data.data.priority).toBe('HIGH');
    });
  });

  describe('Prospects API', () => {
    it('should return prospect data with engagement history', async () => {
      const mockProspect = {
        id: 'test-prospect-id',
        fullName: 'Prospect Person',
        email: 'prospect@example.com',
        jobTitle: 'Director',
        status: 'PROSPECT',
        lastContact: new Date('2024-01-01'),
        nextAction: 'Follow up call',
        company: {
          id: 'company-2',
          name: 'Prospect Company',
          website: 'https://prospect.com'
        }
      };

      mockPrisma.prospects.findUnique.mockResolvedValue(mockProspect);

      const request = new Request('http://localhost:3000/api/v1/prospects/test-prospect-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetProspect(request, { params: { id: 'test-prospect-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('PROSPECT');
      expect(data.data.nextAction).toBe('Follow up call');
    });
  });

  describe('Opportunities API', () => {
    it('should return opportunity data with deal information', async () => {
      const mockOpportunity = {
        id: 'test-opportunity-id',
        fullName: 'Opportunity Person',
        email: 'opportunity@example.com',
        jobTitle: 'VP',
        status: 'OPPORTUNITY',
        opportunityStage: 'PROPOSAL',
        opportunityAmount: 50000,
        opportunityProbability: 75,
        expectedCloseDate: new Date('2024-03-01'),
        company: {
          id: 'company-3',
          name: 'Opportunity Company',
          website: 'https://opportunity.com'
        }
      };

      mockPrisma.opportunities.findUnique.mockResolvedValue(mockOpportunity);

      const request = new Request('http://localhost:3000/api/v1/opportunities/test-opportunity-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetOpportunity(request, { params: { id: 'test-opportunity-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('OPPORTUNITY');
      expect(data.data.opportunityStage).toBe('PROPOSAL');
      expect(data.data.opportunityAmount).toBe(50000);
    });
  });

  describe('Clients API', () => {
    it('should return client data with account information', async () => {
      const mockClient = {
        id: 'test-client-id',
        fullName: 'Client Person',
        email: 'client@example.com',
        jobTitle: 'CEO',
        status: 'CLIENT',
        accountValue: 100000,
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31'),
        company: {
          id: 'company-4',
          name: 'Client Company',
          website: 'https://client.com'
        }
      };

      mockPrisma.clients.findUnique.mockResolvedValue(mockClient);

      const request = new Request('http://localhost:3000/api/v1/clients/test-client-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetClient(request, { params: { id: 'test-client-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('CLIENT');
      expect(data.data.accountValue).toBe(100000);
    });
  });

  describe('Speedrun API', () => {
    it('should return speedrun person data with ranking', async () => {
      const mockSpeedrunPerson = {
        id: 'test-speedrun-id',
        fullName: 'Speedrun Person',
        email: 'speedrun@example.com',
        jobTitle: 'CEO',
        globalRank: 1,
        status: 'LEAD',
        priority: 'HIGH',
        company: {
          id: 'company-5',
          name: 'Speedrun Company',
          website: 'https://speedrun.com'
        }
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockSpeedrunPerson);

      const request = new Request('http://localhost:3000/api/v1/speedrun/test-speedrun-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GetSpeedrun(request, { params: { id: 'test-speedrun-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.globalRank).toBe(1);
      expect(data.data.priority).toBe('HIGH');
    });
  });

  describe('Data Transformation', () => {
    it('should transform mainSeller to "Me" for current user', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        mainSeller: {
          id: TEST_USER.id,
          name: TEST_USER.name,
          email: TEST_USER.email
        }
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.mainSeller).toBe('Me');
    });

    it('should transform coSellers to comma-separated list', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        coSellers: [
          { user: { name: 'Alice' } },
          { user: { name: 'Bob' } },
          { user: { name: 'Charlie' } }
        ]
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.coSellers).toBe('Alice, Bob, Charlie');
    });

    it('should handle null values gracefully', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: null,
        email: null,
        jobTitle: null,
        phone: null,
        linkedinUrl: null,
        company: null,
        mainSeller: null,
        coSellers: []
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data).toMatchObject({
        id: 'test-person-id',
        fullName: '',
        email: '',
        jobTitle: '',
        phone: '',
        linkedinUrl: '',
        company: null,
        mainSeller: '',
        coSellers: ''
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.people.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database connection failed');
    });

    it('should handle invalid record ID format', async () => {
      const request = new Request('http://localhost:3000/api/v1/people/invalid-id-format', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'invalid-id-format' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should handle workspace access violations', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        workspaceId: 'different-workspace-id' // Different workspace
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('access');
    });
  });

  describe('Related Data Loading', () => {
    it('should include company relationship data', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        company: {
          id: 'company-1',
          name: 'Test Company',
          website: 'https://test.com',
          industry: 'Technology',
          phone: '+1234567890',
          address: '123 Test St'
        }
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.company).toBeDefined();
      expect(data.data.company.name).toBe('Test Company');
      expect(mockPrisma.people.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            company: true
          })
        })
      );
    });

    it('should include seller relationship data', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        mainSeller: {
          id: 'seller-1',
          name: 'Main Seller',
          email: 'seller@example.com'
        },
        coSellers: [
          {
            user: {
              id: 'co-seller-1',
              name: 'Co Seller 1',
              email: 'coseller1@example.com'
            }
          }
        ]
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new Request('http://localhost:3000/api/v1/people/test-person-id', {
        headers: getTestAuthHeaders(),
      });

      const response = await GET(request, { params: { id: 'test-person-id' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.mainSeller).toBeDefined();
      expect(data.data.coSellers).toBeDefined();
      expect(mockPrisma.people.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            mainSeller: true,
            coSellers: expect.objectContaining({
              include: expect.objectContaining({
                user: true
              })
            })
          })
        })
      );
    });
  });
});
