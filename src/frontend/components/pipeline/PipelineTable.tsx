/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { useTableEdit } from '@/platform/hooks/useTableEdit';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { getLeadsNextAction } from '@/platform/utils/actionUtils';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { TableSkeleton } from './table/TableSkeleton';
import { TableDataSkeleton } from './table/TableDataSkeleton';
import { EditRecordModal } from './EditRecordModal';
import { CompleteActionModal, ActionLogData } from '@/platform/ui/components/CompleteActionModal';
import { RecordDetailModal } from './RecordDetailModal';
import { ProfileAvatar, ProfileAvatarGroup } from '@/platform/ui/components/ProfileAvatar';

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
  isLoading?: boolean;
}

// -------- Constants --------
const DEFAULT_PAGE_SIZE = 100; // Show more data by default

// -------- Helper Functions --------
function getColumnWidth(index: number): string {
  const widths = [
    '80px',   // Rank
    '200px',  // Company
    '180px',  // Person/Name
    '150px',  // Title
    '120px',  // Status
    '160px',  // Last Action (increased from 140px)
    '180px',  // Next Action (increased from 160px)
    '100px',  // Amount
    '120px',  // Stage
    '100px',  // Priority
    '120px',  // Industry
    '150px',  // Email
    '120px',  // Phone
  ];
  
  return widths[index] || '120px';
}

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's lastActionTime field directly
  const lastActionTime = record['lastActionTime'];
  if (lastActionTime) {
    // All timing pills now use light gray color
    if (lastActionTime === 'Never') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: Calculate timing from date
  const lastActionDate = record['lastActionDate'] || record['lastContactDate'] || record['lastContact'];
  const timing = getRealtimeActionTiming(lastActionDate);
  return { ...timing, color: 'bg-[var(--hover)] text-gray-800' };
}

function getNextActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's nextActionTiming field directly
  const nextActionTiming = record['nextActionTiming'];
  if (nextActionTiming) {
    // All timing pills now use light gray color
    if (nextActionTiming === 'Now') {
      return { text: nextActionTiming, color: 'bg-blue-100 text-blue-800' }; // Highlight "Now" differently
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (nextActionTiming === 'Due soon') {
      return { text: nextActionTiming, color: 'bg-orange-100 text-orange-800' };
    } else if (nextActionTiming === 'Overdue') {
      return { text: nextActionTiming, color: 'bg-red-100 text-red-800' };
    } else {
      return { text: nextActionTiming, color: 'bg-[var(--hover)] text-gray-800' };
    }
  }
  
  // Fallback: For next actions, we need to calculate timing based on when the next action should happen
  const nextActionDate = record['nextActionDate'] || record['nextContactDate'];
  if (!nextActionDate) {
    return { text: 'No date set', color: 'bg-[var(--hover)] text-gray-800' };
  }
  
  const now = new Date();
  const actionDate = new Date(nextActionDate);
  const diffMs = actionDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
  } else if (diffDays === 0) {
    return { text: 'Today', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays === 1) {
    return { text: 'Tomorrow', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 7) {
    return { text: 'This week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 14) {
    return { text: 'Next week', color: 'bg-[var(--hover)] text-gray-800' };
  } else if (diffDays <= 30) {
    return { text: 'This month', color: 'bg-[var(--hover)] text-gray-800' };
  } else {
    return { text: 'Future', color: 'bg-[var(--hover)] text-gray-800' };
  }
}

function getTableHeaders(visibleColumns?: string[], section?: string): string[] {
  if (visibleColumns && visibleColumns.length > 0) {
    return visibleColumns;
  }
  
  // Section-specific headers
  if (section === 'speedrun') {
    return [
      'Rank',
      'Name',
      'Company',
      'Status',
      'Actions',
      'LAST ACTION',
      'NEXT ACTION'
    ];
  }
  
  // Default headers for other sections
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
  ];
  
  return defaultHeaders;
}

// -------- Main Component --------
export function PipelineTable({
  section,
  data,
  onRecordClick,
  onReorderRecords,
  onColumnSort,
  sortField,
  sortDirection,
  visibleColumns,
  pageSize = DEFAULT_PAGE_SIZE,
  isLoading = false,
}: PipelineTableProps) {
  console.log('🔍 [PipelineTable] Component rendered for section:', section, 'visibleColumns:', visibleColumns, 'data length:', data?.length, 'isLoading:', isLoading);
  console.log('🔍 [PipelineTable] Sample data:', data?.slice(0, 2));
  
  // Debug seller data specifically
  if (section === 'speedrun' && data?.length > 0) {
    console.log('🔍 [PipelineTable] Speedrun seller data check:', {
      firstRecord: data[0],
      hasMainSeller: 'mainSeller' in (data[0] || {}),
      hasCoSellers: 'coSellers' in (data[0] || {}),
      hasMainSellerData: 'mainSellerData' in (data[0] || {}),
      hasCoSellersData: 'coSellersData' in (data[0] || {}),
      mainSellerValue: data[0]?.mainSeller,
      coSellersValue: data[0]?.coSellers
    });
  }
  
  // Get workspace context
  const { user: authUser } = useUnifiedAuth();
  const workspaceId = authUser?.activeWorkspaceId || '';
  const workspaceName = authUser?.workspaces?.find(w => w['id'] === workspaceId)?.['name'] || '';
  
  // Table editing functionality
  const { updateRecord, deleteRecord } = useTableEdit({
    onSuccess: (message) => {
      console.log('✅ Table edit success:', message);
      // Optionally show a toast notification
    },
    onError: (message) => {
      console.error('❌ Table edit error:', message);
      // Optionally show an error toast
    },
  });

  // Handle record updates
  const handleUpdateRecord = async (recordId: string, field: string, value: string): Promise<boolean> => {
    return await updateRecord(section, recordId, field, value);
  };

  // Handle record deletion
  const handleDeleteRecord = async (record: PipelineRecord) => {
    const success = await deleteRecord(section, record.id);
    if (success) {
      // Refresh the data by calling the parent's refresh function if available
      // This would typically trigger a data refetch
      console.log('Record deleted successfully, refreshing data...');
    }
  };
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 180 : 500;
  
  // Dynamic height calculation - always use full viewport height for consistency  
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else {
    // ALL tables use viewport height for consistency (matches Speedrun)
    tableHeight = maxViewportHeight;
  }
  
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
  
  // Real-time timestamp refresh state
  const [timestampRefresh, setTimestampRefresh] = useState(0);
  
  // Auto-refresh timestamps every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestampRefresh(prev => prev + 1);
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);
  
  console.log('🔍 [PipelineTable] usePipelineData results:', {
    inputDataLength: data?.length,
    paginatedDataLength: paginatedData?.length,
    currentPage,
    totalPages,
    totalItems,
    samplePaginatedData: paginatedData?.slice(0, 2)
  });

  
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

  // Wrapper function to convert ActionLogData types
  const handleActionSubmitWrapper = (actionData: any) => {
    // Convert from CompleteActionModal format to usePipelineActions format
    const convertedActionData = {
      type: actionData.type, // Already correct format from CompleteActionModal
      description: actionData.action, // 'action' field contains the notes
      date: actionData.time === 'Now' ? new Date().toISOString() : 
            actionData.time === 'Past' ? new Date(Date.now() - 86400000).toISOString() : 
            new Date(Date.now() + 86400000).toISOString(),
      outcome: '', // CompleteActionModal doesn't have outcome field
      nextAction: '' // CompleteActionModal doesn't have nextAction field
    };
    return handleActionSubmit(convertedActionData);
  };

  // Keyboard shortcuts for Add Action
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Command+Enter to open Add Action modal
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        // Only if we're not in an input field
        const target = event.target as HTMLElement;
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
        
        if (!isInput && data.length > 0) {
          event.preventDefault();
          event.stopPropagation();
          // Open Add Action modal with the first record as context
          setSelectedRecord(data[0]);
          setAddActionModalOpen(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [data]);

  // Map section to recordType for RecordDetailModal
  const getRecordType = (section: string): 'lead' | 'prospect' | 'opportunity' | 'account' | 'contact' | 'customer' | 'partner' => {
    switch (section) {
      case 'leads': return 'lead';
      case 'prospects': return 'prospect';
      case 'opportunities': return 'opportunity';
      case 'companies': return 'account';
      case 'people': return 'contact';
      case 'clients': return 'customer';
      case 'partners': return 'partner';
      default: return 'lead';
    }
  };
  
  // Handle column sort - three-state cycle
  const handleColumnSort = (columnName: string) => {
    if (onColumnSort) {
      onColumnSort(columnName);
    } else {
      // Use internal sorting with three-state cycle
      if (sortField === columnName) {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else if (sortDirection === 'desc') {
          setSortField(null);
          setSortDirection(null);
        }
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
  
  // Show skeleton loading state - only for table data, keep header and filters visible
  if (isLoading) {
    return (
      <TableDataSkeleton 
        visibleColumns={visibleColumns}
        rowCount={pageSize}
      />
    );
  }
  
  return (
    <div 
      key={`pipeline-table-${section}-${visibleColumns?.join('-')}`} 
      className="bg-[var(--background)] border border-[var(--border)] flex flex-col relative rounded-md" 
      style={{ height: `${tableHeight}px` }}
    >
      {/* Table container */}
      <div className="flex-1 overflow-auto min-h-0 middle-panel-scroll">
        <table className="w-full table-auto border-collapse mb-0">
          
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
            {useMemo(() => paginatedData.map((record, index) => {
              console.log(`🔍 [PipelineTable] Rendering row ${index}:`, {
                recordId: record.id,
                recordName: record.name || record['fullName'],
                recordCompany: record['company'],
                headersLength: headers.length,
                visibleColumnsLength: visibleColumns?.length,
                sampleRecordData: {
                  name: record.name,
                  company: record['company'],
                  state: record['state'],
                  title: record['title'],
                  lastAction: record['lastAction'],
                  nextAction: record['nextAction'],
                  allKeys: Object.keys(record).slice(0, 10) // Show first 10 keys
                }
              });
              
              // Use TableRow component with editing support
              return (
                <TableRow
                  key={record.id}
                  record={record}
                  headers={headers}
                  section={section}
                  index={index}
                  workspaceId={workspaceId}
                  workspaceName={workspaceName}
                  visibleColumns={visibleColumns}
                  currentUserId={authUser?.id}
                  onRecordClick={onRecordClick}
                  onUpdateRecord={handleUpdateRecord}
                  onDeleteRecord={handleDeleteRecord}
                  getColumnWidth={getColumnWidth}
                />
              );
            }), [paginatedData, headers, visibleColumns, timestampRefresh])}
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
          onSave={handleEditSubmit}
          recordType={section}
          isLoading={isSubmitting}
        />
      )}
      
      {addActionModalOpen && selectedRecord && (
        <CompleteActionModal
          isOpen={addActionModalOpen}
          onClose={closeAddActionModal}
          onSubmit={handleActionSubmitWrapper}
          personName={selectedRecord.name || selectedRecord.fullName || (selectedRecord.firstName && selectedRecord.lastName ? `${selectedRecord.firstName} ${selectedRecord.lastName}` : '') || ''}
          companyName={selectedRecord.company?.name || selectedRecord.company || ''}
          section={section}
          isLoading={isSubmitting}
        />
      )}
      
      {detailModalOpen && selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          recordType={getRecordType(section)}
          isOpen={detailModalOpen}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
}
