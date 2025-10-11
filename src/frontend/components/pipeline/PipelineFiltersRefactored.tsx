"use client";

/**
 * PIPELINE FILTERS - REFACTORED
 * 
 * Refactored version that uses section configuration instead of hardcoded switch statements.
 * This makes the component more maintainable and easier to extend.
 */

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useAcquisitionOS } from '@/platform/ui/context/AcquisitionOSProvider';
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
  const { data: acquisitionData } = useAcquisitionOS();
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

  // Render filter dropdown
  const renderFilterDropdown = (filterType: string, label: string) => {
    const options = getFilterOptions(filterType);
    const currentValue = activeFilters[filterType] || 'all';
    
    return (
      <div className="relative">
        <select
          value={currentValue}
          onChange={(e) => handleFilterChange(filterType, e.target.value)}
          className="appearance-none bg-[var(--background)] border border-[var(--border)] rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All {label}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg className="h-4 w-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      {/* Search and main controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-[var(--muted)]" />
            </div>
            <input
              type="text"
              placeholder={`Search ${sectionConfig?.displayName || section}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-[var(--background)] border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)]'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Column selector */}
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-[var(--border)] text-gray-700 hover:bg-[var(--panel-background)] transition-colors"
          >
            <AdjustmentsHorizontalIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Columns</span>
          </button>
        </div>

        {/* Add record button */}
        <button
          onClick={onAddRecord}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add {sectionConfig?.displayName?.slice(0, -1) || section.slice(0, -1)}
        </button>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-[var(--panel-background)] rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Filters</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availableFilters.map((filterType) => {
              const label = filterType.charAt(0).toUpperCase() + filterType.slice(1);
              return (
                <div key={filterType}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {label}
                  </label>
                  {renderFilterDropdown(filterType, label)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Column selector panel */}
      {showColumnSelector && (
        <div className="bg-[var(--panel-background)] rounded-lg p-4">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Visible Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {getSectionDefaultColumns(section).map((column) => (
              <label key={column} className="flex items-center space-x-2">
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
                  className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {column.charAt(0).toUpperCase() + column.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <span>
          {totalCount} {sectionConfig?.displayName || section}
          {activeFilterCount > 0 && ` (filtered)`}
        </span>
        
        {/* Sort options */}
        {sortOptions.length > 0 && (
          <div className="flex items-center space-x-2">
            <span>Sort by:</span>
            <select
              onChange={(e) => {
                const [field, direction] = e.target.value.split(':');
                onSortChange(field, direction as 'asc' | 'desc');
              }}
              className="border border-[var(--border)] rounded px-2 py-1 text-sm"
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
