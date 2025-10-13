/**
 * Unit tests for sort mapping and validation logic
 * Tests sort field mapping, sort direction handling, and column header to sort field conversion
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

describe('Sort Mapping Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sort Field Mapping', () => {
    it('should map UI field names to database field names correctly', () => {
      const fieldMappings = {
        people: {
          'rank': 'globalRank',
          'name': 'fullName',
          'title': 'jobTitle',
          'lastAction': 'lastActionDate',
          'nextAction': 'nextActionDate',
          'company': 'company.name',
          'status': 'status',
          'priority': 'priority',
          'createdAt': 'createdAt'
        },
        companies: {
          'rank': 'globalRank',
          'name': 'name',
          'lastAction': 'lastActionDate',
          'nextAction': 'nextActionDate',
          'industry': 'industry',
          'size': 'size',
          'revenue': 'revenue',
          'createdAt': 'createdAt'
        },
        speedrun: {
          'rank': 'globalRank',
          'name': 'fullName',
          'company': 'company.name',
          'status': 'status',
          'lastAction': 'lastActionDate',
          'nextAction': 'nextActionDate',
          'createdAt': 'createdAt'
        }
      };

      Object.entries(fieldMappings).forEach(([section, mappings]) => {
        Object.entries(mappings).forEach(([uiField, dbField]) => {
          expect(mapSortField(uiField, section)).toBe(dbField);
        });
      });
    });

    it('should handle unknown field names gracefully', () => {
      expect(mapSortField('unknownField', 'people')).toBe('unknownField');
      expect(mapSortField('', 'people')).toBe('');
    });

    it('should handle unknown sections gracefully', () => {
      expect(mapSortField('name', 'unknownSection')).toBe('name');
    });
  });

  describe('Sort Direction Handling', () => {
    it('should toggle sort direction correctly', () => {
      expect(toggleSortDirection('asc')).toBe('desc');
      expect(toggleSortDirection('desc')).toBe('asc');
    });

    it('should handle invalid sort directions', () => {
      expect(toggleSortDirection('invalid')).toBe('asc');
      expect(toggleSortDirection('')).toBe('asc');
    });

    it('should determine sort direction for new field', () => {
      expect(getSortDirectionForNewField('name', 'people')).toBe('asc');
      expect(getSortDirectionForNewField('createdAt', 'people')).toBe('desc');
    });
  });

  describe('Column Header to Sort Field Conversion', () => {
    it('should convert column headers to sort fields correctly', () => {
      const headerMappings = {
        'Rank': 'rank',
        'Name': 'name',
        'Company': 'company',
        'Title': 'title',
        'Email': 'email',
        'Phone': 'phone',
        'Status': 'status',
        'Priority': 'priority',
        'Last Action': 'lastAction',
        'Next Action': 'nextAction',
        'Main-Seller': 'mainSeller',
        'Co-Sellers': 'coSellers',
        'Industry': 'industry',
        'Size': 'size',
        'Revenue': 'revenue',
        'Amount': 'amount',
        'Stage': 'stage',
        'Probability': 'probability',
        'Close Date': 'closeDate'
      };

      Object.entries(headerMappings).forEach(([header, expectedField]) => {
        expect(convertHeaderToSortField(header)).toBe(expectedField);
      });
    });

    it('should handle unknown column headers', () => {
      expect(convertHeaderToSortField('Unknown Header')).toBe('unknownHeader');
      expect(convertHeaderToSortField('')).toBe('');
    });
  });

  describe('Default Sort Configurations', () => {
    it('should return correct default sort for each section', () => {
      const defaultSorts = {
        speedrun: { field: 'globalRank', direction: 'asc' },
        leads: { field: 'fullName', direction: 'asc' },
        prospects: { field: 'lastActionDate', direction: 'asc' },
        opportunities: { field: 'globalRank', direction: 'asc' },
        companies: { field: 'name', direction: 'asc' },
        people: { field: 'fullName', direction: 'asc' }
      };

      Object.entries(defaultSorts).forEach(([section, expected]) => {
        expect(getDefaultSortForSection(section)).toEqual(expected);
      });
    });

    it('should handle unknown sections with fallback', () => {
      const fallback = { field: 'createdAt', direction: 'desc' };
      expect(getDefaultSortForSection('unknown')).toEqual(fallback);
    });
  });

  describe('Sort Field Validation', () => {
    it('should validate sort fields for people section', () => {
      const validFields = ['globalRank', 'fullName', 'firstName', 'lastName', 'email', 'jobTitle', 'lastActionDate', 'createdAt', 'status', 'priority'];
      const invalidFields = ['invalidField', 'nonExistentField'];

      validFields.forEach(field => {
        expect(validateSortField(field, 'people')).toBe(true);
      });

      invalidFields.forEach(field => {
        expect(validateSortField(field, 'people')).toBe(false);
      });
    });

    it('should validate sort fields for companies section', () => {
      const validFields = ['globalRank', 'name', 'industry', 'size', 'revenue', 'lastActionDate', 'createdAt', 'status', 'priority'];
      const invalidFields = ['invalidField', 'nonExistentField'];

      validFields.forEach(field => {
        expect(validateSortField(field, 'companies')).toBe(true);
      });

      invalidFields.forEach(field => {
        expect(validateSortField(field, 'companies')).toBe(false);
      });
    });

    it('should validate sort fields for speedrun section', () => {
      const validFields = ['globalRank', 'fullName', 'company.name', 'status', 'lastActionDate', 'createdAt'];
      const invalidFields = ['invalidField', 'nonExistentField'];

      validFields.forEach(field => {
        expect(validateSortField(field, 'speedrun')).toBe(true);
      });

      invalidFields.forEach(field => {
        expect(validateSortField(field, 'speedrun')).toBe(false);
      });
    });
  });

  describe('Sort State Management', () => {
    it('should update sort state correctly', () => {
      const currentState = { field: 'name', direction: 'asc' };
      const newField = 'status';

      const updatedState = updateSortState(currentState, newField);
      const expected = { field: 'status', direction: 'asc' };

      expect(updatedState).toEqual(expected);
    });

    it('should toggle direction when same field is clicked', () => {
      const currentState = { field: 'name', direction: 'asc' };
      const sameField = 'name';

      const updatedState = updateSortState(currentState, sameField);
      const expected = { field: 'name', direction: 'desc' };

      expect(updatedState).toEqual(expected);
    });

    it('should handle invalid sort state', () => {
      const invalidState = { field: '', direction: 'invalid' };
      const newField = 'name';

      const updatedState = updateSortState(invalidState, newField);
      const expected = { field: 'name', direction: 'asc' };

      expect(updatedState).toEqual(expected);
    });
  });

  describe('Sort Field Mapping for API', () => {
    it('should map sort fields for API requests correctly', () => {
      const apiMappings = {
        people: {
          'rank': 'globalRank',
          'name': 'fullName',
          'title': 'jobTitle',
          'lastAction': 'lastActionDate',
          'company': 'company.name'
        },
        companies: {
          'rank': 'globalRank',
          'name': 'name',
          'lastAction': 'lastActionDate',
          'industry': 'industry'
        },
        speedrun: {
          'rank': 'globalRank',
          'name': 'fullName',
          'company': 'company.name',
          'lastAction': 'lastActionDate'
        }
      };

      Object.entries(apiMappings).forEach(([section, mappings]) => {
        Object.entries(mappings).forEach(([uiField, apiField]) => {
          expect(mapSortFieldForAPI(uiField, section)).toBe(apiField);
        });
      });
    });

    it('should handle nested field mappings', () => {
      expect(mapSortFieldForAPI('company', 'people')).toBe('company.name');
      expect(mapSortFieldForAPI('mainSeller', 'people')).toBe('mainSeller.name');
      expect(mapSortFieldForAPI('coSellers', 'people')).toBe('coSellers');
    });
  });

  describe('Sort Persistence', () => {
    it('should serialize sort state correctly', () => {
      const sortState = { field: 'name', direction: 'asc' };
      const serialized = serializeSortState(sortState);
      const expected = 'field=name&direction=asc';

      expect(serialized).toBe(expected);
    });

    it('should deserialize sort state correctly', () => {
      const serialized = 'field=name&direction=asc';
      const expected = { field: 'name', direction: 'asc' };

      expect(deserializeSortState(serialized)).toEqual(expected);
    });

    it('should handle empty serialized state', () => {
      const fallback = { field: 'createdAt', direction: 'desc' };
      expect(deserializeSortState('')).toEqual(fallback);
      expect(deserializeSortState(null)).toEqual(fallback);
    });
  });
});

// Helper functions for testing
function mapSortField(uiField: string, section: string): string {
  const fieldMappings: Record<string, Record<string, string>> = {
    people: {
      'rank': 'globalRank',
      'name': 'fullName',
      'title': 'jobTitle',
      'lastAction': 'lastActionDate',
      'nextAction': 'nextActionDate',
      'company': 'company.name',
      'status': 'status',
      'priority': 'priority',
      'createdAt': 'createdAt'
    },
    companies: {
      'rank': 'globalRank',
      'name': 'name',
      'lastAction': 'lastActionDate',
      'nextAction': 'nextActionDate',
      'industry': 'industry',
      'size': 'size',
      'revenue': 'revenue',
      'createdAt': 'createdAt'
    },
    speedrun: {
      'rank': 'globalRank',
      'name': 'fullName',
      'company': 'company.name',
      'status': 'status',
      'lastAction': 'lastActionDate',
      'nextAction': 'nextActionDate',
      'createdAt': 'createdAt'
    }
  };

  return fieldMappings[section]?.[uiField] || uiField;
}

function toggleSortDirection(currentDirection: string): string {
  return currentDirection === 'asc' ? 'desc' : 'asc';
}

function getSortDirectionForNewField(field: string, section: string): string {
  // Date fields typically default to desc, others to asc
  const dateFields = ['createdAt', 'lastActionDate', 'nextActionDate'];
  return dateFields.includes(field) ? 'desc' : 'asc';
}

function convertHeaderToSortField(header: string): string {
  const headerMappings: Record<string, string> = {
    'Rank': 'rank',
    'Name': 'name',
    'Company': 'company',
    'Title': 'title',
    'Email': 'email',
    'Phone': 'phone',
    'Status': 'status',
    'Priority': 'priority',
    'Last Action': 'lastAction',
    'Next Action': 'nextAction',
    'Main-Seller': 'mainSeller',
    'Co-Sellers': 'coSellers',
    'Industry': 'industry',
    'Size': 'size',
    'Revenue': 'revenue',
    'Amount': 'amount',
    'Stage': 'stage',
    'Probability': 'probability',
    'Close Date': 'closeDate'
  };

  return headerMappings[header] || header.toLowerCase().replace(/\s+/g, '');
}

function getDefaultSortForSection(section: string): { field: string; direction: string } {
  const defaultSorts: Record<string, { field: string; direction: string }> = {
    speedrun: { field: 'globalRank', direction: 'asc' },
    leads: { field: 'fullName', direction: 'asc' },
    prospects: { field: 'lastActionDate', direction: 'asc' },
    opportunities: { field: 'globalRank', direction: 'asc' },
    companies: { field: 'name', direction: 'asc' },
    people: { field: 'fullName', direction: 'asc' }
  };

  return defaultSorts[section] || { field: 'createdAt', direction: 'desc' };
}

function validateSortField(field: string, section: string): boolean {
  const validFields: Record<string, string[]> = {
    people: ['globalRank', 'fullName', 'firstName', 'lastName', 'email', 'jobTitle', 'lastActionDate', 'createdAt', 'status', 'priority'],
    companies: ['globalRank', 'name', 'industry', 'size', 'revenue', 'lastActionDate', 'createdAt', 'status', 'priority'],
    speedrun: ['globalRank', 'fullName', 'company.name', 'status', 'lastActionDate', 'createdAt']
  };

  return validFields[section]?.includes(field) || false;
}

function updateSortState(currentState: { field: string; direction: string }, newField: string): { field: string; direction: string } {
  if (!newField) {
    return { field: 'createdAt', direction: 'desc' };
  }

  if (currentState.field === newField) {
    return { field: newField, direction: toggleSortDirection(currentState.direction) };
  }

  return { field: newField, direction: getSortDirectionForNewField(newField, 'people') };
}

function mapSortFieldForAPI(uiField: string, section: string): string {
  return mapSortField(uiField, section);
}

function serializeSortState(sortState: { field: string; direction: string }): string {
  return `field=${encodeURIComponent(sortState.field)}&direction=${encodeURIComponent(sortState.direction)}`;
}

function deserializeSortState(serialized: string): { field: string; direction: string } {
  if (!serialized) {
    return { field: 'createdAt', direction: 'desc' };
  }

  const params = new URLSearchParams(serialized);
  const field = params.get('field') || 'createdAt';
  const direction = params.get('direction') || 'desc';

  return { field, direction };
}
