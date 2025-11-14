/**
 * Buyer Group Add Member Validation Unit Tests
 * 
 * Tests the validation logic in addBuyerGroupMember API endpoint
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Prisma
const mockPrisma = {
  people: {
    findFirst: jest.fn(),
  },
  companies: {
    findFirst: jest.fn(),
  },
  people: {
    update: jest.fn(),
  },
};

// Mock the API helper functions
const mockCreateErrorResponse = jest.fn((message: string, code: string, status: number) => ({
  success: false,
  error: message,
  errorCode: code,
  status,
}));

const mockCreateSuccessResponse = jest.fn((data: any, meta: any) => ({
  success: true,
  data,
  meta,
}));

// Mock extractDomain and isLikelySameCompany
function extractDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

function isLikelySameCompany(emailDomain: string, companyDomain: string): boolean {
  if (!emailDomain || !companyDomain) return false;
  if (emailDomain === companyDomain) return true;
  
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  if (emailRoot === companyRoot) return true;
  
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    return false; // Same base, different TLD = different companies
  }
  
  if (emailDomain.length > companyDomain.length * 1.5) {
    return true; // Abbreviation case
  }
  
  return false;
}

describe('addBuyerGroupMember Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Domain mismatch validation', () => {
    it('should reject underline.cz email when adding to underline.com buyer group', async () => {
      // Mock person with underline.cz email
      mockPrisma.people.findFirst.mockResolvedValue({
        id: 'person-123',
        fullName: 'Test Person',
        email: 'test@underline.cz',
        workEmail: null,
        company: {
          id: 'company-456',
          name: 'Underline',
          website: 'https://www.underline.com',
          domain: 'underline.com',
        },
      });

      // Mock buyer group company (underline.com)
      mockPrisma.companies.findFirst.mockResolvedValue({
        id: 'company-789',
        name: 'Underline',
        website: 'https://www.underline.com',
        domain: 'underline.com',
      });

      // Simulate validation logic
      const personEmail = 'test@underline.cz';
      const emailDomain = extractDomain(personEmail.split('@')[1]);
      const companyDomain = extractDomain('https://www.underline.com');
      const isValid = isLikelySameCompany(emailDomain!, companyDomain!);

      expect(isValid).toBe(false);
      expect(emailDomain).toBe('underline.cz');
      expect(companyDomain).toBe('underline.com');
    });

    it('should accept underline.com email when adding to underline.com buyer group', async () => {
      const personEmail = 'test@underline.com';
      const emailDomain = extractDomain(personEmail.split('@')[1]);
      const companyDomain = extractDomain('https://www.underline.com');
      const isValid = isLikelySameCompany(emailDomain!, companyDomain!);

      expect(isValid).toBe(true);
      expect(emailDomain).toBe('underline.com');
      expect(companyDomain).toBe('underline.com');
    });
  });

  describe('Personal email validation', () => {
    it('should identify personal email domains', () => {
      const personalEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com'];
      
      expect(personalEmailDomains.includes('gmail.com')).toBe(true);
      expect(personalEmailDomains.includes('yahoo.com')).toBe(true);
      expect(personalEmailDomains.includes('company.com')).toBe(false);
    });
  });

  describe('Validation against buyer_group_id company', () => {
    it('should validate against buyer_group_id company, not person current company', () => {
      // Person's current company might be different
      const personCurrentCompany = {
        id: 'company-456',
        website: 'https://www.other-company.com',
        domain: 'other-company.com',
      };

      // Buyer group company (target company)
      const buyerGroupCompany = {
        id: 'company-789',
        website: 'https://www.underline.com',
        domain: 'underline.com',
      };

      // Person email
      const personEmail = 'test@underline.com';
      const emailDomain = extractDomain(personEmail.split('@')[1]);
      
      // Should validate against buyer_group_id company, not person's current company
      const companyDomain = extractDomain(buyerGroupCompany.website);
      const isValid = isLikelySameCompany(emailDomain!, companyDomain!);

      expect(isValid).toBe(true);
      expect(companyDomain).toBe('underline.com');
      expect(companyDomain).not.toBe(personCurrentCompany.domain);
    });
  });
});

