/**
 * PIPELINE FILTERS V2 - Configuration-driven version
 * 
 * This version uses the section configuration instead of large switch statements
 * while preserving the exact same interface and behavior as the original.
 */

"use client";

import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useRevenueOS } from '@/platform/ui/context/RevenueOSProvider';
import { 
  getSectionConfig, 
  getSectionDefaultColumns, 
  getSectionAvailableFilters,
  getSectionSortOptions,
  getSectionStatusOptions,
  getSectionPriorityOptions,
  getSectionRevenueOptions,
  getSectionTimezoneOptions,
  getSectionCompanySizeOptions,
  getSectionLocationOptions,
  getSectionTechnologyOptions,
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

export function PipelineFiltersV2({ 
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
  
  // State management - identical to original
  const [searchQuery, setSearchQuery] = useState('');
  const [verticalFilter, setVerticalFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [revenueFilter, setRevenueFilter] = useState('all');
  const [lastContactedFilter, setLastContactedFilter] = useState('all');
  const [timezoneFilter, setTimezoneFilter] = useState('all');
  const [companySizeFilter, setCompanySizeFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all');
  const [technologyFilter, setTechnologyFilter] = useState('all');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Get section configuration instead of using switch statements
  const sectionConfig = getSectionConfig(section);
  const availableFilters = getSectionAvailableFilters(section);
  const sortOptions = getSectionSortOptions(section);
  const statusOptions = getSectionStatusOptions(section);
  const priorityOptions = getSectionPriorityOptions(section);
  const revenueOptions = getSectionRevenueOptions(section);
  const timezoneOptions = getSectionTimezoneOptions(section);
  const companySizeOptions = getSectionCompanySizeOptions(section);
  const locationOptions = getSectionLocationOptions(section);
  const technologyOptions = getSectionTechnologyOptions(section);

  // Get data using configuration instead of switch statement
  const { data: acquisitionData } = useRevenueOS();
  const data = mapAcquisitionDataToSection(section, acquisitionData);

  // Handle filter changes
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    onSearchChange(query);
  };

  const handleVerticalChange = (vertical: string) => {
    setVerticalFilter(vertical);
    onVerticalChange(vertical);
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    onStatusChange(status);
  };

  const handlePriorityChange = (priority: string) => {
    setPriorityFilter(priority);
    onPriorityChange(priority);
  };

  const handleRevenueChange = (revenue: string) => {
    setRevenueFilter(revenue);
    onRevenueChange(revenue);
  };

  const handleLastContactedChange = (lastContacted: string) => {
    setLastContactedFilter(lastContacted);
    onLastContactedChange(lastContacted);
  };

  const handleTimezoneChange = (timezone: string) => {
    setTimezoneFilter(timezone);
    onTimezoneChange(timezone);
  };

  const handleCompanySizeChange = (size: string) => {
    setCompanySizeFilter(size);
    onCompanySizeChange?.(size);
  };

  const handleLocationChange = (location: string) => {
    setLocationFilter(location);
    onLocationChange?.(location);
  };

  const handleTechnologyChange = (technology: string) => {
    setTechnologyFilter(technology);
    onTechnologyChange?.(technology);
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
    onSortChange(field, direction);
  };

  const handleColumnVisibilityChange = (columns: string[]) => {
    onColumnVisibilityChange(columns);
  };

  // Render filter based on availability
  const renderFilter = (filterType: string) => {
    switch (filterType) {
      case 'search':
        return (
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        );

      case 'vertical':
        return (
          <select
            value={verticalFilter}
            onChange={(e) => handleVerticalChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Verticals</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
          </select>
        );

      case 'status':
        return (
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'priority':
        return priorityOptions ? (
          <select
            value={priorityFilter}
            onChange={(e) => handlePriorityChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {priorityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      case 'revenue':
        return revenueOptions ? (
          <select
            value={revenueFilter}
            onChange={(e) => handleRevenueChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {revenueOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      case 'lastContacted':
        return (
          <select
            value={lastContactedFilter}
            onChange={(e) => handleLastContactedChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        );

      case 'timezone':
        return timezoneOptions ? (
          <select
            value={timezoneFilter}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timezoneOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      case 'companySize':
        return companySizeOptions ? (
          <select
            value={companySizeFilter}
            onChange={(e) => handleCompanySizeChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {companySizeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      case 'location':
        return locationOptions ? (
          <select
            value={locationFilter}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {locationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      case 'technology':
        return technologyOptions ? (
          <select
            value={technologyFilter}
            onChange={(e) => handleTechnologyChange(e.target.value)}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {technologyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--background)] border-b border-[var(--border)] px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            {sectionConfig.label}
          </h2>
          <span className="text-sm text-[var(--muted)]">
            {totalCount} {sectionConfig.label.toLowerCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            className="px-3 py-2 text-[var(--muted)] border border-[var(--border)] rounded-lg hover:bg-[var(--panel-background)] transition-colors flex items-center gap-2"
          >
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            Columns
          </button>
          <button
            onClick={onAddRecord}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add {sectionConfig.label.slice(0, -1)}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {availableFilters.map((filterType) => (
          <div key={filterType}>
            {renderFilter(filterType)}
          </div>
        ))}
      </div>

      {/* Column selector */}
      {showColumnSelector && (
        <div className="mt-4 p-4 bg-[var(--panel-background)] rounded-lg">
          <h3 className="text-sm font-medium text-[var(--foreground)] mb-3">Visible Columns</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sectionConfig.defaultColumns.map((column) => (
              <label key={column} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      handleColumnVisibilityChange([...visibleColumns, column]);
                    } else {
                      handleColumnVisibilityChange(visibleColumns.filter(c => c !== column));
                    }
                  }}
                  className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 capitalize">
                  {column.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Export with the same name for compatibility
export const PipelineFilters = PipelineFiltersV2;
