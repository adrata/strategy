/**
 * Refactored pipeline table component.
 * Clean, modular table that handles all pipeline sections with proper TypeScript safety.
 */

import React, { useState, useEffect } from 'react';
import { useUnifiedAuth } from '@/platform/auth';
import { getSectionColumns, isColumnHidden } from '@/platform/config/workspace-table-config';
import { usePipelineData } from '@/platform/hooks/usePipelineData';
import { usePipelineActions } from '@/platform/hooks/usePipelineActions';
import { getRealtimeActionTiming } from '@/platform/utils/statusUtils';
import { TableHeader } from './table/TableHeader';
import { TableRow } from './table/TableRow';
import { Pagination } from './table/Pagination';
import { TableSkeleton } from './table/TableSkeleton';
import { TableDataSkeleton } from './table/TableDataSkeleton';
import { EditRecordModal } from './EditRecordModal';
import { AddActionModal, ActionLogData } from '@/platform/ui/components/AddActionModal';
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
    '80px',   // Actions
  ];
  
  return widths[index] || '120px';
}

// -------- Timing Functions --------
function getLastActionTiming(record: PipelineRecord) {
  // 🚀 SPEEDRUN LOGIC: Use the API's lastActionTime field directly
  const lastActionTime = record['lastActionTime'];
  if (lastActionTime) {
    // Color coding for Speedrun timing
    if (lastActionTime === 'Never') {
      return { text: lastActionTime, color: 'bg-[var(--hover)] text-gray-800' };
    } else if (lastActionTime === 'Today') {
      return { text: lastActionTime, color: 'bg-green-100 text-green-800' };
    } else if (lastActionTime === 'Yesterday') {
      return { text: lastActionTime, color: 'bg-blue-100 text-blue-800' };
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
    // Color coding for Speedrun timing
    if (nextActionTiming === 'Now') {
      return { text: nextActionTiming, color: 'bg-red-100 text-red-800' };
    } else if (nextActionTiming === 'Today') {
      return { text: nextActionTiming, color: 'bg-blue-100 text-blue-800' };
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
    return { text: 'Overdue', color: 'bg-[var(--hover)] text-gray-800' };
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
      'Company',
      'Name',
      'Status',
      'MAIN-SELLER',
      'CO-SELLERS',
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
  
  // Get table headers
  const headers = getTableHeaders(visibleColumns, section);
  
  // Dynamic height calculation - keep table height reasonable
  const headerHeight = 40; // Height of table header
  const rowHeight = 66; // Approximate height per row
  const contentHeight = headerHeight + (data.length * rowHeight);
  // Account for tabs/filters section - increase space reservation for sections with tabs
  const hasTabs = ['leads', 'prospects', 'opportunities'].includes(section);
  const tabsHeight = hasTabs ? 60 : 0; // Extra height for tabs section
  const maxViewportHeight = typeof window !== 'undefined' ? window.innerHeight - 220 - tabsHeight : 500; // Account for tabs
  
  // Dynamic height calculation - keep table height reasonable
  let tableHeight;
  if (data.length === 0) {
    // Empty state - use moderate height
    tableHeight = 200;
  } else if (data.length <= 10) {
    // Small to medium datasets - use content height with minimal extension
    tableHeight = contentHeight + 20; // Minimal extension
  } else {
    // Larger datasets - use viewport height without extension
    tableHeight = maxViewportHeight; // No extension to keep reasonable height
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
    // Convert from AddActionModal format to usePipelineActions format
    const convertedActionData = {
      type: actionData.actionType || actionData.type,
      description: actionData.notes || actionData.description,
      date: actionData.actionDate || actionData.date,
      outcome: actionData.nextAction || actionData.outcome
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
      className="bg-[var(--background)] rounded-lg border border-[var(--border)] flex flex-col relative" 
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
            {paginatedData.map((record, index) => {
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
              
              // Simple table row for debugging
              return (
                  <tr
                    key={record.id}
                    className="cursor-pointer transition-colors hover:bg-[var(--panel-background)] h-table-row border-b border-[var(--border)]"
                    onClick={() => onRecordClick(record)}
                  >
                  {headers.map((header, headerIndex) => {
                    let cellContent = '';
                    
                    // Simple cell content mapping
                    switch (header.toLowerCase()) {
                      case 'rank':
                        // 🏆 HIERARCHICAL RANKING: Display company rank and person rank
                        const companyRank = record['companyRank'] || record['company']?.rank || 0;
                        const personRank = record['personRank'] || record['rank'] || 0;
                        const globalRank = record['globalPersonRank'] || record['rank'] || (currentPage - 1) * pageSize + index + 1;
                        
                        // Display hierarchical ranking based on section
                        let displayRank;
                        if (section === 'people' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format
                          displayRank = `${companyRank}:${personRank}`;
                        } else if (section === 'speedrun' && companyRank > 0) {
                          // Show "Company Rank: Person Rank" format for speedrun
                          displayRank = `${companyRank}:${personRank}`;
                        } else {
                          // Fallback to global rank
                          displayRank = globalRank;
                        }
                        
                        cellContent = String(displayRank);
                        break;
                      case 'company':
                        // Handle both string and object company data
                        const company = record['company'];
                        let companyName = '';
                        
                        if (typeof company === 'object' && company !== null) {
                          companyName = company.name || company.companyName || '';
                        } else {
                          companyName = company || record['companyName'] || '';
                        }
                        
                        // Show dash for "Unknown Company" or empty values
                        cellContent = (companyName && companyName !== 'Unknown Company' && companyName.trim() !== '') ? companyName : '-';
                        break;
                      case 'person':
                      case 'name':
                        cellContent = record['fullName'] || `${record['firstName'] || ''} ${record['lastName'] || ''}`.trim() || record.name || 'Person';
                        break;
                      case 'state':
                        cellContent = record['state'] || record['status'] || record['location'] || 'State';
                        break;
                      case 'title':
                        const title = record['title'] || 
                                     record['jobTitle'] || 
                                     record['position'] || 
                                     record?.customFields?.enrichedData?.overview?.title ||
                                     record?.customFields?.rawData?.active_experience_title;
                        
                        // Show dash for "Unknown Title" or empty values
                        cellContent = (title && title !== 'Unknown Title' && title.trim() !== '') ? title : '-';
                        break;
                      case 'status':
                        cellContent = record['status'] || '-';
                        break;
                      case 'last action':
                        cellContent = record['lastActionDescription'] || record['lastAction'] || record['lastContactType'] || 'No action';
                        break;
                      case 'next action':
                        cellContent = record['nextAction'] || record['nextActionDescription'] || 'No action planned';
                        break;
                      case 'owner':
                      case 'main-seller':
                      case 'mainseller':
                        cellContent = record['mainSeller'] || record['owner'] || '-';
                        break;
                      case 'co-sellers':
                      case 'cosellers':
                        cellContent = record['coSellers'] && record['coSellers'] !== '-' ? record['coSellers'] : '-';
                        break;
                      default:
                        const value = record[header.toLowerCase()] || record[header];
                        cellContent = value ? String(value) : '';
                    }
                    
                    return (
                      <td
                        key={`${record.id}-${header}`}
                        className="px-6 py-3 whitespace-nowrap text-sm text-[var(--foreground)]"
                        style={{ width: getColumnWidth(headerIndex) }}
                      >
                        {header.toLowerCase() === 'last action' || header.toLowerCase() === 'next action' ? (
                          <div className="flex items-center gap-2">
                            {(() => {
                              const timing = header.toLowerCase() === 'last action' 
                                ? getLastActionTiming(record)
                                : getNextActionTiming(record);
                              return (
                                <>
                                  <span className={`px-4 py-1 rounded-full text-xs font-medium whitespace-nowrap ${timing.color}`}>
                                    {timing.text}
                                  </span>
                                  <span className="text-sm text-[var(--muted)] font-normal truncate max-w-32">
                                    {cellContent}
                                  </span>
                                </>
                              );
                            })()}
                          </div>
                        ) : header.toLowerCase() === 'owner' || header.toLowerCase() === 'main-seller' || header.toLowerCase() === 'mainseller' ? (
                          <div className="flex items-center gap-2">
                            {record['mainSellerData'] || record['ownerData'] ? (
                              <ProfileAvatar
                                name={record['mainSellerData']?.name || record['ownerData']?.name}
                                firstName={record['mainSellerData']?.firstName || record['ownerData']?.firstName}
                                lastName={record['mainSellerData']?.lastName || record['ownerData']?.lastName}
                                email={record['mainSellerData']?.email || record['ownerData']?.email}
                                profilePictureUrl={record['mainSellerData']?.profilePictureUrl || record['ownerData']?.profilePictureUrl || undefined}
                                size="sm"
                                showAsMe={true}
                                currentUserId={record['currentUserId']}
                                userId={record['mainSellerData']?.id || record['ownerData']?.id}
                              />
                            ) : null}
                            <span className="text-sm text-[var(--foreground)] truncate max-w-24">
                              {cellContent}
                            </span>
                          </div>
                        ) : header.toLowerCase() === 'co-sellers' || header.toLowerCase() === 'cosellers' ? (
                          <div className="flex items-center gap-2">
                            {record['coSellersData'] && record['coSellersData'].length > 0 ? (
                              <ProfileAvatarGroup
                                users={record['coSellersData'].map((coSeller: any) => ({
                                  name: coSeller.user?.name,
                                  firstName: coSeller.user?.firstName,
                                  lastName: coSeller.user?.lastName,
                                  email: coSeller.user?.email,
                                  profilePictureUrl: coSeller.user?.profilePictureUrl || undefined,
                                  userId: coSeller.user?.id,
                                }))}
                                maxVisible={2}
                                size="sm"
                                showAsMe={true}
                                currentUserId={record['currentUserId']}
                              />
                            ) : null}
                            <span className="text-sm text-[var(--foreground)] truncate max-w-24">
                              {cellContent}
                            </span>
                          </div>
                        ) : (
                          <div className="text-sm text-[var(--foreground)] truncate">
                            {cellContent}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
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
        <AddActionModal
          isOpen={addActionModalOpen}
          onClose={closeAddActionModal}
          onSubmit={handleActionSubmitWrapper}
          contextRecord={selectedRecord}
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
