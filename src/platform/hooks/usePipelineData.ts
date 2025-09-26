/**
 * Custom hook for pipeline data management.
 * Handles data fetching, filtering, sorting, and pagination.
 */

import { useState, useMemo, useCallback } from 'react';

// -------- Types --------
interface PipelineRecord {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  stage?: string;
  lastActionTime?: string;
  lastContactTime?: string;
  lastActionDescription?: string;
  nextAction?: string;
  [key: string]: any;
}

interface UsePipelineDataProps {
  data: PipelineRecord[];
  pageSize?: number;
  disableSorting?: boolean; // Add option to disable sorting
  searchQuery?: string; // Allow external search query to be passed in
  totalCount?: number; // Add totalCount for correct pagination
}

interface UsePipelineDataReturn {
  // Data
  filteredData: PipelineRecord[];
  paginatedData: PipelineRecord[];
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  
  // Filters
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  verticalFilter: string;
  revenueFilter: string;
  lastContactedFilter: string;
  timezoneFilter: string;
  
  // Sorting
  sortField: string;
  sortDirection: 'asc' | 'desc';
  
  // Actions
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setVerticalFilter: (vertical: string) => void;
  setRevenueFilter: (revenue: string) => void;
  setLastContactedFilter: (lastContacted: string) => void;
  setTimezoneFilter: (timezone: string) => void;
  setSortField: (field: string) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;
  setCurrentPage: (page: number) => void;
  
  // Utilities
  clearFilters: () => void;
  resetPagination: () => void;
}

// -------- Helper Functions --------
function filterData(
  data: PipelineRecord[],
  searchQuery: string,
  statusFilter: string,
  priorityFilter: string,
  verticalFilter: string,
  revenueFilter: string,
  lastContactedFilter: string,
  timezoneFilter: string
): PipelineRecord[] {
  return data.filter((record) => {
    // Search query filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        record.name?.toLowerCase().includes(searchLower) ||
        record.company?.toLowerCase().includes(searchLower) ||
        record.email?.toLowerCase().includes(searchLower) ||
        record.title?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      if (record.status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      if (record.priority?.toLowerCase() !== priorityFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Vertical filter
    if (verticalFilter && verticalFilter !== 'all') {
      if (record.industry?.toLowerCase() !== verticalFilter.toLowerCase()) {
        return false;
      }
    }
    
    // Revenue filter
    if (revenueFilter && revenueFilter !== 'all') {
      const recordValue = record.estimatedValue || record.amount || 0;
      const filterValue = parseFloat(revenueFilter);
      
      if (recordValue < filterValue) {
        return false;
      }
    }
    
    // Last contacted filter
    if (lastContactedFilter && lastContactedFilter !== 'all') {
      const lastContactDate = record.lastContactDate || record.lastActionDate;
      if (!lastContactDate) return false;
      
      const daysSinceContact = Math.floor(
        (new Date().getTime() - new Date(lastContactDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      const filterDays = parseInt(lastContactedFilter);
      if (daysSinceContact > filterDays) {
        return false;
      }
    }
    
    // Timezone filter
    if (timezoneFilter && timezoneFilter !== 'all') {
      if (record.timezone?.toLowerCase() !== timezoneFilter.toLowerCase()) {
        return false;
      }
    }
    
    return true;
  });
}

function sortData(
  data: PipelineRecord[],
  sortField: string,
  sortDirection: 'asc' | 'desc'
): PipelineRecord[] {
  return [...data].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    // Handle numeric values
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle date values (including date strings)
    const aDate = new Date(aValue);
    const bDate = new Date(bValue);
    
    // Check if both values are valid dates
    if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
      return sortDirection === 'asc' 
        ? aDate.getTime() - bDate.getTime()
        : bDate.getTime() - aDate.getTime();
    }
    
    // Handle string values
    const aStr = String(aValue).toLowerCase();
    const bStr = String(bValue).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

// -------- Main Hook --------
export function usePipelineData({ 
  data, 
  pageSize = 50,
  disableSorting = false,
  searchQuery: externalSearchQuery = '',
  totalCount
}: UsePipelineDataProps): UsePipelineDataReturn {
  // Filter state - use external search query if provided
  const [internalSearchQuery, setSearchQuery] = useState('');
  const searchQuery = externalSearchQuery || internalSearchQuery;
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [lastContactedFilter, setLastContactedFilter] = useState('all');
  const [timezoneFilter, setTimezoneFilter] = useState('all');
  
  // Sort state
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  
  // Filtered data
  const filteredData = useMemo(() => {
    // If external search query is provided, assume data is already filtered
    if (externalSearchQuery) {
      return data;
    }
    return filterData(
      data,
      searchQuery,
      statusFilter,
      priorityFilter,
      verticalFilter,
      revenueFilter,
      lastContactedFilter,
      timezoneFilter
    );
  }, [
    data,
    searchQuery,
    statusFilter,
    priorityFilter,
    verticalFilter,
    revenueFilter,
    lastContactedFilter,
    timezoneFilter,
    externalSearchQuery,
  ]);
  
  // Sorted data
  const sortedData = useMemo(() => {
    if (disableSorting) {
      // For companies, preserve the API ranking order
      return filteredData;
    }
    return sortData(filteredData, sortField, sortDirection);
  }, [filteredData, sortField, sortDirection, disableSorting]);
  
  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const result = sortedData.slice(startIndex, endIndex);
    
    console.log('🔍 [usePipelineData] Pagination calculation:', {
      inputDataLength: data.length,
      filteredDataLength: filteredData.length,
      sortedDataLength: sortedData.length,
      currentPage,
      pageSize,
      startIndex,
      endIndex,
      paginatedDataLength: result.length,
      samplePaginatedData: result.slice(0, 2)
    });
    
    return result;
  }, [sortedData, currentPage, pageSize, data.length, filteredData.length]);
  
  // Pagination info - FIXED: Use actual data length instead of totalCount to prevent blank pages
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const totalItems = sortedData.length;
  
  // Actions
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setVerticalFilter('all');
    setRevenueFilter('all');
    setLastContactedFilter('all');
    setTimezoneFilter('all');
  }, []);
  
  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);
  
  return {
    // Data
    filteredData: sortedData,
    paginatedData,
    
    // Pagination
    currentPage,
    totalPages,
    totalItems,
    
    // Filters
    searchQuery,
    statusFilter,
    priorityFilter,
    verticalFilter,
    revenueFilter,
    lastContactedFilter,
    timezoneFilter,
    
    // Sorting
    sortField,
    sortDirection,
    
    // Actions
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setVerticalFilter,
    setRevenueFilter,
    setLastContactedFilter,
    setTimezoneFilter,
    setSortField,
    setSortDirection,
    setCurrentPage,
    
    // Utilities
    clearFilters,
    resetPagination,
  };
}
