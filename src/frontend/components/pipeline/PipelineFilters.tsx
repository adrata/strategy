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
  // New seller-specific filters
  onCompanySizeChange?: (size: string) => void;
  onLocationChange?: (location: string) => void;
  onTechnologyChange?: (technology: string) => void;
}

export function PipelineFilters({ section, totalCount, onSearchChange, onVerticalChange, onStatusChange, onPriorityChange, onRevenueChange, onLastContactedChange, onTimezoneChange, onSortChange, onAddRecord, onColumnVisibilityChange, visibleColumns: externalVisibleColumns, onCompanySizeChange, onLocationChange, onTechnologyChange }: PipelineFiltersProps) {
  // 🚀 PERFORMANCE: Use single data source from useAcquisitionOS with aggressive caching
  const { data: acquisitionData } = useAcquisitionOS();
  
  // 🚀 PERFORMANCE: Map acquisition data to pipeline format for compatibility
  const getSectionData = (section: string) => {
    const acquireData = acquisitionData?.acquireData || {};
    
    // 🚀 PERFORMANCE: Log data consistency for debugging
    console.log(`🔍 [PIPELINE FILTERS] Getting data for section ${section}:`, {
      hasAcquisitionData: !!acquisitionData,
      hasAcquireData: !!acquisitionData?.acquireData,
      sectionDataLength: acquireData[section]?.length || 0,
      isLoading: acquisitionData?.loading?.isLoading,
      dataSource: 'acquisitionData'
    });
    
    switch (section) {
      case 'leads': return acquireData.leads || [];
      case 'prospects': return acquireData.prospects || [];
      case 'opportunities': return acquireData.opportunities || [];
      case 'companies': return acquireData.companies || [];
      case 'people': return acquireData.people || [];
      case 'clients': return acquireData.clients || [];
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
  // New seller-specific filter states
  const [companySizeFilter, setCompanySizeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [technologyFilter, setTechnologyFilter] = useState('all');

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
        const uniqueStages = [...new Set(opportunityStages)].filter(stage => stage && typeof stage === 'string' && stage.trim());
        
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
      case 'clients':
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

  // 🎯 NEW SELLER FILTERS: Company Size, Location, Stage
  const getCompanySizeOptions = () => {
    return [
      { value: 'all', label: 'All Sizes' },
      { value: 'startup', label: 'Startup (1-10)' },
      { value: 'small', label: 'Small (11-50)' },
      { value: 'medium', label: 'Medium (51-200)' },
      { value: 'large', label: 'Large (201-1000)' },
      { value: 'enterprise', label: 'Enterprise (1000+)' }
    ];
  };

  const getLocationOptions = () => {
    const baseOptions = [{ value: 'all', label: 'All States' }];
    
    if (!data || !data.length) {
      return baseOptions;
    }

    // Extract unique states from the data
    const states = new Set<string>();
    
    data.forEach((record: any) => {
      // Check company state fields (prioritize hqState, then state)
      if (record.company?.hqState && typeof record.company.hqState === 'string') {
        states.add(record.company.hqState);
      }
      if (record.company?.state && typeof record.company.state === 'string') {
        states.add(record.company.state);
      }
      // Also check direct state fields
      if (record.hqState && typeof record.hqState === 'string') {
        states.add(record.hqState);
      }
      if (record.state && typeof record.state === 'string') {
        states.add(record.state);
      }
    });

    // Convert to options array and sort
    const dynamicOptions = Array.from(states)
      .filter(state => state && typeof state === 'string' && state.toLowerCase() !== 'unknown')
      .sort()
      .map(state => ({
        value: (state || '').toLowerCase().replace(/\s+/g, '_'),
        label: state || ''
      }));

    return [...baseOptions, ...dynamicOptions];
  };

  const getStageOptions = () => {
    return [
      { value: 'all', label: 'All Stages' },
      { value: 'lead', label: 'Lead' },
      { value: 'prospect', label: 'Prospect' },
      { value: 'opportunity', label: 'Opportunity' }
    ];
  };

  const statusOptions = getStatusOptions();
  const priorityOptions = getPriorityOptions();
  const companySizeOptions = getCompanySizeOptions();
  const locationOptions = getLocationOptions();
  const stageOptions = getStageOptions();

  // Show priority filter for relevant sections
  const showPriorityFilter = ['leads', 'prospects', 'opportunities', 'speedrun'].includes(section);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState('rank');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
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

  // Sort options - match actual columns for each section
  const getSortOptions = () => {
    // Section-specific sort options that match the actual columns
    if (section === 'speedrun') {
      return [
        { value: 'rank', label: 'Rank' },
        { value: 'company', label: 'Company' },
        { value: 'name', label: 'Person' },
        { value: 'status', label: 'Stage' },
        { value: 'lastContact', label: 'Last Action' },
        { value: 'nextAction', label: 'Next Action' }
      ];
    }
    
    if (section === 'opportunities') {
      return [
        { value: 'rank', label: 'Rank' },
        { value: 'company', label: 'Company' },
        { value: 'stage', label: 'Stage' },
        { value: 'amount', label: 'Value' },
        { value: 'lastContact', label: 'Last Action' },
        { value: 'nextAction', label: 'Next Action' }
      ];
    }
    
    if (section === 'leads' || section === 'prospects') {
      return [
        { value: 'rank', label: 'Rank' },
        { value: 'company', label: 'Company' },
        { value: 'name', label: 'Person' },
        { value: 'title', label: 'Title' },
        { value: 'status', label: 'Status' },
        { value: 'lastContact', label: 'Last Action' },
        { value: 'nextAction', label: 'Next Action' }
      ];
    }
    
    if (section === 'people') {
      return [
        { value: 'rank', label: 'Rank' },
        { value: 'name', label: 'Name' },
        { value: 'company', label: 'Company' },
        { value: 'title', label: 'Title' },
        { value: 'lastContact', label: 'Last Action' },
        { value: 'nextAction', label: 'Next Action' }
      ];
    }
    
    if (section === 'companies') {
      return [
        { value: 'rank', label: 'Rank' },
        { value: 'company', label: 'Company' },
        { value: 'lastContact', label: 'Last Action' },
        { value: 'nextAction', label: 'Next Action' }
      ];
    }
    
    // Default options for other sections
    return [
      { value: 'rank', label: 'Rank' },
      { value: 'company', label: 'Company' },
      { value: 'name', label: 'Name' },
      { value: 'title', label: 'Title' },
      { value: 'status', label: 'Status' },
      { value: 'lastContact', label: 'Last Action' },
      { value: 'nextAction', label: 'Next Action' }
    ];
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
      { value: 'status', label: section === 'opportunities' ? 'Stage' : section === 'speedrun' ? 'Stage' : 'Status', icon: '📊' },
      { value: 'industry', label: 'Industry', icon: '🏭' },
      { value: 'email', label: 'Email', icon: '📧' },
      { value: 'phone', label: 'Phone', icon: '📞' }
    ];

    // Filter based on section
    if (section === 'leads') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'name', 'title', 'nextAction', 'lastAction'].includes(option.value)
      );
    }
    
    if (section === 'people') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'title', 'role', 'lastAction', 'nextAction'].includes(option.value)
      );
    }
    
    if (section === 'companies') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'lastAction', 'nextAction', 'actions'].includes(option.value)
      );
    }
    
    if (section === 'speedrun') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'name', 'status', 'nextAction', 'lastAction', 'actions'].includes(option.value)
      );
    }
    
    return baseOptions;
  };

  const columnOptions = getColumnOptions();

  // Get all available columns for the current section
  const getAllAvailableColumns = () => {
    return columnOptions.filter(option => option.value !== 'all').map(option => option.value);
  };

  const [visibleColumns, setVisibleColumns] = useState<string[]>(externalVisibleColumns || getAllAvailableColumns());

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
    // Don't close dropdown or apply sort yet - wait for Apply button
    console.log('Sort selected (pending apply):', value);
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
        // Select all columns in their original order
        newVisibleColumns = allColumnValues;
      }
    } else {
      if (visibleColumns.includes(columnValue)) {
        // Remove column (but ensure at least one column remains)
        newVisibleColumns = visibleColumns.length > 1 ? visibleColumns.filter(col => col !== columnValue) : visibleColumns;
      } else {
        // Add column in its original position based on columnOptions order
        const allColumnValues = columnOptions.filter(opt => opt.value !== 'all').map(opt => opt.value);
        const currentColumns = [...visibleColumns];
        const columnIndex = allColumnValues.indexOf(columnValue);
        
        // Insert the new column at its original position
        const newColumns = [...currentColumns];
        newColumns.splice(columnIndex, 0, columnValue);
        
        // Remove duplicates and maintain order
        newVisibleColumns = [...new Set(newColumns)];
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

  // 🎯 NEW SELLER FILTER HANDLERS
  const handleCompanySizeChange = (value: string) => {
    setCompanySizeFilter(value);
    onCompanySizeChange?.(value);
  };

  const handleLocationChange = (value: string) => {
    setLocationFilter(value);
    onLocationChange?.(value);
  };

  const handleStageChange = (value: string) => {
    setStatusFilter(value); // Use status filter for stage
    onStatusChange?.(value);
  };

  return (
    <div className="flex items-center gap-4 py-2 w-full bg-[var(--background)]">
      {/* Search - full width with icon on right */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={`Search ${section === 'speedrun' ? 'Speedrun' : section}...`}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-4 pr-10 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-[var(--background)]"
          title=""
        />
      </div>

      {/* Advanced Filter Dropdown */}
      <div className="relative min-w-32" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="block truncate text-[var(--foreground)]">
            Filter
          </span>
        </button>

        {/* Enhanced Filter Dropdown Menu - Status and Last Contacted */}
        {isDropdownOpen && (
          <div className="absolute z-[1000] mt-1 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-[var(--foreground)]">Filter By</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCompanySizeFilter('all');
                      setLocationFilter('all');
                      onStatusChange?.('all');
                      onCompanySizeChange?.('all');
                      onLocationChange?.('all');
                    }}
                    className="text-xs text-[var(--muted)] hover:text-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                    }}
                    className="text-xs text-[var(--muted)] hover:text-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
              
              {/* 🎯 STAGE FILTER - First and simplified */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Stage</label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  {stageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">Company Size</label>
                <select
                  value={companySizeFilter}
                  onChange={(e) => handleCompanySizeChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  {companySizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

                      {/* Location Filter */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Location</label>
                <select
                  value={locationFilter}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  {locationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Apply/Cancel Buttons */}
              <div className="flex gap-2 pt-2 border-t border-[var(--border)] justify-end">
                <button
                  onClick={() => {
                    setCompanySizeFilter('all');
                    setLocationFilter('all');
                    onCompanySizeChange?.('all');
                    onLocationChange?.('all');
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-[var(--hover)] rounded-md hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsDropdownOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
                >
                  <ArrowsUpDownIcon className="w-4 h-4 text-[var(--muted)]" />
                  <span className="block truncate text-[var(--foreground)]">
                    Sort
                  </span>
                </button>

                {/* Sort Dropdown Menu - Match Filter styling */}
                {isSortDropdownOpen && (
                  <div className="absolute z-[1000] mt-1 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-[var(--foreground)]">Sort By</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSortBy('rank');
                              onSortChange?.('rank');
                              setIsSortDropdownOpen(false);
                            }}
                            className="text-xs text-[var(--muted)] hover:text-gray-700"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => {
                              setIsSortDropdownOpen(false);
                            }}
                            className="text-xs text-[var(--muted)] hover:text-gray-700"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                      
                      {/* Sort Options */}
                      <div className="space-y-2">
                        {sortOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleSortSelect(option.value)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                            option.value === sortBy 
                              ? 'bg-[var(--hover)] text-gray-800 border border-[var(--border)]' 
                              : 'hover:bg-[var(--panel-background)] focus:outline-none focus:bg-[var(--panel-background)]'
                          }`}
                        >
                          <input
                            type="radio"
                            checked={option.value === sortBy}
                            onChange={() => {}} // Handled by parent click
                            className="rounded border-blue-200 text-blue-800 focus:ring-blue-500 accent-blue-800"
                          />
                          <span>{option.label}</span>
                        </button>
                        ))}
                      </div>

                      {/* Apply/Cancel Buttons */}
                      <div className="flex gap-2 pt-2 border-t border-[var(--border)] justify-end mt-4">
                        <button
                          onClick={() => {
                            setIsSortDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-[var(--hover)] rounded-md hover:bg-[var(--panel-background)] focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            onSortChange?.(sortBy);
                            setIsSortDropdownOpen(false);
                            console.log('Sort applied:', sortBy);
                          }}
                          className="px-4 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Columns Dropdown - Match Filter/Sort styling */}
              <div className="relative min-w-32" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                  className="relative w-full bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className="block truncate text-[var(--foreground)]">
                    {section === 'opportunities' ? 'Show' : 'Columns'}
                  </span>
                </button>

                {/* Columns Dropdown Menu - Match Filter/Sort styling */}
                {isColumnsDropdownOpen && (
                  <div className="absolute z-[1000] mt-1 w-64 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-[var(--foreground)]">Show Columns</h3>
                      </div>
                      
                      {/* Column Options */}
                      <div className="space-y-2">
                        {columnOptions.map((option) => {
                          const isAllOption = option['value'] === 'all';
                          const allColumnValues = columnOptions.filter(opt => opt.value !== 'all').map(opt => opt.value);
                          // Fix: Check if ALL individual columns are actually selected, not just length
                          const isAllSelected = isAllOption && allColumnValues.every(col => visibleColumns.includes(col));
                          const isChecked = isAllOption ? isAllSelected : visibleColumns.includes(option.value);
                          
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleColumnToggle(option.value)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center gap-2 ${
                                isChecked 
                                  ? 'bg-[var(--hover)] text-gray-800 border border-[var(--border)]' 
                                  : 'hover:bg-[var(--panel-background)] focus:outline-none focus:bg-[var(--panel-background)]'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // Handled by parent click
                                className="rounded border-blue-200 text-blue-800 focus:ring-blue-500 accent-blue-800"
                              />
                              <span>{option.label}</span>
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  </div>
                )}
              </div>

      {/* Timezone Filter removed per user request */}

    </div>
  );
}
