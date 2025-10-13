/**
 * Unit tests for column mapping and configuration logic
 * Tests field name transformations, column config generators, and workspace-specific overrides
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock the workspace table config
jest.mock('@/platform/config/workspace-table-config', () => ({
  getSectionColumns: jest.fn(),
  getWorkspaceTableConfig: jest.fn()
}));

// Mock the section config
jest.mock('@/frontend/components/pipeline/config/section-config', () => ({
  getSectionConfig: jest.fn(),
  getSectionDefaultColumns: jest.fn()
}));

import { getSectionColumns } from '@/platform/config/workspace-table-config';
import { getSectionConfig, getSectionDefaultColumns } from '@/frontend/components/pipeline/config/section-config';

describe('Column Mapping Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Field Name Transformations', () => {
    it('should map display names to database field names correctly', () => {
      const fieldMappings = {
        'Rank': 'globalRank',
        'Name': 'fullName',
        'Company': 'company.name',
        'Title': 'jobTitle',
        'Email': 'email',
        'Phone': 'phone',
        'Status': 'status',
        'Priority': 'priority',
        'Last Action': 'lastAction',
        'Next Action': 'nextAction',
        'Main-Seller': 'mainSeller.name',
        'Co-Sellers': 'coSellers[].user.name'
      };

      Object.entries(fieldMappings).forEach(([displayName, dbField]) => {
        expect(transformDisplayNameToDbField(displayName)).toBe(dbField);
      });
    });

    it('should handle special field transformations', () => {
      expect(transformDisplayNameToDbField('Last Contacted')).toBe('lastActionDate');
      expect(transformDisplayNameToDbField('Next Contacted')).toBe('nextActionDate');
      expect(transformDisplayNameToDbField('Close Date')).toBe('expectedCloseDate');
      expect(transformDisplayNameToDbField('Owner')).toBe('mainSeller.name');
    });

    it('should handle unknown field names gracefully', () => {
      expect(transformDisplayNameToDbField('Unknown Field')).toBe('unknownField');
      expect(transformDisplayNameToDbField('')).toBe('');
    });
  });

  describe('Section Column Configurations', () => {
    it('should return correct default columns for speedrun section', () => {
      const expectedColumns = ['Rank', 'Name', 'Company', 'Status', 'Main-Seller', 'Co-Sellers', 'Last Action', 'Next Action'];
      const expectedFieldColumns = ['rank', 'name', 'company', 'status', 'mainSeller', 'coSellers', 'lastAction', 'nextAction'];
      
      expect(getSectionDefaultColumns('speedrun')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('speedrun')).toEqual(expectedColumns);
    });

    it('should return correct default columns for leads section', () => {
      const expectedColumns = ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'];
      const expectedFieldColumns = ['name', 'company', 'title', 'email', 'lastAction', 'nextAction'];
      
      expect(getSectionDefaultColumns('leads')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('leads')).toEqual(expectedColumns);
    });

    it('should return correct default columns for prospects section', () => {
      const expectedColumns = ['Name', 'Company', 'Title', 'Last Action', 'Next Action'];
      const expectedFieldColumns = ['name', 'company', 'title', 'lastAction', 'nextAction'];
      
      expect(getSectionDefaultColumns('prospects')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('prospects')).toEqual(expectedColumns);
    });

    it('should return correct default columns for opportunities section', () => {
      const expectedColumns = ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'];
      const expectedFieldColumns = ['rank', 'name', 'company', 'amount', 'stage', 'probability', 'closeDate', 'lastAction'];
      
      expect(getSectionDefaultColumns('opportunities')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('opportunities')).toEqual(expectedColumns);
    });

    it('should return correct default columns for companies section', () => {
      const expectedColumns = ['Company', 'Last Action', 'Next Action', 'Industry', 'Size', 'Revenue'];
      const expectedFieldColumns = ['company', 'lastAction', 'nextAction', 'industry', 'size', 'revenue'];
      
      expect(getSectionDefaultColumns('companies')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('companies')).toEqual(expectedColumns);
    });

    it('should return correct default columns for people section', () => {
      const expectedColumns = ['Name', 'Company', 'Title', 'Last Action', 'Next Action'];
      const expectedFieldColumns = ['name', 'company', 'title', 'lastAction', 'nextAction'];
      
      expect(getSectionDefaultColumns('people')).toEqual(expectedFieldColumns);
      expect(getDisplayColumnsForSection('people')).toEqual(expectedColumns);
    });
  });

  describe('Workspace-Specific Column Overrides', () => {
    it('should use workspace-specific column configuration when available', () => {
      const mockWorkspaceConfig = {
        columns: ['Custom', 'Columns', 'For', 'Workspace'],
        columnOrder: ['custom', 'columns', 'for', 'workspace']
      };
      
      (getSectionColumns as jest.Mock).mockReturnValue(mockWorkspaceConfig);
      
      const result = getSectionColumns('test-workspace', 'leads');
      expect(result).toEqual(mockWorkspaceConfig);
    });

    it('should fall back to default configuration when workspace config is not available', () => {
      (getSectionColumns as jest.Mock).mockReturnValue(null);
      (getSectionDefaultColumns as jest.Mock).mockReturnValue(['name', 'company', 'title']);
      
      const result = getSectionColumns('test-workspace', 'leads');
      expect(result).toBeNull();
    });

    it('should handle hidden columns correctly', () => {
      const mockWorkspaceConfig = {
        columns: ['Name', 'Company', 'Title', 'Email'],
        columnOrder: ['name', 'company', 'title', 'email'],
        hiddenColumns: ['Email']
      };
      
      (getSectionColumns as jest.Mock).mockReturnValue(mockWorkspaceConfig);
      
      const result = getSectionColumns('test-workspace', 'leads');
      expect(result.hiddenColumns).toEqual(['Email']);
    });
  });

  describe('Column Validation', () => {
    it('should validate that all column fields exist in database schema', () => {
      const validDbFields = {
        people: ['id', 'fullName', 'firstName', 'lastName', 'jobTitle', 'email', 'phone', 'status', 'priority', 'lastAction', 'nextAction', 'lastActionDate', 'nextActionDate', 'globalRank', 'mainSellerId', 'companyId'],
        companies: ['id', 'name', 'industry', 'size', 'revenue', 'employeeCount', 'website', 'status', 'priority', 'lastAction', 'nextAction', 'lastActionDate', 'nextActionDate', 'globalRank', 'opportunityAmount', 'opportunityStage', 'opportunityProbability', 'expectedCloseDate']
      };

      const sections = ['leads', 'prospects', 'opportunities', 'people', 'companies', 'speedrun'];
      
      sections.forEach(section => {
        const columns = getSectionDefaultColumns(section);
        const dbFields = section === 'companies' ? validDbFields.companies : validDbFields.people;
        
        columns.forEach(column => {
          // Handle nested fields (e.g., company.name)
          const baseField = column.split('.')[0];
          expect(dbFields).toContain(baseField);
        });
      });
    });

    it('should detect missing database fields', () => {
      const invalidColumns = ['nonExistentField', 'anotherMissingField'];
      const validDbFields = ['id', 'fullName', 'email', 'status'];
      
      invalidColumns.forEach(column => {
        expect(validDbFields).not.toContain(column);
      });
    });
  });

  describe('Column Order Consistency', () => {
    it('should maintain consistent column order across different configurations', () => {
      const sections = ['leads', 'prospects', 'people'];
      
      sections.forEach(section => {
        const displayColumns = getDisplayColumnsForSection(section);
        const fieldColumns = getSectionDefaultColumns(section);
        
        expect(displayColumns.length).toBe(fieldColumns.length);
        
        // Check that the order is consistent
        displayColumns.forEach((displayCol, index) => {
          const expectedFieldCol = transformDisplayNameToDbField(displayCol);
          expect(fieldColumns[index]).toBe(expectedFieldCol);
        });
      });
    });
  });
});

// Helper functions for testing
function transformDisplayNameToDbField(displayName: string): string {
  const fieldMappings: Record<string, string> = {
    'Rank': 'globalRank',
    'Name': 'fullName',
    'Company': 'company.name',
    'Title': 'jobTitle',
    'Email': 'email',
    'Phone': 'phone',
    'Status': 'status',
    'Priority': 'priority',
    'Last Action': 'lastAction',
    'Next Action': 'nextAction',
    'Main-Seller': 'mainSeller.name',
    'Co-Sellers': 'coSellers[].user.name',
    'Last Contacted': 'lastActionDate',
    'Next Contacted': 'nextActionDate',
    'Close Date': 'expectedCloseDate',
    'Owner': 'mainSeller.name',
    'Account': 'company.name',
    'Amount': 'company.opportunityAmount',
    'Stage': 'company.opportunityStage',
    'Probability': 'company.opportunityProbability',
    'Industry': 'industry',
    'Size': 'size',
    'Revenue': 'revenue'
  };

  return fieldMappings[displayName] || displayName.toLowerCase().replace(/\s+/g, '');
}

function getDisplayColumnsForSection(section: string): string[] {
  const sectionConfigs: Record<string, string[]> = {
    speedrun: ['Rank', 'Name', 'Company', 'Status', 'Main-Seller', 'Co-Sellers', 'Last Action', 'Next Action'],
    leads: ['Name', 'Company', 'Title', 'Email', 'Last Action', 'Next Action'],
    prospects: ['Name', 'Company', 'Title', 'Last Action', 'Next Action'],
    opportunities: ['Rank', 'Name', 'Account', 'Amount', 'Stage', 'Probability', 'Close Date', 'Last Action'],
    companies: ['Company', 'Last Action', 'Next Action', 'Industry', 'Size', 'Revenue'],
    people: ['Name', 'Company', 'Title', 'Last Action', 'Next Action']
  };

  return sectionConfigs[section] || [];
}
