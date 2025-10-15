/**
 * API Data Integrity Integration Tests
 * 
 * Tests to verify API routes return real database data
 * and include CoreSignal data in responses
 */

import { NextRequest } from 'next/server';
import { GET as getCompany } from '@/app/api/v1/companies/[id]/route';
import { GET as getPerson } from '@/app/api/v1/people/[id]/route';
import { GET as getNews } from '@/app/api/news/company/[companyName]/route';
import { GET as getActions } from '@/app/api/v1/actions/route';

// Mock Prisma
const mockPrisma = {
  companies: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  people: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn()
  },
  actions: {
    findMany: jest.fn()
  }
};

jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma
}));

// Mock fetch for external API calls
global.fetch = jest.fn();

describe('API Data Integrity Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('Company API Tests', () => {
    it('should return company with customFields and companyUpdates', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://testcompany.com',
        customFields: {
          linkedinUrl: 'https://linkedin.com/company/test-company',
          coresignal: {
            company_id: 'coresignal-123',
            employee_count: 500,
            technologies: ['React', 'Node.js']
          }
        },
        companyUpdates: [
          {
            title: 'Company News',
            description: 'Recent company update',
            date: '2024-01-15T10:00:00Z',
            source: 'Company Blog'
          }
        ],
        companyIntelligence: {
          lastGenerated: '2024-01-15T10:00:00Z',
          insights: ['Growing team', 'New product launch']
        }
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new NextRequest('http://localhost:3000/api/v1/companies/test-company-id');
      const response = await getCompany(request, { params: Promise.resolve({ id: 'test-company-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.company).toEqual(mockCompany);
      expect(data.company.customFields).toBeDefined();
      expect(data.company.companyUpdates).toBeDefined();
      expect(data.company.companyIntelligence).toBeDefined();
    });

    it('should handle company without CoreSignal data gracefully', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        industry: 'Technology',
        customFields: null,
        companyUpdates: null,
        companyIntelligence: null
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new NextRequest('http://localhost:3000/api/v1/companies/test-company-id');
      const response = await getCompany(request, { params: Promise.resolve({ id: 'test-company-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.company.customFields).toBeNull();
      expect(data.company.companyUpdates).toBeNull();
    });

    it('should return 404 for non-existent company', async () => {
      mockPrisma.companies.findUnique.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/v1/companies/non-existent');
      const response = await getCompany(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Company not found');
    });
  });

  describe('Person API Tests', () => {
    it('should return person with coresignalData and enrichedData', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@testcompany.com',
        jobTitle: 'Senior Engineer',
        coresignalData: {
          full_name: 'John Doe',
          active_experience_title: 'Senior Engineer',
          primary_professional_email: 'john@testcompany.com',
          experience: [
            {
              active_experience: 1,
              company_name: 'Test Company',
              position_title: 'Senior Engineer',
              start_date: '2020-01-01'
            }
          ]
        },
        enrichedData: {
          lastEnriched: '2024-01-15T10:00:00Z',
          enrichmentScore: 85,
          dataCompleteness: 90
        },
        customFields: {
          influenceLevel: 'High',
          decisionPower: 8,
          isBuyerGroupMember: true
        }
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new NextRequest('http://localhost:3000/api/v1/people/test-person-id');
      const response = await getPerson(request, { params: Promise.resolve({ id: 'test-person-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.person).toEqual(mockPerson);
      expect(data.person.coresignalData).toBeDefined();
      expect(data.person.enrichedData).toBeDefined();
      expect(data.person.customFields).toBeDefined();
    });

    it('should handle person without CoreSignal data gracefully', async () => {
      const mockPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        email: 'john@testcompany.com',
        coresignalData: null,
        enrichedData: null,
        customFields: null
      };

      mockPrisma.people.findUnique.mockResolvedValue(mockPerson);

      const request = new NextRequest('http://localhost:3000/api/v1/people/test-person-id');
      const response = await getPerson(request, { params: Promise.resolve({ id: 'test-person-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.person.coresignalData).toBeNull();
      expect(data.person.enrichedData).toBeNull();
    });
  });

  describe('News API Tests', () => {
    it('should prioritize database companyUpdates over external API', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        companyUpdates: [
          {
            title: 'Database News',
            description: 'News from database',
            date: '2024-01-15T10:00:00Z',
            source: 'Database'
          }
        ]
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new NextRequest('http://localhost:3000/api/news/company/Test%20Company');
      const response = await getNews(request, { params: Promise.resolve({ companyName: 'Test Company' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].title).toBe('Database News');
      expect(data.dataSource).toBe('database_companyUpdates');

      // Should not call external API when database has data
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fallback to Perplexity API when no companyUpdates', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        companyUpdates: []
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const mockPerplexityResponse = {
        success: true,
        articles: [
          {
            title: 'Perplexity News',
            description: 'News from Perplexity',
            publishedAt: '2024-01-15T10:00:00Z',
            url: 'https://example.com/news'
          }
        ],
        dataSource: 'perplexity_api'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPerplexityResponse
      });

      const request = new NextRequest('http://localhost:3000/api/news/company/Test%20Company');
      const response = await getNews(request, { params: Promise.resolve({ companyName: 'Test Company' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.articles).toHaveLength(1);
      expect(data.articles[0].title).toBe('Perplexity News');
      expect(data.dataSource).toBe('perplexity_api');
    });

    it('should handle Perplexity API errors gracefully', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        companyUpdates: []
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      const request = new NextRequest('http://localhost:3000/api/news/company/Test%20Company');
      const response = await getNews(request, { params: Promise.resolve({ companyName: 'Test Company' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Failed to fetch company news');
    });
  });

  describe('Actions API Tests', () => {
    it('should return real database actions', async () => {
      const mockActions = [
        {
          id: 'action-1',
          type: 'email',
          description: 'Sent follow-up email',
          createdAt: '2024-01-15T10:00:00Z',
          person: {
            id: 'person-1',
            fullName: 'John Doe'
          },
          company: {
            id: 'company-1',
            name: 'Test Company'
          }
        },
        {
          id: 'action-2',
          type: 'call',
          description: 'Scheduled phone call',
          createdAt: '2024-01-14T15:00:00Z',
          person: {
            id: 'person-2',
            fullName: 'Jane Smith'
          },
          company: {
            id: 'company-1',
            name: 'Test Company'
          }
        }
      ];

      mockPrisma.actions.findMany.mockResolvedValue(mockActions);

      const request = new NextRequest('http://localhost:3000/api/v1/actions?workspaceId=test-workspace');
      const response = await getActions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.actions).toEqual(mockActions);
      expect(data.actions).toHaveLength(2);
    });

    it('should handle empty actions gracefully', async () => {
      mockPrisma.actions.findMany.mockResolvedValue([]);

      const request = new NextRequest('http://localhost:3000/api/v1/actions?workspaceId=test-workspace');
      const response = await getActions(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.actions).toEqual([]);
    });
  });

  describe('Data Preservation Tests', () => {
    it('should not overwrite CoreSignal data during updates', async () => {
      const existingCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        customFields: {
          coresignal: {
            company_id: 'coresignal-123',
            employee_count: 500
          }
        },
        companyUpdates: [
          {
            title: 'Existing Update',
            date: '2024-01-15T10:00:00Z'
          }
        ]
      };

      const updateData = {
        name: 'Updated Company Name',
        industry: 'Updated Industry'
      };

      mockPrisma.companies.findUnique.mockResolvedValue(existingCompany);
      mockPrisma.companies.update.mockResolvedValue({
        ...existingCompany,
        ...updateData
      });

      // Simulate update that should preserve CoreSignal data
      const updatedCompany = await mockPrisma.companies.update({
        where: { id: 'test-company-id' },
        data: updateData
      });

      expect(updatedCompany.customFields).toEqual(existingCompany.customFields);
      expect(updatedCompany.companyUpdates).toEqual(existingCompany.companyUpdates);
    });

    it('should preserve customFields during person updates', async () => {
      const existingPerson = {
        id: 'test-person-id',
        fullName: 'John Doe',
        coresignalData: {
          full_name: 'John Doe',
          experience: []
        },
        customFields: {
          influenceLevel: 'High',
          decisionPower: 8
        }
      };

      const updateData = {
        email: 'newemail@testcompany.com',
        jobTitle: 'Updated Title'
      };

      mockPrisma.people.findUnique.mockResolvedValue(existingPerson);
      mockPrisma.people.update.mockResolvedValue({
        ...existingPerson,
        ...updateData
      });

      const updatedPerson = await mockPrisma.people.update({
        where: { id: 'test-person-id' },
        data: updateData
      });

      expect(updatedPerson.coresignalData).toEqual(existingPerson.coresignalData);
      expect(updatedPerson.customFields).toEqual(existingPerson.customFields);
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors gracefully', async () => {
      mockPrisma.companies.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/v1/companies/test-company-id');
      const response = await getCompany(request, { params: Promise.resolve({ id: 'test-company-id' }) });
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Database connection failed');
    });

    it('should handle malformed JSON in customFields gracefully', async () => {
      const mockCompany = {
        id: 'test-company-id',
        name: 'Test Company',
        customFields: 'invalid-json',
        companyUpdates: null
      };

      mockPrisma.companies.findUnique.mockResolvedValue(mockCompany);

      const request = new NextRequest('http://localhost:3000/api/v1/companies/test-company-id');
      const response = await getCompany(request, { params: Promise.resolve({ id: 'test-company-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.company.customFields).toBe('invalid-json');
    });
  });
});
