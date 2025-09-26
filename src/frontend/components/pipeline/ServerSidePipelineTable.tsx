/**
 * 🚀 SERVER-SIDE PAGINATION TABLE COMPONENT
 * 
 * Implements proper server-side pagination where clicking page numbers
 * fetches new data from the server instead of client-side slicing
 */

import React, { useState } from 'react';
import { useUnifiedAuth } from '@/platform/auth-unified';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { useServerSidePagination } from '@/platform/hooks/useServerSidePagination';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { TableSkeleton } from './table/TableSkeleton';
import { TableDataSkeleton } from './table/TableDataSkeleton';
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

interface ServerSidePipelineTableProps {
  section: string;
  onRecordClick: (record: PipelineRecord) => void;
  onReorderRecords?: (fromIndex: number, toIndex: number) => void;
  onColumnSort?: (columnName: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  visibleColumns?: string[];
  pageSize?: number;
  workspaceId?: string;
  userId?: string;
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 100;

// -------- Helper Functions --------
function getColumnWidth(index: number): string {
  const widths = [
    '80px',   // Rank
    '200px',  // Company
    '180px',  // Person/Name
    '150px',  // Title
    '120px',  // Status
    '160px',  // Last Action
    '180px',  // Next Action
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

function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (visibleColumns && visibleColumns.length > 0) {
    return visibleColumns;
  }
  
  const defaultHeaders: { [key: string]: string[] } = {
    companies: ['RANK', 'COMPANY', 'LAST ACTION', 'NEXT ACTION'],
    leads: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STATUS', 'LAST ACTION', 'NEXT ACTION'],
    prospects: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STATUS', 'LAST ACTION', 'NEXT ACTION'],
    opportunities: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STAGE', 'AMOUNT', 'LAST ACTION', 'NEXT ACTION'],
    people: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'EMAIL', 'PHONE', 'LAST ACTION', 'NEXT ACTION'],
    clients: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STATUS', 'LAST ACTION', 'NEXT ACTION'],
    partners: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STATUS', 'LAST ACTION', 'NEXT ACTION'],
    sellers: ['RANK', 'NAME', 'COMPANY', 'TITLE', 'STATUS', 'LAST ACTION', 'NEXT ACTION']
  };
  
  return defaultHeaders[section || 'companies'] || defaultHeaders['companies'];
}

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  const lastActionTime = record['lastActionTime'];
  if (lastActionTime) {
    if (lastActionTime === 'Never') {
      return { text: lastActionTime, color: 'bg-gray-100 text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-green-100 text-green-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-blue-100 text-blue-800' };
    } else {
      return { text: lastActionTime, color: 'bg-gray-100 text-gray-800' };
    }
  }
  
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  const timing = getRealtimeActionTiming(lastActionDate);
  return { ...timing, color: 'bg-gray-100 text-gray-800' };
}

function getNextActionTiming(record: PipelineRecord) {
  const nextActionTiming = record['nextActionTiming'];
  if (nextActionTiming) {
    if (nextActionTiming === 'Overdue') {
      return { text: nextActionTiming, color: 'bg-red-100 text-red-800' };
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-orange-100 text-orange-800' };
    } else if (nextActionTiming === 'This Week') {
      return { text: nextActionTiming, color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { text: nextActionTiming, color: 'bg-gray-100 text-gray-800' };
    }
  }
  
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  const timing = getRealtimeActionTiming(nextActionDate);
  return { ...timing, color: 'bg-gray-100 text-gray-800' };
}

// -------- Main Component --------
export function ServerSidePipelineTable({
  section,
  onRecordClick,
  onReorderRecords,
  onColumnSort,
  sortField,
  sortDirection,
  visibleColumns,
  pageSize = DEFAULT_PAGE_SIZE,
  workspaceId,
  userId
}: ServerSidePipelineTableProps) {
  console.log('🚀 [SERVER-SIDE TABLE] Component rendered for section:', section, 'pageSize:', pageSize);
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const finalWorkspaceId = workspaceId || authUser?.activeWorkspaceId || '';
  const finalUserId = userId || authUser?.id || '';
  
  // Use server-side pagination hook
  const {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    setCurrentPage,
    refresh
  } = useServerSidePagination({
    section,
    pageSize,
    workspaceId: finalWorkspaceId,
    userId: finalUserId
  });
  
  console.log('🚀 [SERVER-SIDE TABLE] Pagination state:', {
    dataLength: data?.length,
    currentPage,
    totalPages,
    totalItems,
    loading,
    error
  });
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  // Dynamic height calculation
  const headerHeight = 40;
  const rowHeight = 64;
  const contentHeight = headerHeight + (data.length * rowHeight);
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 187.5 : 600;
  
  let tableHeight;
  if (data.length === 0) {
    tableHeight = 200;
  } else if (data.length <= 10) {
    tableHeight = contentHeight + 24;
  } else {
    tableHeight = maxViewportHeight + 7;
  }
  
  // Action handling
  const {
    handleEditRecord,
    handleAddAction,
    handleDeleteRecord,
    handleReorderRecords: handleReorder,
    handleColumnSort: handleSort
  } = usePipelineActions({
    section,
    workspaceId: finalWorkspaceId,
    onReorderRecords,
    onColumnSort
  });
  
  // Modal state
  const [editingRecord, setEditingRecord] = useState<PipelineRecord | null>(null);
  const [addingAction, setAddingAction] = useState<PipelineRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<PipelineRecord | null>(null);
  
  // Handle record click
  const handleRecordClick = (record: PipelineRecord) => {
    onRecordClick(record);
  };
  
  // Handle edit
  const handleEdit = (record: PipelineRecord) => {
    setEditingRecord(record);
  };
  
  // Handle add action
  const handleAddActionClick = (record: PipelineRecord) => {
    setAddingAction(record);
  };
  
  // Handle view details
  const handleViewDetails = (record: PipelineRecord) => {
    setViewingRecord(record);
  };
  
  // Close modals
  const closeEditModal = () => setEditingRecord(null);
  const closeAddActionModal = () => setAddingAction(null);
  const closeDetailModal = () => setViewingRecord(null);
  
  // Handle action submit
  const handleActionSubmit = async (actionData: ActionLogData) => {
    try {
      const response = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recordId: addingAction?.id,
          recordType: section,
          actionType: actionData.actionType,
          description: actionData.notes,
          date: actionData.actionDate,
          outcome: actionData.nextAction
        }),
      });
      
      if (response.ok) {
        setAddingAction(null);
        await refresh(); // Refresh data after action
      }
    } catch (error) {
      console.error('Failed to submit action:', error);
    }
  };
  
  // Handle edit submit
  const handleEditSubmit = async (updatedRecord: PipelineRecord) => {
    try {
      const response = await fetch(`/api/data/${section}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRecord),
      });
      
      if (response.ok) {
        setEditingRecord(null);
        await refresh(); // Refresh data after edit
      }
    } catch (error) {
      console.error('Failed to update record:', error);
    }
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="h-full flex flex-col bg-white">
        <TableSkeleton />
        <div className="flex-1 p-6">
          <TableDataSkeleton />
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading {section}</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (data.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No {section} found</h3>
          <p className="text-gray-600">Try adjusting your filters or search criteria.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-white">
      {/* Table Header */}
      <div className="flex-shrink-0">
        <TableHeader
          headers={headers}
          onColumnSort={handleSort}
          sortField={sortField}
          sortDirection={sortDirection}
          getColumnWidth={getColumnWidth}
        />
      </div>
      
      {/* Table Body */}
      <div className="flex-1 overflow-auto" style={{ height: `${tableHeight}px` }}>
        <div className="min-w-full">
          {data.map((record, index) => (
            <TableRow
              key={record.id}
              record={record}
              index={index}
              headers={headers}
              section={section}
              onRecordClick={handleRecordClick}
              onEdit={handleEdit}
              onAddAction={handleAddActionClick}
              onViewDetails={handleViewDetails}
              onDelete={handleDeleteRecord}
              getColumnWidth={getColumnWidth}
              getLastActionTiming={getLastActionTiming}
              getNextActionTiming={getNextActionTiming}
            />
          ))}
        </div>
      </div>
      
      {/* Pagination */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white px-6 py-3">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
      
      {/* Modals */}
      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          section={section}
          onClose={closeEditModal}
          onSubmit={handleEditSubmit}
        />
      )}
      
      {addingAction && (
        <AddActionModal
          record={addingAction}
          section={section}
          onClose={closeAddActionModal}
          onSubmit={handleActionSubmit}
        />
      )}
      
      {viewingRecord && (
        <RecordDetailModal
          record={viewingRecord}
          section={section}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
