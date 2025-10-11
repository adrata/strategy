/**
 * Database GUI Types
 * 
 * TypeScript definitions for the Database GUI application
 */

export interface DatabaseTable {
  name: string;
  category: 'core' | 'auth' | 'activity' | 'products';
  rowCount: number;
  columns: TableColumn[];
  indexes: TableIndex[];
  relationships: TableRelationship[];
  lastModified?: Date;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignTable?: string;
  foreignColumn?: string;
  description?: string;
}

export interface TableIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'btree' | 'hash' | 'gin' | 'gist';
}

export interface TableRelationship {
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  targetTable: string;
  targetColumn: string;
  sourceColumn: string;
  onDelete?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
  onUpdate?: 'CASCADE' | 'SET_NULL' | 'RESTRICT';
}

export interface TableData {
  rows: Record<string, any>[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface QueryResult {
  data: Record<string, any>[];
  columns: string[];
  executionTime: number;
  rowCount: number;
  error?: string;
}

export interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  storageSize: string;
  lastBackup?: Date;
}

export interface DatabaseContextType {
  selectedTable: string | null;
  setSelectedTable: (table: string | null) => void;
  selectedRecord: Record<string, any> | null;
  setSelectedRecord: (record: Record<string, any> | null) => void;
  viewMode: 'browser' | 'detail' | 'query' | 'schema';
  setViewMode: (mode: 'browser' | 'detail' | 'query' | 'schema') => void;
  refreshData: () => void;
}

export interface TableFilter {
  category?: string;
  search?: string;
  hasData?: boolean;
}

export interface DataGridColumn {
  key: string;
  name: string;
  type: string;
  width?: number;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
}

export interface QueryHistory {
  id: string;
  query: string;
  executedAt: Date;
  executionTime: number;
  rowCount: number;
  error?: string;
}

export interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  query: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
}

export interface DatabasePermission {
  table: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canExecuteQuery: boolean;
}
