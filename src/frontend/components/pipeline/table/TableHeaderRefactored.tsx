import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

/**
 * TableHeaderRefactored - Reusable table header component
 * 
 * A flexible table header component that supports sorting and configurable columns.
 */

export interface ColumnConfig {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'phone' | 'date' | 'currency' | 'number' | 'status' | 'badge' | 'link' | 'avatar';
  width?: string;
  sortable?: boolean;
  format?: (value: any) => string;
  render?: (value: any, record: any) => React.ReactNode;
}

export interface TableHeaderRefactoredProps {
  columns: ColumnConfig[];
  sortField?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (field: string, direction: 'asc' | 'desc' | null) => void;
  className?: string;
}

export function TableHeaderRefactored({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort,
  className = ''
}: TableHeaderRefactoredProps) {
  
  // Handle column sort - three-state cycle
  const handleSort = (column: ColumnConfig) => {
    if (!onSort || !column.sortable) return;
    
    if (sortField === column.key) {
      // Three-state cycle: asc → desc → unsorted (null)
      if (sortDirection === 'asc') {
        onSort(column.key, 'desc');
      } else if (sortDirection === 'desc') {
        onSort(column.key, null); // Third click: unsorted
      } else {
        onSort(column.key, 'asc'); // Should not happen, but fallback
      }
    } else {
      // New column, start with ascending
      onSort(column.key, 'asc');
    }
  };

  // Get header classes
  const getHeaderClasses = (column: ColumnConfig) => {
    const baseClasses = 'px-6 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider';
    const sortableClasses = column.sortable ? 'cursor-pointer hover:bg-[var(--hover)]' : '';
    const widthClasses = column.width ? `w-${column.width}` : '';
    
    return `${baseClasses} ${sortableClasses} ${widthClasses}`.trim();
  };

  // Render sort icon - supports three states
  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable) return null;
    
    if (sortField === column.key) {
      if (sortDirection === 'asc') {
        return <ChevronUpIcon className="h-4 w-4 text-[var(--muted)]" />;
      } else if (sortDirection === 'desc') {
        return <ChevronDownIcon className="h-4 w-4 text-[var(--muted)]" />;
      } else {
        // Unsorted state - show neutral icon
        return <ChevronUpIcon className="h-4 w-4 text-gray-300" />;
      }
    }
    
    // Show neutral sort icon on hover for unsorted columns
    return (
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronUpIcon className="h-4 w-4 text-gray-300" />
      </div>
    );
  };

  return (
    <thead className={`bg-[var(--panel-background)] ${className}`}>
      <tr>
        {columns.map((column) => (
          <th
            key={column.key}
            className={getHeaderClasses(column)}
            onClick={() => handleSort(column)}
            title={column.sortable ? `Sort by ${column.label}` : undefined}
          >
            <div className="flex items-center space-x-1">
              <span>{column.label}</span>
              {renderSortIcon(column)}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}
