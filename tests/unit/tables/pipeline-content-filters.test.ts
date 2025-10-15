/**
 * Unit tests for PipelineContent filtering logic
 * Tests individual filter functions and filter combinations
 */

import { renderHook, act } from '@testing-library/react';
import { useState, useMemo, useCallback } from 'react';

// Mock the filtering logic from PipelineContent
const useFilteringLogic = (
  data: any[],
  searchQuery: string,
  verticalFilter: string,
  statusFilter: string,
  priorityFilter: string,
  revenueFilter: string,
  lastContactedFilter: string,
  timezoneFilter: string,
  companySizeFilter: string,
  locationFilter: string,
  sortField: string,
  sortDirection: 'asc' | 'desc',
  section: string
) => {
  const getSortableValue = useCallback((record: any, field: string) => {
    if (!record || !field) return '';
    
    // Handle different field mappings
    const fieldMap: { [key: string]: string } = {
      'Name': 'name',
      'Company': 'company',
      'Title': 'title',
      'Rank': 'rank',
      'Status': 'status',
      'Priority': 'priority',
      'Revenue': 'revenue',
      'Last Action': 'lastAction',
      'Next Action': 'nextAction',
      'Close Date': 'closeDate',
      'Amount': 'amount',
      'Stage': 'stage',
      'Industry': 'industry',
      'Location': 'location',
      'Timezone': 'timezone',
      'Company Size': 'companySize'
    };
    
    const actualField = fieldMap[field] || field.toLowerCase();
    let value = record[actualField] || record[field] || '';
    
    // Handle special cases
    if (field === 'Rank') {
      value = record.winningScore?.rank || record.rank || '999';
    }
    
    // Normalize values for sorting
    if (typeof value === 'string') {
      value = value.toLowerCase().trim();
    }
    
    return value;
  }, []);

  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((record: any) => {
        const searchableFields = [
          record.name,
          record.company,
          record.title,
          record.email,
          record.phone,
          record.industry,
          record.location
        ].filter(Boolean);
        
        return searchableFields.some(field => 
          field.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply vertical/industry filter
    if (verticalFilter) {
      filtered = filtered.filter((record: any) => 
        record.industry?.toLowerCase() === verticalFilter.toLowerCase()
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter((record: any) => 
        record.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter((record: any) => 
        record.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Apply revenue filter
    if (revenueFilter) {
      filtered = filtered.filter((record: any) => {
        const revenue = record.revenue || record.annualRevenue || 0;
        switch (revenueFilter) {
          case 'startup':
            return revenue < 1000000;
          case 'small':
            return revenue >= 1000000 && revenue < 10000000;
          case 'medium':
            return revenue >= 10000000 && revenue < 100000000;
          case 'large':
            return revenue >= 100000000 && revenue < 1000000000;
          case 'enterprise':
            return revenue >= 1000000000;
          default:
            return true;
        }
      });
    }

    // Apply last contacted filter
    if (lastContactedFilter) {
      filtered = filtered.filter((record: any) => {
        const lastContact = record.lastContactDate || record.lastActionDate;
        if (!lastContact) return lastContactedFilter === 'never';
        
        const contactDate = new Date(lastContact);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - contactDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (lastContactedFilter) {
          case 'never':
            return !lastContact;
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          case 'quarter':
            return diffDays <= 90;
          case 'overdue':
            return diffDays > 90;
          default:
            return true;
        }
      });
    }

    // Apply timezone filter
    if (timezoneFilter) {
      filtered = filtered.filter((record: any) => 
        record.timezone?.toLowerCase() === timezoneFilter.toLowerCase()
      );
    }

    // Apply company size filter
    if (companySizeFilter) {
      filtered = filtered.filter((record: any) => 
        record.companySize?.toLowerCase() === companySizeFilter.toLowerCase()
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((record: any) => 
        record.location?.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Apply sorting
    if (section === 'speedrun' && (!sortField || sortField === 'rank')) {
      // For speedrun, default sort by rank but respect sort direction
      filtered = [...filtered].sort((a: any, b: any) => {
        const aRank = parseInt(a.winningScore?.rank || a.rank || '999', 10);
        const bRank = parseInt(b.winningScore?.rank || b.rank || '999', 10);
        return sortDirection === 'asc' ? aRank - bRank : bRank - aRank;
      });
    } else if (sortField) {
      // Regular field sorting
      filtered = [...filtered].sort((a: any, b: any) => {
        let aVal = getSortableValue(a, sortField);
        let bVal = getSortableValue(b, sortField);
        
        // Handle numeric values
        if (!isNaN(Number(aVal)) && !isNaN(Number(bVal))) {
          aVal = Number(aVal);
          bVal = Number(bVal);
        }
        
        // Handle date values
        if (aVal instanceof Date && bVal instanceof Date) {
          aVal = aVal.getTime();
          bVal = bVal.getTime();
        }
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [
    data, searchQuery, verticalFilter, statusFilter, priorityFilter, revenueFilter,
    lastContactedFilter, timezoneFilter, companySizeFilter, locationFilter,
    sortField, sortDirection, section, getSortableValue
  ]);

  return { filteredData, getSortableValue };
};

describe('PipelineContent Filtering Logic', () => {
  const mockData = [
    {
      id: 1,
      name: 'John Doe',
      company: 'Acme Corp',
      title: 'CEO',
      email: 'john@acme.com',
      phone: '555-1234',
      industry: 'Technology',
      status: 'Active',
      priority: 'High',
      revenue: 25000000,
      lastContactDate: '2024-01-15',
      timezone: 'PST',
      companySize: 'Medium',
      location: 'San Francisco, CA',
      rank: 1
    },
    {
      id: 2,
      name: 'Jane Smith',
      company: 'Beta Inc',
      title: 'CTO',
      email: 'jane@beta.com',
      phone: '555-5678',
      industry: 'Healthcare',
      status: 'Inactive',
      priority: 'Medium',
      revenue: 150000000,
      lastContactDate: '2024-01-10',
      timezone: 'EST',
      companySize: 'Large',
      location: 'New York, NY',
      rank: 2
    },
    {
      id: 3,
      name: 'Bob Johnson',
      company: 'Gamma LLC',
      title: 'VP Sales',
      email: 'bob@gamma.com',
      phone: '555-9012',
      industry: 'Technology',
      status: 'Active',
      priority: 'Low',
      revenue: 500000,
      lastContactDate: '2024-01-20',
      timezone: 'CST',
      companySize: 'Small',
      location: 'Chicago, IL',
      rank: 3
    }
  ];

  describe('Search Filter', () => {
    test('should filter by name', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'John Doe', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('John Doe');
    });

    test('should filter by company', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'Beta', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].company).toBe('Beta Inc');
    });

    test('should filter by email', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'gamma.com', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].email).toBe('bob@gamma.com');
    });

    test('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'JOHN DOE', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('John Doe');
    });

    test('should return empty array for no matches', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'nonexistent', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(0);
    });
  });

  describe('Industry Filter', () => {
    test('should filter by industry', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', 'Technology', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.filteredData.every((record: any) => record.industry === 'Technology')).toBe(true);
    });

    test('should be case insensitive', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', 'technology', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(2);
    });
  });

  describe('Status Filter', () => {
    test('should filter by status', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', 'Active', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(2);
      expect(result.current.filteredData.every((record: any) => record.status === 'Active')).toBe(true);
    });
  });

  describe('Priority Filter', () => {
    test('should filter by priority', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', 'High', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].priority).toBe('High');
    });
  });

  describe('Revenue Filter', () => {
    test('should filter by startup revenue', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', 'startup', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].revenue).toBe(500000);
    });

    test('should filter by medium revenue', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', 'medium', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].revenue).toBe(25000000);
    });

    test('should filter by large revenue', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', 'large', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].revenue).toBe(150000000);
    });
  });

  describe('Last Contacted Filter', () => {
    test('should filter by never contacted', () => {
      const dataWithNoContact = [
        { ...mockData[0], lastContactDate: null },
        { ...mockData[1], lastContactDate: null }
      ];
      
      const { result } = renderHook(() =>
        useFilteringLogic(dataWithNoContact, '', '', '', '', '', 'never', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(2);
    });

    test('should filter by contacted this week', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 3);
      
      const dataWithRecentContact = [
        { ...mockData[0], lastContactDate: recentDate.toISOString().split('T')[0] }
      ];
      
      const { result } = renderHook(() =>
        useFilteringLogic(dataWithRecentContact, '', '', '', '', '', 'week', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
    });
  });

  describe('Timezone Filter', () => {
    test('should filter by timezone', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', 'PST', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].timezone).toBe('PST');
    });
  });

  describe('Company Size Filter', () => {
    test('should filter by company size', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', 'Medium', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].companySize).toBe('Medium');
    });
  });

  describe('Location Filter', () => {
    test('should filter by location', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', 'San Francisco', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].location).toBe('San Francisco, CA');
    });
  });

  describe('Multiple Filters', () => {
    test('should apply multiple filters together', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'John', 'Technology', 'Active', 'High', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('John Doe');
    });

    test('should return empty array when no records match all filters', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, 'John', 'Healthcare', 'Active', 'High', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(0);
    });
  });

  describe('Sorting', () => {
    test('should sort by name ascending', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', 'Name', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData[0].name).toBe('Bob Johnson');
      expect(result.current.filteredData[1].name).toBe('Jane Smith');
      expect(result.current.filteredData[2].name).toBe('John Doe');
    });

    test('should sort by name descending', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', 'Name', 'desc', 'prospects')
      );
      
      expect(result.current.filteredData[0].name).toBe('John Doe');
      expect(result.current.filteredData[1].name).toBe('Jane Smith');
      expect(result.current.filteredData[2].name).toBe('Bob Johnson');
    });

    test('should sort by rank ascending for speedrun section', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', 'rank', 'asc', 'speedrun')
      );
      
      expect(result.current.filteredData[0].rank).toBe(1);
      expect(result.current.filteredData[1].rank).toBe(2);
      expect(result.current.filteredData[2].rank).toBe(3);
    });

    test('should sort by rank descending for speedrun section', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', 'rank', 'desc', 'speedrun')
      );
      
      expect(result.current.filteredData[0].rank).toBe(3);
      expect(result.current.filteredData[1].rank).toBe(2);
      expect(result.current.filteredData[2].rank).toBe(1);
    });

    test('should sort by revenue ascending', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', 'Revenue', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData[0].revenue).toBe(500000);
      expect(result.current.filteredData[1].revenue).toBe(25000000);
      expect(result.current.filteredData[2].revenue).toBe(150000000);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty data array', () => {
      const { result } = renderHook(() =>
        useFilteringLogic([], 'test', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(0);
    });

    test('should handle null/undefined values', () => {
      const dataWithNulls = [
        { id: 1, name: null, company: undefined, industry: '', status: null },
        { id: 2, name: 'Valid Name', company: 'Valid Company', industry: 'Technology', status: 'Active' }
      ];
      
      const { result } = renderHook(() =>
        useFilteringLogic(dataWithNulls, 'Valid', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('Valid Name');
    });

    test('should handle empty filter values', () => {
      const { result } = renderHook(() =>
        useFilteringLogic(mockData, '', '', '', '', '', '', '', '', '', '', 'asc', 'prospects')
      );
      
      expect(result.current.filteredData).toHaveLength(3);
    });
  });

  describe('Dependency Array Validation', () => {
    test('should re-filter when search query changes', () => {
      const { result, rerender } = renderHook(
        ({ searchQuery }) => useFilteringLogic(mockData, searchQuery, '', '', '', '', '', '', '', '', '', 'asc', 'prospects'),
        { initialProps: { searchQuery: 'John Doe' } }
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      
      rerender({ searchQuery: 'Jane Smith' });
      
      expect(result.current.filteredData).toHaveLength(1);
      expect(result.current.filteredData[0].name).toBe('Jane Smith');
    });

    test('should re-filter when multiple filters change', () => {
      const { result, rerender } = renderHook(
        ({ searchQuery, industry }) => useFilteringLogic(mockData, searchQuery, industry, '', '', '', '', '', '', '', '', 'asc', 'prospects'),
        { initialProps: { searchQuery: 'John Doe', industry: 'Technology' } }
      );
      
      expect(result.current.filteredData).toHaveLength(1);
      
      rerender({ searchQuery: 'John Doe', industry: 'Healthcare' });
      
      expect(result.current.filteredData).toHaveLength(0);
    });
  });
});
