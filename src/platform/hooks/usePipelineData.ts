/**
 * Custom hook for pipeline data management.
 * Handles data fetching, filtering, sorting, and pagination.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';

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
  externalSortField?: string | null; // Allow external sort field to be passed in
  externalSortDirection?: 'asc' | 'desc' | null; // Allow external sort direction to be passed in
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
  totalCount,
  externalSortField,
  externalSortDirection
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
  
  // Sort state - use external values if provided, otherwise use internal state
  const [internalSortField, setInternalSortField] = useState('rank');
  const [internalSortDirection, setInternalSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const sortField = externalSortField || internalSortField;
  const sortDirection = externalSortDirection || internalSortDirection;
  
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
    
    // If no sort field or direction, return original order
    if (!sortField || !sortDirection) {
      return filteredData;
    }
    
    return sortData(filteredData, sortField, sortDirection);
  }, [filteredData, sortField, sortDirection, disableSorting]);
  
  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const result = sortedData.slice(startIndex, endIndex);
    
    // Removed console.log to improve performance - was logging on every render
    // Uncomment for debugging if needed:
    // console.log('🔍 [usePipelineData] Pagination calculation:', {
    //   inputDataLength: data.length,
    //   filteredDataLength: filteredData.length,
    //   sortedDataLength: sortedData.length,
    //   currentPage,
    //   pageSize,
    //   startIndex,
    //   endIndex,
    //   paginatedDataLength: result.length,
    //   totalCount
    // });
    
    return result;
  }, [sortedData, currentPage, pageSize, data.length, filteredData.length, totalCount]);
  
  // Pagination info - ALWAYS use filtered data length for correct pagination
  // This ensures that when search filters 1000 records to 50, we show 1 page (not 10)
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Track previous filter values to prevent unnecessary resets
  const prevFiltersRef = useRef({
    searchQuery,
    statusFilter,
    priorityFilter,
    verticalFilter,
    revenueFilter,
    lastContactedFilter,
    timezoneFilter,
    externalSearchQuery
  });
  
  // Reset pagination to page 1 when filters actually change (not just on every render)
  useEffect(() => {
    const prevFilters = prevFiltersRef.current;
    const filtersChanged = 
      prevFilters.searchQuery !== searchQuery ||
      prevFilters.statusFilter !== statusFilter ||
      prevFilters.priorityFilter !== priorityFilter ||
      prevFilters.verticalFilter !== verticalFilter ||
      prevFilters.revenueFilter !== revenueFilter ||
      prevFilters.lastContactedFilter !== lastContactedFilter ||
      prevFilters.timezoneFilter !== timezoneFilter ||
      prevFilters.externalSearchQuery !== externalSearchQuery;
    
    if (filtersChanged && currentPage !== 1) {
      setCurrentPage(1);
    }
    
    // Update ref with current values
    prevFiltersRef.current = {
      searchQuery,
      statusFilter,
      priorityFilter,
      verticalFilter,
      revenueFilter,
      lastContactedFilter,
      timezoneFilter,
      externalSearchQuery
    };
  }, [
    searchQuery,
    statusFilter,
    priorityFilter,
    verticalFilter,
    revenueFilter,
    lastContactedFilter,
    timezoneFilter,
    externalSearchQuery,
    currentPage
  ]);
  
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
    totalItems, // Filtered count (for correct pagination)
    apiTotalCount: totalCount, // Original total count (for "filtered from X" display)
    
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
    setSortField: setInternalSortField,
    setSortDirection: setInternalSortDirection,
    setCurrentPage,
    
    // Utilities
    clearFilters,
    resetPagination,
  };
}
