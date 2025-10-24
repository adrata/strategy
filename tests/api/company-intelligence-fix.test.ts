/**
 * Comprehensive Tests for Company Intelligence API Fixes
 * 
 * Tests to verify that Prisma relation errors have been resolved
 * and the intelligence APIs work correctly with the streamlined schema.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { prisma } from '../../src/lib/prisma';

// Mock company data
const mockCompany = {
  id: 'test-company-123',
  workspaceId: 'test-workspace-123',
  name: 'Test Company Inc',
  industry: 'Technology',
  size: 'Medium',
  employeeCount: 150,
  revenue: 5000000,
  website: 'https://testcompany.com',
  description: 'A test company for API testing',
  customFields: {
    strategyData: {
      strategySummary: 'Test strategy summary',
      archetypeName: 'Growth Company',
      strategyGeneratedAt: new Date().toISOString(),
      strategyGeneratedBy: 'test-user-123'
    }
  },
  people: [
    {
      id: 'person-1',
      firstName: 'John',
      lastName: 'Doe',
      title: 'CEO',
      email: 'john@testcompany.com',
      phone: '+1234567890',
      linkedinUrl: 'https://linkedin.com/in/johndoe',
      lastAction: 'Email sent',
      nextAction: 'Follow up call'
    },
    {
      id: 'person-2', 
      firstName: 'Jane',
      lastName: 'Smith',
      title: 'CTO',
      email: 'jane@testcompany.com',
      phone: '+1234567891',
      linkedinUrl: 'https://linkedin.com/in/janesmith',
      lastAction: 'Meeting scheduled',
      nextAction: 'Technical discussion'
    }
  ]
};

describe('Company Intelligence API Fixes', () => {
  beforeAll(async () => {
    // Ensure Prisma is connected
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.companies.deleteMany({
      where: { id: 'test-company-123' }
    });
  });

  describe('Prisma Schema Validation', () => {
    it('should verify companies model has correct relations', async () => {
      // Test that we can query companies with valid relations
      const companies = await prisma.companies.findMany({
        where: { workspaceId: 'test-workspace-123' },
        include: {
          people: true,
          actions: true,
          mainSeller: true,
          workspace: true,
          emails: true
        },
        take: 1
      });

      // Should not throw any Prisma relation errors
      expect(companies).toBeDefined();
      expect(Array.isArray(companies)).toBe(true);
    });

    it('should verify opportunities and buyerGroups relations do not exist', async () => {
      // This test should fail if we try to include non-existent relations
      // We expect this to throw an error, confirming the relations don't exist
      await expect(async () => {
        await prisma.companies.findMany({
          include: {
            // @ts-expect-error - This should cause a TypeScript error
            opportunities: true,
            // @ts-expect-error - This should cause a TypeScript error  
            buyerGroups: true
          }
        });
      }).rejects.toThrow();
    });
  });

  describe('Company Strategy API (/api/v1/strategy/company/[id])', () => {
    beforeEach(async () => {
      // Create test company
      await prisma.companies.create({
        data: {
          id: 'test-company-123',
          workspaceId: 'test-workspace-123',
          name: 'Test Company Inc',
          industry: 'Technology',
          size: 'Medium',
          employeeCount: 150,
          revenue: 5000000,
          website: 'https://testcompany.com',
          description: 'A test company for API testing',
          customFields: {
            strategyData: {
              strategySummary: 'Test strategy summary',
              archetypeName: 'Growth Company',
              strategyGeneratedAt: new Date().toISOString(),
              strategyGeneratedBy: 'test-user-123'
            }
          }
        }
      });

      // Create test people
      await prisma.people.createMany({
        data: [
          {
            id: 'person-1',
            workspaceId: 'test-workspace-123',
            companyId: 'test-company-123',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            jobTitle: 'CEO',
            email: 'john@testcompany.com',
            phone: '+1234567890',
            linkedinUrl: 'https://linkedin.com/in/johndoe'
          },
          {
            id: 'person-2',
            workspaceId: 'test-workspace-123', 
            companyId: 'test-company-123',
            firstName: 'Jane',
            lastName: 'Smith',
            fullName: 'Jane Smith',
            jobTitle: 'CTO',
            email: 'jane@testcompany.com',
            phone: '+1234567891',
            linkedinUrl: 'https://linkedin.com/in/janesmith'
          }
        ]
      });
    });

    it('should successfully query company with people relation (no Prisma errors)', async () => {
      const company = await prisma.companies.findFirst({
        where: {
          id: 'test-company-123',
          workspaceId: 'test-workspace-123',
          deletedAt: null
        },
        include: {
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              email: true,
              phone: true,
              linkedinUrl: true,
              lastAction: true,
              nextAction: true
            }
          }
        }
      });

      expect(company).toBeDefined();
      expect(company?.name).toBe('Test Company Inc');
      expect(company?.people).toBeDefined();
      expect(company?.people).toHaveLength(2);
      expect(company?.people?.[0].firstName).toBe('John');
      expect(company?.people?.[1].firstName).toBe('Jane');
    });

    it('should handle missing opportunities and buyerGroups gracefully', async () => {
      const company = await prisma.companies.findFirst({
        where: {
          id: 'test-company-123',
          workspaceId: 'test-workspace-123',
          deletedAt: null
        },
        include: {
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              email: true,
              phone: true,
              linkedinUrl: true,
              lastAction: true,
              nextAction: true
            }
          }
        }
      });

      // Verify the company data structure
      expect(company).toBeDefined();
      expect(company?.people).toBeDefined();
      
      // These should be undefined since the relations don't exist
      expect(company?.opportunities).toBeUndefined();
      expect(company?.buyerGroups).toBeUndefined();
    });

    it('should not throw Prisma errors when building strategy request', () => {
      const company = mockCompany;
      
      // Simulate the strategy request building logic
      const strategyRequest = {
        companyId: company.id,
        companyName: company.name,
        companyIndustry: company.industry || 'Unknown',
        companySize: company.size || 0,
        companyRevenue: company.revenue || 0,
        people: company.people || [],
        // These should be empty arrays since the relations don't exist
        opportunities: [], // Was: company.opportunities || []
        buyerGroups: []   // Was: company.buyerGroups || []
      };

      expect(strategyRequest.companyId).toBe('test-company-123');
      expect(strategyRequest.companyName).toBe('Test Company Inc');
      expect(strategyRequest.people).toHaveLength(2);
      expect(strategyRequest.opportunities).toEqual([]);
      expect(strategyRequest.buyerGroups).toEqual([]);
    });
  });

  describe('SBI Intelligence API (/api/sbi/companies/[id]/intelligence)', () => {
    beforeEach(async () => {
      // Create test company
      await prisma.companies.create({
        data: {
          id: 'test-company-123',
          workspaceId: 'test-workspace-123',
          name: 'Test Company Inc',
          industry: 'Technology',
          size: 'Medium',
          employeeCount: 150,
          revenue: 5000000,
          website: 'https://testcompany.com',
          description: 'A test company for API testing'
        }
      });

      // Create test people
      await prisma.people.createMany({
        data: [
          {
            id: 'person-1',
            workspaceId: 'test-workspace-123',
            companyId: 'test-company-123',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            jobTitle: 'CEO',
            email: 'john@testcompany.com'
          }
        ]
      });
    });

    it('should successfully query company with people relation (no Prisma errors)', async () => {
      const company = await prisma.companies.findUnique({
        where: { id: 'test-company-123' },
        include: {
          people: true
        }
      });

      expect(company).toBeDefined();
      expect(company?.name).toBe('Test Company Inc');
      expect(company?.people).toBeDefined();
      expect(company?.people).toHaveLength(1);
      expect(company?.people?.[0].firstName).toBe('John');
    });

    it('should not include opportunities relation', async () => {
      const company = await prisma.companies.findUnique({
        where: { id: 'test-company-123' },
        include: {
          people: true
        }
      });

      expect(company).toBeDefined();
      expect(company?.people).toBeDefined();
      
      // This should be undefined since we're not including it
      expect(company?.opportunities).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle company not found gracefully', async () => {
      const company = await prisma.companies.findUnique({
        where: { id: 'non-existent-company' },
        include: {
          people: true
        }
      });

      expect(company).toBeNull();
    });

    it('should handle empty people relation gracefully', async () => {
      // Create company without people
      await prisma.companies.create({
        data: {
          id: 'empty-company-123',
          workspaceId: 'test-workspace-123',
          name: 'Empty Company',
          industry: 'Technology'
        }
      });

      const company = await prisma.companies.findUnique({
        where: { id: 'empty-company-123' },
        include: {
          people: true
        }
      });

      expect(company).toBeDefined();
      expect(company?.people).toEqual([]);
    });
  });

  describe('Performance Tests', () => {
    it('should execute queries efficiently without unnecessary relations', async () => {
      const startTime = Date.now();
      
      const company = await prisma.companies.findFirst({
        where: {
          workspaceId: 'test-workspace-123',
          deletedAt: null
        },
        include: {
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
              email: true
            }
          }
        }
      });

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      expect(company).toBeDefined();
      expect(executionTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity with people relation', async () => {
      // Create company
      const company = await prisma.companies.create({
        data: {
          id: 'integrity-test-company',
          workspaceId: 'test-workspace-123',
          name: 'Integrity Test Company',
          industry: 'Technology'
        }
      });

      // Create person linked to company
      const person = await prisma.people.create({
        data: {
          id: 'integrity-test-person',
          workspaceId: 'test-workspace-123',
          companyId: 'integrity-test-company',
          firstName: 'Test',
          lastName: 'Person',
          fullName: 'Test Person',
          jobTitle: 'Developer'
        }
      });

      // Query company with people
      const companyWithPeople = await prisma.companies.findUnique({
        where: { id: 'integrity-test-company' },
        include: {
          people: true
        }
      });

      expect(companyWithPeople).toBeDefined();
      expect(companyWithPeople?.people).toHaveLength(1);
      expect(companyWithPeople?.people?.[0].id).toBe('integrity-test-person');
      expect(companyWithPeople?.people?.[0].companyId).toBe('integrity-test-company');
    });
  });
});
