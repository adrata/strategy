import React from 'react';
import { TableCell } from './TableCell';

/**
 * TableRowRefactored - Reusable table row component
 * 
 * A flexible table row component that can render different types of records
 * with configurable columns and cell types.
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

export interface TableRowRefactoredProps {
  record: any;
  columns: ColumnConfig[];
  onClick?: (record: any) => void;
  onCellClick?: (column: ColumnConfig, record: any) => void;
  className?: string;
  isSelected?: boolean;
  isHoverable?: boolean;
}

export function TableRowRefactored({ 
  record, 
  columns, 
  onClick, 
  onCellClick,
  className = '',
  isSelected = false,
  isHoverable = true
}: TableRowRefactoredProps) {
  
  // Handle row click
  const handleRowClick = () => {
    if (onClick) {
      onClick(record);
    }
  };

  // Handle cell click
  const handleCellClick = (column: ColumnConfig) => {
    if (onCellClick) {
      onCellClick(column, record);
    }
  };

  // Get row classes
  const getRowClasses = () => {
    const baseClasses = 'border-b border-border';
    const hoverClasses = isHoverable ? 'hover:bg-panel-background' : '';
    const selectedClasses = isSelected ? 'bg-blue-50' : '';
    const clickableClasses = onClick ? 'cursor-pointer' : '';
    
    return `${baseClasses} ${hoverClasses} ${selectedClasses} ${clickableClasses} ${className}`.trim();
  };

  return (
    <tr 
      className={getRowClasses()}
      onClick={handleRowClick}
    >
      {columns.map((column) => {
        const value = record[column.key];
        
        // Use custom render function if provided
        if (column.render) {
          return (
            <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
              {column.render(value, record)}
            </td>
          );
        }

        // Use TableCell component for standard rendering
        return (
          <TableCell
            key={column.key}
            value={value}
            type={column.type}
            format={column.format}
            onClick={() => handleCellClick(column)}
            className={column.width ? `w-${column.width}` : ''}
          />
        );
      })}
    </tr>
  );
}
