"use client";

/**
 * PIPELINE FILTERS - REFACTORED
 * 
 * Refactored version that uses section configuration instead of hardcoded switch statements.
 * This makes the component more maintainable and easier to extend.
 */

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { 
  getSectionConfig, 
  getSectionDefaultColumns, 
  getSectionAvailableFilters,
  getSectionSortOptions,
  mapAcquisitionDataToSection
} from './config/section-config';

interface PipelineFiltersProps {
  section: string;
  totalCount: number;
  onSearchChange: (query: string) => void;
  onVerticalChange: (vertical: string) => void;
  onStatusChange: (status: string) => void;
  onPriorityChange: (priority: string) => void;
  onRevenueChange: (revenue: string) => void;
  onLastContactedChange: (lastContacted: string) => void;
  onTimezoneChange: (timezone: string) => void;
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onAddRecord: () => void;
  onColumnVisibilityChange: (columns: string[]) => void;
  visibleColumns: string[];
  onCompanySizeChange?: (size: string) => void;
  onLocationChange?: (location: string) => void;
  onTechnologyChange?: (technology: string) => void;
}

export function PipelineFiltersRefactored({ 
  section, 
  totalCount, 
  onSearchChange, 
  onVerticalChange, 
  onStatusChange, 
  onPriorityChange, 
  onRevenueChange, 
  onLastContactedChange, 
  onTimezoneChange, 
  onSortChange, 
  onAddRecord, 
  onColumnVisibilityChange, 
  visibleColumns, 
  onCompanySizeChange,
  onLocationChange,
  onTechnologyChange 
}: PipelineFiltersProps) {
  // Get section configuration
  const sectionConfig = getSectionConfig(section);
  const availableFilters = getSectionAvailableFilters(section);
  const sortOptions = getSectionSortOptions(section);
  
  // Get data from acquisition context
  const { data: acquisitionData } = useRevenueOS();
  const data = mapAcquisitionDataToSection(acquisitionData?.acquireData, section);
  
  // Local state for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Update parent components when filters change
  useEffect(() => {
    onSearchChange(searchQuery);
  }, [searchQuery, onSearchChange]);

  useEffect(() => {
    Object.entries(activeFilters).forEach(([filterType, value]) => {
      switch (filterType) {
        case 'vertical':
          onVerticalChange(value);
          break;
        case 'status':
          onStatusChange(value);
          break;
        case 'priority':
          onPriorityChange(value);
          break;
        case 'revenue':
          onRevenueChange(value);
          break;
        case 'lastContacted':
          onLastContactedChange(value);
          break;
        case 'timezone':
          onTimezoneChange(value);
          break;
        case 'companySize':
          onCompanySizeChange?.(value);
          break;
        case 'location':
          onLocationChange?.(value);
          break;
        case 'technology':
          onTechnologyChange?.(value);
          break;
      }
    });
  }, [activeFilters, onVerticalChange, onStatusChange, onPriorityChange, onRevenueChange, onLastContactedChange, onTimezoneChange, onCompanySizeChange, onLocationChange, onTechnologyChange]);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
  };

  // Get unique values for filter options
  const getFilterOptions = (filterType: string): string[] => {
    const uniqueValues = new Set<string>();
    
    data.forEach((record: any) => {
      const value = record[filterType];
      if (value && typeof value === 'string') {
        uniqueValues.add(value);
      }
    });
    
    return Array.from(uniqueValues).sort();
  };

  // Render filter dropdown - Responsive
  const renderFilterDropdown = (filterType: string, label: string) => {
    const options = getFilterOptions(filterType);
    const currentValue = activeFilters[filterType] || 'all';
    
    return (
      <div className="relative min-w-0">
        <select
          value={currentValue}
          onChange={(e) => handleFilterChange(filterType, e.target.value)}
          className="appearance-none bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2.5 sm:py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full min-h-[2.5rem] sm:min-h-0"
        >
          <option value="all">All {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-4 w-4 text-[var(--muted)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  };

  // Count active filters
  const activeFilterCount = Object.values(activeFilters).filter(value => value !== 'all').length + (searchQuery ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search and main controls - Responsive layout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Top row: Search and primary controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Search - Full width on mobile, constrained on desktop */}
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              placeholder={`Search ${sectionConfig?.displayName || section}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-3 pr-3 py-2.5 sm:py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Control buttons - Responsive layout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 rounded-lg border transition-colors min-h-[2.5rem] sm:min-h-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-gray-50 border-gray-200 text-gray-700'
                  : 'bg-[var(--background)] border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)]'
              }`}
            >
              <FunnelIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium hidden xs:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span className="bg-gray-100 text-gray-600 text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Column selector */}
            <button
              onClick={() => setShowColumnSelector(!showColumnSelector)}
              className="flex items-center space-x-1.5 sm:space-x-2 px-3 py-2.5 sm:py-2 rounded-lg border border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)] transition-colors min-h-[2.5rem] sm:min-h-0"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium hidden xs:inline">Columns</span>
            </button>
          </div>
        </div>

        {/* Add record button - Full width on mobile, auto width on desktop */}
        <button
          onClick={onAddRecord}
          className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium min-h-[2.5rem] sm:min-h-0"
        >
          Add {sectionConfig?.displayName?.slice(0, -1) || section.slice(0, -1)}
        </button>
      </div>

      {/* Filters panel - Responsive */}
      {showFilters && (
        <div className="bg-[var(--panel-background)] rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {availableFilters.map((filterType) => {
              const label = filterType.charAt(0).toUpperCase() + filterType.slice(1);
              return (
                <div key={filterType} className="min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    {label}
                  </label>
                  {renderFilterDropdown(filterType, label)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Column selector panel - Responsive */}
      {showColumnSelector && (
        <div className="bg-[var(--panel-background)] rounded-lg p-3 sm:p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Visible Columns</h3>
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
            {getSectionDefaultColumns(section).map((column) => (
              <label key={column} className="flex items-center space-x-2 p-2 rounded hover:bg-[var(--hover)] transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onColumnVisibilityChange([...visibleColumns, column]);
                    } else {
                      onColumnVisibilityChange(visibleColumns.filter(c => c !== column));
                    }
                  }}
                  className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500 h-4 w-4 flex-shrink-0"
                />
                <span className="text-sm text-gray-700 truncate">
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results summary - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 text-sm text-[var(--muted)]">
        <span className="text-center sm:text-left">
          {totalCount} {sectionConfig?.displayName || section}
          {activeFilterCount > 0 && ` (filtered)`}
        </span>
        
        {/* Sort options - Responsive */}
        {sortOptions.length > 0 && (
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
            <span className="text-center xs:text-left font-medium">Sort by:</span>
            <select
              onChange={(e) => {
                const [field, direction] = e.target.value.split(':');
                onSortChange(field, direction as 'asc' | 'desc');
              }}
              className="border border-[var(--border)] rounded-lg px-3 py-2 text-sm bg-[var(--background)] focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-0 flex-1 xs:flex-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={`${option.value}:asc`}>
                  {option.label} (A-Z)
                </option>
              ))}
              {sortOptions.map((option) => (
                <option key={`${option.value}-desc`} value={`${option.value}:desc`}>
                  {option.label} (Z-A)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
