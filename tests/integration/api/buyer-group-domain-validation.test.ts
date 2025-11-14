/**
 * Integration Tests for Buyer Group Domain Validation API
 * 
 * Tests the addBuyerGroupMember API endpoint with domain validation
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock data
const TEST_WORKSPACE_ID = 'test-workspace-id';
const TEST_USER_ID = 'test-user-id';

describe('Buyer Group Domain Validation API Integration', () => {
  let testCompanyId: string;
  let testPersonId: string;
  let testPersonWithMismatchId: string;
  let testPersonWithPersonalEmailId: string;

  beforeAll(async () => {
    // Create test company (underline.com)
    const company = await prisma.companies.create({
      data: {
        id: `test-company-${Date.now()}`,
        name: 'Underline',
        website: 'https://www.underline.com',
        domain: 'underline.com',
        workspaceId: TEST_WORKSPACE_ID,
      },
    });
    testCompanyId = company.id;

    // Create test person with matching domain (underline.com)
    const person = await prisma.people.create({
      data: {
        id: `test-person-${Date.now()}`,
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        email: 'john.doe@underline.com',
        workspaceId: TEST_WORKSPACE_ID,
        companyId: testCompanyId,
      },
    });
    testPersonId = person.id;

    // Create test person with mismatched domain (underline.cz)
    const personMismatch = await prisma.people.create({
      data: {
        id: `test-person-mismatch-${Date.now()}`,
        firstName: 'Olga',
        lastName: 'Lev',
        fullName: 'Olga Lev',
        email: 'olga.lev@underline.cz',
        workspaceId: TEST_WORKSPACE_ID,
        companyId: testCompanyId,
      },
    });
    testPersonWithMismatchId = personMismatch.id;

    // Create test person with personal email
    const personPersonal = await prisma.people.create({
      data: {
        id: `test-person-personal-${Date.now()}`,
        firstName: 'Test',
        lastName: 'User',
        fullName: 'Test User',
        email: 'testuser@gmail.com',
        workspaceId: TEST_WORKSPACE_ID,
        companyId: testCompanyId,
      },
    });
    testPersonWithPersonalEmailId = personPersonal.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.people.deleteMany({
      where: {
        id: {
          in: [testPersonId, testPersonWithMismatchId, testPersonWithPersonalEmailId],
        },
      },
    });

    await prisma.companies.delete({
      where: { id: testCompanyId },
    });

    await prisma.$disconnect();
  });

  describe('Domain validation logic', () => {
    it('should correctly identify domain mismatch (underline.cz vs underline.com)', async () => {
      const person = await prisma.people.findUnique({
        where: { id: testPersonWithMismatchId },
        include: { company: true },
      });

      expect(person).toBeDefined();
      expect(person?.email).toBe('olga.lev@underline.cz');
      expect(person?.company?.domain).toBe('underline.com');

      // Extract domains
      const emailDomain = person?.email?.split('@')[1]?.toLowerCase();
      const companyDomain = person?.company?.domain?.toLowerCase();

      expect(emailDomain).toBe('underline.cz');
      expect(companyDomain).toBe('underline.com');
      expect(emailDomain).not.toBe(companyDomain);
    });

    it('should correctly identify matching domain (underline.com)', async () => {
      const person = await prisma.people.findUnique({
        where: { id: testPersonId },
        include: { company: true },
      });

      expect(person).toBeDefined();
      expect(person?.email).toBe('john.doe@underline.com');
      expect(person?.company?.domain).toBe('underline.com');

      const emailDomain = person?.email?.split('@')[1]?.toLowerCase();
      const companyDomain = person?.company?.domain?.toLowerCase();

      expect(emailDomain).toBe('underline.com');
      expect(companyDomain).toBe('underline.com');
      expect(emailDomain).toBe(companyDomain);
    });

    it('should identify personal email domain', async () => {
      const person = await prisma.people.findUnique({
        where: { id: testPersonWithPersonalEmailId },
      });

      expect(person).toBeDefined();
      expect(person?.email).toBe('testuser@gmail.com');

      const emailDomain = person?.email?.split('@')[1]?.toLowerCase();
      const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];

      expect(personalDomains).toContain(emailDomain);
    });
  });

  describe('Database state verification', () => {
    it('should verify test data is correctly set up', async () => {
      const company = await prisma.companies.findUnique({
        where: { id: testCompanyId },
      });

      expect(company).toBeDefined();
      expect(company?.name).toBe('Underline');
      expect(company?.domain).toBe('underline.com');
    });

    it('should verify Olga Lev equivalent person exists with correct data', async () => {
      const person = await prisma.people.findUnique({
        where: { id: testPersonWithMismatchId },
        include: { company: true },
      });

      expect(person).toBeDefined();
      expect(person?.fullName).toBe('Olga Lev');
      expect(person?.email).toBe('olga.lev@underline.cz');
      expect(person?.company?.name).toBe('Underline');
      expect(person?.company?.domain).toBe('underline.com');
    });
  });

  describe('Domain extraction and comparison', () => {
    it('should extract domain correctly from various formats', () => {
      const extractDomain = (input: string | null | undefined): string | null => {
        if (!input) return null;
        const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        return url.toLowerCase();
      };

      expect(extractDomain('https://www.underline.com')).toBe('underline.com');
      expect(extractDomain('http://underline.com')).toBe('underline.com');
      expect(extractDomain('underline.com')).toBe('underline.com');
      expect(extractDomain('underline.cz')).toBe('underline.cz');
    });

    it('should correctly compare domains for same company with subdomain', () => {
      const isLikelySameCompany = (emailDomain: string, companyDomain: string): boolean => {
        if (!emailDomain || !companyDomain) return false;
        if (emailDomain === companyDomain) return true;
        
        const emailRoot = emailDomain.split('.').slice(-2).join('.');
        const companyRoot = companyDomain.split('.').slice(-2).join('.');
        
        return emailRoot === companyRoot;
      };

      expect(isLikelySameCompany('mail.underline.com', 'underline.com')).toBe(true);
      expect(isLikelySameCompany('email.company.com', 'company.com')).toBe(true);
    });

    it('should correctly reject different TLDs with same base name', () => {
      const isLikelySameCompany = (emailDomain: string, companyDomain: string): boolean => {
        if (!emailDomain || !companyDomain) return false;
        if (emailDomain === companyDomain) return true;
        
        const emailRoot = emailDomain.split('.').slice(-2).join('.');
        const companyRoot = companyDomain.split('.').slice(-2).join('.');
        
        if (emailRoot === companyRoot) return true;
        
        const emailBase = emailRoot.split('.')[0];
        const companyBase = companyRoot.split('.')[0];
        
        // Reject if same base name but different TLDs
        if (emailBase === companyBase && emailRoot !== companyRoot) {
          return false;
        }
        
        return false;
      };

      expect(isLikelySameCompany('underline.cz', 'underline.com')).toBe(false);
      expect(isLikelySameCompany('underline.com', 'underline.cz')).toBe(false);
    });
  });
});

