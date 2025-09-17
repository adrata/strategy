/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { EditRecordModal } from './EditRecordModal';
import { AddActionModal, ActionLogData } from './AddActionModal';
import { RecordDetailModal } from './RecordDetailModal';

// -------- Types --------
interface PipelineRecord {
  id: string;
  name: string;
  status?: string;
  priority?: string;
  stage?: string;
  lastActionTime?: string;
  lastContactTime?: string;
  lastActionDescription?: string;
  nextAction?: string;
  [key: string]: any;
}

interface PipelineTableProps {
  section: string;
  data: PipelineRecord[];
  onRecordClick: (record: PipelineRecord) => void;
  onReorderRecords?: (fromIndex: number, toIndex: number) => void;
  onColumnSort?: (columnName: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  visibleColumns?: string[];
  pageSize?: number;
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 50;
const TABLE_HEIGHT = 600;

// -------- Helper Functions --------
function getColumnWidth(index: number): string {
  const widths = [
    '80px',   // Rank
    '200px',  // Company
    '180px',  // Person/Name
    '150px',  // Title
    '120px',  // Status
    '140px',  // Last Action
    '160px',  // Next Action
    '100px',  // Amount
    '120px',  // Stage
    '100px',  // Priority
    '120px',  // Industry
    '150px',  // Email
    '120px',  // Phone
    '80px',   // Actions
  ];
  
  return widths[index] || '120px';
}

function getTableHeaders(visibleColumns?: string[]): string[] {
  if (visibleColumns && visibleColumns.length > 0) {
    return visibleColumns;
  }
  
  // Default headers based on section
  const defaultHeaders = [
    'Rank',
    'Company',
    'Person',
    'Title',
    'Status',
    'Last Action',
    'Next Action',
    'Amount',
    'Stage',
    'Priority',
    'Industry',
    'Email',
    'Phone',
    'Actions',
  ];
  
  return defaultHeaders;
}

// -------- Main Component --------
export function PipelineTableRefactored({
  section,
  data,
  onRecordClick,
  onReorderRecords,
  onColumnSort,
  sortField,
  sortDirection,
  visibleColumns,
  pageSize = DEFAULT_PAGE_SIZE,
}: PipelineTableProps) {
  console.log('🔍 [PipelineTableRefactored] Component rendered for section:', section, 'visibleColumns:', visibleColumns);
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns);
  
  // Use custom hooks for data and actions
  const {
    paginatedData,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    setSortField,
    setSortDirection,
  } = usePipelineData({ data, pageSize });
  
  const {
    editModalOpen,
    addActionModalOpen,
    detailModalOpen,
    selectedRecord,
    isSubmitting,
    handleEdit,
    handleAddAction,
    handleMarkComplete,
    handleDelete,
    handleCall,
    handleEmail,
    handleEditSubmit,
    handleActionSubmit,
    closeEditModal,
    closeAddActionModal,
    closeDetailModal,
  } = usePipelineActions();
  
  // Handle column sort
  const handleColumnSort = (columnName: string) => {
    if (onColumnSort) {
      onColumnSort(columnName);
    } else {
      // Use internal sorting
      if (sortField === columnName) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortField(columnName);
        setSortDirection('asc');
      }
    }
  };
  
  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <div 
      key={`pipeline-table-${section}-${visibleColumns?.join('-')}`} 
      className="bg-white rounded-lg border border-gray-200 flex flex-col relative" 
      style={{ height: `${TABLE_HEIGHT}px` }}
    >
      {/* Table container */}
      <div className="flex-1 overflow-auto min-h-0 pipeline-table-scroll">
        <table className="min-w-full table-fixed border-collapse mb-0">
          <colgroup>
            {headers.map((_, index) => (
              <col key={index} style={{ width: getColumnWidth(index) }} />
            ))}
          </colgroup>
          
          {/* Table header */}
          <TableHeader
            headers={headers}
            sortField={sortField}
            sortDirection={sortDirection}
            onColumnSort={handleColumnSort}
            getColumnWidth={getColumnWidth}
          />
          
          {/* Table body */}
          <tbody>
            {paginatedData.map((record, index) => (
              <TableRow
                key={record.id}
                record={record}
                headers={headers}
                section={section}
                index={index}
                workspaceId={workspaceId}
                workspaceName={workspaceName}
                visibleColumns={visibleColumns}
                onRecordClick={onRecordClick}
                onEdit={handleEdit}
                onAddAction={handleAddAction}
                onMarkComplete={handleMarkComplete}
                onDelete={handleDelete}
                onCall={handleCall}
                onEmail={handleEmail}
                getColumnWidth={getColumnWidth}
              />
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
      
      {/* Modals */}
      {editModalOpen && selectedRecord && (
        <EditRecordModal
          record={selectedRecord}
          isOpen={editModalOpen}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
          isSubmitting={isSubmitting}
        />
      )}
      
      {addActionModalOpen && selectedRecord && (
        <AddActionModal
          record={selectedRecord}
          isOpen={addActionModalOpen}
          onClose={closeAddActionModal}
          onSubmit={handleActionSubmit}
          isSubmitting={isSubmitting}
        />
      )}
      
      {detailModalOpen && selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          isOpen={detailModalOpen}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
