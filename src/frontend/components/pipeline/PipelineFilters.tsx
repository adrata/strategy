"use client";

/**
 * 🚀 PIPELINE FILTERS COMPONENT
 * 
 * Simple filters for pipeline sections
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
// CRITICAL FIX: Disable PipelineDataStore to eliminate duplicate data loading
// import { usePipelineData } from '@/platform/stores/PipelineDataStore';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { useUnifiedAuth } from '@/platform/auth';
import { useTablePreferences } from '@/platform/hooks/useTablePreferences';
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
  // Get workspace context for persistence
  const { user } = useUnifiedAuth();
  const workspaceId = user?.activeWorkspaceId || 'default';
  
  // 🚀 PERFORMANCE: Use single data source from useRevenueOS with aggressive caching
  const { data: acquisitionData } = useRevenueOS();
  
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

  // Column options - optimized for leads section
  const getColumnOptions = () => {
    const baseOptions = [
      { value: 'all', label: 'All Columns', icon: '📋' },
      { value: 'rank', label: 'Rank', icon: '🏅' },
      { value: 'company', label: 'Company', icon: '🏢' },
      { value: 'name', label: 'Name', icon: '👤' },
      { value: 'state', label: 'State', icon: '📍' },
      { value: 'title', label: 'Title', icon: '💼' },
      { value: 'lastAction', label: 'Last Action', icon: '📅' },
      { value: 'nextAction', label: 'Next Action', icon: '⏭️' },
      { value: 'status', label: section === 'opportunities' ? 'Stage' : section === 'speedrun' ? 'Stage' : 'Status', icon: '📊' },
      { value: 'industry', label: 'Industry', icon: '🏭' },
      { value: 'email', label: 'Email', icon: '📧' },
      { value: 'phone', label: 'Phone', icon: '📞' }
    ];

    // Filter based on section
    if (section === 'leads') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'name', 'state', 'title', 'lastAction', 'nextAction'].includes(option.value)
      );
    }
    
    if (section === 'people') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'title', 'role', 'lastAction', 'nextAction'].includes(option.value)
      );
    }
    
    if (section === 'companies') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'state', 'lastAction', 'nextAction', 'actions'].includes(option.value)
      );
    }
    
    if (section === 'speedrun') {
      return baseOptions.filter(option => 
        ['all', 'rank', 'company', 'name', 'status', 'lastAction', 'nextAction', 'actions'].includes(option.value)
      );
    }
    
    return baseOptions;
  };

  // Get column options first (needed for default columns)
  const columnOptions = getColumnOptions();
  
  // Get default columns for the section
  const getAllAvailableColumns = () => {
    return columnOptions.filter(option => option.value !== 'all').map(option => option.value);
  };
  
  // Initialize persistence hook with section-specific defaults
  const defaultColumns = externalVisibleColumns || getAllAvailableColumns();
  const defaultSortField = section === 'prospects' ? 'lastContactDate' : 'rank';
  const defaultSortDirection = section === 'prospects' ? 'asc' : 'asc';
  
  const {
    preferences,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    setVerticalFilter,
    setRevenueFilter,
    setLastContactedFilter,
    setTimezoneFilter,
    setCompanySizeFilter,
    setLocationFilter,
    setTechnologyFilter,
    setSortField,
    setSortDirection,
    setVisibleColumns,
    activeFilterCount,
    hasNonDefaultSort,
    hasNonDefaultColumns
  } = useTablePreferences(workspaceId, section, defaultColumns, defaultSortField, defaultSortDirection);
  
  // Extract values from preferences for easier access
  const {
    searchQuery,
    statusFilter,
    priorityFilter,
    verticalFilter,
    revenueFilter,
    lastContactedFilter,
    timezoneFilter,
    companySizeFilter,
    locationFilter,
    technologyFilter,
    sortField: sortBy,
    visibleColumns
  } = preferences;
  
  // Notify parent of loaded filter values on mount
  useEffect(() => {
    // Only run once on mount to sync persisted filters with parent
    onSearchChange?.(searchQuery);
    onStatusChange?.(statusFilter);
    onPriorityChange?.(priorityFilter);
    onVerticalChange?.(verticalFilter);
    onRevenueChange?.(revenueFilter);
    onLastContactedChange?.(lastContactedFilter);
    onTimezoneChange?.(timezoneFilter);
    onCompanySizeChange?.(companySizeFilter);
    onLocationChange?.(locationFilter);
    onTechnologyChange?.(technologyFilter);
    onSortChange?.(sortBy);
    onColumnVisibilityChange?.(visibleColumns);
  }, []); // Empty deps - only run on mount
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      onSearchChange?.(query);
    }, 300); // 300ms debounce
  }, [onSearchChange]);

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
    const baseOptions = [{ value: 'all', label: 'All Sizes' }];
    
    if (!data || !data.length) {
      return baseOptions;
    }

    // Check what size ranges actually have data
    const sizeRanges = {
      startup: 0,
      small: 0,
      medium: 0,
      large: 0,
      enterprise: 0
    };

    data.forEach((record: any) => {
      // Try numeric employeeCount first
      const employeeCount = record.employeeCount || record.company?.employeeCount || 0;
      const empCount = typeof employeeCount === 'string' ? parseInt(employeeCount, 10) : employeeCount;
      
      if (empCount > 0) {
        if (empCount >= 1 && empCount <= 10) sizeRanges.startup++;
        else if (empCount >= 11 && empCount <= 50) sizeRanges.small++;
        else if (empCount >= 51 && empCount <= 200) sizeRanges.medium++;
        else if (empCount >= 201 && empCount <= 1000) sizeRanges.large++;
        else if (empCount > 1000) sizeRanges.enterprise++;
      } else {
        // Fallback: Try to match company.size string
        const companySize = record.company?.size?.toLowerCase() || '';
        if (companySize.includes('1-10') || companySize.includes('<10')) sizeRanges.startup++;
        else if (companySize.includes('11-50') || companySize.includes('1-50')) sizeRanges.small++;
        else if (companySize.includes('51-200') || companySize.includes('50-200')) sizeRanges.medium++;
        else if (companySize.includes('201-1000') || companySize.includes('200-1000')) sizeRanges.large++;
        else if (companySize.includes('1000+') || companySize.includes('5000+') || companySize.includes('10000+')) sizeRanges.enterprise++;
      }
    });

    // Only include ranges that have at least 1 company
    const dynamicOptions = [];
    if (sizeRanges.startup > 0) dynamicOptions.push({ value: 'startup', label: `Startup (1-10) (${sizeRanges.startup})` });
    if (sizeRanges.small > 0) dynamicOptions.push({ value: 'small', label: `Small (11-50) (${sizeRanges.small})` });
    if (sizeRanges.medium > 0) dynamicOptions.push({ value: 'medium', label: `Medium (51-200) (${sizeRanges.medium})` });
    if (sizeRanges.large > 0) dynamicOptions.push({ value: 'large', label: `Large (201-1000) (${sizeRanges.large})` });
    if (sizeRanges.enterprise > 0) dynamicOptions.push({ value: 'enterprise', label: `Enterprise (1000+) (${sizeRanges.enterprise})` });

    return [...baseOptions, ...dynamicOptions];
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

  // Helper function to check if filter has meaningful data
  const hasFilterData = (options: {value: string, label: string}[]) => {
    return options.length > 1; // More than just the "All" option
  };

  // Show priority filter for relevant sections
  const showPriorityFilter = ['leads', 'prospects', 'opportunities', 'speedrun'].includes(section);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [previousSortBy, setPreviousSortBy] = useState('rank');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownContentRef = useRef<HTMLDivElement>(null);
  const sortDropdownContentRef = useRef<HTMLDivElement>(null);
  const columnsDropdownContentRef = useRef<HTMLDivElement>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

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
        { value: 'state', label: 'State' },
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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check Filter dropdown
      if (dropdownRef['current'] && !dropdownRef.current.contains(event.target as Node) &&
          dropdownContentRef['current'] && !dropdownContentRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      // Check Sort dropdown
      if (sortDropdownRef['current'] && !sortDropdownRef.current.contains(event.target as Node) &&
          sortDropdownContentRef['current'] && !sortDropdownContentRef.current.contains(event.target as Node)) {
        setIsSortDropdownOpen(false);
      }
      // Check Columns dropdown
      if (columnsDropdownRef['current'] && !columnsDropdownRef.current.contains(event.target as Node) &&
          columnsDropdownContentRef['current'] && !columnsDropdownContentRef.current.contains(event.target as Node)) {
        setIsColumnsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);



  const handleSortSelect = (value: string) => {
    // Store current value as previous before changing
    setPreviousSortBy(sortBy);
    setSortField(value);
    // Apply sort immediately for real-time feedback
    onSortChange?.(value);
    console.log(`🔧 [SORT FIX] Real-time sort applied: ${value} (previous: ${sortBy})`);
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
    debouncedSearch(value);
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
    <div className="flex items-center gap-4 py-2 w-full bg-background">
      {/* Search - full width with icon on right */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder={`Search ${section === 'speedrun' ? 'Speedrun' : section}...`}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-4 pr-10 py-2 border border-border rounded-lg text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors w-full bg-background"
          title=""
        />
      </div>

      {/* Advanced Filter Dropdown */}
      <div className="relative min-w-32" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="block truncate text-foreground">
            Filter
          </span>
          {activeFilterCount > 0 && (
            <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-medium">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Enhanced Filter Dropdown Menu - Status and Last Contacted */}
        {isDropdownOpen && isClient && createPortal(
          <div ref={dropdownContentRef} className="fixed z-[9999] mt-1 w-64 bg-background border border-border rounded-lg shadow-lg" style={{
            top: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: dropdownRef.current ? dropdownRef.current.getBoundingClientRect().left : 0
          }}>
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-foreground">Filter By</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      onStatusChange?.('all');
                      // Only reset filters that are actually visible
                      if (hasFilterData(companySizeOptions)) {
                        setCompanySizeFilter('all');
                        onCompanySizeChange?.('all');
                      }
                      if (hasFilterData(locationOptions)) {
                        setLocationFilter('all');
                        onLocationChange?.('all');
                      }
                    }}
                    className="text-xs text-muted hover:text-gray-700"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                    }}
                    className="text-xs text-muted hover:text-gray-700"
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
                  className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                >
                  {stageOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Size Filter - Only show if data exists */}
              {hasFilterData(companySizeOptions) && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Company Size</label>
                  <select
                    value={companySizeFilter}
                    onChange={(e) => handleCompanySizeChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {companySizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Location Filter - Only show if data exists */}
              {hasFilterData(locationOptions) && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Location</label>
                  <select
                    value={locationFilter}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  >
                    {locationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Apply/Cancel Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border justify-end">
                <button
                  onClick={() => {
                    // Only reset filters that are actually visible
                    if (hasFilterData(companySizeOptions)) {
                      setCompanySizeFilter('all');
                      onCompanySizeChange?.('all');
                    }
                    if (hasFilterData(locationOptions)) {
                      setLocationFilter('all');
                      onLocationChange?.('all');
                    }
                    setIsDropdownOpen(false);
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-hover rounded-md hover:bg-panel-background focus:outline-none focus:ring-2 focus:ring-gray-500"
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
          </div>,
          document.body
        )}
      </div>

              {/* Sort Dropdown */}
              <div className="relative min-w-32" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                  className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
                >
                  <ArrowsUpDownIcon className="w-4 h-4 text-muted" />
                  <span className="block truncate text-foreground">
                    Sort
                  </span>
                  {hasNonDefaultSort && (
                    <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-medium">
                      1
                    </span>
                  )}
                </button>

                {/* Sort Dropdown Menu - Match Filter styling */}
                {isSortDropdownOpen && isClient && createPortal(
                  <div ref={sortDropdownContentRef} className="fixed z-[9999] mt-1 w-64 bg-background border border-border rounded-lg shadow-lg" style={{
                    top: sortDropdownRef.current ? sortDropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
                    left: sortDropdownRef.current ? sortDropdownRef.current.getBoundingClientRect().left : 0
                  }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-foreground">Sort By</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSortBy('rank');
                              onSortChange?.('rank');
                              setIsSortDropdownOpen(false);
                            }}
                            className="text-xs text-muted hover:text-gray-700"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => {
                              setIsSortDropdownOpen(false);
                            }}
                            className="text-xs text-muted hover:text-gray-700"
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
                              ? 'bg-hover text-gray-800 border border-border' 
                              : 'hover:bg-panel-background focus:outline-none focus:bg-panel-background'
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
                      <div className="flex gap-2 pt-2 border-t border-border justify-end mt-4">
                        <button
                          onClick={() => {
                            console.log(`🔧 [SORT FIX] Cancel clicked - reverting to previous sort: ${previousSortBy}`);
                            // Revert to previous sort value
                            setSortBy(previousSortBy);
                            onSortChange?.(previousSortBy);
                            setIsSortDropdownOpen(false);
                          }}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-hover rounded-md hover:bg-panel-background focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            console.log(`🔧 [SORT FIX] PipelineFilters Apply clicked: sortBy=${sortBy} - locking in selection`);
                            // Sort is already applied in real-time, just close dropdown to lock in selection
                            setPreviousSortBy(sortBy); // Update previous value to current for next time
                            setIsSortDropdownOpen(false);
                            console.log(`🔧 [SORT FIX] Sort locked in: ${sortBy}`);
                          }}
                          className="px-4 py-2 text-sm font-medium text-blue-800 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>

              {/* Columns Dropdown - Match Filter/Sort styling */}
              <div className="relative min-w-32" ref={columnsDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsColumnsDropdownOpen(!isColumnsDropdownOpen)}
                  className="relative w-full bg-background border border-border rounded-lg px-3 py-2 text-left text-sm focus:outline-none focus:border-gray-400 hover:border-gray-400 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className="block truncate text-foreground">
                    {section === 'opportunities' ? 'Show' : 'Columns'}
                  </span>
                  {hasNonDefaultColumns && (
                    <span className="ml-1.5 bg-blue-100 text-blue-600 text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center font-medium">
                      1
                    </span>
                  )}
                </button>

                {/* Columns Dropdown Menu - Match Filter/Sort styling */}
                {isColumnsDropdownOpen && isClient && createPortal(
                  <div ref={columnsDropdownContentRef} className="fixed z-[9999] mt-1 w-64 bg-background border border-border rounded-lg shadow-lg" style={{
                    top: columnsDropdownRef.current ? columnsDropdownRef.current.getBoundingClientRect().bottom + 4 : 0,
                    left: columnsDropdownRef.current ? columnsDropdownRef.current.getBoundingClientRect().left : 0
                  }}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-medium text-foreground">Show Columns</h3>
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
                                  ? 'bg-hover text-gray-800 border border-border' 
                                  : 'hover:bg-panel-background focus:outline-none focus:bg-panel-background'
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
                  </div>,
                  document.body
                )}
              </div>

      {/* Timezone Filter removed per user request */}

    </div>
  );
}
