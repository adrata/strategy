/**
 * Unit Tests for Buyer Group Domain Validation
 * 
 * Tests the domain validation logic used in addBuyerGroupMember API
 */

import { describe, it, expect } from '@jest/globals';

/**
 * Extract domain from email or URL (same as in API)
 */
function extractDomain(input: string | null | undefined): string | null {
  if (!input) return null;
  const url = input.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  return url.toLowerCase();
}

/**
 * Check if email domain is likely from same company as company domain
 * (Same logic as in src/app/api/data/buyer-groups/route.ts)
 */
function isLikelySameCompany(emailDomain: string, companyDomain: string): boolean {
  if (!emailDomain || !companyDomain) {
    return false;
  }
  
  // Exact match (including TLD)
  if (emailDomain === companyDomain) {
    return true;
  }
  
  // Extract root domains (handle subdomains)
  const emailRoot = emailDomain.split('.').slice(-2).join('.');
  const companyRoot = companyDomain.split('.').slice(-2).join('.');
  
  // Same root domain = same company (e.g., mail.company.com === company.com)
  if (emailRoot === companyRoot) {
    return true;
  }
  
  // Check if email domain contains company name or vice versa
  const emailBase = emailRoot.split('.')[0];
  const companyBase = companyRoot.split('.')[0];
  
  // Reject if same base name but different TLDs (e.g., underline.com vs underline.cz)
  // This is the critical case we need to catch
  if (emailBase === companyBase && emailRoot !== companyRoot) {
    // Same base name, different TLD = likely different companies
    return false;
  }
  
  // If email domain is much longer and contains company name, likely same company
  if (emailDomain.length > companyDomain.length * 1.5) {
    return true;
  }
  
  // Default: if domains are different, be conservative and reject
  return false;
}

describe('Buyer Group Domain Validation', () => {
  describe('extractDomain', () => {
    it('should extract domain from email domain part', () => {
      // extractDomain is used on the domain part after splitting email
      expect(extractDomain('example.com')).toBe('example.com');
      expect(extractDomain('underline.cz')).toBe('underline.cz');
      // When used with email, it's called as: extractDomain(email.split('@')[1])
      expect(extractDomain('user@example.com'.split('@')[1])).toBe('example.com');
      expect(extractDomain('user@underline.cz'.split('@')[1])).toBe('underline.cz');
    });

    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.example.com')).toBe('example.com');
      expect(extractDomain('http://underline.com')).toBe('underline.com');
      expect(extractDomain('https://www.underline.com/path')).toBe('underline.com');
    });

    it('should handle null and undefined', () => {
      expect(extractDomain(null)).toBeNull();
      expect(extractDomain(undefined)).toBeNull();
      expect(extractDomain('')).toBeNull();
    });

    it('should remove www prefix', () => {
      expect(extractDomain('www.example.com')).toBe('example.com');
      expect(extractDomain('https://www.underline.com')).toBe('underline.com');
    });
  });

  describe('isLikelySameCompany', () => {
    describe('Cross-company contamination (critical case)', () => {
      it('should reject underline.cz when adding to underline.com buyer group', () => {
        const result = isLikelySameCompany('underline.cz', 'underline.com');
        expect(result).toBe(false);
      });

      it('should reject underline.com when adding to underline.cz buyer group', () => {
        const result = isLikelySameCompany('underline.com', 'underline.cz');
        expect(result).toBe(false);
      });

      it('should reject same base name with different TLDs', () => {
        expect(isLikelySameCompany('company.co.uk', 'company.com')).toBe(false);
        expect(isLikelySameCompany('company.io', 'company.com')).toBe(false);
        expect(isLikelySameCompany('company.org', 'company.com')).toBe(false);
      });
    });

    describe('Valid domain matches', () => {
      it('should accept exact domain match', () => {
        expect(isLikelySameCompany('underline.com', 'underline.com')).toBe(true);
        expect(isLikelySameCompany('example.com', 'example.com')).toBe(true);
      });

      it('should accept same root domain with subdomain', () => {
        expect(isLikelySameCompany('mail.underline.com', 'underline.com')).toBe(true);
        expect(isLikelySameCompany('email.company.com', 'company.com')).toBe(true);
        expect(isLikelySameCompany('www.underline.com', 'underline.com')).toBe(true);
      });

      it('should accept when email domain is significantly longer (abbreviation case)', () => {
        // e.g., portlandgeneral.com (email) vs pgn.com (website)
        expect(isLikelySameCompany('portlandgeneral.com', 'pgn.com')).toBe(true);
        expect(isLikelySameCompany('ribboncommunications.com', 'rbbn.com')).toBe(true);
      });
    });

    describe('Personal email domains', () => {
      it('should reject personal email domains', () => {
        // Note: Personal email check happens before isLikelySameCompany in API
        // But we test that different domains are rejected
        expect(isLikelySameCompany('gmail.com', 'company.com')).toBe(false);
        expect(isLikelySameCompany('yahoo.com', 'company.com')).toBe(false);
        expect(isLikelySameCompany('hotmail.com', 'company.com')).toBe(false);
      });
    });

    describe('Different companies', () => {
      it('should reject completely different companies', () => {
        expect(isLikelySameCompany('apple.com', 'microsoft.com')).toBe(false);
        expect(isLikelySameCompany('google.com', 'amazon.com')).toBe(false);
        expect(isLikelySameCompany('facebook.com', 'twitter.com')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle null/undefined domains', () => {
        expect(isLikelySameCompany('', 'example.com')).toBe(false);
        expect(isLikelySameCompany('example.com', '')).toBe(false);
        expect(isLikelySameCompany('', '')).toBe(false);
        expect(isLikelySameCompany(null as any, 'example.com')).toBe(false);
        expect(isLikelySameCompany('example.com', null as any)).toBe(false);
      });

      it('should handle single-label domains', () => {
        // Edge case: domains without TLD
        expect(isLikelySameCompany('localhost', 'localhost')).toBe(true);
      });

      it('should handle domains with multiple subdomains', () => {
        expect(isLikelySameCompany('mail.subdomain.example.com', 'example.com')).toBe(true);
        expect(isLikelySameCompany('email.subdomain.company.com', 'company.com')).toBe(true);
      });
    });

    describe('Real-world scenarios', () => {
      it('should handle the Olga Lev case correctly', () => {
        // Olga Lev: olga.lev@underline.cz
        // Buyer Group: Underline (underline.com)
        const emailDomain = extractDomain('underline.cz');
        const companyDomain = extractDomain('https://www.underline.com');
        
        expect(emailDomain).toBe('underline.cz');
        expect(companyDomain).toBe('underline.com');
        expect(isLikelySameCompany(emailDomain!, companyDomain!)).toBe(false);
      });

      it('should accept legitimate same-company cases', () => {
        // Same company, different subdomains
        expect(isLikelySameCompany('mail.company.com', 'company.com')).toBe(true);
        expect(isLikelySameCompany('email.company.com', 'www.company.com')).toBe(true);
      });
    });
  });

  describe('Integration scenarios', () => {
    it('should correctly validate email domain extraction and comparison', () => {
      const email = 'olga.lev@underline.cz';
      const companyWebsite = 'https://www.underline.com';
      
      const emailDomain = extractDomain(email.split('@')[1]);
      const companyDomain = extractDomain(companyWebsite);
      
      expect(emailDomain).toBe('underline.cz');
      expect(companyDomain).toBe('underline.com');
      expect(isLikelySameCompany(emailDomain!, companyDomain!)).toBe(false);
    });

    it('should correctly validate matching domains', () => {
      const email = 'john.doe@underline.com';
      const companyWebsite = 'https://www.underline.com';
      
      const emailDomain = extractDomain(email.split('@')[1]);
      const companyDomain = extractDomain(companyWebsite);
      
      expect(emailDomain).toBe('underline.com');
      expect(companyDomain).toBe('underline.com');
      expect(isLikelySameCompany(emailDomain!, companyDomain!)).toBe(true);
    });
  });
});

