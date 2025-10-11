import React from 'react';
import { TableHeaderRefactored, ColumnConfig } from './TableHeaderRefactored';
import { TableRowRefactored } from './TableRowRefactored';

/**
 * BaseTable - Reusable base table component
 * 
 * A flexible table component that can be configured with different columns,
 * data sources, and behaviors. This replaces the monolithic table components.
 */

export interface BaseTableProps {
  data: any[];
  columns: ColumnConfig[];
  onRowClick?: (record: any) => void;
  onCellClick?: (column: ColumnConfig, record: any) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  selectedRecord?: any;
  className?: string;
  emptyState?: React.ReactNode;
  loading?: boolean;
  loadingRows?: number;
}

export function BaseTable({
  data,
  columns,
  onRowClick,
  onCellClick,
  onSort,
  sortField,
  sortDirection,
  selectedRecord,
  className = '',
  emptyState,
  loading = false,
  loadingRows = 5
}: BaseTableProps) {

  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    return (
      <tbody>
        {Array.from({ length: loadingRows }).map((_, index) => (
          <tr key={index} className="border-b border-[var(--border)] animate-pulse">
            {columns.map((column) => (
              <td key={column.key} className="px-6 py-4">
                <div className="h-4 bg-[var(--loading-bg)] rounded w-3/4"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  // Render empty state
  const renderEmptyState = () => {
    if (emptyState) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length} className="px-6 py-12 text-center">
              {emptyState}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-6 py-12 text-center">
            <div className="text-[var(--muted)]">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">No data available</h3>
              <p className="text-[var(--muted)]">There are no records to display.</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  };

  // Render data rows
  const renderDataRows = () => {
    return (
      <tbody>
        {data.map((record, index) => (
          <TableRowRefactored
            key={record.id || index}
            record={record}
            columns={columns}
            onClick={onRowClick}
            onCellClick={onCellClick}
            isSelected={selectedRecord?.id === record.id}
          />
        ))}
      </tbody>
    );
  };

  return (
    <div className={`bg-[var(--background)] rounded-lg border border-[var(--border)] overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <TableHeaderRefactored
            columns={columns}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
          />
          
          {loading ? renderLoadingSkeleton() : 
           data.length === 0 ? renderEmptyState() : 
           renderDataRows()}
        </table>
      </div>
    </div>
  );
}
