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
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

export function TableHeaderRefactored({ 
  columns, 
  sortField, 
  sortDirection, 
  onSort,
  className = ''
}: TableHeaderRefactoredProps) {
  
  // Handle column sort
  const handleSort = (column: ColumnConfig) => {
    if (!onSort || !column.sortable) return;
    
    let newDirection: 'asc' | 'desc' = 'asc';
    
    // If clicking the same column, toggle direction
    if (sortField === column.key) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    
    onSort(column.key, newDirection);
  };

  // Get header classes
  const getHeaderClasses = (column: ColumnConfig) => {
    const baseClasses = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider';
    const sortableClasses = column.sortable ? 'cursor-pointer hover:bg-gray-100' : '';
    const widthClasses = column.width ? `w-${column.width}` : '';
    
    return `${baseClasses} ${sortableClasses} ${widthClasses}`.trim();
  };

  // Render sort icon
  const renderSortIcon = (column: ColumnConfig) => {
    if (!column.sortable) return null;
    
    if (sortField === column.key) {
      return sortDirection === 'asc' ? (
        <ChevronUpIcon className="h-4 w-4 text-gray-400" />
      ) : (
        <ChevronDownIcon className="h-4 w-4 text-gray-400" />
      );
    }
    
    return <ChevronUpIcon className="h-4 w-4 text-gray-300" />;
  };

  return (
    <thead className={`bg-gray-50 ${className}`}>
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
