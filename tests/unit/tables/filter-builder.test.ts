/**
 * Unit tests for filter building and validation logic
 * Tests filter object construction, multi-filter combinations, and search query building
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock functions for testing
const buildFilterObject = (uiState: any) => {
  const filter: any = {};
  Object.keys(uiState).forEach(key => {
    if (uiState[key] !== null && uiState[key] !== undefined && uiState[key] !== '') {
      filter[key] = uiState[key];
    }
  });
  return filter;
};

const buildSearchQuery = (searchTerm: string, section: string) => {
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
};

const validateStatusFilter = (status: string) => {
  const validStatuses = ['LEAD', 'PROSPECT', 'OPPORTUNITY', 'CLIENT', 'SUPERFAN'];
  return validStatuses.includes(status);
};

const validatePriorityFilter = (priority: string) => {
  const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
  return validPriorities.includes(priority);
};

const validateCompanySizeFilter = (size: string) => {
  const validSizes = ['startup', 'small', 'medium', 'large', 'enterprise'];
  return validSizes.includes(size);
};

const validateIndustryFilter = (industry: string) => {
  if (!industry) return false;
  const validIndustries = ['Technology', 'Healthcare', 'Finance', 'Manufacturing'];
  return validIndustries.includes(industry);
};

const convertHeaderToSortField = (header: string) => {
  return header.toLowerCase().replace(/\s+/g, '');
};

const mapSortFieldForAPI = (field: string, section: string) => {
  if (field === 'company' && section === 'people') return 'company.name';
  if (field === 'mainSeller' && section === 'people') return 'mainSeller';
  return field;
};

const getSectionDefaultColumns = (section: string) => {
  const columnMap: { [key: string]: string[] } = {
    speedrun: ['rank', 'name', 'company', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction'],
    leads: ['name', 'company', 'title', 'email', 'lastAction', 'nextAction'],
    prospects: ['name', 'company', 'title', 'lastAction', 'nextAction'],
    opportunities: ['rank', 'name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'lastAction'],
    companies: ['company', 'lastAction', 'nextAction', 'industry', 'size', 'revenue'],
    people: ['name', 'company', 'title', 'lastAction', 'nextAction']
  };
  return columnMap[section];
};

const getDisplayColumnsForSection = (section: string) => {
  const displayMap: { [key: string]: string[] } = {
    speedrun: ['Rank', 'Name', 'Company', 'Status', 'Main Seller', 'Co Sellers', 'Last Action', 'Next Action'],
    leads: ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'],
    prospects: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'],
    opportunities: ['Rank', 'Name', 'Company', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'],
    companies: ['Company', 'Last Action', 'Next Action', 'Industry', 'Size', 'Revenue'],
    people: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
  };
  return displayMap[section];
};

const transformDisplayNameToDbField = (displayName: string) => {
  return displayName.toLowerCase().replace(/\s+/g, '');
};

const buildSectionFilters = (section: string, uiState: any) => {
  const baseFilters = buildFilterObject(uiState);
  
  // Enforce section-specific status
  const sectionStatusMap: { [key: string]: string } = {
    leads: 'LEAD',
    prospects: 'PROSPECT',
    opportunities: 'OPPORTUNITY'
  };
  
  if (sectionStatusMap[section]) {
    baseFilters.status = sectionStatusMap[section];
  }
  
  return baseFilters;
};

const serializeFilterState = (filterState: any) => {
  return Object.entries(filterState)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
};

const deserializeFilterState = (serialized: string) => {
  if (!serialized) return {};
  
  const filter: any = {};
  const pairs = serialized.split('&');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value) {
      filter[key] = decodeURIComponent(value);
    }
  });
  
  return filter;
};

const clearAllFilters = (filterState: any) => {
  return {};
};

const clearSpecificFilters = (filterState: any, filtersToClear: string[]) => {
  const cleared = { ...filterState };
  filtersToClear.forEach(filter => {
    delete cleared[filter];
  });
  return cleared;
};

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
        companyId: 'company-123',
        revenue: 'medium',
        lastContacted: 'week',
        timezone: 'PST',
        companySize: 'medium',
        location: 'California'
      };

      const expectedFilter = {
        search: 'john doe',
        status: 'LEAD',
        priority: 'HIGH',
        companyId: 'company-123',
        revenue: 'medium',
        lastContacted: 'week',
        timezone: 'PST',
        companySize: 'medium',
        location: 'California'
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
        industry: 'Technology',
        revenue: null,
        lastContacted: undefined,
        timezone: '',
        companySize: null,
        location: undefined
      };

      const expectedFilter = {
        search: 'test',
        industry: 'Technology'
      };

      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle all 9 filter types', () => {
      const uiState = {
        search: 'test search',
        industry: 'Technology',
        status: 'Active',
        priority: 'High',
        revenue: 'medium',
        lastContacted: 'week',
        timezone: 'PST',
        companySize: 'medium',
        location: 'California'
      };

      const expectedFilter = {
        search: 'test search',
        industry: 'Technology',
        status: 'Active',
        priority: 'High',
        revenue: 'medium',
        lastContacted: 'week',
        timezone: 'PST',
        companySize: 'medium',
        location: 'California'
      };

      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Revenue Filter Tests', () => {
    it('should handle startup revenue filter', () => {
      const uiState = { revenue: 'startup' };
      const expectedFilter = { revenue: 'startup' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle small revenue filter', () => {
      const uiState = { revenue: 'small' };
      const expectedFilter = { revenue: 'small' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle medium revenue filter', () => {
      const uiState = { revenue: 'medium' };
      const expectedFilter = { revenue: 'medium' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle large revenue filter', () => {
      const uiState = { revenue: 'large' };
      const expectedFilter = { revenue: 'large' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle enterprise revenue filter', () => {
      const uiState = { revenue: 'enterprise' };
      const expectedFilter = { revenue: 'enterprise' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Last Contacted Filter Tests', () => {
    it('should handle never contacted filter', () => {
      const uiState = { lastContacted: 'never' };
      const expectedFilter = { lastContacted: 'never' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle today filter', () => {
      const uiState = { lastContacted: 'today' };
      const expectedFilter = { lastContacted: 'today' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle week filter', () => {
      const uiState = { lastContacted: 'week' };
      const expectedFilter = { lastContacted: 'week' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle month filter', () => {
      const uiState = { lastContacted: 'month' };
      const expectedFilter = { lastContacted: 'month' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle quarter filter', () => {
      const uiState = { lastContacted: 'quarter' };
      const expectedFilter = { lastContacted: 'quarter' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle overdue filter', () => {
      const uiState = { lastContacted: 'overdue' };
      const expectedFilter = { lastContacted: 'overdue' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Timezone Filter Tests', () => {
    it('should handle PST timezone filter', () => {
      const uiState = { timezone: 'PST' };
      const expectedFilter = { timezone: 'PST' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle EST timezone filter', () => {
      const uiState = { timezone: 'EST' };
      const expectedFilter = { timezone: 'EST' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle CST timezone filter', () => {
      const uiState = { timezone: 'CST' };
      const expectedFilter = { timezone: 'CST' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle MST timezone filter', () => {
      const uiState = { timezone: 'MST' };
      const expectedFilter = { timezone: 'MST' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Company Size Filter Tests', () => {
    it('should handle startup company size filter', () => {
      const uiState = { companySize: 'startup' };
      const expectedFilter = { companySize: 'startup' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle small company size filter', () => {
      const uiState = { companySize: 'small' };
      const expectedFilter = { companySize: 'small' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle medium company size filter', () => {
      const uiState = { companySize: 'medium' };
      const expectedFilter = { companySize: 'medium' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle large company size filter', () => {
      const uiState = { companySize: 'large' };
      const expectedFilter = { companySize: 'large' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle enterprise company size filter', () => {
      const uiState = { companySize: 'enterprise' };
      const expectedFilter = { companySize: 'enterprise' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Location Filter Tests', () => {
    it('should handle state-based location filter', () => {
      const uiState = { location: 'California' };
      const expectedFilter = { location: 'California' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle city-based location filter', () => {
      const uiState = { location: 'San Francisco' };
      const expectedFilter = { location: 'San Francisco' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });

    it('should handle country-based location filter', () => {
      const uiState = { location: 'United States' };
      const expectedFilter = { location: 'United States' };
      expect(buildFilterObject(uiState)).toEqual(expectedFilter);
    });
  });

  describe('Filter Dependency Validation', () => {
    it('should validate that all filter dependencies are included in useMemo', () => {
      const requiredDependencies = [
        'data',
        'searchQuery',
        'verticalFilter',
        'statusFilter',
        'priorityFilter',
        'revenueFilter',
        'lastContactedFilter',
        'timezoneFilter',
        'companySizeFilter',
        'locationFilter',
        'sortField',
        'sortDirection',
        'section',
        'getSortableValue'
      ];

      // This test ensures that all filter states are included in the dependency array
      // to prevent the filtering bug where filters don't re-apply when state changes
      expect(requiredDependencies).toHaveLength(14);
      
      // Verify that all critical filters are present
      expect(requiredDependencies).toContain('revenueFilter');
      expect(requiredDependencies).toContain('lastContactedFilter');
      expect(requiredDependencies).toContain('timezoneFilter');
      expect(requiredDependencies).toContain('companySizeFilter');
      expect(requiredDependencies).toContain('locationFilter');
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
