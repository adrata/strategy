/**
 * UNIT TESTS FOR VALIDATION FUNCTIONS
 * 
 * Demonstrates 2025 best practices for testing pure functions
 * 100% testable, no mocking required
 */

import {
  validateCompanyInput,
  validatePersonInput,
  validateRoleCriteria,
  validateCompanyDiscoveryCriteria,
  ValidationError,
  RequiredFieldError,
  InvalidFormatError
} from '../validation';

describe('Validation Functions', () => {
  describe('validateCompanyInput', () => {
    it('should validate correct input', () => {
      const input = { companyName: 'Salesforce' };
      const result = validateCompanyInput(input);
      
      expect(result.validated).toBe(true);
      expect(result.companyName).toBe('Salesforce');
    });

    it('should trim whitespace', () => {
      const input = { companyName: '  Salesforce  ' };
      const result = validateCompanyInput(input);
      
      expect(result.companyName).toBe('Salesforce');
    });

    it('should validate website URL', () => {
      const input = { 
        companyName: 'Salesforce',
        website: 'https://salesforce.com'
      };
      const result = validateCompanyInput(input);
      
      expect(result.website).toBe('https://salesforce.com');
    });

    it('should throw RequiredFieldError for missing company name', () => {
      expect(() => validateCompanyInput({ companyName: '' }))
        .toThrow(RequiredFieldError);
    });

    it('should throw ValidationError for short company name', () => {
      expect(() => validateCompanyInput({ companyName: 'A' }))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for long company name', () => {
      const longName = 'A'.repeat(201);
      expect(() => validateCompanyInput({ companyName: longName }))
        .toThrow(ValidationError);
    });

    it('should throw InvalidFormatError for invalid website', () => {
      expect(() => validateCompanyInput({ 
        companyName: 'Salesforce',
        website: 'not-a-url'
      })).toThrow(InvalidFormatError);
    });
  });

  describe('validatePersonInput', () => {
    it('should validate correct input', () => {
      const input = { name: 'John Doe', company: 'Salesforce' };
      const result = validatePersonInput(input);
      
      expect(result.validated).toBe(true);
      expect(result.name).toBe('John Doe');
      expect(result.company).toBe('Salesforce');
    });

    it('should throw RequiredFieldError for missing name', () => {
      expect(() => validatePersonInput({ name: '' }))
        .toThrow(RequiredFieldError);
    });

    it('should throw ValidationError for short name', () => {
      expect(() => validatePersonInput({ name: 'A' }))
        .toThrow(ValidationError);
    });
  });

  describe('validateRoleCriteria', () => {
    it('should validate correct criteria', () => {
      const criteria = {
        roles: ['VP Marketing'],
        companies: ['Salesforce'],
        enrichmentLevel: 'enrich' as const
      };
      const result = validateRoleCriteria(criteria);
      
      expect(result.validated).toBe(true);
      expect(result.roles).toEqual(['VP Marketing']);
      expect(result.companies).toEqual(['Salesforce']);
      expect(result.enrichmentLevel).toBe('enrich');
    });

    it('should default to discover enrichment level', () => {
      const criteria = {
        roles: ['VP Marketing'],
        companies: ['Salesforce']
      };
      const result = validateRoleCriteria(criteria);
      
      expect(result.enrichmentLevel).toBe('discover');
    });

    it('should throw ValidationError for empty roles', () => {
      expect(() => validateRoleCriteria({
        roles: [],
        companies: ['Salesforce']
      })).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty companies', () => {
      expect(() => validateRoleCriteria({
        roles: ['VP Marketing'],
        companies: []
      })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid enrichment level', () => {
      expect(() => validateRoleCriteria({
        roles: ['VP Marketing'],
        companies: ['Salesforce'],
        enrichmentLevel: 'invalid' as any
      })).toThrow(ValidationError);
    });
  });

  describe('validateCompanyDiscoveryCriteria', () => {
    it('should validate correct criteria', () => {
      const criteria = {
        firmographics: {
          industry: ['SaaS'],
          employeeRange: { min: 100, max: 1000 }
        },
        innovationProfile: {
          segment: 'innovators' as const
        },
        painSignals: ['hiring_spike'],
        minCompanyFitScore: 60,
        limit: 10
      };
      const result = validateCompanyDiscoveryCriteria(criteria);
      
      expect(result.validated).toBe(true);
      expect(result.firmographics?.industry).toEqual(['SaaS']);
      expect(result.innovationProfile?.segment).toBe('innovators');
    });

    it('should throw ValidationError for no search criteria', () => {
      expect(() => validateCompanyDiscoveryCriteria({}))
        .toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid innovation segment', () => {
      expect(() => validateCompanyDiscoveryCriteria({
        innovationProfile: { segment: 'invalid' as any }
      })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid score range', () => {
      expect(() => validateCompanyDiscoveryCriteria({
        firmographics: { industry: ['SaaS'] },
        minCompanyFitScore: 150
      })).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid employee range', () => {
      expect(() => validateCompanyDiscoveryCriteria({
        firmographics: { 
          industry: ['SaaS'],
          employeeRange: { min: 1000, max: 100 } // min > max
        }
      })).toThrow(ValidationError);
    });
  });
});
