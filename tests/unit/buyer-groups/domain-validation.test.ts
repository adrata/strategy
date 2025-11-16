/**
 * Buyer Group Domain Validation Unit Tests
 * 
 * Tests the domain validation logic that prevents cross-company contamination
 * (e.g., underline.cz vs underline.com)
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
 * Check if email domain is likely from the same company as company domain
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
    it('should extract domain from email', () => {
      expect(extractDomain('user@example.com')).toBe('example.com');
      expect(extractDomain('user@underline.cz')).toBe('underline.cz');
    });

    it('should extract domain from URL', () => {
      expect(extractDomain('https://www.underline.com')).toBe('underline.com');
      expect(extractDomain('http://underline.com')).toBe('underline.com');
      expect(extractDomain('www.underline.com')).toBe('underline.com');
    });

    it('should handle null/undefined', () => {
      expect(extractDomain(null)).toBeNull();
      expect(extractDomain(undefined)).toBeNull();
      expect(extractDomain('')).toBeNull();
    });
  });

  describe('isLikelySameCompany', () => {
    describe('Cross-company contamination (CRITICAL)', () => {
      it('should reject underline.cz when adding to underline.com buyer group', () => {
        const result = isLikelySameCompany('underline.cz', 'underline.com');
        expect(result).toBe(false);
      });

      it('should reject same base name with different TLDs', () => {
        expect(isLikelySameCompany('company.co.uk', 'company.com')).toBe(false);
        expect(isLikelySameCompany('company.fr', 'company.com')).toBe(false);
        expect(isLikelySameCompany('company.de', 'company.com')).toBe(false);
      });
    });

    describe('Valid domain matches', () => {
      it('should accept exact domain match', () => {
        expect(isLikelySameCompany('underline.com', 'underline.com')).toBe(true);
        expect(isLikelySameCompany('example.com', 'example.com')).toBe(true);
      });

      it('should accept same root domain with subdomain', () => {
        expect(isLikelySameCompany('mail.underline.com', 'underline.com')).toBe(true);
        expect(isLikelySameCompany('www.underline.com', 'underline.com')).toBe(true);
        expect(isLikelySameCompany('email.company.com', 'company.com')).toBe(true);
      });
    });

    describe('Different companies', () => {
      it('should reject completely different domains', () => {
        expect(isLikelySameCompany('apple.com', 'microsoft.com')).toBe(false);
        expect(isLikelySameCompany('google.com', 'amazon.com')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle null/undefined domains', () => {
        expect(isLikelySameCompany(null as any, 'company.com')).toBe(false);
        expect(isLikelySameCompany('email.com', null as any)).toBe(false);
        expect(isLikelySameCompany(null as any, null as any)).toBe(false);
      });

      it('should handle empty strings', () => {
        expect(isLikelySameCompany('', 'company.com')).toBe(false);
        expect(isLikelySameCompany('email.com', '')).toBe(false);
      });
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle portlandgeneral.com vs pgn.com (abbreviation case)', () => {
      // This is a legitimate case where email domain is longer
      const result = isLikelySameCompany('portlandgeneral.com', 'pgn.com');
      // Should accept if email domain is significantly longer
      expect(result).toBe(true);
    });

    it('should reject personal email domains', () => {
      // Note: Personal email rejection is handled separately in API
      // This test just verifies domain matching logic
      expect(isLikelySameCompany('gmail.com', 'company.com')).toBe(false);
      expect(isLikelySameCompany('yahoo.com', 'company.com')).toBe(false);
    });
  });
});



