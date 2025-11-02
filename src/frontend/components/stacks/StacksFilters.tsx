"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface StacksFiltersProps {
  section: string;
  totalCount: number;
  onSearchChange: (query: string) => void;
  onSortChange: (field: string) => void;
  onFilterChange: (filters: any) => void;
  onColumnVisibilityChange: (columns: string[]) => void;
  visibleColumns: string[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
}

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'updatedAt', label: 'Updated Date' },
  { value: 'title', label: 'Title' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'epic', label: 'Epic' },
  { value: 'status', label: 'Status' }
];

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'up-next', label: 'Up Next' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'shipped', label: 'Built' },
  { value: 'qa1', label: 'QA1' },
  { value: 'qa2', label: 'QA2' },
  { value: 'done', label: 'Done' }
];

const WORKSTREAM_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'Video', label: 'Video' },
  { value: 'Cold', label: 'Cold' },
  { value: 'Referral', label: 'Referral' },
  { value: 'Events', label: 'Events' },
  { value: 'Social', label: 'Social' }
];

const COLUMN_OPTIONS = [
  { value: 'all', label: 'All Columns' },
  { value: 'title', label: 'Title' },
  { value: 'priority', label: 'Priority' },
  { value: 'status', label: 'Status' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'epic', label: 'Epic' },
  { value: 'workstream', label: 'Workstream' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'timeInStatus', label: 'Time in Status' },
  { value: 'tags', label: 'Tags' }
];

export function StacksFilters({
  section,
  totalCount,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onColumnVisibilityChange,
  visibleColumns,
  sortField,
  sortDirection
}: StacksFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isColumnOpen, setIsColumnOpen] = useState(false);
  const [filters, setFilters] = useState({
    priority: 'all',
    status: 'all',
    workstream: 'all',
    assignee: 'all'
  });

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem(`stacks-filters-${section}`);
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters(parsed);
      } catch (e) {
        console.warn('Failed to parse saved filters:', e);
      }
    }
  }, [section]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem(`stacks-filters-${section}`, JSON.stringify(filters));
    onFilterChange(filters);
  }, [filters, section, onFilterChange]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleSortSelect = (value: string) => {
    onSortChange(value);
    setIsSortOpen(false);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleColumnToggle = (columnValue: string) => {
    let newVisibleColumns: string[];
    
    if (columnValue === 'all') {
      // Toggle all columns
      const allColumnValues = COLUMN_OPTIONS.filter(opt => opt.value !== 'all').map(opt => opt.value);
      if (visibleColumns.length === allColumnValues.length) {
        // If all are selected, deselect all but keep at least one
        newVisibleColumns = ['title'];
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
        const allColumnValues = COLUMN_OPTIONS.filter(opt => opt.value !== 'all').map(opt => opt.value);
        const currentColumns = [...visibleColumns];
        const columnIndex = allColumnValues.indexOf(columnValue);
        
        // Insert the new column at its original position
        const newColumns = [...currentColumns];
        newColumns.splice(columnIndex, 0, columnValue);
        
        // Remove duplicates and maintain order
        newVisibleColumns = [...new Set(newColumns)];
      }
    }
    
    onColumnVisibilityChange(newVisibleColumns);
  };

  const clearFilters = () => {
    setFilters({
      priority: 'all',
      status: 'all',
      workstream: 'all',
      assignee: 'all'
    });
    setSearchQuery('');
    onSearchChange('');
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== 'all') || searchQuery;

  return (
    <div className="flex items-center gap-4 w-full">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          placeholder="Search backlog..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Sort
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        
        {isSortOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="py-1">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSortSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${
                    sortField === option.value ? 'bg-hover text-foreground' : 'text-muted'
                  }`}
                >
                  {option.label}
                  {sortField === option.value && (
                    <span className="ml-2 text-xs">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filter Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-3 py-2 text-sm border border-border rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'bg-[var(--primary)] text-white' 
              : 'text-muted hover:text-foreground hover:bg-hover'
          }`}
        >
          <FunnelIcon className="h-4 w-4" />
          Filter
          {hasActiveFilters && (
            <span className="ml-1 text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
              {Object.values(filters).filter(v => v !== 'all').length + (searchQuery ? 1 : 0)}
            </span>
          )}
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        
        {isFilterOpen && (
          <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="p-4 space-y-4">
              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Priority
                </label>
                <select
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {PRIORITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Workstream Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Workstream
                </label>
                <select
                  value={filters.workstream}
                  onChange={(e) => handleFilterChange('workstream', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-[var(--primary)]"
                >
                  {WORKSTREAM_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Columns Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsColumnOpen(!isColumnOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-hover border border-border rounded-lg transition-colors"
        >
          <AdjustmentsHorizontalIcon className="h-4 w-4" />
          Columns
          <ChevronDownIcon className="h-4 w-4" />
        </button>
        
        {isColumnOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50">
            <div className="py-1">
              {COLUMN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleColumnToggle(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-hover ${
                    option.value === 'all' 
                      ? visibleColumns.length === COLUMN_OPTIONS.length - 1 
                        ? 'bg-hover text-foreground' 
                        : 'text-muted'
                      : visibleColumns.includes(option.value)
                        ? 'bg-hover text-foreground'
                        : 'text-muted'
                  }`}
                >
                  {option.label}
                  {option.value !== 'all' && visibleColumns.includes(option.value) && (
                    <span className="ml-2 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
