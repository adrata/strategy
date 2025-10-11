import React from 'react';
import { BaseTable, ColumnConfig } from './BaseTable';
import { getSectionConfig, getSectionDefaultColumns } from '../config/section-config';

/**
 * ConfigurableTable - Configuration-driven table component
 * 
 * A table component that automatically configures itself based on section configuration.
 * This eliminates the need for hardcoded table setups in each section.
 */

export interface ConfigurableTableProps {
  section: string;
  data: any[];
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
  customColumns?: ColumnConfig[];
}

export function ConfigurableTable({
  section,
  data,
  onRowClick,
  onCellClick,
  onSort,
  sortField,
  sortDirection,
  selectedRecord,
  className = '',
  emptyState,
  loading = false,
  loadingRows = 5,
  customColumns
}: ConfigurableTableProps) {

  // Get section configuration
  const sectionConfig = getSectionConfig(section);
  const defaultColumnKeys = getSectionDefaultColumns(section);

  // Generate column configuration from section config
  const generateColumnConfig = (columnKey: string): ColumnConfig => {
    // Determine column type based on key name
    const getColumnType = (key: string): ColumnConfig['type'] => {
      if (key.includes('email')) return 'email';
      if (key.includes('phone')) return 'phone';
      if (key.includes('date') || key.includes('Date')) return 'date';
      if (key.includes('amount') || key.includes('revenue') || key.includes('value')) return 'currency';
      if (key.includes('count') || key.includes('number')) return 'number';
      if (key.includes('status') || key.includes('stage')) return 'status';
      if (key.includes('avatar') || key.includes('image')) return 'avatar';
      if (key.includes('url') || key.includes('link')) return 'link';
      return 'text';
    };

    // Generate display label from key
    const getDisplayLabel = (key: string): string => {
      return key
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
        .trim();
    };

    return {
      key: columnKey,
      label: getDisplayLabel(columnKey),
      type: getColumnType(columnKey),
      sortable: true
    };
  };

  // Get columns configuration
  const getColumns = (): ColumnConfig[] => {
    if (customColumns) {
      return customColumns;
    }

    // Generate columns from section configuration
    return defaultColumnKeys.map(generateColumnConfig);
  };

  // Get default empty state
  const getDefaultEmptyState = () => {
    if (emptyState) {
      return emptyState;
    }

    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">
          {sectionConfig?.icon || '📄'}
        </div>
        <h3 className="text-lg font-medium text-[var(--foreground)] mb-2">
          No {sectionConfig?.displayName || section} found
        </h3>
        <p className="text-[var(--muted)]">
          {sectionConfig?.description || `There are no ${section} records to display.`}
        </p>
      </div>
    );
  };

  return (
    <BaseTable
      data={data}
      columns={getColumns()}
      onRowClick={onRowClick}
      onCellClick={onCellClick}
      onSort={onSort}
      sortField={sortField}
      sortDirection={sortDirection}
      selectedRecord={selectedRecord}
      className={className}
      emptyState={getDefaultEmptyState()}
      loading={loading}
      loadingRows={loadingRows}
    />
  );
}
