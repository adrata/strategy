"use client";

/**
 * 🚀 PIPELINE FILTERS COMPONENT
 * 
 * Simple filters for pipeline sections
 */

import React, { useState, useRef, useEffect } from 'react';
// CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
// import { usePipelineData } from '@/platform/stores/PipelineDataStore';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
import { 
  FunnelIcon, 
  Bars3BottomLeftIcon, 
  TableCellsIcon, 
  PlusIcon,
  ArrowsUpDownIcon
} from '@heroicons/react/24/outline';

interface PipelineFiltersProps {
  section: string;
  totalCount: number;
  onSearchChange?: (query: string) => void;
  onVerticalChange?: (vertical: string) => void;
  onStatusChange?: (status: string) => void;
  onPriorityChange?: (priority: string) => void;
  onRevenueChange?: (revenue: string) => void;
  onLastContactedChange?: (lastContacted: string) => void;
  onTimezoneChange?: (timezone: string) => void;
  onSortChange?: (sort: string) => void;
  onAddRecord?: () => void;
  onColumnVisibilityChange?: (columns: string[]) => void;
  visibleColumns?: string[];
}

export function PipelineFilters({ section, totalCount, onSearchChange, onVerticalChange, onStatusChange, onPriorityChange, onRevenueChange, onLastContactedChange, onTimezoneChange, onSortChange, onAddRecord, onColumnVisibilityChange, visibleColumns: externalVisibleColumns }: PipelineFiltersProps) {
  // CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
  // const { data } = usePipelineData(section as any, 'default', 'default');
  
  // Use single data source from useAcquisitionOS instead
  const { data: acquisitionData } = useAcquisitionOS();
  
  // CRITICAL FIX: Map acquisition data to pipeline format for compatibility
  const getSectionData = (section: string) => {
    // The useAcquisitionOSData hook returns acquireData, not data
    const acquireData = acquisitionData?.acquireData || {};
    switch (section) {
      case 'leads': return acquireData.leads || [];
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || [];
      case 'people': return acquireData.people || [];
      case 'customers': return acquireData.customers || [];
      case 'partners': return acquireData.partnerships || [];
      case 'speedrun': return acquireData.speedrunItems || [];
      default: return [];
    }
  };
  
  const data = getSectionData(section);
  
  // DEBUG: Log data loading for opportunities
  if (section === 'opportunities') {
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Section: ${section}`);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Data length:`, data?.length || 0);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Sample stages:`, data?.slice(0, 5).map((record: any) => record.stage) || []);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Full data:`, data);
  }
  
  // DEBUG: Log data loading for opportunities
  if (section === 'opportunities') {
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Section: ${section}`);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Data length:`, data?.length || 0);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Sample stages:`, data?.slice(0, 5).map((record: any) => record.stage) || []);
    console.log(`🔍 [OPPORTUNITIES DATA DEBUG] Full data:`, data);
  }

  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [lastContactedFilter, setLastContactedFilter] = useState('all');
  const [timezoneFilter, setTimezoneFilter] = useState('all');

  // Get filter options based on section
  const getStatusOptions = () => {
    switch (section) {
      case 'leads':
        return [
          { value: 'all', label: 'All Leads' },
          { value: 'new', label: 'New' },
          { value: 'active', label: 'Active' },
          { value: 'qualified', label: 'Qualified' },
          { value: 'cold', label: 'Cold' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'follow-up', label: 'Follow-up' },
          { value: 'demo-scheduled', label: 'Demo Scheduled' }
        ];
      case 'prospects':
        return [
          { value: 'all', label: 'All Prospects' },
          { value: 'new', label: 'New' },
          { value: 'active', label: 'Active' },
          { value: 'qualified', label: 'Qualified' },
          { value: 'cold', label: 'Cold' }
        ];
      case 'opportunities':
        // CRITICAL FIX: Use actual stage values from database for opportunities
        const opportunityStages = data?.filter((record: any) => record.stage)?.map((record: any) => record.stage) || [];
        const uniqueStages = [...new Set(opportunityStages)].filter(stage => stage && stage.trim());
        
        // DEBUG: Log the stage values found in the data
        console.log(`🔍 [OPPORTUNITIES FILTER DEBUG] Found stages in data:`, uniqueStages);
        console.log(`🔍 [OPPORTUNITIES FILTER DEBUG] Total opportunities:`, data?.length || 0);
        
        // If we have actual stage data, use it; otherwise fall back to common stages
        if (uniqueStages.length > 0) {
          return [
            { value: 'all', label: 'All Stages' },
            ...uniqueStages.map(stage => ({
              value: stage,
              label: stage
            }))
          ];
        }
        
        // Fallback to common opportunity stages if no data available
        return [
          { value: 'all', label: 'All Stages' },
          { value: 'Build Rapport', label: 'Build Rapport' },
          { value: 'Understand Needs', label: 'Understand Needs' },
          { value: 'Present Solution', label: 'Present Solution' },
          { value: 'Handle Objections', label: 'Handle Objections' },
          { value: 'Negotiate Terms', label: 'Negotiate Terms' },
          { value: 'Closed Won', label: 'Closed Won' },
          { value: 'Closed Lost', label: 'Closed Lost' }
        ];
      case 'customers':
        return [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'churned', label: 'Churned' }
        ];
      default:
        return [
          { value: 'all', label: 'All Status' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ];
    }
  };

  const getPriorityOptions = () => {
    return [
      { value: 'all', label: 'All Priority' },
      { value: 'high', label: 'High' },
      { value: 'medium', label: 'Medium' },
      { value: 'low', label: 'Low' }
    ];
  };

  const statusOptions = getStatusOptions();
  const priorityOptions = getPriorityOptions();

  // Show priority filter for relevant sections
  const showPriorityFilter = ['leads', 'prospects', 'opportunities', 'speedrun'].includes(section);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('rank');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(externalVisibleColumns || ['rank', 'company', 'name', 'title', 'nextAction', 'lastAction']);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  // Get vertical options from real data
  const getVerticalOptions = () => {
    const baseOptions = [{ value: 'all', label: 'All Verticals' }];
    
    if (!data || !data.length) {
      return baseOptions;
    }

    // Extract unique verticals from the data
    const verticals = new Set<string>();
    
    data.forEach((record: any) => {
      if (record['vertical'] && typeof record['vertical'] === 'string') {
        verticals.add(record.vertical);
      }
      // Also check for industry field as fallback
      if (record['industry'] && typeof record['industry'] === 'string') {
        verticals.add(record.industry);
      }
      // Check company vertical if available
      if (record.company?.vertical && typeof record['company']['vertical'] === 'string') {
        verticals.add(record.company.vertical);
      }
      if (record.company?.industry && typeof record['company']['industry'] === 'string') {
        verticals.add(record.company.industry);
      }
    });

    // Convert to options array and sort
    const dynamicOptions = Array.from(verticals)
      .filter(vertical => vertical && typeof vertical === 'string' && vertical.toLowerCase() !== 'unknown')
      .sort()
      .map(vertical => ({
        value: (vertical || '').toLowerCase().replace(/\s+/g, '_'),
        label: vertical || ''
      }));

    return [...baseOptions, ...dynamicOptions];
  };

  const verticalOptions = getVerticalOptions();

  // Sort options - optimized for sales pipeline management with Rank as default
  const getSortOptions = () => {
    const baseOptions = [
      { value: 'rank', label: 'Rank' },
      { value: 'lastContact', label: 'Last Action' },
      { value: 'company', label: 'Company' },
      { value: 'name', label: 'Name' },
      { value: 'title', label: 'Title' },
      { value: 'status', label: section === 'opportunities' ? 'Stage' : 'Status' },
      { value: 'industry', label: 'Industry' },
      { value: 'revenue', label: 'Company Size' },
      { value: 'created_at', label: 'Created Date' },
      { value: 'updated_at', label: 'Last Updated' }
    ];

    if (!data || data['length'] === 0) return baseOptions;
    
    const sampleRecord = data[0];
    const additionalOptions = [];
    
    // Add smart ranking if available
    if (sampleRecord && (sampleRecord as any).smartRankScore !== undefined) {
      additionalOptions.unshift({ value: 'smart_rank', label: 'Smart Rank' });
    }
    
    // Add engagement metrics if available
    if (sampleRecord && (sampleRecord as any).engagementScore !== undefined) {
      additionalOptions.push({ value: 'engagement', label: 'Engagement Score' });
    }
    
    return [...additionalOptions, ...baseOptions];
  };

  const sortOptions = getSortOptions();

  // Column options - optimized for leads section
  const getColumnOptions = () => {
    const baseOptions = [
      { value: 'all', label: 'All Columns', icon: '📋' },
      { value: 'rank', label: 'Rank', icon: '🏅' },
      { value: 'company', label: 'Company', icon: '🏢' },
      { value: 'name', label: 'Name', icon: '👤' },
      { value: 'title', label: 'Title', icon: '💼' },
      { value: 'nextAction', label: 'Next Action', icon: '⏭️' },
      { value: 'lastAction', label: 'Last Action', icon: '📅' },
      { value: 'actions', label: 'Actions', icon: '⚡' },
      { value: 'status', label: section === 'opportunities' ? 'Stage' : 'Status', icon: '📊' },
      { value: 'industry', label: 'Industry', icon: '🏭' },
      { value: 'email', label: 'Email', icon: '📧' },
      { value: 'phone', label: 'Phone', icon: '📞' }
    ];

    // Filter based on section
    if (section === 'leads') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'name', 'title', 'nextAction', 'lastAction', 'actions'].includes(option.value)
      );
    }
    
    if (section === 'people') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'title', 'role', 'lastAction', 'nextAction', 'actions'].includes(option.value)
      );
    }
    
    if (section === 'companies') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'lastAction', 'nextAction', 'actions'].includes(option.value)
      );
    }
    
    if (section === 'speedrun') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'role', 'status', 'nextAction', 'lastAction', 'actions'].includes(option.value)
      );
    }
    
    return baseOptions;
  };

  const columnOptions = getColumnOptions();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef['current'] && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (sortDropdownRef['current'] && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      if (columnsDropdownRef['current'] && !columnsDropdownRef.current.contains(event.target as Node)) {
        setIsColumnsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleSortSelect = (value: string) => {
    setSortBy(value);
    setIsSortDropdownOpen(false);
    onSortChange?.(value);
    console.log('Sort by:', value);
  };

  const handleColumnToggle = (columnValue: string) => {
    let newVisibleColumns: string[];
    
    if (columnValue === 'all') {
      // Toggle all columns
      const allColumnValues = columnOptions.filter(opt => opt.value !== 'all').map(opt => opt.value);
      if (visibleColumns['length'] === allColumnValues.length) {
        // If all are selected, deselect all but keep at least one
        newVisibleColumns = ['rank'];
      } else {
        // Select all columns
        newVisibleColumns = allColumnValues;
      }
    } else {
      if (visibleColumns.includes(columnValue)) {
        // Remove column (but ensure at least one column remains)
        newVisibleColumns = visibleColumns.length > 1 ? visibleColumns.filter(col => col !== columnValue) : visibleColumns;
      } else {
        // Add column
        newVisibleColumns = [...visibleColumns, columnValue];
      }
    }
    
    setVisibleColumns(newVisibleColumns);
    onColumnVisibilityChange?.(newVisibleColumns);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const selectedOption = verticalOptions.find(option => option['value'] === verticalFilter) || verticalOptions[0];
  const selectedSortOption = sortOptions.find(option => option['value'] === sortBy) || sortOptions[0];

  // Apply filters function
  const applyFilters = (status: string, priority: string, vertical: string) => {
    onStatusChange?.(status);
    onPriorityChange?.(priority);
    onVerticalChange?.(vertical);
  };

  // Handle real-time filter changes
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(value, priorityFilter, verticalFilter);
    onStatusChange?.(value);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(statusFilter, value, verticalFilter);
  };

  const handleVerticalChange = (value: string) => {
    setVerticalFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(statusFilter, priorityFilter, value);
    onVerticalChange?.(value);
  };

  const handleRevenueChange = (value: string) => {
    setRevenueFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(statusFilter, priorityFilter, verticalFilter);
    onRevenueChange?.(value);
  };

  const handleLastContactedChange = (value: string) => {
    setLastContactedFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(statusFilter, priorityFilter, verticalFilter);
    onLastContactedChange?.(value);
  };

  const handleTimezoneChange = (value: string) => {
    setTimezoneFilter(value);
    // Real-time filtering - trigger immediately
    applyFilters(statusFilter, priorityFilter, verticalFilter);
    onTimezoneChange?.(value);
  };

  return (
    <div className="flex items-center gap-4 py-2 w-full bg-white">
      {/* Search - full width with icon on right */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={`Search ${section === 'speedrun' ? 'Speedrun' : section}...`}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-4 pr-10 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-white"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Advanced Filter Dropdown */}
      <div className="relative min-w-32" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="block truncate text-gray-900">
            Filter
          </span>
        </button>

        {/* Enhanced Filter Dropdown Menu - Status and Last Contacted */}
        {isDropdownOpen && (
          <div className="absolute z-50 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-900">Filter By</h3>
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setLastContactedFilter('all');
                    onStatusChange?.('all');
                    onLastContactedChange?.('all');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear All
                </button>
              </div>
              
              {/* Status Filter - Show for leads, prospects, opportunities */}
              {['leads', 'prospects', 'opportunities'].includes(section) && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    {section === 'opportunities' ? 'Stage' : 'Status'}
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Last Contacted Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Last Contacted</label>
                <select
                  value={lastContactedFilter}
                  onChange={(e) => handleLastContactedChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="all">Any Time</option>
                  <option value="never">Never Contacted</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="overdue">Overdue Follow-up</option>
                </select>
              </div>

              {/* Apply/Cancel Buttons */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 justify-end">
                <button
                  onClick={() => {
                    setLastContactedFilter('all');
                    onLastContactedChange?.('all');
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative min-w-32" ref={sortDropdownRef}>
        <button
          type="button"
          onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
        >
          <ArrowsUpDownIcon className="w-4 h-4 text-gray-500" />
          <span className="block truncate text-gray-900">
            Sort
          </span>
        </button>

        {/* Sort Dropdown Menu */}
        {isSortDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto min-w-[180px]">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSortSelect(option.value)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <input
                  type="checkbox"
                  checked={option['value'] === sortBy}
                  onChange={() => {}} // Handled by parent click
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600"
                />
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Columns Dropdown - moved to last position */}
      <div className="relative min-w-32" ref={columnsDropdownRef}>
        <button
          type="button"
          onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
          className="relative w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
          </svg>
          <span className="block truncate text-gray-900">
            {section === 'opportunities' ? 'Show' : 'Columns'}
          </span>
        </button>

        {/* Columns Dropdown Menu */}
        {isColumnsDropdownOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto min-w-[160px]">
            {columnOptions.map((option) => {
              const isAllOption = option['value'] === 'all';
              const allColumnValues = columnOptions.filter(opt => opt.value !== 'all').map(opt => opt.value);
              const isAllSelected = isAllOption && visibleColumns['length'] === allColumnValues.length;
              const isChecked = isAllOption ? isAllSelected : visibleColumns.includes(option.value);
              
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleColumnToggle(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition-colors flex items-center gap-2 ${
                    isAllOption ? 'border-b border-gray-200 font-medium' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}} // Handled by parent click
                    className="rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600"
                  />
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timezone Filter removed per user request */}

    </div>
  );
}
