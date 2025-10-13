/**
 * Unit tests for filter building and validation logic
 * Tests filter object construction, multi-filter combinations, and search query building
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Filter Builder Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Filter Object Construction', () => {
    it('should build basic filter object from UI state', () => {
      const uiState = {
        search: 'john doe',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      const expectedFilter = {
        search: 'john doe',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle empty filter state', () => {
      const uiState = {};
      const expectedFilter = {};

      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should filter out null and undefined values', () => {
      const uiState = {
        search: 'test',
        status: null,
        priority: undefined,
        companyId: '',
        industry: 'Technology'
      };

      const expectedFilter = {
        search: 'test',
        industry: 'Technology'
      };

      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Multi-Filter Combinations', () => {
    it('should combine search with status filter correctly', () => {
      const uiState = {
        search: 'john',
        status: 'LEAD'
      };

      const result = buildFilterObject(uiState);
      
      expect(result.search).toBe('john');
      expect(result.status).toBe('LEAD');
    });

    it('should combine multiple filters correctly', () => {
      const uiState = {
        search: 'acme',
        status: 'PROSPECT',
        priority: 'HIGH',
        industry: 'Technology',
        companySize: 'medium'
      };

      const result = buildFilterObject(uiState);
      
      expect(result).toEqual({
        search: 'acme',
        status: 'PROSPECT',
        priority: 'HIGH',
        industry: 'Technology',
        companySize: 'medium'
      });
    });

    it('should handle conflicting filters gracefully', () => {
      const uiState = {
        status: 'LEAD',
        status: 'PROSPECT' // This should override the first one
      };

      const result = buildFilterObject(uiState);
      
      expect(result.status).toBe('PROSPECT');
    });
  });

  describe('Search Query Building', () => {
    it('should build search query for people section', () => {
      const searchTerm = 'john doe';
      const section = 'people';

      const expectedQuery = {
        OR: [
          { firstName: { contains: 'john doe', mode: 'insensitive' } },
          { lastName: { contains: 'john doe', mode: 'insensitive' } },
          { fullName: { contains: 'john doe', mode: 'insensitive' } },
          { email: { contains: 'john doe', mode: 'insensitive' } },
          { workEmail: { contains: 'john doe', mode: 'insensitive' } },
          { jobTitle: { contains: 'john doe', mode: 'insensitive' } },
          { department: { contains: 'john doe', mode: 'insensitive' } }
        ]
      };

      expect(buildSearchQuery(searchTerm, section)).toEqual(expectedQuery);
    });

    it('should build search query for companies section', () => {
      const searchTerm = 'acme corp';
      const section = 'companies';

      const expectedQuery = {
        OR: [
          { name: { contains: 'acme corp', mode: 'insensitive' } },
          { legalName: { contains: 'acme corp', mode: 'insensitive' } },
          { tradingName: { contains: 'acme corp', mode: 'insensitive' } },
          { email: { contains: 'acme corp', mode: 'insensitive' } },
          { website: { contains: 'acme corp', mode: 'insensitive' } },
          { domain: { contains: 'acme corp', mode: 'insensitive' } }
        ]
      };

      expect(buildSearchQuery(searchTerm, section)).toEqual(expectedQuery);
    });

    it('should handle empty search term', () => {
      const searchTerm = '';
      const section = 'people';

      expect(buildSearchQuery(searchTerm, section)).toBeNull();
    });

    it('should handle unknown section gracefully', () => {
      const searchTerm = 'test';
      const section = 'unknown';

      expect(buildSearchQuery(searchTerm, section)).toBeNull();
    });
  });

  describe('Filter Validation', () => {
    it('should validate status filter values', () => {
      const validStatuses = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'SUPERFAN'];
      
      validStatuses.forEach(status => {
        expect(validateStatusFilter(status)).toBe(true);
      });

      expect(validateStatusFilter('INVALID')).toBe(false);
      expect(validateStatusFilter('')).toBe(false);
    });

    it('should validate priority filter values', () => {
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
      
      validPriorities.forEach(priority => {
        expect(validatePriorityFilter(priority)).toBe(true);
      });

      expect(validatePriorityFilter('INVALID')).toBe(false);
      expect(validatePriorityFilter('')).toBe(false);
    });

    it('should validate company size filter values', () => {
      const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
      
      validSizes.forEach(size => {
        expect(validateCompanySizeFilter(size)).toBe(true);
      });

      expect(validateCompanySizeFilter('INVALID')).toBe(false);
    });

    it('should validate industry filter values', () => {
      const validIndustries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing'];
      
      validIndustries.forEach(industry => {
        expect(validateIndustryFilter(industry)).toBe(true);
      });

      expect(validateIndustryFilter('')).toBe(false);
    });
  });

  describe('Section-Specific Filters', () => {
    it('should build leads section filters correctly', () => {
      const uiState = {
        search: 'john',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      const result = buildSectionFilters('leads', uiState);
      
      expect(result.status).toBe('LEAD'); // Should be enforced
      expect(result.search).toBe('john');
      expect(result.priority).toBe('HIGH');
      expect(result.companyId).toBe('company-123');
    });

    it('should build prospects section filters correctly', () => {
      const uiState = {
        search: 'jane',
        status: 'PROSPECT',
        priority: 'MEDIUM'
      };

      const result = buildSectionFilters('prospects', uiState);
      
      expect(result.status).toBe('PROSPECT'); // Should be enforced
      expect(result.search).toBe('jane');
      expect(result.priority).toBe('MEDIUM');
    });

    it('should build opportunities section filters correctly', () => {
      const uiState = {
        search: 'deal',
        status: 'OPPORTUNITY',
        stage: 'proposal',
        amount: '100000'
      };

      const result = buildSectionFilters('opportunities', uiState);
      
      expect(result.status).toBe('OPPORTUNITY'); // Should be enforced
      expect(result.search).toBe('deal');
      expect(result.stage).toBe('proposal');
      expect(result.amount).toBe('100000');
    });

    it('should build companies section filters correctly', () => {
      const uiState = {
        search: 'acme',
        industry: 'Technology',
        companySize: 'medium',
        location: 'San Francisco'
      };

      const result = buildSectionFilters('companies', uiState);
      
      expect(result.search).toBe('acme');
      expect(result.industry).toBe('Technology');
      expect(result.companySize).toBe('medium');
      expect(result.location).toBe('San Francisco');
    });
  });

  describe('Filter State Persistence', () => {
    it('should serialize filter state correctly', () => {
      const filterState = {
        search: 'test',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      const serialized = serializeFilterState(filterState);
      const expected = 'search=test&status=LEAD&priority=HIGH&companyId=company-123';

      expect(serialized).toBe(expected);
    });

    it('should deserialize filter state correctly', () => {
      const serialized = 'search=test&status=LEAD&priority=HIGH&companyId=company-123';
      const expected = {
        search: 'test',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      expect(deserializeFilterState(serialized)).toEqual(expected);
    });

    it('should handle empty serialized state', () => {
      expect(deserializeFilterState('')).toEqual({});
      expect(deserializeFilterState(null)).toEqual({});
    });
  });

  describe('Clear Filters Functionality', () => {
    it('should clear all filters correctly', () => {
      const filterState = {
        search: 'test',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123',
        industry: 'Technology'
      };

      const cleared = clearAllFilters(filterState);
      const expected = {};

      expect(cleared).toEqual(expected);
    });

    it('should clear specific filters correctly', () => {
      const filterState = {
        search: 'test',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123'
      };

      const cleared = clearSpecificFilters(filterState, ['status', 'priority']);
      const expected = {
        search: 'test',
        companyId: 'company-123'
      };

      expect(cleared).toEqual(expected);
    });
  });
});

// Helper functions for testing
function buildFilterObject(uiState: Record<string, any>): Record<string, any> {
  const filter: Record<string, any> = {};
  
  Object.entries(uiState).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      filter[key] = value;
    }
  });
  
  return filter;
}

function buildSearchQuery(searchTerm: string, section: string): any {
  if (!searchTerm) return null;

  const searchFields = {
    people: ['firstName', 'lastName', 'fullName', 'email', 'workEmail', 'jobTitle', 'department'],
    companies: ['name', 'legalName', 'tradingName', 'email', 'website', 'domain'],
    speedrun: ['firstName', 'lastName', 'fullName', 'email', 'jobTitle']
  };

  const fields = searchFields[section as keyof typeof searchFields];
  if (!fields) return null;

  return {
    OR: fields.map(field => ({
      [field]: { contains: searchTerm, mode: 'insensitive' }
    }))
  };
}

function validateStatusFilter(status: string): boolean {
  const validStatuses = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'SUPERFAN'];
  return validStatuses.includes(status);
}

function validatePriorityFilter(priority: string): boolean {
  const validPriorities = ['LOW', 'MEDIUM', 'HIGH'];
  return validPriorities.includes(priority);
}

function validateCompanySizeFilter(size: string): boolean {
  const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
  return validSizes.includes(size);
}

function validateIndustryFilter(industry: string): boolean {
  return industry && industry.length > 0;
}

function buildSectionFilters(section: string, uiState: Record<string, any>): Record<string, any> {
  const baseFilters = buildFilterObject(uiState);
  
  // Enforce section-specific status
  const sectionStatusMap: Record<string, string> = {
    leads: 'LEAD',
    prospects: 'PROSPECT',
    opportunities: 'OPPORTUNITY'
  };
  
  if (sectionStatusMap[section]) {
    baseFilters.status = sectionStatusMap[section];
  }
  
  return baseFilters;
}

function serializeFilterState(filterState: Record<string, any>): string {
  return Object.entries(filterState)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
}

function deserializeFilterState(serialized: string): Record<string, any> {
  if (!serialized) return {};
  
  const filter: Record<string, any> = {};
  const pairs = serialized.split('&');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      filter[key] = decodeURIComponent(value);
    }
  });
  
  return filter;
}

function clearAllFilters(filterState: Record<string, any>): Record<string, any> {
  return {};
}

function clearSpecificFilters(filterState: Record<string, any>, filtersToClear: string[]): Record<string, any> {
  const cleared = { ...filterState };
  filtersToClear.forEach(filter => {
    delete cleared[filter];
  });
  return cleared;
}
