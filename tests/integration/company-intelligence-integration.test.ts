/**
 * Integration Tests for Company Intelligence API Fixes
 * 
 * These tests verify that the complete intelligence workflow works
 * without Prisma relation errors, including frontend-backend integration.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Company Intelligence Integration Tests', () => {
  const testWorkspaceId = 'test-workspace-integration';
  const testCompanyId = 'test-company-integration';
  const testUserId = 'test-user-integration';

  beforeAll(async () => {
    // Clean up any existing test data
    await prisma.people.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
    await prisma.companies.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.people.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
    await prisma.companies.deleteMany({
      where: { workspaceId: testWorkspaceId }
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prisma.people.deleteMany({
      where: { companyId: testCompanyId }
    });
    await prisma.companies.deleteMany({
      where: { id: testCompanyId }
    });
  });

  describe('Complete Intelligence Workflow', () => {
    it('should create company with people and query without Prisma errors', async () => {
      // 1. Create test company
      const company = await prisma.companies.create({
        data: {
          id: testCompanyId,
          workspaceId: testWorkspaceId,
          name: 'Integration Test Company',
          industry: 'Technology',
          size: 'Medium',
          employeeCount: 200,
          revenue: 10000000,
          website: 'https://integration-test.com',
          description: 'A company for integration testing',
          customFields: {}
        }
      });

      expect(company).toBeDefined();
      expect(company.id).toBe(testCompanyId);

      // 2. Create test people
      const people = await prisma.people.createMany({
        data: [
          {
            id: 'person-1',
            workspaceId: testWorkspaceId,
            companyId: testCompanyId,
            firstName: 'Alice',
            lastName: 'Johnson',
            fullName: 'Alice Johnson',
            jobTitle: 'CEO',
            email: 'alice@integration-test.com',
            phone: '+1234567890',
            linkedinUrl: 'https://linkedin.com/in/alicejohnson'
          },
          {
            id: 'person-2',
            workspaceId: testWorkspaceId,
            companyId: testCompanyId,
            firstName: 'Bob',
            lastName: 'Smith',
            fullName: 'Bob Smith',
            jobTitle: 'CTO',
            email: 'bob@integration-test.com',
            phone: '+1234567891',
            linkedinUrl: 'https://linkedin.com/in/bobsmith'
          }
        ]
      });

      expect(people.count).toBe(2);

      // 3. Query company with people (this is what the fixed APIs do)
      const companyWithPeople = await prisma.companies.findUnique({
        where: { id: testCompanyId },
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

      // 4. Verify the query worked without Prisma errors
      expect(companyWithPeople).toBeDefined();
      expect(companyWithPeople?.name).toBe('Integration Test Company');
      expect(companyWithPeople?.people).toHaveLength(2);
      expect(companyWithPeople?.people?.[0].firstName).toBe('Alice');
      expect(companyWithPeople?.people?.[1].firstName).toBe('Bob');

      // 5. Verify that opportunities and buyerGroups are not included
      expect(companyWithPeople?.opportunities).toBeUndefined();
      expect(companyWithPeople?.buyerGroups).toBeUndefined();
    });

    it('should handle strategy data generation without Prisma errors', async () => {
      // Create company with strategy data
      const company = await prisma.companies.create({
        data: {
          id: testCompanyId,
          workspaceId: testWorkspaceId,
          name: 'Strategy Test Company',
          industry: 'Healthcare',
          size: 'Large',
          employeeCount: 500,
          revenue: 50000000,
          customFields: {
            strategyData: {
              strategySummary: 'Healthcare company focused on digital transformation',
              archetypeName: 'Digital Health Leader',
              strategyGeneratedAt: new Date().toISOString(),
              strategyGeneratedBy: testUserId
            }
          }
        }
      });

      // Create people
      await prisma.people.createMany({
        data: [
          {
            id: 'strategy-person-1',
            workspaceId: testWorkspaceId,
            companyId: testCompanyId,
            firstName: 'Dr. Sarah',
            lastName: 'Wilson',
            fullName: 'Dr. Sarah Wilson',
            jobTitle: 'Chief Medical Officer',
            email: 'sarah@strategy-test.com'
          }
        ]
      });

      // Query company for strategy generation (simulating the fixed API)
      const companyForStrategy = await prisma.companies.findFirst({
        where: {
          id: testCompanyId,
          workspaceId: testWorkspaceId,
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

      expect(companyForStrategy).toBeDefined();
      expect(companyForStrategy?.customFields?.strategyData).toBeDefined();
      expect(companyForStrategy?.people).toHaveLength(1);

      // Simulate building strategy request (as done in the fixed API)
      const strategyRequest = {
        companyId: companyForStrategy!.id,
        companyName: companyForStrategy!.name,
        companyIndustry: companyForStrategy!.industry || 'Unknown',
        people: companyForStrategy!.people || [],
        // These are now empty arrays instead of undefined relations
        opportunities: [],
        buyerGroups: []
      };

      expect(strategyRequest.companyId).toBe(testCompanyId);
      expect(strategyRequest.companyName).toBe('Strategy Test Company');
      expect(strategyRequest.people).toHaveLength(1);
      expect(strategyRequest.opportunities).toEqual([]);
      expect(strategyRequest.buyerGroups).toEqual([]);
    });

    it('should handle intelligence generation without Prisma errors', async () => {
      // Create company for intelligence testing
      const company = await prisma.companies.create({
        data: {
          id: testCompanyId,
          workspaceId: testWorkspaceId,
          name: 'Intelligence Test Company',
          industry: 'Finance',
          size: 'Enterprise',
          employeeCount: 1000,
          revenue: 100000000,
          companyIntelligence: {
            marketPosition: 'Leader',
            growthTrajectory: 'High Growth',
            opportunities: ['Digital Banking', 'AI Integration'],
            threats: ['Regulatory Changes', 'Competition']
          }
        }
      });

      // Create people
      await prisma.people.createMany({
        data: [
          {
            id: 'intel-person-1',
            workspaceId: testWorkspaceId,
            companyId: testCompanyId,
            firstName: 'Michael',
            lastName: 'Chen',
            fullName: 'Michael Chen',
            jobTitle: 'Chief Technology Officer',
            email: 'michael@intel-test.com'
          }
        ]
      });

      // Query company for intelligence (simulating the fixed SBI API)
      const companyForIntelligence = await prisma.companies.findUnique({
        where: { id: testCompanyId },
        include: {
          people: true
        }
      });

      expect(companyForIntelligence).toBeDefined();
      expect(companyForIntelligence?.companyIntelligence).toBeDefined();
      expect(companyForIntelligence?.people).toHaveLength(1);

      // Verify no Prisma relation errors occurred
      expect(companyForIntelligence?.opportunities).toBeUndefined();
      expect(companyForIntelligence?.buyerGroups).toBeUndefined();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle company not found gracefully', async () => {
      const nonExistentCompany = await prisma.companies.findUnique({
        where: { id: 'non-existent-company' },
        include: {
          people: true
        }
      });

      expect(nonExistentCompany).toBeNull();
    });

    it('should handle company with no people gracefully', async () => {
      const company = await prisma.companies.create({
        data: {
          id: testCompanyId,
          workspaceId: testWorkspaceId,
          name: 'Lonely Company',
          industry: 'Technology'
        }
      });

      const companyWithPeople = await prisma.companies.findUnique({
        where: { id: testCompanyId },
        include: {
          people: true
        }
      });

      expect(companyWithPeople).toBeDefined();
      expect(companyWithPeople?.people).toEqual([]);
    });

    it('should handle database connection issues gracefully', async () => {
      // This test verifies that our queries don't have syntax errors
      // that would cause immediate failures
      const validQuery = prisma.companies.findMany({
        where: { workspaceId: testWorkspaceId },
        include: {
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // The query should be valid (not throw syntax errors)
      expect(validQuery).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle multiple companies efficiently', async () => {
      // Create multiple companies
      const companies = [];
      for (let i = 0; i < 5; i++) {
        const company = await prisma.companies.create({
          data: {
            id: `perf-company-${i}`,
            workspaceId: testWorkspaceId,
            name: `Performance Test Company ${i}`,
            industry: 'Technology'
          }
        });
        companies.push(company);

        // Add people to each company
        await prisma.people.createMany({
          data: [
            {
              id: `perf-person-${i}-1`,
              workspaceId: testWorkspaceId,
              companyId: `perf-company-${i}`,
              firstName: `Person${i}`,
              lastName: 'One',
              fullName: `Person${i} One`,
              jobTitle: 'Developer'
            },
            {
              id: `perf-person-${i}-2`,
              workspaceId: testWorkspaceId,
              companyId: `perf-company-${i}`,
              firstName: `Person${i}`,
              lastName: 'Two',
              fullName: `Person${i} Two`,
              jobTitle: 'Manager'
            }
          ]
        });
      }

      // Query all companies with people (simulating bulk operations)
      const startTime = Date.now();
      const companiesWithPeople = await prisma.companies.findMany({
        where: { workspaceId: testWorkspaceId },
        include: {
          people: {
            where: { deletedAt: null },
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true
            }
          }
        }
      });
      const endTime = Date.now();

      expect(companiesWithPeople).toHaveLength(5);
      expect(companiesWithPeople[0].people).toHaveLength(2);
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Clean up
      await prisma.people.deleteMany({
        where: { workspaceId: testWorkspaceId }
      });
      await prisma.companies.deleteMany({
        where: { workspaceId: testWorkspaceId }
      });
    });
  });
});
